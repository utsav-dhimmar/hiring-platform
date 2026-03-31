import uuid
from datetime import datetime
import logging
from typing import List

from sqlalchemy import select, delete, insert
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.v1.db.models.jobs import Job
from app.v1.db.models.resumes import Resume
from app.v1.db.models.cross_job_matches import CrossJobMatch
from app.v1.utils.uuid import UUIDHelper

_log = logging.getLogger(__name__)

class CrossJobMatchRepository:
    """Repository for cross-job matching database operations."""

    async def get_resume_with_embedding(self, db: AsyncSession, *, resume_id: uuid.UUID) -> Resume | None:
        """Retrieve a resume and its embedding.
        
        Args:
            db: Async database session.
            resume_id: UUID of the resume.
            
        Returns:
            The Resume object if found, else None.
        """
        return await db.scalar(
            select(Resume)
            .where(Resume.id == resume_id)
        )

    async def get_all_active_jobs_with_embeddings(
        self, db: AsyncSession, *, exclude_job_id: uuid.UUID | None = None
    ) -> List[Job]:
        """Retrieve all active jobs that have an embedding, optionally excluding one.
        
        Args:
            db: Async database session.
            exclude_job_id: Optional ID to exclude (usually the original job).
            
        Returns:
            List of active Jobs with embeddings.
        """
        query = select(Job).where(
            Job.is_active.is_(True),
            Job.jd_embedding.is_not(None)
        )
        if exclude_job_id:
            query = query.where(Job.id != exclude_job_id)
            
        result = await db.execute(query)
        return list(result.scalars().all())

    async def upsert_matches(
        self, 
        db: AsyncSession, 
        *, 
        resume_id: uuid.UUID, 
        original_job_id: uuid.UUID, 
        matches: List[dict]
    ) -> None:
        """Update or insert cross-job match results for a resume.
        
        Args:
            db: Async database session.
            resume_id: UUID of the resume.
            original_job_id: UUID of the job applied for.
            matches: List of dicts with 'matched_job_id' and 'match_score'.
        """
        # 1. Clear existing matches for this resume
        await db.execute(
            delete(CrossJobMatch).where(CrossJobMatch.resume_id == resume_id)
        )
        
        if not matches:
            return

        # 2. Insert new matches
        # We use a standard insert since we just cleared the old ones
        new_matches = [
            {
                "id": UUIDHelper.generate_uuid7(),
                "resume_id": resume_id,
                "original_job_id": original_job_id,
                "matched_job_id": m["matched_job_id"],
                "match_score": m["match_score"],
                "created_at": datetime.now()
            }
            for m in matches
        ]
        
        await db.execute(insert(CrossJobMatch), new_matches)
        # Note: Caller is responsible for commit

cross_job_match_repository = CrossJobMatchRepository()
