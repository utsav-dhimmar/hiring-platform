import uuid
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.v1.db.models.jobs import Job
from app.v1.repository.job_repository import job_repository
from app.v1.schemas.job import JobCreate, JobUpdate
from app.v1.services.stage_service import stage_service
from app.v1.services.admin.audit_service import audit_service

class JobAdminService:
    """
    Service for admin-level job management operations.
    """

    async def get_all_jobs(
        self, db: AsyncSession, skip: int = 0, limit: int = 100
    ) -> list[Job]:
        """Get all jobs with pagination."""
        result = await job_repository.get_multi(db=db, skip=skip, limit=limit)
        return result["data"]

    async def get_job_by_id(self, db: AsyncSession, job_id: uuid.UUID) -> Job:
        """Get a job by ID."""
        job = await job_repository.get(db=db, id=job_id)
        if not job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Job not found.",
            )
        return job

    async def create_job(
        self, db: AsyncSession, admin_user_id: uuid.UUID, job_in: JobCreate
    ) -> Job:
        """Create a new job."""
        job = await job_repository.create(
            db=db, object=job_in, created_by=admin_user_id
        )

        # Setup default stages for the new job
        await stage_service.setup_default_stages(db=db, job_id=job.id)

        await audit_service.log_action(
            db=db,
            user_id=admin_user_id,
            action="create_job",
            target_type="job",
            target_id=job.id,
            details={"title": job.title},
        )
        return job

    async def update_job(
        self,
        db: AsyncSession,
        admin_user_id: uuid.UUID,
        job_id: uuid.UUID,
        job_update: JobUpdate,
        background_tasks=None,
    ) -> Job:
        """Update a job. Auto-triggers mass refresh if custom_extraction_fields changed."""
        await self.get_job_by_id(db=db, job_id=job_id)
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

        # Auto-trigger mass refresh if custom_extraction_fields was updated
        updated_fields = job_update.model_dump(exclude_unset=True)
        if "custom_extraction_fields" in updated_fields and background_tasks is not None:
            from app.v1.services.resume_upload.background import BackgroundProcessor
            from app.v1.services.resume_upload.processor import ResumeProcessor
            bg_processor = BackgroundProcessor(ResumeProcessor())
            background_tasks.add_task(
                bg_processor.mass_refresh_in_background,
                job_id=job_id,
            )

        return updated_job


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
