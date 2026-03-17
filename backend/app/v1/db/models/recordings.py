import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.v1.db.base_class import Base


def generate_uuid7():
    return uuid.uuid7()


class Recording(Base):
    """Recording ORM model.

    Represents an audio/video recording of an interview.

    Attributes:
        id: The primary key (UUID7).
        interview_id: FK to the interview this recording belongs to.
        file_id: FK to the file record where recording is stored.
        format: File format (e.g., mp3, wav, mp4).
        duration_seconds: Length of the recording in seconds.
        uploaded_at: Timestamp when recording was uploaded.
        processing_status: Status — 'uploaded', 'processing', 'completed', 'failed'.
    """

    __tablename__ = "recordings"

    # PRIMARY KEY
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=generate_uuid7,
    )

    # FOREIGN KEYS
    interview_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("interviews.id"),
        nullable=False,
    )

    file_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("files.id"),
        nullable=False,
    )

    # RECORDING FIELDS
    format: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    duration_seconds: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    # TIMESTAMPS
    uploaded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    # STATUS: 'uploaded', 'processing', 'completed', 'failed'
    processing_status: Mapped[str] = mapped_column(
        Text,
        default="uploaded",
        nullable=False,
    )

    # RELATIONSHIPS
    interview = relationship("Interview", foreign_keys=[interview_id])
    file = relationship("File", foreign_keys=[file_id])
