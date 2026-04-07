"""
Department service for admin-level department management.
"""

import uuid
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.v1.db.models.departments import Department
from app.v1.db.models.jobs import Job
from app.v1.repository.department_repository import department_repository
from app.v1.schemas.department import DepartmentCreate, DepartmentRead, DepartmentUpdate
from app.v1.schemas.response import PaginatedData
from app.v1.services.admin.audit_service import audit_service


class DepartmentService:
    """
    Service for admin-level department management operations.
    """

    async def get_all_departments(
        self, db: AsyncSession, skip: int = 0, limit: int = 100
    ) -> PaginatedData[DepartmentRead]:
        """Get all departments with pagination."""
        result = await department_repository.crud.get_multi(
            db=db, offset=skip, limit=limit
        )
        return PaginatedData[DepartmentRead](
            data=[DepartmentRead.model_validate(d) for d in result["data"]],
            total=result.get("total_count", 0),
        )

    async def get_department_by_id(
        self, db: AsyncSession, department_id: uuid.UUID
    ) -> DepartmentRead:
        """Get a department by ID."""
        department = await department_repository.crud.get(db=db, id=department_id)
        if not department:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Department not found.",
            )
        return DepartmentRead.model_validate(department)

    async def create_department(
        self,
        db: AsyncSession,
        admin_user_id: uuid.UUID,
        department_in: DepartmentCreate,
    ) -> DepartmentRead:
        """Create a new department."""
        department = Department(
            name=department_in.name,
            description=department_in.description,
        )
        db.add(department)
        await db.commit()
        await db.refresh(department)

        await audit_service.log_action(
            db=db,
            user_id=admin_user_id,
            action="create_department",
            target_type="department",
            target_id=department.id,
            details={"name": department.name},
        )
        return DepartmentRead.model_validate(department)

    async def update_department(
        self,
        db: AsyncSession,
        admin_user_id: uuid.UUID,
        department_id: uuid.UUID,
        department_update: DepartmentUpdate,
    ) -> Department | DepartmentRead:
        """Update a department."""
        existing = await self.get_department_by_id(db=db, department_id=department_id)
        update_data = department_update.model_dump(exclude_unset=True)

        if not update_data:
            return existing

        updated = await department_repository.crud.update(
            db=db,
            id=department_id,
            object=update_data,
            schema_to_select=DepartmentRead,
            return_as_model=True,
            one_or_none=True,
        )
        if updated is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Department not found.",
            )
        await audit_service.log_action(
            db=db,
            user_id=admin_user_id,
            action="update_department",
            target_type="department",
            target_id=department_id,
            details={"updated_fields": list(update_data.keys())},
        )
        return updated

    async def delete_department(
        self, db: AsyncSession, admin_user_id: uuid.UUID, department_id: uuid.UUID
    ) -> None:
        """Delete a department only if it is not used in any active job."""
        department = await self.get_department_by_id(db=db, department_id=department_id)

        active_jobs_stmt = (
            select(Job.title)
            .where(Job.department_id == department_id, Job.is_active.is_(True))
            .limit(5)
        )
        active_jobs_result = await db.execute(active_jobs_stmt)
        active_job_titles = [row[0] for row in active_jobs_result.fetchall()]

        active_jobs_count_stmt = select(func.count(Job.id)).where(
            Job.department_id == department_id,
            Job.is_active.is_(True),
        )
        active_jobs_count = await db.scalar(active_jobs_count_stmt) or 0

        if active_jobs_count > 0:
            jobs_text = ", ".join(active_job_titles)
            if active_jobs_count > 5:
                jobs_text += " and others"
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Cannot delete department '{department.name}' because it is being used in {active_jobs_count} active job(s): [{jobs_text}]. "
                    "Please deactivate or reassign those jobs first."
                ),
            )

        await department_repository.crud.delete(db=db, id=department_id)
        await audit_service.log_action(
            db=db,
            user_id=admin_user_id,
            action="delete_department",
            target_type="department",
            target_id=department_id,
        )


department_service = DepartmentService()
