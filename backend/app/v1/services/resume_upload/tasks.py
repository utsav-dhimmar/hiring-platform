"""
Celery tasks for resume processing.
"""

import asyncio
import uuid
import logging

from app.v1.core.celery_app import celery_app
from .background import BackgroundProcessor
from .processor import ResumeProcessor

_log = logging.getLogger(__name__)

# Re-use the existing logic by wrapping it in a Celery task
@celery_app.task(name="process_resume_task", bind=True, max_retries=3)
def process_resume_task(self, job_id_str: str, resume_id_str: str, file_path: str):
    """Celery task to process a resume.
    
    This task wraps the existing async BackgroundProcessor logic.
    """
    job_id = uuid.UUID(job_id_str)
    resume_id = uuid.UUID(resume_id_str)
    
    processor = ResumeProcessor()
    bg_processor = BackgroundProcessor(processor)
    
    # Run the async background processing in a synchronous Celery worker
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
    try:
        loop.run_until_complete(
            bg_processor.process_resume_in_background(
                job_id=job_id,
                resume_id=resume_id,
                file_path=file_path
            )
        )
    except Exception as exc:
        _log.exception("Celery task failed for resume_id=%s", resume_id)
        # Self-retry if it's a transient error (e.g. network/LLM timeout)
        # For now, we just log it as the BackgroundProcessor already handles DB-level failure marking.
        raise self.retry(exc=exc, countdown=60)

@celery_app.task(name="mass_refresh_task", bind=True, max_retries=3)
def mass_refresh_task(self, job_id_str: str):
    """Celery task to mass refresh custom extractions for all resumes of a job."""
    job_id = uuid.UUID(job_id_str)
    
    processor = ResumeProcessor()
    bg_processor = BackgroundProcessor(processor)
    
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
    try:
        loop.run_until_complete(
            bg_processor.mass_refresh_in_background(job_id=job_id)
        )
    except Exception as exc:
        _log.exception("Celery mass refresh task failed for job_id=%s", job_id)
        raise self.retry(exc=exc, countdown=60)
