"""
Pydantic schemas for Location-related data transfer.
"""

import uuid

from pydantic import BaseModel, ConfigDict


class LocationRead(BaseModel):
    """
    Schema for reading Location data, including database-generated fields.
    """

    id: uuid.UUID
    name: str

    model_config = ConfigDict(from_attributes=True)
