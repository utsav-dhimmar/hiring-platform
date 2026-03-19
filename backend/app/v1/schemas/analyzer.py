from pydantic import BaseModel, Field


class MissingSkillItem(BaseModel):
    """A single missing skill with its importance score."""

    name: str
    score: float = Field(ge=0, le=100)


class ResumeJobAnalysisResult(BaseModel):
    """Result of the LLM-based analysis comparing a resume to a job description."""

    match_percentage: float = Field(ge=0, le=100)
    skill_gap_analysis: str
    experience_alignment: str
    strength_summary: str
    missing_skills: list[MissingSkillItem] = Field(default_factory=list)
    extraordinary_points: list[str] = Field(default_factory=list)
