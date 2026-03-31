import asyncio
import uuid
from app.v1.services.resume_upload.background import BackgroundProcessor
from app.v1.services.resume_upload.processor import ResumeProcessor
from app.v1.db.session import async_session_maker
from app.v1.db.models.resumes import Resume
from sqlalchemy import select

async def verify_fix():
    job_id = uuid.UUID("019d2983-b4fd-754c-b0d3-0a42e12add36")
    candidate_id = uuid.UUID("019d42a3-3ae8-757d-8436-85244469861b")
    
    processor = ResumeProcessor()
    bg_processor = BackgroundProcessor(processor)
    
    print(f"Starting re-analysis for candidate {candidate_id}...")
    await bg_processor.reanalyze_candidate_in_background(job_id=job_id, candidate_id=candidate_id)
    print("Re-analysis complete.")
    
    async with async_session_maker() as db:
        resume = await db.scalar(
            select(Resume)
            .where(Resume.candidate_id == candidate_id)
            .order_by(Resume.uploaded_at.desc())
            .limit(1)
        )
        if resume:
            print(f"New Score: {resume.resume_score}")
            if resume.resume_score > 0:
                print("SUCCESS: Score is non-zero.")
            else:
                print("FAILURE: Score is still 0.")
        else:
            print("Resume not found.")

if __name__ == "__main__":
    asyncio.run(verify_fix())
