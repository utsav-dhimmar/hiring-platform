import uuid

from pydantic import BaseModel


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
