import asyncio
import asyncpg
import uuid

from datetime import datetime, timezone

async def main():
    try:
        conn = await asyncpg.connect(user='postgres', password='root', database='app2', host='localhost')
        print("Connected to database.")
        
        # Check if priorities already exist
        count = await conn.fetchval("SELECT COUNT(*) FROM job_priorities")
        if count == 0:
            print("Seeding job priorities...")
            now = datetime.now(timezone.utc)
            priorities = [
                (uuid.uuid4(), 'P1', 30, 'High Priority - 30 days duration'),
                (uuid.uuid4(), 'P2', 60, 'Medium Priority - 60 days duration'),
                (uuid.uuid4(), 'P3', 90, 'Low Priority - 90 days duration'),
            ]
            for p in priorities:
                await conn.execute(
                    "INSERT INTO job_priorities (id, name, duration_days, created_at, updated_at) VALUES ($1, $2, $3, $4, $4)",
                    p[0], p[1], p[2], now
                )
            print("Seeding successful.")
        else:
            print("Job priorities already exist. Skipping seed.")
        
        await conn.close()
    except Exception as e:
        print(f"Seed failed: {e}")

if __name__ == "__main__":
    asyncio.run(main())
