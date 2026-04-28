import json
import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from typing import Dict, Any, Optional, List

class EvaluationRead(BaseModel):
    id: uuid.UUID
    interview_id: Optional[uuid.UUID] = None
    transcript_id: Optional[uuid.UUID] = None
    candidate_stage_id: uuid.UUID
    overall_score: Optional[float] = None
    result: str = "fail"
    evaluation_data: Dict[str, Any]
    highlights: Optional[Dict[str, Any]] = None
    sim_jd_resume: Optional[float] = None
    sim_jd_transcript: Optional[float] = None
    sim_resume_transcript: Optional[float] = None
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

# Mock Data
final_report = {
    "criteria": {
        "confidence": {"score": 3, "reasoning": "Test reason", "confidence": 0.71},
        "tech_stack": {"score": 4, "reasoning": "Strong tech", "confidence": 0.85}
    },
    "overall_summary": "Overall summary here.",
    "strengths": ["Strength 1"],
    "weaknesses": ["Weakness 1"],
    "suggested_followups": ["Followup 1"]
}

evidence_snippets = {
    "Confidence": ["Snippet 1", "Snippet 2"],
    "Tech Stack": ["Snippet A"]
}

# Restructure logic from Service
criteria_map = final_report.get("criteria", {})
structured_evaluation_data = {}
for key, details in criteria_map.items():
    criterion_name_match = None
    for crit_name in evidence_snippets.keys():
        if crit_name.lower().replace(" ", "_") == key:
            criterion_name_match = crit_name
            break
    
    structured_evaluation_data[key] = {
        "score": details.get("score", 0),
        "reasoning": details.get("reasoning", ""),
        "confidence": details.get("confidence", 0.0),
        "evidence": evidence_snippets.get(criterion_name_match, []) if criterion_name_match else []
    }

highlights = {
    "comment": "OR sugget me any good anem",
    "strengths": final_report.get("strengths", []),
    "weaknesses": final_report.get("weaknesses", []),
    "suggested_followups": final_report.get("suggested_followups", []),
    "overall_summary": final_report.get("overall_summary", ""),
    "recommendation": final_report.get("overall_summary", "")
}

response_obj = {
    "id": str(uuid.uuid4()),
    "interview_id": str(uuid.uuid4()),
    "transcript_id": str(uuid.uuid4()),
    "candidate_stage_id": str(uuid.uuid4()),
    "overall_score": 3.5,
    "result": "pass",
    "evaluation_data": structured_evaluation_data,
    "sim_jd_resume": 0.15,
    "sim_jd_transcript": 0.35,
    "sim_resume_transcript": 0.16,
    "created_at": datetime.now(),
    "highlights": highlights
}

# Validate with Pydantic
validated = EvaluationRead(**response_obj)
print(validated.model_dump_json(indent=2))
