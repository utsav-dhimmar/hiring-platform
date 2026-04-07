import uuid
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.v1.core.logging import get_logger
from app.v1.db.models.permissions import Permission
from app.v1.db.models.roles import Role
from app.v1.repository.admin_repository import admin_repository
from app.v1.schemas.admin import (
    PermissionCreate,
    PermissionRead,
    RoleCreate,
    RoleRead,
    RoleUpdate,
)
from app.v1.schemas.response import PaginatedData
from app.v1.services.admin.audit_service import audit_service

logger = get_logger(__name__)

class RoleService:
    """
    Service for admin-level role and permission management.
    """

    async def get_all_roles(
        self, db: AsyncSession, skip: int = 0, limit: int = 100, search: str | None = None
    ) -> PaginatedData[RoleRead]:
        """
        Retrieve all roles with pagination and optional search by name.
        """
        roles = await admin_repository.get_all_roles(
            db=db, skip=skip, limit=limit, search=search
        )
        total = await admin_repository.count_all_roles(db=db, search=search)
        return PaginatedData[RoleRead](
            data=[RoleRead.model_validate(role) for role in roles],
            total=total,
        )

    async def get_role_by_id(
        self, db: AsyncSession, role_id: uuid.UUID
    ) -> Role:
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
        else:
            # Re-fetch with permissions even if none assigned to avoid lazy loading
            role = await admin_repository.get_role_by_id(db=db, role_id=role.id)

        await audit_service.log_action(
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

        await audit_service.log_action(
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
        Delete a role and its associations, but ONLY if no Users are assigned to it.
        Includes a direct database count and detailed error reporting.
        """
        from sqlalchemy import select, func, delete
        from app.v1.db.models.user import User
        from app.v1.db.models.roles import role_permission

        # 1. Fetch the role to check existence
        role = await admin_repository.get_role_by_id(db=db, role_id=role_id)
        if not role:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Role not found.",
            )

        # 2. Detailed assigned users check
        stmt = select(User).where(User.role_id == role_id).limit(5)
        result = await db.execute(stmt)
        assigned_users = result.scalars().all()
        
        # Get total count
        count_stmt = select(func.count(User.id)).where(User.role_id == role_id)
        users_count = await db.scalar(count_stmt) or 0

        if users_count > 0:
            user_details = ", ".join([u.full_name for u in assigned_users])
            if users_count > 5:
                user_details += " and others"
            
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Cannot delete role '{role.name}'. There are {users_count} user(s) assigned to this role: "
                    f"[{user_details}]. Please reassign them to another role first."
                )
            )

        # 3. Clean up associations (junction table)
        await db.execute(delete(role_permission).where(role_permission.c.role_id == role_id))

        # 4. Success Log and Deletion
        await audit_service.log_action(
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
    ) -> PaginatedData[PermissionRead]:
        """
        Retrieve all permissions with pagination.

        @param db - Database session
        @param skip - Number of records to skip for pagination
        @param limit - Maximum number of records to return
        @returns List of Permission objects
        """
        permissions = await admin_repository.get_all_permissions(
            db=db, skip=skip, limit=limit
        )
        total = await admin_repository.count_all_permissions(db=db)
        return PaginatedData[PermissionRead](
            data=[PermissionRead.model_validate(permission) for permission in permissions],
            total=total,
        )

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

        await audit_service.log_action(
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
        self,
        db: AsyncSession,
        admin_user_id: uuid.UUID,
        permission_id: uuid.UUID,
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

        await audit_service.log_action(
            db=db,
            user_id=admin_user_id,
            action="delete_permission",
            target_type="permission",
            target_id=permission.id,
            details={"name": permission.name},
        )

        await admin_repository.delete_permission(db=db, permission=permission)
        logger.info(f"Admin deleted permission: {permission.name}")

role_service = RoleService()
