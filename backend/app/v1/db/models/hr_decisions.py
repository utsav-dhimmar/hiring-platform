import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.v1.db.base_class import Base
from app.v1.utils.uuid import UUIDHelper





class HrDecision(Base):
    """HrDecision ORM model.

    Represents an HR decision made on a candidate for a specific hiring stage.

    Attributes:
        id: The primary key (UUID7).
        candidate_id: FK to the candidate being evaluated.
        stage_config_id: FK to the job stage this decision belongs to.
        user_id: FK to the user making the decision.
        decision: The decision value — 'proceed', 'reject', or 'hold'.
        decided_at: Timestamp when the decision was made.
    """

    __tablename__ = "hr_decisions"

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
    )

    stage_config_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("job_stage_configs.id"),
        nullable=False,
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False,
    )

    # DECISION FIELD: 'proceed', 'reject', 'hold'
    decision: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    # TIMESTAMPS
    decided_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    # RELATIONSHIPS
    candidate = relationship("Candidate", foreign_keys=[candidate_id])
    stage_config = relationship("JobStageConfig", foreign_keys=[stage_config_id])
    user = relationship("User", foreign_keys=[user_id])
