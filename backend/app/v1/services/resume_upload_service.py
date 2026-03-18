"""
Resume upload service module.

This module provides the business logic for handling resume uploads,
queuing them for processing, and exposing status/result retrieval.
This file now redirects to the modularized package in .resume_upload.
"""

from .resume_upload import ResumeUploadService, resume_upload_service

__all__ = ["ResumeUploadService", "resume_upload_service"]
