import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.v1.db.session import get_db
from app.v1.db.models.evaluations import Evaluation
from app.v1.db.models.candidate_stages import CandidateStage
from app.v1.db.models.candidates import Candidate
from app.v1.db.models.hr_decisions import HrDecision
from app.v1.db.models.job_stage_configs import JobStageConfig
from app.v1.schemas.candidate_stages import StageOverrideCreate, StageDecisionCreate, EvaluationRead
from app.v1.schemas.user import UserRead
from app.v1.dependencies import check_permission
from app.v1.services.admin_service import admin_service

router = APIRouter(prefix="/candidate-stages", tags=["candidate-stages"])

@router.get("/{id}/evaluation")
async def get_candidate_stage_evaluation(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: UserRead = Depends(check_permission("candidates:read")),
) -> EvaluationRead:
    """Retrieve the full evaluation result for a specific candidate stage."""
    res = await db.execute(
        select(Evaluation)
        .where(Evaluation.candidate_stage_id == id)
        .order_by(Evaluation.created_at.desc())
    )
    evaluation = res.scalars().first()
    if not evaluation:
        raise HTTPException(status_code=404, detail="Evaluation not found for this candidate stage")
    return evaluation


@router.get("/{id}/similarity-scores")
async def get_candidate_stage_similarity_scores(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: UserRead = Depends(check_permission("candidates:read")),
) -> Any:
    """Get similarity metrics (JD vs Resume, JD vs Transcript, Resume vs Transcript)."""
    res = await db.execute(
        select(Evaluation)
        .where(Evaluation.candidate_stage_id == id)
        .order_by(Evaluation.created_at.desc())
    )
    evaluation = res.scalars().first()
    if not evaluation:
        raise HTTPException(status_code=404, detail="Evaluation not found")
        
    return {
        "candidate_stage_id": evaluation.candidate_stage_id,
        "similarity_scores": {
            "jd_vs_resume": evaluation.sim_jd_resume,
            "jd_vs_transcript": evaluation.sim_jd_transcript,
            "resume_vs_transcript": evaluation.sim_resume_transcript
        }
    }


@router.post("/{id}/override")
async def override_candidate_stage(
    id: uuid.UUID,
    override_in: StageOverrideCreate,
    db: AsyncSession = Depends(get_db),
    user: UserRead = Depends(check_permission("candidates:decide")),
) -> Any:
    """Override AI evaluation recommendation and/or criterion scores."""
    
    # 1. Fetch CandidateStage and Evaluation
    stage = await db.get(CandidateStage, id)
    if not stage:
        raise HTTPException(status_code=404, detail="Candidate stage not found")
        
    res = await db.execute(select(Evaluation).where(Evaluation.candidate_stage_id == id))
    evaluation = res.scalars().first()
    
    if not evaluation:
        raise HTTPException(status_code=400, detail="No evaluation found to override")
        
    # 2. Update Evaluation JSON with overrides
    eval_data = dict(evaluation.evaluation_data)
    if "overrides" not in eval_data:
        eval_data["overrides"] = []
        
    eval_data["overrides"].append({
        "user_id": str(user.id),
        "reason": override_in.override_reason,
        "recommendation": override_in.override_recommendation,
        "criterion_scores": override_in.criterion_scores
    })
    
    # If overriding specific criteria, we could recalculate overall_score here.
    # For now, we mainly override the textual recommendation in the UI logic or evaluation data.
    if override_in.override_recommendation:
        evaluation.recommendation = override_in.override_recommendation
        
    evaluation.evaluation_data = eval_data
    
    # 3. Update stage status if needed
    if stage.status == "processing":
         stage.status = "completed"
         
    await db.commit()
    
    # 4. Audit Log
    await admin_service.log_action(
        db=db,
        user_id=user.id,
        action="override_evaluation",
        target_type="evaluation",
        target_id=evaluation.id,
        details={"reason": override_in.override_reason, "stage_id": str(id)}
    )
    
    return {"message": "Override applied successfully", "evaluation_id": evaluation.id}


@router.post("/{id}/decision")
async def candidate_stage_decision(
    id: uuid.UUID,
    decision_in: StageDecisionCreate,
    db: AsyncSession = Depends(get_db),
    user: UserRead = Depends(check_permission("candidates:decide")),
) -> Any:
    """Final HR decision for this candidate stage (Approve, Reject, May Be)."""
    
    from sqlalchemy.orm import selectinload

    # 1. Fetch CandidateStage + relations
    query = (
        select(CandidateStage)
        .options(selectinload(CandidateStage.job_stage))
        .where(CandidateStage.id == id)
    )
    res = await db.execute(query)
    stage = res.scalars().first()
    
    if not stage:
        raise HTTPException(status_code=404, detail="Candidate stage not found")
        
    candidate = await db.get(Candidate, stage.candidate_id)
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
        
    # 2. Create hr_decisions entry
    hr_decision = HrDecision(
        candidate_id=candidate.id,
        stage_config_id=stage.job_stage_id,
        job_id=stage.job_stage.job_id if stage.job_stage else None,
        user_id=user.id,
        decision=decision_in.decision,
        notes=decision_in.notes
    )
    db.add(hr_decision)
    
    # 3. Update Candidate status based on decision
    if decision_in.decision == "reject":
        candidate.current_status = "rejected"
    elif decision_in.decision == "May Be":
        candidate.current_status = "may_be"
    elif decision_in.decision == "approve":
        # Check if there is a next stage in job_stages
        res_next = await db.execute(
            select(JobStageConfig)
            .where(
                JobStageConfig.job_id == stage.job_stage.job_id,
                JobStageConfig.stage_order > stage.job_stage.stage_order
            )
            .order_by(JobStageConfig.stage_order.asc())
        )
        next_stage_config = res_next.scalars().first()
        
        if next_stage_config:
            # Advance to next stage (activate existing pending, or create if missing)
            cs_stmt = (
                select(CandidateStage)
                .where(
                    CandidateStage.candidate_id == candidate.id,
                    CandidateStage.job_stage_id == next_stage_config.id
                )
            )
            cs_res = await db.execute(cs_stmt)
            # Use .first() to avoid MultipleResultsFound if duplicates were accidentally created earlier
            next_cs = cs_res.scalars().first()

            from datetime import datetime
            if next_cs:
                next_cs.status = "active"
                next_cs.started_at = datetime.utcnow()
            else:
                next_cs = CandidateStage(
                    candidate_id=candidate.id,
                    job_stage_id=next_stage_config.id,
                    status="active",
                    started_at=datetime.utcnow()
                )
                db.add(next_cs)
            
            from app.v1.db.models.stage_templates import StageTemplate
            template = await db.get(StageTemplate, next_stage_config.template_id)
            candidate.current_status = template.name if template else "next_stage"
        else:
            candidate.current_status = "hired" # Or final state
    
    stage.status = "completed"
    await db.commit()
    
    # 4. Audit Log
    await admin_service.log_action(
        db=db,
        user_id=user.id,
        action="stage_decision",
        target_type="candidate_stage",
        target_id=stage.id,
        details={"decision": decision_in.decision, "candidate_id": str(candidate.id)}
    )
    
    return {"message": f"Decision '{decision_in.decision}' recorded successfully", "candidate_status": candidate.current_status}
