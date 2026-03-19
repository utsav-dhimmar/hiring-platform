"""
Pydantic schemas for Skill-related data transfer.
"""

import uuid

from pydantic import BaseModel, ConfigDict


class SkillBase(BaseModel):
    """
    Base schema for Skill data with shared attributes.
    """

    name: str
    description: str | None = None


class SkillCreate(SkillBase):
    """
    Schema for creating a new Skill.
    """

    pass


class SkillUpdate(BaseModel):
    """
    Schema for updating an existing Skill.
    """

    name: str | None = None
    description: str | None = None


class SkillRead(SkillBase):
    """
    Schema for reading Skill data, including database-generated fields.
    """

    id: uuid.UUID

    model_config = ConfigDict(from_attributes=True)
