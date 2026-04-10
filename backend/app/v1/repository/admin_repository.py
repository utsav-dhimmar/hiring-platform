"""
Admin Repository Module.

Provides data access layer for admin operations including user management,
role management, permission management, audit logs, and analytics reporting.
"""

import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import and_, desc, func, or_, select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.v1.db.models.audit_logs import AuditLog
from app.v1.db.models.candidates import Candidate
from app.v1.db.models.files import File
from app.v1.db.models.jobs import Job
from app.v1.db.models.hr_decisions import HrDecision
from app.v1.db.models.permissions import Permission
from app.v1.db.models.resumes import Resume
from app.v1.db.models.roles import Role
from app.v1.db.models.user import User
from app.v1.db.models.cross_job_matches import CrossJobMatch


class AdminRepository:
    """
    Repository for admin-level database operations.

    Handles CRUD operations for users, roles, permissions, audit logs,
    and provides analytics and reporting queries for administrative purposes.
    """

    async def get_all_users(
        self,
        db: AsyncSession,
        skip: int = 0,
        limit: int = 100,
        search: str | None = None,
    ) -> list[User]:
        """
        Retrieve all users with pagination.

        @param db - Database session
        @param skip - Number of records to skip for pagination
        @param limit - Maximum number of records to return
        @returns List of User objects ordered by creation date descending
        """
        stmt = select(User).options(selectinload(User.role))
        if search:
            search_term = f"%{search}%"
            stmt = stmt.join(Role, User.role_id == Role.id).where(
                or_(
                    User.email.ilike(search_term),
                    User.full_name.ilike(search_term),
                    Role.name.ilike(search_term),
                )
            )

        result = await db.execute(stmt.offset(skip).limit(limit).order_by(desc(User.created_at)))
        return list(result.scalars().all())

    async def count_all_users(
        self, db: AsyncSession, search: str | None = None
    ) -> int:
        """Get total number of users."""
        stmt = select(func.count(User.id))
        if search:
            search_term = f"%{search}%"
            stmt = stmt.select_from(User).join(Role, User.role_id == Role.id).where(
                or_(
                    User.email.ilike(search_term),
                    User.full_name.ilike(search_term),
                    Role.name.ilike(search_term),
                )
            )
        return await db.scalar(stmt) or 0

    async def get_user_by_id(self, db: AsyncSession, user_id: uuid.UUID) -> User | None:
        """
        Retrieve a user by their unique identifier.

        @param db - Database session
        @param user_id - Unique identifier of the user
        @returns User object if found, None otherwise
        """
        stmt = select(User).options(selectinload(User.role)).where(User.id == user_id)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_user_by_email(self, db: AsyncSession, email: str) -> User | None:
        """
        Retrieve a user by their email address.

        @param db - Database session
        @param email - Email address of the user
        @returns User object if found, None otherwise
        """
        result = await db.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    async def update_user(
        self, db: AsyncSession, user: User, update_data: dict
    ) -> User:
        """
        Update user fields with provided data.

        @param db - Database session
        @param user - User object to update
        @param update_data - Dictionary of fields to update
        @returns Updated user object
        """
        for key, value in update_data.items():
            if value is not None:
                setattr(user, key, value)
        await db.commit()
        await db.refresh(user)
        return user

    async def delete_user(self, db: AsyncSession, user: User) -> None:
        """
        Delete a user from the database.

        @param db - Database session
        @param user - User object to delete
        """
        await db.delete(user)
        await db.commit()

    async def get_all_roles(
        self,
        db: AsyncSession,
        skip: int = 0,
        limit: int = 100,
        search: str | None = None,
    ) -> list[Role]:
        """
        Retrieve all roles with pagination and optional search by name.
        """
        stmt = select(Role)
        if search:
            stmt = stmt.where(Role.name.ilike(f"%{search}%"))

        result = await db.execute(stmt.offset(skip).limit(limit).order_by(Role.name))
        return list(result.scalars().all())

    async def count_all_roles(
        self, db: AsyncSession, search: str | None = None
    ) -> int:
        """Get total number of roles with optional search by name."""
        stmt = select(func.count(Role.id))
        if search:
            stmt = stmt.where(Role.name.ilike(f"%{search}%"))
        return await db.scalar(stmt) or 0

    async def get_role_by_id(self, db: AsyncSession, role_id: uuid.UUID) -> Role | None:
        """
        Retrieve a role by its unique identifier with permissions.

        @param db - Database session
        @param role_id - Unique identifier of the role
        @returns Role object if found, None otherwise
        """
        result = await db.execute(
            select(Role)
            .where(Role.id == role_id)
            .options(selectinload(Role.permissions))
        )
        return result.scalar_one_or_none()

    async def get_role_by_name(self, db: AsyncSession, name: str) -> Role | None:
        """
        Retrieve a role by its name.

        @param db - Database session
        @param name - Name of the role
        @returns Role object if found, None otherwise
        """
        result = await db.execute(select(Role).where(Role.name == name))
        return result.scalar_one_or_none()

    async def create_role(self, db: AsyncSession, role: Role) -> Role:
        """
        Create a new role in the database.

        @param db - Database session
        @param role - Role object to create
        @returns Created role object
        """
        db.add(role)
        await db.commit()
        await db.refresh(role)
        return role

    async def update_role(
        self, db: AsyncSession, role: Role, update_data: dict
    ) -> Role:
        """
        Update role fields with provided data.

        @param db - Database session
        @param role - Role object to update
        @param update_data - Dictionary of fields to update
        @returns Updated role object
        """
        for key, value in update_data.items():
            if value is not None:
                setattr(role, key, value)
        await db.commit()
        await db.refresh(role)
        return role

    async def delete_role(self, db: AsyncSession, role: Role) -> None:
        """
        Delete a role from the database.

        @param db - Database session
        @param role - Role object to delete
        """
        await db.delete(role)
        await db.commit()

    async def get_all_permissions(
        self, db: AsyncSession, skip: int = 0, limit: int = 100
    ) -> list[Permission]:
        """
        Retrieve all permissions with pagination.

        @param db - Database session
        @param skip - Number of records to skip for pagination
        @param limit - Maximum number of records to return
        @returns List of Permission objects ordered by name
        """
        result = await db.execute(
            select(Permission).offset(skip).limit(limit).order_by(Permission.name)
        )
        return list(result.scalars().all())

    async def count_all_permissions(self, db: AsyncSession) -> int:
        """Get total number of permissions."""
        return await db.scalar(select(func.count(Permission.id))) or 0

    async def get_permission_by_id(
        self, db: AsyncSession, permission_id: uuid.UUID
    ) -> Permission | None:
        """
        Retrieve a permission by its unique identifier.

        @param db - Database session
        @param permission_id - Unique identifier of the permission
        @returns Permission object if found, None otherwise
        """
        return await db.get(Permission, permission_id)

    async def get_permission_by_name(
        self, db: AsyncSession, name: str
    ) -> Permission | None:
        """
        Retrieve a permission by its name.

        @param db - Database session
        @param name - Name of the permission
        @returns Permission object if found, None otherwise
        """
        result = await db.execute(select(Permission).where(Permission.name == name))
        return result.scalar_one_or_none()

    async def create_permission(
        self, db: AsyncSession, permission: Permission
    ) -> Permission:
        """
        Create a new permission in the database.

        @param db - Database session
        @param permission - Permission object to create
        @returns Created permission object
        """
        db.add(permission)
        await db.commit()
        await db.refresh(permission)
        return permission

    async def delete_permission(self, db: AsyncSession, permission: Permission) -> None:
        """
        Delete a permission from the database.

        @param db - Database session
        @param permission - Permission object to delete
        """
        await db.delete(permission)
        await db.commit()

    async def assign_permissions_to_role(
        self, db: AsyncSession, role: Role, permission_ids: list[uuid.UUID]
    ) -> Role:
        """
        Assign multiple permissions to a role.

        @param db - Database session
        @param role - Role to assign permissions to
        @param permission_ids - List of permission identifiers to assign
        @returns Updated role with assigned permissions
        """
        permissions = await db.execute(
            select(Permission).where(Permission.id.in_(permission_ids))
        )
        role.permissions = list(permissions.scalars().all())
        await db.commit()
        await db.refresh(role)
        # Re-fetch with selectinload to avoid lazy loading issues in serialize_response
        return await self.get_role_by_id(db, role.id)

    async def get_audit_logs(
        self, db: AsyncSession, skip: int = 0, limit: int = 100, q: str | None = None
    ) -> list[AuditLog]:
        """
        Retrieve all audit logs with pagination and user names.

        @param db - Database session
        @param skip - Number of records to skip for pagination
        @param limit - Maximum number of records to return
        @returns List of AuditLog objects ordered by creation date descending
        """
        stmt = select(AuditLog).options(selectinload(AuditLog.user))
        if q:
            stmt = stmt.where(AuditLog.action.ilike(f"%{q}%"))
        stmt = stmt.offset(skip).limit(limit).order_by(desc(AuditLog.created_at))
        result = await db.execute(stmt)
        return list(result.scalars().all())

    async def count_all_audit_logs(self, db: AsyncSession, q: str | None = None) -> int:
        """Get total number of audit logs, optionally filtered by action."""
        stmt = select(func.count(AuditLog.id))
        if q:
            stmt = stmt.where(AuditLog.action.ilike(f"%{q}%"))
        return await db.scalar(stmt) or 0

    async def get_audit_logs_by_user(
        self,
        db: AsyncSession,
        user_id: uuid.UUID,
        skip: int = 0,
        limit: int = 100,
    ) -> list[AuditLog]:
        """
        Retrieve audit logs for a specific user.

        @param db - Database session
        @param user_id - Unique identifier of the user
        @param skip - Number of records to skip for pagination
        @param limit - Maximum number of records to return
        @returns List of AuditLog objects for the user
        """
        result = await db.execute(
            select(AuditLog)
            .where(AuditLog.user_id == user_id)
            .offset(skip)
            .limit(limit)
            .order_by(desc(AuditLog.created_at))
        )
        return list(result.scalars().all())

    async def create_audit_log(self, db: AsyncSession, audit_log: AuditLog) -> AuditLog:
        """
        Create a new audit log entry.

        @param db - Database session
        @param audit_log - AuditLog object to create
        @returns Created audit log object
        """
        db.add(audit_log)
        await db.commit()
        await db.refresh(audit_log)
        return audit_log

    async def get_recent_uploads(
        self, db: AsyncSession, skip: int = 0, limit: int = 50, q: str | None = None
    ) -> list[File]:
        """
        Retrieve recent file uploads.

        @param db - Database session
        @param skip - Number of records to skip for pagination
        @param limit - Maximum number of records to return
        @returns List of File objects ordered by creation date descending
        """
        stmt = select(File).options(selectinload(File.owner), selectinload(File.candidate))
        if q:
            stmt = stmt.where(File.file_name.ilike(f"%{q}%"))
        stmt = stmt.offset(skip).limit(limit).order_by(desc(File.created_at))
        result = await db.execute(stmt)
        return list(result.scalars().all())

    async def count_recent_uploads(self, db: AsyncSession, q: str | None = None) -> int:
        """Get total number of uploaded files, optionally filtered by file name."""
        stmt = select(func.count(File.id))
        if q:
            stmt = stmt.where(File.file_name.ilike(f"%{q}%"))
        return await db.scalar(stmt) or 0

    async def get_analytics_summary(self, db: AsyncSession) -> dict:
        """
        Get summary statistics for analytics.

        @param db - Database session
        @returns Dictionary containing total counts for users, roles, permissions, jobs, candidates, resumes, and active counts
        """
        total_users = await db.scalar(select(func.count(User.id)))
        total_roles = await db.scalar(select(func.count(Role.id)))
        total_permissions = await db.scalar(select(func.count(Permission.id)))
        total_jobs = await db.scalar(select(func.count(Job.id)))
        total_candidates_native = await db.scalar(select(func.count(Candidate.id))) or 0
        total_candidates_matched = await db.scalar(select(func.count(CrossJobMatch.id))) or 0
        total_candidates = total_candidates_native + total_candidates_matched
        
        total_resumes = (
            await db.scalar(
                select(func.count(Resume.id)).where(Resume.pass_fail.isnot(None))
            )
            or 0
        )
        active_jobs = await db.scalar(select(func.count(Job.id)).where(Job.is_active))
        active_users = await db.scalar(
            select(func.count(User.id)).where(User.is_active)
        )

        # AI Screening Stats from Resumes
        total_passed = (
            await db.scalar(
                select(func.count(Resume.id)).where(Resume.pass_fail.ilike("passed"))
            )
            or 0
        )
        total_failed = (
            await db.scalar(
                select(func.count(Resume.id)).where(Resume.pass_fail.ilike("failed"))
            )
            or 0
        )
        total_pending = (
            await db.scalar(
                select(func.count(Resume.id)).where(
                    or_(
                        and_(Resume.parsed.is_(True), Resume.pass_fail.is_(None)),
                        Resume.pass_fail.ilike("pending")
                    )
                )
            )
            or 0
        )
        total_unprocessed = (
            await db.scalar(
                select(func.count(Resume.id)).where(Resume.parsed.is_(False))
            )
            or 0
        )

        # Subquery to pick only the most recent decision for each candidate
        latest_decisions_stmt = (
            select(HrDecision.candidate_id, HrDecision.decision)
            .distinct(HrDecision.candidate_id)
            .order_by(HrDecision.candidate_id, desc(HrDecision.decided_at))
        ).subquery()

        # Mutually exclusive counts based on LATEST decision
        approved_count = (
            await db.scalar(
                select(func.count())
                .select_from(latest_decisions_stmt)
                .where(latest_decisions_stmt.c.decision == "approve")
            )
            or 0
        )
        maybe_count = (
            await db.scalar(
                select(func.count())
                .select_from(latest_decisions_stmt)
                .where(latest_decisions_stmt.c.decision == "May Be")
            )
            or 0
        )
        reject_count = (
            await db.scalar(
                select(func.count())
                .select_from(latest_decisions_stmt)
                .where(latest_decisions_stmt.c.decision == "reject")
            )
            or 0
        )

        # Unique candidates with any decision
        hr_decision_count = (
            await db.scalar(select(func.count()).select_from(latest_decisions_stmt))
            or 0
        )

        pending_decision_count = max(0, (total_candidates or 0) - hr_decision_count)

        return {
            "total_users": total_users or 0,
            "total_roles": total_roles or 0,
            "total_permissions": total_permissions or 0,
            "total_jobs": total_jobs or 0,
            "total_candidates": total_candidates or 0,
            "total_resumes": total_resumes or 0,
            "total_passed": total_passed,
            "total_failed": total_failed,
            "total_pending": total_pending,
            "total_unprocessed": total_unprocessed,
            "active_jobs": active_jobs or 0,
            "active_users": active_users or 0,
            "approved_count": approved_count,
            "maybe_count": maybe_count,
            "reject_count": reject_count,
            "hr_decision_count": hr_decision_count,
            "pending_decision_count": pending_decision_count,
        }

    async def get_hiring_report(self, db: AsyncSession) -> dict:
        """
        Get detailed hiring analytics report.

        @param db - Database session
        @returns Dictionary with job statistics, candidate counts, resume metrics, and pass rates
        @throws ValueError if database query fails
        """
        total_jobs = await db.scalar(select(func.count(Job.id))) or 0
        active_jobs = (
            await db.scalar(select(func.count(Job.id)).where(Job.is_active)) or 0
        )
        total_candidates_native = await db.scalar(select(func.count(Candidate.id))) or 0
        total_candidates_matched = await db.scalar(select(func.count(CrossJobMatch.id))) or 0
        total_candidates = total_candidates_native + total_candidates_matched

        thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
        resumes_last_30_days = (
            await db.scalar(
                select(func.count(Resume.id)).where(
                    Resume.uploaded_at >= thirty_days_ago
                )
            )
            or 0
        )

        avg_score = await db.scalar(
            select(func.avg(Resume.resume_score)).where(Resume.resume_score.isnot(None))
        )

        # AI Screening Stats from Resumes
        total_passed = (
            await db.scalar(
                select(func.count(Resume.id)).where(Resume.pass_fail.ilike("passed"))
            )
            or 0
        )
        total_failed = (
            await db.scalar(
                select(func.count(Resume.id)).where(Resume.pass_fail.ilike("failed"))
            )
            or 0
        )
        total_pending = (
            await db.scalar(
                select(func.count(Resume.id)).where(
                    or_(
                        and_(Resume.parsed.is_(True), Resume.pass_fail.is_(None)),
                        Resume.pass_fail.ilike("pending")
                    )
                )
            )
            or 0
        )
        total_unprocessed = (
            await db.scalar(
                select(func.count(Resume.id)).where(Resume.parsed.is_(False))
            )
            or 0
        )

        # HR Decisions and Pending stats (using the consolidated HrDecision table)
        hr_decided_count = (
            await db.scalar(select(func.count(func.distinct(HrDecision.candidate_id))))
            or 0
        )
        pending_count = max(0, total_candidates - hr_decided_count)

        jobs_result = await db.execute(
            select(Job).order_by(Job.created_at.desc()).limit(20)
        )
        jobs = list(jobs_result.scalars().all())

        candidates_by_job = []
        for job in jobs:
            native_count = (
                await db.scalar(
                    select(func.count(Candidate.id)).where(
                        Candidate.applied_job_id == job.id
                    )
                )
                or 0
            )
            matched_count = (
                await db.scalar(
                    select(func.count(CrossJobMatch.id)).where(
                        CrossJobMatch.matched_job_id == job.id
                    )
                )
                or 0
            )
            
            candidates_by_job.append(
                {
                    "job_id": str(job.id),
                    "job_title": job.title,
                    "department": job.department.name if job.department else None,
                    "candidate_count": native_count + matched_count,
                }
            )

        return {
            "total_jobs": total_jobs,
            "active_jobs": active_jobs,
            "total_candidates": total_candidates,
            "total_passed": total_passed,
            "total_failed": total_failed,
            "total_pending": total_pending,
            "total_unprocessed": total_unprocessed,
            "candidates_by_job": candidates_by_job,
            "resumes_uploaded_last_30_days": resumes_last_30_days,
            "average_resume_score": float(avg_score) if avg_score else None,
            "hr_decided_count": hr_decided_count,
            "pending_count": pending_count,
        }


admin_repository = AdminRepository()
