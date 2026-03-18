"""
Resume upload routes module.

This module defines the API endpoints for uploading resumes, checking status,
and retrieving candidate/resume lists for specific jobs.
"""

import uuid

from fastapi import APIRouter, Depends, UploadFile, status
from fastapi import File as FastAPIFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.v1.db.session import get_db
from app.v1.dependencies.dependencies import get_current_user
from app.v1.schemas.upload import (
    JobCandidatesResponse,
    JobResumesResponse,
    ResumeStatusResponse,
    ResumeUploadResponse,
)
from app.v1.schemas.user import UserRead
from app.v1.services.resume_upload_service import (
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
    """Upload a resume for a specific job.

    This endpoint accepts a resume file, saves it to disk, and initiates
    asynchronous processing to extract information and analyze it.

    Args:
        job_id: The UUID of the job the resume is for.
        resume: The uploaded resume file.
        db: The async database session.
        current_user: The authenticated user performing the upload.

    Returns:
        A response indicating the upload was successful and processing has started.
    """
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
    """Retrieve the status and analysis results for a specific resume.

    Args:
        job_id: The UUID of the job.
        resume_id: The UUID of the resume.
        db: The async database session.
        current_user: The authenticated user.

    Returns:
        The current processing status and analysis of the resume.
    """
    return await resume_upload_service.get_resume_status(
        db=db,
        job_id=job_id,
        resume_id=resume_id,
        current_user=current_user,
    )


@router.get(
    "/jobs/{job_id}/candidates",
    response_model=JobCandidatesResponse,
    status_code=status.HTTP_200_OK,
)
async def get_job_candidates(
    job_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: UserRead = Depends(get_current_user),
) -> JobCandidatesResponse:
    """Get all candidates associated with a specific job.

    Args:
        job_id: The UUID of the job.
        db: The async database session.
        current_user: The authenticated user.

    Returns:
        A list of candidates who have applied for the job.
    """
    return await resume_upload_service.get_candidates_for_job(
        db=db,
        job_id=job_id,
    )


@router.get(
    "/jobs/{job_id}",
    response_model=JobResumesResponse,
    status_code=status.HTTP_200_OK,
)
async def get_job_resumes(
    job_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: UserRead = Depends(get_current_user),
) -> JobResumesResponse:
    """Get all resume records associated with a specific job.

    Args:
        job_id: The UUID of the job.
        db: The async database session.
        current_user: The authenticated user.

    Returns:
        A list of resumes that have been uploaded for the job.
    """
    return await resume_upload_service.get_resumes_for_job(
        db=db,
        job_id=job_id,
    )
