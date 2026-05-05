"""
Admin System routes module.

Provides administrative endpoints for system-wide operations like cache management.
"""

from typing import Any
from fastapi import APIRouter, Depends
from app.v1.dependencies import check_permission
from app.v1.schemas.response import Response
from app.v1.schemas.user import UserRead
from app.v1.services.admin_service import admin_service

router = APIRouter()

@router.delete(
    "/cache",
    response_model=Response[bool],
    summary="Clear System Cache",
    tags=["admin"]
)
async def clear_system_cache(
    admin: UserRead = Depends(check_permission("system:manage")),
) -> Any:
    """
    Clear the entire system cache (Redis).
    Requires 'system:manage' permission.
    """
    success = await admin_service.clear_cache()
    if success:
        return Response[bool](data=True, message="Cache cleared successfully")
    return Response[bool](success=False, data=False, message="Failed to clear cache")
