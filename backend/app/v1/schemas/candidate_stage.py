from datetime import datetime
from typing import Any, Optional
import uuid

from pydantic import BaseModel, ConfigDict, Field


class CandidateStageBase(BaseModel):
    """Base schema for Candidate Stage data."""

    status: str = Field("pending", description="Current status in this stage")
    evaluation_data: dict[str, Any] | None = Field(None, description="Stage-specific results/feedback")
    interviewer_id: Optional[uuid.UUID] = Field(None, description="Assigned interviewer ID")


class CandidateStageCreate(CandidateStageBase):
    """Schema for creating a candidate stage entry."""

    candidate_id: uuid.UUID
    job_stage_id: uuid.UUID


class CandidateStageUpdate(BaseModel):
    """Schema for updating a candidate stage's results or status."""

    status: Optional[str] = None
    evaluation_data: Optional[dict[str, Any]] = None
    interviewer_id: Optional[uuid.UUID] = None
    completed_at: Optional[datetime] = None


class CandidateStageRead(CandidateStageBase):
    """Schema for reading Candidate Stage data."""

    id: uuid.UUID
    candidate_id: uuid.UUID
    job_stage_id: uuid.UUID
    started_at: datetime
    completed_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class CandidateStageSummary(BaseModel):
    """Minimal summary of a stage for embedding in candidate responses."""

    stage_id: uuid.UUID
    template_name: str
    status: str
    order: int
    job_id: uuid.UUID | None = None
    job_name: str | None = None
    completed_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)
