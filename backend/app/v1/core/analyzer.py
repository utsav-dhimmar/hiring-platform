"""
Resume-vs-JD analysis using LLMs.
"""

from __future__ import annotations

import json
from typing import Any

from langextract.core import types as core_types
from langextract.providers.ollama import OllamaLanguageModel
from pydantic import BaseModel, Field

from app.v1.core.config import settings
from app.v1.prompts import RESUME_JD_ANALYSIS_PROMPT


class MissingSkillItem(BaseModel):
    """A single missing skill with its importance score."""

    name: str
    score: float = Field(ge=0, le=100)


class ResumeJobAnalysisResult(BaseModel):
    """Result of the LLM-based analysis comparing a resume to a job description."""

    match_percentage: float = Field(ge=0, le=100)
    skill_gap_analysis: str
    experience_alignment: str
    strength_summary: str
    missing_skills: list[MissingSkillItem] = Field(default_factory=list)
    extraordinary_points: list[str] = Field(default_factory=list)


class ResumeJdAnalyzer:
    """Analyzer service for comparing resumes against job descriptions using LLMs."""

    def __init__(self) -> None:
        self.model = OllamaLanguageModel(
            model_id=settings.OLLAMA_MODEL,
            model_url=settings.OLLAMA_URL,
            api_key=settings.OLLAMA_API_KEY,
            format_type=core_types.FormatType.JSON,
            timeout=300,
        )

    def analyze(
        self,
        *,
        resume_text: str,
        job_text: str,
        job_skills: list[str],
        candidate_skills: list[str],
        semantic_score: float,
    ) -> dict[str, Any]:
        """Perform a detailed LLM analysis of a resume's suitability for a job.

        Args:
            resume_text: The constructed resume text.
            job_text: The constructed job description text.
            job_skills: List of skills required for the job.
            candidate_skills: List of skills found in the resume.
            semantic_score: The pre-calculated semantic similarity score.

        Returns:
            A dictionary containing match percentage and detailed analysis.

        Raises:
            ValueError: If the LLM returns an invalid or empty response.
        """
        prompt = RESUME_JD_ANALYSIS_PROMPT.format(
            semantic_score=semantic_score,
            job_skills=json.dumps(job_skills, ensure_ascii=True),
            candidate_skills=json.dumps(candidate_skills, ensure_ascii=True),
            job_text=job_text,
            resume_text=resume_text,
        )

        outputs = list(self.model.infer([prompt]))
        if not outputs or not outputs[0] or not outputs[0][0].output:
            raise ValueError("LLM did not return a resume analysis response.")

        raw_output = outputs[0][0].output
        try:
            parsed_output = self.model.parse_output(raw_output)
        except ValueError as exc:
            raise ValueError("LLM returned invalid JSON for resume analysis.") from exc
        validated = ResumeJobAnalysisResult.model_validate(parsed_output)
        return validated.model_dump()
