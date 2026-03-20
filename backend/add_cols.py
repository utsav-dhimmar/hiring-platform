import asyncio
from sqlalchemy import text
from app.v1.db.session import engine


async def run_migrations():
    async with engine.begin() as conn:
        print("Running migrations...")
        await conn.execute(
            text("ALTER TABLE files ADD COLUMN IF NOT EXISTS content_hash TEXT")
        )
        try:
            await conn.execute(
                text("CREATE INDEX ix_files_content_hash ON files (content_hash)")
            )
        except Exception as e:
            print(f"Index error: {e}")
        print("Done adding files.content_hash!")


asyncio.run(run_migrations())
