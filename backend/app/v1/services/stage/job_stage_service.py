import uuid
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.v1.db.models.job_stage_configs import JobStageConfig
from app.v1.repository.stage_repository import stage_repository
from app.v1.schemas.job_stage import (
    JobStageConfigCreate,
    JobStageConfigUpdate,
)

class JobStageService:
    """
    Service for job stage configuration business logic.
    """

    async def get_job_stages(
        self, db: AsyncSession, job_id: uuid.UUID
    ) -> list[JobStageConfig]:
        """Retrieve the ordered interview stages for a job."""
        return await stage_repository.get_job_stages(db, job_id)

    async def add_stage_to_job(
        self,
        db: AsyncSession,
        job_id: uuid.UUID,
        stage_in: JobStageConfigCreate,
    ) -> JobStageConfig:
        """Add a new stage to a job's interview process."""
        # Verify template exists
        template = await stage_repository.get_template_by_id(
            db, stage_in.template_id
        )
        if not template:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Stage template with ID {stage_in.template_id} not found",
            )

        # Merge template default config if not provided in stage_in
        config = stage_in.config or template.default_config

        stage_config = JobStageConfig(
            job_id=job_id,
            template_id=stage_in.template_id,
            stage_order=stage_in.stage_order,
            config=config,
            is_mandatory=stage_in.is_mandatory,
        )
        return await stage_repository.create_job_stage(db, stage_config)

    async def update_job_stage(
        self,
        db: AsyncSession,
        config_id: uuid.UUID,
        stage_update: JobStageConfigUpdate,
    ) -> JobStageConfig:
        """Update a specific job stage configuration."""
        stage_config = await stage_repository.get_stage_config_by_id(
            db, config_id
        )
        if not stage_config:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Job stage configuration with ID {config_id} not found",
            )

        update_data = stage_update.model_dump(exclude_unset=True)
        return await stage_repository.update_job_stage(
            db, stage_config, update_data
        )

    async def remove_stage_from_job(
        self, db: AsyncSession, config_id: uuid.UUID
    ) -> None:
        """Remove a stage from a job's interview process."""
        stage_config = await stage_repository.get_stage_config_by_id(
            db, config_id
        )
        if not stage_config:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Job stage configuration with ID {config_id} not found",
            )
        await stage_repository.delete_job_stage(db, stage_config)

    async def reorder_job_stages(
        self, db: AsyncSession, job_id: uuid.UUID, stage_ids: list[uuid.UUID]
    ) -> list[JobStageConfig]:
        """Bulk update the order of stages for a job."""
        stages = await stage_repository.get_job_stages(db, job_id)
        stage_map = {s.id: s for s in stages}

        # Validate all IDs belong to this job
        for sid in stage_ids:
            if sid not in stage_map:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Stage ID {sid} does not belong to job {job_id}",
                )

        # Update orders
        for index, sid in enumerate(stage_ids, start=1):
            await stage_repository.update_job_stage(
                db, stage_map[sid], {"stage_order": index}
            )

        return await stage_repository.get_job_stages(db, job_id)

    async def setup_default_stages(
        self, db: AsyncSession, job_id: uuid.UUID
    ) -> list[JobStageConfig]:
        """Setup the standard reference flow for a job."""
        templates = await stage_repository.get_all_templates(db)

        # Map names to templates for easy lookup
        template_map = {t.name.lower(): t for t in templates}

        # Define standard flow
        standard_flow = [
            "HR Screening Round",
            "Technical Practical Round",
            "Technical + HR Panel Evaluation",
        ]

        created_stages = []
        for index, stage_name in enumerate(standard_flow, start=1):
            template = template_map.get(stage_name.lower())
            if template:
                stage_config = JobStageConfig(
                    job_id=job_id,
                    template_id=template.id,
                    stage_order=index,
                    config=template.default_config,
                    is_mandatory=True,
                )
                created_stages.append(
                    await stage_repository.create_job_stage(db, stage_config)
                )

        return created_stages

    async def bulk_add_stages_to_job(
        self,
        db: AsyncSession,
        job_id: uuid.UUID,
        stages_in: list[JobStageConfigCreate],
    ) -> list[JobStageConfig]:
        """Overwrite all existing stages for a job with a new list."""
        # 1. Clear existing
        await stage_repository.clear_job_stages(db, job_id)

        # 2. Add new ones
        configs = []
        for s in stages_in:
            template = await stage_repository.get_template_by_id(db, s.template_id)
            if not template:
                 raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Stage template with ID {s.template_id} not found",
                )
            configs.append(JobStageConfig(
                job_id=job_id,
                template_id=s.template_id,
                stage_order=s.stage_order,
                config=s.config or template.default_config,
                is_mandatory=s.is_mandatory
            ))
        
        db.add_all(configs)
        await db.commit()
        
        # 3. Return refreshed list
        return await stage_repository.get_job_stages(db, job_id)

job_stage_service = JobStageService()
