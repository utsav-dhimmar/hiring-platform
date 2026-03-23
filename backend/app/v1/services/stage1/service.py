"""
Stage 1 evaluation service.

Orchestrates the full Stage 1 pipeline:
  1. Load transcript from DB
  2. Extract candidate-only speech and filler count
  3. Run Stage1Evaluator (LLM-as-a-Judge)
  4. Persist full result to transcript.segments
  5. Update interview status
  6. Return a flat, frontend-ready response shape
"""

from __future__ import annotations

import re
import uuid

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.v1.core.logging import get_logger
from app.v1.repository.interview_repository import interview_repository
from app.v1.repository.transcript_repository import transcript_repository

from .evaluator import CriterionResult, Stage1Evaluator

logger = get_logger(__name__)

# Maps stage number to candidate pipeline status label
STAGE_STATUS_MAP = {
    1: "stage_1_pending",
    2: "stage_2_pending",
    3: "stage_3_pending",
    4: "stage_4_pending",
}

# Filler sound patterns to count in candidate speech
_FILLER_PATTERNS = [
    r"\byou know\b",
    r"\bi mean\b",
    r"\bkind of\b",
    r"\bsort of\b",
    r"\buh\b",
    r"\bum\b",
    r"\bumm\b",
    r"\buhh\b",
    r"\bhmm\b",
    r"\bhm\b",
    r"\bmhm\b",
    r"\bmm\b",
]


def _count_filler_words(text: str) -> int:
    """Count filler sounds in candidate speech."""
    count = 0
    for pattern in _FILLER_PATTERNS:
        count += len(re.findall(pattern, text, re.IGNORECASE))
    return count


def _extract_candidate_speech(dialogues: list[dict], candidate_name: str) -> str:
    """
    Extract only the candidate's spoken lines from parsed dialogues.

    If candidate_name matches a speaker, use that. Otherwise fall back to
    the speaker with the most dialogue turns (heuristic: that's the candidate).
    """
    if not dialogues:
        return ""

    speakers = {d.get("speaker", "") for d in dialogues if d.get("speaker")}

    if candidate_name and candidate_name in speakers:
        candidate_speaker = candidate_name
    else:
        speaker_counts: dict[str, int] = {}
        for d in dialogues:
            sp = d.get("speaker", "")
            if sp:
                speaker_counts[sp] = speaker_counts.get(sp, 0) + 1
        candidate_speaker = (
            max(speaker_counts, key=lambda k: speaker_counts[k])
            if speaker_counts
            else ""
        )

    return "\n".join(
        d.get("text", "")
        for d in dialogues
        if d.get("speaker") == candidate_speaker
    )


def _safe_criterion(result_criteria: dict, name: str) -> CriterionResult:
    """Return a criterion result or a safe default if missing."""
    return result_criteria.get(name, CriterionResult(score=0, justification="", evidence=[]))


def _build_response(result, filler_count: int) -> dict:
    """
    Build the complete frontend-ready response from an EvaluationResult.

    Structure:
    - scores: flat dict of criterion scores (0-10 scale for progress bars)
    - criteria_detail: full per-criterion data including justification + evidence
    - red_flags: list of concern strings
    - stage_score: weighted overall score (0-100)
    - recommendation: PROCEED | REJECT | MAYBE
    - recommendation_reason: one-sentence explanation
    - strength_summary: paragraph of key strengths
    - weakness_summary: paragraph of gaps and concerns
    - overall_summary: 2-3 sentence HR record
    - suggested_followups: list of Stage 2 questions
    - filler_count: number of filler sounds detected
    """
    comm   = _safe_criterion(result.criteria, "Communication Skill")
    conf   = _safe_criterion(result.criteria, "Confidence")
    cult   = _safe_criterion(result.criteria, "Cultural Fit")
    prof   = _safe_criterion(result.criteria, "Profile Understanding")
    tech   = _safe_criterion(result.criteria, "Tech Stack Alignment")

    # Salary alignment is not a scored criterion — derive from red flags
    salary_red_flag = any(
        "salary" in flag.lower() or "compensation" in flag.lower()
        for flag in result.red_flags
    )
    salary_score = 4 if salary_red_flag else 10  # 4/10 if flagged, 10/10 if not mentioned

    return {
        # ── Flat scores (0-10 scale) for progress bars ──────────────
        "scores": {
            "communication_skill":   round(comm.score / 10, 1),
            "confidence":            round(conf.score / 10, 1),
            "cultural_fit":          round(cult.score / 10, 1),
            "profile_understanding": round(prof.score / 10, 1),
            "tech_stack_alignment":  round(tech.score / 10, 1),
            "salary_alignment":      salary_score,
            "overall_score":         round(result.stage_score, 1),
        },

        # ── Per-criterion detail (justification + evidence quotes) ───
        "criteria_detail": {
            "Communication Skill": {
                "score":         comm.score,
                "justification": comm.justification,
                "evidence":      comm.evidence,
            },
            "Confidence": {
                "score":         conf.score,
                "justification": conf.justification,
                "evidence":      conf.evidence,
            },
            "Cultural Fit": {
                "score":         cult.score,
                "justification": cult.justification,
                "evidence":      cult.evidence,
            },
            "Profile Understanding": {
                "score":         prof.score,
                "justification": prof.justification,
                "evidence":      prof.evidence,
            },
            "Tech Stack Alignment": {
                "score":         tech.score,
                "justification": tech.justification,
                "evidence":      tech.evidence,
            },
        },

        # ── Summary fields ───────────────────────────────────────────
        "red_flags":             result.red_flags,
        "stage_score":           round(result.stage_score, 1),
        "recommendation":        result.recommendation,
        "recommendation_reason": result.recommendation_reason,
        "strength_summary":      result.strength_summary,
        "weakness_summary":      result.weakness_summary,
        "overall_summary":       result.overall_summary,
        "suggested_followups":   result.suggested_followups,
        "filler_count":          filler_count,
    }


class Stage1Service:
    """Service that runs the Stage 1 LLM evaluation for an interview."""

    def __init__(self) -> None:
        self.evaluator = Stage1Evaluator()

    async def run_evaluation(
        self,
        *,
        db: AsyncSession,
        interview_id: uuid.UUID,
        transcript_id: uuid.UUID,
    ) -> dict:
        """
        Run the full Stage 1 evaluation pipeline.

        Loads the transcript, extracts candidate speech, runs the LLM
        evaluator, persists the result, updates interview status, and
        returns a complete frontend-ready response dict.

        Raises:
            404: Interview or transcript not found.
            400: Transcript not yet processed.
        """
        # ── Load interview ───────────────────────────────────────────
        interview = await interview_repository.get_interview(db, interview_id)
        if not interview:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Interview not found.",
            )

        # ── Load transcript ──────────────────────────────────────────
        transcript = await transcript_repository.get_transcript(
            db, transcript_id=transcript_id
        )
        if not transcript:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Transcript not found.",
            )

        segments = transcript.segments or {}
        if segments.get("status") != "completed":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Transcript is not ready. Current status: '{segments.get('status', 'processing')}'.",
            )

        segments      = transcript.segments or {}
        dialogues     = segments.get("dialogues", [])
        full_text     = transcript.transcript_text or ""
        metadata      = segments.get("metadata", {})
        candidate_name = metadata.get("candidate_name", "")

        # ── Build job description text ───────────────────────────────
        job = interview.job
        jd  = getattr(job, "jd_text", "") or ""
        if not jd:
            jd = str(getattr(job, "jd_json", {}) or {})

        # ── Extract candidate speech + count fillers ─────────────────
        candidate_text = _extract_candidate_speech(dialogues, candidate_name)
        filler_count   = _count_filler_words(candidate_text)

        logger.info(
            "stage1_evaluation_start interview_id=%s transcript_id=%s "
            "filler_count=%d candidate_text_words=%d",
            interview_id,
            transcript_id,
            filler_count,
            len(candidate_text.split()),
        )

        # ── Run LLM evaluation ───────────────────────────────────────
        result = self.evaluator.evaluate(
            full_text=full_text,
            candidate_text=candidate_text,
            jd=jd,
            filler_count=filler_count,
        )

        # ── Build frontend-ready response ────────────────────────────
        response = _build_response(result, filler_count)

        # ── Persist full result into transcript.segments ─────────────
        updated_segments = {
            **segments,
            "stage1_evaluation": response,
        }
        await transcript_repository.update_transcript(
            db,
            transcript_id=transcript_id,
            transcript_text=full_text,
            segments=updated_segments,
        )

        # ── Update interview status ──────────────────────────────────
        new_status = (
            "evaluation_complete"
            if result.recommendation in ("PROCEED", "REJECT")
            else "evaluation_maybe"
        )
        await interview_repository.update_interview_status(
            db,
            interview_id=interview_id,
            status=new_status,
        )

        await transcript_repository.commit(db)

        logger.info(
            "stage1_evaluation_complete interview_id=%s score=%.1f recommendation=%s",
            interview_id,
            result.stage_score,
            result.recommendation,
        )

        return response


stage1_service = Stage1Service()