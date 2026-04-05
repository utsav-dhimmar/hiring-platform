"""
Pipeline for processing a single resume upload.
"""
import hashlib
import time
import uuid
from typing import Awaitable, Callable

from sqlalchemy.ext.asyncio import AsyncSession



from app.v1.core.logging import get_logger
from app.v1.core.resume_executor import run_in_resume_executor
from app.v1.db.session import async_session_maker
from app.v1.repository.job_repository import job_repository
from app.v1.repository.resume_upload_repository import resume_upload_repository
from app.v1.schemas.upload import ResumeMatchAnalysis
from app.v1.utils.resume_upload import extract_skill_names, split_name
from .converters import build_processing_info, merge_processing_info
from .logging import log_event, log_stage
from .processor import ResumeProcessor

logger = get_logger(__name__)

async def run_resume_processing_pipeline(
    *,
    job_id: uuid.UUID,
    resume_id: uuid.UUID,
    file_path: str,
    processor: ResumeProcessor,
    mark_failed_cb: Callable[[AsyncSession, uuid.UUID, dict | None, str], Awaitable[None]]
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
            await mark_failed_cb(
                db=db,
                resume_id=resume_id,
                current_parse_summary=getattr(
                    resume_record, "parse_summary", None
                ),
                error_message="Job not found during background processing.",
            )
            return

        try:
            stage_started_at = time.perf_counter()
            raw_text, normalized = await run_in_resume_executor(
                processor.process_resume,
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

            from app.v1.utils.text import extract_heuristic_info
            
            # Helper to check if a value is effectively missing
            def is_missing(val):
                if not val: return True
                if isinstance(val, str) and val.strip().lower() in ("not mentioned", "null", "none"): return True
                return False

            h_info = extract_heuristic_info(raw_text)
            
            # Name fallback (heuristic for name is harder, but we can at least avoid 'Not mentioned')
            parsed_name = (
                str(normalized["name"][0]["text"]).strip()
                if normalized.get("name") and not is_missing(normalized["name"][0]["text"])
                else None
            )

            # Email fallback
            parsed_email = (
                str(normalized["email"][0]["text"]).strip()
                if normalized.get("email") and not is_missing(normalized["email"][0]["text"])
                else h_info.get("email")
            )

            # Phone fallback
            parsed_phone = (
                str(normalized["phone"][0]["text"]).strip()
                if normalized.get("phone") and not is_missing(normalized["phone"][0]["text"])
                else h_info.get("phone")
            )

            # Social Links fallback
            if not normalized.get("links") or is_missing(normalized["links"][0]["text"]):
                if h_info.get("links"):
                    normalized["links"] = [{"text": link, "attributes": {}} for link in h_info["links"]]
            
            first_name, last_name = split_name(parsed_name)
            parsed_summary = {
                "name": parsed_name,
                "email": parsed_email,
                "phone": parsed_phone,
                "location": normalized.get("location", []),
                "skills": normalized.get("skills", []),
                "experience": normalized.get("experience", []),
                "education": normalized.get("education", []),
                "certifications": normalized.get("certifications", []),
                "links": normalized.get("links", []),
                "extraordinary_highlights": normalized.get("extraordinary_highlights", []),
                "professional_summary": normalized.get("professional_summary", []),
                "experience_summary": normalized.get("experience_summary", []),
            }
            extracted_skill_names_list = extract_skill_names(normalized)
            job_skills = await resume_upload_repository.get_job_skills(
                db,
                job_id=job_id,
            )

            stage_started_at = time.perf_counter()
            insights = await processor.generate_resume_insights(
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

            # ---- Safety Check: Ensure resume hasn't been deleted during long processing ----
            if not await resume_upload_repository.resume_exists(db, resume_id):
                logger.info(
                    "Stopping processing: resume_id=%s was deleted during analysis phase.",
                    resume_id
                )
                return
            # --------------------------------------------------------------------------------

            stage_started_at = time.perf_counter()
            stage_started_at = time.perf_counter()
            needs_job_embedding_update = False
            if insights["job_embedding"]:
                current_dim = len(insights["job_embedding"])
                if job.jd_embedding is None:
                    needs_job_embedding_update = True
                elif len(job.jd_embedding) != current_dim:
                    logger.info(
                        "Updating job %s embedding due to dimension mismatch (old=%d, new=%d)",
                        job_id, len(job.jd_embedding), current_dim
                    )
                    needs_job_embedding_update = True

            if needs_job_embedding_update:
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
            resume_record.resume_embedding = insights["candidate_embedding"]
            candidate.applied_version_number = job.version
            log_stage(
                stage="persist_candidate_profile",
                started_at=stage_started_at,
                job_id=job_id,
                resume_id=resume_id,
            )

            custom_extractions = {}
            if getattr(job, "custom_extraction_fields", None):
                from app.v1.services.resume_upload.custom_extractor import custom_extractor_service
                custom_extractions = await custom_extractor_service.extract_background_custom_fields(
                    raw_text=raw_text,
                    fields_list=job.custom_extraction_fields,
                )

            analysis = ResumeMatchAnalysis.model_validate(
                insights["analysis"]
            )
            if custom_extractions:
                analysis.custom_extractions = custom_extractions

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
            resume_record.pass_fail = "passed" if resume_record.resume_score >= job.passing_threshold else "failed"
            resume_record.text_hash = text_hash

            # --- Save initial versioned result (NEW) ---
            from app.v1.db.models.resume_version_results import ResumeVersionResult
            versioned = ResumeVersionResult(
                resume_id=resume_record.id,
                job_id=job.id,
                job_version_number=job.version,
                resume_score=resume_record.resume_score,
                pass_fail=resume_record.pass_fail,
                analysis_data=analysis.model_dump(),
            )
            db.add(versioned)
            # --- End initial versioned result save ---

            stage_started_at = time.perf_counter()
            for chunk_data in insights["chunk_embeddings"]:
                await resume_upload_repository.create_resume_chunk(
                    db,
                    resume_id=resume_id,
                    parsed_json=parse_summary_with_analysis,
                    raw_text=chunk_data["text"],
                    chunk_embedding=chunk_data["embedding"],
                )
            log_stage(
                stage="create_resume_chunks",
                started_at=stage_started_at,
                job_id=job_id,
                resume_id=resume_id,
                count=len(insights["chunk_embeddings"]),
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
                processor.generate_skill_embeddings,
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

            # Automatic cross-match trigger has been removed.
            # It now triggers ONLY when HR marks a resume as 'fail' in ResumeUploadService.update_resume_status.
            pass
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
            await mark_failed_cb(
                db=db,
                resume_id=resume_id,
                current_parse_summary=parse_summary_snapshot,
                error_message=str(exc),
            )
            log_stage(
                stage="total_failed",
                started_at=total_started_at,
                job_id=job_id,
                resume_id=resume_id,
            )
