
import asyncio
from app.v1.db.session import engine
from sqlalchemy import select
from app.v1.db.models.stage_templates import StageTemplate

async def check():
    async with engine.connect() as conn:
        res = await conn.execute(select(StageTemplate))
        rows = res.fetchall()
        for r in rows:
            print(f"ID: {r.id}, Name: {r.name}")

if __name__ == "__main__":
    asyncio.run(check())
