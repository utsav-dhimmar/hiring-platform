import uuid
from datetime import datetime

from typing import TYPE_CHECKING

from sqlalchemy import DateTime, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.v1.db.base_class import Base
from app.v1.db.models.roleAndPermission import role_permission

if TYPE_CHECKING:
    from app.v1.db.models.permissions import Permission
    from app.v1.db.models.user import User


from app.v1.utils.uuid import UUIDHelper


class Role(Base):
    """Role ORM model.

    Represents a role in the hiring platform (e.g., HR, Intern, Admin).

    Attributes:
        id: The primary key of the role (UUID7).
        name: The name of the role (unique, not null).
        created_at: Timestamp when role was created.
        updated_at: Timestamp when role was last updated.
    """

    __tablename__ = "roles"

    # PRIMARY KEY
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=UUIDHelper.generate_uuid7(),
    )

    # ROLE FIELDS
    name: Mapped[str] = mapped_column(
        String(255),
        unique=True,
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
    users: Mapped[list["User"]] = relationship("User", back_populates="role")
    permissions: Mapped[list["Permission"]] = relationship(
        "Permission", secondary=role_permission, back_populates="roles"
    )
