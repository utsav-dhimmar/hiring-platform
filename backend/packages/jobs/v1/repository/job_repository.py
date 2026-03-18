from fastcrud import FastCRUD
from sqlalchemy.ext.asyncio import AsyncSession
from app.v1.db.models.jobs import Job
from packages.jobs.v1.schema.job import JobRead


class JobRepository:
    def __init__(self) -> None:
        self.crud = FastCRUD(Job)

    async def get_multi(self, db: AsyncSession, skip: int = 0, limit: int = 100):
        return await self.crud.get_multi(
            db=db,
            offset=skip,
            limit=limit,
            return_as_model=True,
            schema_to_select=JobRead,
        )


job_repository = JobRepository()
