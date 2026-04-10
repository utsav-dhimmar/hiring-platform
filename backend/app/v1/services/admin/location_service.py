"""
Location service for fetching location data (used for filtering).
"""

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.v1.db.models.locations import Location
from app.v1.schemas.location import LocationRead
from app.v1.schemas.response import PaginatedData


class LocationService:
    """
    Service for location lookup operations (read-only).
    """

    async def get_all_locations(
        self, db: AsyncSession, skip: int = 0, limit: int = 500, q: str | None = None
    ) -> PaginatedData[LocationRead]:
        """Get all locations with pagination, ordered alphabetically."""
        query = select(Location)
        
        if q:
            search_term = f"%{q.strip()}%"
            query = query.where(Location.name.ilike(search_term))
            
        total_stmt = select(func.count()).select_from(query.subquery())
        total = await db.scalar(total_stmt)

        locations = (
            await db.scalars(
                query.order_by(Location.name.asc())
                .offset(skip)
                .limit(limit)
            )
        ).all()

        return PaginatedData[LocationRead](
            data=[LocationRead.model_validate(loc) for loc in locations],
            total=total or 0,
        )


location_service = LocationService()
