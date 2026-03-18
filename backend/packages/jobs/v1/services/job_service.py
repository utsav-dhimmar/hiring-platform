from sqlalchemy.ext.asyncio import AsyncSession
from packages.jobs.v1.repository.job_repository import job_repository

class JobService:
    async def get_jobs(self, db: AsyncSession, skip: int = 0, limit: int = 100):
        return await job_repository.get_multi(db=db, skip=skip, limit=limit)

job_service = JobService()
