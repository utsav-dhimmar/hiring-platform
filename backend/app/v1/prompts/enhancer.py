"""
Prompts for AI prompt enhancement utility.
"""

from textwrap import dedent

PROMPT_ENHANCER_SYSTEM_PROMPT = "You are an expert HR and Technical Interviewer."

PROMPT_ENHANCER_USER_PROMPT_TEMPLATE = dedent("""
    Generate a professional evaluation rubric for the following hiring criterion:
    
    Name: {name}
    Initial Description: {rough_description}

    Format Requirements:
    1. Start with exactly: "Evaluate the candidate's {name_lower}."
    2. Add a section: "Consider: [3-4 key technical or behavioral points to check]"
    3. Provide a section: "Scoring rubric:"
    - 1: [Specific behavior for very poor performance]
    - 2: [Specific behavior for below average]
    - 3: [Specific behavior for acceptable/meets expectations]
    - 4: [Specific behavior for strong/above average]
    - 5: [Specific behavior for exceptional mastery]

    Return ONLY the formatted text.
""").strip()
