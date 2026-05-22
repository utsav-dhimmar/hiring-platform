import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.v1.db.base import Base
from app.v1.utils.uuid import UUIDHelper

if TYPE_CHECKING:
    from app.v1.db.models.resumes import Resume
    from app.v1.db.models.jobs import Job


class ResumeVersionResult(Base):
    """Stores resume screening results per JD version.

    When a JD is updated and resumes are re-analyzed, old results are preserved
    here. Each row = one analysis of a resume against a specific JD version.

    Attributes:
        id: Primary key (UUID7).
        resume_id: FK to the resume.
        job_id: FK to the job.
        job_version_number: The JD version number this result is for.
        resume_score: AI match score (0-100).
        pass_fail: 'passed' or 'failed'.
        analysis_data: Full AI analysis JSONB (missing_skills, match_percentage, etc).
        analyzed_at: When this analysis was performed.
    """

    __tablename__ = "resume_version_results"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=UUIDHelper.generate_uuid7,
    )

    resume_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("resumes.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    job_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("jobs.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    job_version_number: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    resume_score: Mapped[float | None] = mapped_column(
        Numeric(5, 2),
        nullable=True,
    )

    pass_fail: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    analysis_data: Mapped[dict | None] = mapped_column(
        JSONB,
        nullable=True,
        comment="Full AI analysis: match_percentage, missing_skills, custom_extractions, etc.",
    )

    analyzed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    # RELATIONSHIPS
    resume: Mapped["Resume"] = relationship("Resume", foreign_keys=[resume_id])
    job: Mapped["Job"] = relationship("Job", foreign_keys=[job_id])
