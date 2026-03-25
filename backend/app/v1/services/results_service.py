import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.v1.db.models.candidates import Candidate
from app.v1.schemas.results import (
    ResumeScreeningResult,
    ResumeScreeningResultsResponse,
)


class ResultsService:
    async def get_resume_screening_results(
        self, db: AsyncSession, job_id: uuid.UUID
    ) -> ResumeScreeningResultsResponse:
        # Fetch candidates for the job with their latest resume
        stmt = (
            select(Candidate)
            .where(Candidate.applied_job_id == job_id)
            .options(selectinload(Candidate.resumes))
        )
        result = await db.execute(stmt)
        candidates = result.scalars().all()

        results = []
        for candidate in candidates:
            # Get latest resume
            latest_resume = (
                max(candidate.resumes, key=lambda r: r.uploaded_at)
                if candidate.resumes
                else None
            )

            resume_score = None
            pass_fail = None
            analysis = None
            if latest_resume:
                resume_score = latest_resume.resume_score
                pass_fail = latest_resume.pass_fail
                if latest_resume.parse_summary:
                    analysis = latest_resume.parse_summary.get("analysis")

            results.append(
                ResumeScreeningResult(
                    candidate_id=candidate.id,
                    first_name=candidate.first_name,
                    last_name=candidate.last_name,
                    email=candidate.email,
                    resume_score=resume_score,
                    pass_fail=pass_fail,
                    analysis=analysis,
                    applied_at=candidate.created_at,
                )
            )

        return ResumeScreeningResultsResponse(job_id=job_id, results=results)


results_service = ResultsService()
