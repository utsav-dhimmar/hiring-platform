import uuid
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.v1.repository.admin_repository import admin_repository
from app.v1.schemas.admin import AnalyticsSummary, HiringReport, RecentUploadRead, JobPipelineStats
from app.v1.schemas.response import PaginatedData


class AnalyticsService:
    """
    Service for admin-level analytics and reporting.
    """

    async def get_recent_uploads(
        self, db: AsyncSession, skip: int = 0, limit: int = 50, q: str | None = None
    ) -> PaginatedData[RecentUploadRead]:
        """
        Retrieve recent file uploads.

        @param db - Database session
        @param skip - Number of records to skip for pagination
        @param limit - Maximum number of records to return
        @returns List of File objects
        """
        uploads = await admin_repository.get_recent_uploads(
            db=db, skip=skip, limit=limit, q=q
        )
        total = await admin_repository.count_recent_uploads(db=db, q=q)
        return PaginatedData[RecentUploadRead](
            data=[RecentUploadRead.model_validate(upload) for upload in uploads],
            total=total,
        )

    async def get_analytics_summary(self, db: AsyncSession) -> AnalyticsSummary:
        """
        Get analytics summary with system statistics.

        @param db - Database session
        @returns AnalyticsSummary with counts for users, roles, permissions, jobs, candidates, and resumes
        """
        data = await admin_repository.get_analytics_summary(db=db)
        return AnalyticsSummary(**data)

    async def get_hiring_report(
        self,
        db: AsyncSession,
        job_id: uuid.UUID | None = None,
        stage_name: str | None = None,
    ) -> HiringReport:
        """
        Get detailed hiring analytics report.

        @param db - Database session
        @param job_id - Optional job UUID to filter pipeline stats to a single job
        @param stage_name - Optional stage name to filter pipeline stats (case-insensitive)
        @returns HiringReport with job statistics, candidate metrics, and resume performance data
        """
        data = await admin_repository.get_hiring_report(
            db=db, job_id=job_id, stage_name=stage_name
        )
        return HiringReport(**data)

    async def get_pipeline_stats(
        self,
        db: AsyncSession,
        job_id: uuid.UUID | None = None,
        stage_name: str | None = None,
    ) -> list[dict]:
        """
        Get pipeline stats filtered by job and/or stage.

        @param db - Database session
        @param job_id - Optional job UUID to filter to a single job
        @param stage_name - Optional stage name to filter results (case-insensitive)
        @returns List of stage-based statistics with job names as keys
        """
        return await admin_repository.get_pipeline_stats(
            db=db, job_id=job_id, stage_name=stage_name
        )


analytics_service = AnalyticsService()
