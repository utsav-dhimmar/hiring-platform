import uuid
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.v1.db.session import get_db
from app.v1.dependencies import check_permission
from app.v1.schemas.job_position import JobPositionCreate, JobPositionRead, JobPositionUpdate
from app.v1.services.admin.job_position_service import job_position_service
from app.v1.schemas.user import UserRead
from app.v1.schemas.response import PaginatedData

router = APIRouter()

@router.get("", response_model=PaginatedData[JobPositionRead])
async def get_positions(
    db: AsyncSession = Depends(get_db),
    user: UserRead = Depends(check_permission("jobs:access")),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    q: str | None = Query(None),
):
    """Get all job positions with pagination and search."""
    return await job_position_service.get_all_positions(db, skip=skip, limit=limit, search=q)


@router.post("", response_model=JobPositionRead, status_code=status.HTTP_201_CREATED)
async def create_position(
    position_in: JobPositionCreate,
    db: AsyncSession = Depends(get_db),
    user: UserRead = Depends(check_permission("admin:access")),
):
    """Create a new job position (Super Admin/HR Admin only)."""
    try:
        return await job_position_service.create_position(db, user.id, position_in)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.patch("/{position_id}", response_model=JobPositionRead)
async def update_position(
    position_id: uuid.UUID,
    position_in: JobPositionUpdate,
    db: AsyncSession = Depends(get_db),
    user: UserRead = Depends(check_permission("admin:access")),
):
    """Update a job position (Super Admin/HR Admin only)."""
    try:
        position = await job_position_service.update_position(db, user.id, position_id, position_in)
        if not position:
            raise HTTPException(status_code=404, detail="Position not found")
        return position
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{position_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_position(
    position_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: UserRead = Depends(check_permission("admin:access")),
):
    """Delete a job position (Super Admin/HR Admin only)."""
    try:
        success = await job_position_service.delete_position(db, user.id, position_id)
        if not success:
            raise HTTPException(status_code=404, detail="Position not found")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
