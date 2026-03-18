"""
Main application module.

This module initializes the FastAPI application, configures CORS middleware,
and sets up the API router. It also handles the application lifespan events
for database initialization.
"""

from app.v1.api import api_router
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


from app.v1.core.config import settings
from app.v1.core.logging_config import get_logger, setup_logging
from app.v1.core.middleware import GlobalErrorHandlerMiddleware
from app.v1.core.resume_executor import (
    initialize_resume_executor,
    run_in_resume_executor,
    shutdown_resume_executor,
)
from app.v1.db.session import init_db
from packages.resume_screening.v1.services.embeddings import (
    preload_embedding_model,
)

setup_logging(debug=settings.DEBUG)
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan context manager.

    Initializes the database on startup and handles cleanup on shutdown.

    Args:
        app: The FastAPI application instance.
    """
    logger.info(f"Starting {settings.PROJECT_NAME} in {settings.ENVIRONMENT} mode")
    await init_db()
    initialize_resume_executor()
    logger.info("Preloading embedding model")
    await run_in_resume_executor(preload_embedding_model)
    logger.info("Embedding model preloaded successfully")
    logger.info("Database initialized successfully")
    yield
    shutdown_resume_executor()
    logger.info("Shutting down application")


app = FastAPI(
    title=settings.PROJECT_NAME,
    debug=settings.DEBUG,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,  # ty:ignore[invalid-argument-type]
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(GlobalErrorHandlerMiddleware)  # ty:ignore[invalid-argument-type]

app.include_router(api_router, prefix="/api/v1")


@app.get("/")
async def root():
    """Root endpoint returning a welcome message.

    Returns:
        dict: A dictionary containing a welcome message with the project name.
    """
    return {"message": f"Welcome to {settings.PROJECT_NAME}"}
