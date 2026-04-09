"""
Pydantic schemas for Job-related data transfer.
"""

import uuid
from datetime import datetime

from app.v1.schemas.department import DepartmentRead
from app.v1.schemas.job_stage import JobStageConfigRead
from app.v1.schemas.skill import SkillRead
from pydantic import BaseModel, ConfigDict


class JobBase(BaseModel):
    """
    Base schema for Job data with shared attributes.
    """

    title: str
    vacancy: int | None = None
    department_id: uuid.UUID | None = None
    jd_text: str | None = None
    jd_json: dict | None = None
    is_active: bool = True
    passing_threshold: float = 65.0
    custom_extraction_fields: list[str] | None = None


class JobCreate(JobBase):
    """
    Schema for creating a new Job.
    """

    skill_ids: list[uuid.UUID] = []


class JobUpdate(BaseModel):
    """
    Schema for updating an existing Job.
    """

    title: str | None = None
    vacancy: int | None = None
    department_id: uuid.UUID | None = None
    jd_text: str | None = None
    jd_json: dict | None = None
    is_active: bool | None = None
    skill_ids: list[uuid.UUID] | None = None
    passing_threshold: float | None = None
    custom_extraction_fields: list[str] | None = None


class JobStatusUpdate(BaseModel):
    """
    Schema for updating only the job's active status.
    """

    is_active: bool


class JobVersionMinimal(BaseModel):
    """
    Minimal schema for a Job version, showing only version number and its unique ID.
    """

    version_num: int
    id: uuid.UUID
    model_config = ConfigDict(from_attributes=True)


class JobVersionRead(BaseModel):
    """
    Schema for reading full Job version snapshot data.
    """

    id: uuid.UUID
    job_id: uuid.UUID
    version_number: int
    title: str
    vacancy: int | None = None
    jd_text: str | None = None
    jd_json: dict | None = None
    custom_extraction_fields: list[str] | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class JobRead(JobBase):
    """
    Schema for reading Job data, including database-generated fields.
    """

    id: uuid.UUID
    version: int = 1
    total_versions: int = 0
    job_versions: list[JobVersionMinimal] = []
    created_by: uuid.UUID
    created_at: datetime
    department_name: str | None = None
    department: DepartmentRead | None = None
    skills: list[SkillRead] = []
    stages: list[JobStageConfigRead] = []
    decision_summary: dict | None = None
    automated_screening_summary: dict | None = None
    total_candidates: int | None = None
    current_session_candidates: int | None = None
    activity_sessions: list[JobActivitySession] | None = None

    model_config = ConfigDict(from_attributes=True)


class JobsListRead(BaseModel):
    """
    Schema for a paginated list of jobs.
    """

    data: list[JobRead]
    total: int
    global_decision_summary: dict | None = None
    global_screening_summary: dict | None = None

class JobActivitySession(BaseModel):
    """
    Schema for a single job activation session.
    Represents a period where the job was active.
    """

    session_id: int
    start_date: datetime
    end_date: datetime | None = None
    candidate_count: int
    is_current: bool

    model_config = ConfigDict(from_attributes=True)


class JobActivityHistoryResponse(BaseModel):
    """
    Response schema for job activity history.
    """

    job_id: uuid.UUID
    total_candidates: int
    sessions: list[JobActivitySession]

    model_config = ConfigDict(from_attributes=True)
