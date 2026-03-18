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
        linkedin.com/in/johndoe | github.com/johndoe

        SKILLS
        Python, JavaScript, React, AWS, Docker, Kubernetes, Machine Learning, Agile/Scrum

        EXPERIENCE

        Senior Software Engineer | TechCorp Inc. | Jan 2023 - Present
        - Led development of microservices architecture serving 1M+ users
        - Managed team of 5 engineers and implemented CI/CD pipelines
        - Reduced deployment time by 60% through automation

        Software Developer | StartupXYZ | Jun 2022 - Dec 2023
        - Built RESTful APIs using Node.js and MongoDB
        - Collaborated with product team to deliver features on tight deadlines

        EDUCATION

        Master of Science in Computer Science
        Stanford University | 2020 - 2022
        GPA: 3.8/4.0

        Bachelor of Science in Software Engineering
        MIT | 2016 - 2020

        CERTIFICATIONS

        AWS Certified Solutions Architect - Professional | Amazon Web Services | 2021
        Certified Scrum Master (CSM) | Scrum Alliance | 2019
        """,
        extractions=[
            Extraction(
                extraction_class="name",
                extraction_text="John Doe",
                attributes={},
            ),
            Extraction(
                extraction_class="email",
                extraction_text="john.doe@email.com",
                attributes={},
            ),
            Extraction(
                extraction_class="phone",
                extraction_text="+1 (555) 012-3456",
                attributes={},
            ),
            Extraction(
                extraction_class="location",
                extraction_text="San Francisco, CA",
                attributes={"city": "San Francisco", "state": "CA"},
            ),
            Extraction(
                extraction_class="skill",
                extraction_text="Python, JavaScript, React, AWS, Docker, Kubernetes, Machine Learning, Agile/Scrum",
                attributes={"category": "technical"},
            ),
            Extraction(
                extraction_class="experience",
                extraction_text="Senior Software Engineer | TechCorp Inc. | Jan 2023 - Present\n- Led development of microservices architecture serving 1M+ users\n- Managed team of 5 engineers and implemented CI/CD pipelines\n- Reduced deployment time by 60% through automation",
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
                extraction_class="experience",
                extraction_text="Software Developer | StartupXYZ | Jun2022 - Dec 2023 \n- Built RESTful APIs using Node.js and MongoDB\n- Collaborated with product team to deliver features on tight deadlines",
                attributes={
                    "title": "Software Developer",
                    "company": "StartupXYZ",
                    "start_date": "Jun 2022",
                    "end_date": "Dec 2023",
                    "duration": "1.5 years",
                    "is_current": "false",
                },
            ),
            Extraction(
                extraction_class="education",
                extraction_text="Master of Science in Computer Science\nStanford University | 2020 - 2022\nGPA: 3.8/4.0",
                attributes={
                    "degree": "Master of Science in Computer Science",
                    "institution": "Stanford University",
                    "start_date": "2020",
                    "end_date": "2022",
                    "gpa": "3.8/4.0",
                    "level": "graduate",
                },
            ),
            Extraction(
                extraction_class="education",
                extraction_text="Bachelor of Science in Software Engineering\nMIT | 2016 - 2020",
                attributes={
                    "degree": "Bachelor of Science in Software Engineering",
                    "institution": "MIT",
                    "start_date": "2016",
                    "end_date": "2020",
                    "level": "undergraduate",
                },
            ),
            Extraction(
                extraction_class="certification",
                extraction_text="AWS Certified Solutions Architect - Professional | Amazon Web Services | 2023",
                attributes={
                    "name": "AWS Certified Solutions Architect - Professional",
                    "issuer": "Amazon Web Services",
                    "date": "2023",
                    "type": "cloud",
                },
            ),
            Extraction(
                extraction_class="certification",
                extraction_text="Certified Scrum Master (CSM) | Scrum Alliance | 2021",
                attributes={
                    "name": "Certified Scrum Master (CSM)",
                    "issuer": "Scrum Alliance",
                    "date": "2021",
                    "type": "methodology",
                },
            ),
            Extraction(
                extraction_class="link",
                extraction_text="linkedin.com/in/johndoe",
                attributes={"type": "linkedin", "platform": "LinkedIn"},
            ),
            Extraction(
                extraction_class="link",
                extraction_text="github.com/johndoe",
                attributes={"type": "github", "platform": "GitHub"},
            ),
        ],
    )
]
