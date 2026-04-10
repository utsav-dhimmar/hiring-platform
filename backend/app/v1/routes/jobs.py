"""
API routes for job-related operations in version 1.
"""

import uuid
from typing import Any

from fastapi import APIRouter, BackgroundTasks, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.v1.db.session import get_db
from app.v1.dependencies import check_permission
from app.v1.schemas.job import (
    JobCreate,
    JobRead,
    JobVersionRead,
    JobStatusUpdate,
    JobsListRead,
    JobUpdate,
    JobActivityHistoryResponse,
)
from app.v1.schemas.job_stage import (
    JobStageConfigCreate,
    JobStageConfigRead,
    JobStageConfigUpdate,
    JobStageReorder,
)
from app.v1.schemas.upload import JobResumesResponse
from app.v1.schemas.user import UserRead
from app.v1.services.admin_service import admin_service
from app.v1.services.job_service import job_service
from app.v1.services.resume_upload_service import resume_upload_service
from app.v1.services.stage_service import stage_service

router = APIRouter()


@router.get("", response_model=JobsListRead)
async def read_jobs(
    db: AsyncSession = Depends(get_db),
    user: UserRead = Depends(check_permission("jobs:access")),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    q: str | None = Query(None),
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
    return await job_service.get_jobs(db=db, skip=skip, limit=limit, query=q)


@router.get("/search", response_model=JobsListRead)
async def search_jobs(
    db: AsyncSession = Depends(get_db),
    user: UserRead = Depends(check_permission("jobs:access")),
    q: str = Query(..., min_length=1),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
) -> Any:
    """
    Search for jobs by title and description.

    Args:
        db (AsyncSession): Database session.
        q (str): The search query.
        skip (int): Number of records to skip.
        limit (int): Maximum number of records to return.

    Returns:
        Any: A list of matching jobs.
    """
    return await job_service.search_jobs(db=db, query=q, skip=skip, limit=limit)


@router.post("", response_model=JobRead, status_code=status.HTTP_201_CREATED)
async def create_job(
    *,
    db: AsyncSession = Depends(get_db),
    user: UserRead = Depends(check_permission("jobs:manage")),
    job_in: JobCreate,
) -> Any:
    """Create a new job."""
    return await admin_service.create_job(db=db, admin_user_id=user.id, job_in=job_in)


from app.v1.services.hr_decision_service import hr_decision_service


@router.get("/{job_id}", response_model=JobRead)
async def get_job(
    job_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: UserRead = Depends(check_permission("jobs:access")),
) -> Any:
    """Get a specific job by ID."""
    job = await admin_service.get_job_by_id(db=db, job_id=job_id)

    # Attach decision stats to avoid extra API call from frontend
    stats = await hr_decision_service.get_job_decision_summary(db=db, job_id=job_id)
    job.decision_summary = stats.model_dump()

    # Attach screening stats
    screening_stats = await hr_decision_service.get_job_screening_summary(
        db=db, job_id=job_id
    )
    job.automated_screening_summary = screening_stats

    return job


@router.get("/versions/{version_id}", response_model=JobVersionRead)
async def get_job_version(
    version_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: UserRead = Depends(check_permission("jobs:access")),
) -> Any:
    """Get a specific job version snapshot by its unique ID."""
    return await admin_service.get_job_version(db=db, version_id=version_id)


@router.get(
    "/{job_id}/resumes",
    response_model=JobResumesResponse,
    status_code=status.HTTP_200_OK,
)
async def get_job_resumes(
    job_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _user: UserRead = Depends(check_permission("jobs:access")),
) -> JobResumesResponse:
    """Retrieve all resumes uploaded for a specific job."""
    return await resume_upload_service.get_resumes_for_job(
        db=db,
        job_id=job_id,
    )


@router.patch("/{job_id}", response_model=JobRead)
async def update_job(
    job_id: uuid.UUID,
    *,
    db: AsyncSession = Depends(get_db),
    user: UserRead = Depends(check_permission("jobs:manage")),
    job_update: JobUpdate,
    background_tasks: BackgroundTasks,
) -> Any:
    """Update a job. Automatically refreshes resumes if custom_extraction_fields changed."""
    return await admin_service.update_job(
        db=db,
        admin_user_id=user.id,
        job_id=job_id,
        job_update=job_update,
        background_tasks=background_tasks,
    )


@router.patch("/{job_id}/status", response_model=JobRead)
async def update_job_status(
    job_id: uuid.UUID,
    *,
    db: AsyncSession = Depends(get_db),
    user: UserRead = Depends(check_permission("jobs:manage")),
    status_in: JobStatusUpdate,
) -> Any:
    """Update job active status without incrementing version."""
    return await admin_service.update_job_status(
        db=db, admin_user_id=user.id, job_id=job_id, status_in=status_in
    )


@router.get("/{job_id}/activity-history", response_model=JobActivityHistoryResponse)
async def get_job_activity_history(
    job_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: UserRead = Depends(check_permission("jobs:access")),
) -> Any:
    """
    Get the activity history for a specific job.
    Shows activation sessions and candidate counts per session.
    """
    return await admin_service.get_job_activity_history(db=db, job_id=job_id)


@router.delete("/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_job(
    job_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: UserRead = Depends(check_permission("jobs:manage")),
) -> None:
    """Delete a job."""
    await admin_service.delete_job(db=db, admin_user_id=user.id, job_id=job_id)


# --- Job Stage Configuration ---


@router.get("/{job_id}/stages", response_model=list[JobStageConfigRead])
async def get_job_stages(
    job_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: UserRead = Depends(check_permission("jobs:access")),
) -> Any:
    """Retrieve the ordered interview stages for a job."""
    return await stage_service.get_job_stages(db=db, job_id=job_id)


@router.post(
    "/{job_id}/stages",
    response_model=JobStageConfigRead,
    status_code=status.HTTP_201_CREATED,
)
async def add_stage_to_job(
    job_id: uuid.UUID,
    *,
    db: AsyncSession = Depends(get_db),
    user: UserRead = Depends(check_permission("jobs:manage")),
    stage_in: JobStageConfigCreate,
) -> Any:
    """Add a new stage to a job's interview process."""
    return await stage_service.add_stage_to_job(db=db, job_id=job_id, stage_in=stage_in)


@router.patch("/{job_id}/stages/{config_id}", response_model=JobStageConfigRead)
async def update_job_stage(
    job_id: uuid.UUID,
    config_id: uuid.UUID,
    *,
    db: AsyncSession = Depends(get_db),
    user: UserRead = Depends(check_permission("jobs:manage")),
    stage_update: JobStageConfigUpdate,
) -> Any:
    """Update a specific job stage configuration."""
    # Verify the config belongs to the job (optional but good practice)
    config = await stage_service.update_job_stage(
        db=db, config_id=config_id, stage_update=stage_update
    )
    return config


@router.delete("/{job_id}/stages/{config_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_stage_from_job(
    job_id: uuid.UUID,
    config_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: UserRead = Depends(check_permission("jobs:manage")),
) -> None:
    """Remove a stage from a job's interview process."""
    await stage_service.remove_stage_from_job(db=db, config_id=config_id)


@router.put("/{job_id}/stages/reorder", response_model=list[JobStageConfigRead])
async def reorder_job_stages(
    job_id: uuid.UUID,
    *,
    db: AsyncSession = Depends(get_db),
    user: UserRead = Depends(check_permission("jobs:manage")),
    reorder_in: JobStageReorder,
) -> Any:
    """Bulk update the order of stages for a job."""
    return await stage_service.reorder_job_stages(
        db=db, job_id=job_id, stage_ids=reorder_in.stage_ids
    )
