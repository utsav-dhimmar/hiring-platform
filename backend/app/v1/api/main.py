"""
API v1 router module.

This module aggregates all API v1 sub-routers and provides
the main API router for the application.
"""

from fastapi import APIRouter

from app.v1.routes.admin import router as admin_router
from app.v1.routes.jobs import router as jobs_router
from app.v1.routes.resume_upload import router as resume_screening_router
from app.v1.routes.users import router as auth_router

api_router = APIRouter()

api_router.include_router(auth_router, prefix="/users", tags=["users"])
api_router.include_router(resume_screening_router, tags=["resume-screening"])
api_router.include_router(jobs_router, prefix="/jobs", tags=["jobs"])
api_router.include_router(admin_router, prefix="/admin", tags=["admin"])
