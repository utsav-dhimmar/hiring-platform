"""
Response schemas module.

This module defines common response schemas for the API.
"""

from typing import Any, Generic, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class Response(BaseModel, Generic[T]):
    """Generic response wrapper for API endpoints."""

    success: bool = True
    message: str = "Success"
    data: T | None = None


class ErrorResponse(BaseModel):
    """Error response schema."""

    success: bool = False
    message: str
    error_code: str | None = None
    details: dict[str, Any] | None = None


class PaginatedResponse(BaseModel, Generic[T]):
    """Paginated response wrapper."""

    success: bool = True
    message: str = "Success"
    data: list[T]
    total: int
    page: int
    page_size: int
    total_pages: int


class PaginatedData(BaseModel, Generic[T]):
    """Simple paginated response with data and total."""

    data: list[T]
    total: int
