"""
Core processing logic for resumes (extraction, normalization, embeddings).
"""

from __future__ import annotations

import time
import uuid
from typing import Any

from app.v1.core.analyzer import ResumeJdAnalyzer
from app.v1.core.heuristic_analyzer import heuristic_analyzer
from app.v1.core.cache import cache
from app.v1.core.embeddings import embedding_service
from app.v1.core.config import settings
from app.v1.core.extractor import DocumentParser, ResumeLLMExtractor
from app.v1.utils.resume_upload import (
    normalize_extractions,
)
from app.v1.utils.text import (
    build_candidate_text,
    build_job_text,
    build_skill_text,
    split_into_chunks,
)

from .logging import log_stage, log_event
import logging
logger = logging.getLogger(__name__)


class ResumeProcessor:
    """Processor for extracting and analyzing resume data."""

    def __init__(self) -> None:
        self.extractor = ResumeLLMExtractor()
        self.analyzer = ResumeJdAnalyzer()

    def process_resume(
        self,
        file_path: str,
    ) -> tuple[str, dict[str, list[dict[str, object]]]]:
        """Extract and normalize data from a resume file.

        Args:
            file_path: Path to the resume file.

        Returns:
            A tuple containing (raw_text, normalized_extractions).
        """
        stage_started_at = time.perf_counter()
        raw_text = DocumentParser.extract_text(file_path)
        log_stage(
            stage="document_text_extraction",
            started_at=stage_started_at,
            file_path=file_path,
            chars=len(raw_text),
        )

        stage_started_at = time.perf_counter()
        extracted = self.extractor.extract_resume_info(raw_text)
        log_stage(
            stage="llm_resume_extraction",
            started_at=stage_started_at,
            file_path=file_path,
            chars=len(raw_text),
        )

        stage_started_at = time.perf_counter()
        normalized = normalize_extractions(extracted)
        log_stage(
            stage="normalize_extractions",
            started_at=stage_started_at,
            file_path=file_path,
        )
        return raw_text, normalized

    async def generate_resume_insights(
        self,
        *,
        raw_text: str,
        parsed_summary: dict[str, object],
        job: Any,
        job_skills: list[Any],
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
        job_id = getattr(job, "id", None)

        # ---- Redis Cache for Job Embedding ----
        job_embedding = None
        if job_id:
            cache_key = f"job_embedding:{job_id}"
            job_embedding = await cache.get(cache_key)
            if job_embedding:
                log_event(
                    event="job_embedding_cache_hit",
                    job_id=job_id,
                )

        if job_embedding is None:
            stage_started_at = time.perf_counter()
            job_embedding = embedding_service.encode_jd(job_text) if job_text else None
            log_stage(
                stage="job_embedding_generated",
                started_at=stage_started_at,
                job_chars=len(job_text) if job_text else 0,
            )
            if job_id and job_embedding:
                await cache.set(f"job_embedding:{job_id}", job_embedding)
        elif len(job_embedding) != embedding_service.target_dim:
            # Handle dimension mismatch from cache (e.g. model changed from 1024 to 384)
            log_event(
                event="job_embedding_dim_mismatch",
                job_id=job_id,
                cache_dim=len(job_embedding),
                target_dim=embedding_service.target_dim,
            )
            stage_started_at = time.perf_counter()
            job_embedding = embedding_service.encode_jd(job_text) if job_text else None
            log_stage(
                stage="job_embedding_refreshed_dim_mismatch",
                started_at=stage_started_at,
                job_chars=len(job_text) if job_text else 0,
            )
            if job_id and job_embedding:
                await cache.set(f"job_embedding:{job_id}", job_embedding)
        # ---------------------------------------

        logger.info("[INSIGHTS] Starting Candidate Embedding for resume_id=%s", getattr(job, "id", "unknown"))
        stage_started_at = time.perf_counter()
        candidate_embedding = (
            embedding_service.encode_resume(candidate_text) if candidate_text else None
        )
        logger.info("[INSIGHTS] Candidate Embedding complete for resume_id=%s in %.2fs", getattr(job, "id", "unknown"), time.perf_counter() - stage_started_at)
        log_stage(
            stage="candidate_embedding",
            started_at=stage_started_at,
            resume_chars=len(candidate_text),
        )

        raw_chunks = split_into_chunks(raw_text) or [candidate_text]
        logger.info("[INSIGHTS] Starting Chunk Embeddings (count=%d) for resume_id=%s", len(raw_chunks), getattr(job, "id", "unknown"))
        stage_started_at = time.perf_counter()
        chunk_embeddings = []
        for i, chunk_txt in enumerate(raw_chunks):
            chunk_embeddings.append(
                {
                    "text": chunk_txt,
                    "embedding": embedding_service.encode_resume(chunk_txt),
                }
            )
        logger.info("[INSIGHTS] Chunk Embeddings complete for resume_id=%s in %.2fs", getattr(job, "id", "unknown"), time.perf_counter() - stage_started_at)

        log_stage(
            stage="multi_chunk_embedding",
            started_at=stage_started_at,
            chunks=len(chunk_embeddings),
            raw_chars=len(raw_text),
        )

        skill_embeddings: dict[uuid.UUID, list[float]] = {}
        stage_started_at = time.perf_counter()
        skills_to_encode = []
        skill_ids = []
        for skill in job_skills:
            if getattr(skill, "skill_embedding", None) is not None:
                continue
            skill_text = build_skill_text(skill)
            if skill_text:
                skills_to_encode.append(skill_text)
                skill_ids.append(skill.id)

        if skills_to_encode:
            encoded_vectors = embedding_service.encode_skills_batch(skills_to_encode)
            for sid, vec in zip(skill_ids, encoded_vectors):
                skill_embeddings[sid] = vec

        log_stage(
            stage="job_skill_embeddings",
            started_at=stage_started_at,
            generated=len(skill_embeddings),
            total_skills=len(job_skills),
        )

        stage_started_at = time.perf_counter()
        semantic_score = embedding_service.get_semantic_score_from_embeddings(
            candidate_embedding or [],
            job_embedding or [],
        )
        log_stage(
            stage="semantic_score",
            started_at=stage_started_at,
            semantic_score=semantic_score,
        )

        logger.info("[INSIGHTS] Starting LLM Analyzer for resume_id=%s", getattr(job, "id", "unknown"))
        stage_started_at = time.perf_counter()
        analysis = self.analyzer.analyze(
            raw_text=raw_text,
            candidate_info=parsed_summary,
            job_title=getattr(job, "title", "Job Description")[:150],
            job_skills=[skill.name for skill in job_skills],
            job_description=getattr(job, "jd_text", None),
            candidate_skills=candidate_skills,
            semantic_score=semantic_score,
        )
        logger.info("[INSIGHTS] LLM Analyzer complete for resume_id=%s in %.2fs", getattr(job, "id", "unknown"), time.perf_counter() - stage_started_at)
        log_stage(
            stage="llm_resume_analysis",
            started_at=stage_started_at,
            candidate_skills=len(candidate_skills),
            job_skills=len(job_skills),
        )

        return {
            "job_embedding": job_embedding,
            "candidate_embedding": candidate_embedding,
            "chunk_embeddings": chunk_embeddings,
            "skill_embeddings": skill_embeddings,
            "analysis": analysis,
        }

    def generate_skill_embeddings(
        self,
        skills: list[Any],
    ) -> dict[uuid.UUID, list[float]]:
        """Generate embeddings for a list of candidate skills.

        Args:
            skills: List of Skill objects.

        Returns:
            Dictionary mapping skill IDs to their generated embeddings.
        """
        embeddings: dict[uuid.UUID, list[float]] = {}
        stage_started_at = time.perf_counter()
        skills_to_encode = []
        skill_ids = []
        for skill in skills:
            if getattr(skill, "skill_embedding", None) is not None:
                continue
            skill_text = build_skill_text(skill)
            if skill_text:
                skills_to_encode.append(skill_text)
                skill_ids.append(skill.id)

        if skills_to_encode:
            encoded_vectors = embedding_service.encode_skills_batch(skills_to_encode)
            for sid, vec in zip(skill_ids, encoded_vectors):
                embeddings[sid] = vec

        log_stage(
            stage="candidate_skill_embeddings_internal",
            started_at=stage_started_at,
            generated=len(embeddings),
            total_skills=len(skills),
        )
        return embeddings
