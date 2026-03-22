"""
Data access layer for transcript and recording operations.
Follows the same pattern as ResumeUploadRepository.
"""

from __future__ import annotations

import uuid

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.v1.db.models.interviews import Interview
from app.v1.db.models.recordings import Recording
from app.v1.db.models.transcripts import Transcript
from app.v1.db.models.files import File as FileRecord


class TranscriptRepository:
    """Repository for transcript and recording database operations."""

    # ------------------------------------------------------------------
    # Interview
    # ------------------------------------------------------------------

    async def get_interview(
        self, db: AsyncSession, interview_id: uuid.UUID
    ) -> Interview | None:
        """Retrieve an interview by ID."""
        return await db.get(Interview, interview_id)

    # ------------------------------------------------------------------
    # Recording
    # ------------------------------------------------------------------

    async def create_recording(
        self,
        db: AsyncSession,
        *,
        interview_id: uuid.UUID,
        file_id: uuid.UUID,
        format: str,
        processing_status: str = "uploaded",
    ) -> Recording:
        """Create a new recording record."""
        recording = Recording(
            interview_id=interview_id,
            file_id=file_id,
            format=format,
            processing_status=processing_status,
        )
        db.add(recording)
        await db.flush()
        return recording

    async def update_recording_status(
        self,
        db: AsyncSession,
        *,
        recording_id: uuid.UUID,
        status: str,
    ) -> None:
        """Update the processing_status of a recording."""
        await db.execute(
            update(Recording)
            .where(Recording.id == recording_id)
            .values(processing_status=status)
        )

    async def get_recording(
        self, db: AsyncSession, recording_id: uuid.UUID
    ) -> Recording | None:
        return await db.get(Recording, recording_id)

    # ------------------------------------------------------------------
    # File record
    # ------------------------------------------------------------------

    async def create_file_record(
        self,
        db: AsyncSession,
        *,
        owner_id: uuid.UUID,
        candidate_id: uuid.UUID,
        file_name: str,
        file_type: str,
        source_url: str,
        size: int,
    ) -> FileRecord:
        """Create a file record for the uploaded .docx transcript."""
        file_record = FileRecord(
            owner_id=owner_id,
            candidate_id=candidate_id,
            file_name=file_name,
            file_type=file_type,
            source_url=source_url,
            size=size,
        )
        db.add(file_record)
        await db.flush()
        return file_record

    # ------------------------------------------------------------------
    # Transcript
    # ------------------------------------------------------------------

    async def create_transcript(
        self,
        db: AsyncSession,
        *,
        recording_id: uuid.UUID,
        transcript_text: str | None = None,
        segments: dict | None = None,
    ) -> Transcript:
        """Create a new transcript record (initially empty, filled after processing)."""
        transcript = Transcript(
            recording_id=recording_id,
            transcript_text=transcript_text,
            segments=segments,
        )
        db.add(transcript)
        await db.flush()
        return transcript

    async def update_transcript(
        self,
        db: AsyncSession,
        *,
        transcript_id: uuid.UUID,
        transcript_text: str,
        segments: dict,
    ) -> None:
        """Persist the processed text and dialogue segments to the transcript."""
        await db.execute(
            update(Transcript)
            .where(Transcript.id == transcript_id)
            .values(
                transcript_text=transcript_text,
                segments=segments,
            )
        )

    async def get_transcript(
        self,
        db: AsyncSession,
        *,
        transcript_id: uuid.UUID,
    ) -> Transcript | None:
        """Retrieve a transcript with its recording relationship loaded."""
        return await db.scalar(
            select(Transcript)
            .options(selectinload(Transcript.recording))
            .where(Transcript.id == transcript_id)
        )

    # ------------------------------------------------------------------
    # Session helpers
    # ------------------------------------------------------------------

    async def commit(self, db: AsyncSession) -> None:
        await db.commit()

    async def rollback(self, db: AsyncSession) -> None:
        await db.rollback()

    async def flush(self, db: AsyncSession) -> None:
        await db.flush()


transcript_repository = TranscriptRepository()