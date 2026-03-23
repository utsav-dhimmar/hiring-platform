"""
Stage 1 HR Screening Evaluator.

Uses two sequential AG2 agent calls to stay within Ollama Cloud's
output token limit:
  - Call 1: Communication Skill, Confidence, Cultural Fit
  - Call 2: Profile Understanding, Tech Stack Alignment + all summary fields

Results are merged and parsed into a typed EvaluationResult.
"""

from __future__ import annotations

import json
import logging
import re
from dataclasses import dataclass, field

from autogen import AssistantAgent, UserProxyAgent

from app.v1.core.config import settings

logger = logging.getLogger(__name__)

CRITERIA_WEIGHTS: dict[str, float] = {
    "Communication Skill":   0.20,
    "Confidence":            0.20,
    "Cultural Fit":          0.20,
    "Profile Understanding": 0.15,
    "Tech Stack Alignment":  0.25,
}

CRITERIA = list(CRITERIA_WEIGHTS.keys())

MAX_FULL_TEXT_WORDS     = 300
MAX_CANDIDATE_TEXT_WORDS = 200


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
                    "base_url":   settings.OLLAMA_URL,
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

        Split into two calls to stay within Ollama Cloud token limits:
          Call 1 → Communication Skill, Confidence, Cultural Fit
          Call 2 → Profile Understanding, Tech Stack Alignment + summaries

        Returns a merged EvaluationResult.
        """
        full_text, candidate_text = self._trim_inputs(full_text, candidate_text)
        jd_trimmed = jd.strip()[:300]

        # ── Call 1: First 3 criteria ─────────────────────────────────
        prompt1 = f"""\
You are an HR evaluator. Evaluate ONLY these 3 criteria and return ONLY this JSON.
No markdown, no text outside the JSON. Start with {{ and end with }}.

{{
  "Communication Skill": {{"score": <0-100>, "justification": "<2 sentences>", "evidence": ["<direct quote from candidate speech>"]}},
  "Confidence":          {{"score": <0-100>, "justification": "<2 sentences>", "evidence": ["<direct quote>"]}},
  "Cultural Fit":        {{"score": <0-100>, "justification": "<2 sentences>", "evidence": ["<direct quote>"]}}
}}

SCORING GUIDES:
- Communication Skill (weight 20%): clarity, vocabulary, sentence structure. Filler word count: {filler_count} — high count lowers score.
- Confidence (weight 20%): decisive answers, no excessive hedging or backtracking.
- Cultural Fit (weight 20%): teamwork signals, ownership mindset, enthusiasm, attitude.

JOB DESCRIPTION:
{jd_trimmed}

CANDIDATE SPEECH:
{candidate_text}

Return ONLY valid JSON."""

        result1 = self._run_agent(prompt1)
        logger.info("Stage1Evaluator call 1 keys: %s", list(result1.keys()))

        # ── Call 2: Last 2 criteria + summaries ──────────────────────
        comm_score  = result1.get("Communication Skill", {}).get("score", 65)
        conf_score  = result1.get("Confidence",          {}).get("score", 65)
        cult_score  = result1.get("Cultural Fit",        {}).get("score", 65)

        prompt2 = f"""\
You are an HR evaluator. Evaluate ONLY these 2 criteria plus summary fields and return ONLY this JSON.
No markdown, no text outside the JSON. Start with {{ and end with }}.

{{
  "Profile Understanding": {{"score": <0-100>, "justification": "<2 sentences>", "evidence": ["<direct quote>"]}},
  "Tech Stack Alignment":  {{"score": <0-100>, "justification": "<2 sentences>", "evidence": ["<direct quote>"]}},
  "red_flags":             ["<specific concern if any, or empty list>"],
  "stage_score":           <compute as: ({comm_score}*0.20 + {conf_score}*0.20 + {cult_score}*0.20 + ProfileUnderstanding*0.15 + TechStack*0.25)>,
  "recommendation":        "PROCEED" or "REJECT" or "MAYBE",
  "recommendation_reason": "<one sentence explaining decision>",
  "strength_summary":      "<paragraph about key strengths>",
  "weakness_summary":      "<paragraph about gaps and concerns>",
  "overall_summary":       "<2-3 sentence HR record>",
  "suggested_followups":   ["<Stage 2 question>", "<question>", "<question>"]
}}

SCORING GUIDES:
- Profile Understanding (weight 15%): self-awareness, career clarity, honest self-assessment.
- Tech Stack Alignment (weight 25%): JD technologies mentioned and explained by candidate.

DECISION RULES:
- PROCEED if stage_score >= 65 and no critical red flags.
- REJECT  if stage_score < 50 or multiple serious red flags.
- MAYBE   if stage_score is 50-64.

JOB DESCRIPTION:
{jd_trimmed}

CANDIDATE SPEECH:
{candidate_text}

Return ONLY valid JSON."""

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
        """
        Run a single AG2 agent call and return the parsed JSON dict.
        Returns empty dict on parse failure.
        """
        hr_evaluator = AssistantAgent(
            name="HREvaluator",
            llm_config=self._llm_config,
            system_message=(
                "You are an expert HR screening evaluator. "
                "Return ONLY valid JSON. No markdown, no text outside the JSON object. "
                "Start your response with { and end with }."
            ),
        )
        user_proxy = UserProxyAgent(
            name="HR_Coordinator",
            human_input_mode="NEVER",
            max_consecutive_auto_reply=1,
            code_execution_config=False,
        )

        user_proxy.initiate_chat(hr_evaluator, message=prompt)

        raw = self._collect_agent_output(user_proxy, hr_evaluator)
        logger.debug("Stage1Evaluator raw output (300 chars): %s", raw[:300])

        return self._safe_parse(raw)

    def _collect_agent_output(
        self, user_proxy: UserProxyAgent, hr_evaluator: AssistantAgent
    ) -> str:
        """
        Collect LLM response from chat messages.

        In AutoGen's message structure the LLM reply appears as role 'user'
        in user_proxy.chat_messages. We skip the first message (our own
        prompt) and join everything else.
        """
        messages = user_proxy.chat_messages.get(hr_evaluator, [])
        parts = []
        for m in messages:
            content = m.get("content", "")
            if isinstance(content, str) and content.strip():
                parts.append(content)
        # parts[0] is our own prompt — skip it
        return " ".join(parts[1:])

    def _safe_parse(self, raw: str) -> dict:
        """
        Parse JSON from raw agent output with multiple fallback strategies.
        """
        # Strip markdown fences
        cleaned = re.sub(r"```json\s*", "", raw)
        cleaned = re.sub(r"```\s*", "", cleaned).strip()

        # Direct parse
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError:
            pass

        # Fix trailing commas
        fixed = re.sub(r",\s*([}\]])", r"\1", cleaned)
        try:
            return json.loads(fixed)
        except json.JSONDecodeError:
            pass

        # Bracket matching — find first complete JSON object
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
            "Stage1Evaluator: all parse strategies failed. Raw output: %s", raw[:400]
        )
        return {}

    def _parse_merged(self, data: dict) -> EvaluationResult:
        """
        Build a typed EvaluationResult from the merged dict of both agent calls.
        Falls back to safe defaults for any missing fields.
        """
        criteria: dict[str, CriterionResult] = {}
        for name in CRITERIA:
            c = data.get(name, {})
            criteria[name] = CriterionResult(
                score=int(c.get("score", 0)),
                justification=str(c.get("justification", "")),
                evidence=list(c.get("evidence", [])),
            )

        # Compute weighted score — prefer agent's value, fall back to manual
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