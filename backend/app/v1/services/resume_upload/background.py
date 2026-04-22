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
        existing_resume_id: uuid.UUID | None = None,
    ) -> None:
        """Schedule the resume processing task via Celery.

        Args:
            job_id: The job ID.
            resume_id: The resume ID.
            file_path: Path to the stored resume file.
            existing_resume_id: Optional ID of an existing resume to copy data from.
        """
        from .tasks import process_resume_task

        process_resume_task.delay(
            job_id_str=str(job_id),
            resume_id_str=str(resume_id),
            file_path=file_path,
            existing_resume_id_str=str(existing_resume_id) if existing_resume_id else None,
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
        existing_resume_id: uuid.UUID | None = None,
    ) -> None:
        from .pipeline import run_resume_processing_pipeline

        await run_resume_processing_pipeline(
            job_id=job_id,
            resume_id=resume_id,
            file_path=file_path,
            processor=self.processor,
            mark_failed_cb=self._mark_resume_failed,
            existing_resume_id=existing_resume_id,
        )

    def schedule_mass_refresh(
        self, job_id: uuid.UUID, full_refresh: bool = False
    ) -> None:
        """Schedule a background task to refresh extractions for all resumes of a job."""
        from .tasks import mass_refresh_task

        mass_refresh_task.delay(job_id_str=str(job_id), full_refresh=full_refresh)
        logger.info(
            "Celery task scheduled for mass refresh job_id=%s, full_refresh=%s",
            job_id,
            full_refresh,
        )

    def schedule_candidate_reanalyze(
        self, job_id: uuid.UUID, candidate_id: uuid.UUID
    ) -> None:
        """Schedule a background task to reanalyze a single candidate against the latest JD version."""
        from .tasks import reanalyze_candidate_task

        reanalyze_candidate_task.delay(
            job_id_str=str(job_id), candidate_id_str=str(candidate_id)
        )
        logger.info(
            "Celery task scheduled for candidate reanalysis. job_id=%s, candidate_id=%s",
            job_id,
            candidate_id,
        )

    def schedule_cross_match(
        self, resume_id: uuid.UUID, original_job_id: uuid.UUID
    ) -> None:
        """Schedule a background task to run cross-job matching for a resume."""
        from .tasks import cross_match_resume_task

        cross_match_resume_task.delay(
            resume_id_str=str(resume_id), original_job_id_str=str(original_job_id)
        )
        logger.info(
            "Celery task scheduled for cross-job matching. resume_id=%s", resume_id
        )

    async def mass_refresh_in_background(
        self,
        *,
        job_id: uuid.UUID,
        full_refresh: bool = False,
    ) -> None:
        """Re-run extraction/analysis for all uploaded resumes of a job."""
        from app.v1.db.session import async_session_maker
        from app.v1.repository.resume_upload_repository import resume_upload_repository
        from app.v1.services.resume_upload.pipeline import run_resume_processing_pipeline

        logger.info(
            "Starting mass refresh in background for job_id=%s (full_refresh=%s)",
            job_id,
            full_refresh,
        )
        async with async_session_maker() as db:
            resumes = await resume_upload_repository.get_resumes_for_job(
                db, job_id=job_id
            )
            count = 0
            for resume in resumes:
                if not resume.parsed:
                    continue
                
                # We can reuse the main pipeline with reanalyze=True
                # because the resume is already parsed and stored.
                # (Note: full_refresh in this context means we trigger LLM analysis 
                # against the current JD version).
                if full_refresh:
                    await run_resume_processing_pipeline(
                        job_id=job_id,
                        resume_id=resume.id,
                        file_path=resume.file.source_url if resume.file else "",
                        processor=self.processor,
                        mark_failed_cb=self._mark_resume_failed,
                        reanalyze=True
                    )
                    count += 1
            
            logger.info("Completed mass refresh for job_id=%s, %d resumes processed", job_id, count)

    async def reanalyze_candidate_in_background(
        self,
        *,
        job_id: uuid.UUID,
        candidate_id: uuid.UUID,
    ) -> None:
        """Re-run extraction/analysis for a single candidate based on latest JD."""
        from sqlalchemy import select
        from sqlalchemy.orm import selectinload
        from app.v1.db.models.resumes import Resume
        from app.v1.db.session import async_session_maker
        from app.v1.services.resume_upload.pipeline import run_resume_processing_pipeline

        logger.info("Starting candidate re-analysis for candidate_id=%s", candidate_id)
        async with async_session_maker() as db:
            resume = await db.scalar(
                select(Resume)
                .options(selectinload(Resume.file))
                .where(Resume.candidate_id == candidate_id, Resume.parsed.is_(True))
                .order_by(Resume.uploaded_at.desc())
                .limit(1)
            )
            if not resume:
                logger.warning("No parsed resume found for candidate %s, skipping re-analysis", candidate_id)
                return
            
            file_path = ""
            if resume.file:
                file_path = resume.file.source_url
            else:
                from app.v1.db.models.files import File
                file_rec = await db.get(File, resume.file_id)
                if file_rec:
                    file_path = file_rec.source_url

            # Delegate to the unified pipeline
            await run_resume_processing_pipeline(
                job_id=job_id,
                resume_id=resume.id,
                file_path=file_path,
                processor=self.processor,
                mark_failed_cb=self._mark_resume_failed,
                reanalyze=True
            )
            
            logger.info(
                "Completed candidate re-analysis for candidate_id=%s", candidate_id
            )
