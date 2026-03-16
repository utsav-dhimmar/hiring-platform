"""
User repository module.

This module provides the data access layer for user operations
using FastCRUD and SQLAlchemy async sessions.
"""

from fastcrud import FastCRUD
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging_config import get_logger
from packages.auth.v1.models.user import User
from packages.auth.v1.schema.user import UserCreateInternal, User as UserSchema

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
        return await self.crud.get(db=db, email=email)

    async def create(self, db: AsyncSession, user: UserCreateInternal):
        """Create a new user.

        Args:
            db: The async database session.
            user: The UserCreateInternal schema to create.

        Returns:
            The created user object.
        """
        # user_dict = {
        #     key: getattr(user, key)
        #     for key in user.__table__.columns.keys()
        #     if key != "id"
        # }
        return await self.crud.create(
            db=db, object=user, schema_to_select=UserSchema, return_as_model=True
        )

    async def list(self, db: AsyncSession, skip: int = 0, limit: int = 100):
        """List users with pagination.

        Args:
            db: The async database session.
            skip: Number of records to skip (offset).
            limit: Maximum number of records to return.

        Returns:
            List of user objects.
        """
        users_data = await self.crud.get_multi(db=db, offset=skip, limit=limit)
        logger.debug(
            f"Retrieved {len(users_data['data'])} users (skip={skip}, limit={limit})"
        )
        return users_data["data"]


user_repository = UserRepository()
