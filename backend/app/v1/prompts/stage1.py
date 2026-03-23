"""
Stage 1 HR screening evaluation prompts.
"""

STAGE1_SYSTEM_MESSAGE = (
    "You are an expert HR screening evaluator. "
    "Return ONLY valid JSON. No markdown, no text outside the JSON object. "
    "Start your response with { and end with }."
)

STAGE1_PROMPT_PART1 = """\
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
{jd}
RESUME CONTEXT:
{resume_context}
CANDIDATE SPEECH:
{candidate_text}

Return ONLY valid JSON."""


STAGE1_PROMPT_PART2 = """\
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
{jd}
RESUME CONTEXT:
{resume_context}
CANDIDATE SPEECH:
{candidate_text}

Return ONLY valid JSON."""