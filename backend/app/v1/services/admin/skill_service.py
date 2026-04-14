from typing import Any
import uuid
from fastapi import HTTPException, status
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.v1.db.models.skills import Skill
from app.v1.db.models.jobs import Job
from app.v1.db.models.job_skills import job_skills
from app.v1.db.models.candidate_skills import candidate_skills
from app.v1.repository.skill_repository import skill_repository
from app.v1.schemas.skill import SkillCreate, SkillRead, SkillUpdate
from app.v1.schemas.response import PaginatedData
from app.v1.services.admin.audit_service import audit_service

class SkillService:
    """
    Service for admin-level skill management operations.
    """

    async def get_all_skills(
        self, db: AsyncSession, skip: int = 0, limit: int = 100, search: str | None = None
    ) -> PaginatedData[SkillRead]:
        """Get all skills with pagination and optional search using FastCRUD filters."""
        filters = {}
        if search:
            filters["name__ilike"] = f"%{search}%"

        result = await skill_repository.crud.get_multi(
            db=db, offset=skip, limit=limit, **filters
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
        # 1. Check for existing skill name to prevent IntegrityError
        existing_skill_query = select(Skill).where(Skill.name == skill_in.name)
        existing_skill_result = await db.execute(existing_skill_query)
        if existing_skill_result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Skill with name '{skill_in.name}' already exists.",
            )

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
        # 1. Verify existence
        skill = await skill_repository.crud.get(db=db, id=skill_id)
        if not skill:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Skill not found.",
            )
            
        update_data = skill_update.model_dump(exclude_unset=True)
        if not update_data:
            return SkillRead.model_validate(skill)

        # 2. If name is changing, check for uniqueness
        if "name" in update_data and update_data["name"] != skill.name:
            existing_skill_query = select(Skill).where(Skill.name == update_data["name"])
            existing_skill_result = await db.execute(existing_skill_query)
            if existing_skill_result.scalar_one_or_none():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Skill with name '{update_data['name']}' already exists.",
                )

        # 3. Apply update
        updated_skill = await skill_repository.crud.update(
            db=db,
            id=skill_id,
            object=update_data,
            schema_to_select=SkillRead,
            return_as_model=True,
            one_or_none=True,
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
        """Delete a skill after safety checks and cleaning associations."""
        # 1. Fetch Skill to verify existence and get details
        skill = await skill_repository.crud.get(db=db, id=skill_id)
        if not skill:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Skill not found.",
            )
        
        # Safe attribute access as requested
        skill_name = skill.name if hasattr(skill, 'name') else skill.get('name', "Unknown Skill")

        # 2. Safety Check: Is it being used in any ACTIVE Jobs?
        # Fetch Job Titles for better error message
        active_jobs_query = (
            select(Job.title)
            .join(job_skills, Job.id == job_skills.c.job_id)
            .where(job_skills.c.skill_id == skill_id, Job.is_active == True)
        )
        result = await db.execute(active_jobs_query)
        active_job_titles = [row[0] for row in result.fetchall()]

        if active_job_titles:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot delete skill '{skill_name}' because it is being used in ACTIVE Job(s): {active_job_titles}. Please deactivate these Job(s) first."
            )

        # 3. Clean Linkage: Cascade delete associations from junction tables
        # Required to satisfy Foreign Key constraints
        await db.execute(delete(job_skills).where(job_skills.c.skill_id == skill_id))
        await db.execute(delete(candidate_skills).where(candidate_skills.c.skill_id == skill_id))

        # 4. Final Deletion: Delete the skill itself
        await skill_repository.crud.delete(db=db, id=skill_id)
        await db.commit()

        # 5. Audit Log
        await audit_service.log_action(
            db=db,
            user_id=admin_user_id,
            action="delete_skill",
            target_type="skill",
            target_id=skill_id,
            details={"name": skill_name}
        )

skill_service = SkillService()
