import uuid

from pgvector.sqlalchemy import Vector
from sqlalchemy import Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.v1.db.base_class import Base


def generate_uuid7():
    return uuid.uuid7()


class Skill(Base):
    """Skill ORM model.

    Represents a skill in the hiring platform.

    Attributes:
        id: The primary key of the skill (UUID7).
        name: The unique name of the skill (not null).
        description: A short description of the skill (optional).
        skill_embedding: Vector embedding of name + description.
    """

    __tablename__ = "skills"

    # PRIMARY KEY
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=generate_uuid7,
    )

    # SKILL FIELDS
    name: Mapped[str] = mapped_column(
        Text,
        unique=True,
        nullable=False,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    # VECTOR EMBEDDING (name + description combined)
    skill_embedding: Mapped[list | None] = mapped_column(
        Vector(1024),
        nullable=True,
    )
