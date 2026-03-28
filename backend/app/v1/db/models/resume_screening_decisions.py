import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.v1.db.base_class import Base
from app.v1.utils.uuid import UUIDHelper


class ResumeScreeningDecision(Base):
    """ResumeScreeningDecision ORM model.

    Represents an HR decision made on a candidate specifically for the resume screening phase.

    Attributes:
        id: The primary key (UUID7).
        candidate_id: FK to the candidate being evaluated.
        user_id: FK to the user making the decision.
        decision: The decision value — 'approve', 'reject', or 'maybe'.
        note: Optional note regarding the decision.
        created_at: Timestamp when the decision was made.
    """

    __tablename__ = "resume_screening_decisions"

    # PRIMARY KEY
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=UUIDHelper.generate_uuid7,
    )

    # FOREIGN KEYS
    candidate_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("candidates.id"),
        nullable=False,
        unique=True, # One screening decision per candidate
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False,
    )

    # DECISION FIELD: 'approve', 'reject', 'maybe'
    decision: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    # NOTE FIELD
    note: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    # TIMESTAMPS
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    # RELATIONSHIPS
    candidate = relationship("Candidate", back_populates="screening_decision")
    user = relationship("User")
