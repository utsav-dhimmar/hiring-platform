"""
API routes for location-related operations in version 1.
"""

from typing import Any

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.v1.db.session import get_db
from app.v1.dependencies import get_current_user
from app.v1.schemas.location import LocationRead
from app.v1.schemas.response import PaginatedData
from app.v1.schemas.user import UserRead
from app.v1.services.admin.location_service import location_service

router = APIRouter()


@router.get("", response_model=PaginatedData[LocationRead])
async def get_all_locations(
    db: AsyncSession = Depends(get_db),
    user: UserRead = Depends(get_current_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(500, ge=1, le=1000),
    q: str | None = Query(None, description="Search locations by name"),
) -> Any:
    """Get all locations for filtering (e.g. dropdown).

    Returns a paginated list of all unique locations, sorted alphabetically.
    """
    return await location_service.get_all_locations(
        db=db, skip=skip, limit=limit, q=q
    )
