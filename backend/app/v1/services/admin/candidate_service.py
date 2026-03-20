import uuid
from sqlalchemy import or_, select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.v1.db.models.candidates import Candidate
from app.v1.repository.candidate_repository import candidate_repository
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
    ) -> list[CandidateResponse]:
        """Get all candidates for a specific job."""
        stmt = (
            select(Candidate)
            .where(Candidate.applied_job_id == job_id)
            .options(selectinload(Candidate.resumes))
            .offset(skip)
            .limit(limit)
        )
        result = await db.execute(stmt)
        candidates = list(result.scalars().all())
        return [self._map_candidate_to_response(c) for c in candidates]

    async def search_candidates_for_job(
        self,
        db: AsyncSession,
        job_id: uuid.UUID,
        query: str,
        skip: int = 0,
        limit: int = 100,
    ) -> list[CandidateResponse]:
        """Search candidates for a specific job."""
        candidates = await candidate_repository.search_candidates_for_job(
            db=db, job_id=job_id, query=query, skip=skip, limit=limit
        )
        return [self._map_candidate_to_response(c) for c in candidates]

    async def search_candidates(
        self,
        db: AsyncSession,
        query: str,
        skip: int = 0,
        limit: int = 100,
    ) -> list[CandidateResponse]:
        """Search candidates across all jobs."""
        search_filter = or_(
            Candidate.first_name.ilike(f"%{query}%"),
            Candidate.last_name.ilike(f"%{query}%"),
            Candidate.email.ilike(f"%{query}%"),
        )

        stmt = (
            select(Candidate)
            .where(search_filter)
            .options(selectinload(Candidate.resumes))
            .offset(skip)
            .limit(limit)
        )

        result = await db.execute(stmt)
        candidates = list(result.scalars().all())
        return [self._map_candidate_to_response(c) for c in candidates]

    def _map_candidate_to_response(
        self, candidate: Candidate
    ) -> CandidateResponse:
        """Helper to map Candidate model to CandidateResponse schema."""
        resumes = getattr(candidate, "resumes", [])
        latest_resume = (
            max(resumes, key=lambda resume: resume.uploaded_at)
            if resumes
            else None
        )

        analysis = None
        is_parsed = False
        resume_score = None
        pass_fail = None
        processing_status = None

        if latest_resume:
            is_parsed = bool(latest_resume.parsed)
            resume_score = latest_resume.resume_score
            pass_fail = latest_resume.pass_fail
            parse_summary = latest_resume.parse_summary or {}

            processing_info = parse_summary.get("processing", {})
            if isinstance(processing_info, dict):
                processing_status = processing_info.get("status")

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
            created_at=candidate.created_at,
            resume_analysis=analysis,
            resume_score=resume_score,
            pass_fail=pass_fail,
            is_parsed=is_parsed,
            processing_status=processing_status,
        )

candidate_admin_service = CandidateAdminService()
