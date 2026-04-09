import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from pgvector.sqlalchemy import Vector
from sqlalchemy import DateTime, ForeignKey, Integer, Text, Numeric
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.v1.core.config import settings
from app.v1.db.base import Base
from app.v1.utils.uuid import UUIDHelper

if TYPE_CHECKING:
    from app.v1.db.models.jobs import Job


class JobVersion(Base):
    """JobVersion ORM model.

    Represents a historical snapshot of a job description.

    Attributes:
        id: The primary key (UUID7).
        job_id: FK to the main job table.
        version_number: The version number of this snapshot (1, 2, ...).
        title: The title of the job at this version.
        jd_text: The job description text at this version.
        jd_json: The job description JSON at this version.
        jd_embedding: Vector embedding of the job description.
        custom_extraction_fields: Custom extraction fields at this version.
        created_at: Timestamp when this version was created.
    """

    __tablename__ = "job_versions"

    # PRIMARY KEY
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=UUIDHelper.generate_uuid7,
    )

    # FOREIGN KEY
    job_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("jobs.id", ondelete="CASCADE"),
        nullable=False,
    )

    version_number: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    # SNAPSHOT FIELDS
    title: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    vacancy: Mapped[int | None] = mapped_column(
        Integer,
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

    jd_embedding: Mapped[list | None] = mapped_column(
        Vector(settings.EMBEDDING_VECTOR_DIM),
        nullable=True,
    )

    custom_extraction_fields: Mapped[list[str] | None] = mapped_column(
        JSONB,
        nullable=True,
    )

    passing_threshold: Mapped[float] = mapped_column(
        Numeric(10, 2),
        default=65.0,
        nullable=False,
    )

    # TIMESTAMPS
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    # RELATIONSHIPS
    job: Mapped["Job"] = relationship(
        "Job", back_populates="versions", foreign_keys=[job_id]
    )
