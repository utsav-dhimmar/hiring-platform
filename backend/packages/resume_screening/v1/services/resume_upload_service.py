"""
Resume upload service module.

This module provides the business logic for handling resume uploads,
queuing them for processing, and exposing status/result retrieval.
"""

from __future__ import annotations

import asyncio
import time
import uuid
from datetime import UTC, datetime
from pathlib import Path
from uuid import uuid7

from fastapi import HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.v1.core.config import settings
from app.v1.core.logging_config import get_logger
from app.v1.core.resume_executor import run_in_resume_executor
from app.v1.db.session import async_session_maker
from packages.auth.v1.schema.user import UserRead
from packages.jobs.v1.schema.job import JobRead
from packages.resume_screening.v1.repository import resume_upload_repository
from packages.resume_screening.v1.schemas.upload import (
    CandidateResponse,
    JobCandidatesResponse,
    JobResumeInfoResponse,
    JobResumesResponse,
    ResumeMatchAnalysis,
    ResumeProcessingInfo,
    ResumeStatusResponse,
    ResumeUploadResponse,
)
from packages.resume_screening.v1.services.embeddings import (
    ResumeJdAnalyzer,
    build_candidate_text,
    build_job_text,
    build_skill_text,
    encode_jd,
    encode_resume,
    encode_skill,
    get_semantic_score_from_embeddings,
)
from packages.resume_screening.v1.services.extractor import (
    DocumentParser,
    ResumeLLMExtractor,
)
from packages.resume_screening.v1.utils import (
    extract_skill_names,
    normalize_extractions,
    split_name,
)

logger = get_logger(__name__)

_background_tasks: set[asyncio.Task[None]] = set()


class ResumeUploadService:
    """Service for handling resume upload and processing."""

    def __init__(self) -> None:
        self.extractor = ResumeLLMExtractor()
        self.analyzer = ResumeJdAnalyzer()

    @staticmethod
    def _build_processing_info(
        *,
        status_value: str,
        error: str | None = None,
    ) -> dict[str, str]:
        """Build a dictionary representing resume processing status.

        Args:
            status_value: The string status (e.g., 'queued', 'processing', 'completed', 'failed').
            error: Optional error message if the processing failed.

        Returns:
            A dictionary with status and optional error.
        """
        processing = {"status": status_value}
        if error:
            processing["error"] = error
        return processing

    @staticmethod
    def _merge_processing_info(
        parse_summary: dict[str, object] | None,
        *,
        status_value: str,
        error: str | None = None,
    ) -> dict[str, object]:
        """Merge new processing info into an existing parse summary dictionary.

        Args:
            parse_summary: Existing summary or None.
            status_value: New status string.
            error: Optional new error message.

        Returns:
            Updated parse summary dictionary.
        """
        summary = dict(parse_summary or {})
        summary["processing"] = ResumeUploadService._build_processing_info(
            status_value=status_value,
            error=error,
        )
        return summary

    @staticmethod
    def _parse_processing_info(
        parse_summary: dict[str, object] | None,
    ) -> ResumeProcessingInfo:
        """Extract ResumeProcessingInfo schema from a raw parse summary dict.

        Args:
            parse_summary: The raw dictionary containing processing info.

        Returns:
            A validated ResumeProcessingInfo object.
        """
        processing = parse_summary.get("processing", {}) if parse_summary else {}
        status_value = str(processing.get("status", "queued"))
        error = processing.get("error")
        return ResumeProcessingInfo(
            status=status_value,
            error=str(error) if error else None,
        )

    def _status_response_from_resume(
        self,
        *,
        job_id: uuid.UUID,
        resume_record: object,
    ) -> ResumeStatusResponse:
        """Convert a resume database record into a ResumeStatusResponse schema.

        Args:
            job_id: The job ID.
            resume_record: The Resume ORM object.

        Returns:
            A populated ResumeStatusResponse.
        """
        parse_summary = getattr(resume_record, "parse_summary", None) or {}
        analysis_payload = parse_summary.get("analysis")
        analysis = (
            ResumeMatchAnalysis.model_validate(analysis_payload)
            if isinstance(analysis_payload, dict)
            else None
        )
        candidate = getattr(resume_record, "candidate")
        file_record = getattr(resume_record, "file")

        return ResumeStatusResponse(
            job_id=job_id,
            candidate_id=candidate.id,
            file_id=file_record.id,
            resume_id=resume_record.id,
            file_name=file_record.file_name,
            file_type=file_record.file_type,
            size=file_record.size,
            source_url=file_record.source_url,
            parsed=bool(getattr(resume_record, "parsed", False)),
            processing=self._parse_processing_info(parse_summary),
            analysis=analysis,
        )

    def _upload_response_from_records(
        self,
        *,
        job_id: uuid.UUID,
        candidate_id: uuid.UUID,
        file_record: object,
        resume_record: object,
    ) -> ResumeUploadResponse:
        """Convert upload records into a ResumeUploadResponse schema.

        Args:
            job_id: The job ID.
            candidate_id: The candidate ID.
            file_record: The FileRecord ORM object.
            resume_record: The Resume ORM object.

        Returns:
            A populated ResumeUploadResponse.
        """
        processing = self._parse_processing_info(
            getattr(resume_record, "parse_summary", None)
        )
        return ResumeUploadResponse(
            message="Resume uploaded successfully. Processing started.",
            job_id=job_id,
            candidate_id=candidate_id,
            file_id=file_record.id,
            resume_id=resume_record.id,
            file_name=file_record.file_name,
            file_type=file_record.file_type,
            size=file_record.size,
            source_url=file_record.source_url,
            parsed=bool(getattr(resume_record, "parsed", False)),
            processing=processing,
            analysis=None,
        )

    def _job_resume_response_from_resume(
        self,
        *,
        job_id: uuid.UUID,
        resume_record: object,
    ) -> JobResumeInfoResponse:
        """Convert a resume record into a JobResumeInfoResponse schema.

        Args:
            job_id: The job ID.
            resume_record: The Resume ORM object.

        Returns:
            A populated JobResumeInfoResponse.
        """
        parse_summary = getattr(resume_record, "parse_summary", None) or {}
        analysis_payload = parse_summary.get("analysis")
        analysis = (
            ResumeMatchAnalysis.model_validate(analysis_payload)
            if isinstance(analysis_payload, dict)
            else None
        )
        candidate = getattr(resume_record, "candidate")
        file_record = getattr(resume_record, "file")

        return JobResumeInfoResponse(
            job_id=job_id,
            candidate_id=candidate.id,
            candidate_first_name=candidate.first_name,
            candidate_last_name=candidate.last_name,
            candidate_email=candidate.email,
            file_id=file_record.id,
            resume_id=resume_record.id,
            file_name=file_record.file_name,
            file_type=file_record.file_type,
            size=file_record.size,
            source_url=file_record.source_url,
            uploaded_at=resume_record.uploaded_at,
            parsed=bool(getattr(resume_record, "parsed", False)),
            processing=self._parse_processing_info(parse_summary),
            analysis=analysis,
            resume_score=(
                float(resume_record.resume_score)
                if getattr(resume_record, "resume_score", None) is not None
                else None
            ),
            pass_fail=getattr(resume_record, "pass_fail", None),
        )

    @staticmethod
    def _log_stage(
        *,
        stage: str,
        started_at: float,
        **context: object,
    ) -> None:
        """Log a processing stage duration and context.

        Args:
            stage: Name of the stage.
            started_at: Performance counter start time.
            **context: Additional key-value pairs for the log message.
        """
        logger.info(
            "resume_processing stage=%s duration_ms=%.2f %s",
            stage,
            (time.perf_counter() - started_at) * 1000,
            " ".join(f"{key}={value}" for key, value in context.items()),
        )

    @staticmethod
    def _log_event(
        *,
        event: str,
        **context: object,
    ) -> None:
        """Log a specific event with context.

        Args:
            event: Name of the event.
            **context: Additional key-value pairs for the log message.
        """
        logger.info(
            "resume_processing event=%s %s",
            event,
            " ".join(f"{key}={value}" for key, value in context.items()),
        )

    def _schedule_processing(
        self,
        *,
        job_id: uuid.UUID,
        resume_id: uuid.UUID,
        file_path: str,
    ) -> None:
        """Schedule the resume processing task in the background.

        Args:
            job_id: The job ID.
            resume_id: The resume ID.
            file_path: Path to the stored resume file.
        """
        task = asyncio.create_task(
            self._process_resume_in_background(
                job_id=job_id,
                resume_id=resume_id,
                file_path=file_path,
            )
        )
        _background_tasks.add(task)
        task.add_done_callback(_background_tasks.discard)

    def _process_resume(
        self,
        file_path: str,
    ) -> tuple[str, dict[str, list[dict[str, object]]]]:
        """Extract and normalize data from a resume file.

        This method is designed to be run in a separate thread/executor.

        Args:
            file_path: Path to the resume file.

        Returns:
            A tuple containing (raw_text, normalized_extractions).
        """
        stage_started_at = time.perf_counter()
        raw_text = DocumentParser.extract_text(file_path)
        self._log_stage(
            stage="document_text_extraction",
            started_at=stage_started_at,
            file_path=file_path,
            chars=len(raw_text),
        )

        stage_started_at = time.perf_counter()
        extracted = self.extractor.extract_resume_info(raw_text)
        self._log_stage(
            stage="llm_resume_extraction",
            started_at=stage_started_at,
            file_path=file_path,
            chars=len(raw_text),
        )

        stage_started_at = time.perf_counter()
        normalized = normalize_extractions(extracted)
        self._log_stage(
            stage="normalize_extractions",
            started_at=stage_started_at,
            file_path=file_path,
        )
        return raw_text, normalized

    def _generate_resume_insights(
        self,
        *,
        raw_text: str,
        parsed_summary: dict[str, object],
        job: object,
        job_skills: list[object],
        candidate_skills: list[str],
    ) -> dict[str, object]:
        """Generate vector embeddings and LLM analysis for a resume compared to a job.

        Args:
            raw_text: Raw text of the resume.
            parsed_summary: Structured data from the resume.
            job: The job object.
            job_skills: List of skills required for the job.
            candidate_skills: List of skills extracted from the resume.

        Returns:
            A dictionary containing embeddings and the match analysis.
        """
        candidate_text = build_candidate_text(parsed_summary, raw_text)
        job_text = build_job_text(job)

        stage_started_at = time.perf_counter()
        job_embedding = encode_jd(job_text) if job_text else None
        self._log_stage(
            stage="job_embedding",
            started_at=stage_started_at,
            job_chars=len(job_text),
        )

        stage_started_at = time.perf_counter()
        candidate_embedding = encode_resume(candidate_text) if candidate_text else None
        self._log_stage(
            stage="candidate_embedding",
            started_at=stage_started_at,
            resume_chars=len(candidate_text),
        )

        stage_started_at = time.perf_counter()
        chunk_embedding = (
            encode_resume(raw_text) if raw_text.strip() else candidate_embedding
        )
        self._log_stage(
            stage="chunk_embedding",
            started_at=stage_started_at,
            raw_chars=len(raw_text),
        )

        skill_embeddings: dict[uuid.UUID, list[float]] = {}
        stage_started_at = time.perf_counter()
        for skill in job_skills:
            skill_text = build_skill_text(skill)
            if skill_text and getattr(skill, "skill_embedding", None) is None:
                skill_embeddings[skill.id] = encode_skill(skill_text)
        self._log_stage(
            stage="job_skill_embeddings",
            started_at=stage_started_at,
            generated=len(skill_embeddings),
            total_skills=len(job_skills),
        )

        stage_started_at = time.perf_counter()
        semantic_score = get_semantic_score_from_embeddings(
            candidate_embedding or [],
            job_embedding or [],
        )
        self._log_stage(
            stage="semantic_score",
            started_at=stage_started_at,
            semantic_score=semantic_score,
        )

        stage_started_at = time.perf_counter()
        analysis = self.analyzer.analyze(
            resume_text=candidate_text,
            job_text=job_text,
            job_skills=[skill.name for skill in job_skills],
            candidate_skills=candidate_skills,
            semantic_score=semantic_score,
        )
        self._log_stage(
            stage="llm_resume_analysis",
            started_at=stage_started_at,
            candidate_skills=len(candidate_skills),
            job_skills=len(job_skills),
        )

        return {
            "job_embedding": job_embedding,
            "candidate_embedding": candidate_embedding,
            "chunk_embedding": chunk_embedding,
            "skill_embeddings": skill_embeddings,
            "analysis": analysis,
        }

    def _generate_skill_embeddings(
        self,
        skills: list[object],
    ) -> dict[uuid.UUID, list[float]]:
        """Generate embeddings for a list of candidate skills.

        Args:
            skills: List of Skill objects.

        Returns:
            Dictionary mapping skill IDs to their generated embeddings.
        """
        embeddings: dict[uuid.UUID, list[float]] = {}
        stage_started_at = time.perf_counter()
        for skill in skills:
            if getattr(skill, "skill_embedding", None) is not None:
                continue
            skill_text = build_skill_text(skill)
            if skill_text:
                embeddings[skill.id] = encode_skill(skill_text)
        self._log_stage(
            stage="candidate_skill_embeddings_internal",
            started_at=stage_started_at,
            generated=len(embeddings),
            total_skills=len(skills),
        )
        return embeddings

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
        failed_summary = self._merge_processing_info(
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

    async def _process_resume_in_background(
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
        self._log_event(
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
            self._log_stage(
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
            resume_record.parse_summary = self._merge_processing_info(
                getattr(resume_record, "parse_summary", None),
                status_value="processing",
            )
            await resume_upload_repository.commit(db)
            self._log_stage(
                stage="mark_processing",
                started_at=stage_started_at,
                job_id=job_id,
                resume_id=resume_id,
            )

            candidate = resume_record.candidate
            stage_started_at = time.perf_counter()
            job = await resume_upload_repository.get_job(db, job_id)
            self._log_stage(
                stage="load_job",
                started_at=stage_started_at,
                job_id=job_id,
                resume_id=resume_id,
            )
            if job is None:
                await self._mark_resume_failed(
                    db=db,
                    resume_id=resume_record.id,
                    current_parse_summary=getattr(resume_record, "parse_summary", None),
                    error_message="Job not found during background processing.",
                )
                return

            try:
                stage_started_at = time.perf_counter()
                raw_text, normalized = await run_in_resume_executor(
                    self._process_resume,
                    file_path,
                )
                self._log_stage(
                    stage="extract_and_normalize",
                    started_at=stage_started_at,
                    job_id=job_id,
                    resume_id=resume_id,
                )

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
                extracted_skill_names = extract_skill_names(normalized)
                job_skills = await resume_upload_repository.get_job_skills(
                    db,
                    job_id=job_id,
                )

                stage_started_at = time.perf_counter()
                insights = await run_in_resume_executor(
                    self._generate_resume_insights,
                    raw_text=raw_text,
                    parsed_summary=parsed_summary,
                    job=job,
                    job_skills=job_skills,
                    candidate_skills=extracted_skill_names,
                )
                self._log_stage(
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
                self._log_stage(
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
                self._log_stage(
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
                self._log_stage(
                    stage="persist_candidate_profile",
                    started_at=stage_started_at,
                    job_id=job_id,
                    resume_id=resume_id,
                )

                analysis = ResumeMatchAnalysis.model_validate(insights["analysis"])
                parse_summary_with_analysis = {
                    **parsed_summary,
                    "analysis": analysis.model_dump(),
                    "processing": self._build_processing_info(status_value="completed"),
                }
                resume_record.parsed = True
                resume_record.parse_summary = parse_summary_with_analysis
                resume_record.resume_score = analysis.match_percentage
                resume_record.pass_fail = analysis.match_percentage >= 65.0

                stage_started_at = time.perf_counter()
                await resume_upload_repository.create_resume_chunk(
                    db,
                    resume_id=resume_record.id,
                    parsed_json=parse_summary_with_analysis,
                    raw_text=raw_text,
                    chunk_embedding=insights["chunk_embedding"],
                )
                self._log_stage(
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
                        skill_names=extracted_skill_names,
                    )
                )
                self._log_stage(
                    stage="sync_candidate_skills",
                    started_at=stage_started_at,
                    job_id=job_id,
                    resume_id=resume_id,
                    count=len(candidate_skill_records),
                )

                stage_started_at = time.perf_counter()
                candidate_skill_embeddings = await run_in_resume_executor(
                    self._generate_skill_embeddings,
                    candidate_skill_records,
                )
                self._log_stage(
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
                self._log_stage(
                    stage="persist_candidate_skill_embeddings",
                    started_at=stage_started_at,
                    job_id=job_id,
                    resume_id=resume_id,
                    count=len(candidate_skill_embeddings),
                )

                stage_started_at = time.perf_counter()
                await resume_upload_repository.commit(db)
                self._log_stage(
                    stage="commit_completed_resume",
                    started_at=stage_started_at,
                    job_id=job_id,
                    resume_id=resume_id,
                )
                self._log_stage(
                    stage="total",
                    started_at=total_started_at,
                    job_id=job_id,
                    resume_id=resume_id,
                )
            except Exception as exc:
                parse_summary_snapshot = getattr(resume_record, "parse_summary", None)
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
                self._log_stage(
                    stage="total_failed",
                    started_at=total_started_at,
                    job_id=job_id,
                    resume_id=resume_id,
                )

    async def upload_resume_for_job(
        self,
        *,
        db: AsyncSession,
        job_id: uuid.UUID,
        resume: UploadFile,
        current_user: UserRead,
    ) -> ResumeUploadResponse:
        """Handle the initial upload of a resume.

        Validates the file, saves it, creates initial database records,
        and schedules background processing.

        Args:
            db: The async database session.
            job_id: The target job ID.
            resume: The uploaded file object.
            current_user: The user performing the upload.

        Returns:
            An initial upload response Schema.

        Raises:
            HTTPException: If the job is missing, inactive, file is too large, or type is unsupported.
        """
        total_started_at = time.perf_counter()
        self._log_event(
            event="upload_received",
            job_id=job_id,
            user_id=current_user.id,
            file_name=resume.filename,
        )

        stage_started_at = time.perf_counter()
        job = await resume_upload_repository.get_job(db, job_id)
        self._log_stage(
            stage="upload_load_job",
            started_at=stage_started_at,
            job_id=job_id,
        )
        if not job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Job not found.",
            )

        if not job.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Job is not accepting resumes.",
            )

        if not resume.filename:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Resume filename is required.",
            )

        extension = Path(resume.filename).suffix.lower().lstrip(".")
        if extension not in settings.ALLOWED_RESUME_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Only the following file types are allowed: "
                    f"{', '.join(settings.ALLOWED_RESUME_EXTENSIONS)}."
                ),
            )

        stage_started_at = time.perf_counter()
        content = await resume.read()
        file_size = len(content)
        self._log_stage(
            stage="upload_read_file",
            started_at=stage_started_at,
            job_id=job_id,
            file_size=file_size,
        )
        max_size_bytes = settings.RESUME_MAX_SIZE_MB * 1024 * 1024
        if file_size > max_size_bytes:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"Resume size must be <= {settings.RESUME_MAX_SIZE_MB} MB.",
            )

        # For HR uploads, we create a new placeholder candidate for each resume.
        # The extraction process will later fill in the correct name and info.
        candidate = await resume_upload_repository.create_candidate(
            db,
            job_id=job_id,
            email=f"pending_{uuid7()}@example.com",
            first_name="Processing",
            last_name="",
        )
        self._log_stage(
            stage="upload_create_placeholder_candidate",
            started_at=stage_started_at,
            job_id=job_id,
            candidate_id=candidate.id,
        )

        upload_root = Path(settings.RESUME_UPLOAD_DIR)
        target_dir = upload_root / str(job_id) / str(candidate.id)
        target_dir.mkdir(parents=True, exist_ok=True)

        stored_file_name = f"{uuid7()}.{extension}"
        target_path = target_dir / stored_file_name
        stage_started_at = time.perf_counter()
        target_path.write_bytes(content)
        self._log_stage(
            stage="upload_store_file",
            started_at=stage_started_at,
            job_id=job_id,
            candidate_id=candidate.id,
            path=target_path.as_posix(),
        )

        stage_started_at = time.perf_counter()
        file_record = await resume_upload_repository.create_file_record(
            db,
            owner_id=current_user.id,
            candidate_id=candidate.id,
            file_name=resume.filename,
            file_type=extension,
            source_url=target_path.as_posix(),
            size=file_size,
        )
        self._log_stage(
            stage="upload_create_file_record",
            started_at=stage_started_at,
            job_id=job_id,
            candidate_id=candidate.id,
            file_id=file_record.id,
        )

        queued_summary = self._merge_processing_info(
            None,
            status_value="queued",
        )
        stage_started_at = time.perf_counter()
        resume_record = await resume_upload_repository.create_resume_record(
            db,
            candidate_id=candidate.id,
            file_id=file_record.id,
            parse_summary=queued_summary,
            parsed=False,
            resume_score=None,
            pass_fail=None,
        )
        self._log_stage(
            stage="upload_create_resume_record",
            started_at=stage_started_at,
            job_id=job_id,
            candidate_id=candidate.id,
            resume_id=resume_record.id,
        )

        stage_started_at = time.perf_counter()
        await resume_upload_repository.commit(db)
        await resume_upload_repository.refresh_file_and_resume(
            db,
            file_record=file_record,
            resume_record=resume_record,
        )
        self._log_stage(
            stage="upload_commit_and_refresh",
            started_at=stage_started_at,
            job_id=job_id,
            candidate_id=candidate.id,
            resume_id=resume_record.id,
        )

        self._schedule_processing(
            job_id=job_id,
            resume_id=resume_record.id,
            file_path=str(target_path),
        )
        self._log_event(
            event="background_scheduled",
            job_id=job_id,
            candidate_id=candidate.id,
            resume_id=resume_record.id,
            file_id=file_record.id,
        )
        self._log_stage(
            stage="upload_total",
            started_at=total_started_at,
            job_id=job_id,
            candidate_id=candidate.id,
            resume_id=resume_record.id,
        )

        return self._upload_response_from_records(
            job_id=job_id,
            candidate_id=candidate.id,
            file_record=file_record,
            resume_record=resume_record,
        )

    async def get_resume_status(
        self,
        *,
        db: AsyncSession,
        job_id: uuid.UUID,
        resume_id: uuid.UUID,
        current_user: UserRead,
    ) -> ResumeStatusResponse:
        """Retrieve the current status and analysis for a specific resume.

        Args:
            db: The async database session.
            job_id: The job ID.
            resume_id: The resume ID.
            current_user: The user requesting status.

        Returns:
            The status and analysis schema.

        Raises:
            HTTPException: If the resume is not found.
        """
        resume_record = await resume_upload_repository.get_resume_for_job(
            db,
            job_id=job_id,
            resume_id=resume_id,
            owner_id=current_user.id,
        )
        if resume_record is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Resume not found.",
            )
        return self._status_response_from_resume(
            job_id=job_id,
            resume_record=resume_record,
        )

    async def get_candidates_for_job(
        self,
        *,
        db: AsyncSession,
        job_id: uuid.UUID,
    ) -> JobCandidatesResponse:
        """Retrieve all candidates for a job with their resume insights.

        Args:
            db: The async database session.
            job_id: The ID of the job to fetch candidates for.

        Returns:
            A JobCandidatesResponse containing the list of candidates.
        """
        job = await resume_upload_repository.get_job(db, job_id)
        if not job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Job not found.",
            )

        candidates = await resume_upload_repository.get_candidates_for_job(
            db, job_id=job_id
        )

        candidate_responses = []
        for candidate in candidates:
            # Use the newest loaded resume explicitly instead of relying on
            # relationship ordering from the ORM collection.
            resumes = getattr(candidate, "resumes", [])
            latest_resume = (
                max(resumes, key=lambda resume: resume.uploaded_at) if resumes else None
            )

            analysis = None
            is_parsed = False
            resume_score = None
            pass_fail = None
            processing_status = None

            if latest_resume:
                is_parsed = bool(latest_resume.parsed)
                resume_score = latest_resume.resume_score
                pass_fail = latest_resume.pass_fail
                parse_summary = latest_resume.parse_summary or {}

                # Get processing status
                processing_info = parse_summary.get("processing", {})
                if isinstance(processing_info, dict):
                    processing_status = processing_info.get("status")

                analysis_payload = parse_summary.get("analysis")
                if isinstance(analysis_payload, dict):
                    analysis = ResumeMatchAnalysis.model_validate(analysis_payload)

            candidate_responses.append(
                CandidateResponse(
                    id=candidate.id,
                    first_name=candidate.first_name,
                    last_name=candidate.last_name,
                    email=candidate.email,
                    phone=candidate.phone,
                    current_status=candidate.current_status,
                    created_at=candidate.created_at,
                    resume_analysis=analysis,
                    resume_score=resume_score,
                    pass_fail=pass_fail,
                    is_parsed=is_parsed,
                    processing_status=processing_status,
                )
            )

        return JobCandidatesResponse(job_id=job_id, candidates=candidate_responses)

    async def get_resumes_for_job(
        self,
        *,
        db: AsyncSession,
        job_id: uuid.UUID,
    ) -> JobResumesResponse:
        """Retrieve all resumes uploaded for a specific job.

        Args:
            db: The async database session.
            job_id: The job ID.

        Returns:
            A schema containing the job info and the list of resumes.

        Raises:
            HTTPException: If the job is not found.
        """
        job = await resume_upload_repository.get_job(db, job_id)
        if not job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Job not found.",
            )

        resumes = await resume_upload_repository.get_resumes_for_job(
            db,
            job_id=job_id,
        )
        return JobResumesResponse(
            job_id=job_id,
            job=JobRead(
                id=job.id,
                title=getattr(job, "title", ""),
                department=getattr(job, "department", None),
                jd_text=getattr(job, "jd_text", None),
                jd_json=getattr(job, "jd_json", None),
                is_active=job.is_active,
                created_by=getattr(job, "created_by", uuid.UUID(int=0)),
                created_at=getattr(job, "created_at", datetime.now(UTC)),
            ),
            resumes=[
                self._job_resume_response_from_resume(
                    job_id=job_id,
                    resume_record=resume_record,
                )
                for resume_record in resumes
            ],
        )


resume_upload_service = ResumeUploadService()
