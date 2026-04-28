import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import DateTime, ForeignKey, Numeric, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.v1.db.base_class import Base
from app.v1.utils.uuid import UUIDHelper

if TYPE_CHECKING:
    from app.v1.db.models.interviews import Interview
    from app.v1.db.models.transcripts import Transcript
    from app.v1.db.models.candidate_stages import CandidateStage


class Evaluation(Base):
    """Evaluation ORM model.

    Stores AI agent evaluations and manual HR form evaluation outputs.
    Records strict JSON outputs based on dynamic criteria.
    """

    __tablename__ = "evaluations"

    # PRIMARY KEY
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=UUIDHelper.generate_uuid7,
    )

    # FOREIGN KEYS
    interview_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("interviews.id", ondelete="SET NULL"),
        nullable=True,
    )

    transcript_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("transcripts.id", ondelete="SET NULL"),
        nullable=True,
    )

    # THIS TELLS WHICH CANDIDATE STAGE WE ARE EVALUATING (Stage 1, 2, etc.)
    candidate_stage_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("candidate_stages.id", ondelete="CASCADE"),
        nullable=False,
    )

    passing_threshold: Mapped[float] = mapped_column(
        Numeric(5, 2),
        default=3.5,
    )

    result: Mapped[str] = mapped_column(
        Text,
        default="fail",
    )

    # EVALUATION FIELDS
    evaluation_data: Mapped[dict] = mapped_column(
        JSONB,
        nullable=False,
    )

    overall_score: Mapped[float | None] = mapped_column(
        Numeric(5, 2),
        nullable=True,
    )

    recommendation: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    # SIMILARITY SCORES
    sim_jd_resume: Mapped[float | None] = mapped_column(
        Numeric(5, 4),
        nullable=True,
    )

    sim_jd_transcript: Mapped[float | None] = mapped_column(
        Numeric(5, 4),
        nullable=True,
    )

    sim_resume_transcript: Mapped[float | None] = mapped_column(
        Numeric(5, 4),
        nullable=True,
    )

    evidence_block: Mapped[dict | None] = mapped_column(
        JSONB,
        nullable=True,
    )

    # TIMESTAMPS
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    # RELATIONSHIPS
    interview: Mapped[Optional["Interview"]] = relationship("Interview", foreign_keys=[interview_id])
    transcript: Mapped[Optional["Transcript"]] = relationship("Transcript", foreign_keys=[transcript_id])
    candidate_stage: Mapped["CandidateStage"] = relationship("CandidateStage", foreign_keys=[candidate_stage_id])

    @property
    def highlights(self) -> dict | None:
        """Parses the highlights, with backward compatibility for old formats."""
        # 1. Try parsing recommendation column (New format stores JSON here)
        if self.recommendation:
            try:
                import json
                data = json.loads(self.recommendation)
                if isinstance(data, dict) and "overall_summary" in data:
                    return data
            except (json.JSONDecodeError, TypeError):
                pass

        # 2. Try pulling from evaluation_data (Old format stored everything there)
        if isinstance(self.evaluation_data, dict) and ("strengths" in self.evaluation_data or "criteria" in self.evaluation_data):
            return {
                "strengths": self.evaluation_data.get("strengths", []),
                "weaknesses": self.evaluation_data.get("weaknesses", []),
                "suggested_followups": self.evaluation_data.get("suggested_followups", []),
                "overall_summary": self.evaluation_data.get("overall_summary", self.recommendation),
                "recommendation": f"{self.result.upper()} - {self.evaluation_data.get('overall_summary', self.recommendation)}",
            }

        # 3. Fallback for very old or manual records
        return {
            "strengths": [],
            "weaknesses": [],
            "suggested_followups": [],
            "overall_summary": self.recommendation,
            "recommendation": f"{self.result.upper()} - {self.recommendation}",
        }

    @property
    def structured_evaluation_data(self) -> dict:
        """Ensures evaluation_data only returns the criteria map, with evidence injected for old records."""
        if not isinstance(self.evaluation_data, dict):
            return {}
        
        # Determine the criteria map
        criteria = {}
        if "criteria" in self.evaluation_data:
            # Old format
            criteria = self.evaluation_data["criteria"]
        else:
            # New format
            criteria = self.evaluation_data

        # If it's a dictionary, ensure each criterion has confidence and evidence
        if isinstance(criteria, dict):
            # Try to inject evidence from evidence_block if it's missing in the criterion
            for key, details in criteria.items():
                if isinstance(details, dict):
                    # Default confidence if missing
                    if "confidence" not in details:
                        details["confidence"] = 0.0
                    
                    # Inject evidence if missing or empty
                    if not details.get("evidence"):
                        if isinstance(self.evidence_block, dict):
                            # Match name (snake_case key vs Title Case evidence_block key)
                            for ev_name, snippets in self.evidence_block.items():
                                if ev_name.lower().replace(" ", "_") == key:
                                    details["evidence"] = snippets
                                    break
                        
                        # Final fallback if still missing
                        if "evidence" not in details:
                            details["evidence"] = []
                            
        return criteria
