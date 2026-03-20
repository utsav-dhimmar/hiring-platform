import asyncio
import logging
from sqlalchemy import text
from app.v1.db.session import engine

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def run_migrations():
    """
    Apply schema updates to an existing database.
    Run this script once if you are using an existing database and experiencing UndefinedColumnError.
    If you are running a fresh database, you do not need to run this.
    """
    logger.info("Starting schema update for existing tables...")
    async with engine.begin() as conn:
        # Add content_hash to files table
        try:
            await conn.execute(text("ALTER TABLE files ADD COLUMN content_hash TEXT"))
            logger.info("✅ Successfully added 'content_hash' column to 'files' table.")
        except Exception as e:
            if "already exists" in str(e).lower():
                logger.info("ℹ️ 'content_hash' column already exists in 'files' table.")
            else:
                logger.warning(f"⚠️ Could not add 'content_hash' to 'files': {e}")

        # Create index for content_hash
        try:
            await conn.execute(
                text("CREATE INDEX ix_files_content_hash ON files (content_hash)")
            )
            logger.info("✅ Created index for 'content_hash'.")
        except Exception:
            pass

        # Add text_hash to resumes table
        try:
            await conn.execute(text("ALTER TABLE resumes ADD COLUMN text_hash TEXT"))
            logger.info("✅ Successfully added 'text_hash' column to 'resumes' table.")
        except Exception as e:
            if "already exists" in str(e).lower():
                logger.info("ℹ️ 'text_hash' column already exists in 'resumes' table.")
            else:
                logger.warning(f"⚠️ Could not add 'text_hash' to 'resumes': {e}")

        # Create index for text_hash
        try:
            await conn.execute(
                text("CREATE INDEX ix_resumes_text_hash ON resumes (text_hash)")
            )
            logger.info("✅ Created index for 'text_hash'.")
        except Exception:
            pass

    logger.info("✅ Schema updates complete. You can now start the server!")


if __name__ == "__main__":
    asyncio.run(run_migrations())
