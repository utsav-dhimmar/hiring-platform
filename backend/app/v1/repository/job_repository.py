"""
Repository for job-related database operations.
"""

from fastcrud import FastCRUD
from sqlalchemy.ext.asyncio import AsyncSession

from app.v1.db.models.jobs import Job
from app.v1.schemas.job import JobRead


class JobRepository:
    """
    Repository class for handling Job database operations using FastCRUD.
    """

    def __init__(self) -> None:
        """
        Initialize the JobRepository with FastCRUD.
        """
        self.crud = FastCRUD(Job)

    async def get_multi(
        self, db: AsyncSession, skip: int = 0, limit: int = 100
    ):
        """
        Retrieve multiple job records with pagination.

        Args:
            db (AsyncSession): Database session.
            skip (int): Number of records to skip.
            limit (int): Maximum number of records to return.

        Returns:
            Any: A dictionary-like object containing the list of jobs and total count.
        """
        return await self.crud.get_multi(
            db=db,
            offset=skip,
            limit=limit,
            return_as_model=True,
            schema_to_select=JobRead,
        )


job_repository = JobRepository()
