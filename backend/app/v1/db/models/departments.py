"""
Department ORM model.
"""

import uuid

from sqlalchemy import Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.v1.db.base import Base
from app.v1.utils.uuid import UUIDHelper

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.v1.db.models.jobs import Job


class Department(Base):
    """Department ORM model.

    Represents a company department in the hiring platform.

    Attributes:
        id: The primary key of the department (UUID7).
        name: The unique name of the department (not null).
        description: A short description of the department (optional).
    """

    __tablename__ = "departments"

    # PRIMARY KEY
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=UUIDHelper.generate_uuid7,
    )

    # DEPARTMENT FIELDS
    name: Mapped[str] = mapped_column(
        Text,
        unique=True,
        nullable=False,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    # RELATIONSHIPS
    jobs: Mapped[list["Job"]] = relationship(
        "Job",
        back_populates="department",
    )
