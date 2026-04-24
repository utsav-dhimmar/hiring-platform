
import uuid
import asyncio
from typing import Any, Dict
from celery import shared_task
from app.v1.db.session import async_session_maker
from app.v1.services.evaluation_service import evaluation_service
import logging

logger = logging.getLogger(__name__)

@shared_task(name="evaluate_candidate_transcript_task")
def evaluate_candidate_transcript_task(candidate_stage_id_str: str):
    """
    Celery task to run the AI evaluation for a candidate's transcript.
    """
    candidate_stage_id = uuid.UUID(candidate_stage_id_str)
    
    # We need to run the async service in the synchronous Celery worker
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    
    if loop.is_running():
        import nest_asyncio
        nest_asyncio.apply()
    
    async def run_evaluation():
        async with async_session_maker() as db:
            try:
                logger.info(f"Starting AI evaluation for stage {candidate_stage_id}")
                result = await evaluation_service.evaluate_candidate_stage(db, candidate_stage_id)
                logger.info(f"Evaluation completed for stage {candidate_stage_id}")
                return result
            except Exception as e:
                logger.error(f"Evaluation task failed for stage {candidate_stage_id}: {e}")
                raise

    return loop.run_until_complete(run_evaluation())
