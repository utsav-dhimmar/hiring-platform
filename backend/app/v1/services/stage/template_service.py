import uuid
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.v1.db.models.stage_templates import StageTemplate
from app.v1.repository.stage_repository import stage_repository
from app.v1.schemas.job_stage import (
    StageTemplateCreate,
    StageTemplateUpdate,
)

class StageTemplateService:
    """
    Service for stage template business logic.
    """

    async def get_all_templates(self, db: AsyncSession) -> list[StageTemplate]:
        """Retrieve all available stage templates."""
        return await stage_repository.get_all_templates(db)

    async def create_template(
        self, db: AsyncSession, template_in: StageTemplateCreate
    ) -> StageTemplate:
        """Create a new stage template."""
        template = StageTemplate(
            name=template_in.name,
            description=template_in.description,
            default_config=template_in.default_config,
        )
        return await stage_repository.create_template(db, template)

    async def update_template(
        self,
        db: AsyncSession,
        template_id: uuid.UUID,
        template_update: StageTemplateUpdate,
    ) -> StageTemplate:
        """Update an existing stage template."""
        template = await stage_repository.get_template_by_id(db, template_id)
        if not template:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Stage template with ID {template_id} not found",
            )

        update_data = template_update.model_dump(exclude_unset=True)
        return await stage_repository.update_template(db, template, update_data)

    async def delete_template(
        self, db: AsyncSession, template_id: uuid.UUID
    ) -> None:
        """Delete a stage template."""
        template = await stage_repository.get_template_by_id(db, template_id)
        if not template:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Stage template with ID {template_id} not found",
            )
        await stage_repository.delete_template(db, template)

template_service = StageTemplateService()
