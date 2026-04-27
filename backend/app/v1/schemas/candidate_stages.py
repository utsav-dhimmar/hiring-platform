from typing import Literal, Dict, Optional, Any
from pydantic import BaseModel, Field, ConfigDict
import uuid
from datetime import datetime

class EvaluationRead(BaseModel):
    id: uuid.UUID
    interview_id: Optional[uuid.UUID] = None
    transcript_id: Optional[uuid.UUID] = None
    candidate_stage_id: uuid.UUID
    evaluation_data: Dict[str, Any]
    overall_score: Optional[float] = None
    recommendation: Optional[str] = None
    sim_jd_resume: Optional[float] = None
    sim_jd_transcript: Optional[float] = None
    sim_resume_transcript: Optional[float] = None
    evidence_block: Optional[Dict[str, Any]] = None
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class StageOverrideCreate(BaseModel):
    override_reason: str = Field(..., description="Mandatory reason for overriding the AI evaluation")
    override_recommendation: Optional[Literal["approve", "reject", "May Be"]] = Field(None, description="Override the AI's final recommendation")
    criterion_scores: Optional[Dict[str, float]] = Field(None, description="Optional override of specific criteria scores")

class StageDecisionCreate(BaseModel):
    decision: Literal["approve", "reject", "May Be"] = Field(..., description="Final decision for this stage")
    notes: Optional[str] = Field(None, description="Optional decision notes")
