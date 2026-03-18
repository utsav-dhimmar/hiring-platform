import uuid

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
