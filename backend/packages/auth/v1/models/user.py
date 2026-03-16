"""
User model module.

This module defines the SQLAlchemy ORM model for users.
"""

import uuid

from sqlalchemy import Boolean, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base_class import Base


def generate_uuid7():
    return uuid.uuid7()


class User(Base):
    """User ORM model.

    Represents a user in the hiring platform with authentication
    and authorization attributes.

    Attributes:
        id: The primary key of the user (UUID7).
        full_name: The full name of the user.
        email: The email address of the user (unique).
        hashed_password: The hashed password of the user.
        is_active: Whether the user account is active.
    """

    __tablename__ = "user"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        primary_key=True,
        default=generate_uuid7,
    )
    full_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    email: Mapped[str] = mapped_column(
        String(255), unique=True, index=True, nullable=False
    )
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean(), default=True)
