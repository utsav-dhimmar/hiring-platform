"""
Background task orchestration for resume processing.
"""

from __future__ import annotations

import uuid


from sqlalchemy.ext.asyncio import AsyncSession

from app.v1.core.logging import get_logger
from app.v1.repository.resume_upload_repository import resume_upload_repository

from .converters import merge_processing_info
from .processor import ResumeProcessor

logger = get_logger(__name__)


class BackgroundProcessor:
    """Orchestrator for background resume processing tasks."""

    def __init__(self, processor: ResumeProcessor) -> None:
        self.processor = processor

    def schedule_processing(
        self,
        *,
        job_id: uuid.UUID,
        resume_id: uuid.UUID,
        file_path: str,
    ) -> None:
        """Schedule the resume processing task via Celery.

        Args:
            job_id: The job ID.
            resume_id: The resume ID.
            file_path: Path to the stored resume file.
        """
        from .tasks import process_resume_task
        
        process_resume_task.delay(
            job_id_str=str(job_id),
            resume_id_str=str(resume_id),
            file_path=file_path
        )
        logger.info("Celery task scheduled for resume_id=%s", resume_id)

    async def _mark_resume_failed(
        self,
        *,
        db: AsyncSession,
        resume_id: uuid.UUID,
        current_parse_summary: dict[str, object] | None,
        error_message: str,
    ) -> None:
        """Helper to mark a resume as failed in the DB and commit.

        Args:
            db: Async session.
            resume_id: ID of the resume to mark as failed.
            current_parse_summary: Current summary to merge the error into.
            error_message: The failure reason.
        """
        failed_summary = merge_processing_info(
            current_parse_summary,
            status_value="failed",
            error=error_message,
        )
        await resume_upload_repository.mark_resume_failed(
            db,
            resume_id=resume_id,
            parse_summary=failed_summary,
        )
        await resume_upload_repository.commit(db)

    async def process_resume_in_background(
        self,
        *,
        job_id: uuid.UUID,
        resume_id: uuid.UUID,
        file_path: str,
    ) -> None:
        from .pipeline import run_resume_processing_pipeline
        await run_resume_processing_pipeline(
            job_id=job_id,
            resume_id=resume_id,
            file_path=file_path,
            processor=self.processor,
            mark_failed_cb=self._mark_resume_failed,
        )

    def schedule_mass_refresh(self, job_id: uuid.UUID) -> None:
        """Schedule a background task to refresh custom extractions for all resumes of a job."""
        from .tasks import mass_refresh_task
        mass_refresh_task.delay(job_id_str=str(job_id))
        logger.info("Celery task scheduled for mass refresh job_id=%s", job_id)

    async def mass_refresh_in_background(
        self,
        *,
        job_id: uuid.UUID,
    ) -> None:
        """Re-run custom extraction for all uploaded resumes of a job."""
        from sqlalchemy import select
        from sqlalchemy.orm.attributes import flag_modified

        from app.v1.db.models.resume_chunks import ResumeChunk
        from app.v1.db.session import async_session_maker
        from app.v1.repository.job_repository import job_repository
        from app.v1.repository.resume_upload_repository import resume_upload_repository
        from app.v1.services.resume_upload.custom_extractor import custom_extractor_service

        logger.info("Starting mass refresh in background for job_id=%s", job_id)
        async with async_session_maker() as db:
            job = await job_repository.get(db, job_id)
            if not job or not job.custom_extraction_fields:
                logger.warning("Job %s has no custom fields for mass refresh", job_id)
                return

            resumes = await resume_upload_repository.get_resumes_for_job(db, job_id=job_id)
            updated = 0

            for resume in resumes:
                chunk = await db.scalar(
                    select(ResumeChunk).where(ResumeChunk.resume_id == resume.id).limit(1)
                )
                if not chunk or not chunk.raw_text:
                    continue

                custom_extractions = await custom_extractor_service.extract_background_custom_fields(
                    raw_text=chunk.raw_text,
                    fields_list=job.custom_extraction_fields,
                )

                if custom_extractions:
                    # Update resume.parse_summary
                    if resume.parse_summary and isinstance(resume.parse_summary, dict):
                        new_summary = dict(resume.parse_summary)
                        if "analysis" in new_summary and isinstance(new_summary["analysis"], dict):
                            new_summary["analysis"] = dict(new_summary["analysis"])
                            new_summary["analysis"]["custom_extractions"] = custom_extractions
                        resume.parse_summary = new_summary
                        flag_modified(resume, "parse_summary")

                    # Update chunk.parsed_json
                    if chunk.parsed_json and isinstance(chunk.parsed_json, dict):
                        new_parsed = dict(chunk.parsed_json)
                        if "analysis" in new_parsed and isinstance(new_parsed["analysis"], dict):
                            new_parsed["analysis"] = dict(new_parsed["analysis"])
                            new_parsed["analysis"]["custom_extractions"] = custom_extractions
                        chunk.parsed_json = new_parsed
                        flag_modified(chunk, "parsed_json")

                    updated += 1

            await resume_upload_repository.commit(db)
            logger.info("Completed mass refresh for job_id=%s, %d resumes updated", job_id, updated)

