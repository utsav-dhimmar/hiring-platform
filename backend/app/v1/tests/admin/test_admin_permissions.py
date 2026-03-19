"""
Test cases for admin permission management API endpoints.
"""

import uuid

from app.v1.tests.admin.conftest import get_auth_header


class TestAdminPermissionManagement:
    """Test suite for admin permission management endpoints."""

    def test_get_all_permissions_as_admin(self, client, admin_token, permission):
        """Test admin can get all permissions."""
        response = client.get(
            "/api/v1/admin/permissions",
            headers=get_auth_header(admin_token),
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1

    def test_get_all_permissions_as_non_admin(self, client, user_token):
        """Test non-admin cannot get permissions."""
        response = client.get(
            "/api/v1/admin/permissions",
            headers=get_auth_header(user_token),
        )
        assert response.status_code == 403

    def test_get_all_permissions_unauthenticated(self, client):
        """Test unauthenticated request is rejected."""
        response = client.get("/api/v1/admin/permissions")
        assert response.status_code == 401

    def test_create_permission_as_admin(self, client, admin_token):
        """Test admin can create a new permission."""
        response = client.post(
            "/api/v1/admin/permissions",
            headers=get_auth_header(admin_token),
            json={
                "name": "users:create",
                "description": "Create users permission",
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "users:create"
        assert data["description"] == "Create users permission"

    def test_create_duplicate_permission_fails(self, client, admin_token, permission):
        """Test creating duplicate permission fails."""
        response = client.post(
            "/api/v1/admin/permissions",
            headers=get_auth_header(admin_token),
            json={
                "name": permission.name,
                "description": "Test",
            },
        )
        assert response.status_code == 400

    def test_delete_permission_as_admin(self, client, admin_token, db_session):
        """Test admin can delete a permission."""
        from app.v1.db.models.permissions import Permission

        perm_to_delete = Permission(
            id=uuid.uuid4(),
            name="delete:permission",
            description="To be deleted",
        )
        db_session.add(perm_to_delete)
        db_session.commit()

        response = client.delete(
            f"/api/v1/admin/permissions/{perm_to_delete.id}",
            headers=get_auth_header(admin_token),
        )
        assert response.status_code == 204

    def test_delete_nonexistent_permission(self, client, admin_token):
        """Test deleting non-existent permission returns 404."""
        response = client.delete(
            f"/api/v1/admin/permissions/{uuid.uuid4()}",
            headers=get_auth_header(admin_token),
        )
        assert response.status_code == 404

    def test_pagination_permissions(self, client, admin_token, db_session):
        """Test permission list pagination."""
        from app.v1.db.models.permissions import Permission

        for i in range(15):
            perm = Permission(
                id=uuid.uuid4(),
                name=f"perm{i}",
                description=f"Permission {i}",
            )
            db_session.add(perm)
        db_session.commit()

        response = client.get(
            "/api/v1/admin/permissions?skip=0&limit=10",
            headers=get_auth_header(admin_token),
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 10
