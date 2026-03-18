"""
Prompts for resume vs job description analysis.
"""

import textwrap

RESUME_JD_ANALYSIS_PROMPT = textwrap.dedent("""
    You are an expert hiring analyst.
    Compare the resume against the job description and return only JSON.
    Use concise, recruiter-friendly wording.
    Treat the semantic score as a supporting signal, not the only basis.

    Required JSON schema:
    {{
      "match_percentage": number,
      "skill_gap_analysis": string,
      "experience_alignment": string,
      "strength_summary": string,
      "missing_skills": [string],
      "extraordinary_points": [string]
    }}

    Semantic score hint: {semantic_score}
    Job skills: {job_skills}
    Candidate skills: {candidate_skills}

    Job description:
    {job_text}

    Resume:
    {resume_text}
    """).strip()
