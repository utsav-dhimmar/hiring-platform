"""
Resume-vs-JD analysis using LLMs.
"""

from __future__ import annotations

import json
import re
from typing import Any

from langextract.core import types as core_types
from langextract.providers.ollama import OllamaLanguageModel

from app.v1.core.config import settings
from app.v1.core.logging import get_logger
from app.v1.prompts import RESUME_JD_ANALYSIS_PROMPT
from app.v1.schemas.analyzer import ResumeJobAnalysisResult

logger = get_logger(__name__)


class ResumeJdAnalyzer:
    """Analyzer service for comparing resumes against job descriptions using LLMs."""

    def __init__(self) -> None:
        self.model = OllamaLanguageModel(
            model_id=settings.OLLAMA_MODEL,
            model_url=settings.OLLAMA_URL,
            api_key=settings.OLLAMA_API_KEY,
            format_type=core_types.FormatType.JSON,
            timeout=settings.OLLAMA_TIMEOUT,
        )

    def _extract_json(self, text: str) -> dict[str, Any] | None:
        """Attempt to extract JSON from text that might contain preamble/postamble."""
        try:
            # Try direct parse first
            return json.loads(text)
        except json.JSONDecodeError:
            # Try to find something between { and }
            # Using a slightly more robust regex for nested braces if needed,
            # but for LLM output, usually { ... } is enough or just taking the first { to the last }.
            match = re.search(r"(\{.*\})", text, re.DOTALL)
            if match:
                try:
                    return json.loads(match.group(1))
                except json.JSONDecodeError:
                    pass
        return None

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
        except (ValueError, json.JSONDecodeError) as exc:
            # Try manual extraction as a fallback
            extracted = self._extract_json(raw_output)
            if extracted:
                parsed_output = extracted
            else:
                logger.error("Failed to parse LLM output: %s", raw_output)
                raise ValueError("LLM returned invalid JSON for resume analysis.") from exc
        
        validated = ResumeJobAnalysisResult.model_validate(parsed_output)
        return validated.model_dump()
