import uuid
from datetime import datetime

import numpy as np
from pgvector.sqlalchemy import Vector
from sentence_transformers import SentenceTransformer
from sqlalchemy import DateTime, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.v1.db.base_class import Base

_model = SentenceTransformer("Qwen/Qwen3-Embedding-0.6B")

MODEL_NAME = "Qwen3-Embedding-0.6B"
TRUNCATE_DIM = 1024

RESUME_INSTRUCTION = "Instruct: Given a job description, retrieve relevant candidate resumes\nPassage: "
JD_INSTRUCTION = "Instruct: Given a job description, retrieve relevant candidate resumes\nQuery: "
COVER_LETTER_INSTRUCTION = "Instruct: Given a job description, retrieve relevant cover letters\nPassage: "


def encode_resume(text: str) -> np.ndarray:
    """Encodes a resume text into a normalized vector."""
    return _model.encode(RESUME_INSTRUCTION + text, normalize_embeddings=True)


def encode_jd(text: str) -> np.ndarray:
    """Encodes a job description text into a normalized vector."""
    return _model.encode(JD_INSTRUCTION + text, normalize_embeddings=True)


def get_semantic_score(resume_text: str, jd_text: str) -> float:
    """Returns a 0-100 semantic score between resume and JD."""
    vec1 = encode_resume(resume_text)
    vec2 = encode_jd(jd_text)
    score = np.dot(vec1, vec2)
    return round(float(max(0.0, score) * 100.0), 2)


def generate_uuid7():
    return uuid.uuid7()


class Embedding(Base):
    """Embedding ORM model.

    Stores vector embeddings for resumes, JDs, and cover letters.
    Uses entity_type + entity_id to link back to the source table
    without modifying any existing models.

    entity_type values:
        'resume'       → entity_id points to resumes.id
        'jd'           → entity_id points to jobs.id
        'cover_letter' → entity_id points to cover_letters.id
    """

    __tablename__ = "embeddings"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=generate_uuid7,
    )

    entity_type: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    entity_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        nullable=False,
    )

    model_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    truncate_dim: Mapped[int] = mapped_column(
        nullable=False,
    )

    embedding: Mapped[list] = mapped_column(
        Vector(1024),
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    __table_args__ = (
        UniqueConstraint(
            "entity_type", "entity_id", name="uq_entity_embedding"
        ),
    )
