"""
Location ORM model.
"""

import uuid

from sqlalchemy import Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.v1.db.base import Base
from app.v1.utils.uuid import UUIDHelper

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.v1.db.models.candidates import Candidate


class Location(Base):
    """Location ORM model.

    Represents a normalized location entry (city / region) in the hiring platform.
    Candidates reference this table via FK so that duplicate location strings
    are stored only once.

    Attributes:
        id: The primary key of the location (UUID7).
        name: The unique, title-cased location name (not null).
    """

    __tablename__ = "locations"

    # PRIMARY KEY
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=UUIDHelper.generate_uuid7,
    )

    # LOCATION FIELDS
    name: Mapped[str] = mapped_column(
        Text,
        unique=True,
        nullable=False,
    )

    # RELATIONSHIPS
    candidates: Mapped[list["Candidate"]] = relationship(
        "Candidate",
        back_populates="location_rel",
    )
