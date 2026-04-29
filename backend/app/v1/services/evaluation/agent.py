import json
import logging
import openai
from typing import Any, Dict, List, Optional
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
        evidence_snippets: Dict[str, List[str]],
        criteria_names: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Final synthesis phase. Combines deterministic scores and evidence into a readable report.
        """
        
        # Prepare Resume Context section
        resume_section = ""
        resume_mention = "- Resume\n"
        if resume_text and resume_text.strip():
            resume_section = f"### CONTEXT:\nRESUME SUMMARY:\n{resume_text}\n"
        else:
            resume_mention = ""

        system_prompt = f"""You are an expert hiring evaluator.
You will be given:
- Interview transcript (PRIMARY SOURCE)
- Job description (DEFINES REQUIREMENTS)
{resume_mention}- Calculated scores and evidence snippets

STRICT EVALUATION RULES:
1. DEFINING REQUIREMENTS: Only the "Job Description" defines the required stack. Do NOT assume a technology is "required" or "part of the stack" just because a candidate mentions it or it appears in their resume.
2. EVIDENCE SOURCE: Evaluate the candidate's skills based ONLY on the "Interview Transcript". Use the "Resume" (if provided) only for background context or to verify consistency; do NOT use it to award points for skills not discussed in the interview.
3. NO HALLUCINATIONS: If a technology is discussed in the transcript but is NOT in the Job Description, you may mention it as a "Strength", but do NOT call it a "required stack alignment".
4. SOURCE INTEGRITY: Do not be misled by summary sections or "Interviewer Assessments" that might be present in the transcript text; perform your own independent evaluation of the dialogue.

STRICT SCORING RUBRIC:
- 1 = Very poor (major concerns, unacceptable for role)
- 2 = Below average (clear weaknesses, would require significant improvement)
- 3 = Acceptable (meets minimum expectations but not strong)
- 4 = Strong (above average, minor gaps only)
- 5 = Excellent (clearly stands out, no significant gaps)

Important rules:
- Be evidence-based (quote or reference transcript).
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
        schema_parts = []
        allowed_keys = []
        target_criteria = criteria_names if criteria_names else list(evidence_snippets.keys())
        for criterion in target_criteria:
            key = criterion.lower().replace(" ", "_")
            allowed_keys.append(key)
            schema_parts.append(f'    "{key}": {{ "score": int, "reasoning": "...", "confidence": float }}')
        json_schema = ",\n".join(schema_parts)

        user_prompt = f"""
STRICT REQUIREMENT: You MUST ONLY evaluate the following criteria: {', '.join(allowed_keys)}.
Do NOT include any other evaluation fields in your JSON response.

### CONTEXT:
JOB DESCRIPTION:
{jd_text[:3000]}

{resume_section}
### EVALUATION DATA:
Calculated Preliminary Scores (Mathematical):
{json.dumps(calculated_scores, indent=2)}

Extracted Evidence Snippets:
{evidence_context}

TRANSCRIPT PREVIEW:
{transcript_text[:4000]}

Please provide the final evaluation in the following JSON format:
{{
  "criteria": {{
{json_schema}
  }},
  "overall_summary": "...",
  "strengths": ["...", "..."],
  "weaknesses": ["...", "..."],
  "suggested_followups": ["...", "..."],
  "recommendation": "..."
}}

Note: For each criterion in "criteria", provide:
- "score": int (1-5)
- "reasoning": "A concise explanation based on evidence."
- "confidence": float (0.0 to 1.0, indicating your certainty based on the transcript)

For "recommendation", provide a professional 2-3 sentence summary of the final verdict and the most critical reason for it.
"""

        logger.info(f"LLM SYSTEM PROMPT: {system_prompt}")
        logger.info(f"LLM USER PROMPT: {user_prompt}")

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
            logger.info(f"LLM Synthesis Raw Output: {raw_content}")
            return json.loads(raw_content)
        except Exception as e:
            logger.error(f"LLM Synthesis failed: {e}")
            return {"error": str(e)}

evaluation_agent = EvaluationAgent()
