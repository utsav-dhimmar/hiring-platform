import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.v1.db.session import get_db
from app.v1.dependencies.auth import get_current_user
from app.v1.schemas.results import (
    ResumeScreeningResultsResponse,
)
from app.v1.schemas.user import UserRead
from app.v1.services.results_service import results_service

router = APIRouter()


@router.get(
    "/{job_id}/results/resume-screening",
    response_model=ResumeScreeningResultsResponse,
    status_code=status.HTTP_200_OK,
    summary="Get resume screening results for a job",
)
async def get_resume_screening_results(
    job_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: UserRead = Depends(get_current_user),
) -> ResumeScreeningResultsResponse:
    return await results_service.get_resume_screening_results(
        db=db, job_id=job_id
    )
