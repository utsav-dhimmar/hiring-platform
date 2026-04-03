"""
HR Decision Service - Handles business logic for HR decisions.
"""

import uuid
from typing import Any

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.v1.db.models.hr_decisions import HrDecision
from app.v1.db.models.candidates import Candidate
from app.v1.db.models.resumes import Resume
from app.v1.schemas.hr_decision import (
    HRDecisionCreate,
    HRDecisionResponse,
    HRDecisionHistoryResponse,
    HRDecisionUpdate,
)
from app.v1.core.logging import get_logger

logger = get_logger(__name__)


def _trigger_cross_match_for_candidate(candidate: Candidate) -> None:
    """Fire-and-forget Celery cross-match task for a rejected candidate.
    
    Picks the candidate's job_id as the original job, and the latest
    resume_id from the candidate's resumes relationship.
    """
    try:
        from app.v1.services.resume_upload.background import BackgroundProcessor
        from app.v1.services.resume_upload.processor import ResumeProcessor
        
        resumes = getattr(candidate, "resumes", None) or []
        if not resumes:
            logger.info(
                "cross_match skipped: no resumes found for candidate_id=%s", candidate.id
            )
            return
            
        # Pick the most recently uploaded resume
        latest_resume = max(resumes, key=lambda r: r.uploaded_at)
        
        # Use BackgroundProcessor for standard task scheduling
        bg_processor = BackgroundProcessor(ResumeProcessor())
        bg_processor.schedule_cross_match(
            resume_id=latest_resume.id,
            original_job_id=candidate.applied_job_id
        )
        
        logger.info(
            "Automatic cross-match triggered for candidate_id=%s, resume_id=%s, job_id=%s",
            candidate.id, latest_resume.id, candidate.applied_job_id
        )
    except Exception:
        logger.exception("Failed to queue automatic cross-match task for candidate_id=%s", candidate.id)


class HRDecisionService:
    """Service for managing HR decisions with business logic validation."""

    async def create_decision(
        self,
        db: AsyncSession,
        candidate_id: uuid.UUID,
        decision_data: HRDecisionCreate,
        user_id: uuid.UUID,
        stage_config_id: uuid.UUID | None = None,
    ) -> HRDecisionResponse:
        """Create a new HR decision with validation."""
        
        # Validate candidate exists (load resumes eagerly so cross-match can pick latest)
        candidate_result = await db.execute(
            select(Candidate)
            .options(selectinload(Candidate.resumes))
            .where(Candidate.id == candidate_id)
        )
        candidate = candidate_result.scalar_one_or_none()
        if not candidate:
            raise ValueError(f"Candidate with id {candidate_id} not found")
        
        # Check "May Be" decision limit (only 1 per candidate)
        if decision_data.decision == "May Be":
            existing_may_be = await db.execute(
                select(func.count(HrDecision.id))
                .where(
                    HrDecision.candidate_id == candidate_id,
                    HrDecision.decision == "May Be"
                )
            )
            may_be_count = existing_may_be.scalar() or 0
            
            if may_be_count >= 1:
                raise ValueError(
                    "Only one 'May Be' decision is allowed per candidate. "
                    "Candidate already has a 'May Be' decision."
                )
        
        # Create the decision
        hr_decision = HrDecision(
            candidate_id=candidate_id,
            stage_config_id=stage_config_id,
            user_id=user_id,
            decision=decision_data.decision,
            notes=decision_data.notes,
        )
        
        db.add(hr_decision)
        await db.commit()
        await db.refresh(hr_decision)
        
        logger.info(
            f"Created HR decision: {decision_data.decision} for candidate {candidate_id} "
            f"by user {user_id}"
        )

        # Trigger cross-match in background if candidate is rejected (case-insensitive)
        if decision_data.decision.lower() == "reject":
            _trigger_cross_match_for_candidate(candidate)
        
        return HRDecisionResponse.model_validate(hr_decision)

    async def get_decision_history(
        self,
        db: AsyncSession,
        candidate_id: uuid.UUID,
    ) -> HRDecisionHistoryResponse:
        """Get complete decision history for a candidate."""
        
        # Validate candidate exists
        candidate_result = await db.execute(
            select(Candidate).where(Candidate.id == candidate_id)
        )
        candidate = candidate_result.scalar_one_or_none()
        if not candidate:
            raise ValueError(f"Candidate with id {candidate_id} not found")
        
        # Get all decisions for the candidate
        decisions_result = await db.execute(
            select(HrDecision)
            .where(HrDecision.candidate_id == candidate_id)
            .order_by(HrDecision.decided_at.desc())
            .options(selectinload(HrDecision.user))
        )
        decisions = decisions_result.scalars().all()
        
        # Count "May Be" decisions
        may_be_count = sum(1 for d in decisions if d.decision == "May Be")
        
        return HRDecisionHistoryResponse(
            candidate_id=candidate_id,
            decisions=[HRDecisionResponse.model_validate(d) for d in decisions],
            total_decisions=len(decisions),
            may_be_count=may_be_count,
        )

    async def update_decision(
        self,
        db: AsyncSession,
        decision_id: uuid.UUID,
        decision_data: HRDecisionUpdate,
        user_id: uuid.UUID,
    ) -> HRDecisionResponse:
        """Update an existing HR decision."""
        
        # Get existing decision
        decision_result = await db.execute(
            select(HrDecision).where(HrDecision.id == decision_id)
        )
        decision = decision_result.scalar_one_or_none()
        if not decision:
            raise ValueError(f"Decision with id {decision_id} not found")
        
        # Check "May Be" decision limit if updating to "May Be"
        if decision_data.decision == "May Be" and decision.decision != "May Be":
            existing_may_be = await db.execute(
                select(func.count(HrDecision.id))
                .where(
                    HrDecision.candidate_id == decision.candidate_id,
                    HrDecision.decision == "May Be",
                    HrDecision.id != decision_id  # Exclude current decision
                )
            )
            may_be_count = existing_may_be.scalar() or 0
            
            if may_be_count >= 1:
                raise ValueError(
                    "Only one 'May Be' decision is allowed per candidate. "
                    "Candidate already has a 'May Be' decision."
                )
        
        # Update decision
        decision.decision = decision_data.decision
        decision.notes = decision_data.notes
        
        await db.commit()
        await db.refresh(decision)
        
        logger.info(
            f"Updated HR decision {decision_id} to {decision_data.decision} "
            f"by user {user_id}"
        )

        # Trigger cross-match in background if candidate is rejected (case-insensitive)
        if decision_data.decision.lower() == "reject":
            # We need the candidate model with resumes loaded
            candidate_result = await db.execute(
                select(Candidate)
                .options(selectinload(Candidate.resumes))
                .where(Candidate.id == decision.candidate_id)
            )
            candidate_to_cross_match = candidate_result.scalar_one_or_none()
            if candidate_to_cross_match:
                _trigger_cross_match_for_candidate(candidate_to_cross_match)
        
        return HRDecisionResponse.model_validate(decision)

    async def get_decision_summary(
        self,
        db: AsyncSession,
    ) -> "HRDecisionSummary":
        """Get global summary: how many candidates are in each decision bucket."""
        from app.v1.db.models.candidates import Candidate
        from app.v1.schemas.hr_decision import HRDecisionSummary

        # Total candidates in DB
        total_result = await db.execute(select(func.count(Candidate.id)))
        total_candidates = total_result.scalar() or 0

        # Counts per decision status (one latest decision per candidate)
        # We group by candidate_id and pick their latest decision
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
            )
        ).subquery()

        latest_decisions = await db.execute(
            select(subq.c.decision, func.count().label("cnt"))
            .where(subq.c.rn == 1)
            .group_by(subq.c.decision)
        )
        rows = latest_decisions.fetchall()

        counts = {row.decision: row.cnt for row in rows}
        decided_total = sum(counts.values())

        return HRDecisionSummary(
            total_candidates=total_candidates,
            approved_count=counts.get("approve", 0),
            reject_count=counts.get("reject", 0),
            maybe_count=counts.get("May Be", 0),
            undecided_count=max(total_candidates - decided_total, 0),
        )

    async def get_job_decision_summary(
        self,
        db: AsyncSession,
        job_id: uuid.UUID,
    ) -> "HRJobDecisionSummary":
        """Get decision summary scoped to candidates of a specific job."""
        from app.v1.db.models.candidates import Candidate
        from app.v1.schemas.hr_decision import HRJobDecisionSummary

        # Total candidates for this job
        total_result = await db.execute(
            select(func.count(Candidate.id)).where(Candidate.applied_job_id == job_id)
        )
        total_candidates = total_result.scalar() or 0

        # Latest decision per candidate, filtered to this job's candidates
        candidate_ids_q = select(Candidate.id).where(Candidate.applied_job_id == job_id)

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
            ).where(HrDecision.candidate_id.in_(candidate_ids_q))
        ).subquery()

        latest_decisions = await db.execute(
            select(subq.c.decision, func.count().label("cnt"))
            .where(subq.c.rn == 1)
            .group_by(subq.c.decision)
        )
        rows = latest_decisions.fetchall()

        counts = {row.decision: row.cnt for row in rows}
        decided_total = sum(counts.values())

        return HRJobDecisionSummary(
            job_id=job_id,
            total_candidates=total_candidates,
            approved_count=counts.get("approve", 0),
            reject_count=counts.get("reject", 0),
            maybe_count=counts.get("May Be", 0),
            undecided_count=max(total_candidates - decided_total, 0),
        )

    async def get_job_screening_summary(
        self,
        db: AsyncSession,
        job_id: uuid.UUID,
    ) -> dict[str, int]:
        """Count resumes for a job grouped by pass_fail status ('passed', 'failed', 'pending')."""
        result = await db.execute(
            select(Resume.pass_fail, func.count(Resume.id))
            .join(Candidate, Resume.candidate_id == Candidate.id)
            .where(Candidate.applied_job_id == job_id)
            .group_by(Resume.pass_fail)
        )
        counts = {row[0]: row[1] for row in result.all()}
        return {
            "job_id": job_id,
            "passed_count": counts.get("passed", 0),
            "failed_count": counts.get("failed", 0),
            "pending_count": counts.get("pending", 0),
        }

    async def get_global_screening_summary(
        self,
        db: AsyncSession,
    ) -> dict[str, int]:
        """Global count of resumes grouped by pass_fail status."""
        result = await db.execute(
            select(Resume.pass_fail, func.count(Resume.id))
            .group_by(Resume.pass_fail)
        )
        counts = {row[0]: row[1] for row in result.all()}
        return {
            "passed": counts.get("passed", 0),
            "failed": counts.get("failed", 0),
            "pending": counts.get("pending", 0),
        }

    async def get_global_decision_summary(self, db: AsyncSession) -> dict[str, int]:
        """Global count of latest decisions for all candidates."""
        summary = await self.get_decision_summary(db)
        return {
            "total_candidates": summary.total_candidates,
            "approved_count": summary.approved_count,
            "reject_count": summary.reject_count,
            "maybe_count": summary.maybe_count,
            "undecided_count": summary.undecided_count,
        }


# Create service instance
hr_decision_service = HRDecisionService()
