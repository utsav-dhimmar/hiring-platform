import asyncio
import uuid
from app.v1.db.session import async_session_maker
from app.v1.db.models.resumes import Resume
from sqlalchemy import select
import json

async def check():
    async with async_session_maker() as db:
        candidate_id = uuid.UUID('019d520f-c243-71f5-8ab7-97836d9847d5')
        resume = await db.scalar(
            select(Resume).where(Resume.candidate_id == candidate_id).order_by(Resume.uploaded_at.desc()).limit(1)
        )
        if resume:
            print(f"Resume ID: {resume.id}")
            print(f"Score: {resume.resume_score}")
            if resume.parse_summary:
                print(f"Parse Summary: {json.dumps(resume.parse_summary, indent=2)}")
            else:
                print("No parse_summary found")
        else:
            print("No resume found for candidate")

if __name__ == '__main__':
    asyncio.run(check())
