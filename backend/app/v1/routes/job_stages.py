"""
Job Stage Config Routes.

Endpoints to GET and PUT the criteria configuration for a specific job stage.
Weights are automatically calculated as equal splits across active criteria.
"""

import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select, and_, func, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.v1.db.models.evaluations import Evaluation
from app.v1.db.models.candidate_stages import CandidateStage
from app.v1.db.models.candidates import Candidate
from app.v1.db.models.criteria import Criterion
from app.v1.db.models.job_stage_configs import JobStageConfig
from app.v1.db.models.stage_template_criteria import StageTemplateCriterion
from app.v1.db.session import get_db
from app.v1.dependencies import check_permission
from app.v1.schemas.criteria import StageCriterionRead
from app.v1.schemas.user import UserRead

router = APIRouter(prefix="/job-stages", tags=["job-stages"])


# ── Schemas ──────────────────────────────────────────────────────────────────

class StageConfigRead(BaseModel):
    """Full config response for a job stage."""
    job_stage_id: uuid.UUID
    template_id: uuid.UUID
    active_criteria: list[StageCriterionRead]
    system_prompt_override: str | None = None

    class Config:
        from_attributes = True


class StageConfigUpdate(BaseModel):
    """Payload to update a job stage config.

    Provide the list of criterion IDs to mark as active.
    Weights are auto-calculated as equal splits (1 / n_active).
    Optionally provide a custom system prompt override for the AI evaluator.
    """
    active_criteria_ids: list[uuid.UUID]
    system_prompt_override: str | None = None


# ── Helpers ───────────────────────────────────────────────────────────────────

async def _get_stage_or_404(db: AsyncSession, job_stage_id: uuid.UUID) -> JobStageConfig:
    stage = await db.get(JobStageConfig, job_stage_id)
    if not stage:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job stage not found")
    return stage


async def _fetch_template_criteria(
    db: AsyncSession, template_id: uuid.UUID, active_ids: set[uuid.UUID]
) -> list[StageCriterionRead]:
    """Return all criteria for the template, marking the active ones and setting equal weights."""
    result = await db.execute(
        select(Criterion, StageTemplateCriterion.default_weight, StageTemplateCriterion.is_active)
        .join(StageTemplateCriterion, StageTemplateCriterion.criterion_id == Criterion.id)
        .where(StageTemplateCriterion.template_id == template_id)
        .order_by(Criterion.name)
    )
    rows = result.all()

    n_active = len(active_ids) if active_ids else 1
    equal_weight = round(1.0 / n_active, 4)

    return [
        StageCriterionRead(
            id=row[0].id,
            name=row[0].name,
            description=row[0].description,
            prompt_text=row[0].prompt_text,
            weight=equal_weight if row[0].id in active_ids else 0.0,
            is_active=row[0].id in active_ids,
        )
        for row in rows
    ]


# ── Routes ────────────────────────────────────────────────────────────────────

@router.get("/{job_stage_id}/config", response_model=StageConfigRead)
async def get_stage_config(
    job_stage_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: UserRead = Depends(check_permission("jobs:access")),
) -> Any:
    """
    Load the current criteria configuration for a job stage.

    Returns all template criteria with their active/inactive status and
    equal weights for the currently active set.
    """
    stage = await _get_stage_or_404(db, job_stage_id)

    # Read saved active_criteria from config JSONB (if any)
    config = stage.config or {}
    saved_active = config.get("active_criteria", [])
    active_ids = {uuid.UUID(c["id"]) for c in saved_active if c.get("is_active", True)}

    # If no config saved yet, default to all template criteria as active
    if not saved_active:
        result = await db.execute(
            select(StageTemplateCriterion.criterion_id)
            .where(
                and_(
                    StageTemplateCriterion.template_id == stage.template_id,
                    StageTemplateCriterion.is_active == True,
                )
            )
        )
        active_ids = {row[0] for row in result.all()}

    criteria = await _fetch_template_criteria(db, stage.template_id, active_ids)

    return StageConfigRead(
        job_stage_id=stage.id,
        template_id=stage.template_id,
        active_criteria=criteria,
        system_prompt_override=config.get("system_prompt_override"),
    )


@router.put("/{job_stage_id}/config", response_model=StageConfigRead)
async def update_stage_config(
    job_stage_id: uuid.UUID,
    config_in: StageConfigUpdate,
    db: AsyncSession = Depends(get_db),
    user: UserRead = Depends(check_permission("jobs:manage")),
) -> Any:
    """
    Save the criteria configuration for a job stage.

    - Pass the list of criterion IDs you want active.
    - Weights are auto-distributed equally across active criteria.
    - Minimum 2 active criteria required.
    - Optionally pass a system_prompt_override for the AI evaluator.
    """
    stage = await _get_stage_or_404(db, job_stage_id)

    active_ids = set(config_in.active_criteria_ids)

    # Validation: at least 2 criteria must be active
    if len(active_ids) < 2:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="At least 2 criteria must be active for a valid evaluation.",
        )

    # Equal weight per active criterion
    equal_weight = round(1.0 / len(active_ids), 4)

    # Build config payload to store in JSONB
    new_config = {
        **(stage.config or {}),
        "active_criteria": [
            {"id": str(cid), "weight": equal_weight, "is_active": True}
            for cid in active_ids
        ],
        "system_prompt_override": config_in.system_prompt_override,
    }

    stage.config = new_config
    db.add(stage)
    await db.commit()
    await db.refresh(stage)

    criteria = await _fetch_template_criteria(db, stage.template_id, active_ids)

    return StageConfigRead(
        job_stage_id=stage.id,
        template_id=stage.template_id,
        active_criteria=criteria,
        system_prompt_override=config_in.system_prompt_override,
    )


@router.get("/{job_stage_id}/candidate-results")
async def get_stage_candidate_results(
    job_stage_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: UserRead = Depends(check_permission("candidates:read")),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """Get a paginated list of evaluation results for all candidates in this job stage."""
    
    # Verify stage exists
    stage = await _get_stage_or_404(db, job_stage_id)
    
    # Query candidates who are in a stage with the SAME TEMPLATE or SAME NAME for this job
    # This prevents candidates from disappearing if the rounds were re-added or re-ordered.
    query = (
        select(CandidateStage, Candidate, Evaluation)
        .join(Candidate, Candidate.id == CandidateStage.candidate_id)
        .join(JobStageConfig, JobStageConfig.id == CandidateStage.job_stage_id)
        .outerjoin(Evaluation, Evaluation.candidate_stage_id == CandidateStage.id)
        .where(
            and_(
                JobStageConfig.job_id == stage.job_id,
                or_(
                    JobStageConfig.template_id == stage.template_id,
                    # Fallback for manual rounds with same name
                    JobStageConfig.id == job_stage_id 
                )
            )
        )
        .order_by(CandidateStage.started_at.desc())
        .offset(skip)
        .limit(limit)
    )
    
    result = await db.execute(query)
    rows = result.all()
    
    results = []
    for cs, candidate, eval_record in rows:
        results.append({
            "candidate_id": candidate.id,
            "candidate_name": f"{candidate.first_name} {candidate.last_name}",
            "candidate_stage_id": cs.id,
            "evaluation_id": eval_record.id if eval_record else None,
            "overall_score": float(eval_record.overall_score) if eval_record and eval_record.overall_score else None,
            "recommendation": eval_record.recommendation if eval_record else None,
            "evaluation_data": eval_record.evaluation_data if eval_record else None,
            "status": cs.status,
            "created_at": cs.started_at
        })
        
    return {
        "job_stage_id": job_stage_id,
        "total": len(results),
        "results": results
    }
