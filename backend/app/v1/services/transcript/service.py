"""
Transcript upload service.

Handles .docx transcript upload, processing, and status retrieval.
Uses the actual Transcript model which links directly to interview_id and file_id.
"""

from __future__ import annotations

import uuid
from pathlib import Path

from fastapi import BackgroundTasks, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.v1.core.logging import get_logger
from app.v1.db.models.interviews import Interview
from app.v1.db.session import async_session_maker
from app.v1.repository.transcript_repository import transcript_repository
from app.v1.schemas.transcript import (
    DialogueTurn,
    TranscriptMetadata,
    TranscriptStatusResponse,
    TranscriptUploadResponse,
)
from app.v1.schemas.user import UserRead

from .processor import ALLOWED_CONTENT_TYPES, MAX_FILE_SIZE_BYTES, TranscriptProcessor

logger = get_logger(__name__)

TRANSCRIPT_UPLOAD_DIR = "uploads/transcripts"


class TranscriptService:

    def __init__(self) -> None:
        self.processor = TranscriptProcessor()

    async def upload_transcript(
        self,
        *,
        db: AsyncSession,
        interview_id: uuid.UUID,
        file: UploadFile,
        current_user: UserRead,
        background_tasks: BackgroundTasks,
    ) -> TranscriptUploadResponse:

        # --- Validate interview exists and get candidate_id ---
        result = await db.execute(
            select(Interview.candidate_id).where(Interview.id == interview_id)
        )
        candidate_id = result.scalar_one_or_none()
        if not candidate_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Interview not found.",
            )

        # --- Validate filename ---
        filename = file.filename or ""
        if not filename.lower().endswith(".docx"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only .docx transcript files are supported.",
            )

        # --- Validate MIME type ---
        if file.content_type and file.content_type not in ALLOWED_CONTENT_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid content type '{file.content_type}'. Upload a valid .docx file.",
            )

        # --- Read and validate size ---
        content = await file.read()
        if len(content) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file is empty.",
            )
        if len(content) > MAX_FILE_SIZE_BYTES:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File exceeds the {MAX_FILE_SIZE_BYTES // (1024 * 1024)} MB limit.",
            )

        # --- Save file to disk ---
        upload_root = Path(TRANSCRIPT_UPLOAD_DIR)
        target_dir = upload_root / str(interview_id)
        target_dir.mkdir(parents=True, exist_ok=True)
        target_path = target_dir / filename
        target_path.write_bytes(content)

        # --- Create file record ---
        file_record = await transcript_repository.create_file_record(
            db,
            owner_id=current_user.id,
            candidate_id=candidate_id,
            file_name=filename,
            file_type="docx",
            source_url=target_path.as_posix(),
            size=len(content),
        )

        # --- Create transcript record (initially empty) ---
        transcript = await transcript_repository.create_transcript(
            db,
            interview_id=interview_id,
            file_id=file_record.id,
        )

        await transcript_repository.commit(db)

        # --- Schedule background processing ---
        background_tasks.add_task(
            self._process_in_background,
            transcript_id=transcript.id,
            file_path=str(target_path),
        )

        logger.info(
            "transcript_upload_scheduled interview_id=%s transcript_id=%s",
            interview_id,
            transcript.id,
        )

        return TranscriptUploadResponse(
            recording_id=transcript.id,   # reusing field for compatibility
            transcript_id=transcript.id,
            interview_id=interview_id,
            status="processing",
            message="Transcript uploaded successfully. Processing has started.",
        )

    async def get_transcript_status(
        self,
        *,
        db: AsyncSession,
        transcript_id: uuid.UUID,
    ) -> TranscriptStatusResponse:
        transcript = await transcript_repository.get_transcript(
            db, transcript_id=transcript_id
        )
        if not transcript:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Transcript not found.",
            )

        segments = transcript.segments or {}
        processing_status = segments.get("status", "processing")
        if transcript.transcript_text:
            processing_status = "completed"
        if segments.get("error"):
            processing_status = "failed"

        metadata = None
        dialogues = []
        if segments.get("metadata"):
            metadata = TranscriptMetadata(**segments["metadata"])
        if segments.get("dialogues"):
            dialogues = [DialogueTurn(**d) for d in segments["dialogues"]]

        return TranscriptStatusResponse(
            transcript_id=transcript.id,
            recording_id=transcript.id,
            interview_id=transcript.interview_id,
            status=processing_status,
            metadata=metadata,
            dialogue_count=len(dialogues),
            dialogues=dialogues,
            clean_text=transcript.transcript_text,
            generated_at=transcript.generated_at,
            error=segments.get("error"),
        )

    async def _process_in_background(
        self,
        *,
        transcript_id: uuid.UUID,
        file_path: str,
    ) -> None:
        async with async_session_maker() as db:
            try:
                file_bytes = Path(file_path).read_bytes()
                result = self.processor.process(file_bytes)

                segments = {
                    "metadata":       result["metadata"],
                    "dialogues":      result["dialogues"],
                    "dialogue_count": result["dialogue_count"],
                    "status":         "completed",
                }

                await transcript_repository.update_transcript(
                    db,
                    transcript_id=transcript_id,
                    transcript_text=result["clean_text"],
                    segments=segments,
                )
                await transcript_repository.commit(db)

                logger.info(
                    "transcript_processing_completed transcript_id=%s dialogues=%d",
                    transcript_id,
                    result["dialogue_count"],
                )

            except Exception as exc:
                await transcript_repository.rollback(db)
                logger.exception(
                    "transcript_processing_failed transcript_id=%s error=%s",
                    transcript_id,
                    str(exc),
                )
                await transcript_repository.update_transcript(
                    db,
                    transcript_id=transcript_id,
                    transcript_text="",
                    segments={"error": str(exc), "status": "failed"},
                )
                await transcript_repository.commit(db)


transcript_service = TranscriptService()