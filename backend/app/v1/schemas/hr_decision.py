"""
Pydantic schemas for HR decision management.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, validator


class HRDecisionCreate(BaseModel):
    """Schema for creating a new HR decision."""

    decision: Literal["approve", "reject", "May Be"] = Field(
        ..., description="Decision value: approve, reject, or May Be"
    )
    notes: str | None = Field(
        None, 
        description="Optional notes for the decision. Required for 'May Be' decisions."
    )
    job_id: uuid.UUID | None = Field(
        None,
        description="Optional Job ID to link this decision to a specific job (e.g. for cross-matched candidates)."
    )
    stage_config_id: uuid.UUID | None = Field(
        None,
        description="Optional Stage Config ID to link this decision to a specific interview stage."
    )

    @validator('notes')
    def validate_may_be_notes(cls, v, values):
        """Ensure notes are provided for 'May Be' decisions."""
        if values.get('decision') == 'May Be' and (not v or not v.strip()):
            raise ValueError('Notes are required when decision is "May Be"')
        return v

    model_config = ConfigDict(from_attributes=True)


class HRDecisionResponse(BaseModel):
    """Schema for HR decision response."""

    id: uuid.UUID
    candidate_id: uuid.UUID
    stage_config_id: uuid.UUID | None
    job_id: uuid.UUID | None = None
    user_id: uuid.UUID
    decision: str
    notes: str | None
    decided_at: datetime

    model_config = ConfigDict(from_attributes=True)


class HRDecisionHistoryResponse(BaseModel):
    """Schema for candidate decision history."""

    candidate_id: uuid.UUID
    decisions: list[HRDecisionResponse]
    total_decisions: int
    may_be_count: int

    model_config = ConfigDict(from_attributes=True)


class HRDecisionUpdate(BaseModel):
    """Schema for updating an existing HR decision."""

    decision: Literal["approve", "reject", "May Be"] = Field(
        ..., description="Updated decision value"
    )
    notes: str | None = Field(
        None,
        description="Updated notes for the decision"
    )
    stage_config_id: uuid.UUID | None = Field(
        None,
        description="Updated Stage Config ID"
    )

    @validator('notes')
    def validate_may_be_notes(cls, v, values):
        """Ensure notes are provided for 'May Be' decisions."""
        if values.get('decision') == 'May Be' and (not v or not v.strip()):
            raise ValueError('Notes are required when decision is "May Be"')
        return v

    model_config = ConfigDict(from_attributes=True)


class HRDecisionSummary(BaseModel):
    """Summary of HR decisions — overall counts per status (global or per-job)."""

    total_candidates: int = Field(..., description="Total candidates with at least one decision")
    approved_count: int = Field(..., description="Candidates approved/proceeded")
    reject_count: int = Field(..., description="Candidates rejected")
    maybe_count: int = Field(..., description="Candidates marked as 'May Be'")
    undecided_count: int = Field(..., description="Candidates with no decision yet (total resumes - decided)")

    model_config = ConfigDict(from_attributes=True)


class HRJobDecisionSummary(BaseModel):
    """Summary of HR decisions for a specific job."""

    job_id: uuid.UUID
    total_candidates: int
    approved_count: int
    reject_count: int
    maybe_count: int
    undecided_count: int

    model_config = ConfigDict(from_attributes=True)
