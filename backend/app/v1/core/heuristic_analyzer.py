"""
Heuristic-based resume-vs-JD analysis without LLM calls.
Uses a combination of bi-encoder semantic scores, skill overlap, and cross-encoder reranking.
"""

from __future__ import annotations

import math
from typing import Any
import numpy as np
from sentence_transformers import CrossEncoder

from app.v1.core.config import settings
from app.v1.core.logging import get_logger

logger = get_logger(__name__)

class HeuristicAnalyzer:
    """Analyzer that uses local models and heuristics instead of LLMs."""

    def __init__(self) -> None:
        self.use_cross_encoder = settings.USE_CROSS_ENCODER
        self._cross_encoder = None

    @property
    def cross_encoder(self) -> CrossEncoder | None:
        if self.use_cross_encoder and self._cross_encoder is None:
            try:
                self._cross_encoder = CrossEncoder(settings.CROSS_ENCODER_MODEL_NAME)
            except Exception:
                logger.exception("Failed to load CrossEncoder model. Falling back to bi-encoder only.")
                self.use_cross_encoder = False
        return self._cross_encoder

    def _normalize_skills(self, skills: list[str | dict]) -> set[str]:
        """Convert a list of strings or dictionaries to a set of normalized strings."""
        normalized = set()
        for s in skills:
            if isinstance(s, dict):
                # Extract 'name' if it is a dict, fallback to first value or str representation
                name = str(s.get("name") or s.get("skill") or list(s.values())[0])
            else:
                name = str(s)
            normalized.add(name.lower().strip())
        return normalized

    def _calculate_skill_overlap(self, job_skills: list[str], candidate_skills: list[str | dict]) -> float:
        """Calculate a percentage score based on missing/matched skills."""
        if not job_skills:
            return 100.0
        
        # Normalize for comparison
        j_skills = self._normalize_skills(job_skills)
        c_skills = self._normalize_skills(candidate_skills)
        
        matches = j_skills.intersection(c_skills)
        overlap = (len(matches) / len(j_skills)) * 100.0
        return overlap

    def analyze(
        self,
        *,
        resume_text: str,
        job_text: str,
        job_skills: list[str],
        candidate_skills: list[str],
        semantic_score: float,  # This is the BI-ENCODER score (0-100)
    ) -> dict[str, Any]:
        """Perform a local analysis without LLM calls."""
        
        # 1. Skill Overlap (0-100)
        skill_score = self._calculate_skill_overlap(job_skills, candidate_skills)
        
        # 2. Cross-Encoder Score (0-100 fallback)
        ce_score = semantic_score
        if self.cross_encoder:
            try:
                # Cross-encoder returns logits, need to sigmoid then scale
                logit = self.cross_encoder.predict([(resume_text, job_text)])[0]
                ce_score = (1 / (1 + math.exp(-logit))) * 100.0
            except Exception:
                logger.warning("Cross-encoder inference failed, using semantic_score.")
        
        # 3. Weighted Final Match Percentage
        # Priority: Skill overlap is very important for HR, Semantic is good for 'vibe'
        # Final = 40% Skills + 30% Bi-Vector + 30% Cross-Encoder
        final_match = (0.4 * skill_score) + (0.3 * semantic_score) + (0.3 * ce_score)
        final_match = min(100.0, max(0.0, final_match))
        
        # Determine missing skills
        j_skills_norm = self._normalize_skills(job_skills)
        c_skills_norm = self._normalize_skills(candidate_skills)
        missing = [s for s in job_skills if str(s).lower().strip() not in c_skills_norm]
        
        # Generate static/template-based summaries
        strength_summary = f"Matching skills found: {', '.join(list(set(job_skills) - set(missing))[:5])}."
        if not missing:
            gap_analysis = "No significant skill gaps identified relative to the mandatory requirements."
        else:
            gap_analysis = f"Missing key requirements: {', '.join(missing[:5])}."
            
        return {
            "match_percentage": round(final_match, 1),
            "skill_gap_analysis": gap_analysis,
            "experience_alignment": "Calculated via semantic alignment of professional history.",
            "strength_summary": strength_summary,
            "missing_skills": [{"name": s, "score": 0.0} for s in missing],
            "extraordinary_points": [],
            "custom_extractions": {}
        }

heuristic_analyzer = HeuristicAnalyzer()
