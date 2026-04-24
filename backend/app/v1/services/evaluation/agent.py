
import json
import logging
import openai
from typing import Any, Dict, List
from app.v1.core.config import settings

logger = logging.getLogger(__name__)

class EvaluationAgent:
    """
    LLM Synthesis Agent for final candidate evaluation.
    Uses the mentor-approved system prompt and structured JSON output.
    """

    def __init__(self):
        self.client = openai.AsyncOpenAI(
            base_url=settings.OLLAMA_URL + "v1",
            api_key=settings.OLLAMA_API_KEY or "ollama"
        )

    async def synthesize_evaluation(
        self, 
        transcript_text: str, 
        jd_text: str, 
        resume_text: str,
        calculated_scores: Dict[str, float],
        evidence_snippets: Dict[str, List[str]]
    ) -> Dict[str, Any]:
        """
        Final synthesis phase. Combines deterministic scores and evidence into a readable report.
        """
        
        system_prompt = """You are an expert hiring evaluator.
You will be given:
- Interview transcript
- Job description
- Resume
- Calculated scores and evidence snippets
Your task is to evaluate the candidate across multiple criteria and assign a final reasoned score from 1 to 5.

STRICT SCORING RUBRIC:
- 1 = Very poor (major concerns, unacceptable for role)
- 2 = Below average (clear weaknesses, would require significant improvement)
- 3 = Acceptable (meets minimum expectations but not strong)
- 4 = Strong (above average, minor gaps only)
- 5 = Excellent (clearly stands out, no significant gaps)

Important rules:
- Be evidence-based (quote or reference transcript/resume).
- Do not assume anything not present.
- Avoid bias.
- If data is insufficient → say so and assign a conservative score (2 or 3).
- Do NOT default to 3 — use full range when justified.

Return structured JSON exactly as defined in the examples."""

        # Prepare evidence context
        evidence_context = ""
        for criterion, snippets in evidence_snippets.items():
            evidence_context += f"\n### Criterion: {criterion}\n"
            for s in snippets:
                evidence_context += f"- \"{s}\"\n"

        # Prepare dynamic JSON schema based on active criteria
        json_schema = ""
        allowed_keys = []
        for criterion in evidence_snippets.keys():
            key = criterion.lower().replace(" ", "_")
            allowed_keys.append(key)
            json_schema += f'  "{key}": {{ "score": int, "reasoning": "...", "confidence": float }},\n'

        user_prompt = f"""
STRICT REQUIREMENT: You MUST ONLY evaluate the following criteria: {', '.join(allowed_keys)}.
Do NOT include any other evaluation fields in your JSON response.

Calculated Preliminary Scores (Mathematical):
{json.dumps(calculated_scores, indent=2)}

Extracted Evidence Snippets:
{evidence_context}

TRANSCRIPT PREVIEW:
{transcript_text[:4000]}

Please provide the final evaluation in the following JSON format:
{{
{json_schema}  "overall_summary": "...",
  "strengths": ["...", "..."],
  "weaknesses": ["...", "..."],
  "suggested_followups": ["...", "..."]
}}
"""

        try:
            response = await self.client.chat.completions.create(
                model=settings.OLLAMA_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.0
            )

            raw_content = response.choices[0].message.content or "{}"
            return json.loads(raw_content)
        except Exception as e:
            logger.error(f"LLM Synthesis failed: {e}")
            return {"error": str(e)}

evaluation_agent = EvaluationAgent()
