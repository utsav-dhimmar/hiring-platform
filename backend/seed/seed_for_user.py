import asyncio
import os
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.v1.core.security import hash_password
from app.v1.db import Role, User
from app.v1.db.session import async_session_maker, init_db

SOURCE_ROLE_CANDIDATES = (
    os.getenv("SOURCE_ROLE_NAME", "superadmin"),
    "admin",
)
TARGET_ROLE_NAME = "dev_test"
USER_EMAIL = "utsav@gmail.com"
USER_PASSWORD = "123456789"
USER_FULL_NAME = "utsav dhimmar"


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


async def get_admin_role(session) -> Role:
    for role_name in SOURCE_ROLE_CANDIDATES:
        admin_role = (
            await session.execute(
                select(Role)
                .where(Role.name == role_name)
                .options(selectinload(Role.permissions)),
            )
        ).scalar_one_or_none()

        if admin_role:
            return admin_role

    candidates = ", ".join(SOURCE_ROLE_CANDIDATES)
    raise RuntimeError(f"Source role not found ({candidates}). Run seed.py first.")


async def ensure_dev_test_role(session, admin_role: Role) -> Role:
    now = utc_now()
    role = (
        await session.execute(
            select(Role)
            .where(Role.name == TARGET_ROLE_NAME)
            .options(selectinload(Role.permissions)),
        )
    ).scalar_one_or_none()

    if not role:
        role = Role(
            name=TARGET_ROLE_NAME,
            created_at=now,
            updated_at=now,
        )
        session.add(role)
        await session.flush()
        await session.refresh(role, attribute_names=["permissions"])
    else:
        role.updated_at = now

    role.permissions = list(admin_role.permissions)
    await session.flush()
    return role


async def ensure_user(session, role: Role) -> User:
    now = utc_now()
    user = (
        await session.execute(
            select(User).where(User.email == USER_EMAIL),
        )
    ).scalar_one_or_none()

    if user:
        user.full_name = USER_FULL_NAME
        user.password_hash = hash_password(USER_PASSWORD)
        user.is_active = True
        user.role_id = role.id
        user.updated_at = now
        await session.flush()
        return user

    user = User(
        email=USER_EMAIL,
        full_name=USER_FULL_NAME,
        password_hash=hash_password(USER_PASSWORD),
        is_active=True,
        role_id=role.id,
        created_at=now,
        updated_at=now,
    )
    session.add(user)
    await session.flush()
    return user


async def main():
    await init_db()

    async with async_session_maker() as session:
        admin_role = await get_admin_role(session)
        role = await ensure_dev_test_role(session, admin_role)
        user = await ensure_user(session, role)
        await session.commit()

        print(f"User ready: {user.email}")
        print(f"Role: {role.name}")
        print(f"Permissions copied: {len(role.permissions)}")


if __name__ == "__main__":
    asyncio.run(main())
