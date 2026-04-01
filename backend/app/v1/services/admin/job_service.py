import uuid
from typing import Any

from app.v1.db.models.jobs import Job
from app.v1.repository.job_repository import job_repository
from app.v1.schemas.job import JobCreate, JobStatusUpdate, JobUpdate
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

    async def get_job_version(self, db: AsyncSession, version_id: uuid.UUID) -> Any:
        """Get a specific job version snapshot by its unique ID."""
        version = await job_repository.get_version(db=db, id=version_id)
        if not version:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Job version not found.",
            )
        return version

    async def create_job(
        self, db: AsyncSession, admin_user_id: uuid.UUID, job_in: JobCreate
    ) -> Job:
        """Create a new job."""
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
        current_job = await self.get_job_by_id(db=db, job_id=job_id)
        
        # Check if job is currently disabled
        if not current_job.is_active:
            update_data = job_update.model_dump(exclude_unset=True)
            # If it's disabled, we only allow re-enabling it. 
            # If any other field is present or if is_active is not being set to True, raise error.
            if any(k != "is_active" for k in update_data.keys()) or update_data.get("is_active") is not True:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cannot update a disabled job. Please enable it first.",
                )
        
        # Validate department and skills if provided
        update_data = job_update.model_dump(exclude_unset=True)
        if "department_id" in update_data and update_data["department_id"]:
            await department_service.get_department_by_id(db=db, department_id=update_data["department_id"])
        
        if "skill_ids" in update_data and update_data["skill_ids"]:
            for skill_id in update_data["skill_ids"]:
                await skill_service.get_skill_by_id(db=db, skill_id=skill_id)

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

        return updated_job

    async def update_job_status(
        self,
        db: AsyncSession,
        admin_user_id: uuid.UUID,
        job_id: uuid.UUID,
        status_in: JobStatusUpdate,
    ) -> Job:
        """Update only the active status of a job (Enable/Disable)."""
        await self.get_job_by_id(db=db, job_id=job_id)
        
        # Bypasses the edit lock as this is a specific status update API
        updated_job = await job_repository.update(
            db=db, id=job_id, object=JobUpdate(is_active=status_in.is_active)
        )
        
        await audit_service.log_action(
            db=db,
            user_id=admin_user_id,
            action="update_job_status",
            target_type="job",
            target_id=job_id,
            details={"is_active": status_in.is_active},
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
