import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class JobPriorityBase(BaseModel):
    name: str
    duration_days: int


class JobPriorityCreate(JobPriorityBase):
    pass


class JobPriorityUpdate(BaseModel):
    name: str | None = None
    duration_days: int | None = None


class JobPriorityRead(JobPriorityBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
