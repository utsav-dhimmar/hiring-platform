"""
Test configuration and fixtures for user tests using PostgreSQL.
"""

import uuid
from datetime import datetime, timezone
from typing import AsyncGenerator
from unittest.mock import MagicMock, patch

import pytest
import pytest_asyncio
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.v1.core.security import hash_password
from app.v1.db.base import Base
from app.v1.db.models.permissions import Permission
from app.v1.db.models.roles import Role
from app.v1.db.models.user import User


def create_test_db():
    """Create test database if it doesn't exist."""
    import psycopg2
    from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

    conn = psycopg2.connect(
        host="localhost",
        port=5432,
        user="postgres",
        password="postgres",
    )
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT 1 FROM pg_database WHERE datname = 'test_db'")
        if not cursor.fetchone():
            cursor.execute("CREATE DATABASE test_db")
    except Exception:
        pass
    finally:
        cursor.close()
        conn.close()


create_test_db()

TEST_DATABASE_URL = "postgresql+asyncpg://postgres:postgres@localhost:5432/test_db"

mock_engine = MagicMock()


@pytest.fixture(scope="function")
def app_with_mocks():
    with (
        patch("app.main.preload_embedding_model", return_value=None),
        patch("app.main.init_db", return_value=None),
        patch("app.main.initialize_resume_executor", return_value=None),
        patch("app.v1.db.session.engine", mock_engine),
    ):
        from app.main import app
        from app.v1.db.session import get_db, async_session_maker

        test_engine = create_async_engine(
            TEST_DATABASE_URL,
            echo=False,
        )
        TestSessionMaker = async_sessionmaker(
            test_engine,
            class_=AsyncSession,
            expire_on_commit=False,
        )

        async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
            async with TestSessionMaker() as session:
                yield session

        app.dependency_overrides[get_db] = override_get_db
        yield app
        app.dependency_overrides.clear()
        test_engine.sync_engine.dispose()


@pytest_asyncio.fixture(scope="function")
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """Create a fresh database session for each test using PostgreSQL."""
    test_engine = create_async_engine(
        TEST_DATABASE_URL,
        echo=False,
    )
    TestSessionMaker = async_sessionmaker(
        test_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    async with TestSessionMaker() as session:
        yield session
        await session.close()

    await test_engine.dispose()


@pytest_asyncio.fixture
async def admin_role(db_session: AsyncSession) -> Role:
    """Create an admin role."""
    role = Role(
        id=uuid.uuid4(),
        name="admin",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db_session.add(role)
    await db_session.commit()
    await db_session.refresh(role)
    return role


@pytest_asyncio.fixture
async def hr_role(db_session: AsyncSession) -> Role:
    """Create an HR role."""
    role = Role(
        id=uuid.uuid4(),
        name="hr",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db_session.add(role)
    await db_session.commit()
    await db_session.refresh(role)
    return role


@pytest_asyncio.fixture
async def admin_user(db_session: AsyncSession, admin_role: Role) -> User:
    """Create an admin user."""
    user = User(
        id=uuid.uuid4(),
        email="admin@test.com",
        full_name="Admin User",
        password_hash=hash_password("admin123"),
        is_active=True,
        role_id=admin_role.id,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest_asyncio.fixture
async def regular_user(db_session: AsyncSession, hr_role: Role) -> User:
    """Create a regular (non-admin) user."""
    user = User(
        id=uuid.uuid4(),
        email="user@test.com",
        full_name="Regular User",
        password_hash=hash_password("user123"),
        is_active=True,
        role_id=hr_role.id,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest_asyncio.fixture
async def permission(db_session: AsyncSession) -> Permission:
    """Create a test permission."""
    perm = Permission(
        id=uuid.uuid4(),
        name="test:permission",
        description="Test permission",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db_session.add(perm)
    await db_session.commit()
    await db_session.refresh(perm)
    return perm


@pytest.fixture
def client(app_with_mocks):
    """Create a test client."""
    with TestClient(app_with_mocks, raise_server_exceptions=False) as c:
        yield c


def get_auth_header(token: str) -> dict:
    """Helper to create authorization header."""
    return {"Authorization": f"Bearer {token}"}
