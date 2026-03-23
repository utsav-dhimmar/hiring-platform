"""
Stage 1 HR Screening Evaluator.

Uses two sequential AG2 agent calls to stay within Ollama Cloud
output token limits:
  - Call 1: Communication Skill, Confidence, Cultural Fit
  - Call 2: Profile Understanding, Tech Stack Alignment + all summary fields

Prompts are defined in app/v1/prompts/stage1.py.
"""

from __future__ import annotations

import json
import logging
import re
from dataclasses import dataclass, field

from autogen import AssistantAgent, UserProxyAgent

from app.v1.core.config import settings
from app.v1.prompts.stage1 import (
    STAGE1_SYSTEM_MESSAGE,
    STAGE1_PROMPT_PART1,
    STAGE1_PROMPT_PART2,
)

logger = logging.getLogger(__name__)

CRITERIA_WEIGHTS: dict[str, float] = {
    "Communication Skill":   0.20,
    "Confidence":            0.20,
    "Cultural Fit":          0.20,
    "Profile Understanding": 0.15,
    "Tech Stack Alignment":  0.25,
}

CRITERIA = list(CRITERIA_WEIGHTS.keys())

MAX_FULL_TEXT_WORDS      = 400
MAX_CANDIDATE_TEXT_WORDS = 400


# ---------------------------------------------------------------------------
# Result dataclasses
# ---------------------------------------------------------------------------


@dataclass
class CriterionResult:
    score: int
    justification: str
    evidence: list[str] = field(default_factory=list)


@dataclass
class EvaluationResult:
    criteria: dict[str, CriterionResult]
    red_flags: list[str]
    stage_score: float
    recommendation: str
    recommendation_reason: str
    strength_summary: str
    weakness_summary: str
    overall_summary: str
    suggested_followups: list[str]


# ---------------------------------------------------------------------------
# Evaluator
# ---------------------------------------------------------------------------


class Stage1Evaluator:
    """
    Runs Stage 1 HR evaluation using two sequential AG2 agent calls
    to stay within Ollama Cloud output token limits.
    """

    def __init__(self) -> None:
        self._llm_config = {
            "config_list": [
                {
                    "model":      settings.OLLAMA_MODEL,
                    "base_url":   settings.OLLAMA_CLOUD_URL,
                    "api_key":    settings.OLLAMA_API_KEY or "ollama",
                    "max_tokens": 4000,
                }
            ],
            "temperature": 0.1,
            "timeout":     180,
        }

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def evaluate(
        self,
        *,
        full_text: str,
        candidate_text: str,
        jd: str,
        filler_count: int,
    ) -> EvaluationResult:
        """
        Run the two-part LLM-as-a-Judge evaluation.

        Call 1 → Communication Skill, Confidence, Cultural Fit
        Call 2 → Profile Understanding, Tech Stack Alignment + summaries
        """
        full_text, candidate_text = self._trim_inputs(full_text, candidate_text)
        jd_trimmed = jd.strip()[:300]

        # ── Call 1: First 3 criteria ─────────────────────────────────
        prompt1 = STAGE1_PROMPT_PART1.format(
            filler_count=filler_count,
            jd=jd_trimmed,
            candidate_text=candidate_text,
            resume_context="",
        )
        result1 = self._run_agent(prompt1)
        logger.info("Stage1Evaluator call 1 keys: %s", list(result1.keys()))

        # ── Call 2: Last 2 criteria + summaries ──────────────────────
        comm_score = result1.get("Communication Skill", {}).get("score", 65)
        conf_score = result1.get("Confidence",          {}).get("score", 65)
        cult_score = result1.get("Cultural Fit",        {}).get("score", 65)

        prompt2 = STAGE1_PROMPT_PART2.format(
            comm_score=comm_score,
            conf_score=conf_score,
            cult_score=cult_score,
            jd=jd_trimmed,
            candidate_text=candidate_text,
            resume_context="",
        )
        result2 = self._run_agent(prompt2)
        logger.info("Stage1Evaluator call 2 keys: %s", list(result2.keys()))

        # ── Merge and parse ───────────────────────────────────────────
        merged = {**result1, **result2}
        logger.info("Stage1Evaluator merged keys: %s", list(merged.keys()))

        return self._parse_merged(merged)

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    def _trim_inputs(
        self, full_text: str, candidate_text: str
    ) -> tuple[str, str]:
        full_words = full_text.split()
        if len(full_words) > MAX_FULL_TEXT_WORDS:
            full_text = " ".join(full_words[:MAX_FULL_TEXT_WORDS]) + "\n[trimmed]"
            logger.info("Stage1Evaluator: full_text trimmed to %d words", MAX_FULL_TEXT_WORDS)

        cand_words = candidate_text.split()
        if len(cand_words) > MAX_CANDIDATE_TEXT_WORDS:
            candidate_text = " ".join(cand_words[:MAX_CANDIDATE_TEXT_WORDS]) + "\n[trimmed]"
            logger.info("Stage1Evaluator: candidate_text trimmed to %d words", MAX_CANDIDATE_TEXT_WORDS)

        return full_text, candidate_text

    def _run_agent(self, prompt: str) -> dict:
        """Run a single AG2 agent call and return parsed JSON dict."""
        hr_evaluator = AssistantAgent(
            name="HREvaluator",
            llm_config=self._llm_config,
            system_message=STAGE1_SYSTEM_MESSAGE,
        )
        user_proxy = UserProxyAgent(
            name="HR_Coordinator",
            human_input_mode="NEVER",
            max_consecutive_auto_reply=1,
            code_execution_config=False,
        )

        user_proxy.initiate_chat(hr_evaluator, message=prompt)
        raw = self._collect_agent_output(user_proxy, hr_evaluator)
        print(f"\n[DEBUG] Raw agent output ({len(raw)} chars):")
        print(raw[:600])
        print("---")

        logger.debug("Stage1Evaluator raw output (300 chars): %s", raw[:300])

        return self._safe_parse(raw)

    def _collect_agent_output(
        self, user_proxy: UserProxyAgent, hr_evaluator: AssistantAgent
    ) -> str:
        """
        Collect LLM response from chat messages.
        Skip index 0 (our own prompt), collect everything else.
        """
        messages = user_proxy.chat_messages.get(hr_evaluator, [])
        parts = []
        for m in messages:
            content = m.get("content", "")
            if isinstance(content, str) and content.strip():
                parts.append(content)
        return " ".join(parts[1:])

    def _safe_parse(self, raw: str) -> dict:
        """Parse JSON with multiple fallback strategies."""
        cleaned = re.sub(r"```json\s*", "", raw)
        cleaned = re.sub(r"```\s*", "", cleaned).strip()

        try:
            return json.loads(cleaned)
        except json.JSONDecodeError:
            pass

        fixed = re.sub(r",\s*([}\]])", r"\1", cleaned)
        try:
            return json.loads(fixed)
        except json.JSONDecodeError:
            pass

        depth, start = 0, -1
        for idx, ch in enumerate(cleaned):
            if ch == "{":
                if depth == 0:
                    start = idx
                depth += 1
            elif ch == "}":
                depth -= 1
                if depth == 0 and start != -1:
                    block = cleaned[start: idx + 1]
                    try:
                        return json.loads(block)
                    except json.JSONDecodeError:
                        fixed_block = re.sub(r",\s*([}\]])", r"\1", block)
                        try:
                            return json.loads(fixed_block)
                        except json.JSONDecodeError:
                            pass
                    start = -1

        logger.warning(
            "Stage1Evaluator: all parse strategies failed. Raw: %s", raw[:400]
        )
        return {}

    def _parse_merged(self, data: dict) -> EvaluationResult:
        """Build a typed EvaluationResult from merged dict of both calls."""
        criteria: dict[str, CriterionResult] = {}
        for name in CRITERIA:
            c = data.get(name, {})
            criteria[name] = CriterionResult(
                score=int(c.get("score", 0)),
                justification=str(c.get("justification", "")),
                evidence=list(c.get("evidence", [])),
            )

        if "stage_score" in data and data["stage_score"]:
            stage_score = float(data["stage_score"])
        else:
            stage_score = round(
                sum(
                    criteria[c].score * CRITERIA_WEIGHTS[c]
                    for c in CRITERIA_WEIGHTS
                    if c in criteria
                ),
                1,
            )
            logger.warning(
                "Stage1Evaluator: stage_score missing, computed %.1f", stage_score
            )

        recommendation = data.get("recommendation", "")
        if recommendation not in ("PROCEED", "REJECT", "MAYBE"):
            if stage_score >= 65:
                recommendation = "PROCEED"
            elif stage_score < 50:
                recommendation = "REJECT"
            else:
                recommendation = "MAYBE"

        return EvaluationResult(
            criteria=criteria,
            red_flags=list(data.get("red_flags", [])),
            stage_score=stage_score,
            recommendation=recommendation,
            recommendation_reason=str(data.get("recommendation_reason", "")),
            strength_summary=str(data.get("strength_summary", "")),
            weakness_summary=str(data.get("weakness_summary", "")),
            overall_summary=str(data.get("overall_summary", "")),
            suggested_followups=list(data.get("suggested_followups", [])),
        )