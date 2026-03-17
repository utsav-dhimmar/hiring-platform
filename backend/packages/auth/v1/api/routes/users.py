import uuid
from typing import Any

from fastapi import APIRouter, Depends, status
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
    logger.info(f"Received request to create user with email: {user_in.email}")
    return await user_service.create_user(db=db, user_in=user_in)


@router.post("/login", response_model=LoginResponse)
async def login_user(
    *,
    db: AsyncSession = Depends(get_db),
    credentials: UserLogin,
) -> Any:
    logger.info(f"Login attempt for email: {credentials.email}")
    return await user_service.login_user(db=db, credentials=credentials)


@router.get("/{userid}", response_model=UserRead)
async def read_user(
    userid: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> Any:
    logger.debug(f"Fetching user with id={userid}")
    return await user_service.get_user_by_id(db=db, user_id=userid)
