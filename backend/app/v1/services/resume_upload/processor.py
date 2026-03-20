"""
Core processing logic for resumes (extraction, normalization, embeddings).
"""

from __future__ import annotations

import time
import uuid
from typing import Any

from app.v1.core.cache import cache
from app.v1.core.analyzer import ResumeJdAnalyzer
from app.v1.core.embeddings import EmbeddingService
from app.v1.core.extractor import (
    DocumentParser,
    ResumeLLMExtractor,
)
from app.v1.utils.resume_upload import (
    normalize_extractions,
)
from app.v1.utils.text import (
    build_candidate_text,
    build_job_text,
    build_skill_text,
)

from .logging import log_stage


class ResumeProcessor:
    """Processor for extracting and analyzing resume data."""

    def __init__(self) -> None:
        self.extractor = ResumeLLMExtractor()
        self.analyzer = ResumeJdAnalyzer()
        self.embeddings = EmbeddingService()

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
                log_stage(
                    stage="job_embedding_cache_hit",
                    job_id=job_id,
                )

        if job_embedding is None:
            stage_started_at = time.perf_counter()
            job_embedding = self.embeddings.encode_jd(job_text) if job_text else None
            log_stage(
                stage="job_embedding_generated",
                started_at=stage_started_at,
                job_chars=len(job_text) if job_text else 0,
            )
            if job_id and job_embedding:
                await cache.set(f"job_embedding:{job_id}", job_embedding)
        # ---------------------------------------

        stage_started_at = time.perf_counter()
        candidate_embedding = (
            self.embeddings.encode_resume(candidate_text) if candidate_text else None
        )
        log_stage(
            stage="candidate_embedding",
            started_at=stage_started_at,
            resume_chars=len(candidate_text),
        )

        stage_started_at = time.perf_counter()
        chunk_embedding = (
            self.embeddings.encode_resume(raw_text)
            if raw_text.strip()
            else candidate_embedding
        )
        log_stage(
            stage="chunk_embedding",
            started_at=stage_started_at,
            raw_chars=len(raw_text),
        )

        skill_embeddings: dict[uuid.UUID, list[float]] = {}
        stage_started_at = time.perf_counter()
        for skill in job_skills:
            skill_text = build_skill_text(skill)
            if skill_text and getattr(skill, "skill_embedding", None) is None:
                skill_embeddings[skill.id] = self.embeddings.encode_skill(skill_text)
        log_stage(
            stage="job_skill_embeddings",
            started_at=stage_started_at,
            generated=len(skill_embeddings),
            total_skills=len(job_skills),
        )

        stage_started_at = time.perf_counter()
        semantic_score = self.embeddings.get_semantic_score_from_embeddings(
            candidate_embedding or [],
            job_embedding or [],
        )
        log_stage(
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
        log_stage(
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
        for skill in skills:
            if getattr(skill, "skill_embedding", None) is not None:
                continue
            skill_text = build_skill_text(skill)
            if skill_text:
                embeddings[skill.id] = self.embeddings.encode_skill(skill_text)
        log_stage(
            stage="candidate_skill_embeddings_internal",
            started_at=stage_started_at,
            generated=len(embeddings),
            total_skills=len(skills),
        )
        return embeddings
