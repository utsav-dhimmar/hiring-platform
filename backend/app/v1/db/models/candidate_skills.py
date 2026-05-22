from sqlalchemy import Column, ForeignKey, Table
from sqlalchemy.dialects.postgresql import UUID

from app.v1.db.base_class import Base

# Junction table for many-to-many relationship between Candidate and Skill
# Tracks which candidate has which skill
candidate_skills = Table(
    "candidate_skills",
    Base.metadata,
    # FOREIGN KEYS
    Column(
        "candidate_id",
        UUID(as_uuid=True),
        ForeignKey("candidates.id", ondelete="CASCADE"),
        primary_key=True,
        nullable=False,
    ),
    Column(
        "skill_id",
        UUID(as_uuid=True),
        ForeignKey("skills.id", ondelete="CASCADE"),
        primary_key=True,
        nullable=False,
    ),
)
