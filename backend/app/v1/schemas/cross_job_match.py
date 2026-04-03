import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from .job import JobRead

class CrossJobMatchBase(BaseModel):
    """Base schema for CrossJobMatch."""
    resume_id: uuid.UUID
    original_job_id: uuid.UUID
    matched_job_id: uuid.UUID
    match_score: float

class CrossJobMatchCreate(CrossJobMatchBase):
    """Schema for creating a CrossJobMatch."""
    pass

class CrossJobMatchRead(CrossJobMatchBase):
    """Schema for reading CrossJobMatch data."""
    created_at: datetime
    matched_job: JobRead | None = None

    model_config = ConfigDict(from_attributes=True)

class CrossJobMatchResponse(BaseModel):
    """Response schema for a list of cross-job matches."""
    resume_id: uuid.UUID
    matches: dict[uuid.UUID, CrossJobMatchRead]
