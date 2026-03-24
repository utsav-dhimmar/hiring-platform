"""
API v1 router module.

This module aggregates all API v1 sub-routers and provides
the main API router for the application.
"""

from fastapi import APIRouter

from app.v1.routes.admin import router as admin_router
from app.v1.routes.candidates import router as candidates_router
from app.v1.routes.health import router as health_router
from app.v1.routes.interviews import router as interviews_router 
from app.v1.routes.departments import router as departments_router
from app.v1.routes.jobs import router as jobs_router
from app.v1.routes.resume_upload import router as resume_screening_router
from app.v1.routes.results import router as results_router
from app.v1.routes.skills import router as skills_router
from app.v1.routes.stage1 import router as stage1_router
from app.v1.routes.transcript import router as transcript_router
from app.v1.routes.users import router as auth_router

api_router = APIRouter()

api_router.include_router(health_router)
api_router.include_router(auth_router, prefix="/users", tags=["users"])
api_router.include_router(resume_screening_router, tags=["resume-screening"])
api_router.include_router(jobs_router, prefix="/jobs", tags=["jobs"])
api_router.include_router(results_router, prefix="/jobs", tags=["results"])
api_router.include_router(skills_router, prefix="/skills", tags=["skills"])
api_router.include_router(departments_router, prefix="/departments", tags=["departments"])
api_router.include_router(candidates_router, prefix="/candidates", tags=["candidates"])
api_router.include_router(admin_router, prefix="/admin", tags=["admin"])
api_router.include_router(transcript_router, tags=["transcripts"])
api_router.include_router(interviews_router, tags=["interviews"])
api_router.include_router(stage1_router, tags=["stage-1-evaluation"])