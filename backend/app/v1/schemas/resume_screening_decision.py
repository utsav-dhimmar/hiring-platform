import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class ResumeScreeningDecisionBase(BaseModel):
    """Base schema for Resume Screening Decision."""
    decision: str = Field(..., description="The decision value: 'approve', 'reject', or 'maybe'")
    note: Optional[str] = Field(None, description="Optional note regarding the decision")


class ResumeScreeningDecisionCreate(ResumeScreeningDecisionBase):
    """Schema for creating a Resume Screening Decision."""
    candidate_id: uuid.UUID


class ResumeScreeningDecisionRead(ResumeScreeningDecisionBase):
    """Schema for reading a Resume Screening Decision."""
    id: uuid.UUID
    candidate_id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime

    class Config:
        from_attributes = True
