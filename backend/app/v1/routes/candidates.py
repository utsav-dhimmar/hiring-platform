"""
API routes for candidate-related operations in version 1.
"""

import uuid
from typing import Any

from app.v1.db.session import get_db
from app.v1.dependencies import check_permission
from app.v1.schemas.response import PaginatedData
from app.v1.schemas.upload import CandidateResponse
from app.v1.schemas.user import UserRead
from app.v1.services.admin_service import admin_service
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
router = APIRouter()


@router.get("/search", response_model=PaginatedData[CandidateResponse])
async def search_candidates(
    query: str = Query(..., min_length=1),
    db: AsyncSession = Depends(get_db),
    user: UserRead = Depends(check_permission("candidates:access")),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
) -> Any:
    """Search candidates across all jobs."""
    return await admin_service.search_candidates(
        db=db, query=query, skip=skip, limit=limit
    )


@router.get("/jobs/{job_id}", response_model=PaginatedData[CandidateResponse])
async def get_job_candidates(
    job_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: UserRead = Depends(check_permission("candidates:access")),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
) -> Any:
    """Get all candidates for a specific job."""
    return await admin_service.get_candidates_for_job(
        db=db, job_id=job_id, skip=skip, limit=limit
    )


@router.get(
    "/jobs/{job_id}/search", response_model=PaginatedData[CandidateResponse]
)
async def search_job_candidates(
    job_id: uuid.UUID,
    query: str = Query(..., min_length=1),
    db: AsyncSession = Depends(get_db),
    user: UserRead = Depends(check_permission("candidates:access")),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
) -> Any:
    """Search candidates for a specific job."""
    return await admin_service.search_candidates_for_job(
        db=db, job_id=job_id, query=query, skip=skip, limit=limit
    )


@router.get(
    "/{candidate_id}/evaluations",
    include_in_schema=False,
)
async def get_candidate_evaluations(
    candidate_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: UserRead = Depends(check_permission("candidates:access")),
) -> Any:
    """Retired: Get all interview stage evaluations for a specific candidate."""
    from fastapi import HTTPException

    raise HTTPException(
        status_code=410, detail="Evaluation features are disabled."
    )


@router.get(
    "/{candidate_id}/evaluations/{stage_config_id}",
    include_in_schema=False,
)
async def get_candidate_stage_evaluation(
    candidate_id: uuid.UUID,
    stage_config_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: UserRead = Depends(check_permission("candidates:access")),
) -> Any:
    """Retired: Get a specific interview stage evaluation for a candidate."""
    from fastapi import HTTPException

    raise HTTPException(
        status_code=410, detail="Evaluation features are disabled."
    )
