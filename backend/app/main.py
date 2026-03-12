from contextlib import asynccontextmanager

from fastapi import FastAPI, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError

from app.api.v1.api import api_router
from app.core.config import settings
from app.core.exceptions import (
    global_exception_handler,
    sqlalchemy_exception_handler,
    validation_exception_handler,
)
from app.core.logging import logger
from app.core.middleware import ResponseTimeMiddleware
from app.db.session import engine


@asynccontextmanager
async def lifespan(app: FastAPI):

    logger.info("Starting up application...")
    try:
        async with engine.begin() as conn:
            logger.info("Database connection verified.")

    except Exception as e:
        logger.error(f"Database connection error: {e}")

    yield

    logger.info("Shutting down application...")
    await engine.dispose()


app = FastAPI(
    title=settings.PROJECT_NAME, debug=settings.DEBUG, lifespan=lifespan
)

# Exception Handlers
app.add_exception_handler(Exception, global_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(SQLAlchemyError, sqlalchemy_exception_handler)

# Middlewares
app.add_middleware(ResponseTimeMiddleware)

# CORS configuration
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            str(origin).strip("/") for origin in settings.BACKEND_CORS_ORIGINS
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/")
def say_hi():
    return JSONResponse(
        {"message": f"Welcome to {settings.PROJECT_NAME} API"},
        status_code=status.HTTP_200_OK,
    )
