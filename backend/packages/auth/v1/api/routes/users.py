"""
User routes module.

This module defines the API endpoints for user operations
including creation and listing of users.
"""

from typing import Any

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging_config import get_logger
from app.db.session import get_db
from packages.auth.v1.schema.user import User as UserSchema
from packages.auth.v1.schema.user import UserCreate
from packages.auth.v1.services.user_service import user_service

logger = get_logger(__name__)

router = APIRouter()


@router.post("/", response_model=UserSchema, status_code=status.HTTP_201_CREATED)
async def create_user(
    *,
    db: AsyncSession = Depends(get_db),
    user_in: UserCreate,
) -> Any:
    """Create a new user.

    Registers a new user in the system with the provided email and password.

    Args:
        db: The async database session dependency.
        user_in: The user creation data.

    Returns:
        The created user object.
    """
    logger.info(f"Received request to create user with email: {user_in.email}")
    return await user_service.create_user(db=db, user_in=user_in)


@router.get("/", response_model=list[UserSchema])
async def read_users(
    db: AsyncSession = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """Get a list of users.

    Retrieves a paginated list of users from the system.

    Args:
        db: The async database session dependency.
        skip: Number of records to skip (offset).
        limit: Maximum number of records to return.

    Returns:
        List of user objects.
    """
    logger.debug(f"Fetching users with skip={skip}, limit={limit}")
    return await user_service.get_users(db=db, skip=skip, limit=limit)
