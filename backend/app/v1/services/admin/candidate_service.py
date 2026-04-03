import uuid
from typing import Any

from sqlalchemy import func, or_, select, exists
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.v1.db.models.candidates import Candidate

# from app.v1.db.models.job_stage_configs import JobStageConfig
# from app.v1.db.models.hr_decisions import HrDecision
from app.v1.schemas.job_stage import StageEvaluationRead
from app.v1.schemas.upload import CandidateResponse, ResumeMatchAnalysis
from app.v1.schemas.response import PaginatedData


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
        hr_decision: str | None = None,
        jd_version: int | None = None,
    ) -> PaginatedData[CandidateResponse]:
        """Get all candidates for a specific job."""

        # Build base query with optional HR decision filter
        job_filter = Candidate.applied_job_id == job_id

        # Subquery for total count before limit/offset
        total_stmt = select(func.count()).select_from(Candidate).where(job_filter)

        # Base query for data
        stmt = select(Candidate).where(job_filter)

        # Apply filters
        if hr_decision:
            # Subquery to find the latest decision for each candidate
            latest_decision_subq = (
                select(HrDecision.decision)
                .where(HrDecision.candidate_id == Candidate.id)
                .order_by(HrDecision.decided_at.desc())
                .limit(1)
                .scalar_subquery()
            )
            stmt = stmt.where(latest_decision_subq == hr_decision)
            total_stmt = total_stmt.where(latest_decision_subq == hr_decision)

        if jd_version is not None:
            stmt = stmt.where(Candidate.applied_version_number == jd_version)
            total_stmt = total_stmt.where(
                Candidate.applied_version_number == jd_version
            )

        total = await db.scalar(total_stmt)

        # Final query with eager loading, sorting, and paging
        stmt = (
            stmt.options(
                selectinload(Candidate.resumes), selectinload(Candidate.hr_decisions)
            )
            .order_by(Candidate.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        result = await db.execute(stmt)
        candidates = list(result.scalars().all())

        return PaginatedData[CandidateResponse](
            data=[self._map_candidate_to_response(c) for c in candidates],
            total=total or 0,
        )

    async def search_candidates_for_job(
        self,
        db: AsyncSession,
        job_id: uuid.UUID,
        query: str | None = None,
        skip: int = 0,
        limit: int = 100,
    ) -> PaginatedData[CandidateResponse]:
        """Search candidates for a specific job."""

        job_filter = Candidate.applied_job_id == job_id

        # Data and count queries
        stmt = select(Candidate).where(job_filter)
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

        # Apply paging and ordering to the same statement object
        stmt = (
            stmt.options(
                selectinload(Candidate.resumes), selectinload(Candidate.hr_decisions)
            )
            .order_by(Candidate.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        result = await db.execute(stmt)
        candidates = list(result.scalars().all())

        return PaginatedData[CandidateResponse](
            data=[self._map_candidate_to_response(c) for c in candidates],
            total=total or 0,
        )

    async def search_candidates(
        self,
        db: AsyncSession,
        query: str | None = None,
        skip: int = 0,
        limit: int = 100,
    ) -> PaginatedData[CandidateResponse]:
        """Search candidates across all jobs."""

        # Data and count queries
        stmt = select(Candidate)
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

        # Apply paging and ordering to the same statement object
        stmt = (
            stmt.options(
                selectinload(Candidate.resumes), selectinload(Candidate.hr_decisions)
            )
            .order_by(Candidate.created_at.desc())
            .offset(skip)
            .limit(limit)
        )

        result = await db.execute(stmt)
        candidates = list(result.scalars().all())

        return PaginatedData[CandidateResponse](
            data=[self._map_candidate_to_response(c) for c in candidates],
            total=total or 0,
        )

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
        location = None
        linkedin_url = None
        github_url = None

        search_sources = []
        if candidate.info and isinstance(candidate.info, dict):
            search_sources.append(candidate.info)

        if latest_resume:
            if latest_resume.parse_summary:
                search_sources.append(latest_resume.parse_summary)
                if "extracted_data" in latest_resume.parse_summary:
                    search_sources.append(latest_resume.parse_summary["extracted_data"])

            for source in search_sources:
                if not isinstance(source, dict):
                    continue

                if not location:
                    loc_val = source.get("location")
                    if isinstance(loc_val, str) and loc_val.strip().lower() not in (
                        "not mentioned",
                        "null",
                        "none",
                    ):
                        location = loc_val.strip()
                    elif isinstance(loc_val, list) and loc_val:
                        for entry in loc_val:
                            loc_text = ""
                            if isinstance(entry, dict):
                                loc_text = (
                                    entry.get("text") or entry.get("location") or ""
                                )
                            else:
                                loc_text = str(entry)

                            if loc_text and loc_text.strip().lower() not in (
                                "not mentioned",
                                "null",
                                "none",
                            ):
                                location = loc_text.strip()
                                break

                links = source.get("links") or source.get("social_links")
                if links:
                    if isinstance(links, str):
                        link_list = [l.strip() for l in links.split(",") if l.strip()]
                    elif isinstance(links, list):
                        link_list = links
                    else:
                        link_list = []

                    for link_item in link_list:
                        url = ""
                        if isinstance(link_item, dict):
                            url = link_item.get("url") or link_item.get("text") or ""
                        elif isinstance(link_item, str):
                            url = link_item

                        if not url or not isinstance(url, str):
                            continue

                        url_lower = url.lower()
                        if "linkedin.com" in url_lower and not linkedin_url:
                            linkedin_url = url
                        elif "github.com" in url_lower and not github_url:
                            github_url = url

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

        # Get latest HR decision
        hr_decisions = getattr(candidate, "hr_decisions", [])
        latest_decision = (
            max(hr_decisions, key=lambda d: d.decided_at) if hr_decisions else None
        )

        return CandidateResponse(
            id=candidate.id,
            first_name=candidate.first_name,
            last_name=candidate.last_name,
            email=candidate.email,
            phone=candidate.phone,
            location=location,
            linkedin_url=linkedin_url,
            github_url=github_url,
            current_status=candidate.current_status,
            applied_job_id=candidate.applied_job_id,
            applied_version_number=candidate.applied_version_number,
            resume_id=latest_resume.id if latest_resume else None,
            created_at=candidate.created_at,
            resume_analysis=analysis,
            resume_score=resume_score,
            pass_fail=pass_fail,
            is_parsed=is_parsed,
            processing_status=processing_status,
            processing_error=processing_error,
            hr_decision=latest_decision.decision if latest_decision else None,
        )


candidate_admin_service = CandidateAdminService()
