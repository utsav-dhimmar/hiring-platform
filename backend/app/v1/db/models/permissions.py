import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.v1.db.base_class import Base
from app.v1.db.models.roleAndPermission import role_permission

if TYPE_CHECKING:
    from app.v1.db.models.roles import Role


def generate_uuid7():
    return uuid.uuid7()


class Permission(Base):
    """Permission ORM model.

    Represents a permission in the hiring platform.

    Attributes:
        id: The primary key of the permission (UUID7).
        name: The name of the permission (unique, not null).
        description: A short description of the permission (not null).
        created_at: Timestamp when permission was created.
        updated_at: Timestamp when permission was last updated.
    """

    __tablename__ = "permissions"

    # PRIMARY KEY
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=generate_uuid7,
    )

    # PERMISSION FIELDS
    name: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
    )

    description: Mapped[str] = mapped_column(
        Text,
        nullable=False,
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
    roles: Mapped[list["Role"]] = relationship("Role", secondary=role_permission, back_populates="permissions")
