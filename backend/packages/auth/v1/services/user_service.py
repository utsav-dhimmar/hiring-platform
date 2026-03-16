"""
User service module.

This module provides the business logic layer for user operations,
including user creation, retrieval, and listing.
"""

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging_config import get_logger
from packages.auth.v1.models.user import User
from packages.auth.v1.repository.user_repository import user_repository
from packages.auth.v1.schema.user import UserCreate

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

    async def create_user(self, db: AsyncSession, user_in: UserCreate):
        """Create a new user.

        Checks if a user with the given email already exists before creating.

        Args:
            db: The async database session.
            user_in: The user creation schema with user data.

        Returns:
            The created user object.

        Raises:
            HTTPException: If a user with the given email already exists.
        """
        user_exists = await self.get_user_by_email(db=db, email=user_in.email)
        if user_exists:
            logger.warning(
                f"Attempted to create duplicate user with email: {user_in.email}"
            )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The user with this email already exists in the system.",
            )

        db_obj = User(
            email=user_in.email,
            hashed_password=user_in.password,
            full_name=user_in.full_name,
        )
        created_user = await user_repository.create(db=db, user=db_obj)
        logger.info(f"Created new user with email: {user_in.email}")
        return created_user

    async def get_users(
        self, db: AsyncSession, skip: int = 0, limit: int = 100
    ):
        """Get a list of users with pagination.

        Args:
            db: The async database session.
            skip: Number of records to skip (offset).
            limit: Maximum number of records to return.

        Returns:
            List of user objects.
        """
        return await user_repository.list(db=db, skip=skip, limit=limit)


user_service = UserService()
