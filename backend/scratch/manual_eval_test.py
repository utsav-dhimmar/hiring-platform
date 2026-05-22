import asyncio
import uuid
import logging
import sys
import os

# Setup logging to console
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), "backend"))

from app.v1.db.session import async_session_maker
from app.v1.services.evaluation_service import evaluation_service

async def run_manual_eval():
    sid_str = '019dcf17-d8d3-7088-97c4-820e25292d46'
    sid = uuid.UUID(sid_str)
    
    print(f"--- Manual Evaluation Test for Stage {sid} ---")
    
    async with async_session_maker() as db:
        try:
            print("Starting evaluation_service.evaluate_candidate_stage...")
            result = await evaluation_service.evaluate_candidate_stage(db, sid)
            print("Success!")
            print(f"Result: {result.keys()}")
        except Exception as e:
            print(f"FAILED: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(run_manual_eval())
