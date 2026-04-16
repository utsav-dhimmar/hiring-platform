import uuid
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.v1.core.logging import get_logger
from app.v1.core.security import hash_password
from app.v1.db.models.user import User
from app.v1.repository.admin_repository import admin_repository
from app.v1.schemas.admin import UserAdminCreate, UserAdminRead, UserAdminUpdate
from app.v1.schemas.response import PaginatedData
from app.v1.services.admin.audit_service import audit_service

logger = get_logger(__name__)

class UserAdminService:
    """
    Service for admin-level user management operations.
    """

    async def get_all_users(
        self, db: AsyncSession, skip: int = 0, limit: int = 100, q: str | None = None
    ) -> PaginatedData[UserAdminRead]:
        """
        Retrieve all users with pagination.

        @param db - Database session
        @param skip - Number of records to skip for pagination
        @param limit - Maximum number of records to return
        @returns List of User objects
        """
        users = await admin_repository.get_all_users(
            db=db, skip=skip, limit=limit, search=q
        )
        total = await admin_repository.count_all_users(db=db, search=q)
        return PaginatedData[UserAdminRead](
            data=[UserAdminRead.model_validate(user) for user in users],
            total=total,
        )

    async def get_user_by_id(
        self, db: AsyncSession, user_id: uuid.UUID
    ) -> User:
        """
        Retrieve a user by their unique identifier.

        @param db - Database session
        @param user_id - Unique identifier of the user
        @returns User object
        @throws HTTPException 404 if user not found
        """
        user = await admin_repository.get_user_by_id(db=db, user_id=user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found.",
            )
        return user

    async def create_user(
        self,
        db: AsyncSession,
        admin_user_id: uuid.UUID,
        user_in: UserAdminCreate,
    ) -> User:
        """
        Create a new user with the provided details.

        @param db - Database session
        @param admin_user_id - Unique identifier of the admin creating the user
        @param user_in - User creation data
        @returns Created user object
        @throws HTTPException 400 if email already exists or role not found
        """
        existing_user = await admin_repository.get_user_by_email(
            db=db, email=user_in.email
        )
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User with this email already exists.",
            )

        role = await admin_repository.get_role_by_id(
            db=db, role_id=user_in.role_id
        )
        if not role:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Role not found.",
            )

        user = User(
            email=user_in.email,
            password_hash=hash_password(user_in.password),
            full_name=user_in.full_name,
            is_active=user_in.is_active,
            role_id=user_in.role_id,
        )
        db.add(user)
        await db.commit()
        # Fetch with role pre-loaded to avoid Lazy Loading error in serialization
        full_user = await self.get_user_by_id(db, user.id)

        await audit_service.log_action(
            db=db,
            user_id=admin_user_id,
            action="create_user",
            target_type="user",
            target_id=user.id,
            details={"email": user.email, "role_id": str(user.role_id)},
        )

        logger.info(f"Admin created user with email: {user.email}")
        return full_user

    async def update_user(
        self,
        db: AsyncSession,
        admin_user_id: uuid.UUID,
        user_id: uuid.UUID,
        user_update: UserAdminUpdate,
    ) -> User:
        """
        Update an existing user's details.

        @param db - Database session
        @param admin_user_id - Unique identifier of the admin performing the update
        @param user_id - Unique identifier of the user to update
        @param user_update - User update data
        @returns Updated user object
        @throws HTTPException 404 if user not found, 400 if role not found
        """
        user = await admin_repository.get_user_by_id(db=db, user_id=user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found.",
            )

        if user_update.role_id:
            role = await admin_repository.get_role_by_id(
                db=db, role_id=user_update.role_id
            )
            if not role:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Role not found.",
                )

        update_data = user_update.model_dump(exclude_unset=True)
        updated_user = await admin_repository.update_user(
            db=db, user=user, update_data=update_data
        )

        await audit_service.log_action(
            db=db,
            user_id=admin_user_id,
            action="update_user",
            target_type="user",
            target_id=user.id,
            details={"updated_fields": list(update_data.keys())},
        )

        return updated_user

    async def delete_user(
        self, db: AsyncSession, admin_user_id: uuid.UUID, user_id: uuid.UUID
    ) -> None:
        """
        Delete a user from the system.

        @param db - Database session
        @param admin_user_id - Unique identifier of the admin deleting the user
        @param user_id - Unique identifier of the user to delete
        @throws HTTPException 404 if user not found, 400 if attempting to delete own account
        """
        user = await admin_repository.get_user_by_id(db=db, user_id=user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found.",
            )

        if user.id == admin_user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete your own account.",
            )

        await audit_service.log_action(
            db=db,
            user_id=admin_user_id,
            action="delete_user",
            target_type="user",
            target_id=user.id,
            details={"email": user.email},
        )

        await admin_repository.delete_user(db=db, user=user)
        logger.info(f"Admin deleted user with email: {user.email}")

user_admin_service = UserAdminService()
