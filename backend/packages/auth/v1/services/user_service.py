"""
User service module.

This module provides the business logic layer for user operations,
including user creation, retrieval, and listing.
"""

import uuid

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.v1.core.logging_config import get_logger
from app.v1.core.security import (
    create_access_token,
    create_refresh_token,
    hash_password,
    verify_password,
)
from app.v1.db.models.roles import Role
from packages.auth.v1.repository.user_repository import user_repository
from packages.auth.v1.schema.user import (
    LoginResponse,
    UserCreate,
    UserCreateInternal,
    UserLogin,
)

logger = get_logger(__name__)


class UserService:
    """Service for user business logic operations.

    Handles user-related operations including creation, retrieval,
    and listing with business rules and validation.
    """

    async def get_user_by_email(self, db: AsyncSession, email: str):
        """Get a user by email address.

        Args:
            db: The async database session.
            email: The email address to search for.

        Returns:
            The user object if found, None otherwise.
        """
        return await user_repository.get_by_email(db=db, email=email)

    async def get_user_by_id(self, db: AsyncSession, user_id: uuid.UUID):
        """Get a user by their unique ID.

        Args:
            db: The async database session.
            user_id: The UUID of the user to retrieve.

        Returns:
            The user object if found.

        Raises:
            HTTPException: If the user is not found (404).
        """
        user = await user_repository.get_by_id(db=db, user_id=user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found.",
            )
        return user

    async def create_user(self, db: AsyncSession, user_in: UserCreate):
        """Create a new user in the system.

        Validates that the email is unique and the role exists before creation.
        Hashes the user password before storing.

        Args:
            db: The async database session.
            user_in: The user creation data.

        Returns:
            The newly created user object.

        Raises:
            HTTPException: If the email already exists (400) or role is invalid (400).
        """
        user_exists = await self.get_user_by_email(db=db, email=user_in.email)
        if user_exists:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The user with this email already exists in the system.",
            )

        role = await db.get(Role, user_in.role_id)
        if not role:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The specified role does not exist.",
            )

        db_obj = UserCreateInternal(
            email=user_in.email,
            password_hash=hash_password(user_in.password),
            full_name=user_in.full_name,
            is_active=user_in.is_active,
            role_id=user_in.role_id,
        )
        created_user = await user_repository.create(db=db, user=db_obj)
        logger.info(f"Created new user with email: {user_in.email}")
        return created_user

    async def login_user(
        self, db: AsyncSession, credentials: UserLogin
    ) -> LoginResponse:
        """Authenticate a user and return access/refresh tokens.

        Args:
            db: The async database session.
            credentials: User login credentials (email and password).

        Returns:
            A LoginResponse containing tokens and user information.

        Raises:
            HTTPException: If authentication fails (401) or user is inactive (403).
        """
        user = await self.get_user_by_email(db=db, email=credentials.email)
        print(user, credentials)
        if not user or not verify_password(
            credentials.password, user.password_hash
        ):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password.",
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Inactive user.",
            )

        access_token, expires_at = create_access_token(
            subject=str(user.id),
            email=user.email,
        )
        refresh_token, refresh_token_expires_at = create_refresh_token(
            subject=str(user.id),
            email=user.email,
        )
        await user_repository.update_refresh_token(
            db=db,
            user_id=user.id,
            refresh_token=refresh_token,
            refresh_token_expires_at=refresh_token_expires_at,
        )
        user_read = await self.get_user_by_id(db=db, user_id=user.id)
        return LoginResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_at=expires_at,
            refresh_token_expires_at=refresh_token_expires_at,
            user=user_read,
        )


user_service = UserService()
