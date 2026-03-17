"""
Configuration module.

This module defines the application settings using Pydantic BaseSettings.
Settings are loaded from environment variables and .env files.
"""

from pydantic import computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict

from app.v1.core.logging_config import get_logger

logger = get_logger(__name__)


# TODO: validate through pydantic Field
class Settings(BaseSettings):
    """Application settings loaded from environment variables.

    Attributes:
        PROJECT_NAME: The name of the project. Defaults to "HR Platform".
        ENVIRONMENT: The deployment environment. Defaults to "development".
        DEBUG: Whether debug mode is enabled. Defaults to False.
        SECRET_KEY: Secret key for JWT signing.
        ACCESS_TOKEN_EXPIRE_MINUTES: Expiration time for access tokens.
        REFRESH_TOKEN_EXPIRE_DAYS: Expiration time for refresh tokens.
        POSTGRES_SERVER: PostgreSQL server hostname. Defaults to "localhost".
        POSTGRES_PORT: PostgreSQL server port. Defaults to 5432.
        POSTGRES_USER: PostgreSQL username. Defaults to "postgres".
        POSTGRES_PASSWORD: PostgreSQL password. Defaults to "postgres".
        POSTGRES_DB: PostgreSQL database name. Defaults to "app".
        SQLALCHEMY_DATABASE_URI: Optional explicit database URI override.
        BACKEND_CORS_ORIGINS: List of allowed CORS origins.
        OLLAMA_URL: URL for the Ollama service.
        OLLAMA_MODEL: Name of the Ollama model to use.
        OLLAMA_API_KEY: API key for Ollama Cloud (if applicable).
        LANGEXTRACT_RETRY_ATTEMPTS: Number of retry attempts for extraction.
        LANGEXTRACT_RETRY_DELAY: Delay between retry attempts in seconds.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_ignore_empty=True,
        extra="ignore",
    )

    PROJECT_NAME: str = "HR Platform"
    ENVIRONMENT: str = "development"
    DEBUG: bool = False
    SECRET_KEY: str = (
        ""  # generate using openssl rand -hex 32 on linux or any other way
    )
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Postgres
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "app"

    # Optional explicit override
    SQLALCHEMY_DATABASE_URI: str | None = None

    @computed_field
    @property
    def database_url(self) -> str:
        """Generate the database URL for SQLAlchemy.

        Returns:
            str: The database URL, either from explicit override or constructed
                 from individual PostgreSQL settings.
        """
        if self.SQLALCHEMY_DATABASE_URI:
            logger.info("Using explicit SQLALCHEMY_DATABASE_URI")
            return self.SQLALCHEMY_DATABASE_URI
        logger.info(
            f"Connecting to database: {self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )
        return (
            f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    # CORS
    BACKEND_CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8000",
    ]

    # Ollama
    OLLAMA_URL: str = "https://ollama.com"
    OLLAMA_MODEL: str = "qwen3.5:cloud"
    OLLAMA_API_KEY: str = ""

    # LangExtract Retry
    LANGEXTRACT_RETRY_ATTEMPTS: int = 3
    LANGEXTRACT_RETRY_DELAY: int = 60

    # Resume uploads
    RESUME_MAX_SIZE_MB: int = 5
    RESUME_UPLOAD_DIR: str = "uploads/resumes"
    ALLOWED_RESUME_EXTENSIONS: list[str] = ["pdf", "docx"]
    RESUME_PROCESSING_MAX_WORKERS: int = 4

    # admin user
    ADMIN_ROLE_NAME: str = "admin"
    ADMIN_EMAIL: str = "admin@example.com"
    ADMIN_PASSWORD: str = "admin123"
    ADMIN_FULL_NAME: str = "admin"


settings = Settings()
