import numpy as np
from numpy.linalg import norm
from sentence_transformers import SentenceTransformer

from app.v1.core.config import settings


class EmbeddingService:
    """Service for generating embeddings and computing similarity."""

    def __init__(self):
        self.model = SentenceTransformer(settings.EMBEDDING_MODEL_NAME)
        self.truncate_dim = settings.EMBEDDING_TRUNCATE_DIM
        self.use_instructions = settings.EMBEDDING_USE_INSTRUCTIONS

        # versioning (IMPORTANT)
        self.version = "nomic-v1.5"

    def _encode(self, text: str, instruction: str = "") -> list[float]:
        """Internal encoding helper."""
        text = text.strip()

        if not text:
            return [0.0] * self.truncate_dim

        payload = instruction + text if self.use_instructions else text

        vector = self.model.encode(
            payload,
            normalize_embeddings=True,
            truncate_dim=self.truncate_dim,
        )

        return vector.tolist()

    # ---------- Public APIs ----------

    def encode_resume(self, text: str) -> list[float]:
        return self._encode(text, "Resume: ")

    def encode_jd(self, text: str) -> list[float]:
        return self._encode(text, "Job Description: ")

    def encode_skill(self, text: str) -> list[float]:
        return self._encode(text, "Skill: ")

    def encode_batch(self, texts: list[str]) -> list[list[float]]:
        """Batch encoding for performance."""
        cleaned = [t.strip() if t else "" for t in texts]

        vectors = self.model.encode(
            cleaned,
            normalize_embeddings=True,
            truncate_dim=self.truncate_dim,
        )

        return [v.tolist() for v in vectors]

    def similarity(self, v1: list[float], v2: list[float]) -> float:
        """Safe cosine similarity."""
        v1, v2 = np.array(v1), np.array(v2)

        if v1.size == 0 or v2.size == 0:
            return 0.0

        return float(np.dot(v1, v2) / (norm(v1) * norm(v2))) * 100

    def get_semantic_score(self, resume_text: str, jd_text: str) -> float:
        """Compute semantic similarity score."""
        v1 = self.encode_resume(resume_text)
        v2 = self.encode_jd(jd_text)

        return self.similarity(v1, v2)
