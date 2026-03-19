"""Semantic similarity scoring between encoded text vectors."""

from __future__ import annotations

import numpy as np

from app.v1.core.embeddings import EmbeddingService, get_embedding_service


def _cosine(vec1: list[float], vec2: list[float]) -> float:
    if not vec1 or not vec2:
        return 0.0
    a, b = np.array(vec1), np.array(vec2)
    if a.size == 0 or b.size == 0:
        return 0.0
    return round(min(100.0, max(0.0, float(np.dot(a, b))) * 100.0), 2)


class SimilarityService:
    def __init__(self, embedding_service: EmbeddingService | None = None) -> None:
        self._emb = embedding_service or get_embedding_service()

    # --- Resume vs JD ---

    def resume_jd_score(self, resume_text: str, jd_text: str) -> float:
        if not resume_text.strip() or not jd_text.strip():
            return 0.0
        return _cosine(self._emb.encode_resume(resume_text), self._emb.encode_jd(jd_text))

    def resume_jd_score_from_vectors(
        self, resume_embedding: list[float], jd_embedding: list[float]
    ) -> float:
        return _cosine(resume_embedding, jd_embedding)

    # --- Transcript vs JD (Stage 1 / 2 / 3) ---

    def transcript_jd_score(self, transcript_text: str, jd_text: str) -> float:
        if not transcript_text.strip() or not jd_text.strip():
            return 0.0
        return _cosine(self._emb.encode_transcript(transcript_text), self._emb.encode_jd(jd_text))

    def transcript_jd_score_from_vectors(
        self, transcript_embedding: list[float], jd_embedding: list[float]
    ) -> float:
        return _cosine(transcript_embedding, jd_embedding)

    # --- Generic ---

    def score_from_vectors(self, vec1: list[float], vec2: list[float]) -> float:
        return _cosine(vec1, vec2)


_DEFAULT_SIMILARITY: SimilarityService | None = None


def get_similarity_service() -> SimilarityService:
    global _DEFAULT_SIMILARITY
    if _DEFAULT_SIMILARITY is None:
        _DEFAULT_SIMILARITY = SimilarityService()
    return _DEFAULT_SIMILARITY


# Backward-compat wrappers
def get_semantic_score(resume_text: str, jd_text: str) -> float:
    return get_similarity_service().resume_jd_score(resume_text, jd_text)

def get_semantic_score_from_embeddings(
    resume_embedding: list[float], jd_embedding: list[float]
) -> float:
    return get_similarity_service().resume_jd_score_from_vectors(resume_embedding, jd_embedding)