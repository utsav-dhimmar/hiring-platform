import asyncio
import asyncpg

async def main():
    try:
        print("Connecting to database...")
        conn = await asyncpg.connect(
            user='postgres', 
            password='postgres', 
            database='app', 
            host='localhost', 
            port=5435
        )
        print("Connected.")
        
        await conn.execute("ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS is_passed BOOLEAN NOT NULL DEFAULT FALSE;")
        print("Added 'is_passed' column.")
        
        await conn.execute("UPDATE evaluations SET is_passed = TRUE WHERE overall_score >= 3.5;")
        print("Backfilled is_passed for existing records.")
        
        await conn.close()
        print("Success.")
    except Exception as e:
        print(f"Failed: {e}")

if __name__ == "__main__":
    asyncio.run(main())
