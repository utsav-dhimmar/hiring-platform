from sqlalchemy import Column, ForeignKey, Table
from sqlalchemy.dialects.postgresql import UUID

from app.v1.db.base_class import Base

# Junction table for many-to-many relationship between Job and Skill
# A single job can require multiple skills
# A single skill can appear in multiple jobs
job_skills = Table(
    "job_skills",
    Base.metadata,
    # FOREIGN KEYS
    Column(
        "job_id",
        UUID(as_uuid=True),
        ForeignKey("jobs.id"),
        primary_key=True,
        nullable=False,
    ),
    Column(
        "skill_id",
        UUID(as_uuid=True),
        ForeignKey("skills.id"),
        primary_key=True,
        nullable=False,
    ),
)
