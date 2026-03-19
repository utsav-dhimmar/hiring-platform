"""
Embedding instructions for semantic matching.
"""

RESUME_INSTRUCTION = (
    "Instruct: Given a job description, retrieve relevant candidate resumes\nPassage: "
)
JD_INSTRUCTION = (
    "Instruct: Given a job description, retrieve relevant candidate resumes\nQuery: "
)
SKILL_INSTRUCTION = (
    "Instruct: Represent this hiring skill for semantic matching\nPassage: "
)
TRANSCRIPT_INSTRUCTION = (
    "Instruct: Represent this interview transcript for candidate evaluation\nPassage: "
)