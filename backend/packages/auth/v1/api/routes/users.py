"""
User authentication routes.

This module provides endpoints for user registration, login, and retrieval.
"""
import uuid
from typing import Any

from fastapi import APIRouter, Depends, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from app.v1.core.logging_config import get_logger
from app.v1.db.session import get_db
from packages.auth.v1.schema.user import (
    LoginResponse,
    UserCreate,
    UserLogin,
    UserRead,
)
from packages.auth.v1.services.user_service import user_service

logger = get_logger(__name__)

router = APIRouter()


@router.post("/", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def create_user(
    *,
    db: AsyncSession = Depends(get_db),
    user_in: UserCreate,
) -> Any:
    """
    Create a new user.

    Args:
        db: Async database session.
        user_in: User creation schema.

    Returns:
        The created user.
    """
    logger.info(f"Received request to create user with email: {user_in.email}")
    return await user_service.create_user(db=db, user_in=user_in)


@router.post("/login", response_model=LoginResponse)
async def login_user(
    *,
    db: AsyncSession = Depends(get_db),
    credentials: UserLogin,
) -> Any:
    """
    Login a user and return access/refresh tokens.

    Args:
        db: Async database session.
        credentials: User login credentials.

    Returns:
        Login response with tokens.
    """
    logger.info(f"Login attempt for email: {credentials.email}")
    return await user_service.login_user(db=db, credentials=credentials)


@router.post(
    "/login/swagger",
    response_model=LoginResponse,
    summary="Swagger login",
)
async def swagger_login_user(
    *,
    db: AsyncSession = Depends(get_db),
    credentials: OAuth2PasswordRequestForm = Depends(),
) -> Any:
    """
    Login a user using Swagger UI (OAuth2 Password flow).

    Args:
        db: Async database session.
        credentials: OAuth2 password request form.

    Returns:
        Login response with tokens.
    """
    logger.info(f"Swagger login attempt for email: {credentials.username}")
    return await user_service.login_user(
        db=db,
        credentials=UserLogin(
            email=credentials.username,
            password=credentials.password,
        ),
    )


@router.get("/{userid}", response_model=UserRead)
async def read_user(
    userid: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Retrieve a user by their ID.

    Args:
        userid: The UUID of the user.
        db: Async database session.

    Returns:
        The user information.
    """
    logger.debug(f"Fetching user with id={userid}")
    return await user_service.get_user_by_id(db=db, user_id=userid)
