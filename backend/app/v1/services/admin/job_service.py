import uuid

from app.v1.db.models.jobs import Job
from app.v1.repository.job_repository import job_repository
from app.v1.schemas.job import JobCreate, JobUpdate, JobRead, JobsListRead
from app.v1.services.admin.audit_service import audit_service
from app.v1.services.admin.department_service import department_service
from app.v1.services.admin.skill_service import skill_service
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession


class JobAdminService:
    """
    Service for admin-level job management operations.
    """

    async def get_all_jobs(
        self, db: AsyncSession, skip: int = 0, limit: int = 100
    ) -> JobsListRead:
        """Get all jobs with pagination and global dashboard summaries."""
        result = await job_repository.get_multi(db=db, skip=skip, limit=limit)
        
        from app.v1.services.hr_decision_service import hr_decision_service
        
        job_reads = []
        for job in result["data"]:
            job_read = JobRead.model_validate(job)
            # Add per-job automated screening summary
            job_read.automated_screening_summary = await hr_decision_service.get_job_screening_summary(db, job.id)
            job_reads.append(job_read)
            
        return JobsListRead(
            data=job_reads,
            total=result["total"],
            global_decision_summary=await hr_decision_service.get_global_decision_summary(db),
            global_screening_summary=await hr_decision_service.get_global_screening_summary(db),
        )

    async def search_jobs(
        self, db: AsyncSession, query: str, skip: int = 0, limit: int = 100
    ) -> JobsListRead:
        """Search jobs with global and per-job screening summaries."""
        result = await job_repository.search(db=db, query=query, skip=skip, limit=limit)
        
        from app.v1.services.hr_decision_service import hr_decision_service
        
        job_reads = []
        for job in result["data"]:
            job_read = JobRead.model_validate(job)
            job_read.automated_screening_summary = await hr_decision_service.get_job_screening_summary(db, job.id)
            job_reads.append(job_read)
            
        return JobsListRead(
            data=job_reads,
            total=result["total"],
            global_decision_summary=await hr_decision_service.get_global_decision_summary(db),
            global_screening_summary=await hr_decision_service.get_global_screening_summary(db),
        )

    async def get_job_by_id(self, db: AsyncSession, job_id: uuid.UUID) -> JobRead:
        """Get a job by ID."""
        job = await job_repository.get(db=db, id=job_id)
        if not job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Job not found.",
            )
        return JobRead.model_validate(job)

    async def create_job(
        self, db: AsyncSession, admin_user_id: uuid.UUID, job_in: JobCreate
    ) -> JobRead:
        """Create a new job."""
        # Validate department existence if provided
        if job_in.department_id:
            await department_service.get_department_by_id(db, job_in.department_id)

        # Validate skills existence if provided
        if job_in.skill_ids:
            for skill_id in job_in.skill_ids:
                await skill_service.get_skill_by_id(db, skill_id)

        job = await job_repository.create(
            db=db, object=job_in, created_by=admin_user_id
        )

        # Setup default stages for the new job
        # await stage_service.setup_default_stages(db=db, job_id=job.id)

        await audit_service.log_action(
            db=db,
            user_id=admin_user_id,
            action="create_job",
            target_type="job",
            target_id=job.id,
            details={"title": job.title},
        )
        return JobRead.model_validate(job)

    async def update_job(
        self,
        db: AsyncSession,
        admin_user_id: uuid.UUID,
        job_id: uuid.UUID,
        job_update: JobUpdate,
        background_tasks=None,
    ) -> JobRead:
        # Update a job. Auto-triggers mass refresh if custom_extraction_fields changed.
        await self.get_job_by_id(db=db, job_id=job_id)

        # Filter out invalid department_id if provided
        if job_update.department_id:
            try:
                await department_service.get_department_by_id(db, job_update.department_id)
            except HTTPException:
                # If department doesn't exist, don't update it (keep existing)
                job_update.department_id = None

        # Filter out invalid skill_ids if provided
        if job_update.skill_ids:
            valid_skill_ids = []
            for s_id in job_update.skill_ids:
                try:
                    await skill_service.get_skill_by_id(db, s_id)
                    valid_skill_ids.append(s_id)
                except HTTPException:
                    # Skip invalid skill IDs (like the 3fa85f64 dummy placeholder)
                    continue
            job_update.skill_ids = valid_skill_ids

        updated_job = await job_repository.update(
            db=db, id=job_id, object=job_update
        )
        await audit_service.log_action(
            db=db,
            user_id=admin_user_id,
            action="update_job",
            target_type="job",
            target_id=job_id,
            details={
                "updated_fields": list(
                    job_update.model_dump(exclude_unset=True).keys()
                )
            },
        )

        # -----------------------------------------------------------------------
        # AUTO MASS REFRESH ON JD UPDATE - DISABLED (per HR team request)
        # Reason: HR prefers to manually trigger re-analysis, not automatically
        #         on every JD update. Uncomment to re-enable in the future.
        # -----------------------------------------------------------------------
        # updated_fields = job_update.model_dump(exclude_unset=True)
        # if (
        #     ("custom_extraction_fields" in updated_fields or "jd_text" in updated_fields)
        #     and background_tasks is not None
        # ):
        #     from app.v1.core.cache import cache
        #     from app.v1.services.resume_upload.background import (
        #         BackgroundProcessor,
        #     )
        #     from app.v1.services.resume_upload.processor import ResumeProcessor
        #
        #     # Clear cache for job embedding if JD changed
        #     if "jd_text" in updated_fields:
        #         await cache.delete(f"job_embedding:{job_id}")
        #
        #     bg_processor = BackgroundProcessor(ResumeProcessor())
        #     # Use Celery for mass refresh to avoid blocking the main server threads with heavy LLM work
        #     bg_processor.schedule_mass_refresh(
        #         job_id=job_id,
        #         full_refresh=("jd_text" in updated_fields)
        #     )
        # -----------------------------------------------------------------------

        return JobRead.model_validate(updated_job)

    async def delete_job(
        self, db: AsyncSession, admin_user_id: uuid.UUID, job_id: uuid.UUID
    ) -> None:
        """Delete a job."""
        await self.get_job_by_id(db=db, job_id=job_id)
        await job_repository.delete(db=db, id=job_id)
        await audit_service.log_action(
            db=db,
            user_id=admin_user_id,
            action="delete_job",
            target_type="job",
            target_id=job_id,
        )


job_admin_service = JobAdminService()
