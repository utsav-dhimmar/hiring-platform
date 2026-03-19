"""
Test cases for admin user management API endpoints.
"""

import uuid
from app.v1.tests.admin.conftest import get_auth_header


class TestAdminUserManagement:
    """Test suite for admin user management endpoints."""

    def test_get_all_users_as_admin(self, client, admin_token, hr_role):
        """Test admin can get all users."""
        response = client.get(
            "/api/v1/admin/users",
            headers=get_auth_header(admin_token),
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    def test_get_all_users_as_non_admin(self, client, user_token):
        """Test non-admin cannot get all users."""
        response = client.get(
            "/api/v1/admin/users",
            headers=get_auth_header(user_token),
        )
        assert response.status_code == 403

    def test_get_all_users_unauthenticated(self, client):
        """Test unauthenticated request is rejected."""
        response = client.get("/api/v1/admin/users")
        assert response.status_code == 401

    def test_create_user_as_admin(self, client, admin_token, hr_role):
        """Test admin can create a new user."""
        response = client.post(
            "/api/v1/admin/users",
            headers=get_auth_header(admin_token),
            json={
                "email": "newuser@test.com",
                "password": "password123",
                "full_name": "New User",
                "is_active": True,
                "role_id": str(hr_role.id),
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["email"] == "newuser@test.com"
        assert data["full_name"] == "New User"
        assert "password" not in data
        assert "password_hash" not in data

    def test_create_user_with_duplicate_email(
        self, client, admin_token, regular_user, hr_role
    ):
        """Test creating user with duplicate email fails."""
        response = client.post(
            "/api/v1/admin/users",
            headers=get_auth_header(admin_token),
            json={
                "email": regular_user.email,
                "password": "password123",
                "role_id": str(hr_role.id),
            },
        )
        assert response.status_code == 400

    def test_create_user_with_invalid_role(self, client, admin_token):
        """Test creating user with non-existent role fails."""
        response = client.post(
            "/api/v1/admin/users",
            headers=get_auth_header(admin_token),
            json={
                "email": "test@test.com",
                "password": "password123",
                "role_id": str(uuid.uuid4()),
            },
        )
        assert response.status_code == 400

    def test_get_user_by_id(self, client, admin_token, regular_user):
        """Test admin can get specific user by ID."""
        response = client.get(
            f"/api/v1/admin/users/{regular_user.id}",
            headers=get_auth_header(admin_token),
        )
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == str(regular_user.id)
        assert data["email"] == regular_user.email

    def test_get_nonexistent_user(self, client, admin_token):
        """Test getting non-existent user returns 404."""
        response = client.get(
            f"/api/v1/admin/users/{uuid.uuid4()}",
            headers=get_auth_header(admin_token),
        )
        assert response.status_code == 404

    def test_update_user_as_admin(
        self, client, admin_token, regular_user, hr_role
    ):
        """Test admin can update a user."""
        response = client.patch(
            f"/api/v1/admin/users/{regular_user.id}",
            headers=get_auth_header(admin_token),
            json={
                "full_name": "Updated Name",
                "is_active": False,
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["full_name"] == "Updated Name"
        assert data["is_active"] is False

    def test_update_user_role(
        self, client, admin_token, regular_user, hr_role, admin_role
    ):
        """Test admin can change user role."""
        response = client.patch(
            f"/api/v1/admin/users/{regular_user.id}",
            headers=get_auth_header(admin_token),
            json={
                "role_id": str(admin_role.id),
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["role_id"] == str(admin_role.id)

    def test_update_nonexistent_user(self, client, admin_token):
        """Test updating non-existent user returns 404."""
        response = client.patch(
            f"/api/v1/admin/users/{uuid.uuid4()}",
            headers=get_auth_header(admin_token),
            json={"full_name": "Test"},
        )
        assert response.status_code == 404

    def test_delete_user_as_admin(
        self, client, admin_token, hr_role, db_session
    ):
        """Test admin can delete a user."""
        from app.v1.core.security import hash_password
        from app.v1.db.models.user import User

        user_to_delete = User(
            id=uuid.uuid4(),
            email="delete@test.com",
            full_name="Delete Me",
            password_hash=hash_password("password"),
            is_active=True,
            role_id=hr_role.id,
        )
        db_session.add(user_to_delete)
        db_session.commit()

        response = client.delete(
            f"/api/v1/admin/users/{user_to_delete.id}",
            headers=get_auth_header(admin_token),
        )
        assert response.status_code == 204

    def test_delete_own_account_fails(self, client, admin_token, admin_user):
        """Test admin cannot delete their own account."""
        response = client.delete(
            f"/api/v1/admin/users/{admin_user.id}",
            headers=get_auth_header(admin_token),
        )
        assert response.status_code == 400

    def test_delete_nonexistent_user(self, client, admin_token):
        """Test deleting non-existent user returns 404."""
        response = client.delete(
            f"/api/v1/admin/users/{uuid.uuid4()}",
            headers=get_auth_header(admin_token),
        )
        assert response.status_code == 404

    def test_pagination_users(self, client, admin_token, hr_role, db_session):
        """Test user list pagination."""
        from app.v1.core.security import hash_password
        from app.v1.db.models.user import User

        for i in range(15):
            user = User(
                id=uuid.uuid4(),
                email=f"user{i}@test.com",
                full_name=f"User {i}",
                password_hash=hash_password("password"),
                is_active=True,
                role_id=hr_role.id,
            )
            db_session.add(user)
        db_session.commit()

        response = client.get(
            "/api/v1/admin/users?skip=0&limit=10",
            headers=get_auth_header(admin_token),
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 10

        response = client.get(
            "/api/v1/admin/users?skip=10&limit=10",
            headers=get_auth_header(admin_token),
        )
        data = response.json()
        assert len(data) == 6
