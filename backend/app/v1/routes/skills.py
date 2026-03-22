"""
API routes for skill-related operations in version 1.
"""

import uuid
from typing import Any

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.v1.db.session import get_db
from app.v1.dependencies import check_permission
from app.v1.schemas.skill import SkillCreate, SkillRead, SkillUpdate
from app.v1.schemas.user import UserRead
from app.v1.services.admin_service import admin_service

router = APIRouter()


from app.v1.schemas.response import PaginatedData

@router.get("/", response_model=PaginatedData[SkillRead])
async def get_all_skills(
    db: AsyncSession = Depends(get_db),
    user: UserRead = Depends(check_permission("skills:access")),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
) -> Any:
    """Get all skills with pagination."""
    return await admin_service.get_all_skills(db=db, skip=skip, limit=limit)


@router.post("/", response_model=SkillRead, status_code=status.HTTP_201_CREATED)
async def create_skill(
    *,
    db: AsyncSession = Depends(get_db),
    user: UserRead = Depends(check_permission("skills:manage")),
    skill_in: SkillCreate,
) -> Any:
    """Create a new skill."""
    return await admin_service.create_skill(
        db=db, admin_user_id=user.id, skill_in=skill_in
    )


@router.get("/{skill_id}", response_model=SkillRead)
async def get_skill(
    skill_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: UserRead = Depends(check_permission("skills:access")),
) -> Any:
    """Get a specific skill by ID."""
    return await admin_service.get_skill_by_id(db=db, skill_id=skill_id)


@router.patch("/{skill_id}", response_model=SkillRead)
async def update_skill(
    skill_id: uuid.UUID,
    *,
    db: AsyncSession = Depends(get_db),
    user: UserRead = Depends(check_permission("skills:manage")),
    skill_update: SkillUpdate,
) -> Any:
    """Update a skill."""
    return await admin_service.update_skill(
        db=db,
        admin_user_id=user.id,
        skill_id=skill_id,
        skill_update=skill_update,
    )


@router.delete("/{skill_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_skill(
    skill_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: UserRead = Depends(check_permission("skills:manage")),
) -> None:
    """Delete a skill."""
    await admin_service.delete_skill(db=db, admin_user_id=user.id, skill_id=skill_id)
