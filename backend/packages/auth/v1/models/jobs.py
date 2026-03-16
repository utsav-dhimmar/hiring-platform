import uuid
from datetime import datetime

from pgvector.sqlalchemy import Vector
from sqlalchemy import Boolean, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.db.base_class import Base


def generate_uuid7():
    return uuid.uuid7()


class Job(Base):
    """Job ORM model.

    Represents a job posting in the hiring platform.

    Attributes:
        id: The primary key of the job (UUID7).
        title: The title of the job (not null).
        department: The department for the job (optional).
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
        default=generate_uuid7,
    )

    # JOB FIELDS
    title: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    department: Mapped[str | None] = mapped_column(
        Text,
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
        Vector(1536),
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
    creator = relationship("User", foreign_keys=[created_by])
