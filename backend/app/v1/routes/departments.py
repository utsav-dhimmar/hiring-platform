"""
API routes for department-related operations in version 1.
"""

import uuid
from typing import Any

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.v1.db.session import get_db
from app.v1.dependencies import check_permission
from app.v1.schemas.department import (
    DepartmentCreate,
    DepartmentRead,
    DepartmentUpdate,
)
from app.v1.schemas.response import PaginatedData
from app.v1.schemas.user import UserRead
from app.v1.services.admin.department_service import department_service

router = APIRouter()


@router.get("", response_model=PaginatedData[DepartmentRead])
async def get_all_departments(
    db: AsyncSession = Depends(get_db),
    user: UserRead = Depends(check_permission("departments:access")),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
) -> Any:
    """Get all departments with pagination."""
    return await department_service.get_all_departments(
        db=db, skip=skip, limit=limit
    )


@router.post(
    "", response_model=DepartmentRead, status_code=status.HTTP_201_CREATED
)
async def create_department(
    *,
    db: AsyncSession = Depends(get_db),
    user: UserRead = Depends(check_permission("departments:manage")),
    department_in: DepartmentCreate,
) -> Any:
    """Create a new department."""
    return await department_service.create_department(
        db=db, admin_user_id=user.id, department_in=department_in
    )


@router.get("/{department_id}", response_model=DepartmentRead)
async def get_department(
    department_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: UserRead = Depends(check_permission("departments:access")),
) -> Any:
    """Get a specific department by ID."""
    return await department_service.get_department_by_id(
        db=db, department_id=department_id
    )


@router.patch("/{department_id}", response_model=DepartmentRead)
async def update_department(
    department_id: uuid.UUID,
    *,
    db: AsyncSession = Depends(get_db),
    user: UserRead = Depends(check_permission("departments:manage")),
    department_update: DepartmentUpdate,
) -> Any:
    """Update a department."""
    return await department_service.update_department(
        db=db,
        admin_user_id=user.id,
        department_id=department_id,
        department_update=department_update,
    )


@router.delete("/{department_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_department(
    department_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: UserRead = Depends(check_permission("departments:manage")),
) -> None:
    """Delete a department."""
    await department_service.delete_department(
        db=db, admin_user_id=user.id, department_id=department_id
    )
