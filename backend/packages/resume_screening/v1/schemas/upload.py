import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class ResumeProcessingInfo(BaseModel):
    status: str
    error: str | None = None


class ResumeMatchAnalysis(BaseModel):
    match_percentage: float = Field(ge=0, le=100)
    skill_gap_analysis: str
    experience_alignment: str
    strength_summary: str
    missing_skills: list[str]
    extraordinary_points: list[str]


class ResumeUploadResponse(BaseModel):
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


from packages.jobs.v1.schema.job import JobRead


class JobResumesResponse(BaseModel):
    job_id: uuid.UUID
    job: JobRead | None = None
    resumes: list[JobResumeInfoResponse]


class CandidateResponse(BaseModel):
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


class JobCandidatesResponse(BaseModel):
    job_id: uuid.UUID
    candidates: list[CandidateResponse]
