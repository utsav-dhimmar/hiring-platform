"""
Pydantic schemas for Job-related data transfer.
"""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class JobBase(BaseModel):
    """
    Base schema for Job data with shared attributes.
    """

    title: str
    department: str | None = None
    jd_text: str | None = None
    jd_json: dict | None = None
    is_active: bool = True


class JobCreate(JobBase):
    """
    Schema for creating a new Job.
    """

    pass


class JobUpdate(BaseModel):
    """
    Schema for updating an existing Job.
    """

    title: str | None = None
    department: str | None = None
    jd_text: str | None = None
    jd_json: dict | None = None
    is_active: bool | None = None


class JobRead(JobBase):
    """
    Schema for reading Job data, including database-generated fields.
    """

    id: uuid.UUID
    created_by: uuid.UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
