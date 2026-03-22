"""
API routes for candidate-related operations in version 1.
"""

import uuid
from typing import Any

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.v1.db.session import get_db
from app.v1.dependencies import check_permission
from app.v1.schemas.job_stage import StageEvaluationRead
from app.v1.schemas.upload import CandidateResponse
from app.v1.schemas.user import UserRead
from app.v1.services.admin_service import admin_service
from app.v1.schemas.response import PaginatedData

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


@router.get("/jobs/{job_id}/search", response_model=PaginatedData[CandidateResponse])
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


@router.get("/{candidate_id}/evaluations", response_model=list[StageEvaluationRead])
async def get_candidate_evaluations(
    candidate_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: UserRead = Depends(check_permission("candidates:access")),
) -> Any:
    """Get all interview stage evaluations for a specific candidate."""
    return await admin_service.get_candidate_evaluations(
        db=db, candidate_id=candidate_id
    )
