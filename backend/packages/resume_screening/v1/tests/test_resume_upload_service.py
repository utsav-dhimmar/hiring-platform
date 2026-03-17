import asyncio
import io
import uuid
from pathlib import Path
from types import SimpleNamespace

from fastapi import UploadFile

from packages.auth.v1.schema.user import UserRead
from packages.resume_screening.v1.services.resume_upload_service import (
    ResumeUploadService,
)


def test_upload_resume_returns_analysis_and_persists_embeddings(
    monkeypatch,
):
    service = ResumeUploadService()

    job_id = uuid.uuid4()
    candidate_id = uuid.uuid4()
    owner_id = uuid.uuid4()
    file_id = uuid.uuid4()
    resume_id = uuid.uuid4()
    skill_id = uuid.uuid4()
    upload_root = Path("test_uploads") / str(uuid.uuid4())
    upload_root.mkdir(parents=True, exist_ok=True)

    job = SimpleNamespace(
        id=job_id,
        title="Backend Engineer",
        department="Engineering",
        jd_text="Need Python, FastAPI, PostgreSQL and 4+ years experience.",
        jd_json=None,
        jd_embedding=None,
        is_active=True,
    )
    candidate = SimpleNamespace(
        id=candidate_id, first_name=None, last_name=None
    )
    skill = SimpleNamespace(
        id=skill_id,
        name="Python",
        description="Programming language",
        skill_embedding=None,
    )
    file_record = SimpleNamespace(
        id=file_id,
        file_name="resume.pdf",
        file_type="pdf",
        size=123,
        source_url="uploads/resumes/resume.pdf",
    )
    resume_record = SimpleNamespace(id=resume_id, parsed=True)

    captured: dict[str, object] = {}

    async def fake_run_in_executor(func, *args, **kwargs):
        return func(*args, **kwargs)

    async def fake_get_job(db, incoming_job_id):
        assert incoming_job_id == job_id
        return job

    async def fake_get_candidate_for_job_and_email(db, *, job_id, email):
        return None

    async def fake_create_candidate(db, **kwargs):
        captured["candidate_kwargs"] = kwargs
        return candidate

    async def fake_get_job_skills(db, *, job_id):
        return [skill]

    async def fake_update_job_embedding(db, *, job, embedding):
        captured["job_embedding"] = embedding

    async def fake_update_skill_embeddings(db, *, embeddings_by_skill_id):
        captured.setdefault("skill_embeddings", []).append(
            embeddings_by_skill_id
        )

    async def fake_update_candidate_profile(db, **kwargs):
        captured["candidate_profile"] = kwargs
        return candidate

    async def fake_create_file_record(db, **kwargs):
        captured["file_kwargs"] = kwargs
        return file_record

    async def fake_create_resume_record(db, **kwargs):
        captured["resume_kwargs"] = kwargs
        return resume_record

    async def fake_create_resume_chunk(db, **kwargs):
        captured["chunk_kwargs"] = kwargs

    async def fake_sync_candidate_skills(db, **kwargs):
        captured["sync_skills_kwargs"] = kwargs
        return [skill]

    async def fake_commit(db):
        captured["committed"] = True

    async def fake_refresh(db, **kwargs):
        captured["refreshed"] = kwargs

    async def fake_rollback(db):
        raise AssertionError("rollback should not be called")

    monkeypatch.setattr(
        "packages.resume_screening.v1.services.resume_upload_service.run_in_resume_executor",
        fake_run_in_executor,
    )
    monkeypatch.setattr(
        "packages.resume_screening.v1.services.resume_upload_service.settings.RESUME_UPLOAD_DIR",
        str(upload_root),
    )
    monkeypatch.setattr(
        "packages.resume_screening.v1.services.resume_upload_service.resume_upload_repository.get_job",
        fake_get_job,
    )
    monkeypatch.setattr(
        "packages.resume_screening.v1.services.resume_upload_service.resume_upload_repository.get_candidate_for_job_and_email",
        fake_get_candidate_for_job_and_email,
    )
    monkeypatch.setattr(
        "packages.resume_screening.v1.services.resume_upload_service.resume_upload_repository.create_candidate",
        fake_create_candidate,
    )
    monkeypatch.setattr(
        "packages.resume_screening.v1.services.resume_upload_service.resume_upload_repository.get_job_skills",
        fake_get_job_skills,
    )
    monkeypatch.setattr(
        "packages.resume_screening.v1.services.resume_upload_service.resume_upload_repository.update_job_embedding",
        fake_update_job_embedding,
    )
    monkeypatch.setattr(
        "packages.resume_screening.v1.services.resume_upload_service.resume_upload_repository.update_skill_embeddings",
        fake_update_skill_embeddings,
    )
    monkeypatch.setattr(
        "packages.resume_screening.v1.services.resume_upload_service.resume_upload_repository.update_candidate_profile",
        fake_update_candidate_profile,
    )
    monkeypatch.setattr(
        "packages.resume_screening.v1.services.resume_upload_service.resume_upload_repository.create_file_record",
        fake_create_file_record,
    )
    monkeypatch.setattr(
        "packages.resume_screening.v1.services.resume_upload_service.resume_upload_repository.create_resume_record",
        fake_create_resume_record,
    )
    monkeypatch.setattr(
        "packages.resume_screening.v1.services.resume_upload_service.resume_upload_repository.create_resume_chunk",
        fake_create_resume_chunk,
    )
    monkeypatch.setattr(
        "packages.resume_screening.v1.services.resume_upload_service.resume_upload_repository.sync_candidate_skills",
        fake_sync_candidate_skills,
    )
    monkeypatch.setattr(
        "packages.resume_screening.v1.services.resume_upload_service.resume_upload_repository.commit",
        fake_commit,
    )
    monkeypatch.setattr(
        "packages.resume_screening.v1.services.resume_upload_service.resume_upload_repository.refresh_file_and_resume",
        fake_refresh,
    )
    monkeypatch.setattr(
        "packages.resume_screening.v1.services.resume_upload_service.resume_upload_repository.rollback",
        fake_rollback,
    )
    monkeypatch.setattr(
        service,
        "_process_resume",
        lambda path: (
            "Python FastAPI PostgreSQL 5 years",
            {
                "name": [{"text": "Jane Doe", "attributes": {}}],
                "skills": [{"text": "Python, FastAPI", "attributes": {}}],
                "experience": [
                    {"text": "5 years backend development", "attributes": {}}
                ],
                "education": [],
                "certifications": [],
                "links": [],
            },
        ),
    )
    monkeypatch.setattr(
        service,
        "_generate_resume_insights",
        lambda **kwargs: {
            "job_embedding": [0.1, 0.2],
            "candidate_embedding": [0.3, 0.4],
            "chunk_embedding": [0.5, 0.6],
            "skill_embeddings": {skill_id: [0.7, 0.8]},
            "analysis": {
                "match_percentage": 82.0,
                "skill_gap_analysis": "Strong backend overlap with one framework gap.",
                "experience_alignment": "Experience level meets the JD.",
                "strength_summary": "Strong Python API background.",
                "missing_skills": ["PostgreSQL"],
                "extraordinary_points": ["Distributed systems exposure"],
            },
        },
    )
    monkeypatch.setattr(
        service,
        "_generate_skill_embeddings",
        lambda skills: {skill_id: [0.9, 1.0]},
    )

    upload = UploadFile(filename="resume.pdf", file=io.BytesIO(b"resume bytes"))
    current_user = UserRead(
        id=owner_id,
        full_name="Jane Doe",
        email="jane@example.com",
        is_active=True,
        role_id=uuid.uuid4(),
    )

    response = asyncio.run(
        service.upload_resume_for_job(
            db=object(),
            job_id=job_id,
            resume=upload,
            current_user=current_user,
        )
    )

    assert response.analysis.match_percentage == 82.0
    assert response.analysis.missing_skills == ["PostgreSQL"]
    assert captured["candidate_profile"]["info_embedding"] == [0.3, 0.4]
    assert captured["resume_kwargs"]["resume_score"] == 82.0
    assert captured["resume_kwargs"]["pass_fail"] is True
    assert captured["chunk_kwargs"]["chunk_embedding"] == [0.5, 0.6]
    assert captured["job_embedding"] == [0.1, 0.2]
    assert captured["skill_embeddings"][0] == {skill_id: [0.7, 0.8]}
    assert captured["skill_embeddings"][1] == {skill_id: [0.9, 1.0]}
    assert captured["sync_skills_kwargs"]["skill_names"] == [
        "Python",
        "FastAPI",
    ]
    assert captured["committed"] is True
