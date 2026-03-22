"""
Helper to seed and resolve Department records.
"""

from sqlalchemy import select

from app.v1.db.models.departments import Department
from app.v1.utils.uuid import UUIDHelper


async def ensure_department(session, name: str, description: str | None = None) -> Department:
    """Get or create a department by name.

    Args:
        session: SQLAlchemy async session.
        name: Department name (unique).
        description: Optional description.

    Returns:
        The existing or newly created Department ORM object.
    """
    existing = (
        await session.execute(select(Department).where(Department.name == name))
    ).scalar_one_or_none()

    if existing:
        return existing

    dept = Department(
        id=UUIDHelper.generate_uuid7(),
        name=name,
        description=description,
    )
    session.add(dept)
    await session.flush()
    return dept
