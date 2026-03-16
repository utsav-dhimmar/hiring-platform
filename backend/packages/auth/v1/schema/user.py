"""
User schema module.

This module defines Pydantic models for user data validation
and serialization in the API.
"""

from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr


class UserBase(BaseModel):
    """Base user schema with common attributes.

    Attributes:
        email: The email address of the user.
        is_active: Whether the user account is active.
        full_name: The full name of the user.
    """

    email: Optional[EmailStr] = None
    is_active: Optional[bool] = True
    full_name: Optional[str] = None


class UserCreate(BaseModel):
    """Schema for creating a new user.

    Attributes:
        email: The email address of the user (required).
        password: The password for the user (required).
        full_name: The full name of the user (optional).
    """

    email: EmailStr
    password: str
    full_name: Optional[str] = None


class UserUpdate(UserBase):
    """Schema for updating an existing user.

    Attributes:
        password: The new password for the user (optional).
    """

    password: Optional[str] = None


class UserInDBBase(UserBase):
    """Base schema for user data from database.

    Attributes:
        id: The primary key of the user (UUID7).
    """

    id: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class User(UserInDBBase):
    """Public user schema."""

    pass


class UserInDB(UserInDBBase):
    """Internal user schema with hashed password.

    Attributes:
        hashed_password: The hashed password of the user.
    """

    hashed_password: str
