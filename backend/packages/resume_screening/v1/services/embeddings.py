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

from app.v1.core.config import settings

MODEL_NAME = "Qwen/Qwen3-Embedding-0.6B"
TRUNCATE_DIM = 1024

RESUME_INSTRUCTION = (
    "Instruct: Given a job description, retrieve relevant candidate resumes\n"
    "Passage: "
)
JD_INSTRUCTION = (
    "Instruct: Given a job description, retrieve relevant candidate resumes\n"
    "Query: "
)
SKILL_INSTRUCTION = (
    "Instruct: Represent this hiring skill for semantic matching\nPassage: "
)


class ResumeJobAnalysisResult(BaseModel):
    match_percentage: float = Field(ge=0, le=100)
    skill_gap_analysis: str
    experience_alignment: str
    strength_summary: str
    missing_skills: list[str] = Field(default_factory=list)
    extraordinary_points: list[str] = Field(default_factory=list)


@lru_cache(maxsize=1)
def get_embedding_model() -> SentenceTransformer:
    return SentenceTransformer(MODEL_NAME)


def _encode_text(text: str, instruction: str) -> list[float]:
    normalized_text = text.strip()
    if not normalized_text:
        return []
    vector = get_embedding_model().encode(
        instruction + normalized_text,
        normalize_embeddings=True,
        truncate_dim=TRUNCATE_DIM,
    )
    return vector.tolist()


def encode_resume(text: str) -> list[float]:
    return _encode_text(text, RESUME_INSTRUCTION)


def encode_jd(text: str) -> list[float]:
    return _encode_text(text, JD_INSTRUCTION)


def encode_skill(text: str) -> list[float]:
    return _encode_text(text, SKILL_INSTRUCTION)


def get_semantic_score(resume_text: str, jd_text: str) -> float:
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
    if not resume_embedding or not jd_embedding:
        return 0.0

    vec1 = np.array(resume_embedding)
    vec2 = np.array(jd_embedding)
    if vec1.size == 0 or vec2.size == 0:
        return 0.0
    score = float(np.dot(vec1, vec2))
    return round(max(0.0, score) * 100.0, 2)


def build_job_text(job: object) -> str:
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
            + json.dumps(
                jd_json, ensure_ascii=True, sort_keys=True, default=str
            )
        )

    return "\n\n".join(parts).strip()


def build_skill_text(skill: object) -> str:
    name = getattr(skill, "name", "") or ""
    description = getattr(skill, "description", None)
    if description:
        return f"{name}\n{description}".strip()
    return name.strip()


def build_candidate_text(
    parsed_summary: dict[str, object],
    raw_text: str,
) -> str:
    parts: list[str] = []

    name = parsed_summary.get("name")
    if name:
        parts.append(f"Candidate: {name}")

    for key in (
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

        parsed_output = self.model.parse_output(outputs[0][0].output)
        validated = ResumeJobAnalysisResult.model_validate(parsed_output)
        return validated.model_dump()
