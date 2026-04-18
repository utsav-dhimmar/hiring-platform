"""
Job Stats Service

Provides a single method `get_job_stats(db, job_id)` that aggregates:

  1. result   — AI screening pass/fail counts for native + cross-match candidates
  2. location — how many candidates per city (native candidates only, by location_rel)
  3. stages   — how many candidates are on each named hiring stage
  4. hr_decisions — approve / reject / Maybe / undecided counts for the job

This service is COMPLETELY ISOLATED. It does NOT import or modify any
existing service or route. It queries the DB directly using SQLAlchemy core.
"""

from __future__ import annotations

import uuid

from sqlalchemy import func, select, or_, and_, case, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.asyncio import AsyncSession

from app.v1.db.models.candidates import Candidate
from app.v1.db.models.resumes import Resume
from app.v1.db.models.cross_job_matches import CrossJobMatch
from app.v1.db.models.candidate_stages import CandidateStage
from app.v1.db.models.job_stage_configs import JobStageConfig
from app.v1.db.models.stage_templates import StageTemplate
from app.v1.db.models.hr_decisions import HrDecision
from app.v1.db.models.locations import Location
from app.v1.schemas.job_stats import (
    JobResultStats,
    JobHRDecisionStats,
    JobStatsResponse,
)


class JobStatsService:
    """Aggregates various statistics for a specific job."""

    async def get_job_stats(
        self,
        db: AsyncSession,
        job_id: uuid.UUID,
    ) -> JobStatsResponse:
        """
        Returns a comprehensive stats snapshot for a job.

        Args:
            db:     Async SQLAlchemy session.
            job_id: UUID of the job to inspect.

        Returns:
            JobStatsResponse with result, location, stages, and hr_decisions.
        """

        result = await self._get_result_stats(db, job_id)
        location = await self._get_location_stats(db, job_id)
        stages = await self._get_stage_stats(db, job_id)
        hr_decisions = await self._get_hr_decision_stats(db, job_id)

        return JobStatsResponse(
            result=result,
            location=location,
            stages=stages,
            hr_decisions=hr_decisions,
        )

    # -------------------------------------------------------------------------
    # Private helpers
    # -------------------------------------------------------------------------

    async def _get_result_stats(
        self, db: AsyncSession, job_id: uuid.UUID
    ) -> JobResultStats:
        """
        Count pass / fail / pending for unique candidates in this job.
        Prioritizes native Resume status over cross-match scores.
        """
        from app.v1.db.models.jobs import Job
        job = await db.get(Job, job_id)
        threshold = (
            float(job.passing_threshold) if job and job.passing_threshold else 65.0
        )

        # Subquery to get unique candidate identifiers (email) and their strongest source of screening info
        # Prioritize native (resumes) over cross matches
        stmt = (
            select(
                func.coalesce(Candidate.email, func.cast(Candidate.id, Text)).label("unique_id"),
                func.coalesce(Resume.pass_fail, 
                    case((CrossJobMatch.match_score >= threshold, "passed"),
                         (CrossJobMatch.match_score < threshold, "failed"),
                         else_="pending")
                ).label("final_pass_fail")
            )
            .distinct(func.coalesce(Candidate.email, func.cast(Candidate.id, Text)))
            .outerjoin(Resume, Resume.candidate_id == Candidate.id)
            .outerjoin(CrossJobMatch, CrossJobMatch.candidate_id == Candidate.id)
            .where(
                or_(
                    Candidate.applied_job_id == job_id,
                    CrossJobMatch.matched_job_id == job_id
                )
            )
            # Order by is_native to ensure DISTINCT picks native record if available
            .order_by(
                func.coalesce(Candidate.email, func.cast(Candidate.id, Text)),
                case((Candidate.applied_job_id == job_id, 0), else_=1)
            )
        )

        rows = await db.execute(stmt)
        counts: dict[str, int] = {"passed": 0, "failed": 0, "pending": 0}
        for _, pf in rows.all():
            if pf in counts:
                counts[pf] += 1
            else:
                counts["pending"] += 1

        return JobResultStats(
            passed=counts["passed"],
            failed=counts["failed"],
            pending=counts["pending"],
        )

    async def _get_location_stats(
        self, db: AsyncSession, job_id: uuid.UUID
    ) -> dict[str, int]:
        """
        Count unique candidates per location for this job.
        Includes cross-matches. Deduplicates by email.
        """
        stmt = (
            select(Location.name, func.count(func.distinct(func.coalesce(Candidate.email, func.cast(Candidate.id, Text)))))
            .join(Candidate, Location.id == Candidate.location_id)
            .where(
                or_(
                    Candidate.applied_job_id == job_id,
                    Candidate.id.in_(
                        select(CrossJobMatch.candidate_id).where(CrossJobMatch.matched_job_id == job_id)
                    )
                )
            )
            .group_by(Location.name)
        )
        rows = await db.execute(stmt)
        location_counts: dict[str, int] = {row[0]: row[1] for row in rows.all()}

        # Removed "Unknown" (NULL) location count per user request.
        # Only candidates with an identified location appear in these stats.
        return location_counts

    async def _get_stage_stats(
        self, db: AsyncSession, job_id: uuid.UUID
    ) -> dict[str, int]:
        """
        Count how many unique candidates are in each stage for this job.
        Deduplicates by email.
        """
        # 1. Subquery to find the "current" stage record ID for each candidate in this job.
        # Logic:
        #   - We prefer the highest order non-pending stage.
        #   - If all are pending, we prefer the lowest order pending stage (the first stage).
        
        # Deduplication subquery: Map each unique person (email) to their latest application record in this job context
        unique_candidates_subq = (
            select(
                func.coalesce(Candidate.email, func.cast(Candidate.id, Text)).label("unique_id"),
                Candidate.id.label("representative_candidate_id")
            )
            .distinct(func.coalesce(Candidate.email, func.cast(Candidate.id, Text)))
            .outerjoin(CrossJobMatch, CrossJobMatch.candidate_id == Candidate.id)
            .where(
                or_(
                    Candidate.applied_job_id == job_id,
                    CrossJobMatch.matched_job_id == job_id
                )
            )
            .order_by(
                func.coalesce(Candidate.email, func.cast(Candidate.id, Text)),
                case((Candidate.applied_job_id == job_id, 0), else_=1), # Prefer native record
                Candidate.created_at.desc()
            )
            .subquery()
        )

        # 2. Subquery to find the "best order" for these representative candidate records
        best_order_subq = (
            select(
                CandidateStage.candidate_id,
                func.coalesce(
                    func.max(
                        case(
                            (
                                CandidateStage.status != "pending",
                                JobStageConfig.stage_order,
                            ),
                            else_=None,
                        )
                    ),
                    func.min(JobStageConfig.stage_order),
                ).label("best_order"),
            )
            .join(JobStageConfig, CandidateStage.job_stage_id == JobStageConfig.id)
            .where(JobStageConfig.job_id == job_id)
            .where(CandidateStage.candidate_id.in_(select(unique_candidates_subq.c.representative_candidate_id)))
            .group_by(CandidateStage.candidate_id)
            .subquery()
        )

        # 2. Fetch the stage records
        stmt = (
            select(StageTemplate.name, CandidateStage.status)
            .distinct(CandidateStage.candidate_id)
            .join(JobStageConfig, CandidateStage.job_stage_id == JobStageConfig.id)
            .join(StageTemplate, JobStageConfig.template_id == StageTemplate.id)
            .join(
                best_order_subq,
                and_(
                    best_order_subq.c.candidate_id == CandidateStage.candidate_id,
                    best_order_subq.c.best_order == JobStageConfig.stage_order,
                ),
            )
            .where(JobStageConfig.job_id == job_id)
            .order_by(CandidateStage.candidate_id, CandidateStage.started_at.desc())
        )

        rows = await db.execute(stmt)

        # 3. Build the flat result dictionary
        # Initialize all stages with 0 for both active and completed
        all_stages_res = await db.execute(
            select(StageTemplate.name)
            .join(JobStageConfig, JobStageConfig.template_id == StageTemplate.id)
            .where(JobStageConfig.job_id == job_id)
            .order_by(JobStageConfig.stage_order)
        )

        final_stats: dict[str, int] = {}
        for name in all_stages_res.scalars().all():
            final_stats[name] = 0
            final_stats[f"{name}_completed"] = 0

        # 4. Fill with actual counts
        for name, status in rows.all():
            is_active = status in ("pending", "active")
            key = name if is_active else f"{name}_completed"
            if key in final_stats:
                final_stats[key] += 1
            else:
                final_stats[key] = 1  # Fallback for unexpected stages
        return final_stats

    async def _get_hr_decision_stats(
        self, db: AsyncSession, job_id: uuid.UUID
    ) -> JobHRDecisionStats:
        """
        Compute unique HR decision breakdown for this job.
        Deduplicates by email.
        """
        # Deduplication by email
        total_unique_stmt = select(
            func.count(func.distinct(func.coalesce(Candidate.email, func.cast(Candidate.id, Text))))
        ).where(
            or_(
                Candidate.applied_job_id == job_id,
                Candidate.id.in_(
                    select(CrossJobMatch.candidate_id).where(CrossJobMatch.matched_job_id == job_id)
                )
            )
        )
        total_candidates = await db.scalar(total_unique_stmt) or 0

        # Latest decision per unique per-person (email)
        subq = (
            select(
                func.coalesce(Candidate.email, func.cast(Candidate.id, Text)).label("unique_id"),
                HrDecision.decision,
                func.row_number()
                .over(
                    partition_by=func.coalesce(Candidate.email, func.cast(Candidate.id, Text)),
                    order_by=HrDecision.decided_at.desc(),
                )
                .label("rn"),
            )
            .join(HrDecision, HrDecision.candidate_id == Candidate.id)
            .where(
                or_(
                    HrDecision.job_id == job_id,
                    and_(
                        HrDecision.job_id.is_(None),
                        Candidate.applied_job_id == job_id
                    )
                )
            )
        ).subquery()

        decision_rows = await db.execute(
            select(subq.c.decision, func.count().label("cnt"))
            .where(subq.c.rn == 1)
            .group_by(subq.c.decision)
        )
        counts: dict[str, int] = {row.decision: row.cnt for row in decision_rows.all()}
        decided_total = sum(counts.values())

        return JobHRDecisionStats(
            total_candidates=total_candidates,
            approved=counts.get("approve", 0),
            rejected=counts.get("reject", 0),
            maybe=counts.get("May Be", 0),
            pending=max(total_candidates - decided_total, 0),
        )


# Singleton instance
job_stats_service = JobStatsService()
