import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.v1.db.session import get_db
from app.v1.dependencies import check_permission
from app.v1.schemas.job_priority import JobPriorityCreate, JobPriorityRead, JobPriorityUpdate
from app.v1.services.admin.job_priority_service import job_priority_service
from app.v1.schemas.user import UserRead
from app.v1.schemas.response import PaginatedData

router = APIRouter()

@router.get("", response_model=PaginatedData[JobPriorityRead])
async def get_priorities(
    db: AsyncSession = Depends(get_db),
    user: UserRead = Depends(check_permission("jobs:access")),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    q: str | None = Query(None),
):
    """Get all job priorities with pagination and search."""
    return await job_priority_service.get_all_priorities(db, skip=skip, limit=limit, search=q)


@router.post("", response_model=JobPriorityRead, status_code=status.HTTP_201_CREATED)
async def create_priority(
    priority_in: JobPriorityCreate,
    db: AsyncSession = Depends(get_db),
    user: UserRead = Depends(check_permission("admin:access")),
):
    """Create a new job priority (Super Admin/HR Admin only)."""
    return await job_priority_service.create_priority(db, user.id, priority_in)


@router.patch("/{priority_id}", response_model=JobPriorityRead)
async def update_priority(
    priority_id: uuid.UUID,
    priority_in: JobPriorityUpdate,
    db: AsyncSession = Depends(get_db),
    user: UserRead = Depends(check_permission("admin:access")),
):
    """Update a job priority (Super Admin/HR Admin only)."""
    try:
        priority = await job_priority_service.update_priority(db, user.id, priority_id, priority_in)
        if not priority:
            raise HTTPException(status_code=404, detail="Priority not found")
        return priority
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{priority_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_priority(
    priority_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: UserRead = Depends(check_permission("admin:access")),
):
    """Delete a job priority (Super Admin/HR Admin only)."""
    try:
        success = await job_priority_service.delete_priority(db, user.id, priority_id)
        if not success:
            raise HTTPException(status_code=404, detail="Priority not found")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
