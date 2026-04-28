from datetime import datetime
from typing import Any, Optional
from pydantic import BaseModel
import uuid

class TimelineEvent(BaseModel):
    event_type: str  # "stage" or "decision"
    event_date: datetime
    title: str
    description: Optional[str] = None
    result: Optional[str] = None
    score: Optional[float] = None
    stage_id: Optional[uuid.UUID] = None
    job_id: Optional[uuid.UUID] = None
    metadata: Optional[dict[str, Any]] = None

class HiringTimelineResponse(BaseModel):
    candidate_id: uuid.UUID
    events: list[TimelineEvent]
