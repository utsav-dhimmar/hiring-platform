import asyncio
import logging
from datetime import datetime
from sqlalchemy import select, update
from app.v1.core.celery_app import celery_app
from app.v1.db.models.jobs import Job
from app.v1.db.session import async_session_maker, engine

_log = logging.getLogger(__name__)

async def deactivate_expired_jobs_logic():
    """Logic to find and deactivate jobs whose priority period has ended."""
    async with async_session_maker() as session:
        now = datetime.now()
        
        # Find jobs that are active but past their end date
        stmt = (
            update(Job)
            .where(
                Job.is_active == True,
                Job.priority_end_date != None,
                Job.priority_end_date < now
            )
            .values(is_active=False)
            .execution_options(synchronize_session="fetch")
        )
        
        result = await session.execute(stmt)
        await session.commit()
        
        if result.rowcount > 0:
            _log.info(f"Deactivated {result.rowcount} expired jobs.")

@celery_app.task(name="deactivate_expired_jobs_task")
def deactivate_expired_jobs_task():
    """Celery task wrapper for job deactivation."""
    try:
        asyncio.run(deactivate_expired_jobs_logic())
    except Exception as exc:
        _log.exception("Failed to run deactivate_expired_jobs_task")
    finally:
        # Dispose engine to prevent connection leaks in worker
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                loop.create_task(engine.dispose())
            else:
                asyncio.run(engine.dispose())
        except Exception:
            pass

@celery_app.task(name="match_all_resumes_to_job_task")
def match_all_resumes_to_job_task(job_id_str: str, months_limit: int = 3):
    """Celery task to match existing resumes against a new job."""
    import uuid
    from app.v1.services.cross_job_match_service import cross_job_match_service
    
    job_id = uuid.UUID(job_id_str)
    try:
        _log.info(f"Starting mass resume matching for new job: {job_id} (limit: {months_limit} months)")
        asyncio.run(cross_job_match_service.run_new_job_matching(job_id, months_limit=months_limit))
        _log.info(f"Successfully finished mass matching for job: {job_id}")
    except Exception as exc:
        _log.exception(f"Failed to run match_all_resumes_to_job_task for job {job_id}")
    finally:
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                loop.create_task(engine.dispose())
            else:
                asyncio.run(engine.dispose())
        except Exception:
            pass
