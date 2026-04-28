
import asyncio
from app.v1.db.session import engine
from sqlalchemy import select
from app.v1.db.models.criteria import Criterion

async def check():
    async with engine.connect() as conn:
        res = await conn.execute(select(Criterion))
        rows = res.fetchall()
        print(f"Found {len(rows)} criteria.")
        for r in rows:
            print(f"- {r.title}: {r.description}")

if __name__ == "__main__":
    asyncio.run(check())
