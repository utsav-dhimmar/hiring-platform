"""
Admin Service Module.

Provides business logic layer for admin operations including user management,
role management, permission management, audit logging, and analytics reporting.
"""

import uuid
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.v1.core.logging import get_logger
from app.v1.core.security import hash_password
from app.v1.db.models.audit_logs import AuditLog
from app.v1.db.models.candidates import Candidate
from app.v1.db.models.jobs import Job
from app.v1.db.models.permissions import Permission
from app.v1.db.models.roles import Role
from app.v1.db.models.skills import Skill
from app.v1.db.models.user import User
from app.v1.repository.admin_repository import admin_repository
from app.v1.repository.candidate_repository import candidate_repository
from app.v1.repository.job_repository import job_repository
from app.v1.repository.skill_repository import skill_repository
from app.v1.schemas.admin import (
    AnalyticsSummary,
    HiringReport,
    PermissionCreate,
    RoleCreate,
    RoleUpdate,
    UserAdminCreate,
    UserAdminUpdate,
)
from app.v1.schemas.job import JobCreate, JobUpdate
from app.v1.schemas.skill import SkillCreate, SkillRead, SkillUpdate
from app.v1.schemas.upload import (
    CandidateResponse,
    ResumeMatchAnalysis,
)

logger = get_logger(__name__)


class AdminService:
    """
    Service for admin-level business operations.

    Handles user management, role management, permission management,
    audit logging, and analytics with proper authorization checks and validation.
    """

    async def log_action(
        self,
        db: AsyncSession,
        user_id: uuid.UUID,
        action: str,
        target_type: str | None = None,
        target_id: uuid.UUID | None = None,
        details: dict | None = None,
    ) -> None:
        """
        Log an admin action to the audit log.

        @param db - Database session
        @param user_id - Unique identifier of the user performing the action
        @param action - Type of action being performed
        @param target_type - Type of target entity (user, role, permission, etc.)
        @param target_id - Unique identifier of the target entity
        @param details - Additional details about the action
        """
        audit_log = AuditLog(
            user_id=user_id,
            action=action,
            target_type=target_type,
            target_id=target_id,
            details=details,
        )
        await admin_repository.create_audit_log(db=db, audit_log=audit_log)

    async def get_all_users(
        self, db: AsyncSession, skip: int = 0, limit: int = 100
    ) -> list[User]:
        """
        Retrieve all users with pagination.

        @param db - Database session
        @param skip - Number of records to skip for pagination
        @param limit - Maximum number of records to return
        @returns List of User objects
        """
        return await admin_repository.get_all_users(db=db, skip=skip, limit=limit)

    async def get_user_by_id(self, db: AsyncSession, user_id: uuid.UUID) -> User:
        """
        Retrieve a user by their unique identifier.

        @param db - Database session
        @param user_id - Unique identifier of the user
        @returns User object
        @throws HTTPException 404 if user not found
        """
        user = await admin_repository.get_user_by_id(db=db, user_id=user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found.",
            )
        return user

    async def create_user(
        self,
        db: AsyncSession,
        admin_user_id: uuid.UUID,
        user_in: UserAdminCreate,
    ) -> User:
        """
        Create a new user with the provided details.

        @param db - Database session
        @param admin_user_id - Unique identifier of the admin creating the user
        @param user_in - User creation data
        @returns Created user object
        @throws HTTPException 400 if email already exists or role not found
        """
        existing_user = await admin_repository.get_user_by_email(
            db=db, email=user_in.email
        )
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User with this email already exists.",
            )

        role = await admin_repository.get_role_by_id(db=db, role_id=user_in.role_id)
        if not role:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Role not found.",
            )

        user = User(
            email=user_in.email,
            password_hash=hash_password(user_in.password),
            full_name=user_in.full_name,
            is_active=user_in.is_active,
            role_id=user_in.role_id,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

        await self.log_action(
            db=db,
            user_id=admin_user_id,
            action="create_user",
            target_type="user",
            target_id=user.id,
            details={"email": user.email, "role_id": str(user.role_id)},
        )

        logger.info(f"Admin created user with email: {user.email}")
        return user

    async def update_user(
        self,
        db: AsyncSession,
        admin_user_id: uuid.UUID,
        user_id: uuid.UUID,
        user_update: UserAdminUpdate,
    ) -> User:
        """
        Update an existing user's details.

        @param db - Database session
        @param admin_user_id - Unique identifier of the admin performing the update
        @param user_id - Unique identifier of the user to update
        @param user_update - User update data
        @returns Updated user object
        @throws HTTPException 404 if user not found, 400 if role not found
        """
        user = await admin_repository.get_user_by_id(db=db, user_id=user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found.",
            )

        if user_update.role_id:
            role = await admin_repository.get_role_by_id(
                db=db, role_id=user_update.role_id
            )
            if not role:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Role not found.",
                )

        update_data = user_update.model_dump(exclude_unset=True)
        updated_user = await admin_repository.update_user(
            db=db, user=user, update_data=update_data
        )

        await self.log_action(
            db=db,
            user_id=admin_user_id,
            action="update_user",
            target_type="user",
            target_id=user.id,
            details={"updated_fields": list(update_data.keys())},
        )

        return updated_user

    async def delete_user(
        self, db: AsyncSession, admin_user_id: uuid.UUID, user_id: uuid.UUID
    ) -> None:
        """
        Delete a user from the system.

        @param db - Database session
        @param admin_user_id - Unique identifier of the admin deleting the user
        @param user_id - Unique identifier of the user to delete
        @throws HTTPException 404 if user not found, 400 if attempting to delete own account
        """
        user = await admin_repository.get_user_by_id(db=db, user_id=user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found.",
            )

        if user.id == admin_user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete your own account.",
            )

        await self.log_action(
            db=db,
            user_id=admin_user_id,
            action="delete_user",
            target_type="user",
            target_id=user.id,
            details={"email": user.email},
        )

        await admin_repository.delete_user(db=db, user=user)
        logger.info(f"Admin deleted user with email: {user.email}")

    async def get_all_roles(
        self, db: AsyncSession, skip: int = 0, limit: int = 100
    ) -> list[Role]:
        """
        Retrieve all roles with pagination.

        @param db - Database session
        @param skip - Number of records to skip for pagination
        @param limit - Maximum number of records to return
        @returns List of Role objects
        """
        return await admin_repository.get_all_roles(db=db, skip=skip, limit=limit)

    async def get_role_by_id(self, db: AsyncSession, role_id: uuid.UUID) -> Role:
        """
        Retrieve a role by its unique identifier.

        @param db - Database session
        @param role_id - Unique identifier of the role
        @returns Role object
        @throws HTTPException 404 if role not found
        """
        role = await admin_repository.get_role_by_id(db=db, role_id=role_id)
        if not role:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Role not found.",
            )
        return role

    async def create_role(
        self, db: AsyncSession, admin_user_id: uuid.UUID, role_in: RoleCreate
    ) -> Role:
        """
        Create a new role with optional permissions.

        @param db - Database session
        @param admin_user_id - Unique identifier of the admin creating the role
        @param role_in - Role creation data including optional permission IDs
        @returns Created role object with assigned permissions
        @throws HTTPException 400 if role name already exists
        """
        existing_role = await admin_repository.get_role_by_name(
            db=db, name=role_in.name
        )
        if existing_role:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Role with this name already exists.",
            )

        role = Role(name=role_in.name)
        db.add(role)
        await db.commit()
        await db.refresh(role)

        if role_in.permission_ids:
            role = await admin_repository.assign_permissions_to_role(
                db=db, role=role, permission_ids=role_in.permission_ids
            )
        else:
            # Re-fetch with permissions even if none assigned to avoid lazy loading
            role = await admin_repository.get_role_by_id(db=db, role_id=role.id)

        await self.log_action(
            db=db,
            user_id=admin_user_id,
            action="create_role",
            target_type="role",
            target_id=role.id,
            details={"name": role.name},
        )

        logger.info(f"Admin created role: {role.name}")
        return role

    async def update_role(
        self,
        db: AsyncSession,
        admin_user_id: uuid.UUID,
        role_id: uuid.UUID,
        role_update: RoleUpdate,
    ) -> Role:
        """
        Update an existing role's details and permissions.

        @param db - Database session
        @param admin_user_id - Unique identifier of the admin performing the update
        @param role_id - Unique identifier of the role to update
        @param role_update - Role update data including optional permission IDs
        @returns Updated role object
        @throws HTTPException 404 if role not found
        """
        role = await admin_repository.get_role_by_id(db=db, role_id=role_id)
        if not role:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Role not found.",
            )

        update_data = role_update.model_dump(exclude_unset=True)
        permission_ids = update_data.pop("permission_ids", None)

        if update_data:
            role = await admin_repository.update_role(
                db=db, role=role, update_data=update_data
            )

        if permission_ids is not None:
            role = await admin_repository.assign_permissions_to_role(
                db=db, role=role, permission_ids=permission_ids
            )

        await self.log_action(
            db=db,
            user_id=admin_user_id,
            action="update_role",
            target_type="role",
            target_id=role.id,
            details={
                "updated_fields": list(
                    role_update.model_dump(exclude_unset=True).keys()
                )
            },
        )

        return role

    async def delete_role(
        self, db: AsyncSession, admin_user_id: uuid.UUID, role_id: uuid.UUID
    ) -> None:
        """
        Delete a role from the system.

        @param db - Database session
        @param admin_user_id - Unique identifier of the admin deleting the role
        @param role_id - Unique identifier of the role to delete
        @throws HTTPException 404 if role not found, 400 if users are assigned to this role
        """
        role = await admin_repository.get_role_by_id(db=db, role_id=role_id)
        if not role:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Role not found.",
            )

        users_with_role = await admin_repository.get_all_users(db=db)
        users_count = len([u for u in users_with_role if u.role_id == role_id])
        if users_count > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot delete role. {users_count} user(s) have this role.",
            )

        await self.log_action(
            db=db,
            user_id=admin_user_id,
            action="delete_role",
            target_type="role",
            target_id=role.id,
            details={"name": role.name},
        )

        await admin_repository.delete_role(db=db, role=role)
        logger.info(f"Admin deleted role: {role.name}")

    async def get_all_permissions(
        self, db: AsyncSession, skip: int = 0, limit: int = 100
    ) -> list[Permission]:
        """
        Retrieve all permissions with pagination.

        @param db - Database session
        @param skip - Number of records to skip for pagination
        @param limit - Maximum number of records to return
        @returns List of Permission objects
        """
        return await admin_repository.get_all_permissions(db=db, skip=skip, limit=limit)

    async def create_permission(
        self,
        db: AsyncSession,
        admin_user_id: uuid.UUID,
        permission_in: PermissionCreate,
    ) -> Permission:
        """
        Create a new permission.

        @param db - Database session
        @param admin_user_id - Unique identifier of the admin creating the permission
        @param permission_in - Permission creation data
        @returns Created permission object
        @throws HTTPException 400 if permission name already exists
        """
        existing = await admin_repository.get_permission_by_name(
            db=db, name=permission_in.name
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Permission with this name already exists.",
            )

        permission = Permission(
            name=permission_in.name,
            description=permission_in.description,
        )
        db.add(permission)
        await db.commit()
        await db.refresh(permission)

        await self.log_action(
            db=db,
            user_id=admin_user_id,
            action="create_permission",
            target_type="permission",
            target_id=permission.id,
            details={"name": permission.name},
        )

        logger.info(f"Admin created permission: {permission.name}")
        return permission

    async def delete_permission(
        self,
        db: AsyncSession,
        admin_user_id: uuid.UUID,
        permission_id: uuid.UUID,
    ) -> None:
        """
        Delete a permission from the system.

        @param db - Database session
        @param admin_user_id - Unique identifier of the admin deleting the permission
        @param permission_id - Unique identifier of the permission to delete
        @throws HTTPException 404 if permission not found
        """
        permission = await admin_repository.get_permission_by_id(
            db=db, permission_id=permission_id
        )
        if not permission:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Permission not found.",
            )

        await self.log_action(
            db=db,
            user_id=admin_user_id,
            action="delete_permission",
            target_type="permission",
            target_id=permission.id,
            details={"name": permission.name},
        )

        await admin_repository.delete_permission(db=db, permission=permission)
        logger.info(f"Admin deleted permission: {permission.name}")

    async def get_audit_logs(
        self, db: AsyncSession, skip: int = 0, limit: int = 100
    ) -> list[AuditLog]:
        """
        Retrieve all audit logs with pagination.

        @param db - Database session
        @param skip - Number of records to skip for pagination
        @param limit - Maximum number of records to return
        @returns List of AuditLog objects
        """
        return await admin_repository.get_audit_logs(db=db, skip=skip, limit=limit)

    async def get_recent_uploads(
        self, db: AsyncSession, skip: int = 0, limit: int = 50
    ) -> list[Any]:
        """
        Retrieve recent file uploads.

        @param db - Database session
        @param skip - Number of records to skip for pagination
        @param limit - Maximum number of records to return
        @returns List of File objects
        """
        return await admin_repository.get_recent_uploads(db=db, skip=skip, limit=limit)

    async def get_analytics_summary(self, db: AsyncSession) -> AnalyticsSummary:
        """
        Get analytics summary with system statistics.

        @param db - Database session
        @returns AnalyticsSummary with counts for users, roles, permissions, jobs, candidates, and resumes
        """
        data = await admin_repository.get_analytics_summary(db=db)
        return AnalyticsSummary(**data)

    async def get_hiring_report(self, db: AsyncSession) -> HiringReport:
        """
        Get detailed hiring analytics report.

        @param db - Database session
        @returns HiringReport with job statistics, candidate metrics, and resume performance data
        """
        data = await admin_repository.get_hiring_report(db=db)
        return HiringReport(**data)

    # Job Management
    async def get_all_jobs(
        self, db: AsyncSession, skip: int = 0, limit: int = 100
    ) -> list[Job]:
        """Get all jobs with pagination."""
        result = await job_repository.get_multi(db=db, skip=skip, limit=limit)
        return result["data"]

    async def get_job_by_id(self, db: AsyncSession, job_id: uuid.UUID) -> Job:
        """Get a job by ID."""
        job = await job_repository.get(db=db, id=job_id)
        if not job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Job not found.",
            )
        return job

    async def create_job(
        self, db: AsyncSession, admin_user_id: uuid.UUID, job_in: JobCreate
    ) -> Job:
        """Create a new job."""
        job = await job_repository.create(db=db, object=job_in, created_by=admin_user_id)
        await self.log_action(
            db=db,
            user_id=admin_user_id,
            action="create_job",
            target_type="job",
            target_id=job.id,
            details={"title": job.title},
        )
        return job

    async def update_job(
        self,
        db: AsyncSession,
        admin_user_id: uuid.UUID,
        job_id: uuid.UUID,
        job_update: JobUpdate,
    ) -> Job:
        """Update a job."""
        _job = await self.get_job_by_id(db=db, job_id=job_id)
        updated_job = await job_repository.update(db=db, id=job_id, object=job_update)
        await self.log_action(
            db=db,
            user_id=admin_user_id,
            action="update_job",
            target_type="job",
            target_id=job_id,
            details={
                "updated_fields": list(job_update.model_dump(exclude_unset=True).keys())
            },
        )
        return updated_job

    async def delete_job(
        self, db: AsyncSession, admin_user_id: uuid.UUID, job_id: uuid.UUID
    ) -> None:
        """Delete a job."""
        await self.get_job_by_id(db=db, job_id=job_id)
        await job_repository.delete(db=db, id=job_id)
        await self.log_action(
            db=db,
            user_id=admin_user_id,
            action="delete_job",
            target_type="job",
            target_id=job_id,
        )

    # Skill Management
    async def get_all_skills(self, db: AsyncSession, skip: int = 0, limit: int = 100):
        """Get all skills with pagination."""
        result = await skill_repository.crud.get_multi(db=db, offset=skip, limit=limit)
        return result["data"]

    async def get_skill_by_id(self, db: AsyncSession, skill_id: uuid.UUID) -> Skill:
        """Get a skill by ID."""
        skill = await skill_repository.crud.get(db=db, id=skill_id)
        if not skill:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Skill not found.",
            )
        return skill

    async def create_skill(
        self, db: AsyncSession, admin_user_id: uuid.UUID, skill_in: SkillCreate
    ) -> Skill:
        """Create a new skill."""
        skill = await skill_repository.crud.create(db=db, object=skill_in)
        await self.log_action(
            db=db,
            user_id=admin_user_id,
            action="create_skill",
            target_type="skill",
            target_id=skill.id,
            details={"name": skill.name},
        )
        return skill

    async def update_skill(
        self,
        db: AsyncSession,
        admin_user_id: uuid.UUID,
        skill_id: uuid.UUID,
        skill_update: SkillUpdate,
    ) -> Skill | SkillRead:
        """Update a skill."""
        existing_skill = await self.get_skill_by_id(db=db, skill_id=skill_id)
        update_data = skill_update.model_dump(exclude_unset=True)

        if not update_data:
            return existing_skill

        updated_skill = await skill_repository.crud.update(
            db=db,
            id=skill_id,
            object=update_data,
            schema_to_select=SkillRead,
            return_as_model=True,
            one_or_none=True,
        )
        if updated_skill is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Skill not found.",
            )
        await self.log_action(
            db=db,
            user_id=admin_user_id,
            action="update_skill",
            target_type="skill",
            target_id=skill_id,
            details={
                "updated_fields": list(update_data.keys())
            },
        )
        return updated_skill

    async def delete_skill(
        self, db: AsyncSession, admin_user_id: uuid.UUID, skill_id: uuid.UUID
    ) -> None:
        """Delete a skill."""
        await self.get_skill_by_id(db=db, skill_id=skill_id)
        await skill_repository.crud.delete(db=db, id=skill_id)
        await self.log_action(
            db=db,
            user_id=admin_user_id,
            action="delete_skill",
            target_type="skill",
            target_id=skill_id,
        )

    # Candidate Management for specific Job
    async def get_candidates_for_job(
        self,
        db: AsyncSession,
        job_id: uuid.UUID,
        skip: int = 0,
        limit: int = 100,
    ) -> list[CandidateResponse]:
        """Get all candidates for a specific job."""
        from sqlalchemy import select
        from sqlalchemy.orm import selectinload

        stmt = (
            select(Candidate)
            .where(Candidate.applied_job_id == job_id)
            .options(selectinload(Candidate.resumes))
            .offset(skip)
            .limit(limit)
        )
        result = await db.execute(stmt)
        candidates = list(result.scalars().all())
        return [self._map_candidate_to_response(c) for c in candidates]

    async def search_candidates_for_job(
        self,
        db: AsyncSession,
        job_id: uuid.UUID,
        query: str,
        skip: int = 0,
        limit: int = 100,
    ) -> list[CandidateResponse]:
        """Search candidates for a specific job."""
        candidates = await candidate_repository.search_candidates_for_job(
            db=db, job_id=job_id, query=query, skip=skip, limit=limit
        )
        return [self._map_candidate_to_response(c) for c in candidates]

    async def search_candidates(
        self,
        db: AsyncSession,
        query: str,
        skip: int = 0,
        limit: int = 100,
    ) -> list[CandidateResponse]:
        """Search candidates across all jobs."""
        from sqlalchemy import or_, select
        from sqlalchemy.orm import selectinload

        search_filter = or_(
            Candidate.first_name.ilike(f"%{query}%"),
            Candidate.last_name.ilike(f"%{query}%"),
            Candidate.email.ilike(f"%{query}%"),
        )

        stmt = (
            select(Candidate)
            .where(search_filter)
            .options(selectinload(Candidate.resumes))
            .offset(skip)
            .limit(limit)
        )

        result = await db.execute(stmt)
        candidates = list(result.scalars().all())
        return [self._map_candidate_to_response(c) for c in candidates]

    def _map_candidate_to_response(self, candidate: Candidate) -> CandidateResponse:
        """Helper to map Candidate model to CandidateResponse schema."""
        resumes = getattr(candidate, "resumes", [])
        latest_resume = (
            max(resumes, key=lambda resume: resume.uploaded_at) if resumes else None
        )

        analysis = None
        is_parsed = False
        resume_score = None
        pass_fail = None
        processing_status = None

        if latest_resume:
            is_parsed = bool(latest_resume.parsed)
            resume_score = latest_resume.resume_score
            pass_fail = latest_resume.pass_fail
            parse_summary = latest_resume.parse_summary or {}

            processing_info = parse_summary.get("processing", {})
            if isinstance(processing_info, dict):
                processing_status = processing_info.get("status")

            analysis_payload = parse_summary.get("analysis")
            if isinstance(analysis_payload, dict):
                analysis = ResumeMatchAnalysis.model_validate(analysis_payload)

        return CandidateResponse(
            id=candidate.id,
            first_name=candidate.first_name,
            last_name=candidate.last_name,
            email=candidate.email,
            phone=candidate.phone,
            current_status=candidate.current_status,
            created_at=candidate.created_at,
            resume_analysis=analysis,
            resume_score=resume_score,
            pass_fail=pass_fail,
            is_parsed=is_parsed,
            processing_status=processing_status,
        )


admin_service = AdminService()
