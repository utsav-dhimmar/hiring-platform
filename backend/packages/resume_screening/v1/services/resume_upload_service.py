"""
Resume upload service module.

This module provides the business logic for handling resume uploads,
processing them through extraction, and storing the results.
"""

import uuid
from pathlib import Path
from uuid import uuid7

from fastapi import HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.v1.core.config import settings
from app.v1.core.resume_executor import run_in_resume_executor
from packages.auth.v1.schema.user import UserRead
from packages.resume_screening.v1.repository import resume_upload_repository
from packages.resume_screening.v1.schemas.upload import (
    ResumeMatchAnalysis,
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
    get_semantic_score,
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


class ResumeUploadService:
    """Service for handling resume upload and processing.

    This service coordinates the process of uploading a resume, extracting text,
    normalizing data using LLM-based extractors, and updating the candidate profile.
    """

    def __init__(self) -> None:
        self.extractor = ResumeLLMExtractor()
        self.analyzer = ResumeJdAnalyzer()

    def _process_resume(
        self,
        file_path: str,
    ) -> tuple[str, dict[str, list[dict[str, object]]]]:
        """Process a resume file to extract and normalize information.

        Args:
            file_path: The absolute path to the resume file.

        Returns:
            A tuple containing the raw extracted text and a dictionary of
            normalized extractions (name, skills, experience, etc.).
        """
        raw_text = DocumentParser.extract_text(file_path)
        extracted = self.extractor.extract_resume_info(raw_text)
        normalized = normalize_extractions(extracted)
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
        candidate_text = build_candidate_text(parsed_summary, raw_text)
        job_text = build_job_text(job)

        job_embedding = encode_jd(job_text) if job_text else None
        candidate_embedding = encode_resume(candidate_text) if candidate_text else None
        chunk_embedding = encode_resume(raw_text) if raw_text.strip() else candidate_embedding

        skill_embeddings: dict[uuid.UUID, list[float]] = {}
        for skill in job_skills:
            skill_text = build_skill_text(skill)
            if skill_text and getattr(skill, "skill_embedding", None) is None:
                skill_embeddings[skill.id] = encode_skill(skill_text)

        semantic_score = get_semantic_score(candidate_text, job_text)
        analysis = self.analyzer.analyze(
            resume_text=candidate_text,
            job_text=job_text,
            job_skills=[skill.name for skill in job_skills],
            candidate_skills=candidate_skills,
            semantic_score=semantic_score,
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
        embeddings: dict[uuid.UUID, list[float]] = {}
        for skill in skills:
            if getattr(skill, "skill_embedding", None) is not None:
                continue
            skill_text = build_skill_text(skill)
            if skill_text:
                embeddings[skill.id] = encode_skill(skill_text)
        return embeddings

    async def upload_resume_for_job(
        self,
        *,
        db: AsyncSession,
        job_id: uuid.UUID,
        resume: UploadFile,
        current_user: UserRead,
    ) -> ResumeUploadResponse:
        """Upload and process a resume for a specific job application.

        This method performs the following steps:
        1. Validates the job and resume file (extension, size).
        2. Retrieves or creates a candidate profile for the user.
        3. Saves the resume file to the local filesystem.
        4. Processes the resume using a background executor to extract data.
        5. Updates the candidate profile and creates database records for the
           file, resume, and skills.

        Args:
            db: The async database session.
            job_id: The UUID of the job the user is applying for.
            resume: The uploaded resume file.
            current_user: The schema representing the currently authenticated user.

        Returns:
            A ResumeUploadResponse containing the details of the upload and processing.

        Raises:
            HTTPException: If the job is not found, not active, file is invalid,
                or if resume parsing fails.
        """
        job = await resume_upload_repository.get_job(db, job_id)
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

        content = await resume.read()
        file_size = len(content)
        max_size_bytes = settings.RESUME_MAX_SIZE_MB * 1024 * 1024
        if file_size > max_size_bytes:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"Resume size must be <= {settings.RESUME_MAX_SIZE_MB} MB.",
            )

        candidate = await resume_upload_repository.get_candidate_for_job_and_email(
            db,
            job_id=job_id,
            email=current_user.email,
        )
        if candidate is None:
            first_name, last_name = split_name(current_user.full_name)
            candidate = await resume_upload_repository.create_candidate(
                db,
                job_id=job_id,
                email=current_user.email,
                first_name=first_name,
                last_name=last_name,
            )

        upload_root = Path(settings.RESUME_UPLOAD_DIR)
        target_dir = upload_root / str(job_id) / str(candidate.id)
        target_dir.mkdir(parents=True, exist_ok=True)

        stored_file_name = f"{uuid7()}.{extension}"
        target_path = target_dir / stored_file_name
        target_path.write_bytes(content)

        try:
            raw_text, normalized = await run_in_resume_executor(
                self._process_resume,
                str(target_path),
            )
        except Exception as exc:
            target_path.unlink(missing_ok=True)
            await resume_upload_repository.rollback(db)
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Resume parsing failed: {exc}",
            ) from exc

        parsed_name = (
            str(normalized["name"][0]["text"]).strip() if normalized["name"] else None
        )
        first_name, last_name = split_name(parsed_name)

        parsed_summary = {
            "name": parsed_name,
            "skills": normalized["skills"],
            "experience": normalized["experience"],
            "education": normalized["education"],
            "certifications": normalized["certifications"],
            "links": normalized["links"],
        }
        extracted_skill_names = extract_skill_names(normalized)
        job_skills = await resume_upload_repository.get_job_skills(db, job_id=job_id)

        try:
            insights = await run_in_resume_executor(
                self._generate_resume_insights,
                raw_text=raw_text,
                parsed_summary=parsed_summary,
                job=job,
                job_skills=job_skills,
                candidate_skills=extracted_skill_names,
            )
        except Exception as exc:
            target_path.unlink(missing_ok=True)
            await resume_upload_repository.rollback(db)
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Resume analysis failed: {exc}",
            ) from exc

        if insights["job_embedding"] and job.jd_embedding is None:
            await resume_upload_repository.update_job_embedding(
                db,
                job=job,
                embedding=insights["job_embedding"],
            )

        await resume_upload_repository.update_skill_embeddings(
            db,
            embeddings_by_skill_id=insights["skill_embeddings"],
        )

        await resume_upload_repository.update_candidate_profile(
            db,
            candidate=candidate,
            first_name=first_name,
            last_name=last_name,
            info=parsed_summary,
            info_embedding=insights["candidate_embedding"],
        )

        analysis = ResumeMatchAnalysis.model_validate(insights["analysis"])
        resume_score = analysis.match_percentage
        pass_fail = resume_score >= 65.0
        parse_summary_with_analysis = {
            **parsed_summary,
            "analysis": analysis.model_dump(),
        }

        file_record = await resume_upload_repository.create_file_record(
            db,
            owner_id=current_user.id,
            candidate_id=candidate.id,
            file_name=resume.filename,
            file_type=extension,
            source_url=target_path.as_posix(),
            size=file_size,
        )

        resume_record = await resume_upload_repository.create_resume_record(
            db,
            candidate_id=candidate.id,
            file_id=file_record.id,
            parse_summary=parse_summary_with_analysis,
            resume_score=resume_score,
            pass_fail=pass_fail,
        )

        await resume_upload_repository.create_resume_chunk(
            db,
            resume_id=resume_record.id,
            parsed_json=parse_summary_with_analysis,
            raw_text=raw_text,
            chunk_embedding=insights["chunk_embedding"],
        )

        candidate_skill_records = await resume_upload_repository.sync_candidate_skills(
            db,
            candidate_id=candidate.id,
            skill_names=extracted_skill_names,
        )
        candidate_skill_embeddings = await run_in_resume_executor(
            self._generate_skill_embeddings,
            candidate_skill_records,
        )
        await resume_upload_repository.update_skill_embeddings(
            db,
            embeddings_by_skill_id=candidate_skill_embeddings,
        )

        await resume_upload_repository.commit(db)
        await resume_upload_repository.refresh_file_and_resume(
            db,
            file_record=file_record,
            resume_record=resume_record,
        )

        return ResumeUploadResponse(
            message="Resume uploaded and parsed successfully.",
            job_id=job_id,
            candidate_id=candidate.id,
            file_id=file_record.id,
            resume_id=resume_record.id,
            file_name=file_record.file_name or resume.filename,
            file_type=file_record.file_type or extension,
            size=file_record.size or file_size,
            source_url=file_record.source_url or target_path.as_posix(),
            parsed=resume_record.parsed,
            analysis=analysis,
        )


resume_upload_service = ResumeUploadService()
