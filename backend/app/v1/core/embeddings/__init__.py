from .service import EmbeddingService

# Singleton instance (IMPORTANT)
_embedding_service = EmbeddingService()


# -------- Backward Compatibility --------

def encode_resume(text: str):
    return _embedding_service.encode_resume(text)


def encode_jd(text: str):
    return _embedding_service.encode_jd(text)


def encode_skill(text: str):
    return _embedding_service.encode_skill(text)


def get_semantic_score(resume: str, jd: str):
    return _embedding_service.get_semantic_score(resume, jd)


def get_semantic_score_from_embeddings(v1, v2):
    return _embedding_service.similarity(v1, v2)


def preload_embedding_model():
    return _embedding_service.model


def get_embedding_model():
    return _embedding_service.model


# -------- Exports --------
__all__ = [
    "EmbeddingService",
    "encode_resume",
    "encode_jd",
    "encode_skill",
    "get_semantic_score",
    "get_semantic_score_from_embeddings",
    "preload_embedding_model",
    "get_embedding_model",
]