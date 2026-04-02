"""
Base class module.

This module defines the SQLAlchemy DeclarativeBase class that all
ORM models inherit from.
"""

from app.v1.db.base_class import Base  # noqa: F401

# Import all models here to register them with SQLAlchemy metadata
from app.v1.db.models.user import User  # noqa: F401
from app.v1.db.models.jobs import Job  # noqa: F401
from app.v1.db.models.candidates import Candidate  # noqa: F401
from app.v1.db.models.resumes import Resume  # noqa: F401
from app.v1.db.models.cross_job_matches import CrossJobMatch  # noqa: F401
from app.v1.db.models.hr_decisions import HrDecision  # noqa: F401
