"""
Auth API router module.

This module aggregates all auth-related sub-routers and provides
the main authentication router for the application.
"""

from fastapi import APIRouter

from packages.auth.v1.api.routes.users import router as users_router

router = APIRouter()
router.include_router(users_router, prefix="/users", tags=["users"])
