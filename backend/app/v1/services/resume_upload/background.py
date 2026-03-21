"""
Background task orchestration for resume processing.
"""

from __future__ import annotations

import hashlib
import time
import uuid

from fastapi import BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession

from app.v1.core.logging import get_logger
from app.v1.core.resume_executor import run_in_resume_executor
from app.v1.db.session import async_session_maker
from app.v1.repository.job_repository import job_repository
from app.v1.repository.resume_upload_repository import resume_upload_repository
from app.v1.schemas.upload import ResumeMatchAnalysis
from app.v1.utils.resume_upload import (
    extract_skill_names,
    split_name,
)

from .converters import build_processing_info, merge_processing_info
from .logging import log_event, log_stage
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
        background_tasks: BackgroundTasks,
    ) -> None:
        """Schedule the resume processing task in the background.

        Args:
            job_id: The job ID.
            resume_id: The resume ID.
            file_path: Path to the stored resume file.
            background_tasks: FastAPI background tasks.
        """
        background_tasks.add_task(
            self.process_resume_in_background,
            job_id=job_id,
            resume_id=resume_id,
            file_path=file_path,
        )

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
        """Full background processing workflow for an uploaded resume.

        Extracts text, normalizes data, generates embeddings, performs AI analysis,
        and persists everything to the database.

        Args:
            job_id: The job ID.
            resume_id: The resume ID.
            file_path: Path to the stored resume file.
        """
        total_started_at = time.perf_counter()
        log_event(
            event="background_started",
            job_id=job_id,
            resume_id=resume_id,
            file_path=file_path,
        )

        async with async_session_maker() as db:
            stage_started_at = time.perf_counter()
            resume_record = await resume_upload_repository.get_resume_for_job(
                db,
                job_id=job_id,
                resume_id=resume_id,
            )
            log_stage(
                stage="load_resume_for_background",
                started_at=stage_started_at,
                job_id=job_id,
                resume_id=resume_id,
            )
            if resume_record is None:
                logger.error(
                    "resume_processing missing resume_id=%s job_id=%s",
                    resume_id,
                    job_id,
                )
                return

            stage_started_at = time.perf_counter()
            resume_record.parse_summary = merge_processing_info(
                getattr(resume_record, "parse_summary", None),
                status_value="processing",
            )
            await resume_upload_repository.commit(db)
            log_stage(
                stage="mark_processing",
                started_at=stage_started_at,
                job_id=job_id,
                resume_id=resume_id,
            )

            candidate = resume_record.candidate
            stage_started_at = time.perf_counter()
            job = await job_repository.get(db, job_id)
            log_stage(
                stage="load_job",
                started_at=stage_started_at,
                job_id=job_id,
                resume_id=resume_id,
            )
            if job is None:
                await self._mark_resume_failed(
                    db=db,
                    resume_id=resume_record.id,
                    current_parse_summary=getattr(
                        resume_record, "parse_summary", None
                    ),
                    error_message="Job not found during background processing.",
                )
                return

            try:
                stage_started_at = time.perf_counter()
                raw_text, normalized = await run_in_resume_executor(
                    self.processor.process_resume,
                    file_path,
                )
                log_stage(
                    stage="extract_and_normalize",
                    started_at=stage_started_at,
                    job_id=job_id,
                    resume_id=resume_id,
                )

                # ---- Issue #25: content-level deduplication ------
                text_hash = hashlib.sha256(raw_text.encode()).hexdigest()
                stage_started_at = time.perf_counter()
                twin_resume = await resume_upload_repository.get_resume_by_text_hash_for_job(
                    db,
                    job_id=job_id,
                    text_hash=text_hash,
                    exclude_resume_id=resume_record.id,
                )
                if twin_resume is not None:
                    # Same text content found (e.g. pdf vs docx of same file).
                    # Copy the existing analysis instead of re-running LLM.
                    log_event(
                        event="content_dedup_hit",
                        job_id=job_id,
                        resume_id=resume_id,
                        twin_resume_id=twin_resume.id,
                    )
                    resume_record.parse_summary = twin_resume.parse_summary
                    resume_record.parsed = True
                    resume_record.resume_score = twin_resume.resume_score
                    resume_record.pass_fail = twin_resume.pass_fail
                    resume_record.text_hash = text_hash
                    await resume_upload_repository.commit(db)
                    log_stage(
                        stage="total_dedup",
                        started_at=total_started_at,
                        job_id=job_id,
                        resume_id=resume_id,
                    )
                    return
                # --------------------------------------------------

                parsed_name = (
                    str(normalized["name"][0]["text"]).strip()
                    if normalized["name"]
                    else None
                )
                parsed_email = (
                    str(normalized["email"][0]["text"]).strip()
                    if normalized["email"]
                    else None
                )
                parsed_phone = (
                    str(normalized["phone"][0]["text"]).strip()
                    if normalized["phone"]
                    else None
                )
                first_name, last_name = split_name(parsed_name)
                parsed_summary = {
                    "name": parsed_name,
                    "email": parsed_email,
                    "phone": parsed_phone,
                    "location": normalized["location"],
                    "skills": normalized["skills"],
                    "experience": normalized["experience"],
                    "education": normalized["education"],
                    "certifications": normalized["certifications"],
                    "links": normalized["links"],
                }
                extracted_skill_names_list = extract_skill_names(normalized)
                job_skills = await resume_upload_repository.get_job_skills(
                    db,
                    job_id=job_id,
                )

                stage_started_at = time.perf_counter()
                insights = await self.processor.generate_resume_insights(
                    raw_text=raw_text,
                    parsed_summary=parsed_summary,
                    job=job,
                    job_skills=job_skills,
                    candidate_skills=extracted_skill_names_list,
                )
                log_stage(
                    stage="analysis_and_embeddings",
                    started_at=stage_started_at,
                    job_id=job_id,
                    resume_id=resume_id,
                )

                stage_started_at = time.perf_counter()
                if insights["job_embedding"] and job.jd_embedding is None:
                    await resume_upload_repository.update_job_embedding(
                        db,
                        job=job,
                        embedding=insights["job_embedding"],
                    )
                log_stage(
                    stage="persist_job_embedding",
                    started_at=stage_started_at,
                    job_id=job_id,
                    resume_id=resume_id,
                )

                stage_started_at = time.perf_counter()
                await resume_upload_repository.update_skill_embeddings(
                    db,
                    embeddings_by_skill_id=insights["skill_embeddings"],
                )
                log_stage(
                    stage="persist_job_skill_embeddings",
                    started_at=stage_started_at,
                    job_id=job_id,
                    resume_id=resume_id,
                    count=len(insights["skill_embeddings"]),
                )

                stage_started_at = time.perf_counter()
                await resume_upload_repository.update_candidate_profile(
                    db,
                    candidate=candidate,
                    first_name=first_name,
                    last_name=last_name,
                    email=parsed_email,
                    phone=parsed_phone,
                    info=parsed_summary,
                    info_embedding=insights["candidate_embedding"],
                )
                log_stage(
                    stage="persist_candidate_profile",
                    started_at=stage_started_at,
                    job_id=job_id,
                    resume_id=resume_id,
                )

                analysis = ResumeMatchAnalysis.model_validate(
                    insights["analysis"]
                )
                parse_summary_with_analysis = {
                    **parsed_summary,
                    "analysis": analysis.model_dump(),
                    "processing": build_processing_info(
                        status_value="completed"
                    ),
                }
                resume_record.parsed = True
                resume_record.parse_summary = parse_summary_with_analysis
                resume_record.resume_score = analysis.match_percentage
                resume_record.pass_fail = analysis.match_percentage >= 65.0
                resume_record.text_hash = text_hash

                stage_started_at = time.perf_counter()
                await resume_upload_repository.create_resume_chunk(
                    db,
                    resume_id=resume_record.id,
                    parsed_json=parse_summary_with_analysis,
                    raw_text=raw_text,
                    chunk_embedding=insights["chunk_embedding"],
                )
                log_stage(
                    stage="create_resume_chunk",
                    started_at=stage_started_at,
                    job_id=job_id,
                    resume_id=resume_id,
                )

                stage_started_at = time.perf_counter()
                candidate_skill_records = (
                    await resume_upload_repository.sync_candidate_skills(
                        db,
                        candidate_id=candidate.id,
                        skill_names=extracted_skill_names_list,
                    )
                )
                log_stage(
                    stage="sync_candidate_skills",
                    started_at=stage_started_at,
                    job_id=job_id,
                    resume_id=resume_id,
                    count=len(candidate_skill_records),
                )

                stage_started_at = time.perf_counter()
                candidate_skill_embeddings = await run_in_resume_executor(
                    self.processor.generate_skill_embeddings,
                    candidate_skill_records,
                )
                log_stage(
                    stage="candidate_skill_embeddings",
                    started_at=stage_started_at,
                    job_id=job_id,
                    resume_id=resume_id,
                )
                stage_started_at = time.perf_counter()
                await resume_upload_repository.update_skill_embeddings(
                    db,
                    embeddings_by_skill_id=candidate_skill_embeddings,
                )
                log_stage(
                    stage="persist_candidate_skill_embeddings",
                    started_at=stage_started_at,
                    job_id=job_id,
                    resume_id=resume_id,
                    count=len(candidate_skill_embeddings),
                )

                stage_started_at = time.perf_counter()
                await resume_upload_repository.commit(db)
                log_stage(
                    stage="commit_completed_resume",
                    started_at=stage_started_at,
                    job_id=job_id,
                    resume_id=resume_id,
                )
                log_stage(
                    stage="total",
                    started_at=total_started_at,
                    job_id=job_id,
                    resume_id=resume_id,
                )
            except Exception as exc:
                parse_summary_snapshot = getattr(
                    resume_record, "parse_summary", None
                )
                await resume_upload_repository.rollback(db)
                logger.exception(
                    "resume_processing failed job_id=%s resume_id=%s",
                    job_id,
                    resume_id,
                )
                await self._mark_resume_failed(
                    db=db,
                    resume_id=resume_record.id,
                    current_parse_summary=parse_summary_snapshot,
                    error_message=str(exc),
                )
                log_stage(
                    stage="total_failed",
                    started_at=total_started_at,
                    job_id=job_id,
                    resume_id=resume_id,
                )
