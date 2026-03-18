"""
API v1 router module.

This module aggregates all API v1 sub-routers and provides
the main API router for the application.
"""

from fastapi import APIRouter

from packages.auth.v1.api.router import router as auth_router
from packages.jobs.v1.api.router import router as jobs_router
from packages.resume_screening.v1.api.router import (
    router as resume_screening_router,
)

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(resume_screening_router)
api_router.include_router(jobs_router)
