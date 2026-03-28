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
        existing = await self.get_by_candidate_id(db, candidate_id)

        if existing:
            existing.decision = decision
            existing.note = note
            existing.user_id = user_id
            # SQL Alchemy automatically tracks changes
        else:
            new_decision = ResumeScreeningDecision(
                candidate_id=candidate_id,
                user_id=user_id,
                decision=decision,
                note=note,
            )
            db.add(new_decision)
            existing = new_decision

        await db.commit()
        await db.refresh(existing)
        return existing


resume_screening_repository = ResumeScreeningRepository()
