"""
Interview management routes.

Endpoints:
    POST   /interviews                              — create interview session
    GET    /interviews/{interview_id}               — get interview details
    GET    /interviews/candidate/{candidate_id}     — list by candidate
    GET    /interviews/job/{job_id}                 — list by job
    PATCH  /interviews/{interview_id}/decision      — HR proceed/reject decision
"""

import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.v1.db.session import get_db
from app.v1.dependencies.auth import get_current_user
from app.v1.schemas.interview import (
    InterviewCreate,
    InterviewDecision,
    InterviewListResponse,
    InterviewRead,
)
from app.v1.schemas.user import UserRead
from app.v1.services.interview_service import interview_service

router = APIRouter()


@router.post(
    "/interviews",
    response_model=InterviewRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new interview session",
)
async def create_interview(
    data: InterviewCreate,
    db: AsyncSession = Depends(get_db),
    current_user: UserRead = Depends(get_current_user),
) -> InterviewRead:
    """
    Create an interview session for a candidate.

    The current user becomes the interviewer.
    The candidate must have passed resume screening (Stage 0) to enter Stage 1.
    """
    return await interview_service.create_interview(
        db=db,
        data=data,
        current_user=current_user,
    )


@router.get(
    "/interviews/{interview_id}",
    response_model=InterviewRead,
    status_code=status.HTTP_200_OK,
    summary="Get interview details",
)
async def get_interview(
    interview_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: UserRead = Depends(get_current_user),
) -> InterviewRead:
    """Retrieve a single interview session by ID."""
    return await interview_service.get_interview(
        db=db,
        interview_id=interview_id,
    )


@router.get(
    "/interviews/candidate/{candidate_id}",
    response_model=InterviewListResponse,
    status_code=status.HTTP_200_OK,
    summary="List interviews for a candidate",
)
async def get_interviews_for_candidate(
    candidate_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: UserRead = Depends(get_current_user),
) -> InterviewListResponse:
    """List all interview sessions for a specific candidate."""
    return await interview_service.get_interviews_for_candidate(
        db=db,
        candidate_id=candidate_id,
    )


@router.get(
    "/interviews/job/{job_id}",
    response_model=InterviewListResponse,
    status_code=status.HTTP_200_OK,
    summary="List interviews for a job",
)
async def get_interviews_for_job(
    job_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: UserRead = Depends(get_current_user),
) -> InterviewListResponse:
    """List all interview sessions for a specific job."""
    return await interview_service.get_interviews_for_job(
        db=db,
        job_id=job_id,
    )


@router.patch(
    "/interviews/{interview_id}/decision",
    response_model=InterviewRead,
    status_code=status.HTTP_200_OK,
    summary="Record HR proceed/reject decision",
)
async def record_decision(
    interview_id: uuid.UUID,
    decision: InterviewDecision,
    db: AsyncSession = Depends(get_db),
    current_user: UserRead = Depends(get_current_user),
) -> InterviewRead:
    """
    Record HR's decision after reviewing interview results.

    - `proceed` → candidate moves to next stage
    - `reject`  → candidate is marked as rejected
    """
    return await interview_service.record_decision(
        db=db,
        interview_id=interview_id,
        decision=decision,
        current_user=current_user,
    )