import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from pgvector.sqlalchemy import Vector
from sqlalchemy import Boolean, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.v1.core.config import settings
from app.v1.db.base import Base

if TYPE_CHECKING:
    from app.v1.db.models.candidates import Candidate
    from app.v1.db.models.departments import Department
    from app.v1.db.models.job_stage_configs import JobStageConfig
    from app.v1.db.models.skills import Skill
    from app.v1.db.models.user import User

from app.v1.db.models.job_skills import job_skills
from app.v1.utils.uuid import UUIDHelper


class Job(Base):
    """Job ORM model.

    Represents a job posting in the hiring platform.

    Attributes:
        id: The primary key of the job (UUID7).
        title: The title of the job (not null).
        department_id: FK to the departments table (optional).
        department: Relationship to the Department entity.
        jd_text: The job description as plain text (optional).
        jd_json: The job description as structured JSON (optional).
        jd_embedding: Combined vector embedding of title + department + jd_text + jd_json.
        created_by: FK to the user who created this job.
        created_at: Timestamp when job was created.
        is_active: Whether the job posting is active.
    """

    __tablename__ = "jobs"

    # PRIMARY KEY
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=UUIDHelper.generate_uuid7,
    )

    # JOB FIELDS
    title: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    # DEPARTMENT FK (replaces plain text department column)
    department_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("departments.id", ondelete="SET NULL"),
        nullable=True,
    )

    jd_text: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    jd_json: Mapped[dict | None] = mapped_column(
        JSONB,
        nullable=True,
    )

    # VECTOR EMBEDDING (title + department + jd_text + jd_json combined)
    jd_embedding: Mapped[list | None] = mapped_column(
        Vector(settings.EMBEDDING_VECTOR_DIM),
        nullable=True,
    )

    # FOREIGN KEY
    created_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False,
    )

    # TIMESTAMPS
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    # STATUS
    is_active: Mapped[bool] = mapped_column(
        Boolean(),
        default=True,
        nullable=False,
    )

    # RELATIONSHIPS
    creator: Mapped["User"] = relationship(
        "User", back_populates="jobs", foreign_keys=[created_by]
    )
    candidates: Mapped[list["Candidate"]] = relationship(
        "Candidate", back_populates="applied_job"
    )
    skills: Mapped[list["Skill"]] = relationship(
        "Skill",
        secondary=job_skills,
        back_populates="jobs",
    )
    stages: Mapped[list["JobStageConfig"]] = relationship(
        "JobStageConfig",
        back_populates="job",
        order_by="JobStageConfig.stage_order",
        cascade="all, delete-orphan",
    )
    department: Mapped[Optional["Department"]] = relationship(
        "Department",
        back_populates="jobs",
        foreign_keys=[department_id],
        lazy="joined",
    )

    @property
    def department_name(self) -> str | None:
        """Return the department name for convenience (used in serialisation)."""
        return self.department.name if self.department else None
