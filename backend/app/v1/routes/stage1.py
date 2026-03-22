"""
Stage 1 evaluation route.

Endpoint:
    POST /interviews/{interview_id}/evaluate
         → triggers LLM evaluation for the linked transcript
         → returns the full evaluation result

HR workflow:
    1. Upload transcript  →  POST /interviews/{id}/transcript
    2. Poll until ready   →  GET  /interviews/{id}/transcript/{tid}
    3. Trigger evaluation →  POST /interviews/{id}/evaluate?transcript_id={tid}
    4. View result        →  included in response
    5. Make decision      →  PATCH /interviews/{id}/decision
"""

import uuid

from fastapi import APIRouter, Depends, Query, status, File, UploadFile, Form
from sqlalchemy.ext.asyncio import AsyncSession

from app.v1.db.session import get_db
from app.v1.dependencies.auth import get_current_user
from app.v1.schemas.user import UserRead
from app.v1.services.stage1 import stage1_service

router = APIRouter()


@router.post(
    "/interviews/{interview_id}/evaluate",
    status_code=status.HTTP_200_OK,
    summary="Run Stage 1 LLM evaluation",
)
async def run_stage1_evaluation(
    interview_id: uuid.UUID,
    transcript_id: uuid.UUID = Query(..., description="ID of the completed transcript to evaluate"),
    db: AsyncSession = Depends(get_db),
    current_user: UserRead = Depends(get_current_user),
) -> dict:
    """
    Trigger the Stage 1 LLM-as-a-Judge evaluation for a completed transcript.

    The transcript must have `processing_status = completed` before calling this.

    Returns the full evaluation including per-criterion scores, red flags,
    weighted stage score, recommendation (PROCEED/REJECT/MAYBE), and summaries.
    """
    return await stage1_service.run_evaluation(
        db=db,
        interview_id=interview_id,
        transcript_id=transcript_id,
    )

