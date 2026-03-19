"""
Admin Service Module.

Provides business logic layer for admin operations including user management,
role management, permission management, audit logging, and analytics reporting.
"""

import uuid
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.v1.core.logging import get_logger
from app.v1.core.security import hash_password
from app.v1.db.models.audit_logs import AuditLog
from app.v1.db.models.permissions import Permission
from app.v1.db.models.roles import Role
from app.v1.db.models.user import User
from app.v1.repository.admin_repository import admin_repository
from app.v1.schemas.admin import (
    AnalyticsSummary,
    HiringReport,
    PermissionCreate,
    RoleCreate,
    RoleUpdate,
    UserAdminCreate,
    UserAdminUpdate,
)

logger = get_logger(__name__)


class AdminService:
    """
    Service for admin-level business operations.

    Handles user management, role management, permission management,
    audit logging, and analytics with proper authorization checks and validation.
    """

    async def log_action(
        self,
        db: AsyncSession,
        user_id: uuid.UUID,
        action: str,
        target_type: str | None = None,
        target_id: uuid.UUID | None = None,
        details: dict | None = None,
    ) -> None:
        """
        Log an admin action to the audit log.

        @param db - Database session
        @param user_id - Unique identifier of the user performing the action
        @param action - Type of action being performed
        @param target_type - Type of target entity (user, role, permission, etc.)
        @param target_id - Unique identifier of the target entity
        @param details - Additional details about the action
        """
        audit_log = AuditLog(
            user_id=user_id,
            action=action,
            target_type=target_type,
            target_id=target_id,
            details=details,
        )
        await admin_repository.create_audit_log(db=db, audit_log=audit_log)

    async def get_all_users(
        self, db: AsyncSession, skip: int = 0, limit: int = 100
    ) -> list[User]:
        """
        Retrieve all users with pagination.

        @param db - Database session
        @param skip - Number of records to skip for pagination
        @param limit - Maximum number of records to return
        @returns List of User objects
        """
        return await admin_repository.get_all_users(db=db, skip=skip, limit=limit)

    async def get_user_by_id(self, db: AsyncSession, user_id: uuid.UUID) -> User:
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
        self, db: AsyncSession, admin_user_id: uuid.UUID, user_in: UserAdminCreate
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

        role = await admin_repository.get_role_by_id(db=db, role_id=user_in.role_id)
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
        await db.refresh(user)

        await self.log_action(
            db=db,
            user_id=admin_user_id,
            action="create_user",
            target_type="user",
            target_id=user.id,
            details={"email": user.email, "role_id": str(user.role_id)},
        )

        logger.info(f"Admin created user with email: {user.email}")
        return user

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

        await self.log_action(
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

        await self.log_action(
            db=db,
            user_id=admin_user_id,
            action="delete_user",
            target_type="user",
            target_id=user.id,
            details={"email": user.email},
        )

        await admin_repository.delete_user(db=db, user=user)
        logger.info(f"Admin deleted user with email: {user.email}")

    async def get_all_roles(
        self, db: AsyncSession, skip: int = 0, limit: int = 100
    ) -> list[Role]:
        """
        Retrieve all roles with pagination.

        @param db - Database session
        @param skip - Number of records to skip for pagination
        @param limit - Maximum number of records to return
        @returns List of Role objects
        """
        return await admin_repository.get_all_roles(db=db, skip=skip, limit=limit)

    async def get_role_by_id(self, db: AsyncSession, role_id: uuid.UUID) -> Role:
        """
        Retrieve a role by its unique identifier.

        @param db - Database session
        @param role_id - Unique identifier of the role
        @returns Role object
        @throws HTTPException 404 if role not found
        """
        role = await admin_repository.get_role_by_id(db=db, role_id=role_id)
        if not role:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Role not found.",
            )
        return role

    async def create_role(
        self, db: AsyncSession, admin_user_id: uuid.UUID, role_in: RoleCreate
    ) -> Role:
        """
        Create a new role with optional permissions.

        @param db - Database session
        @param admin_user_id - Unique identifier of the admin creating the role
        @param role_in - Role creation data including optional permission IDs
        @returns Created role object with assigned permissions
        @throws HTTPException 400 if role name already exists
        """
        existing_role = await admin_repository.get_role_by_name(
            db=db, name=role_in.name
        )
        if existing_role:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Role with this name already exists.",
            )

        role = Role(name=role_in.name)
        db.add(role)
        await db.commit()
        await db.refresh(role)

        if role_in.permission_ids:
            role = await admin_repository.assign_permissions_to_role(
                db=db, role=role, permission_ids=role_in.permission_ids
            )

        await self.log_action(
            db=db,
            user_id=admin_user_id,
            action="create_role",
            target_type="role",
            target_id=role.id,
            details={"name": role.name},
        )

        logger.info(f"Admin created role: {role.name}")
        return role

    async def update_role(
        self,
        db: AsyncSession,
        admin_user_id: uuid.UUID,
        role_id: uuid.UUID,
        role_update: RoleUpdate,
    ) -> Role:
        """
        Update an existing role's details and permissions.

        @param db - Database session
        @param admin_user_id - Unique identifier of the admin performing the update
        @param role_id - Unique identifier of the role to update
        @param role_update - Role update data including optional permission IDs
        @returns Updated role object
        @throws HTTPException 404 if role not found
        """
        role = await admin_repository.get_role_by_id(db=db, role_id=role_id)
        if not role:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Role not found.",
            )

        update_data = role_update.model_dump(exclude_unset=True)
        permission_ids = update_data.pop("permission_ids", None)

        if update_data:
            role = await admin_repository.update_role(
                db=db, role=role, update_data=update_data
            )

        if permission_ids is not None:
            role = await admin_repository.assign_permissions_to_role(
                db=db, role=role, permission_ids=permission_ids
            )

        await self.log_action(
            db=db,
            user_id=admin_user_id,
            action="update_role",
            target_type="role",
            target_id=role.id,
            details={
                "updated_fields": list(
                    role_update.model_dump(exclude_unset=True).keys()
                )
            },
        )

        return role

    async def delete_role(
        self, db: AsyncSession, admin_user_id: uuid.UUID, role_id: uuid.UUID
    ) -> None:
        """
        Delete a role from the system.

        @param db - Database session
        @param admin_user_id - Unique identifier of the admin deleting the role
        @param role_id - Unique identifier of the role to delete
        @throws HTTPException 404 if role not found, 400 if users are assigned to this role
        """
        role = await admin_repository.get_role_by_id(db=db, role_id=role_id)
        if not role:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Role not found.",
            )

        users_with_role = await admin_repository.get_all_users(db=db)
        users_count = len([u for u in users_with_role if u.role_id == role_id])
        if users_count > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot delete role. {users_count} user(s) have this role.",
            )

        await self.log_action(
            db=db,
            user_id=admin_user_id,
            action="delete_role",
            target_type="role",
            target_id=role.id,
            details={"name": role.name},
        )

        await admin_repository.delete_role(db=db, role=role)
        logger.info(f"Admin deleted role: {role.name}")

    async def get_all_permissions(
        self, db: AsyncSession, skip: int = 0, limit: int = 100
    ) -> list[Permission]:
        """
        Retrieve all permissions with pagination.

        @param db - Database session
        @param skip - Number of records to skip for pagination
        @param limit - Maximum number of records to return
        @returns List of Permission objects
        """
        return await admin_repository.get_all_permissions(db=db, skip=skip, limit=limit)

    async def create_permission(
        self,
        db: AsyncSession,
        admin_user_id: uuid.UUID,
        permission_in: PermissionCreate,
    ) -> Permission:
        """
        Create a new permission.

        @param db - Database session
        @param admin_user_id - Unique identifier of the admin creating the permission
        @param permission_in - Permission creation data
        @returns Created permission object
        @throws HTTPException 400 if permission name already exists
        """
        existing = await admin_repository.get_permission_by_name(
            db=db, name=permission_in.name
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Permission with this name already exists.",
            )

        permission = Permission(
            name=permission_in.name,
            description=permission_in.description,
        )
        db.add(permission)
        await db.commit()
        await db.refresh(permission)

        await self.log_action(
            db=db,
            user_id=admin_user_id,
            action="create_permission",
            target_type="permission",
            target_id=permission.id,
            details={"name": permission.name},
        )

        logger.info(f"Admin created permission: {permission.name}")
        return permission

    async def delete_permission(
        self, db: AsyncSession, admin_user_id: uuid.UUID, permission_id: uuid.UUID
    ) -> None:
        """
        Delete a permission from the system.

        @param db - Database session
        @param admin_user_id - Unique identifier of the admin deleting the permission
        @param permission_id - Unique identifier of the permission to delete
        @throws HTTPException 404 if permission not found
        """
        permission = await admin_repository.get_permission_by_id(
            db=db, permission_id=permission_id
        )
        if not permission:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Permission not found.",
            )

        await self.log_action(
            db=db,
            user_id=admin_user_id,
            action="delete_permission",
            target_type="permission",
            target_id=permission.id,
            details={"name": permission.name},
        )

        await admin_repository.delete_permission(db=db, permission=permission)
        logger.info(f"Admin deleted permission: {permission.name}")

    async def get_audit_logs(
        self, db: AsyncSession, skip: int = 0, limit: int = 100
    ) -> list[AuditLog]:
        """
        Retrieve all audit logs with pagination.

        @param db - Database session
        @param skip - Number of records to skip for pagination
        @param limit - Maximum number of records to return
        @returns List of AuditLog objects
        """
        return await admin_repository.get_audit_logs(db=db, skip=skip, limit=limit)

    async def get_recent_uploads(
        self, db: AsyncSession, skip: int = 0, limit: int = 50
    ) -> list[Any]:
        """
        Retrieve recent file uploads.

        @param db - Database session
        @param skip - Number of records to skip for pagination
        @param limit - Maximum number of records to return
        @returns List of File objects
        """
        return await admin_repository.get_recent_uploads(db=db, skip=skip, limit=limit)

    async def get_analytics_summary(self, db: AsyncSession) -> AnalyticsSummary:
        """
        Get analytics summary with system statistics.

        @param db - Database session
        @returns AnalyticsSummary with counts for users, roles, permissions, jobs, candidates, and resumes
        """
        data = await admin_repository.get_analytics_summary(db=db)
        return AnalyticsSummary(**data)

    async def get_hiring_report(self, db: AsyncSession) -> HiringReport:
        """
        Get detailed hiring analytics report.

        @param db - Database session
        @returns HiringReport with job statistics, candidate metrics, and resume performance data
        """
        data = await admin_repository.get_hiring_report(db=db)
        return HiringReport(**data)


admin_service = AdminService()
