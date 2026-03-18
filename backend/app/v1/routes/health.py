"""
Health check routes module.

This module defines health check endpoints for the API.
"""

from fastapi import APIRouter

from app.v1.schemas.response import Response

router = APIRouter(tags=["health"])


@router.get("/health")
async def health_check() -> Response[str]:
    """Health check endpoint.

    Returns:
        Response: A success response indicating the service is healthy.
    """
    return Response(message="Service is healthy")


@router.get("/health/ready")
async def readiness_check() -> Response[str]:
    """Readiness check endpoint.

    Returns:
        Response: A success response indicating the service is ready.
    """
    return Response(message="Service is ready")


@router.get("/health/live")
async def liveness_check() -> Response[str]:
    """Liveness check endpoint.

    Returns:
        Response: A success response indicating the service is alive.
    """
    return Response(message="Service is alive")
