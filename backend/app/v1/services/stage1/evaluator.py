"""
Stage 1 HR Screening Evaluator.

Wraps the AutoGen single-agent evaluation logic from the dev's script,
cleaned up and integrated into the project's service pattern.

The evaluator:
  1. Takes transcript text, candidate-only speech, JD, and filler count
  2. Runs a single LLM-as-a-Judge agent (HREvaluator)
  3. Parses the structured JSON result
  4. Returns a typed EvaluationResult
"""

from __future__ import annotations

import json
import logging
from dataclasses import dataclass, field

from autogen import AssistantAgent, UserProxyAgent

from app.v1.core.config import settings
from app.v1.prompts.stage1 import STAGE1_SYSTEM_PROMPT, STAGE1_USER_PROMPT

logger = logging.getLogger(__name__)

# Criteria weights — single source of truth (matches the system prompt)
CRITERIA_WEIGHTS: dict[str, float] = {
    "Communication Skill":   0.20,
    "Confidence":            0.20,
    "Cultural Fit":          0.20,
    "Profile Understanding": 0.15,
    "Tech Stack Alignment":  0.25,
}

CRITERIA = list(CRITERIA_WEIGHTS.keys())

# Max words sent to the agent to stay within token limits
MAX_FULL_TEXT_WORDS = 1200
MAX_CANDIDATE_TEXT_WORDS = 800


# ---------------------------------------------------------------------------
# Result dataclass
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
    recommendation: str          # PROCEED | REJECT | MAYBE
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
    Runs the AutoGen single-agent HR screening evaluation.

    Configured via settings.OLLAMA_URL, settings.OLLAMA_MODEL,
    and settings.OLLAMA_API_KEY from the project's .env file.
    """

    def __init__(self) -> None:
        self._llm_config = {
            "config_list": [
                {
                    "model":    settings.OLLAMA_MODEL,
                    "base_url": settings.OLLAMA_URL,
                    "api_key":  settings.OLLAMA_API_KEY,
                }
            ],
            "temperature": 0.1,   # Low temperature for consistent structured output
            "timeout":     120,
        }

    def evaluate(
        self,
        *,
        full_text: str,
        candidate_text: str,
        jd: str,
        filler_count: int,
    ) -> EvaluationResult:
        """
        Run the LLM-as-a-Judge evaluation for Stage 1.

        Args:
            full_text:      Complete interview transcript.
            candidate_text: Only the candidate's spoken lines.
            jd:             Job description text.
            filler_count:   Number of filler sounds detected in candidate speech.

        Returns:
            EvaluationResult with scores, recommendation, summaries.
        """
        full_text, candidate_text = self._trim_inputs(full_text, candidate_text)

        system_prompt = STAGE1_SYSTEM_PROMPT.format(filler_count=filler_count) \
            if "{filler_count}" in STAGE1_SYSTEM_PROMPT \
            else STAGE1_SYSTEM_PROMPT

        hr_evaluator = AssistantAgent(
            name="HREvaluator",
            llm_config=self._llm_config,
            system_message=system_prompt,
        )

        user_proxy = UserProxyAgent(
            name="HR_Coordinator",
            human_input_mode="NEVER",
            max_consecutive_auto_reply=1,
            code_execution_config=False,
        )

        user_message = STAGE1_USER_PROMPT.format(
            jd=jd.strip(),
            full_text=full_text,
            candidate_text=candidate_text,
            filler_count=filler_count,
        )

        user_proxy.initiate_chat(hr_evaluator, message=user_message)

        raw_output = self._collect_agent_output(user_proxy, hr_evaluator)
        logger.debug("Stage1Evaluator raw output (first 600 chars): %s", raw_output[:600])

        return self._parse_result(raw_output)

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    def _trim_inputs(
        self, full_text: str, candidate_text: str
    ) -> tuple[str, str]:
        """Trim inputs to stay within LLM token limits."""
        full_words = full_text.split()
        if len(full_words) > MAX_FULL_TEXT_WORDS:
            full_text = " ".join(full_words[:MAX_FULL_TEXT_WORDS]) + "\n[trimmed]"
            logger.info("Stage1Evaluator: full_text trimmed to %d words", MAX_FULL_TEXT_WORDS)

        cand_words = candidate_text.split()
        if len(cand_words) > MAX_CANDIDATE_TEXT_WORDS:
            candidate_text = " ".join(cand_words[:MAX_CANDIDATE_TEXT_WORDS]) + "\n[trimmed]"
            logger.info("Stage1Evaluator: candidate_text trimmed to %d words", MAX_CANDIDATE_TEXT_WORDS)

        return full_text, candidate_text

    def _collect_agent_output(
        self, user_proxy: UserProxyAgent, hr_evaluator: AssistantAgent
    ) -> str:
        """Collect all assistant message content into a single string."""
        messages = user_proxy.chat_messages.get(hr_evaluator, [])
        return " ".join(
            m.get("content", "")
            for m in messages
            if isinstance(m.get("content"), str) and m.get("role") == "assistant"
        )

    def _extract_json_blocks(self, text: str) -> list[dict]:
        """
        Extract all top-level JSON objects from text using bracket matching.
        More reliable than regex for nested structures.
        """
        blocks = []
        depth, start = 0, -1

        for idx, ch in enumerate(text):
            if ch == "{":
                if depth == 0:
                    start = idx
                depth += 1
            elif ch == "}":
                depth -= 1
                if depth == 0 and start != -1:
                    candidate_block = text[start : idx + 1]
                    try:
                        blocks.append(json.loads(candidate_block))
                    except json.JSONDecodeError:
                        logger.debug("Stage1Evaluator: failed to parse JSON block at idx=%d", idx)
                    start = -1

        return blocks

    def _parse_result(self, raw_output: str) -> EvaluationResult:
        """
        Parse the agent's raw text output into a typed EvaluationResult.

        Falls back to safe defaults if parsing partially fails.
        """
        blocks = self._extract_json_blocks(raw_output)

        criteria: dict[str, CriterionResult] = {}
        red_flags: list[str] = []
        final_block: dict = {}

        for block in blocks:
            # Collect per-criterion results
            for criterion in CRITERIA:
                if criterion in block and isinstance(block[criterion], dict):
                    c = block[criterion]
                    criteria[criterion] = CriterionResult(
                        score=int(c.get("score", 65)),
                        justification=str(c.get("justification", "")),
                        evidence=list(c.get("evidence", [])),
                    )

            if "red_flags" in block:
                red_flags = list(block["red_flags"])

            if "stage_score" in block:
                final_block = block

        # Compute weighted score — prefer agent's value, fall back to manual
        if "stage_score" in final_block:
            stage_score = float(final_block["stage_score"])
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
                "Stage1Evaluator: agent did not return stage_score, computed %.1f",
                stage_score,
            )

        # Determine recommendation
        recommendation = final_block.get("recommendation", "")
        if recommendation not in ("PROCEED", "REJECT", "MAYBE"):
            if stage_score >= 65:
                recommendation = "PROCEED"
            elif stage_score < 50:
                recommendation = "REJECT"
            else:
                recommendation = "MAYBE"
            logger.warning(
                "Stage1Evaluator: invalid recommendation in output, defaulting to %s",
                recommendation,
            )

        return EvaluationResult(
            criteria=criteria,
            red_flags=red_flags,
            stage_score=stage_score,
            recommendation=recommendation,
            recommendation_reason=final_block.get("recommendation_reason", ""),
            strength_summary=final_block.get("strength_summary", ""),
            weakness_summary=final_block.get("weakness_summary", ""),
            overall_summary=final_block.get("overall_summary", ""),
            suggested_followups=list(final_block.get("suggested_followups", [])),
        )