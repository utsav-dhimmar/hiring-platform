"""
Test configuration and fixtures for admin API tests.
"""

import uuid
from datetime import datetime, timezone
from typing import Generator, AsyncGenerator
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.v1.core.security import create_access_token, hash_password
from app.v1.db.base import Base
from app.v1.db.models.permissions import Permission
from app.v1.db.models.roleAndPermission import role_permission
from app.v1.db.models.roles import Role
from app.v1.db.models.user import User

# Use synchronous driver for tests setup
SYNC_TEST_DATABASE_URL = "postgresql://postgres:postgres@localhost/test_db"
# Use async driver for application override
ASYNC_TEST_DATABASE_URL = "postgresql+asyncpg://postgres:postgres@localhost/test_db"

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
        from app.v1.db.session import get_db

        test_async_engine = create_async_engine(
            ASYNC_TEST_DATABASE_URL,
            echo=False,
        )
        TestAsyncSessionMaker = async_sessionmaker(
            test_async_engine,
            class_=AsyncSession,
            expire_on_commit=False,
        )

        async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
            async with TestAsyncSessionMaker() as session:
                yield session

        app.dependency_overrides[get_db] = override_get_db
        yield app
        app.dependency_overrides.clear()

@pytest.fixture(scope="function")
def db_session() -> Generator[Session, None, None]:
    """Create a fresh database session for each test."""
    engine = create_engine(SYNC_TEST_DATABASE_URL)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        engine.dispose()

@pytest.fixture
def admin_role(db_session: Session) -> Role:
    """Create an admin role with all necessary permissions."""
    role = Role(
        id=uuid.uuid4(),
        name="admin",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db_session.add(role)
    db_session.flush()

    permissions = [
        "users:read", "users:manage",
        "roles:read", "roles:manage",
        "permissions:read", "permissions:manage",
        "audit:read", "files:read", "analytics:read"
    ]
    
    for perm_name in permissions:
        perm = Permission(
            id=uuid.uuid4(),
            name=perm_name,
            description=f"Permission to {perm_name}",
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        db_session.add(perm)
        db_session.flush()
        db_session.execute(
            role_permission.insert().values(role_id=role.id, permission_id=perm.id)
        )

    db_session.commit()
    db_session.refresh(role)
    return role

@pytest.fixture
def hr_role(db_session: Session) -> Role:
    """Create an HR role."""
    role = Role(
        id=uuid.uuid4(),
        name="hr",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db_session.add(role)
    db_session.commit()
    db_session.refresh(role)
    return role

@pytest.fixture
def admin_user(db_session: Session, admin_role: Role) -> User:
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
    db_session.commit()
    db_session.refresh(user)
    return user

@pytest.fixture
def regular_user(db_session: Session, hr_role: Role) -> User:
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
    db_session.commit()
    db_session.refresh(user)
    return user

@pytest.fixture
def permission(db_session: Session) -> Permission:
    """Create a test permission."""
    perm = Permission(
        id=uuid.uuid4(),
        name="test:permission",
        description="Test permission",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db_session.add(perm)
    db_session.commit()
    db_session.refresh(perm)
    return perm

@pytest.fixture
def second_role(db_session: Session, permission: Permission) -> Role:
    """Create a second role with a permission."""
    role = Role(
        id=uuid.uuid4(),
        name="editor",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db_session.add(role)
    db_session.flush()

    db_session.execute(
        role_permission.insert().values(role_id=role.id, permission_id=permission.id)
    )
    db_session.commit()
    db_session.refresh(role)
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
