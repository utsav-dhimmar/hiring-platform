"""
Schema for the Job Stats endpoint.

Provides a comprehensive breakdown of candidates for a specific job:
  - result: AI screening pass/fail counts (includes cross-matches)
  - location: candidate count per city/location
  - stages: candidate count per hiring pipeline stage
  - hr_decisions: HR decision summary (approved, rejected, maybe, pending)
"""

from __future__ import annotations

from pydantic import BaseModel


class JobResultStats(BaseModel):
    """AI resume-screening pass/fail breakdown."""

    passed: int = 0
    failed: int = 0
    pending: int = 0


class JobHRDecisionStats(BaseModel):
    """HR decision summary for a job."""

    total_candidates: int = 0
    approved: int = 0
    rejected: int = 0
    maybe: int = 0
    pending: int = 0


class JobStatsResponse(BaseModel):
    """Full stats response for GET /candidates/jobs/{job_id}/stats."""

    result: JobResultStats
    location: dict[str, int]   # { "Mumbai": 12, "Delhi": 5, ... }
    stages: dict[str, int]     # { "HR Screening": 8, "Technical Round": 3, ... }
    hr_decisions: JobHRDecisionStats
