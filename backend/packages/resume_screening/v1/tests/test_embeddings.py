"""
Tests for the embedding service.

Verifies vector generation, instruction application, and padding.
"""
from packages.resume_screening.v1.services import embeddings


def test_encode_resume_uses_plain_text_for_lightweight_models(monkeypatch):
    """Test that resume encoding works without instructions when configured."""
    captured: dict[str, object] = {}

    class FakeModel:
        def encode(self, text, **kwargs):
            captured["text"] = text
            captured["kwargs"] = kwargs

            class FakeVector:
                def tolist(self):
                    return [0.1, 0.2, 0.3]

            return FakeVector()

    embeddings.get_embedding_model.cache_clear()
    monkeypatch.setattr(embeddings.settings, "EMBEDDING_USE_INSTRUCTIONS", False)
    monkeypatch.setattr(embeddings.settings, "EMBEDDING_VECTOR_DIM", 3)
    monkeypatch.setattr(embeddings.settings, "EMBEDDING_TRUNCATE_DIM", 384)
    monkeypatch.setattr(embeddings, "get_embedding_model", lambda: FakeModel())

    result = embeddings.encode_resume("  Backend engineer with FastAPI  ")

    assert result == [0.1, 0.2, 0.3]
    assert captured["text"] == "Backend engineer with FastAPI"
    assert captured["kwargs"] == {
        "normalize_embeddings": True,
        "truncate_dim": 384,
    }


def test_encode_resume_can_apply_instruction_prompts(monkeypatch):
    """Test that resume encoding correctly prepends instructions when enabled."""
    captured: dict[str, object] = {}

    class FakeModel:
        def encode(self, text, **kwargs):
            captured["text"] = text

            class FakeVector:
                def tolist(self):
                    return [0.4, 0.5]

            return FakeVector()

    embeddings.get_embedding_model.cache_clear()
    monkeypatch.setattr(embeddings.settings, "EMBEDDING_USE_INSTRUCTIONS", True)
    monkeypatch.setattr(embeddings.settings, "EMBEDDING_VECTOR_DIM", 2)
    monkeypatch.setattr(embeddings, "get_embedding_model", lambda: FakeModel())

    result = embeddings.encode_resume("Resume body")

    assert result == [0.4, 0.5]
    assert captured["text"] == embeddings.RESUME_INSTRUCTION + "Resume body"


def test_encode_resume_pads_vectors_to_storage_dimension(monkeypatch):
    """Test that vectors are padded with zeros to match the target storage dimension."""
    class FakeModel:
        def encode(self, text, **kwargs):
            class FakeVector:
                def tolist(self):
                    return [0.2, 0.3]

            return FakeVector()

    embeddings.get_embedding_model.cache_clear()
    monkeypatch.setattr(embeddings.settings, "EMBEDDING_USE_INSTRUCTIONS", False)
    monkeypatch.setattr(embeddings.settings, "EMBEDDING_VECTOR_DIM", 4)
    monkeypatch.setattr(embeddings.settings, "EMBEDDING_TRUNCATE_DIM", 2)
    monkeypatch.setattr(embeddings, "get_embedding_model", lambda: FakeModel())

    result = embeddings.encode_resume("Resume body")

    assert result == [0.2, 0.3, 0.0, 0.0]
