import asyncio

from sqlalchemy import delete, insert, select

from app.v1.db import Job, Skill, job_skills
from app.v1.db.session import async_session_maker, init_db
from seed_for_user import ensure_dev_test_role, ensure_user, get_admin_role
from seed_skills import ensure_skills

JOB_TITLE = "Senior Next.js Developer"
JOB_DEPARTMENT = "Engineering"
JOB_LOCATION = "Remote"
JOB_CREATOR_EMAIL = "utsav@gmail.com"

JOB_DESCRIPTION = """This is a remote position.

About August Infotech,
By leveraging user-centric thinking, design capabilities, new technologies and cloud solutions, we empower our clients and allow them to rethink how they connect with their customers across every platform, every device and every step of the customer journey. As part of an end-to-end delivery, our technical team builds compelling digital experiences with a focus on channels such as the web and mobile.

A Typical Day of a Senior Next.js Developer at August Infotech
As a Senior, your day may include:
- Starting with reviewing project updates, emails, and sprint boards to prioritize tasks.
- Collaborating with designers, backend developers, and project managers to align on requirements.
- Reviewing tasks from the previous day and ensuring smooth progress toward project milestones.
- Conducting code reviews, mentoring junior developers, and ensuring adherence to best practices.
- Developing scalable, performant, and SEO-optimized web applications using Next.js, React, and modern frontend ecosystems.
- Implementing SSR, SSG, ISR, and CSR rendering strategies based on project requirements.
- Integrating APIs, GraphQL, and headless CMS solutions with Next.js applications.
- Debugging, optimizing performance (Lighthouse, Core Web Vitals), and ensuring responsive, cross-browser UI.
- Communicating with clients to provide updates, gather requirements, and suggest improvements.
- Documenting technical solutions, updating project management tools, and planning upcoming tasks.
- Wrapping up with reflection on deliverables, pending blockers, and mentoring sessions.

Requirements
Technical Responsibilities:
- Next.js application development (SSR, SSG, ISR, CSR).
- Front-end architecture design and optimization.
- API integration (REST/GraphQL/Headless CMS).
- Performance optimization (SEO, Core Web Vitals, Lighthouse scores).
- UI/UX implementation with Tailwind CSS, Styled Components, or similar libraries.
- State management (Redux, Recoil, Context API).
- Testing and debugging with Jest, React Testing Library, and Cypress.
- Deployment on Vercel, AWS, or other cloud environments.
- Code quality, best practices, and documentation.
- Client communication and requirement gathering.

Management and Leadership Responsibilities:
- Mentor junior and intermediate developers.
- Participate in hiring and technical interviews.
- Conduct regular code reviews and provide constructive feedback.
- Collaborate in sprint planning, stand-ups, and retrospectives.
- Contribute to project specification, architecture, and roadmap discussions.
- Promote best practices in front-end engineering and encourage innovation.

Qualifications and Skills:
- Bachelor's degree in Computer Science, Engineering, or equivalent experience.
- 4+ years of hands-on experience in React.js and Next.js development.
- Strong knowledge of JavaScript (ES6+), TypeScript, HTML5, CSS3.
- Expertise in server-side rendering, static site generation, and incremental static regeneration.
- Experience with headless CMS (Contentful, Strapi, Sanity, WP headless, etc.).
- Familiarity with DevOps, CI/CD pipelines, and cloud deployment (Vercel, AWS, Azure, Netlify).
- Excellent problem-solving, debugging, and communication skills.
- Strong leadership and mentoring abilities.
- Familiarity with Agile and Scrum methodologies.

Benefits
- Fully remote
- 5 Days Working
- Technical growth
- Practical use of Generative AI
- Monthly PMRS (Performance Management Review System)"""

JOB_JSON = {
    "company": "August Infotech",
    "title": JOB_TITLE,
    "department": JOB_DEPARTMENT,
    "employment_type": None,
    "work_mode": JOB_LOCATION,
    "summary": (
        "Senior frontend engineering role focused on building performant, "
        "SEO-optimized Next.js applications while mentoring developers and "
        "collaborating with clients."
    ),
    "responsibilities": [
        "Build scalable Next.js applications with SSR, SSG, ISR, and CSR strategies.",
        "Collaborate with designers, backend developers, and project managers.",
        "Review code, mentor junior developers, and enforce frontend best practices.",
        "Integrate REST APIs, GraphQL services, and headless CMS solutions.",
        "Optimize Lighthouse scores, Core Web Vitals, SEO, and responsive UI behavior.",
        "Document solutions and communicate delivery updates with clients.",
    ],
    "requirements": {
        "experience_years": 4,
        "education": (
            "Bachelor's degree in Computer Science, Engineering, or equivalent experience"
        ),
        "must_have": [
            "React.js",
            "Next.js",
            "JavaScript",
            "TypeScript",
            "HTML5",
            "CSS3",
            "Headless CMS",
            "GraphQL",
            "REST API",
            "Tailwind CSS",
            "Styled Components",
            "Redux",
            "Recoil",
            "Context API",
            "Jest",
            "React Testing Library",
            "Cypress",
            "Vercel",
            "AWS",
            "CI/CD",
            "SEO",
            "Core Web Vitals",
            "Agile",
            "Scrum",
        ],
    },
    "benefits": [
        "Fully remote",
        "5 Days Working",
        "Technical growth",
        "Practical use of Generative AI",
        "Monthly PMRS (Performance Management Review System)",
    ],
}

REQUIRED_SKILLS = [
    "Next.js",
    "React",
    "JavaScript",
    "TypeScript",
    "HTML5",
    "CSS3",
    "GraphQL",
    "REST API",
    "Headless CMS",
    "Tailwind CSS",
    "Styled Components",
    "Redux",
    "Recoil",
    "Context API",
    "Jest",
    "React Testing Library",
    "Cypress",
    "Vercel",
    "AWS",
    "CI/CD",
    "SEO",
    "Core Web Vitals",
    "Agile",
    "Scrum",
]


async def ensure_job(session, creator_id, skills: list[Skill]) -> Job:
    job = (
        await session.execute(
            select(Job).where(
                Job.title == JOB_TITLE,
                Job.created_by == creator_id,
            )
        )
    ).scalars().first()

    if job:
        job.department = JOB_DEPARTMENT
        job.jd_text = JOB_DESCRIPTION
        job.jd_json = JOB_JSON
        job.is_active = True
    else:
        job = Job(
            title=JOB_TITLE,
            department=JOB_DEPARTMENT,
            jd_text=JOB_DESCRIPTION,
            jd_json=JOB_JSON,
            jd_embedding=None,
            created_by=creator_id,
            is_active=True,
        )
        session.add(job)
        await session.flush()

    skill_ids = [skill.id for skill in skills if skill.name in REQUIRED_SKILLS]
    await session.execute(delete(job_skills).where(job_skills.c.job_id == job.id))
    if skill_ids:
        await session.execute(
            insert(job_skills),
            [{"job_id": job.id, "skill_id": skill_id} for skill_id in skill_ids],
        )

    await session.flush()
    return job


async def main():
    await init_db()

    async with async_session_maker() as session:
        admin_role = await get_admin_role(session)
        role = await ensure_dev_test_role(session, admin_role)
        user = await ensure_user(session, role)
        skills = await ensure_skills(session)
        job = await ensure_job(session, user.id, skills)
        await session.commit()

        print(f"Job ready: {job.title}")
        print(f"Created by: {JOB_CREATOR_EMAIL}")
        print(f"Required skills linked: {len(REQUIRED_SKILLS)}")


if __name__ == "__main__":
    asyncio.run(main())
