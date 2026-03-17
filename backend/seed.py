import asyncio
import os
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.v1.core.security import hash_password
from app.v1.db import Permission, Role, User
from app.v1.db.session import async_session_maker, init_db

ADMIN_ROLE_NAME = os.getenv("ADMIN_ROLE_NAME", "admin")
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@example.com")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin123")
ADMIN_FULL_NAME = os.getenv("ADMIN_FULL_NAME", "System Admin")
FALLBACK_PERMISSION_NAME = "admin:all"
FALLBACK_PERMISSION_DESCRIPTION = "Full administrative access."


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


async def ensure_permissions(session) -> list[Permission]:
    now = utc_now()
    permissions = list(
        (
            await session.execute(
                select(Permission).order_by(Permission.name),
            )
        ).scalars()
    )

    if permissions:
        return permissions

    permission = Permission(
        name=FALLBACK_PERMISSION_NAME,
        description=FALLBACK_PERMISSION_DESCRIPTION,
        created_at=now,
        updated_at=now,
    )
    session.add(permission)
    await session.flush()
    return [permission]


async def ensure_admin_role(session, permissions: list[Permission]) -> Role:
    now = utc_now()
    role = (
        await session.execute(
            select(Role)
            .where(Role.name == ADMIN_ROLE_NAME)
            .options(selectinload(Role.permissions)),
        )
    ).scalar_one_or_none()

    if not role:
        role = Role(
            name=ADMIN_ROLE_NAME,
            created_at=now,
            updated_at=now,
        )
        session.add(role)
        await session.flush()
        await session.refresh(role, attribute_names=["permissions"])
    else:
        role.updated_at = now

    existing_permission_ids = {permission.id for permission in role.permissions}
    for permission in permissions:
        if permission.id not in existing_permission_ids:
            role.permissions.append(permission)

    await session.flush()
    return role


async def ensure_admin_user(session, role: Role) -> User:
    now = utc_now()
    user = (
        await session.execute(
            select(User).where(User.email == ADMIN_EMAIL),
        )
    ).scalar_one_or_none()

    if user:
        user.full_name = ADMIN_FULL_NAME
        user.password_hash = hash_password(ADMIN_PASSWORD)
        user.is_active = True
        user.role_id = role.id
        user.updated_at = now
        await session.flush()
        return user

    user = User(
        email=ADMIN_EMAIL,
        full_name=ADMIN_FULL_NAME,
        password_hash=hash_password(ADMIN_PASSWORD),
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
        permissions = await ensure_permissions(session)
        role = await ensure_admin_role(session, permissions)
        user = await ensure_admin_user(session, role)
        await session.commit()

        print(f"Admin user ready: {user.email}")
        print(f"Role: {role.name}")
        print(f"Permissions synced: {len(role.permissions)}")


if __name__ == "__main__":
    asyncio.run(main())
