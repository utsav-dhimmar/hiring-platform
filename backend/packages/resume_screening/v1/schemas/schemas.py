"""
Pydantic schemas for resume screening.

This module defines the data structures used for representing extracted
resume information.
"""

from typing import List

from pydantic import BaseModel, Field


class ResumeData(BaseModel):
    """Data model for extracted resume information.

    Contains lists of strings for various resume sections. Only explicitly
    mentioned sections should be extracted.
    """

    skills: List[str] = Field(
        default_factory=list,
        description="A list of technical and soft skills explicitly listed or mentioned in the resume. Return an empty list if no skills section or explicitly apparent skills are found.",
    )
    experience: List[str] = Field(
        default_factory=list,
        description="A list of work experiences, job titles, companies, or relevant professional background explicitly mentioned. Return an empty list if not found.",
    )
    education: List[str] = Field(
        default_factory=list,
        description="A list of educational degrees, institutions, and relevant academic background explicitly mentioned. Return an empty list if not found.",
    )
    certifications: List[str] = Field(
        default_factory=list,
        description="A list of certifications or courses explicitly mentioned. Return an empty list if not found.",
    )
