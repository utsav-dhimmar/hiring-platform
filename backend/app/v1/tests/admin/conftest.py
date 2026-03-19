"""
Test configuration and fixtures for admin API tests.
"""

import asyncio
import uuid
from datetime import datetime, timezone
from typing import AsyncGenerator
from unittest.mock import patch, MagicMock

import pytest
import pytest_asyncio
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

TEST_DATABASE_URL = "postgresql+asyncpg://postgres:postgres@localhost/app"

test_engine = create_async_engine(TEST_DATABASE_URL, echo=False)
TestSessionMaker = async_sessionmaker(
    test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

mock_engine = MagicMock()


@pytest.fixture(scope="function")
def app_with_mocks():
    with patch("app.main.preload_embedding_model", return_value=None), \
         patch("app.main.init_db", return_value=None), \
         patch("app.main.initialize_resume_executor", return_value=None), \
         patch("app.v1.db.session.engine", mock_engine), \
         patch("app.v1.db.session.async_session_maker", TestSessionMaker):
        from app.main import app
        from app.v1.db.session import get_db

        async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
            async with TestSessionMaker() as session:
                yield session

        app.dependency_overrides[get_db] = override_get_db
        yield app


@pytest.fixture(scope="function")
def event_loop():
    """Create event loop for each test function."""
    policy = asyncio.get_event_loop_policy()
    loop = policy.new_event_loop()
    asyncio.set_event_loop(loop)
    yield loop
    loop.close()


from app.v1.core.security import create_access_token, hash_password
from app.v1.db.base import Base
from app.v1.db.models.permissions import Permission
from app.v1.db.models.roleAndPermission import role_permission
from app.v1.db.models.roles import Role
from app.v1.db.models.user import User


@pytest_asyncio.fixture(scope="function")
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """Create a fresh database session for each test."""
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with TestSessionMaker() as session:
        yield session
        await session.close()


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


@pytest_asyncio.fixture
async def second_role(db_session: AsyncSession, permission: Permission) -> Role:
    """Create a second role with a permission."""
    role = Role(
        id=uuid.uuid4(),
        name="editor",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db_session.add(role)
    await db_session.flush()

    await db_session.execute(
        role_permission.insert().values(
            role_id=role.id, permission_id=permission.id
        )
    )
    await db_session.commit()
    await db_session.refresh(role)
    return role


@pytest.fixture
def admin_token(admin_user: User) -> str:
    """Generate a valid admin access token."""
    token, _ = create_access_token(
        subject=str(admin_user.id),
        email=admin_user.email,
    )
    return token


@pytest.fixture
def user_token(regular_user: User) -> str:
    """Generate a valid regular user access token."""
    token, _ = create_access_token(
        subject=str(regular_user.id),
        email=regular_user.email,
    )
    return token


@pytest.fixture
def client(app_with_mocks):
    """Create a test client."""
    with TestClient(app_with_mocks, raise_server_exceptions=False) as c:
        yield c


def get_auth_header(token: str) -> dict:
    """Helper to create authorization header."""
    return {"Authorization": f"Bearer {token}"}
