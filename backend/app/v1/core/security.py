"""
Security utilities module.

This module provides functions for password hashing, verification,
and JWT token creation for authentication and authorization.
"""

from datetime import UTC, datetime, timedelta

import bcrypt
import jwt

from app.v1.core.config import settings


# TODO: use pwdlib insted of raw bcrypt
def hash_password(password: str) -> str:
    """Hash a plain text password using bcrypt.

    Args:
        password: The plain text password to hash.

    Returns:
        The hashed password string.
    """
    password_bytes = password.encode("utf-8")
    return bcrypt.hashpw(password_bytes, bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    """Verify a plain text password against a bcrypt hash.

    Args:
        password: The plain text password to verify.
        password_hash: The bcrypt hash to check against.

    Returns:
        True if the password matches the hash, False otherwise.
    """
    try:
        return bcrypt.checkpw(
            password.encode("utf-8"),
            password_hash.encode("utf-8"),
        )
    except ValueError:
        return False


def create_access_token(*, subject: str, email: str) -> tuple[str, datetime]:
    """Create a new JWT access token.

    Args:
        subject: The subject of the token (usually user ID).
        email: The email associated with the user.

    Returns:
        A tuple containing the encoded JWT token and its expiration datetime.
    """
    expires_at = datetime.now(UTC) + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    payload = {
        "sub": subject,
        "email": email,
        "exp": expires_at,
    }
    token = jwt.encode(
        payload,
        settings.SECRET_KEY,
        algorithm="HS256",
    )
    return token, expires_at


def create_refresh_token(*, subject: str, email: str) -> tuple[str, datetime]:
    """Create a new JWT refresh token.

    Args:
        subject: The subject of the token.
        email: The email associated with the user.

    Returns:
        A tuple containing the encoded JWT token and its expiration datetime.
    """
    expires_at = datetime.now(UTC) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    payload = {
        "sub": subject,
        "email": email,
        "exp": expires_at,
        "type": "refresh",
    }
    token = jwt.encode(
        payload,
        settings.SECRET_KEY,
        algorithm="HS256",
    )
    return token, expires_at
