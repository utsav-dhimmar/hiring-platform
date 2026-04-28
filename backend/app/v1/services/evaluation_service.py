import json
import logging
import uuid
from typing import Any, Dict, List
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.v1.db.models.candidate_stages import CandidateStage
from app.v1.db.models.candidates import Candidate
from app.v1.db.models.jobs import Job
from app.v1.db.models.resumes import Resume
from app.v1.db.models.transcripts import Transcript
from app.v1.db.models.evaluations import Evaluation
from app.v1.db.models.criteria import Criterion
from app.v1.db.models.interviews import Interview

from app.v1.services.evaluation.engine import evaluation_engine
from app.v1.services.evaluation.agent import evaluation_agent

logger = logging.getLogger(__name__)


class EvaluationService:
    """
    Orchestrates the multi-phase candidate evaluation pipeline.
    """

    async def evaluate_candidate_stage(
        self, db: AsyncSession, candidate_stage_id: uuid.UUID
    ) -> Dict[str, Any]:
        """
        Runs the full hybrid evaluation pipeline.
        """
        from app.v1.db.models.job_stage_configs import JobStageConfig

        # 1. FETCH CONTEXT
        stmt = (
            select(CandidateStage)
            .options(
                selectinload(CandidateStage.job_stage).selectinload(JobStageConfig.job),
                selectinload(CandidateStage.candidate).selectinload(Candidate.resumes),
            )
            .where(CandidateStage.id == candidate_stage_id)
        )

        res = await db.execute(stmt)
        cs = res.scalar_one_or_none()
        if not cs:
            raise ValueError("CandidateStage not found")

        candidate = cs.candidate
        job = cs.job_stage.job

        # Load Transcript
        interview_stmt = select(Interview).where(
            Interview.candidate_id == candidate.id,
            Interview.job_id == job.id,
            Interview.stage == cs.job_stage.stage_order,
        )
        interview_res = await db.execute(interview_stmt)
        interview = interview_res.scalars().first()

        if not interview:
            # Fallback
            interview_stmt = (
                select(Interview).where(Interview.candidate_id == candidate.id).limit(1)
            )
            interview_res = await db.execute(interview_stmt)
            interview = interview_res.scalars().first()

        if not interview:
            raise ValueError("No interview found")

        transcript_stmt = select(Transcript).where(
            Transcript.interview_id == interview.id
        )
        transcript_res = await db.execute(transcript_stmt)
        transcript = transcript_res.scalar_one_or_none()
        if not transcript:
            raise ValueError("No transcript found")

        # 2. LOAD CONFIG (Criteria + Weights)
        # Check for per-candidate override first
        config_override = (
            cs.evaluation_data.get("config_override") if cs.evaluation_data else None
        )

        if config_override:
            active_criteria_configs = config_override.get("active_criteria", [])
            logger.info(
                f"Using custom criteria override for stage {candidate_stage_id}"
            )
        else:
            # Config structure in JSONB: {"active_criteria": [{"id": "...", "weight": 20}, ...]}
            config = cs.job_stage.config or {}
            active_criteria_configs = config.get("active_criteria", [])

        if not active_criteria_configs:
            # Fallback: Load all criteria linked to the template
            from app.v1.db.models.stage_template_criteria import StageTemplateCriterion

            criteria_stmt = (
                select(Criterion, StageTemplateCriterion.default_weight)
                .join(StageTemplateCriterion)
                .where(StageTemplateCriterion.template_id == cs.job_stage.template_id)
            )
            criteria_res = await db.execute(criteria_stmt)
            rows = criteria_res.all()
            active_criteria_configs = [
                {"id": str(r[0].id), "weight": float(r[1]), "obj": r[0]} for r in rows
            ]

        # 3. EMBEDDING PHASE (Signals)
        resume_obj = next(iter(candidate.resumes), None)
        resume_summary = (
            json.dumps(resume_obj.parse_summary)
            if resume_obj and resume_obj.parse_summary
            else ""
        )

        signals = await evaluation_engine.get_signals(
            jd_text=job.jd_text or "",
            resume_text=resume_summary,
            transcript_text=transcript.clean_transcript_text,
        )

        # 4. RERANKER PHASE (Evidence)
        evidence_snippets = {}
        for c_config in active_criteria_configs:
            criterion_id = c_config["id"]
            # Fetch criterion if not already in 'obj'
            criterion = c_config.get("obj")
            if not criterion:
                criterion = await db.get(Criterion, uuid.UUID(criterion_id))

            if criterion:
                snippets = await evaluation_engine.extract_evidence(
                    transcript.clean_transcript_text, criterion.prompt_text
                )
                evidence_snippets[criterion.name] = snippets

        # 5. SCORING PHASE (Rule-based)
        calculated_scores = {
            "communication_prelim": evaluation_engine.calculate_communication_penalty(
                transcript.clean_transcript_text
            ),
            "salary_info": evaluation_engine.extract_salary_expectation(
                transcript.clean_transcript_text
            ),
            "signals": signals,
        }

        # 6. LLM PHASE (Synthesis)
        final_report = await evaluation_agent.synthesize_evaluation(
            transcript_text=transcript.clean_transcript_text,
            jd_text=job.jd_text or "",
            resume_text=resume_summary,
            calculated_scores=calculated_scores,
            evidence_snippets=evidence_snippets,
        )

        # 7. STORE PHASE
        # Calculate overall score (average of criteria scores from the new 'criteria' key)
        criteria_map = final_report.get("criteria", {})
        criteria_scores = [
            v["score"]
            for v in criteria_map.values()
            if isinstance(v, dict) and "score" in v
        ]
        avg_score = (
            sum(criteria_scores) / len(criteria_scores) if criteria_scores else 0.0
        )

        # --- PASSING THRESHOLD LOGIC (3.5) ---
        is_passed = avg_score >= 3.5
        pass_fail_summary = (
            "Passed Stage 1"
            if is_passed
            else f"Failed Stage 1 (Score {avg_score:.2f} < 3.5)"
        )

        ev = Evaluation(
            candidate_stage_id=candidate_stage_id,
            transcript_id=transcript.id,
            interview_id=interview.id,
            evaluation_data=final_report,
            overall_score=avg_score,
            passing_threshold=passing_threshold,
            result=result_status,
            recommendation=final_report.get("overall_summary", ""),
            sim_jd_resume=signals["profile_fit"],
            sim_jd_transcript=signals["tech_alignment"],
            sim_resume_transcript=signals["consistency"],
            evidence_block=evidence_snippets,
        )
        db.add(ev)

        # Update candidate stage
        cs.evaluation_data = {
            "signals": signals,
            "report": final_report,
            "evidence": evidence_snippets,
            "calculated_scores": calculated_scores,
            "is_passed": is_passed,
            "threshold": 3.5,
            "pass_fail_summary": pass_fail_summary,
        }

        # Set status based on threshold
        cs.status = "completed" if is_passed else "failed"
        cs.completed_at = func.now()

        await db.commit()
        return final_report


evaluation_service = EvaluationService()
