import asyncio
import uuid
from app.v1.db.session import async_session_maker
from app.v1.db.models.evaluations import Evaluation
from sqlalchemy import select

async def check_eval():
    sid = uuid.UUID('019dcf17-d8d3-7088-97c4-820e25292d46')
    from app.v1.db.models.candidate_stages import CandidateStage
    async with async_session_maker() as db:
        stage = await db.get(CandidateStage, sid)
        if stage:
            print(f"Stage ID: {stage.id}")
            print(f"Stage Status: {stage.status}")
            print(f"Evaluation Data (JSONB): {stage.evaluation_data}")
        else:
            print(f"Stage {sid} NOT FOUND")

        res = await db.execute(select(Evaluation).where(Evaluation.candidate_stage_id == sid))
        e = res.scalars().first()
        print(f"Evaluation record exists: {e is not None}")
        if e:
            print(f"Evaluation ID: {e.id}")
            print(f"Score: {e.overall_score}")
            print(f"Recommendation: {e.recommendation[:100]}...")

if __name__ == "__main__":
    asyncio.run(check_eval())
