"""
Transcript upload routes.

Endpoints:
    POST /interviews/{interview_id}/transcript  — upload .docx transcript
    GET  /interviews/{interview_id}/transcript/{transcript_id} — get status + result
"""

import uuid

from fastapi import APIRouter, BackgroundTasks, Depends, File, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.v1.db.session import get_db
from app.v1.dependencies.auth import get_current_user
from app.v1.schemas.transcript import TranscriptStatusResponse, TranscriptUploadResponse
from app.v1.schemas.user import UserRead
from app.v1.services.transcript import transcript_service
from app.v1.services.transcript.processor import TranscriptProcessor

router = APIRouter()


@router.post(
    "/interviews/{interview_id}/transcript",
    response_model=TranscriptUploadResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Upload a .docx interview transcript",
)
async def upload_transcript(
    interview_id: uuid.UUID,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: UserRead = Depends(get_current_user),
) -> TranscriptUploadResponse:
    """
    Upload a .docx interview transcript for a specific interview session.

    The file is saved immediately and processed asynchronously.
    Poll the status endpoint to get the parsed dialogues and metadata.
    """
    return await transcript_service.upload_transcript(
        db=db,
        interview_id=interview_id,
        file=file,
        current_user=current_user,
        background_tasks=background_tasks,
    )


@router.get(
    "/interviews/{interview_id}/transcript/{transcript_id}",
    response_model=TranscriptStatusResponse,
    status_code=status.HTTP_200_OK,
    summary="Get transcript processing status and result",
)
async def get_transcript_status(
    interview_id: uuid.UUID,
    transcript_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: UserRead = Depends(get_current_user),
) -> TranscriptStatusResponse:
    """
    Retrieve the current processing status and parsed content of a transcript.

    Status values: uploaded → processing → completed | failed
    """
    return await transcript_service.get_transcript_status(
        db=db,
        transcript_id=transcript_id,
    )

