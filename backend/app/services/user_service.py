from fastapi import HTTPException, status
from fastcrud import FastCRUD
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.schema.user import UserCreate


class UserService:
    def __init__(self):
        self.crud = FastCRUD(User)

    async def get_user_by_email(self, db: AsyncSession, email: str):
        return await self.crud.get(db=db, email=email)

    async def create_user(self, db: AsyncSession, user_in: UserCreate):
        user_exists = await self.get_user_by_email(db=db, email=user_in.email)
        if user_exists:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The user with this email already exists in the system.",
            )

        ## TODO: Hash Password Here
        db_obj = User(
            email=user_in.email,
            hashed_password=user_in.password,  # Store the hashed password
            full_name=user_in.full_name,
            is_superuser=user_in.is_superuser,
        )
        return await self.crud.create(db=db, object=db_obj)

    async def get_users(
        self, db: AsyncSession, skip: int = 0, limit: int = 100
    ):
        users_data = await self.crud.get_multi(db=db, offset=skip, limit=limit)
        return users_data["data"]


user_service = UserService()
