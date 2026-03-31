"""
Prompts and examples for resume extraction.
"""

import textwrap

from langextract.core.data import ExampleData, Extraction

RESUME_EXTRACTION_PROMPT = textwrap.dedent("""
    You are a precise resume parser. Your task is to extract ONLY explicitly stated information from the provided resume text.

    CRITICAL OUTPUT FORMAT REQUIREMENTS:
    1. You MUST output ONLY valid JSON.
    2. Do NOT include any conversational text, markdown formatting blocks (like ```json), greetings, or explanations.
    3. The root of your JSON object MUST contain exactly one key named "extractions".
    4. The value of "extractions" must be a list of the extracted entities.


    1. Extract information ONLY if it is explicitly mentioned in the text
    2. Do NOT infer, assume, or interpret implied information
    3. Do NOT fill in gaps or make logical deductions
    4. If a category is not explicitly mentioned, return "Not mentioned" for that field
    5. Return exact text as stated in the resume (do not paraphrase)
    6. For the experience section, do not interpret from the projects section, education or extra acivity section

    - name: Full name of the candidate
    - email: Candidate's email address
    - phone: Candidate's phone number
    - location: Candidate's current location (city, state, or country)
    - skills: Technical and professional skills (programming languages, tools, frameworks, soft skills)
    - experience: Work history including job title, company, dates, and responsibilities
    - education: Academic background including degree, institution, dates, and relevant details
    - certifications: Professional certifications with issuer and date when available
    - links: URLs (LinkedIn, GitHub, portfolio, etc.) with their type
    """)

RESUME_EXTRACTION_EXAMPLES = [
    ExampleData(
        text="""
        John Doe
        john.doe@email.com | +1 (555) 012-3456 | San Francisco, CA
        github.com/johndoe

        SKILLS
        Python, JavaScript, React, Machine Learning

        EXPERIENCE
        Senior Software Engineer | TechCorp Inc. | Jan 2023 - Present
        - Led development of microservices architecture serving 1M+ users
        - Reduced deployment time by 60% through automation

        EDUCATION
        Master of Science in Computer Science
        Stanford University | 2020 - 2022
        """,
        extractions=[
            Extraction(extraction_class="name", extraction_text="John Doe", attributes={}),
            Extraction(extraction_class="email", extraction_text="john.doe@email.com", attributes={}),
            Extraction(extraction_class="phone", extraction_text="+1 (555) 012-3456", attributes={}),
            Extraction(extraction_class="location", extraction_text="San Francisco, CA", attributes={"city": "San Francisco", "state": "CA"}),
            Extraction(extraction_class="skill", extraction_text="Python, JavaScript, React, Machine Learning", attributes={"category": "technical"}),
            Extraction(
                extraction_class="experience",
                extraction_text="Senior Software Engineer | TechCorp Inc. | Jan 2023 - Present\n- Led development of microservices architecture serving 1M+ users\n- Reduced deployment time by 60% through automation",
                attributes={
                    "title": "Senior Software Engineer",
                    "company": "TechCorp Inc.",
                    "start_date": "Jan 2023",
                    "end_date": "Present",
                    "duration": "3+ years",
                    "is_current": "true",
                },
            ),
            Extraction(
                extraction_class="education",
                extraction_text="Master of Science in Computer Science\nStanford University | 2020 - 2022",
                attributes={
                    "degree": "Master of Science in Computer Science",
                    "institution": "Stanford University",
                    "start_date": "2020",
                    "end_date": "2022",
                    "level": "graduate",
                },
            ),
            Extraction(extraction_class="link", extraction_text="github.com/johndoe", attributes={"type": "github", "platform": "GitHub"}),
        ],
    )
]
