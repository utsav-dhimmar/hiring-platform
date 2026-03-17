import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

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
        password_hash: The hashed password of the user.
        is_active: Whether the user account is active.
        role_id: Foreign key to the roles table.
        created_at: Timestamp when user was created.
        updated_at: Timestamp when user was last updated.
    """

    __tablename__ = "users"

    # PRIMARY KEY
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=generate_uuid7,
    )

    # USER FIELDS
    full_name: Mapped[str | None] = mapped_column(String(255), nullable=True)

    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        index=True,
        nullable=False,
    )

    password_hash: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean(),
        default=True,
        nullable=False,
    )

    # FOREIGN KEY
    role_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("roles.id"),
    )

    # TIMESTAMPS
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        onupdate=func.now(),
    )

    # RELATIONSHIPS
    role = relationship("Role", back_populates="users")