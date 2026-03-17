import uuid

from fastapi import APIRouter, Depends, File as FastAPIFile, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.v1.db.session import get_db
from packages.auth.v1.dependencies import get_current_user
from packages.auth.v1.schema.user import UserRead
from packages.resume_screening.v1.schemas.upload import (
    ResumeStatusResponse,
    ResumeUploadResponse,
)
from packages.resume_screening.v1.services.resume_upload_service import (
    resume_upload_service,
)

router = APIRouter()


@router.post(
    "/jobs/{job_id}/resume",
    response_model=ResumeUploadResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
async def upload_resume_for_job(
    job_id: uuid.UUID,
    resume: UploadFile = FastAPIFile(...),
    db: AsyncSession = Depends(get_db),
    current_user: UserRead = Depends(get_current_user),
) -> ResumeUploadResponse:
    return await resume_upload_service.upload_resume_for_job(
        db=db,
        job_id=job_id,
        resume=resume,
        current_user=current_user,
    )


@router.get(
    "/jobs/{job_id}/resume/{resume_id}",
    response_model=ResumeStatusResponse,
    status_code=status.HTTP_200_OK,
)
async def get_resume_status(
    job_id: uuid.UUID,
    resume_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: UserRead = Depends(get_current_user),
) -> ResumeStatusResponse:
    return await resume_upload_service.get_resume_status(
        db=db,
        job_id=job_id,
        resume_id=resume_id,
        current_user=current_user,
    )
