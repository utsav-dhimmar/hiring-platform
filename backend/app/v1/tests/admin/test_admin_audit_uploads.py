"""
Test cases for admin audit logs and recent uploads API endpoints.
"""

import uuid
from datetime import datetime, timezone

from app.v1.tests.admin.conftest import get_auth_header


class TestAdminAuditLogs:
    """Test suite for admin audit logs endpoints."""

    def test_get_audit_logs_as_admin(
        self, client, admin_token, db_session, admin_user
    ):
        """Test admin can get audit logs."""
        from app.v1.db.models.audit_logs import AuditLog

        log = AuditLog(
            id=uuid.uuid4(),
            user_id=admin_user.id,
            action="test_action",
            target_type="test",
            target_id=uuid.uuid4(),
            created_at=datetime.now(timezone.utc),
        )
        db_session.add(log)
        db_session.commit()

        response = client.get(
            "/api/v1/admin/audit-logs",
            headers=get_auth_header(admin_token),
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    def test_get_audit_logs_as_non_admin(self, client, user_token):
        """Test non-admin cannot get audit logs."""
        response = client.get(
            "/api/v1/admin/audit-logs",
            headers=get_auth_header(user_token),
        )
        assert response.status_code == 403

    def test_get_audit_logs_unauthenticated(self, client):
        """Test unauthenticated request is rejected."""
        response = client.get("/api/v1/admin/audit-logs")
        assert response.status_code == 401

    def test_audit_logs_pagination(
        self, client, admin_token, db_session, admin_user
    ):
        """Test audit logs pagination."""
        from app.v1.db.models.audit_logs import AuditLog

        for i in range(15):
            log = AuditLog(
                id=uuid.uuid4(),
                user_id=admin_user.id,
                action=f"action{i}",
                created_at=datetime.now(timezone.utc),
            )
            db_session.add(log)
        db_session.commit()

        response = client.get(
            "/api/v1/admin/audit-logs?skip=0&limit=10",
            headers=get_auth_header(admin_token),
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 10


class TestAdminRecentUploads:
    """Test suite for admin recent uploads endpoints."""

    def test_get_recent_uploads_as_admin(
        self, client, admin_token, db_session, regular_user, hr_role
    ):
        """Test admin can get recent uploads."""
        from app.v1.db.models.candidates import Candidate
        from app.v1.db.models.files import File
        from app.v1.db.models.jobs import Job

        job = Job(
            id=uuid.uuid4(),
            title="Test Job",
            created_by=regular_user.id,
            is_active=True,
        )
        db_session.add(job)

        candidate = Candidate(
            id=uuid.uuid4(),
            applied_job_id=job.id,
            email="test@test.com",
        )
        db_session.add(candidate)

        file = File(
            id=uuid.uuid4(),
            owner_id=regular_user.id,
            candidate_id=candidate.id,
            file_name="resume.pdf",
            file_type="pdf",
            size=1024,
            created_at=datetime.now(timezone.utc),
        )
        db_session.add(file)
        db_session.commit()

        response = client.get(
            "/api/v1/admin/recent-uploads",
            headers=get_auth_header(admin_token),
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    def test_get_recent_uploads_as_non_admin(self, client, user_token):
        """Test non-admin cannot get recent uploads."""
        response = client.get(
            "/api/v1/admin/recent-uploads",
            headers=get_auth_header(user_token),
        )
        assert response.status_code == 403

    def test_get_recent_uploads_unauthenticated(self, client):
        """Test unauthenticated request is rejected."""
        response = client.get("/api/v1/admin/recent-uploads")
        assert response.status_code == 401

    def test_recent_uploads_pagination(
        self, client, admin_token, db_session, admin_user, hr_role
    ):
        """Test recent uploads pagination."""
        from app.v1.db.models.candidates import Candidate
        from app.v1.db.models.files import File
        from app.v1.db.models.jobs import Job

        job = Job(
            id=uuid.uuid4(),
            title="Test Job",
            created_by=admin_user.id,
            is_active=True,
        )
        db_session.add(job)

        for i in range(15):
            candidate = Candidate(
                id=uuid.uuid4(),
                applied_job_id=job.id,
                email=f"test{i}@test.com",
            )
            db_session.add(candidate)

            file = File(
                id=uuid.uuid4(),
                owner_id=admin_user.id,
                candidate_id=candidate.id,
                file_name=f"resume{i}.pdf",
                file_type="pdf",
                created_at=datetime.now(timezone.utc),
            )
            db_session.add(file)
        db_session.commit()

        response = client.get(
            "/api/v1/admin/recent-uploads?skip=0&limit=10",
            headers=get_auth_header(admin_token),
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 10
