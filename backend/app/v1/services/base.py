"""
Base service module.

This module defines the base service class with common functionality.
"""

from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.v1.db.session import async_session_maker


class BaseService:
    """Base service class providing common database operations."""

    def __init__(self):
        self.session_maker = async_session_maker

    async def get_session(self) -> AsyncSession:
        """Get an async database session.

        Yields:
            AsyncSession: An async database session.
        """
        async with self.session_maker() as session:
            yield session

    async def commit(self, session: AsyncSession) -> None:
        """Commit the current transaction.

        Args:
            session: The database session.
        """
        await session.commit()

    async def refresh(self, session: AsyncSession, instance: Any) -> None:
        """Refresh an instance from the database.

        Args:
            session: The database session.
            instance: The instance to refresh.
        """
        await session.refresh(instance)
