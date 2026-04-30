import asyncio
from app.v1.db.session import async_session_maker
from sqlalchemy import select
from app.v1.db.models.criteria import Criterion

async def check():
    async with async_session_maker() as db:
        res = await db.execute(select(Criterion.id, Criterion.name))
        for row in res.all():
            print(f"{row.id}: {row.name}")

if __name__ == "__main__":
    asyncio.run(check())
