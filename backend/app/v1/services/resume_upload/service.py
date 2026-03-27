"""
Main resume upload service orchestrator.
"""

from __future__ import annotations

import hashlib
import time
import uuid
from pathlib import Path
from uuid import uuid7

from fastapi import HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.v1.core.config import settings
from app.v1.core.storage import resolve_storage_path, to_storage_relative_path
from app.v1.repository.job_repository import job_repository
from app.v1.repository.resume_upload_repository import resume_upload_repository
from app.v1.schemas.job import JobRead
from app.v1.schemas.upload import (
    CandidateResponse,
    JobCandidatesResponse,
    JobResumesResponse,
    ResumeMatchAnalysis,
    ResumeStatusResponse,
    ResumeUploadResponse,
)
from app.v1.schemas.user import UserRead

from .background import BackgroundProcessor
from .converters import (
    job_resume_response_from_resume,
    merge_processing_info,
    status_response_from_resume,
    upload_response_from_records,
)
from .logging import log_event, log_stage
from .processor import ResumeProcessor


class ResumeUploadService:
    """Service for handling resume upload and processing."""

    def __init__(self) -> None:
        self.processor = ResumeProcessor()
        self.background = BackgroundProcessor(self.processor)

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
            background_tasks: FastAPI background tasks.

        Returns:
            An initial upload response Schema.

        Raises:
            HTTPException: If the job is missing, inactive, file is too large, or type is unsupported.
        """
        total_started_at = time.perf_counter()
        log_event(
            event="upload_received",
            job_id=job_id,
            user_id=current_user.id,
            file_name=resume.filename,
        )

        stage_started_at = time.perf_counter()
        job = await job_repository.get(db, job_id)
        log_stage(
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
        log_stage(
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

        content_hash = hashlib.sha256(content).hexdigest()
        existing_file = (
            await resume_upload_repository.get_file_by_content_hash_for_job(
                db,
                job_id=job_id,
                content_hash=content_hash,
            )
        )
        if existing_file is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This resume has already been uploaded for this job.",
            )

        candidate = await resume_upload_repository.create_candidate(
            db,
            job_id=job_id,
            email=f"pending_{uuid7()}@example.com",
            first_name="Processing",
            last_name="",
        )
        log_stage(
            stage="upload_create_placeholder_candidate",
            started_at=stage_started_at,
            job_id=job_id,
            candidate_id=candidate.id,
        )

        upload_root = resolve_storage_path(settings.RESUME_UPLOAD_DIR)
        target_dir = upload_root / str(job_id) / str(candidate.id)
        target_dir.mkdir(parents=True, exist_ok=True)

        stored_file_name = f"{uuid7()}.{extension}"
        target_path = target_dir / stored_file_name
        stored_file_path = to_storage_relative_path(target_path)
        stage_started_at = time.perf_counter()
        target_path.write_bytes(content)
        log_stage(
            stage="upload_store_file",
            started_at=stage_started_at,
            job_id=job_id,
            candidate_id=candidate.id,
            path=stored_file_path,
        )

        stage_started_at = time.perf_counter()
        file_record = await resume_upload_repository.create_file_record(
            db,
            owner_id=current_user.id,
            candidate_id=candidate.id,
            file_name=resume.filename,
            file_type=extension,
            source_url=stored_file_path,
            size=file_size,
            content_hash=content_hash,
        )
        log_stage(
            stage="upload_create_file_record",
            started_at=stage_started_at,
            job_id=job_id,
            candidate_id=candidate.id,
            file_id=file_record.id,
        )

        queued_summary = merge_processing_info(
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
        log_stage(
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
        log_stage(
            stage="upload_commit_and_refresh",
            started_at=stage_started_at,
            job_id=job_id,
            candidate_id=candidate.id,
            resume_id=resume_record.id,
        )

        self.background.schedule_processing(
            job_id=job_id,
            resume_id=resume_record.id,
            file_path=stored_file_path,
        )
        log_event(
            event="background_scheduled",
            job_id=job_id,
            candidate_id=candidate.id,
            resume_id=resume_record.id,
            file_id=file_record.id,
        )
        log_stage(
            stage="upload_total",
            started_at=total_started_at,
            job_id=job_id,
            candidate_id=candidate.id,
            resume_id=resume_record.id,
        )

        return upload_response_from_records(
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
        return status_response_from_resume(
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
            resumes = getattr(candidate, "resumes", [])
            latest_resume = (
                max(resumes, key=lambda resume: resume.uploaded_at)
                if resumes
                else None
            )

            analysis = None
            is_parsed = False
            resume_score = None
            pass_fail = None
            processing_status = None
            processing_error = None
            linkedin_url = None
            github_url = None

            # Robust search for social links across candidate profile and latest resume
            search_sources = []
            if candidate.info and isinstance(candidate.info, dict):
                search_sources.append(candidate.info)
            if latest_resume and latest_resume.parse_summary:
                search_sources.append(latest_resume.parse_summary)
                if "extracted_data" in latest_resume.parse_summary:
                    ext_data = latest_resume.parse_summary["extracted_data"]
                    if isinstance(ext_data, dict):
                        search_sources.append(ext_data)

            for source in search_sources:
                if not isinstance(source, dict):
                    continue
                links = source.get("links") or source.get("social_links")
                if isinstance(links, list):
                    for link_item in links:
                        url = ""
                        if isinstance(link_item, dict):
                            url = link_item.get("text") or link_item.get("url") or ""
                        elif isinstance(link_item, str):
                            url = link_item
                        
                        if not url: continue
                        url_lower = url.lower()
                        if "linkedin.com" in url_lower and not linkedin_url:
                            linkedin_url = url
                        elif "github.com" in url_lower and not github_url:
                            github_url = url

            if latest_resume:
                is_parsed = bool(latest_resume.parsed)
                resume_score = latest_resume.resume_score
                pass_fail = latest_resume.pass_fail
                parse_summary = latest_resume.parse_summary or {}

                processing_info = parse_summary.get("processing", {})
                if isinstance(processing_info, dict):
                    processing_status = processing_info.get("status")
                    processing_error = processing_info.get("error")

                analysis_payload = parse_summary.get("analysis")
                if isinstance(analysis_payload, dict):
                    analysis = ResumeMatchAnalysis.model_validate(
                        analysis_payload
                    )

            candidate_responses.append(
                CandidateResponse(
                    id=candidate.id,
                    first_name=candidate.first_name,
                    last_name=candidate.last_name,
                    email=candidate.email,
                    phone=candidate.phone,
                    linkedin_url=linkedin_url,
                    github_url=github_url,
                    current_status=candidate.current_status,
                    created_at=candidate.created_at,
                    resume_id=latest_resume.id if latest_resume else None,
                    applied_version_number=candidate.applied_version_number,
                    resume_analysis=analysis,
                    resume_score=resume_score,
                    pass_fail=pass_fail,
                    is_parsed=is_parsed,
                    processing_status=processing_status,
                    processing_error=processing_error,
                )
            )

        return JobCandidatesResponse(
            job_id=job_id, candidates=candidate_responses
        )

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
        # Use job_repository to get full job with relationships (skills, stages)
        job = await job_repository.get(db, job_id)
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
            job=JobRead.model_validate(job),
            resumes=[
                job_resume_response_from_resume(
                    job_id=job_id,
                    resume_record=resume_record,
                )
                for resume_record in resumes
            ],
        )

    async def trigger_mass_refresh(
        self,
        *,
        db: AsyncSession,
        job_id: uuid.UUID,
        background_tasks,
    ) -> None:
        from app.v1.repository.job_repository import job_repository
        job = await job_repository.get(db, job_id)
        if not job:
            from fastapi import HTTPException, status
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found.")

        from app.v1.services.resume_upload.background import BackgroundProcessor
        from app.v1.services.resume_upload.processor import ResumeProcessor

        bg_processor = BackgroundProcessor(ResumeProcessor())
        background_tasks.add_task(
            bg_processor.mass_refresh_in_background,
            job_id=job_id,
        )

    async def trigger_candidate_reanalyze(
        self,
        *,
        db: AsyncSession,
        job_id: uuid.UUID,
        candidate_id: uuid.UUID,
        background_tasks,
    ) -> None:
        from app.v1.repository.job_repository import job_repository
        job = await job_repository.get(db, job_id)
        if not job:
            from fastapi import HTTPException, status
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found.")

        from app.v1.services.resume_upload.background import BackgroundProcessor
        from app.v1.services.resume_upload.processor import ResumeProcessor

        bg_processor = BackgroundProcessor(ResumeProcessor())
        # Hand off to Celery task so HR can track it globally and monitor in worker logs
        bg_processor.schedule_candidate_reanalyze(
            job_id=job_id,
            candidate_id=candidate_id,
        )

    async def delete_resume(
        self,
        *,
        db: AsyncSession,
        resume_id: uuid.UUID,
        job_id: uuid.UUID,
    ) -> bool:
        """Delete a resume and its associated data.

        Args:
            db: The async database session.
            resume_id: The ID of the resume to delete.
            job_id: The ID of the job it belongs to.

        Returns:
            True if deleted, False if not found.
        """
        success = await resume_upload_repository.delete_resume(
            db, resume_id=resume_id, job_id=job_id
        )
        return success

    async def update_resume_status(
        self,
        *,
        db: AsyncSession,
        resume_id: uuid.UUID,
        job_id: uuid.UUID,
        pass_fail: str | None,
    ) -> bool:
        """Manually update the HR decision/status for a resume.

        Args:
            db: Async database session.
            resume_id: ID of the resume.
            job_id: ID of the associated job.
            pass_fail: New status string (e.g. 'pass', 'fail', 'maybe', pending).

        Returns:
            True if successful, False if resume not found for the given job.
        """
        from sqlalchemy import select
        from app.v1.db.models.resumes import Resume
        from app.v1.db.models.candidates import Candidate
        
        # Verify the resume exists and belongs to the given job
        result = await db.execute(
            select(Resume)
            .join(Candidate, Resume.candidate_id == Candidate.id)
            .where(
                Resume.id == resume_id,
                Candidate.applied_job_id == job_id
            )
        )
        resume = result.scalar_one_or_none()
        if not resume:
            return False
            
        resume.pass_fail = pass_fail
        await db.commit()
        return True

resume_upload_service = ResumeUploadService()
