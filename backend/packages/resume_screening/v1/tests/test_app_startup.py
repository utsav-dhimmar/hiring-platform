import pytest

from app import main


@pytest.mark.anyio
async def test_lifespan_preloads_embedding_model(monkeypatch):
    events: list[str] = []

    async def fake_init_db():
        events.append("init_db")

    def fake_initialize_resume_executor():
        events.append("initialize_resume_executor")

    def fake_preload_embedding_model():
        events.append("preload_embedding_model")
        return object()

    async def fake_run_in_resume_executor(func, *args, **kwargs):
        events.append("run_in_resume_executor")
        return func(*args, **kwargs)

    def fake_shutdown_resume_executor():
        events.append("shutdown_resume_executor")

    monkeypatch.setattr(main, "init_db", fake_init_db)
    monkeypatch.setattr(
        main, "initialize_resume_executor", fake_initialize_resume_executor
    )
    monkeypatch.setattr(main, "preload_embedding_model", fake_preload_embedding_model)
    monkeypatch.setattr(main, "run_in_resume_executor", fake_run_in_resume_executor)
    monkeypatch.setattr(main, "shutdown_resume_executor", fake_shutdown_resume_executor)

    async with main.lifespan(main.app):
        assert events == [
            "init_db",
            "initialize_resume_executor",
            "run_in_resume_executor",
            "preload_embedding_model",
        ]

    assert events == [
        "init_db",
        "initialize_resume_executor",
        "run_in_resume_executor",
        "preload_embedding_model",
        "shutdown_resume_executor",
    ]
