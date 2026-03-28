import uuid
from typing import Any, Optional

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.v1.db.session import get_db
from app.v1.dependencies import check_permission
from app.v1.repository.resume_screening_repository import resume_screening_repository
from app.v1.schemas.resume_screening_decision import (
    ResumeScreeningDecisionCreate,
    ResumeScreeningDecisionRead,
)
from app.v1.schemas.user import UserRead

router = APIRouter()


@router.post("/decision", response_model=ResumeScreeningDecisionRead)
async def create_screening_decision(
    decision_in: ResumeScreeningDecisionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: UserRead = Depends(check_permission("candidates:access")),
) -> Any:
    """Submit or update an HR decision for resume screening."""
    return await resume_screening_repository.create_or_update(
        db=db,
        candidate_id=decision_in.candidate_id,
        user_id=current_user.id,
        decision=decision_in.decision,
        note=decision_in.note,
    )


@router.get("/candidate/{candidate_id}", response_model=Optional[ResumeScreeningDecisionRead])
async def get_screening_decision(
    candidate_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: UserRead = Depends(check_permission("candidates:access")),
) -> Any:
    """Get the screening decision for a specific candidate."""
    return await resume_screening_repository.get_by_candidate_id(db, candidate_id)
