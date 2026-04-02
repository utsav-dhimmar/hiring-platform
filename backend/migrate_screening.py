import asyncio
from sqlalchemy import text
from app.v1.db.session import engine

async def migrate():
    async with engine.begin() as conn:
        print("Adding columns to resume_screening_decisions...")
        await conn.execute(text("ALTER TABLE resume_screening_decisions ADD COLUMN IF NOT EXISTS had_maybe BOOLEAN DEFAULT FALSE;"))
        await conn.execute(text("ALTER TABLE resume_screening_decisions ADD COLUMN IF NOT EXISTS maybe_note TEXT;"))
        await conn.execute(text("ALTER TABLE resume_screening_decisions ADD COLUMN IF NOT EXISTS maybe_at TIMESTAMP WITH TIME ZONE;"))
        print("Migration complete.")

if __name__ == "__main__":
    asyncio.run(migrate())
