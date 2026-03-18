"""
Authentication repositories.

Provides data access layers for authentication-related entities.
"""
from .user_repository import user_repository


__all__ = ["user_repository"]
