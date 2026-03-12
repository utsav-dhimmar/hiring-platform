from typing import Any, List

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schema.user import User as UserSchema
from app.schema.user import UserCreate
from app.services import user_service

router = APIRouter()


@router.post(
    "/", response_model=UserSchema, status_code=status.HTTP_201_CREATED
)
async def create_user(
    *,
    db: AsyncSession = Depends(get_db),
    user_in: UserCreate,
) -> Any:
    """
    Create new user via UserService.
    """
    return await user_service.create_user(db=db, user_in=user_in)


@router.get("/", response_model=List[UserSchema])
async def read_users(
    db: AsyncSession = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve users via UserService.
    """
    return await user_service.get_users(db=db, skip=skip, limit=limit)
