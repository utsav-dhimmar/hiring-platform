import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class JobBase(BaseModel):
    title: str
    department: str | None = None
    jd_text: str | None = None
    jd_json: dict | None = None
    is_active: bool = True


class JobCreate(JobBase):
    pass


class JobRead(JobBase):
    id: uuid.UUID
    created_by: uuid.UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
