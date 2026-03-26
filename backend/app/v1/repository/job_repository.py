"""
Repository for job-related database operations.
"""

import uuid

from sqlalchemy import delete, func, insert, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.v1.db.models.job_skills import job_skills
from app.v1.db.models.job_stage_configs import JobStageConfig
from app.v1.db.models.jobs import Job
from app.v1.schemas.job import JobCreate, JobUpdate


class JobRepository:
    """
    Repository class for handling Job database operations.
    """

    async def get_multi(
        self, db: AsyncSession, skip: int = 0, limit: int = 100
    ):
        """
        Retrieve multiple job records with pagination.

        Args:
            db (AsyncSession): Database session.
            skip (int): Number of records to skip.
            limit (int): Maximum number of records to return.

        Returns:
            dict[str, object]: A dictionary containing the jobs and total count.
        """
        total = await db.scalar(select(func.count()).select_from(Job))
        stmt = (
            select(Job)
            .options(
                selectinload(Job.skills),
                selectinload(Job.stages).selectinload(JobStageConfig.template),
                selectinload(Job.department),
            )
            .offset(skip)
            .limit(limit)
        )
        result = await db.execute(stmt)
        return {
            "data": list(result.scalars().unique().all()),
            "total": total or 0,
        }

    async def get(self, db: AsyncSession, id: uuid.UUID) -> Job | None:
        """Retrieve a single job with its related skills and stages."""
        stmt = (
            select(Job)
            .options(
                selectinload(Job.skills),
                selectinload(Job.stages).selectinload(JobStageConfig.template),
                selectinload(Job.department),
            )
            .where(Job.id == id)
        )
        result = await db.execute(stmt)
        return result.scalars().unique().first()

    async def create(
        self, db: AsyncSession, object: JobCreate, created_by: uuid.UUID
    ) -> Job:
        """Create a job and persist its skill associations."""
        payload = object.model_dump()
        skill_ids = payload.pop("skill_ids", [])

        job = Job(**payload, created_by=created_by)
        db.add(job)
        await db.flush()

        await self._sync_skills(db=db, job_id=job.id, skill_ids=skill_ids)
        
        from app.v1.db.models.job_versions import JobVersion
        job_version = JobVersion(
            job_id=job.id,
            version_number=1,
            title=job.title,
            jd_text=job.jd_text,
            jd_json=job.jd_json,
            jd_embedding=job.jd_embedding,
            custom_extraction_fields=job.custom_extraction_fields,
        )
        db.add(job_version)
        
        await db.commit()

        created_job = await self.get(db=db, id=job.id)
        if created_job is None:
            raise ValueError("Failed to load created job.")
        return created_job

    async def update(
        self, db: AsyncSession, id: uuid.UUID, object: JobUpdate
    ) -> Job:
        """Update a job and optionally replace its skill associations."""
        job = await self.get(db=db, id=id)
        if job is None:
            raise ValueError("Job not found.")

        payload = object.model_dump(exclude_unset=True)
        skill_ids = payload.pop("skill_ids", None)

        for key, value in payload.items():
            setattr(job, key, value)

        if skill_ids is not None:
            await self._sync_skills(db=db, job_id=id, skill_ids=skill_ids)
            
        # Increment version to record an update
        job.version = (job.version or 1) + 1
        
        from app.v1.db.models.job_versions import JobVersion
        job_version = JobVersion(
            job_id=job.id,
            version_number=job.version,
            title=job.title,
            jd_text=job.jd_text,
            jd_json=job.jd_json,
            jd_embedding=job.jd_embedding,
            custom_extraction_fields=job.custom_extraction_fields,
        )
        db.add(job_version)

        await db.commit()

        updated_job = await self.get(db=db, id=id)
        if updated_job is None:
            raise ValueError("Failed to load updated job.")
        return updated_job

    async def delete(self, db: AsyncSession, id: uuid.UUID) -> None:
        """Delete a job by id."""
        job = await self.get(db=db, id=id)
        if job is None:
            return

        await db.delete(job)
        await db.commit()

    async def search(
        self,
        db: AsyncSession,
        query: str,
        skip: int = 0,
        limit: int = 100,
    ) -> dict[str, object]:
        """
        Search for jobs by title and description.

        Args:
            db (AsyncSession): Database session.
            query (str): The search query.
            skip (int): Number of records to skip.
            limit (int): Maximum number of records to return.

        Returns:
            dict[str, object]: A dictionary containing the matching jobs and total count.
        """
        from sqlalchemy import or_

        search_filter = or_(
            Job.title.ilike(f"%{query}%"),
            Job.jd_text.ilike(f"%{query}%"),
        )

        total_stmt = select(func.count()).select_from(Job).where(search_filter)
        total = await db.scalar(total_stmt)

        stmt = (
            select(Job)
            .options(
                selectinload(Job.skills),
                selectinload(Job.stages).selectinload(JobStageConfig.template),
                selectinload(Job.department),
            )
            .where(search_filter)
            .offset(skip)
            .limit(limit)
        )
        result = await db.execute(stmt)
        return {
            "data": list(result.scalars().unique().all()),
            "total": total or 0,
        }

    async def _sync_skills(
        self, db: AsyncSession, job_id: uuid.UUID, skill_ids: list[uuid.UUID]
    ) -> None:
        """Replace a job's skill links with the provided skill ids."""
        await db.execute(
            delete(job_skills).where(job_skills.c.job_id == job_id)
        )
        if not skill_ids:
            return

        await db.execute(
            insert(job_skills),
            [
                {"job_id": job_id, "skill_id": skill_id}
                for skill_id in skill_ids
            ],
        )


job_repository = JobRepository()
