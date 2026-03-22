"""
Pydantic schemas for Department-related data transfer.
"""

import uuid

from pydantic import BaseModel, ConfigDict


class DepartmentBase(BaseModel):
    """
    Base schema for Department data with shared attributes.
    """

    name: str
    description: str | None = None


class DepartmentCreate(DepartmentBase):
    """
    Schema for creating a new Department.
    """

    pass


class DepartmentUpdate(BaseModel):
    """
    Schema for updating an existing Department.
    """

    name: str | None = None
    description: str | None = None


class DepartmentRead(DepartmentBase):
    """
    Schema for reading Department data, including database-generated fields.
    """

    id: uuid.UUID

    model_config = ConfigDict(from_attributes=True)
