import asyncio
import json
from sqlalchemy import text
from app.v1.db.session import engine


async def check():
    async with engine.connect() as conn:
        res = await conn.execute(
            text(
                "SELECT column_name FROM information_schema.columns WHERE table_name = 'files';"
            )
        )
        f_cols = [r[0] for r in res.fetchall()]
        res2 = await conn.execute(
            text(
                "SELECT column_name FROM information_schema.columns WHERE table_name = 'resumes';"
            )
        )
        r_cols = [r[0] for r in res2.fetchall()]

        with open("schema_out.json", "w") as f:
            json.dump({"files": f_cols, "resumes": r_cols}, f)


asyncio.run(check())
