import json
import logging
import uuid
from typing import Any, Dict, List
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from datetime import datetime

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
            logger.info(f"Fallback: Found {len(rows)} criteria for template {cs.job_stage.template_id}")
            active_criteria_configs = [
                {"id": str(r[0].id), "weight": float(r[1]), "obj": r[0]} for r in rows
            ]
        
        logger.info(f"Final active_criteria_configs: {[c.get('id') for c in active_criteria_configs]}")

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

        logger.info(f"Active criteria count: {len(active_criteria_configs)}")
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
        
        logger.info(f"Evidence snippets extracted for {len(evidence_snippets)} criteria")

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
        criteria_names = [config.get("obj").name for config in active_criteria_configs if config.get("obj")]
        logger.info(f"Invoking LLM for synthesis. Criteria: {criteria_names}")
        final_report = await evaluation_agent.synthesize_evaluation(
            transcript_text=transcript.clean_transcript_text,
            jd_text=job.jd_text or "",
            resume_text=resume_summary,
            calculated_scores=calculated_scores,
            evidence_snippets=evidence_snippets,
            criteria_names=criteria_names,
        )

        # 7. RESTRUCTURE AND STORE PHASE
        criteria_map = final_report.get("criteria", {})
        
        # Merge evidence into evaluation_data
        structured_evaluation_data = {}
        for key, details in criteria_map.items():
            if not isinstance(details, dict):
                continue
            
            # Match criterion name back to evidence_snippets
            criterion_name_match = None
            for crit_name in evidence_snippets.keys():
                if crit_name.lower().replace(" ", "_") == key:
                    criterion_name_match = crit_name
                    break
            
            structured_evaluation_data[key] = {
                "score": details.get("score", 0),
                "reasoning": details.get("reasoning", ""),
                "confidence": details.get("confidence", 0.0),
                "evidence": evidence_snippets.get(criterion_name_match, []) if criterion_name_match else []
            }

        # Calculate overall score
        criteria_scores = [v["score"] for v in structured_evaluation_data.values()]
        avg_score = sum(criteria_scores) / len(criteria_scores) if criteria_scores else 0.0

        # Pass/Fail Logic
        is_passed = avg_score >= 3.5
        result_status = "pass" if is_passed else "fail"
        
        # Prepare highlights
        highlights = {
            "strengths": final_report.get("strengths", []),
            "weaknesses": final_report.get("weaknesses", []),
            "suggested_followups": final_report.get("suggested_followups", []),
            "overall_summary": final_report.get("overall_summary", ""),
            "recommendation": f"{result_status.upper()} - {final_report.get('recommendation', final_report.get('overall_summary', ''))}"
        }

        # Save to DB
        ev = Evaluation(
            candidate_stage_id=candidate_stage_id,
            transcript_id=transcript.id,
            interview_id=interview.id,
            evaluation_data=structured_evaluation_data,
            overall_score=avg_score,
            passing_threshold=3.5,
            result=result_status,
            recommendation=json.dumps(highlights),
            sim_jd_resume=signals["profile_fit"],
            sim_jd_transcript=signals["tech_alignment"],
            sim_resume_transcript=signals["consistency"],
            evidence_block=evidence_snippets,
        )
        db.add(ev)

        # Update candidate stage
        cs.evaluation_data = {
            "signals": signals,
            "report": structured_evaluation_data,
            "highlights": highlights,
            "evidence": evidence_snippets,
            "calculated_scores": calculated_scores,
            "is_passed": is_passed,
            "threshold": 3.5,
        }

        # Set status based on threshold
        cs.status = "completed" if is_passed else "failed"
        cs.completed_at = func.now()

        await db.commit()

        # Construct final response object matching user format
        response_obj = {
            "id": str(ev.id),
            "interview_id": str(ev.interview_id),
            "transcript_id": str(ev.transcript_id),
            "candidate_stage_id": str(ev.candidate_stage_id),
            "overall_score": avg_score,
            "result": result_status,
            "evaluation_data": structured_evaluation_data,
            "sim_jd_resume": signals["profile_fit"],
            "sim_jd_transcript": signals["tech_alignment"],
            "sim_resume_transcript": signals["consistency"],
            "created_at": ev.created_at.isoformat() if ev.created_at else datetime.now().isoformat(),
            "highlights": highlights
        }
        
        return response_obj


evaluation_service = EvaluationService()
