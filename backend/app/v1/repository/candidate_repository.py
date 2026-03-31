"""
Repository for candidate-related database operations.
"""

import uuid

from fastcrud import FastCRUD
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.v1.db.models.candidates import Candidate


class CandidateRepository:
    """
    Repository class for handling Candidate database operations using FastCRUD.
    """

    def __init__(self) -> None:
        """
        Initialize the CandidateRepository with FastCRUD.
        """
        self.crud = FastCRUD(Candidate)

    async def search_candidates_for_job(
        self,
        db: AsyncSession,
        job_id: uuid.UUID,
        query: str,
        skip: int = 0,
        limit: int = 100,
    ) -> list[Candidate]:
        """
        Search for candidates for a specific job by name or email.

        Args:
            db (AsyncSession): Database session.
            job_id (uuid.UUID): Job ID.
            query (str): Search query.
            skip (int): Number of records to skip.
            limit (int): Maximum number of records to return.

        Returns:
            list[Candidate]: List of candidates matching the search criteria.
        """
        search_filter = or_(
            Candidate.first_name.ilike(f"%{query}%"),
            Candidate.last_name.ilike(f"%{query}%"),
            Candidate.email.ilike(f"%{query}%"),
        )

        stmt = (
            select(Candidate)
            .where(Candidate.applied_job_id == job_id)
            .where(search_filter)
            .options(selectinload(Candidate.resumes))
            .order_by(Candidate.created_at.desc())
            .offset(skip)
            .limit(limit)
        )

        result = await db.execute(stmt)
        return list(result.scalars().all())


candidate_repository = CandidateRepository()
