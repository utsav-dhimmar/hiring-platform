"""
Service layer for job-related business logic.
"""

from sqlalchemy.ext.asyncio import AsyncSession

from app.v1.repository.job_repository import job_repository


class JobService:
    """
    Service class for handling Job-related operations.
    """

    async def get_jobs(self, db: AsyncSession, skip: int = 0, limit: int = 100):
        """
        Retrieve a list of jobs with pagination.

        Args:
            db (AsyncSession): Database session.
            skip (int): Number of records to skip.
            limit (int): Maximum number of records to return.

        Returns:
            dict[str, Any]: A dictionary containing the list of jobs and total count.
        """
        return await job_repository.get_multi(db=db, skip=skip, limit=limit)


job_service = JobService()
