"""
User repository module.

This module provides the data access layer for user operations
using FastCRUD and SQLAlchemy async sessions.
"""

from fastcrud import FastCRUD
from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession

from app.v1.core.logging_config import get_logger
from app.v1.db.models.user import User
from packages.auth.v1.schema.user import UserCreateInternal, UserModel, UserRead

logger = get_logger(__name__)


class UserRepository:
    """Repository for user database operations.

    Provides methods for CRUD operations on user data using FastCRUD.

    Attributes:
        crud: The FastCRUD instance configured for User model.
    """

    def __init__(self) -> None:
        self.crud = FastCRUD(User)

    async def get_by_email(self, db: AsyncSession, email: str):
        """Get a user by email address.

        Args:
            db: The async database session.
            email: The email address to search for.

        Returns:
            The user object if found, None otherwise.
        """
        return await self.crud.get(
            db=db, email=email, return_as_model=True, schema_to_select=UserModel
        )

    async def get_by_id(self, db: AsyncSession, user_id):
        """Get a user by their unique ID.

        Args:
            db: The async database session.
            user_id: The UUID of the user to retrieve.

        Returns:
            The user object if found, None otherwise.
        """
        return await self.crud.get(
            db=db,
            id=user_id,
            schema_to_select=UserRead,
            return_as_model=True,
        )

    async def create(self, db: AsyncSession, user: UserCreateInternal):
        """Create a new user in the database.

        Args:
            db: The async database session.
            user: The internal user creation data with hashed password.

        Returns:
            The created user object.
        """
        return await self.crud.create(
            db=db,
            object=user,
            schema_to_select=UserRead,
            return_as_model=True,
        )

    async def update_refresh_token(
        self,
        db: AsyncSession,
        *,
        user_id,
        refresh_token: str,
        refresh_token_expires_at,
    ) -> None:
        """Update a user's refresh token and its expiration.

        Args:
            db: The async database session.
            user_id: The ID of the user to update.
            refresh_token: The new refresh token string.
            refresh_token_expires_at: The expiration datetime for the refresh token.
        """
        await db.execute(
            update(User)
            .where(User.id == user_id)
            .values(
                refresh_token=refresh_token,
                refresh_token_expires_at=refresh_token_expires_at,
            )
        )
        await db.commit()


user_repository = UserRepository()
