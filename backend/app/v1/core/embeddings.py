"""Embedding generation for resumes, job descriptions, skills, and transcripts."""

from __future__ import annotations

from functools import lru_cache
from threading import Lock

from sentence_transformers import SentenceTransformer

from app.v1.core.config import settings
from app.v1.prompts.instructions import (
    JD_INSTRUCTION,
    RESUME_INSTRUCTION,
    SKILL_INSTRUCTION,
    TRANSCRIPT_INSTRUCTION,
)


@lru_cache(maxsize=1)
def get_embedding_model() -> SentenceTransformer:
    return SentenceTransformer(settings.EMBEDDING_MODEL_NAME)


def preload_embedding_model() -> SentenceTransformer:
    return get_embedding_model()


class EmbeddingService:
    def __init__(self) -> None:
        self.model = get_embedding_model()
        self.target_dim: int = settings.EMBEDDING_VECTOR_DIM
        self.use_instructions: bool = settings.EMBEDDING_USE_INSTRUCTIONS
        self.truncate_dim: int | None = settings.EMBEDDING_TRUNCATE_DIM

    def _fit_vector_dim(self, vector: list[float]) -> list[float]:
        length = len(vector)
        if length == self.target_dim:
            return vector
        if length > self.target_dim:
            return vector[: self.target_dim]
        return vector + ([0.0] * (self.target_dim - length))

    def _encode_text(self, text: str, instruction: str) -> list[float]:
        normalized = text.strip()
        if not normalized:
            return []
        payload = instruction + normalized if self.use_instructions else normalized
        vector = self.model.encode(
            payload,
            normalize_embeddings=True,
            truncate_dim=self.truncate_dim,
        )
        return self._fit_vector_dim(vector.tolist())

    def encode_resume(self, text: str) -> list[float]:
        return self._encode_text(text, RESUME_INSTRUCTION)

    def encode_jd(self, text: str) -> list[float]:
        return self._encode_text(text, JD_INSTRUCTION)

    def encode_skill(self, text: str) -> list[float]:
        return self._encode_text(text, SKILL_INSTRUCTION)

    def encode_transcript(self, text: str) -> list[float]:
        return self._encode_text(text, TRANSCRIPT_INSTRUCTION)

    def encode_batch(
        self,
        texts: list[str],
        instruction: str = "",
        batch_size: int = 32,
    ) -> list[list[float]]:
        result: list[list[float]] = [[] for _ in texts]
        payloads, valid_indices = [], []
        for i, text in enumerate(texts):
            normalized = text.strip()
            if normalized:
                payload = instruction + normalized if self.use_instructions else normalized
                payloads.append(payload)
                valid_indices.append(i)
        if not payloads:
            return result
        vectors = self.model.encode(
            payloads,
            normalize_embeddings=True,
            truncate_dim=self.truncate_dim,
            batch_size=batch_size,
            show_progress_bar=False,
        )
        for i, idx in enumerate(valid_indices):
            result[idx] = self._fit_vector_dim(vectors[i].tolist())
        return result

    def encode_resumes_batch(self, texts: list[str], batch_size: int = 32) -> list[list[float]]:
        return self.encode_batch(texts, RESUME_INSTRUCTION, batch_size)

    def encode_transcripts_batch(self, texts: list[str], batch_size: int = 32) -> list[list[float]]:
        return self.encode_batch(texts, TRANSCRIPT_INSTRUCTION, batch_size)


_DEFAULT_SERVICE: EmbeddingService | None = None
_SERVICE_LOCK = Lock()


def get_embedding_service() -> EmbeddingService:
    global _DEFAULT_SERVICE
    if _DEFAULT_SERVICE is None:
        with _SERVICE_LOCK:
            if _DEFAULT_SERVICE is None:
                _DEFAULT_SERVICE = EmbeddingService()
    return _DEFAULT_SERVICE


# Backward-compat wrappers
def encode_resume(text: str) -> list[float]:
    return get_embedding_service().encode_resume(text)

def encode_jd(text: str) -> list[float]:
    return get_embedding_service().encode_jd(text)

def encode_skill(text: str) -> list[float]:
    return get_embedding_service().encode_skill(text)

def encode_transcript(text: str) -> list[float]:
    return get_embedding_service().encode_transcript(text)