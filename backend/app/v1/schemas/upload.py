"""
Upload schemas module.

This module defines Pydantic models for resume upload requests, responses,
and processing status information.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.v1.schemas.job import JobRead


class ResumeProcessingInfo(BaseModel):
    """Information about the background processing status of a resume."""

    status: str
    error: str | None = None


class MissingSkill(BaseModel):
    """A single missing skill with its importance score."""

    name: str
    score: float = Field(ge=0, le=100)


class ResumeMatchAnalysis(BaseModel):
    """Structured analysis of a resume's match with a job description."""

    match_percentage: float = Field(ge=0, le=100)
    skill_gap_analysis: str
    experience_alignment: str
    strength_summary: str
    missing_skills: list[MissingSkill]
    extraordinary_points: list[str]


class ResumeUploadResponse(BaseModel):
    """Response returned after a resume is successfully uploaded."""

    message: str
    job_id: uuid.UUID
    candidate_id: uuid.UUID
    file_id: uuid.UUID
    resume_id: uuid.UUID
    file_name: str
    file_type: str
    size: int
    source_url: str
    parsed: bool
    processing: ResumeProcessingInfo
    analysis: ResumeMatchAnalysis | None = None


class ResumeStatusResponse(BaseModel):
    """Response containing the current status and analysis of a resume."""

    job_id: uuid.UUID
    candidate_id: uuid.UUID
    file_id: uuid.UUID
    resume_id: uuid.UUID
    file_name: str
    file_type: str
    size: int
    source_url: str
    parsed: bool
    processing: ResumeProcessingInfo
    analysis: ResumeMatchAnalysis | None = None


class JobResumeInfoResponse(BaseModel):
    """Detailed information about a resume associated with a job."""

    job_id: uuid.UUID
    candidate_id: uuid.UUID
    candidate_first_name: str | None = None
    candidate_last_name: str | None = None
    candidate_email: str | None = None
    file_id: uuid.UUID
    resume_id: uuid.UUID
    file_name: str
    file_type: str
    size: int
    source_url: str
    uploaded_at: datetime
    parsed: bool
    processing: ResumeProcessingInfo
    analysis: ResumeMatchAnalysis | None = None
    resume_score: float | None = None
    pass_fail: bool | None = None


class JobResumesResponse(BaseModel):
    """Response containing a list of all resumes for a specific job."""

    job_id: uuid.UUID
    job: Optional["JobRead"] = None
    resumes: list[JobResumeInfoResponse]


class CandidateResponse(BaseModel):
    """Response representing a candidate and their resume status."""

    id: uuid.UUID
    first_name: str | None = None
    last_name: str | None = None
    email: str | None = None
    phone: str | None = None
    current_status: str | None = None
    created_at: datetime
    resume_analysis: ResumeMatchAnalysis | None = None
    resume_score: float | None = None
    pass_fail: bool | None = None
    is_parsed: bool = False
    processing_status: str | None = None
    processing_error: str | None = None


class JobCandidatesResponse(BaseModel):
    """Response containing a list of all candidates for a specific job."""

    job_id: uuid.UUID
    candidates: list[CandidateResponse]


class CustomFieldRequest(BaseModel):
    """A single custom field to extract from the resume."""
    title: str = Field(..., description="The name or title of the piece of information (e.g. 'Age', 'Notice Period')")
    description: str = Field(..., description="Detailed instructions on what to extract for this field.")

class CustomExtractionRequest(BaseModel):
    """Request payload containing a list of custom fields to extract."""
    fields: list[CustomFieldRequest]

class CustomFieldResponse(BaseModel):
    """The extraction result for a single custom field."""
    title: str
    value: str

class CustomExtractionResponse(BaseModel):
    """Response containing the list of extracted custom fields."""
    job_id: uuid.UUID
    resume_id: uuid.UUID
    results: list[CustomFieldResponse]
