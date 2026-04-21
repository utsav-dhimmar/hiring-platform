"""
Celery configuration module.

This module initializes the Celery application and configures it to use
Redis as the message broker.
"""

from celery import Celery
from celery.signals import worker_process_init

from app.v1.core.config import settings

celery_app = Celery(
    "worker",
    broker=settings.CELERY_BROKER_URL,
    include=[
        "app.v1.services.resume_upload.tasks",
        "app.v1.services.admin.job_tasks"
    ],
)

@worker_process_init.connect
def init_worker(**kwargs):
    """
    Initialize the worker process.
    Preloads the embedding model to avoid first-task latency.
    """
    from app.v1.core.embeddings import preload_embedding_model
    preload_embedding_model()

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
)

# Configure Celery Beat for periodic tasks
celery_app.conf.beat_schedule = {
    "deactivate-expired-jobs-every-hour": {
        "task": "deactivate_expired_jobs_task",
        "schedule": 3600.0,  # Run every hour (3600 seconds)
    },
}
