import json
import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field
from typing import Dict, Any, Optional, List

class EvaluationRead(BaseModel):
    id: uuid.UUID
    interview_id: Optional[uuid.UUID] = None
    transcript_id: Optional[uuid.UUID] = None
    candidate_stage_id: uuid.UUID
    overall_score: Optional[float] = None
    result: str = "fail"
    evaluation_data: Dict[str, Any] = Field(..., validation_alias="structured_evaluation_data")
    highlights: Optional[Dict[str, Any]] = None
    sim_jd_resume: Optional[float] = None
    sim_jd_transcript: Optional[float] = None
    sim_resume_transcript: Optional[float] = None
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

class MockEvaluation:
    def __init__(self):
        self.id = uuid.uuid4()
        self.interview_id = uuid.uuid4()
        self.transcript_id = uuid.uuid4()
        self.candidate_stage_id = uuid.uuid4()
        self.overall_score = 2.2
        self.result = "fail"
        self.recommendation = "Original recommendation text"
        self.created_at = datetime.now()
        self.sim_jd_resume = 0.1
        self.sim_jd_transcript = 0.2
        self.sim_resume_transcript = 0.3
        
        # OLD FORMAT DATA
        self.evaluation_data = {
            "criteria": {
                "tech_stack": {"score": 3, "reasoning": "Old reasoning"},
                "communication": {"score": 2, "reasoning": "Old comms"}
            },
            "strengths": ["Old strength"],
            "weaknesses": ["Old weakness"],
            "overall_summary": "Old summary"
        }

    @property
    def highlights(self) -> dict | None:
        if isinstance(self.evaluation_data, dict) and ("strengths" in self.evaluation_data or "criteria" in self.evaluation_data):
            return {
                "overall_summary": self.evaluation_data.get("overall_summary", self.recommendation),
                "recommendation": self.recommendation,
                "strengths": self.evaluation_data.get("strengths", []),
                "weaknesses": self.evaluation_data.get("weaknesses", []),
                "suggested_followups": self.evaluation_data.get("suggested_followups", []),
                "comment": self.evaluation_data.get("comment", "OR sugget me any good anem")
            }
        return {}

    @property
    def structured_evaluation_data(self) -> dict:
        if "criteria" in self.evaluation_data:
            return self.evaluation_data["criteria"]
        return self.evaluation_data

# Test mapping
mock_eval = MockEvaluation()
validated = EvaluationRead.model_validate(mock_eval)
print(validated.model_dump_json(indent=2))
