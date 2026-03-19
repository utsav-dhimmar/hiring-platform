"""
Tests for UserService functionality.
"""

import uuid

import pytest
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.v1.db.models.user import User
from app.v1.schemas.user import UserCreate, UserLogin
from app.v1.services.user_service import user_service

pytestmark = pytest.mark.asyncio


async def test_create_user_success(db_session: AsyncSession, hr_role):
    """Test successful user creation."""
    user_in = UserCreate(
        email="newuser@test.com",
        password="securepassword123",
        full_name="New User",
        is_active=True,
        role_id=hr_role.id,
    )

    created_user = await user_service.create_user(
        db=db_session, user_in=user_in
    )

    assert created_user is not None
    assert created_user.email == user_in.email
    assert created_user.full_name == user_in.full_name
    assert created_user.role_id == hr_role.id


async def test_create_user_duplicate_email(
    db_session: AsyncSession, regular_user, hr_role
):
    """Test user creation with duplicate email fails."""
    user_in = UserCreate(
        email=regular_user.email,  # Already exists
        password="somepassword",
        full_name="Duplicate User",
        is_active=True,
        role_id=hr_role.id,
    )

    with pytest.raises(HTTPException) as exc_info:
        await user_service.create_user(db=db_session, user_in=user_in)

    assert exc_info.value.status_code == 400
    assert "already exists in the system" in exc_info.value.detail


async def test_get_user_by_email(db_session: AsyncSession, regular_user):
    """Test retrieval of an existing user by email."""
    user = await user_service.get_user_by_email(
        db=db_session, email=regular_user.email
    )

    assert user is not None
    assert user.id == regular_user.id
    assert user.email == regular_user.email


async def test_get_user_by_email_not_found(db_session: AsyncSession):
    """Test retrieval of a non-existing user by email returns None."""
    user = await user_service.get_user_by_email(
        db=db_session, email="nonexistent@test.com"
    )
    assert user is None


async def test_get_user_by_id_success(db_session: AsyncSession, regular_user):
    """Test successful retrieval of an existing user by ID."""
    user = await user_service.get_user_by_id(
        db=db_session, user_id=regular_user.id
    )

    assert user is not None
    assert user.id == regular_user.id
    assert user.email == regular_user.email


async def test_get_user_by_id_not_found(db_session: AsyncSession):
    """Test retrieval of a non-existing user by ID raises 404."""
    random_id = uuid.uuid4()
    with pytest.raises(HTTPException) as exc_info:
        await user_service.get_user_by_id(db=db_session, user_id=random_id)

    assert exc_info.value.status_code == 404
    assert exc_info.value.detail == "User not found."


async def test_login_user_success(db_session: AsyncSession, regular_user):
    """Test successful login with valid credentials."""
    credentials = UserLogin(
        email=regular_user.email,
        password="user123",  # Note: regular_user fixture sets password to "user123"
    )

    response = await user_service.login_user(
        db=db_session, credentials=credentials
    )

    assert response is not None
    assert response.access_token is not None
    assert response.refresh_token is not None
    assert response.user.id == regular_user.id
    assert response.user.email == regular_user.email


async def test_login_user_invalid_credentials(
    db_session: AsyncSession, regular_user
):
    """Test login with invalid password."""
    credentials = UserLogin(
        email=regular_user.email,
        password="wrongpassword",
    )

    with pytest.raises(HTTPException) as exc_info:
        await user_service.login_user(db=db_session, credentials=credentials)

    assert exc_info.value.status_code == 401
    assert exc_info.value.detail == "Invalid email or password."


async def test_login_user_inactive(
    db_session: AsyncSession, hr_role, admin_role
):
    """Test login with an inactive user profile."""
    # Create an inactive user manually
    from app.v1.core.security import hash_password

    inactive_user = User(
        id=uuid.uuid4(),
        email="inactive@test.com",
        full_name="Inactive User",
        password_hash=hash_password("inactive123"),
        is_active=False,
        role_id=hr_role.id,
    )
    db_session.add(inactive_user)
    await db_session.commit()
    await db_session.refresh(inactive_user)

    credentials = UserLogin(
        email=inactive_user.email,
        password="inactive123",
    )

    with pytest.raises(HTTPException) as exc_info:
        await user_service.login_user(db=db_session, credentials=credentials)

    assert exc_info.value.status_code == 403
    assert exc_info.value.detail == "Inactive user."
