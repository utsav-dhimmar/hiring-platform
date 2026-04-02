import uuid
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.v1.db.models.resume_screening_decisions import ResumeScreeningDecision


class ResumeScreeningRepository:
    """Repository for Resume Screening Decision operations."""

    async def get_by_candidate_id(
        self, db: AsyncSession, candidate_id: uuid.UUID
    ) -> Optional[ResumeScreeningDecision]:
        """Fetch the screening decision for a specific candidate."""
        result = await db.execute(
            select(ResumeScreeningDecision).where(
                ResumeScreeningDecision.candidate_id == candidate_id
            )
        )
        return result.scalar_one_or_none()

    async def create_or_update(
        self,
        db: AsyncSession,
        candidate_id: uuid.UUID,
        user_id: uuid.UUID,
        decision: str,
        note: Optional[str] = None,
    ) -> ResumeScreeningDecision:
        """Create a new screening decision or update an existing one."""
        from sqlalchemy.sql import func
        
        # Validate that a note is provided for "maybe" decisions
        if decision == "maybe" and (not note or not note.strip()):
            raise ValueError("A proper note is required for a 'Maybe' decision.")

        existing = await self.get_by_candidate_id(db, candidate_id)

        if existing:
            # Restriction: Allow only one time "Maybe" decision
            # If the user tries to set it to 'maybe' again after moving to another status, block it.
            if decision == "maybe" and existing.had_maybe and existing.decision != "maybe":
                raise ValueError("Candidate already has a previous 'Maybe' decision. Only one 'Maybe' decision is allowed per candidate.")

            existing.decision = decision
            existing.note = note
            existing.user_id = user_id
            
            # Update history if this is the first "Maybe" or if we are currently in "Maybe"
            if decision == "maybe":
                existing.had_maybe = True
                existing.maybe_note = note
                existing.maybe_at = func.now()
        else:
            new_decision = ResumeScreeningDecision(
                candidate_id=candidate_id,
                user_id=user_id,
                decision=decision,
                note=note,
            )
            if decision == "maybe":
                new_decision.had_maybe = True
                new_decision.maybe_note = note
                new_decision.maybe_at = func.now()
                
            db.add(new_decision)
            existing = new_decision

        await db.commit()
        await db.refresh(existing)

        # Trigger Cross-Match if rejected
        if decision == "reject":
            try:
                from app.v1.db.models.candidates import Candidate
                from app.v1.db.models.resumes import Resume
                from app.v1.services.resume_upload.tasks import cross_match_resume_task
                
                # Fetch candidate and latest resume to get IDs for the task
                candidate_result = await db.execute(
                    select(Candidate)
                    .where(Candidate.id == candidate_id)
                )
                candidate = candidate_result.scalar_one_or_none()
                
                if candidate:
                    resume_result = await db.execute(
                        select(Resume)
                        .where(Resume.candidate_id == candidate_id)
                        .order_by(Resume.uploaded_at.desc())
                        .limit(1)
                    )
                    latest_resume = resume_result.scalar_one_or_none()
                    
                    if latest_resume:
                        # Dispatch task to Celery
                        cross_match_resume_task.delay(
                            resume_id_str=str(latest_resume.id),
                            original_job_id_str=str(candidate.applied_job_id)
                        )
            except Exception:
                # We don't want to fail the main decision update if the background task trigger fails
                from app.v1.core.logging import get_logger
                logger = get_logger(__name__)
                logger.exception("Failed to trigger cross-match task for candidate_id=%s", candidate_id)

        return existing


resume_screening_repository = ResumeScreeningRepository()
