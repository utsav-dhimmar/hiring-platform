import uuid
from datetime import datetime

from pgvector.sqlalchemy import Vector
from sqlalchemy import DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.v1.core.config import settings
from app.v1.db.base import Base
from app.v1.utils.uuid import UUIDHelper


class CoverLetter(Base):
    """CoverLetter ORM model.

    Represents a cover letter linked to a candidate, file, and optionally a resume.

    Attributes:
        id: The primary key (UUID7).
        candidate_id: FK to the candidate this cover letter belongs to.
        file_id: FK to the file record.
        resume_id: Optional FK to the companion resume submitted with this cover letter.
        extracted_text: Extracted text content from the cover letter.
        uploaded_at: Timestamp when cover letter was uploaded.
    """

    __tablename__ = "cover_letters"

    # PRIMARY KEY
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=UUIDHelper.generate_uuid7,
    )
    cover_letter_embedding: Mapped[list | None] = mapped_column(
        Vector(settings.EMBEDDING_VECTOR_DIM),
        nullable=True,
    )

    # FOREIGN KEYS
    candidate_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("candidates.id"),
        nullable=False,
    )

    file_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("files.id"),
        nullable=False,
    )

    # OPTIONAL: companion resume submitted with this cover letter
    resume_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("resumes.id"),
        nullable=True,
    )

    # FIELDS
    extracted_text: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    # TIMESTAMPS
    uploaded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    # RELATIONSHIPS
    candidate = relationship("Candidate", foreign_keys=[candidate_id])
    file = relationship("File", foreign_keys=[file_id])
    resume = relationship("Resume", foreign_keys=[resume_id])
