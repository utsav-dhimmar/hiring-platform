import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.v1.db.models.candidates import Candidate
from app.v1.db.models.interviews import Interview
from app.v1.db.models.transcripts import Transcript
from app.v1.schemas.results import (
    HRRoundResult,
    HRRoundResultsResponse,
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

    async def get_hr_round_results(
        self, db: AsyncSession, job_id: uuid.UUID
    ) -> HRRoundResultsResponse:
        # Fetch interviews for the job and stage 1 (HR screening)
        stmt = (
            select(Interview)
            .where(Interview.job_id == job_id, Interview.stage == 1)
            .options(
                selectinload(Interview.candidate),
            )
        )
        result = await db.execute(stmt)
        interviews = result.scalars().all()

        results = []
        for interview in interviews:
            # Fetch transcript for this interview to get evaluation
            transcript_stmt = select(Transcript).where(
                Transcript.interview_id == interview.id
            )
            transcript_result = await db.execute(transcript_stmt)
            transcript = transcript_result.scalar_one_or_none()

            evaluation = None
            overall_score = None
            recommendation = None
            if transcript and transcript.segments:
                evaluation = transcript.segments.get("stage1_evaluation")
                if evaluation:
                    overall_score = evaluation.get("stage_score")
                    recommendation = evaluation.get("recommendation")

            results.append(
                HRRoundResult(
                    interview_id=interview.id,
                    candidate_id=interview.candidate_id,
                    first_name=interview.candidate.first_name,
                    last_name=interview.candidate.last_name,
                    email=interview.candidate.email,
                    status=interview.status,
                    overall_score=overall_score,
                    recommendation=recommendation,
                    evaluation=evaluation,
                    scheduled_at=interview.created_at,
                )
            )

        return HRRoundResultsResponse(job_id=job_id, results=results)


results_service = ResultsService()
