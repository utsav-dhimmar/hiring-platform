from typing import Any
import uuid
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.v1.db.models.skills import Skill
from app.v1.repository.skill_repository import skill_repository
from app.v1.schemas.skill import SkillCreate, SkillRead, SkillUpdate
from app.v1.schemas.response import PaginatedData
from app.v1.services.admin.audit_service import audit_service

class SkillService:
    """
    Service for admin-level skill management operations.
    """

    async def get_all_skills(
        self, db: AsyncSession, skip: int = 0, limit: int = 100
    ) -> PaginatedData[SkillRead]:
        """Get all skills with pagination."""
        result = await skill_repository.crud.get_multi(
            db=db, offset=skip, limit=limit
        )
        return PaginatedData[SkillRead](
            data=[SkillRead.model_validate(s) for s in result["data"]],
            total=result.get("total_count", 0),
        )

    async def get_skill_by_id(
        self, db: AsyncSession, skill_id: uuid.UUID
    ) -> SkillRead:
        """Get a skill by ID."""
        skill = await skill_repository.crud.get(db=db, id=skill_id)
        if not skill:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Skill not found.",
            )
        return SkillRead.model_validate(skill)

    async def create_skill(
        self, db: AsyncSession, admin_user_id: uuid.UUID, skill_in: SkillCreate
    ) -> SkillRead:
        """Create a new skill."""
        skill = Skill(
            name=skill_in.name,
            description=skill_in.description,
        )
        db.add(skill)
        await db.commit()
        await db.refresh(skill)

        await audit_service.log_action(
            db=db,
            user_id=admin_user_id,
            action="create_skill",
            target_type="skill",
            target_id=skill.id,
            details={"name": skill.name},
        )
        return SkillRead.model_validate(skill)

    async def update_skill(
        self,
        db: AsyncSession,
        admin_user_id: uuid.UUID,
        skill_id: uuid.UUID,
        skill_update: SkillUpdate,
    ) -> Skill | SkillRead:
        """Update a skill."""
        existing_skill = await self.get_skill_by_id(db=db, skill_id=skill_id)
        update_data = skill_update.model_dump(exclude_unset=True)

        if not update_data:
            return existing_skill

        updated_skill = await skill_repository.crud.update(
            db=db,
            id=skill_id,
            object=update_data,
            schema_to_select=SkillRead,
            return_as_model=True,
            one_or_none=True,
        )
        if updated_skill is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Skill not found.",
            )
        await audit_service.log_action(
            db=db,
            user_id=admin_user_id,
            action="update_skill",
            target_type="skill",
            target_id=skill_id,
            details={"updated_fields": list(update_data.keys())},
        )
        return updated_skill

    async def delete_skill(
        self, db: AsyncSession, admin_user_id: uuid.UUID, skill_id: uuid.UUID
    ) -> None:
        """Delete a skill."""
        await self.get_skill_by_id(db=db, skill_id=skill_id)
        await skill_repository.crud.delete(db=db, id=skill_id)
        await audit_service.log_action(
            db=db,
            user_id=admin_user_id,
            action="delete_skill",
            target_type="skill",
            target_id=skill_id,
        )

skill_service = SkillService()
