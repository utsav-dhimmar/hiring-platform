"""
Repository for job-related database operations.
"""

import uuid

from sqlalchemy import delete, func, insert, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.v1.db.models.job_chunks import JobChunk
from app.v1.db.models.job_skills import job_skills
from app.v1.db.models.job_stage_configs import JobStageConfig
from app.v1.db.models.jobs import Job
from app.v1.schemas.job import JobCreate, JobUpdate
from app.v1.utils.text import build_job_text, split_into_chunks


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
                selectinload(Job.versions),
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
                selectinload(Job.versions),
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
        
        # Ensure fresh embeddings apply immediately
        from app.v1.core.embeddings import embedding_service
        from app.v1.utils.text import build_job_text
        job.jd_embedding = embedding_service.encode_jd(build_job_text(job))
        
        db.add(job)
        await db.flush()

        await self._sync_job_chunks(db=db, job=job)

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
        
        # Determine if core fields changed (triggers new version and re-embedding)
        core_fields = ["title", "jd_text", "jd_json", "custom_extraction_fields", "department_id"]
        core_fields_changed = any(k in payload for k in core_fields) or (skill_ids is not None)

        for key, value in payload.items():
            setattr(job, key, value)
            
        if core_fields_changed:
            from app.v1.core.embeddings import embedding_service
            from app.v1.utils.text import build_job_text
            
            # Update embeddings and chunks
            job.jd_embedding = embedding_service.encode_jd(build_job_text(job))
            await self._sync_job_chunks(db=db, job=job)

            # Sync skills if provided
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
        elif skill_ids is not None:
            # If ONLY skill_ids changed (unlikely given core_fields_changed logic above), still sync
            await self._sync_skills(db=db, job_id=id, skill_ids=skill_ids)

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
                selectinload(Job.versions),
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

    async def get_decision_summary(self, db: AsyncSession, job_id: uuid.UUID) -> dict[str, int]:
        """
        Fetch summary counts of candidate screening decisions for a job.
        
        Optimized to use a single aggregate query.
        """
        from app.v1.db.models.candidates import Candidate
        from app.v1.db.models.resumes import Resume
        from app.v1.db.models.resume_screening_decisions import ResumeScreeningDecision
        from sqlalchemy import func

        # CTE to find the single latest resume for each candidate of this job
        # We only need this to determine the 'unprocessed' count (no resume exists)
        latest_res_cte = (
            select(
                Candidate.id.label("candidate_id"),
                Resume.id.label("resume_id"),
                func.row_number().over(
                    partition_by=Candidate.id,
                    order_by=Resume.uploaded_at.desc()
                ).label("rn")
            )
            .select_from(Candidate)
            .outerjoin(Resume, Candidate.id == Resume.candidate_id)
            .where(Candidate.applied_job_id == job_id)
            .cte("latest_res_cte")
        )

        # Aggregate counts by combining presence of resume and HR decisions
        stmt = (
            select(
                latest_res_cte.c.resume_id,
                ResumeScreeningDecision.decision,
                func.count(latest_res_cte.c.candidate_id)
            )
            .select_from(latest_res_cte)
            .outerjoin(ResumeScreeningDecision, latest_res_cte.c.candidate_id == ResumeScreeningDecision.candidate_id)
            .where(latest_res_cte.c.rn == 1)
            .group_by(
                latest_res_cte.c.resume_id,
                ResumeScreeningDecision.decision
            )
        )

        result = await db.execute(stmt)
        rows = result.all()
        
        summary = {
            "total_candidate_count": 0,
            "approved_count": 0,
            "rejected_count": 0,
            "maybe_count": 0,
            "pending_count": 0,
            "unprocessed_count": 0,
        }

        for resume_id, decision, count in rows:
            summary["total_candidate_count"] += count
            
            # --- HR Decision Counts (Screening Decisions) ---
            if decision == "approve":
                summary["approved_count"] += count
            elif decision == "reject":
                summary["rejected_count"] += count
            elif decision == "maybe":
                summary["maybe_count"] += count
            else:
                # Candidate has no explicit HR decision record yet
                summary["pending_count"] += count

            # --- Unprocessed Check ---
            if resume_id is None:
                summary["unprocessed_count"] += count

        return summary

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

    async def _sync_job_chunks(
        self, db: AsyncSession, job: Job
    ) -> None:
        """Partition job description into chunks and persist with embeddings."""
        from app.v1.core.embeddings import embedding_service
        from app.v1.utils.text import split_into_chunks
        
        # Clear existing chunks
        await db.execute(
            delete(JobChunk).where(JobChunk.job_id == job.id)
        )
        
        full_text = job.jd_text or ""
        if not full_text.strip():
            return
            
        chunks = split_into_chunks(full_text)
        if not chunks:
            return
            
        # Add Title as the first chunk for better context
        if job.title and job.title not in chunks[0]:
            chunks.insert(0, f"Job Title: {job.title}")

        chunk_records = []
        for text in chunks:
            embedding = embedding_service.encode_jd(text)
            chunk_records.append(
                JobChunk(
                    job_id=job.id,
                    chunk_text=text,
                    chunk_embedding=embedding,
                )
            )
        
        if chunk_records:
            db.add_all(chunk_records)
            await db.flush()


job_repository = JobRepository()
