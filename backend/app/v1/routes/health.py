"""
Health check routes module.

This module defines health check endpoints for the API.
"""

from fastapi import APIRouter
from sqlalchemy import text

from app.v1.core.cache import cache
from app.v1.core.celery_app import celery_app
from app.v1.db.session import engine
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


@router.get("/health/detailed")
async def detailed_health_check() -> Response[dict]:
    """Detailed health check endpoint.

    Checks connectivity to PostgreSQL, Redis, and Celery workers.

    Returns:
        Response: A response with health status of all components.
    """
    health_status = {
        "postgres": "unknown",
        "redis": "unknown",
        "celery_worker": "unknown",
    }

    # Check PostgreSQL
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        health_status["postgres"] = "connected"
    except Exception as exc:
        health_status["postgres"] = f"disconnected: {exc!s}"

    # Check Redis
    try:
        client = cache._get_client()
        if client is not None:
            await client.ping()
            health_status["redis"] = "connected"
        else:
            health_status["redis"] = "disconnected: Client not initialized"
    except Exception as exc:
        health_status["redis"] = f"disconnected: {exc!s}"

    # Check Celery Worker
    try:
        # ping() returns a list of dictionaries like [{'worker_name': {'ok': 'pong'}}]
        inspector = celery_app.control.inspect(timeout=1.0)
        pings = inspector.ping()
        if pings:
            health_status["celery_worker"] = "connected"
        else:
            health_status["celery_worker"] = "disconnected: No workers found"
    except Exception as exc:
        health_status["celery_worker"] = f"disconnected: {exc!s}"

    overall_success = all(
        status == "connected" for status in health_status.values()
    )

    return Response(
        success=overall_success,
        message="System health status",
        data=health_status,
    )
