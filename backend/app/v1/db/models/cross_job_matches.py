import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Numeric
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.v1.db.base_class import Base
from app.v1.utils.uuid import UUIDHelper

if TYPE_CHECKING:
    from ..db.models.audit_logs import AuditLog
    from app.v1.db.models.jobs import Job
    from app.v1.db.models.resumes import Resume


class CrossJobMatch(Base):
    """CrossJobMatch ORM model.

    Represents a match between a candidate's resume and another active job.

    Attributes:
        resume_id: FK to the resume that was matched.
        original_job_id: FK to the job the candidate originally applied for.
        matched_job_id: FK to the job that was matched as a potential fit.
        match_score: The calculated match percentage (0 to 100).
        created_at: Timestamp when the match was found.
    """

    __tablename__ = "cross_job_matches"

    # PRIMARY KEY
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=UUIDHelper.generate_uuid7,
    )

    resume_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("resumes.id", ondelete="CASCADE"),
    )

    original_job_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("jobs.id", ondelete="CASCADE"),
    )

    matched_job_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("jobs.id", ondelete="CASCADE"),
    )

    match_score: Mapped[float] = mapped_column(
        Numeric,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # RELATIONSHIPS
    resume: Mapped["Resume"] = relationship("Resume", foreign_keys=[resume_id])
    original_job: Mapped["Job"] = relationship("Job", foreign_keys=[original_job_id])
    matched_job: Mapped["Job"] = relationship("Job", foreign_keys=[matched_job_id])
