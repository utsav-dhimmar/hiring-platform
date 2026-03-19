"""
API routes for job-related operations in version 1.
"""

import uuid
from typing import Any

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.v1.db.session import get_db
from app.v1.dependencies.dependencies import check_permission
from app.v1.schemas.job import JobCreate, JobRead, JobUpdate
from app.v1.schemas.user import UserRead
from app.v1.services.admin_service import admin_service
from app.v1.services.job_service import job_service

router = APIRouter()


@router.get("/", response_model=list[JobRead])
async def read_jobs(
    db: AsyncSession = Depends(get_db),
    user: UserRead = Depends(check_permission("jobs:access")),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
) -> Any:
    """
    Retrieve a list of jobs with pagination.

    Args:
        db (AsyncSession): Database session.
        skip (int): Number of records to skip.
        limit (int): Maximum number of records to return.

    Returns:
        Any: A list of jobs.
    """
    jobs_data = await job_service.get_jobs(db=db, skip=skip, limit=limit)
    return jobs_data["data"]


@router.post("/", response_model=JobRead, status_code=status.HTTP_201_CREATED)
async def create_job(
    *,
    db: AsyncSession = Depends(get_db),
    user: UserRead = Depends(check_permission("jobs:manage")),
    job_in: JobCreate,
) -> Any:
    """Create a new job."""
    return await admin_service.create_job(db=db, admin_user_id=user.id, job_in=job_in)


@router.get("/{job_id}", response_model=JobRead)
async def get_job(
    job_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: UserRead = Depends(check_permission("jobs:access")),
) -> Any:
    """Get a specific job by ID."""
    return await admin_service.get_job_by_id(db=db, job_id=job_id)


@router.patch("/{job_id}", response_model=JobRead)
async def update_job(
    job_id: uuid.UUID,
    *,
    db: AsyncSession = Depends(get_db),
    user: UserRead = Depends(check_permission("jobs:manage")),
    job_update: JobUpdate,
) -> Any:
    """Update a job."""
    return await admin_service.update_job(
        db=db, admin_user_id=user.id, job_id=job_id, job_update=job_update
    )


@router.delete("/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_job(
    job_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: UserRead = Depends(check_permission("jobs:manage")),
) -> None:
    """Delete a job."""
    await admin_service.delete_job(db=db, admin_user_id=user.id, job_id=job_id)
