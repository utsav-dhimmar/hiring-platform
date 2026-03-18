"""
Embedding and resume-vs-JD analysis helpers.
"""

from __future__ import annotations

import json
from functools import lru_cache

import numpy as np
from langextract.core import types as core_types
from langextract.providers.ollama import OllamaLanguageModel
from pydantic import BaseModel, Field
from sentence_transformers import SentenceTransformer

from app.core.config import settings

RESUME_INSTRUCTION = (
    "Instruct: Given a job description, retrieve relevant candidate resumes\nPassage: "
)
JD_INSTRUCTION = (
    "Instruct: Given a job description, retrieve relevant candidate resumes\nQuery: "
)
SKILL_INSTRUCTION = (
    "Instruct: Represent this hiring skill for semantic matching\nPassage: "
)


class ResumeJobAnalysisResult(BaseModel):
    """Result of the LLM-based analysis comparing a resume to a job description."""

    match_percentage: float = Field(ge=0, le=100)
    skill_gap_analysis: str
    experience_alignment: str
    strength_summary: str
    missing_skills: list[str] = Field(default_factory=list)
    extraordinary_points: list[str] = Field(default_factory=list)


@lru_cache(maxsize=1)
def get_embedding_model() -> SentenceTransformer:
    """Retrieve the shared singleton instance of the embedding model.

    Returns:
        The loaded SentenceTransformer model.
    """
    return SentenceTransformer(settings.EMBEDDING_MODEL_NAME)


def preload_embedding_model() -> SentenceTransformer:
    return get_embedding_model()


def _fit_vector_dim(vector: list[float]) -> list[float]:
    """Ensure the vector matches the configured target dimension.

    Truncates or pads the vector with zeros as needed.

    Args:
        vector: The input embedding vector.

    Returns:
        The adjusted vector matching the target dimension.
    """
    target_dim = settings.EMBEDDING_VECTOR_DIM
    if len(vector) == target_dim:
        return vector
    if len(vector) > target_dim:
        return vector[:target_dim]
    return vector + ([0.0] * (target_dim - len(vector)))


def _encode_text(text: str, instruction: str) -> list[float]:
    """Internal helper to encode text into a vector using an optional instruction.

    Args:
        text: The text string to encode.
        instruction: The task-specific instruction prefix.

    Returns:
        A list of floats representing the embedding vector.
    """
    normalized_text = text.strip()
    if not normalized_text:
        return []
    payload = (
        instruction + normalized_text
        if settings.EMBEDDING_USE_INSTRUCTIONS
        else normalized_text
    )
    vector = get_embedding_model().encode(
        payload,
        normalize_embeddings=True,
        truncate_dim=settings.EMBEDDING_TRUNCATE_DIM,
    )
    return _fit_vector_dim(vector.tolist())


def encode_resume(text: str) -> list[float]:
    """Encode resume text into a vector embedding.

    Args:
        text: Raw or processed resume text.

    Returns:
        Embedding vector.
    """
    return _encode_text(text, RESUME_INSTRUCTION)


def encode_jd(text: str) -> list[float]:
    """Encode job description text into a vector embedding.

    Args:
        text: Job description text.

    Returns:
        Embedding vector.
    """
    return _encode_text(text, JD_INSTRUCTION)


def encode_skill(text: str) -> list[float]:
    """Encode skill name/description into a vector embedding.

    Args:
        text: Skill text.

    Returns:
        Embedding vector.
    """
    return _encode_text(text, SKILL_INSTRUCTION)


def get_semantic_score(resume_text: str, jd_text: str) -> float:
    """Calculate the semantic similarity score between resume and JD text.

    Encodes both texts and computes their cosine similarity (dot product of
    normalized vectors).

    Args:
        resume_text: The resume text.
        jd_text: The job description text.

    Returns:
        A score between 0.0 and 100.0.
    """
    if not resume_text.strip() or not jd_text.strip():
        return 0.0

    vec1 = np.array(encode_resume(resume_text))
    vec2 = np.array(encode_jd(jd_text))
    if vec1.size == 0 or vec2.size == 0:
        return 0.0
    score = float(np.dot(vec1, vec2))
    return round(max(0.0, score) * 100.0, 2)


def get_semantic_score_from_embeddings(
    resume_embedding: list[float],
    jd_embedding: list[float],
) -> float:
    """Compute semantic score from pre-calculated embedding vectors.

    Args:
        resume_embedding: Pre-calculated resume vector.
        jd_embedding: Pre-calculated JD vector.

    Returns:
        A score between 0.0 and 100.0.
    """
    if not resume_embedding or not jd_embedding:
        return 0.0

    vec1 = np.array(resume_embedding)
    vec2 = np.array(jd_embedding)
    if vec1.size == 0 or vec2.size == 0:
        return 0.0
    score = float(np.dot(vec1, vec2))
    return round(max(0.0, score) * 100.0, 2)


def build_job_text(job: object) -> str:
    """Construct a searchable/embeddable text representation of a job.

    Args:
        job: The job model object.

    Returns:
        A concatenated string of job title, department, and description.
    """
    parts: list[str] = []

    title = getattr(job, "title", None)
    department = getattr(job, "department", None)
    jd_text = getattr(job, "jd_text", None)
    jd_json = getattr(job, "jd_json", None)

    if title:
        parts.append(f"Title: {title}")
    if department:
        parts.append(f"Department: {department}")
    if jd_text:
        parts.append(f"Description:\n{jd_text}")
    if jd_json:
        parts.append(
            "Structured JD:\n"
            + json.dumps(jd_json, ensure_ascii=True, sort_keys=True, default=str)
        )

    return "\n\n".join(parts).strip()


def build_skill_text(skill: object) -> str:
    """Construct a text representation of a skill for embedding.

    Args:
        skill: The skill model object.

    Returns:
        String containing skill name and description.
    """
    name = getattr(skill, "name", "") or ""
    description = getattr(skill, "description", None)
    if description:
        return f"{name}\n{description}".strip()
    return name.strip()


def build_candidate_text(
    parsed_summary: dict[str, object],
    raw_text: str,
) -> str:
    """Construct a comprehensive text representation of a candidate's resume.

    Aggregates structured fields and raw text for embedding and analysis.

    Args:
        parsed_summary: Dictionary of extracted resume fields.
        raw_text: The full raw text of the resume.

    Returns:
        Concatenated candidate information string.
    """
    parts: list[str] = []

    name = parsed_summary.get("name")
    if name:
        parts.append(f"Candidate: {name}")

    email = parsed_summary.get("email")
    if email:
        parts.append(f"Email: {email}")

    phone = parsed_summary.get("phone")
    if phone:
        parts.append(f"Phone: {phone}")

    for key in (
        "location",
        "skills",
        "experience",
        "education",
        "certifications",
        "links",
    ):
        values = parsed_summary.get(key, [])
        if isinstance(values, list) and values:
            formatted = []
            for value in values:
                if isinstance(value, dict):
                    text = str(value.get("text", "")).strip()
                    if text:
                        formatted.append(text)
                else:
                    text = str(value).strip()
                    if text:
                        formatted.append(text)
            if formatted:
                parts.append(f"{key.title()}: " + "; ".join(formatted))

    if raw_text.strip():
        parts.append(f"Resume Text:\n{raw_text.strip()}")

    return "\n\n".join(parts).strip()


class ResumeJdAnalyzer:
    """Analyzer service for comparing resumes against job descriptions using LLMs."""

    def __init__(self) -> None:
        self.model = OllamaLanguageModel(
            model_id=settings.OLLAMA_MODEL,
            model_url=settings.OLLAMA_URL,
            api_key=settings.OLLAMA_API_KEY,
            format_type=core_types.FormatType.JSON,
            timeout=300,
        )

    def analyze(
        self,
        *,
        resume_text: str,
        job_text: str,
        job_skills: list[str],
        candidate_skills: list[str],
        semantic_score: float,
    ) -> dict[str, object]:
        """Perform a detailed LLM analysis of a resume's suitability for a job.

        Args:
            resume_text: The constructed resume text.
            job_text: The constructed job description text.
            job_skills: List of skills required for the job.
            candidate_skills: List of skills found in the resume.
            semantic_score: The pre-calculated semantic similarity score.

        Returns:
            A dictionary containing match percentage and detailed analysis.

        Raises:
            ValueError: If the LLM returns an invalid or empty response.
        """
        prompt = (
            "You are an expert hiring analyst.\n"
            "Compare the resume against the job description and return only JSON.\n"
            "Use concise, recruiter-friendly wording.\n"
            "Treat the semantic score as a supporting signal, not the only basis.\n\n"
            "Required JSON schema:\n"
            "{\n"
            '  "match_percentage": number,\n'
            '  "skill_gap_analysis": string,\n'
            '  "experience_alignment": string,\n'
            '  "strength_summary": string,\n'
            '  "missing_skills": [string],\n'
            '  "extraordinary_points": [string]\n'
            "}\n\n"
            f"Semantic score hint: {semantic_score}\n"
            f"Job skills: {json.dumps(job_skills, ensure_ascii=True)}\n"
            f"Candidate skills: {json.dumps(candidate_skills, ensure_ascii=True)}\n\n"
            f"Job description:\n{job_text}\n\n"
            f"Resume:\n{resume_text}"
        )

        outputs = list(self.model.infer([prompt]))
        if not outputs or not outputs[0] or not outputs[0][0].output:
            raise ValueError("LLM did not return a resume analysis response.")

        raw_output = outputs[0][0].output
        try:
            parsed_output = self.model.parse_output(raw_output)
        except ValueError as exc:
            raise ValueError("LLM returned invalid JSON for resume analysis.") from exc
        validated = ResumeJobAnalysisResult.model_validate(parsed_output)
        return validated.model_dump()
