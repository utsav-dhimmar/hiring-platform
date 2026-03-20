"""
Authorization and permission dependencies.
"""

from fastapi import Depends, HTTPException, status

from app.v1.schemas.user import UserRead
from .auth import get_current_user


async def get_admin_user(
    current_user: UserRead = Depends(get_current_user),
) -> UserRead:
    """
    Verify the current user has admin privileges based on permissions.
    Checks for 'admin:access' or the 'admin:all' super-permission.
    """
    has_admin_permission = (
        "admin:access" in current_user.permissions
        or "admin:all" in current_user.permissions
    )

    if not has_admin_permission:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges (admin:access) required.",
        )

    return current_user


def check_permission(permission_name: str):
    """
    Dependency factory to check if a user has a specific permission or 'admin:all'.
    This approach is dynamic and doesn't rely on hard-coded role names.
    """

    async def _has_permission(
        current_user: UserRead = Depends(get_current_user),
    ) -> UserRead:
        has_permission = (
            permission_name in current_user.permissions
            or "admin:all" in current_user.permissions
        )

        if not has_permission:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission '{permission_name}' required.",
            )
        return current_user

    return _has_permission
