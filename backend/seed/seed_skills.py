import asyncio

from sqlalchemy import select

from app.v1.core.embeddings import embedding_service
from app.v1.db.models.skills import Skill
from app.v1.db.session import async_session_maker, init_db
from app.v1.utils.text import build_skill_text

SKILLS = [
    ("FastAPI", "High-performance Python web framework for building APIs"),
    (
        "Docker",
        "Containerization platform for packaging and deploying applications",
    ),
    ("React", "JavaScript library for building user interfaces"),
    ("Django", "Python web framework for rapid development"),
    (
        "Next.js",
        "React framework for server-side rendering and static site generation",
    ),
    (
        "Python",
        "High-level programming language for general-purpose programming",
    ),
    ("JavaScript", "Programming language for web development"),
    ("TypeScript", "Typed superset of JavaScript"),
    ("Node.js", "JavaScript runtime for server-side applications"),
    ("PostgreSQL", "Advanced open-source relational database"),
    ("MongoDB", "NoSQL document database"),
    ("Redis", "In-memory data structure store"),
    ("AWS", "Amazon Web Services cloud platform"),
    ("Google Cloud", "Google Cloud Platform cloud services"),
    ("Kubernetes", "Container orchestration platform"),
    ("GraphQL", "Query language for APIs"),
    ("REST API", "Architectural style for web services"),
    ("Microservices", "Architecture pattern for building distributed systems"),
    ("CI/CD", "Continuous Integration and Continuous Deployment"),
    ("Git", "Version control system"),
    ("SQL", "Structured Query Language for databases"),
    ("NoSQL", "Non-relational database technology"),
    ("Tailwind CSS", "Utility-first CSS framework"),
    ("SQLAlchemy", "Python SQL toolkit and ORM"),
    ("Elasticsearch", "Distributed search and analytics engine"),
    ("Nginx", "Web server and reverse proxy"),
    ("HTML5", "Markup language standard for structuring web content"),
    ("CSS3", "Style sheet language for modern web presentation"),
    ("Styled Components", "CSS-in-JS library for styling React applications"),
    (
        "Headless CMS",
        "Content management architecture with decoupled frontend delivery",
    ),
    ("Redux", "Predictable state container for JavaScript applications"),
    ("Recoil", "State management library for React applications"),
    ("Context API", "React API for sharing state across component trees"),
    ("Jest", "JavaScript testing framework"),
    (
        "React Testing Library",
        "Testing utilities focused on React component behavior",
    ),
    ("Cypress", "End-to-end testing framework for web applications"),
    ("Vercel", "Cloud platform optimized for frontend deployments"),
    ("SEO", "Search engine optimization practices for discoverability"),
    (
        "Core Web Vitals",
        "Performance metrics that measure real-world user experience",
    ),
    ("Agile", "Iterative project delivery methodology"),
    ("Scrum", "Agile framework for sprint-based team collaboration"),
]


async def ensure_skills(session) -> list[Skill]:
    existing_skills = {
        skill.name: skill
        for skill in (
            (await session.execute(select(Skill).order_by(Skill.name))).scalars().all()
        )
    }

    skills = []
    for name, description in SKILLS:
        skill = existing_skills.get(name)
        if skill:
            if skill.description != description:
                skill.description = description
            skill_text = build_skill_text(skill)
            skill.skill_embedding = embedding_service.encode_skill(skill_text) if skill_text else None
            skills.append(skill)
            continue

        skill = Skill(name=name, description=description)
        skill_text = build_skill_text(skill)
        skill.skill_embedding = embedding_service.encode_skill(skill_text) if skill_text else None
        session.add(skill)
        skills.append(skill)

    await session.flush()
    return skills


async def main():
    await init_db()

    async with async_session_maker() as session:
        skills = await ensure_skills(session)
        await session.commit()

        print(f"Seeded {len(skills)} skills successfully!")
        for skill in skills:
            print(f"  - {skill.name}")


if __name__ == "__main__":
    asyncio.run(main())
