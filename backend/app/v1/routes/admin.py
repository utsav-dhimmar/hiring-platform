"""
Admin routes module.

This module provides admin endpoints for user management, role management,
permission management, audit logs, analytics, and hiring reports.
"""

import uuid
from typing import Any

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.v1.core.logging import get_logger
from app.v1.db.session import get_db
from app.v1.dependencies.dependencies import get_admin_user
from app.v1.schemas.admin import (
    AnalyticsSummary,
    AuditLogRead,
    HiringReport,
    PermissionCreate,
    PermissionRead,
    RecentUploadRead,
    RoleCreate,
    RoleRead,
    RoleUpdate,
    RoleWithPermissions,
    UserAdminCreate,
    UserAdminRead,
    UserAdminUpdate,
)
from app.v1.schemas.user import UserRead
from app.v1.services.admin_service import admin_service

logger = get_logger(__name__)

router = APIRouter()
"""API Router for admin endpoints.

Provides endpoints for user management, role management, permission management,
audit logs, analytics, and hiring reports. All endpoints require admin authentication.
"""


@router.get("/users", response_model=list[UserAdminRead])
async def get_all_users(
    db: AsyncSession = Depends(get_db),
    admin: UserRead = Depends(get_admin_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
) -> Any:
    """Get all users (admin only)."""
    return await admin_service.get_all_users(db=db, skip=skip, limit=limit)


@router.post(
    "/users", response_model=UserAdminRead, status_code=status.HTTP_201_CREATED
)
async def create_user(
    *,
    db: AsyncSession = Depends(get_db),
    admin: UserRead = Depends(get_admin_user),
    user_in: UserAdminCreate,
) -> Any:
    """Create a new user (admin only)."""
    return await admin_service.create_user(
        db=db, admin_user_id=admin.id, user_in=user_in
    )


@router.get("/users/{user_id}", response_model=UserAdminRead)
async def get_user(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    admin: UserRead = Depends(get_admin_user),
) -> Any:
    """Get a specific user by ID (admin only)."""
    return await admin_service.get_user_by_id(db=db, user_id=user_id)


@router.patch("/users/{user_id}", response_model=UserAdminRead)
async def update_user(
    user_id: uuid.UUID,
    *,
    db: AsyncSession = Depends(get_db),
    admin: UserRead = Depends(get_admin_user),
    user_update: UserAdminUpdate,
) -> Any:
    """Update a user (admin only)."""
    return await admin_service.update_user(
        db=db, admin_user_id=admin.id, user_id=user_id, user_update=user_update
    )


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    admin: UserRead = Depends(get_admin_user),
) -> None:
    """Delete a user (admin only)."""
    await admin_service.delete_user(
        db=db, admin_user_id=admin.id, user_id=user_id
    )


@router.get("/roles", response_model=list[RoleRead])
async def get_all_roles(
    db: AsyncSession = Depends(get_db),
    admin: UserRead = Depends(get_admin_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
) -> Any:
    """Get all roles (admin only)."""
    return await admin_service.get_all_roles(db=db, skip=skip, limit=limit)


@router.post(
    "/roles",
    response_model=RoleWithPermissions,
    status_code=status.HTTP_201_CREATED,
)
async def create_role(
    *,
    db: AsyncSession = Depends(get_db),
    admin: UserRead = Depends(get_admin_user),
    role_in: RoleCreate,
) -> Any:
    """Create a new role (admin only)."""
    return await admin_service.create_role(
        db=db, admin_user_id=admin.id, role_in=role_in
    )


@router.get("/roles/{role_id}", response_model=RoleWithPermissions)
async def get_role(
    role_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    admin: UserRead = Depends(get_admin_user),
) -> Any:
    """Get a specific role by ID (admin only)."""
    return await admin_service.get_role_by_id(db=db, role_id=role_id)


@router.patch("/roles/{role_id}", response_model=RoleWithPermissions)
async def update_role(
    role_id: uuid.UUID,
    *,
    db: AsyncSession = Depends(get_db),
    admin: UserRead = Depends(get_admin_user),
    role_update: RoleUpdate,
) -> Any:
    """Update a role (admin only)."""
    return await admin_service.update_role(
        db=db, admin_user_id=admin.id, role_id=role_id, role_update=role_update
    )


@router.delete("/roles/{role_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_role(
    role_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    admin: UserRead = Depends(get_admin_user),
) -> None:
    """Delete a role (admin only)."""
    await admin_service.delete_role(
        db=db, admin_user_id=admin.id, role_id=role_id
    )


@router.get("/permissions", response_model=list[PermissionRead])
async def get_all_permissions(
    db: AsyncSession = Depends(get_db),
    admin: UserRead = Depends(get_admin_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
) -> Any:
    """Get all permissions (admin only)."""
    return await admin_service.get_all_permissions(
        db=db, skip=skip, limit=limit
    )


@router.post(
    "/permissions",
    response_model=PermissionRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_permission(
    *,
    db: AsyncSession = Depends(get_db),
    admin: UserRead = Depends(get_admin_user),
    permission_in: PermissionCreate,
) -> Any:
    """Create a new permission (admin only)."""
    return await admin_service.create_permission(
        db=db, admin_user_id=admin.id, permission_in=permission_in
    )


@router.delete(
    "/permissions/{permission_id}", status_code=status.HTTP_204_NO_CONTENT
)
async def delete_permission(
    permission_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    admin: UserRead = Depends(get_admin_user),
) -> None:
    """Delete a permission (admin only)."""
    await admin_service.delete_permission(
        db=db, admin_user_id=admin.id, permission_id=permission_id
    )


@router.get("/audit-logs", response_model=list[AuditLogRead])
async def get_audit_logs(
    db: AsyncSession = Depends(get_db),
    admin: UserRead = Depends(get_admin_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
) -> Any:
    """Get all audit logs (admin only)."""
    return await admin_service.get_audit_logs(db=db, skip=skip, limit=limit)


@router.get("/recent-uploads", response_model=list[RecentUploadRead])
async def get_recent_uploads(
    db: AsyncSession = Depends(get_db),
    admin: UserRead = Depends(get_admin_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
) -> Any:
    """Get recent file uploads (admin only)."""
    return await admin_service.get_recent_uploads(db=db, skip=skip, limit=limit)


@router.get("/analytics", response_model=AnalyticsSummary)
async def get_analytics(
    db: AsyncSession = Depends(get_db),
    admin: UserRead = Depends(get_admin_user),
) -> Any:
    """Get analytics summary (admin only)."""
    return await admin_service.get_analytics_summary(db=db)


@router.get("/hiring-report", response_model=HiringReport)
async def get_hiring_report(
    db: AsyncSession = Depends(get_db),
    admin: UserRead = Depends(get_admin_user),
) -> Any:
    """Get hiring report with detailed statistics (admin only)."""
    return await admin_service.get_hiring_report(db=db)
