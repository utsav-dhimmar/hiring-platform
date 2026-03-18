"""
API routes for job-related operations in version 1.
"""

from typing import Any

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.v1.db.session import get_db
from app.v1.schemas.job import JobRead
from app.v1.services.job_service import job_service

router = APIRouter()


@router.get("/", response_model=list[JobRead])
async def read_jobs(
    db: AsyncSession = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
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
