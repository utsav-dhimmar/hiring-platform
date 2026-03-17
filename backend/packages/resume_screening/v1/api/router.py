from fastapi import APIRouter

from packages.resume_screening.v1.api.routes.resume_upload import (
    router as resume_upload_router,
)

router = APIRouter()
router.include_router(resume_upload_router, tags=["resume-screening"])
