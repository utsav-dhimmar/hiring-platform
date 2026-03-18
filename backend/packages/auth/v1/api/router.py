"""
Main router for authentication and user management.

Combines sub-routers for various auth-related entities like users.
"""
from fastapi import APIRouter


from packages.auth.v1.api.routes.users import router as users_router

router = APIRouter()
router.include_router(users_router, prefix="/users", tags=["users"])
