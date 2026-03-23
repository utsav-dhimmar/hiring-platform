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
DEFAULT_PERMISSIONS = [
    {"name": "admin:all", "description": "Full administrative access."},
    {"name": "admin:access", "description": "Access to admin dashboard."},
    {"name": "users:read", "description": "View users list and details."},
    {"name": "users:manage", "description": "Create, update, and delete users."},
    {"name": "roles:read", "description": "View roles and their permissions."},
    {"name": "roles:manage", "description": "Create, update, and delete roles."},
    {"name": "permissions:read", "description": "View available permissions."},
    {"name": "permissions:manage", "description": "Create and delete permissions."},
    {"name": "jobs:access", "description": "View jobs list and details."},
    {"name": "jobs:manage", "description": "Create, update, and delete jobs."},
    {"name": "skills:access", "description": "View skills list and details."},
    {"name": "skills:manage", "description": "Create, update, and delete skills."},
    {"name": "departments:access", "description": "View departments list and details."},
    {"name": "departments:manage", "description": "Create, update, and delete departments."},
    {"name": "audit:read", "description": "View system audit logs."},
    {"name": "files:read", "description": "View uploaded files and resumes."},
    {"name": "analytics:read", "description": "View hiring analytics and reports."},
]


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


async def ensure_permissions(session) -> list[Permission]:
    now = utc_now()

    # Get existing permissions
    existing_perms = (await session.execute(select(Permission))).scalars().all()
    existing_names = {p.name for p in existing_perms}

    new_permissions = []
    for perm_data in DEFAULT_PERMISSIONS:
        if perm_data["name"] not in existing_names:
            permission = Permission(
                name=perm_data["name"],
                description=perm_data["description"],
                created_at=now,
                updated_at=now,
            )
            session.add(permission)
            new_permissions.append(permission)

    if new_permissions:
        await session.flush()

    # Return all permissions (existing + new)
    all_perms = (await session.execute(select(Permission))).scalars().all()
    return list(all_perms)


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
