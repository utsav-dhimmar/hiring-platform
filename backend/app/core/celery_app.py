"""
Celery configuration module.

This module initializes the Celery application and configures it to use
Redis as the message broker.
"""

from celery import Celery

from app.v1.core.config import settings

celery_app = Celery(
    "worker",
    broker=settings.CELERY_BROKER_URL,
    include=["app.v1.services.resume_upload.tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
)
