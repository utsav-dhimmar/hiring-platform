import uuid
from typing import TYPE_CHECKING

from pgvector.sqlalchemy import Vector
from sqlalchemy import ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.v1.core.config import settings
from app.v1.db.base_class import Base
from app.v1.utils.uuid import UUIDHelper

if TYPE_CHECKING:
    from app.v1.db.models.jobs import Job


class JobChunk(Base):
    """JobChunk ORM model.

    Represents a segmented part of a job description with its vector embedding.

    Attributes:
        id: The primary key (UUID7).
        job_id: FK to the job this chunk belongs to.
        chunk_text: The raw text of this specific JD segment.
        chunk_embedding: Vector embedding of the chunk text.
    """

    __tablename__ = "job_chunks"

    # PRIMARY KEY
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=UUIDHelper.generate_uuid7,
    )

    # FOREIGN KEYS
    job_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("jobs.id", ondelete="CASCADE"),
        nullable=False,
    )

    # CHUNK CONTENT
    chunk_text: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    # VECTOR EMBEDDING
    chunk_embedding: Mapped[list | None] = mapped_column(
        Vector(settings.EMBEDDING_VECTOR_DIM),
        nullable=True,
    )

    # RELATIONSHIPS
    job: Mapped["Job"] = relationship("Job", back_populates="chunks")
