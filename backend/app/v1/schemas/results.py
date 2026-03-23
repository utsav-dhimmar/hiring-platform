from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class ResumeScreeningResult(BaseModel):
    candidate_id: uuid.UUID
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    resume_score: Optional[float] = None
    pass_fail: Optional[bool] = None
    analysis: Optional[dict] = None
    applied_at: datetime


class ResumeScreeningResultsResponse(BaseModel):
    job_id: uuid.UUID
    results: list[ResumeScreeningResult]


class HRRoundResult(BaseModel):
    interview_id: uuid.UUID
    candidate_id: uuid.UUID
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    status: str
    overall_score: Optional[float] = None
    recommendation: Optional[str] = None
    evaluation: Optional[dict] = None
    scheduled_at: datetime


class HRRoundResultsResponse(BaseModel):
    job_id: uuid.UUID
    results: list[HRRoundResult]
