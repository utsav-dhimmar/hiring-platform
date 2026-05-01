import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class JobPositionBase(BaseModel):
    name: str

class JobPositionCreate(JobPositionBase):
    pass

class JobPositionUpdate(BaseModel):
    name: str | None = None

class JobPositionRead(JobPositionBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
