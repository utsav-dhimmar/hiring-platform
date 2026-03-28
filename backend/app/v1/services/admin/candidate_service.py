import uuid
from typing import Any

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.v1.db.models.candidates import Candidate
from app.v1.db.models.job_stage_configs import JobStageConfig
from app.v1.schemas.job_stage import StageEvaluationRead
from app.v1.schemas.upload import CandidateResponse, ResumeMatchAnalysis


class CandidateAdminService:
    """
    Service for admin-level candidate management operations.
    """

    async def get_candidates_for_job(
        self,
        db: AsyncSession,
        job_id: uuid.UUID,
        skip: int = 0,
        limit: int = 100,
    ) -> dict[str, Any]:
        """Get all candidates for a specific job."""

        total_stmt = (
            select(func.count())
            .select_from(Candidate)
            .where(Candidate.applied_job_id == job_id)
        )
        total = await db.scalar(total_stmt)

        stmt = (
            select(Candidate)
            .where(Candidate.applied_job_id == job_id)
            .options(selectinload(Candidate.resumes))
            .offset(skip)
            .limit(limit)
        )
        result = await db.execute(stmt)
        candidates = list(result.scalars().all())
        return {
            "data": [self._map_candidate_to_response(c) for c in candidates],
            "total": total or 0,
        }

    async def search_candidates_for_job(
        self,
        db: AsyncSession,
        job_id: uuid.UUID,
        query: str | None = None,
        skip: int = 0,
        limit: int = 100,
    ) -> dict[str, Any]:
        """Search candidates for a specific job."""

        job_filter = Candidate.applied_job_id == job_id

        stmt = (
            select(Candidate).where(job_filter).options(selectinload(Candidate.resumes))
        )
        total_stmt = select(func.count()).select_from(Candidate).where(job_filter)

        if query:
            search_filter = or_(
                Candidate.first_name.ilike(f"%{query}%"),
                Candidate.last_name.ilike(f"%{query}%"),
                Candidate.email.ilike(f"%{query}%"),
            )
            stmt = stmt.where(search_filter)
            total_stmt = total_stmt.where(search_filter)

        total = await db.scalar(total_stmt)

        stmt = stmt.offset(skip).limit(limit)
        result = await db.execute(stmt)
        candidates = list(result.scalars().all())

        return {
            "data": [self._map_candidate_to_response(c) for c in candidates],
            "total": total or 0,
        }

    async def search_candidates(
        self,
        db: AsyncSession,
        query: str | None = None,
        skip: int = 0,
        limit: int = 100,
    ) -> dict[str, Any]:
        """Search candidates across all jobs."""

        stmt = select(Candidate).options(selectinload(Candidate.resumes))
        total_stmt = select(func.count()).select_from(Candidate)

        if query:
            search_filter = or_(
                Candidate.first_name.ilike(f"%{query}%"),
                Candidate.last_name.ilike(f"%{query}%"),
                Candidate.email.ilike(f"%{query}%"),
            )
            stmt = stmt.where(search_filter)
            total_stmt = total_stmt.where(search_filter)

        total = await db.scalar(total_stmt)

        stmt = stmt.offset(skip).limit(limit)
        result = await db.execute(stmt)
        candidates = list(result.scalars().all())

        return {
            "data": [self._map_candidate_to_response(c) for c in candidates],
            "total": total or 0,
        }

    def _map_candidate_to_response(self, candidate: Candidate) -> CandidateResponse:
        """Helper to map Candidate model to CandidateResponse schema."""
        resumes = getattr(candidate, "resumes", [])
        latest_resume = (
            max(resumes, key=lambda resume: resume.uploaded_at) if resumes else None
        )

        analysis = None
        is_parsed = False
        resume_score = None
        pass_fail = None
        processing_status = None
        processing_error = None

        if latest_resume:
            is_parsed = bool(latest_resume.parsed)
            resume_score = latest_resume.resume_score
            pass_fail = latest_resume.pass_fail
            parse_summary = latest_resume.parse_summary or {}

            processing_info = parse_summary.get("processing", {})
            if isinstance(processing_info, dict):
                processing_status = processing_info.get("status")
                processing_error = processing_info.get("error")

            analysis_payload = parse_summary.get("analysis")
            if isinstance(analysis_payload, dict):
                analysis = ResumeMatchAnalysis.model_validate(analysis_payload)

        return CandidateResponse(
            id=candidate.id,
            first_name=candidate.first_name,
            last_name=candidate.last_name,
            email=candidate.email,
            phone=candidate.phone,
            current_status=candidate.current_status,
            applied_job_id=candidate.applied_job_id,
            created_at=candidate.created_at,
            resume_analysis=analysis,
            resume_score=resume_score,
            pass_fail=pass_fail,
            is_parsed=is_parsed,
            processing_status=processing_status,
            processing_error=processing_error,
        )


candidate_admin_service = CandidateAdminService()
