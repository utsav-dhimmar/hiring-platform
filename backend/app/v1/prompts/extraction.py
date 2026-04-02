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
    - location: Candidate's most granular location. Priority: City > State > Country. Extract ONLY the city name if found (e.g., "Bilimora"). If city is missing, use State. Do NOT extract societies, landmarks, buildings, or full street addresses.
    - skills: Technical and professional skills (programming languages, tools, frameworks, soft skills)
    - experience: Work history including job title, company, dates, and responsibilities
    - education: Academic background including degree, institution, dates, and relevant details
    - certifications: Professional certifications with issuer and date when available
    - links: A single string containing URLs (LinkedIn, GitHub, portfolio, etc.). If multiple links exist, separate them with semicolons. Format: "link1; link2; link3"
    - extraordinary_highlights: A semicolon-separated string of ELITE-TIER achievements only. Focus on truly rare items: Awards, major patents, speaking at global conferences, Ivy League/top-10 education, or technical scale in the millions (e.g., "Scaled system to 10M+ users"; "Speaker at React Conf"; "Recipient of National Innovation Award"). EXCLUDE standard job duties or common certifications. If none, return "Not mentioned".
    - experience_summary: A 1-2 sentence overview of the candidate's professional tenure and core domains (e.g., "6+ years of experience in Fullstack development with a focus on scalable SaaS platforms").
    - professional_summary: A synthesized 2-3 sentence technical summary of the candidate's core value proposition and career profile. (Always provide this).
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
            Extraction(
                extraction_class="extraordinary_highlights", 
                extraction_text="Master of Science from Stanford University, Led development for 1M+ users", 
                attributes={}
            ),
            Extraction(
                extraction_class="professional_summary", 
                extraction_text="High-impact Senior Software Engineer with a Master's from Stanford and extensive experience in scaling microservices architecture.", 
                attributes={}
            ),
        ],
    )
]
