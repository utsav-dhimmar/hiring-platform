from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.v1.repository.admin_repository import admin_repository
from app.v1.schemas.admin import AnalyticsSummary, HiringReport


class AnalyticsService:
    """
    Service for admin-level analytics and reporting.
    """

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
        return await admin_repository.get_recent_uploads(
            db=db, skip=skip, limit=limit
        )

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


analytics_service = AnalyticsService()
