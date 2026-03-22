"""
Interview management service.

Handles creating interview sessions, retrieving interview data,
and recording HR decisions (proceed / reject).
"""

from __future__ import annotations

import uuid

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.v1.core.logging import get_logger
from app.v1.repository.interview_repository import interview_repository
from app.v1.schemas.interview import (
    InterviewCreate,
    InterviewDecision,
    InterviewListResponse,
    InterviewRead,
)
from app.v1.schemas.user import UserRead

logger = get_logger(__name__)

# Maps stage number to candidate status label
STAGE_STATUS_MAP = {
    1: "stage_1_pending",
    2: "stage_2_pending",
    3: "stage_3_pending",
    4: "stage_4_pending",
}


class InterviewService:
    """Service for managing interview sessions."""

    # ------------------------------------------------------------------
    # Create
    # ------------------------------------------------------------------

    async def create_interview(
        self,
        *,
        db: AsyncSession,
        data: InterviewCreate,
        current_user: UserRead,
    ) -> InterviewRead:
        """
        Create a new interview session for a candidate.

        Validates that the candidate and job both exist, then creates
        the interview record and updates the candidate's status.

        Raises:
            404: Candidate or job not found.
            400: Candidate did not pass resume screening (no PASS status).
        """
        candidate = await interview_repository.get_candidate(db, data.candidate_id)
        if not candidate:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Candidate not found.",
            )

        job = await interview_repository.get_job(db, data.job_id)
        if not job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Job not found.",
            )

        # Candidate must have passed resume screening to enter Stage 1
        if data.stage == 1 and candidate.current_status not in ("passed", "stage_1_pending"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Candidate has not passed resume screening. "
                    "Only candidates with PASS status can proceed to interviews."
                ),
            )

        interview = await interview_repository.create_interview(
            db,
            candidate_id=data.candidate_id,
            job_id=data.job_id,
            interviewer_id=current_user.id,
            stage=data.stage,
            status="pending",
        )

        # Update candidate's pipeline status
        new_candidate_status = STAGE_STATUS_MAP.get(data.stage, "interview_pending")
        await interview_repository.update_candidate_status(
            db,
            candidate_id=data.candidate_id,
            status=new_candidate_status,
        )

        await interview_repository.commit(db)

        logger.info(
            "interview_created interview_id=%s candidate_id=%s stage=%d",
            interview.id,
            data.candidate_id,
            data.stage,
        )

        return InterviewRead(
            id=interview.id,
            candidate_id=interview.candidate_id,
            job_id=interview.job_id,
            interviewer_id=interview.interviewer_id,
            stage=interview.stage,
            status=interview.status,
            created_at=interview.created_at,
        )

    # ------------------------------------------------------------------
    # Read
    # ------------------------------------------------------------------

    async def get_interview(
        self,
        *,
        db: AsyncSession,
        interview_id: uuid.UUID,
    ) -> InterviewRead:
        """
        Retrieve a single interview by ID.

        Raises:
            404: Interview not found.
        """
        interview = await interview_repository.get_interview(db, interview_id)
        if not interview:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Interview not found.",
            )

        return InterviewRead(
            id=interview.id,
            candidate_id=interview.candidate_id,
            job_id=interview.job_id,
            interviewer_id=interview.interviewer_id,
            stage=interview.stage,
            status=interview.status,
            created_at=interview.created_at,
        )

    async def get_interviews_for_candidate(
        self,
        *,
        db: AsyncSession,
        candidate_id: uuid.UUID,
    ) -> InterviewListResponse:
        """List all interviews for a candidate."""
        interviews = await interview_repository.get_interviews_for_candidate(
            db, candidate_id=candidate_id
        )
        items = [
            InterviewRead(
                id=i.id,
                candidate_id=i.candidate_id,
                job_id=i.job_id,
                interviewer_id=i.interviewer_id,
                stage=i.stage,
                status=i.status,
                created_at=i.created_at,
            )
            for i in interviews
        ]
        return InterviewListResponse(interviews=items, total=len(items))

    async def get_interviews_for_job(
        self,
        *,
        db: AsyncSession,
        job_id: uuid.UUID,
    ) -> InterviewListResponse:
        """List all interviews for a job."""
        interviews = await interview_repository.get_interviews_for_job(
            db, job_id=job_id
        )
        items = [
            InterviewRead(
                id=i.id,
                candidate_id=i.candidate_id,
                job_id=i.job_id,
                interviewer_id=i.interviewer_id,
                stage=i.stage,
                status=i.status,
                created_at=i.created_at,
            )
            for i in interviews
        ]
        return InterviewListResponse(interviews=items, total=len(items))

    # ------------------------------------------------------------------
    # HR Decision
    # ------------------------------------------------------------------

    async def record_decision(
        self,
        *,
        db: AsyncSession,
        interview_id: uuid.UUID,
        decision: InterviewDecision,
        current_user: UserRead,
    ) -> InterviewRead:
        """
        Record HR's proceed/reject decision after reviewing interview results.

        - proceed → marks interview 'completed', candidate moves to next stage
        - reject  → marks interview 'rejected', candidate marked 'rejected'

        Raises:
            404: Interview not found.
            400: Interview already has a final decision.
        """
        interview = await interview_repository.get_interview(db, interview_id)
        if not interview:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Interview not found.",
            )

        if interview.status in ("completed", "rejected", "cancelled"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Interview already has a final status: '{interview.status}'.",
            )

        if decision.decision == "proceed":
            new_interview_status = "completed"
            next_stage = interview.stage + 1
            new_candidate_status = STAGE_STATUS_MAP.get(next_stage, "stage_final_pending")
        else:
            new_interview_status = "rejected"
            new_candidate_status = "rejected"

        await interview_repository.update_interview_status(
            db,
            interview_id=interview_id,
            status=new_interview_status,
        )
        await interview_repository.update_candidate_status(
            db,
            candidate_id=interview.candidate_id,
            status=new_candidate_status,
        )
        await interview_repository.commit(db)

        logger.info(
            "interview_decision interview_id=%s decision=%s candidate_status=%s",
            interview_id,
            decision.decision,
            new_candidate_status,
        )

        return InterviewRead(
            id=interview.id,
            candidate_id=interview.candidate_id,
            job_id=interview.job_id,
            interviewer_id=interview.interviewer_id,
            stage=interview.stage,
            status=new_interview_status,
            created_at=interview.created_at,
        )


interview_service = InterviewService()