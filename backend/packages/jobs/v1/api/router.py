from fastapi import APIRouter
from packages.jobs.v1.api.routes.jobs import router as jobs_router

router = APIRouter()
router.include_router(jobs_router, prefix="/jobs", tags=["jobs"])
