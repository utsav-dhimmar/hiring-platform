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
        query: str,
        skip: int = 0,
        limit: int = 100,
    ) -> dict[str, Any]:
        """Search candidates for a specific job."""

        search_filter = or_(
            Candidate.first_name.ilike(f"%{query}%"),
            Candidate.last_name.ilike(f"%{query}%"),
            Candidate.email.ilike(f"%{query}%"),
        )
        job_filter = Candidate.applied_job_id == job_id

        total_stmt = (
            select(func.count())
            .select_from(Candidate)
            .where(search_filter, job_filter)
        )
        total = await db.scalar(total_stmt)

        stmt = (
            select(Candidate)
            .where(search_filter, job_filter)
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

    async def search_candidates(
        self,
        db: AsyncSession,
        query: str,
        skip: int = 0,
        limit: int = 100,
    ) -> dict[str, Any]:
        """Search candidates across all jobs."""

        search_filter = or_(
            Candidate.first_name.ilike(f"%{query}%"),
            Candidate.last_name.ilike(f"%{query}%"),
            Candidate.email.ilike(f"%{query}%"),
        )

        total_stmt = (
            select(func.count()).select_from(Candidate).where(search_filter)
        )
        total = await db.scalar(total_stmt)

        stmt = (
            select(Candidate)
            .where(search_filter)
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

    async def get_candidate_evaluations(
        self,
        db: AsyncSession,
        candidate_id: uuid.UUID,
    ) -> list[StageEvaluationRead]:
        """
        Get all interview stage evaluations for a specific candidate.
        Derives evaluations from transcripts and hr_decisions.
        """

        # Get all job stage configs for the job this candidate applied for
        candidate_stmt = select(Candidate).where(Candidate.id == candidate_id)
        candidate_res = await db.execute(candidate_stmt)
        candidate = candidate_res.scalar_one_or_none()
        if not candidate:
            return []

        stages_stmt = select(JobStageConfig).where(
            JobStageConfig.job_id == candidate.applied_job_id
        )
        stages_res = await db.execute(stages_stmt)
        stages = stages_res.scalars().all()

        evaluations = []
        for stage in stages:
            eval_data = await self.get_candidate_stage_evaluation(
                db, candidate_id, stage.id
            )
            if eval_data:
                evaluations.append(eval_data)

        return evaluations

    async def get_candidate_stage_evaluation(
        self,
        db: AsyncSession,
        candidate_id: uuid.UUID,
        stage_config_id: uuid.UUID,
    ) -> StageEvaluationRead | None:
        """
        Get a specific interview stage evaluation for a candidate.
        """
        from app.v1.db.models.hr_decisions import HrDecision
        from app.v1.db.models.interviews import Interview
        from app.v1.db.models.job_stage_configs import JobStageConfig
        from app.v1.db.models.transcripts import Transcript

        # 1. Get the stage config to know the stage number
        stage_stmt = select(JobStageConfig).where(
            JobStageConfig.id == stage_config_id
        )
        stage_res = await db.execute(stage_stmt)
        stage_config = stage_res.scalar_one_or_none()
        if not stage_config:
            return None

        # 2. Find interview for this candidate and stage
        # We use stage_order as the stage number in Interview model (1-based)
        interview_stmt = select(Interview).where(
            Interview.candidate_id == candidate_id,
            Interview.stage == stage_config.stage_order,
        )
        interview_res = await db.execute(interview_stmt)
        interview = interview_res.scalar_one_or_none()

        status = "pending"
        analysis = None
        decision = None
        completed_at = None
        created_at = stage_config.created_at  # Fallback

        if interview:
            created_at = interview.created_at
            # 3. Get transcript evaluation if any
            transcript_stmt = select(Transcript).where(
                Transcript.interview_id == interview.id
            )
            transcript_res = await db.execute(transcript_stmt)
            transcript = transcript_res.scalar_one_or_none()

            if transcript and transcript.segments:
                analysis = transcript.segments.get("stage1_evaluation")
                if analysis:
                    status = "completed"
                    completed_at = transcript.generated_at

            # 4. Get HR decision if any
            decision_stmt = select(HrDecision).where(
                HrDecision.candidate_id == candidate_id,
                HrDecision.stage_config_id == stage_config_id,
            )
            decision_res = await db.execute(decision_stmt)
            hr_decision = decision_res.scalar_one_or_none()
            if hr_decision:
                decision = hr_decision.decision == "proceed"
            elif interview.status == "completed":
                decision = True
            elif interview.status == "rejected":
                decision = False

        return StageEvaluationRead(
            id=uuid.uuid4(),  # Mock ID for evaluation record itself
            candidate_id=candidate_id,
            job_stage_config_id=stage_config_id,
            status=status,
            analysis=analysis,
            decision=decision,
            created_at=created_at,
            completed_at=completed_at,
        )

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
            created_at=candidate.created_at,
            resume_analysis=analysis,
            resume_score=resume_score,
            pass_fail=pass_fail,
            is_parsed=is_parsed,
            processing_status=processing_status,
            processing_error=processing_error,
        )


candidate_admin_service = CandidateAdminService()
