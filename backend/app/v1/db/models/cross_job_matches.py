import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Numeric, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.v1.db.base_class import Base
from app.v1.utils.uuid import UUIDHelper

if TYPE_CHECKING:
    from app.v1.db.models.jobs import Job
    from app.v1.db.models.resumes import Resume
    from app.v1.db.models.candidates import Candidate


class CrossJobMatch(Base):
    """CrossJobMatch ORM model.

    Represents a match between a candidate's resume and another active job.
    Job-specific AI analysis is stored directly here — no duplicate Candidate records needed.

    Attributes:
        candidate_id: FK to the original candidate (no duplication).
        resume_id: FK to the original resume.
        original_job_id: FK to the job the candidate originally applied for.
        matched_job_id: FK to the job that was matched as a potential fit.
        match_score: The calculated match percentage (0 to 100).
        match_analysis: JSONB — job-specific AI analysis (missing_skills, score, etc.).
        created_at: Timestamp when the match was found.
    """

    __tablename__ = "cross_job_matches"

    # PRIMARY KEY
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=UUIDHelper.generate_uuid7,
    )

    # Direct link to original candidate (no duplicate records)
    candidate_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("candidates.id", ondelete="CASCADE"),
        nullable=True,
    )

    resume_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("resumes.id", ondelete="CASCADE"),
    )

    original_job_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("jobs.id", ondelete="SET NULL"),
        nullable=True,
    )

    matched_job_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("jobs.id", ondelete="CASCADE"),
    )

    match_score: Mapped[float] = mapped_column(
        Numeric,
        nullable=False,
    )

    # Job-specific AI analysis stored here (no need for duplicate resume records)
    match_analysis: Mapped[dict | None] = mapped_column(
        JSONB,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # RELATIONSHIPS
    candidate: Mapped["Candidate"] = relationship("Candidate", foreign_keys=[candidate_id])
    resume: Mapped["Resume"] = relationship("Resume", foreign_keys=[resume_id])
    original_job: Mapped["Job"] = relationship("Job", foreign_keys=[original_job_id])
    matched_job: Mapped["Job"] = relationship("Job", foreign_keys=[matched_job_id])
