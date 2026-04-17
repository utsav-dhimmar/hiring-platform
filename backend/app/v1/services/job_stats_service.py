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

from sqlalchemy import func, select, or_, and_
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
        Count pass / fail / pending for native candidates (via Resume.pass_fail)
        plus cross-matched candidates (via CrossJobMatch.match_score vs job threshold).
        """
        from app.v1.db.models.jobs import Job

        # ── Native candidates: group resumes by pass_fail ──────────────────
        native_rows = await db.execute(
            select(Resume.pass_fail, func.count(Resume.id).label("cnt"))
            .join(Candidate, Resume.candidate_id == Candidate.id)
            .where(Candidate.applied_job_id == job_id)
            .group_by(Resume.pass_fail)
        )
        native_counts: dict[str | None, int] = {
            row.pass_fail: row.cnt for row in native_rows.all()
        }

        # ── Cross-matched candidates: compare score vs job threshold ───────
        job = await db.get(Job, job_id)
        threshold = float(job.passing_threshold) if job and job.passing_threshold else 65.0

        cross_passed = (
            await db.scalar(
                select(func.count(CrossJobMatch.id)).where(
                    CrossJobMatch.matched_job_id == job_id,
                    CrossJobMatch.match_score >= threshold,
                )
            )
            or 0
        )
        cross_failed = (
            await db.scalar(
                select(func.count(CrossJobMatch.id)).where(
                    CrossJobMatch.matched_job_id == job_id,
                    CrossJobMatch.match_score < threshold,
                    CrossJobMatch.match_score.is_not(None),
                )
            )
            or 0
        )

        return JobResultStats(
            passed=(native_counts.get("passed") or 0) + cross_passed,
            failed=(native_counts.get("failed") or 0) + cross_failed,
            pending=(native_counts.get("pending") or 0),
        )

    async def _get_location_stats(
        self, db: AsyncSession, job_id: uuid.UUID
    ) -> dict[str, int]:
        """
        Count native candidates per location for this job.
        Candidates without a location are grouped under 'Unknown'.
        """
        rows = await db.execute(
            select(Location.name, func.count(Candidate.id).label("cnt"))
            .join(Location, Candidate.location_id == Location.id)
            .where(Candidate.applied_job_id == job_id)
            .group_by(Location.name)
            .order_by(func.count(Candidate.id).desc())
        )
        location_counts: dict[str, int] = {row.name: row.cnt for row in rows.all()}

        # Count candidates whose location_id is NULL
        unknown_count = (
            await db.scalar(
                select(func.count(Candidate.id)).where(
                    Candidate.applied_job_id == job_id,
                    Candidate.location_id.is_(None),
                )
            )
            or 0
        )
        if unknown_count:
            location_counts["Unknown"] = unknown_count

        return location_counts

    async def _get_stage_stats(
        self, db: AsyncSession, job_id: uuid.UUID
    ) -> dict[str, int]:
        """
        Count how many candidates are currently placed in each named stage
        for this job (only native candidates have CandidateStage records).

        Grouping is by stage template name so human-readable stage names are returned.
        Uses an outer join so stages with 0 candidates are included.
        """
        rows = await db.execute(
            select(StageTemplate.name, func.count(CandidateStage.id).label("cnt"))
            .select_from(JobStageConfig)
            .join(StageTemplate, JobStageConfig.template_id == StageTemplate.id)
            .outerjoin(CandidateStage, JobStageConfig.id == CandidateStage.job_stage_id)
            .where(JobStageConfig.job_id == job_id)
            .group_by(StageTemplate.name, JobStageConfig.stage_order)
            .order_by(JobStageConfig.stage_order)
        )
        return {row.name: row.cnt for row in rows.all()}

    async def _get_hr_decision_stats(
        self, db: AsyncSession, job_id: uuid.UUID
    ) -> JobHRDecisionStats:
        """
        Compute HR decision breakdown for this job.

        Logic mirrors `HRDecisionService.get_job_decision_summary` but returns
        a simpler dict-based schema tailored to the stats endpoint.
        """

        # Total candidates for this job (native + cross-matched)
        total_native = (
            await db.scalar(
                select(func.count(Candidate.id)).where(
                    Candidate.applied_job_id == job_id
                )
            )
            or 0
        )
        total_cross = (
            await db.scalar(
                select(func.count(CrossJobMatch.id)).where(
                    CrossJobMatch.matched_job_id == job_id
                )
            )
            or 0
        )
        total_candidates = total_native + total_cross

        # Latest decision per candidate scoped to this job
        subq = (
            select(
                HrDecision.candidate_id,
                HrDecision.decision,
                func.row_number()
                .over(
                    partition_by=HrDecision.candidate_id,
                    order_by=HrDecision.decided_at.desc(),
                )
                .label("rn"),
            ).where(
                or_(
                    HrDecision.job_id == job_id,
                    and_(
                        HrDecision.job_id.is_(None),
                        HrDecision.candidate_id.in_(
                            select(Candidate.id).where(
                                Candidate.applied_job_id == job_id
                            )
                        ),
                    ),
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
