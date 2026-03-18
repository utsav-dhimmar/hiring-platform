from typing import Any
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.v1.db.session import get_db
from packages.jobs.v1.schema.job import JobRead
from packages.jobs.v1.services.job_service import job_service

router = APIRouter()


@router.get("/", response_model=list[JobRead])
async def read_jobs(
    db: AsyncSession = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve jobs.
    """
    jobs_data = await job_service.get_jobs(db=db, skip=skip, limit=limit)
    return jobs_data["data"]
