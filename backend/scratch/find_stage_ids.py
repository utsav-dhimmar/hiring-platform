import asyncio
import uuid
from app.v1.db.session import async_session_maker
from app.v1.db.models.candidate_stages import CandidateStage
from app.v1.db.models.candidates import Candidate
from app.v1.db.models.job_stage_configs import JobStageConfig
from app.v1.db.models.jobs import Job
from sqlalchemy import select
from sqlalchemy.orm import selectinload

async def get_ids():
    async with async_session_maker() as db:
        # Get candidate stages with candidate and job info
        stmt = (
            select(CandidateStage)
            .options(
                selectinload(CandidateStage.candidate),
                selectinload(CandidateStage.job_stage).selectinload(JobStageConfig.job)
            )
            .limit(5)
        )
        res = await db.execute(stmt)
        stages = res.scalars().all()
        
        if not stages:
            print("No candidate stages found.")
            return

        print(f"{'Candidate Name':<20} | {'Job Title':<20} | {'Stage ID':<40} | {'Status':<10}")
        print("-" * 100)
        for s in stages:
            first_name = s.candidate.first_name if s.candidate and s.candidate.first_name else ""
            last_name = s.candidate.last_name if s.candidate and s.candidate.last_name else ""
            candidate_name = f"{first_name} {last_name}".strip() or "Unknown"
            job_title = s.job_stage.job.title if s.job_stage and s.job_stage.job else "Unknown"
            print(f"{candidate_name:<20} | {job_title:<20} | {str(s.id):<40} | {s.status:<10}")

if __name__ == "__main__":
    asyncio.run(get_ids())
