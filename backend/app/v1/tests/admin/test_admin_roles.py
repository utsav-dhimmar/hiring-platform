"""
Test cases for admin role management API endpoints.
"""

import uuid

from app.v1.tests.admin.conftest import get_auth_header


class TestAdminRoleManagement:
    """Test suite for admin role management endpoints."""

    def test_get_all_roles_as_admin(self, client, admin_token, hr_role):
        """Test admin can get all roles."""
        response = client.get(
            "/api/v1/admin/roles",
            headers=get_auth_header(admin_token),
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    def test_get_all_roles_as_non_admin(self, client, user_token):
        """Test non-admin cannot get roles."""
        response = client.get(
            "/api/v1/admin/roles",
            headers=get_auth_header(user_token),
        )
        assert response.status_code == 403

    def test_get_all_roles_unauthenticated(self, client):
        """Test unauthenticated request is rejected."""
        response = client.get("/api/v1/admin/roles")
        assert response.status_code == 401

    def test_create_role_as_admin(self, client, admin_token):
        """Test admin can create a new role."""
        response = client.post(
            "/api/v1/admin/roles",
            headers=get_auth_header(admin_token),
            json={
                "name": "manager",
                "permission_ids": [],
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "manager"

    def test_create_role_with_permissions(
        self, client, admin_token, permission
    ):
        """Test admin can create role with permissions."""
        response = client.post(
            "/api/v1/admin/roles",
            headers=get_auth_header(admin_token),
            json={
                "name": "manager",
                "permission_ids": [str(permission.id)],
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert len(data["permissions"]) == 1

    def test_create_duplicate_role_fails(self, client, admin_token, hr_role):
        """Test creating duplicate role fails."""
        response = client.post(
            "/api/v1/admin/roles",
            headers=get_auth_header(admin_token),
            json={"name": hr_role.name},
        )
        assert response.status_code == 400

    def test_get_role_by_id(self, client, admin_token, hr_role):
        """Test admin can get specific role by ID."""
        response = client.get(
            f"/api/v1/admin/roles/{hr_role.id}",
            headers=get_auth_header(admin_token),
        )
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == str(hr_role.id)
        assert data["name"] == hr_role.name

    def test_get_nonexistent_role(self, client, admin_token):
        """Test getting non-existent role returns 404."""
        response = client.get(
            f"/api/v1/admin/roles/{uuid.uuid4()}",
            headers=get_auth_header(admin_token),
        )
        assert response.status_code == 404

    def test_update_role_name(self, client, admin_token, second_role):
        """Test admin can update role name."""
        response = client.patch(
            f"/api/v1/admin/roles/{second_role.id}",
            headers=get_auth_header(admin_token),
            json={"name": "senior_editor"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "senior_editor"

    def test_update_role_permissions(
        self, client, admin_token, second_role, permission, db_session
    ):
        """Test admin can update role permissions."""
        from app.v1.db.models.permissions import Permission

        new_perm = Permission(
            id=uuid.uuid4(),
            name="new:permission",
            description="New permission",
        )
        db_session.add(new_perm)
        db_session.commit()

        response = client.patch(
            f"/api/v1/admin/roles/{second_role.id}",
            headers=get_auth_header(admin_token),
            json={"permission_ids": [str(permission.id), str(new_perm.id)]},
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["permissions"]) == 2

    def test_update_nonexistent_role(self, client, admin_token):
        """Test updating non-existent role returns 404."""
        response = client.patch(
            f"/api/v1/admin/roles/{uuid.uuid4()}",
            headers=get_auth_header(admin_token),
            json={"name": "test"},
        )
        assert response.status_code == 404

    def test_delete_role_as_admin(self, client, admin_token, db_session):
        """Test admin can delete a role."""
        from app.v1.db.models.roles import Role

        role_to_delete = Role(
            id=uuid.uuid4(),
            name="temp_role",
        )
        db_session.add(role_to_delete)
        db_session.commit()

        response = client.delete(
            f"/api/v1/admin/roles/{role_to_delete.id}",
            headers=get_auth_header(admin_token),
        )
        assert response.status_code == 204

    def test_delete_role_with_users_fails(
        self, client, admin_token, hr_role, regular_user
    ):
        """Test deleting role assigned to users fails."""
        response = client.delete(
            f"/api/v1/admin/roles/{hr_role.id}",
            headers=get_auth_header(admin_token),
        )
        assert response.status_code == 400
        assert "user(s) have this role" in response.json()["detail"]

    def test_delete_nonexistent_role(self, client, admin_token):
        """Test deleting non-existent role returns 404."""
        response = client.delete(
            f"/api/v1/admin/roles/{uuid.uuid4()}",
            headers=get_auth_header(admin_token),
        )
        assert response.status_code == 404

    def test_pagination_roles(self, client, admin_token, db_session):
        """Test role list pagination."""
        from app.v1.db.models.roles import Role

        for i in range(15):
            role = Role(
                id=uuid.uuid4(),
                name=f"role{i}",
            )
            db_session.add(role)
        db_session.commit()

        response = client.get(
            "/api/v1/admin/roles?skip=0&limit=10",
            headers=get_auth_header(admin_token),
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 10
