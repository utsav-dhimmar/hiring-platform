"""
Test cases for admin analytics and hiring reports API endpoints.
"""

import uuid
from datetime import datetime, timedelta, timezone

from app.v1.tests.admin.conftest import get_auth_header


class TestAdminAnalytics:
    """Test suite for admin analytics endpoints."""

    def test_get_analytics_as_admin(self, client, admin_token, hr_role, admin_user):
        """Test admin can get analytics summary."""
        response = client.get(
            "/api/v1/admin/analytics",
            headers=get_auth_header(admin_token),
        )
        assert response.status_code == 200
        data = response.json()
        assert "total_users" in data
        assert "total_roles" in data
        assert "total_permissions" in data
        assert "total_jobs" in data
        assert "total_candidates" in data
        assert "total_resumes" in data
        assert "active_jobs" in data
        assert "active_users" in data

    def test_get_analytics_as_non_admin(self, client, user_token):
        """Test non-admin cannot get analytics."""
        response = client.get(
            "/api/v1/admin/analytics",
            headers=get_auth_header(user_token),
        )
        assert response.status_code == 403

    def test_get_analytics_unauthenticated(self, client):
        """Test unauthenticated request is rejected."""
        response = client.get("/api/v1/admin/analytics")
        assert response.status_code == 401

    def test_analytics_with_data(
        self, client, admin_token, db_session, admin_user, hr_role, permission
    ):
        """Test analytics with sample data."""
        from app.v1.core.security import hash_password
        from app.v1.db.models.candidates import Candidate
        from app.v1.db.models.files import File
        from app.v1.db.models.jobs import Job
        from app.v1.db.models.resumes import Resume
        from app.v1.db.models.user import User

        user = User(
            id=uuid.uuid4(),
            email="testuser@test.com",
            password_hash=hash_password("password"),
            is_active=True,
            role_id=hr_role.id,
        )
        db_session.add(user)

        job = Job(
            id=uuid.uuid4(),
            title="Software Engineer",
            department="Engineering",
            created_by=admin_user.id,
            is_active=True,
        )
        db_session.add(job)

        candidate = Candidate(
            id=uuid.uuid4(),
            applied_job_id=job.id,
            email="candidate@test.com",
        )
        db_session.add(candidate)

        file = File(
            id=uuid.uuid4(),
            owner_id=admin_user.id,
            candidate_id=candidate.id,
            file_name="resume.pdf",
            file_type="pdf",
        )
        db_session.add(file)

        resume = Resume(
            id=uuid.uuid4(),
            candidate_id=candidate.id,
            file_id=file.id,
            parsed=True,
            resume_score=0.85,
            pass_fail=True,
        )
        db_session.add(resume)

        db_session.commit()

        response = client.get(
            "/api/v1/admin/analytics",
            headers=get_auth_header(admin_token),
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total_users"] >= 2
        assert data["total_roles"] >= 2
        assert data["total_permissions"] >= 1
        assert data["total_jobs"] >= 1
        assert data["total_candidates"] >= 1
        assert data["total_resumes"] >= 1


class TestAdminHiringReport:
    """Test suite for admin hiring report endpoints."""

    def test_get_hiring_report_as_admin(self, client, admin_token, hr_role, admin_user):
        """Test admin can get hiring report."""
        response = client.get(
            "/api/v1/admin/hiring-report",
            headers=get_auth_header(admin_token),
        )
        assert response.status_code == 200
        data = response.json()
        assert "total_jobs" in data
        assert "active_jobs" in data
        assert "total_candidates" in data
        assert "candidates_by_job" in data
        assert "resumes_uploaded_last_30_days" in data
        assert "average_resume_score" in data
        assert "pass_rate" in data

    def test_get_hiring_report_as_non_admin(self, client, user_token):
        """Test non-admin cannot get hiring report."""
        response = client.get(
            "/api/v1/admin/hiring-report",
            headers=get_auth_header(user_token),
        )
        assert response.status_code == 403

    def test_get_hiring_report_unauthenticated(self, client):
        """Test unauthenticated request is rejected."""
        response = client.get("/api/v1/admin/hiring-report")
        assert response.status_code == 401

    def test_hiring_report_with_data(self, client, admin_token, db_session, admin_user):
        """Test hiring report with sample data."""
        from app.v1.db.models.candidates import Candidate
        from app.v1.db.models.files import File
        from app.v1.db.models.jobs import Job
        from app.v1.db.models.resumes import Resume

        job = Job(
            id=uuid.uuid4(),
            title="Software Engineer",
            department="Engineering",
            created_by=admin_user.id,
            is_active=True,
        )
        db_session.add(job)

        candidate = Candidate(
            id=uuid.uuid4(),
            applied_job_id=job.id,
            email="candidate@test.com",
        )
        db_session.add(candidate)

        file = File(
            id=uuid.uuid4(),
            owner_id=admin_user.id,
            candidate_id=candidate.id,
            file_name="resume.pdf",
            file_type="pdf",
        )
        db_session.add(file)

        resume = Resume(
            id=uuid.uuid4(),
            candidate_id=candidate.id,
            file_id=file.id,
            parsed=True,
            resume_score=0.85,
            pass_fail=True,
            uploaded_at=datetime.now(timezone.utc) - timedelta(days=10),
        )
        db_session.add(resume)

        db_session.commit()

        response = client.get(
            "/api/v1/admin/hiring-report",
            headers=get_auth_header(admin_token),
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total_jobs"] >= 1
        assert data["active_jobs"] >= 1
        assert data["total_candidates"] >= 1
        assert data["resumes_uploaded_last_30_days"] >= 1
        assert data["average_resume_score"] is not None
        assert data["pass_rate"] is not None
        assert len(data["candidates_by_job"]) > 0
