import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.v1.db.base_class import Base


from app.v1.utils.uuid import UUIDHelper


class Transcript(Base):
    """Transcript ORM model.

    Represents a generated transcript from an interview recording.

    Attributes:
        id: The primary key (UUID7).
        recording_id: FK to the recording this transcript is generated from.
        transcript_text: Full plain text of the transcript.
        segments: Structured JSONB segments with speaker and timing info.
        generated_at: Timestamp when transcript was generated.
    """

    __tablename__ = "transcripts"

    # PRIMARY KEY
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=UUIDHelper.generate_uuid7,
    )

    # FOREIGN KEY
    recording_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("recordings.id"),
        nullable=False,
    )

    # TRANSCRIPT FIELDS
    transcript_text: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    # Segments format: {START: 0.0, SP1: "...", SP2: "...", END: 1.1}
    segments: Mapped[dict | None] = mapped_column(
        JSONB,
        nullable=True,
    )

    # TIMESTAMPS
    generated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    # RELATIONSHIPS
    recording = relationship("Recording", foreign_keys=[recording_id])
