import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.v1.db.session import get_db
from app.v1.dependencies import check_permission
from app.v1.schemas.job_priority import JobPriorityCreate, JobPriorityRead, JobPriorityUpdate
from app.v1.services.admin.job_priority_service import job_priority_service
from app.v1.schemas.user import UserRead

router = APIRouter()


@router.get("", response_model=List[JobPriorityRead])
async def get_priorities(
    db: AsyncSession = Depends(get_db),
    user: UserRead = Depends(check_permission("jobs:access")),
):
    """Get all job priorities."""
    return await job_priority_service.get_all_priorities(db)


@router.post("", response_model=JobPriorityRead, status_code=status.HTTP_201_CREATED)
async def create_priority(
    priority_in: JobPriorityCreate,
    db: AsyncSession = Depends(get_db),
    user: UserRead = Depends(check_permission("admin:access")),
):
    """Create a new job priority (Super Admin/HR Admin only)."""
    return await job_priority_service.create_priority(db, priority_in)


@router.patch("/{priority_id}", response_model=JobPriorityRead)
async def update_priority(
    priority_id: uuid.UUID,
    priority_in: JobPriorityUpdate,
    db: AsyncSession = Depends(get_db),
    user: UserRead = Depends(check_permission("admin:access")),
):
    """Update a job priority (Super Admin/HR Admin only)."""
    priority = await job_priority_service.update_priority(db, priority_id, priority_in)
    if not priority:
        raise HTTPException(status_code=404, detail="Priority not found")
    return priority


@router.delete("/{priority_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_priority(
    priority_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: UserRead = Depends(check_permission("admin:access")),
):
    """Delete a job priority (Super Admin/HR Admin only)."""
    success = await job_priority_service.delete_priority(db, priority_id)
    if not success:
        raise HTTPException(status_code=404, detail="Priority not found")
