import uuid
from typing import Any

from app.v1.db.models.jobs import Job
from app.v1.repository.job_repository import job_repository
from app.v1.schemas.job import (
    JobCreate,
    JobStatusUpdate,
    JobUpdate,
    JobRead,
    JobsListRead,
    JobActivityHistoryResponse,
    JobActivitySession,
)
from app.v1.services.admin.audit_service import audit_service
from app.v1.services.admin.department_service import department_service
from app.v1.services.admin.skill_service import skill_service
from app.v1.services.user_service import user_service
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession


class JobAdminService:
    """
    Service for admin-level job management operations.
    """

    async def get_all_jobs(
        self, db: AsyncSession, skip: int = 0, limit: int = 100, query: str | None = None
    ) -> JobsListRead:
        """Get all jobs with pagination and global dashboard summaries."""
        result = await job_repository.get_multi(
            db=db, skip=skip, limit=limit, query=query
        )

        from app.v1.services.hr_decision_service import hr_decision_service

        job_reads = []
        for job in result["data"]:
            job_read = JobRead.model_validate(job)
            # Add per-job automated screening summary
            job_read.automated_screening_summary = (
                await hr_decision_service.get_job_screening_summary(db, job.id)
            )
            # Add per-job decision summary (Attaching for dashboard parity)
            decision_summary = await hr_decision_service.get_job_decision_summary(db, job.id)
            job_read.decision_summary = decision_summary.model_dump()

            # Add total and current session counts (Enabled session history for list view)
            stats = await self._calculate_job_activity_stats(db, job.id, include_sessions=True)
            job_read.total_candidates = stats["total_candidates"]
            job_read.current_session_candidates = stats["current_session_count"]
            job_read.activity_sessions = stats["sessions"]
            
            job_reads.append(job_read)

        return JobsListRead(
            data=job_reads,
            total=result["total"],
            global_decision_summary=await hr_decision_service.get_global_decision_summary(
                db
            ),
            global_screening_summary=await hr_decision_service.get_global_screening_summary(
                db
            ),
        )

    async def search_jobs(
        self, db: AsyncSession, query: str, skip: int = 0, limit: int = 100
    ) -> JobsListRead:
        """Search jobs with global and per-job screening summaries."""
        result = await job_repository.search(db=db, query=query, skip=skip, limit=limit)

        from app.v1.services.hr_decision_service import hr_decision_service

        job_reads = []
        for job in result["data"]:
            job_read = JobRead.model_validate(job)
            # Add per-job automated screening summary
            job_read.automated_screening_summary = (
                await hr_decision_service.get_job_screening_summary(db, job.id)
            )
            # Add per-job decision summary (Attaching for search results parity)
            decision_summary = await hr_decision_service.get_job_decision_summary(db, job.id)
            job_read.decision_summary = decision_summary.model_dump()

            # Add total and current session counts (Enabled session history for search view)
            stats = await self._calculate_job_activity_stats(db, job.id, include_sessions=True)
            job_read.total_candidates = stats["total_candidates"]
            job_read.current_session_candidates = stats["current_session_count"]
            job_read.activity_sessions = stats["sessions"]

            job_reads.append(job_read)

        return JobsListRead(
            data=job_reads,
            total=result["total"],
            global_decision_summary=await hr_decision_service.get_global_decision_summary(
                db
            ),
            global_screening_summary=await hr_decision_service.get_global_screening_summary(
                db
            ),
        )

    async def get_job_by_id(self, db: AsyncSession, job_id: uuid.UUID) -> JobRead:
        """Get a job by ID."""
        job = await job_repository.get(db=db, id=job_id)
        if not job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Job not found.",
            )
        job_read = JobRead.model_validate(job)
        # Populate activity history for detailed view
        stats = await self._calculate_job_activity_stats(db, job_id, include_sessions=True)
        job_read.total_candidates = stats["total_candidates"]
        job_read.current_session_candidates = stats["current_session_count"]
        job_read.activity_sessions = stats["sessions"]
        return job_read

    async def get_job_version(self, db: AsyncSession, version_id: uuid.UUID) -> Any:
        """Get a specific job version snapshot by its unique ID."""
        version = await job_repository.get_version(db=db, id=version_id)
        if not version:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Job version not found.",
            )
        return version

    async def create_job(
        self, db: AsyncSession, admin_user_id: uuid.UUID, job_in: JobCreate
    ) -> JobRead:
        """Create a new job."""
        # Validate department existence if provided
        if job_in.department_id:
            await department_service.get_department_by_id(db, job_in.department_id)

        # Validate skills existence if provided
        if job_in.skill_ids:
            for skill_id in job_in.skill_ids:
                await skill_service.get_skill_by_id(db, skill_id)

        job = await job_repository.create(
            db=db, object=job_in, created_by=admin_user_id
        )

        # Setup default stages for the new job
        # await stage_service.setup_default_stages(db=db, job_id=job.id)

        await audit_service.log_action(
            db=db,
            user_id=admin_user_id,
            action="create_job",
            target_type="job",
            target_id=job.id,
            details={"title": job.title},
        )
        return JobRead.model_validate(job)

    async def update_job(
        self,
        db: AsyncSession,
        admin_user_id: uuid.UUID,
        job_id: uuid.UUID,
        job_update: JobUpdate,
        background_tasks=None,
    ) -> JobRead:
        # Update a job. Auto-triggers mass refresh if custom_extraction_fields changed.
        await self.get_job_by_id(db=db, job_id=job_id)

        # Filter out invalid department_id if provided
        if job_update.department_id:
            try:
                await department_service.get_department_by_id(
                    db, job_update.department_id
                )
            except HTTPException:
                # If department doesn't exist, don't update it (keep existing)
                job_update.department_id = None

        # Filter out invalid skill_ids if provided
        if job_update.skill_ids:
            valid_skill_ids = []
            for s_id in job_update.skill_ids:
                try:
                    await skill_service.get_skill_by_id(db, s_id)
                    valid_skill_ids.append(s_id)
                except HTTPException:
                    # Skip invalid skill IDs (like the 3fa85f64 dummy placeholder)
                    continue
            job_update.skill_ids = valid_skill_ids

        updated_job = await job_repository.update(db=db, id=job_id, object=job_update)
        
        updated_fields_map = job_update.model_dump(exclude_unset=True)
        
        # Log general update
        await audit_service.log_action(
            db=db,
            user_id=admin_user_id,
            action="update_job",
            target_type="job",
            target_id=job_id,
            details={
                "updated_fields": list(updated_fields_map.keys())
            },
        )

        # CRITICAL: If is_active was changed, log a specific update_job_status action
        # so that the session reconstruction logic (which looks for this action) picks it up.
        if "is_active" in updated_fields_map:
            await audit_service.log_action(
                db=db,
                user_id=admin_user_id,
                action="update_job_status",
                target_type="job",
                target_id=job_id,
                details={"is_active": updated_fields_map["is_active"]},
            )

        updated_fields = updated_fields_map # Maintain compatibility with existing variable name below
        if background_tasks is not None:
            from app.v1.core.cache import cache
            from app.v1.services.resume_upload.background import BackgroundProcessor
            from app.v1.services.resume_upload.processor import ResumeProcessor

            # Clear cache for job embedding if JD or Title changed
            if "jd_text" in updated_fields or "title" in updated_fields:
                await cache.delete(f"job_embedding:{job_id}")

            # Only trigger mass refresh for major changes if desired, 
            # but clearing the cache ensures the NEXT manual re-analysis is fresh.
            if "custom_extraction_fields" in updated_fields or "jd_text" in updated_fields:
                bg_processor = BackgroundProcessor(ResumeProcessor())
                # Use Celery for mass refresh to avoid blocking the main server threads with heavy LLM work
                bg_processor.schedule_mass_refresh(
                    job_id=job_id,
                    full_refresh=("jd_text" in updated_fields)
                )

        return JobRead.model_validate(updated_job)

    async def update_job_status(
        self,
        db: AsyncSession,
        admin_user_id: uuid.UUID,
        job_id: uuid.UUID,
        status_in: JobStatusUpdate,
    ) -> JobRead:
        """Update job active status without incrementing version."""
        # 1. Verify existence
        await self.get_job_by_id(db=db, job_id=job_id)

        # 2. Update status via repository
        # JobRepository.update logic correctly identifies is_active as a non-version-worthy change.
        job_update = JobUpdate(is_active=status_in.is_active)
        updated_job = await job_repository.update(db=db, id=job_id, object=job_update)

        # 3. Log Audit
        await audit_service.log_action(
            db=db,
            user_id=admin_user_id,
            action="update_job_status",
            target_type="job",
            target_id=job_id,
            details={"is_active": status_in.is_active},
        )

        return JobRead.model_validate(updated_job)

    async def update_job_status(
        self,
        db: AsyncSession,
        admin_user_id: uuid.UUID,
        job_id: uuid.UUID,
        status_in: JobStatusUpdate,
    ) -> Job:
        """Update only the active status of a job (Enable/Disable)."""
        await self.get_job_by_id(db=db, job_id=job_id)

        # Bypasses the edit lock as this is a specific status update API
        updated_job = await job_repository.update(
            db=db, id=job_id, object=JobUpdate(is_active=status_in.is_active)
        )

        await audit_service.log_action(
            db=db,
            user_id=admin_user_id,
            action="update_job_status",
            target_type="job",
            target_id=job_id,
            details={"is_active": status_in.is_active},
        )
        return updated_job

    async def delete_job(
        self, db: AsyncSession, admin_user_id: uuid.UUID, job_id: uuid.UUID
    ) -> None:
        """Force-delete a job (hr_admin and superadmin only)."""
        current_user = await user_service.get_user_by_id(db=db, user_id=admin_user_id)
        role_name = (current_user.role_name or "").lower()
        is_super_admin = "admin:all" in current_user.permissions
        allowed_roles = {"hr_admin", "superadmin", "super_admin"}
        if not is_super_admin and role_name not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only HR Admin or Super Admin can force delete jobs.",
            )

        await self.get_job_by_id(db=db, job_id=job_id)
        await job_repository.force_delete(db=db, id=job_id)
        await audit_service.log_action(
            db=db,
            user_id=admin_user_id,
            action="force_delete_job",
            target_type="job",
            target_id=job_id,
        )


    async def get_job_activity_history(
        self, db: AsyncSession, job_id: uuid.UUID
    ) -> JobActivityHistoryResponse:
        """
        Reconstruct job activation sessions and count candidates for each.
        """
        stats = await self._calculate_job_activity_stats(db, job_id, include_sessions=True)
        return JobActivityHistoryResponse(
            job_id=job_id,
            total_candidates=stats["total_candidates"],
            sessions=stats["sessions"],
        )

    async def _calculate_job_activity_stats(
        self, db: AsyncSession, job_id: uuid.UUID, include_sessions: bool = True
    ) -> dict[str, Any]:
        """
        Helper to calculate total candidates and session breakdown for a job.
        
        Returns:
            A dictionary with 'total_candidates', 'current_session_count', 
            and 'sessions' (list of JobActivitySession).
        """
        from sqlalchemy import select, and_, func, or_
        from app.v1.db.models.audit_logs import AuditLog
        from app.v1.db.models.candidates import Candidate
        from app.v1.db.models.cross_job_matches import CrossJobMatch

        # 1. Verify job existence and get creation time
        job = await job_repository.get(db=db, id=job_id)
        if not job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Job not found.",
            )

        # 2. Get total candidates (Native Applied + AI Cross-matched)
        native_count_stmt = select(func.count(Candidate.id)).where(
            Candidate.applied_job_id == job_id
        )
        matched_count_stmt = select(func.count(CrossJobMatch.id)).where(
            CrossJobMatch.matched_job_id == job_id
        )
        
        native_res = await db.execute(native_count_stmt)
        matched_res = await db.execute(matched_count_stmt)
        
        total_candidates = (native_res.scalar() or 0) + (matched_res.scalar() or 0)

        # 3. Get status update audit logs
        stmt = (
            select(AuditLog)
            .where(
                and_(
                    AuditLog.target_id == job_id,
                    AuditLog.target_type == "job",
                    AuditLog.action == "update_job_status",
                )
            )
            .order_by(AuditLog.created_at.asc())
        )
        result = await db.execute(stmt)
        logs = result.scalars().all()

        # 4. Reconstruct sessions
        sessions_data = []
        current_start = job.created_at
        last_state = True  # Assuming job starts active
        session_counter = 1

        for log in logs:
            is_active_val = log.details.get("is_active")
            if is_active_val is None:
                continue

            if last_state and not is_active_val:
                # Session closed
                sessions_data.append(
                    {
                        "session_id": session_counter,
                        "start_date": current_start,
                        "end_date": log.created_at,
                        "is_current": False,
                    }
                )
                session_counter += 1
                last_state = False
            elif not last_state and is_active_val:
                # New session starts
                current_start = log.created_at
                last_state = True

        # Current session (if still active)
        if last_state:
            sessions_data.append(
                {
                    "session_id": session_counter,
                    "start_date": current_start,
                    "end_date": None,
                    "is_current": True,
                }
            )

        # 5. Calculate counts for sessions
        final_sessions = []
        current_session_count = 0
        from app.v1.schemas.job import JobActivitySession
        
        for s in sessions_data:
            # Skip candidate counting for session if we only need the current session count 
            # and this is not the current one.
            if not include_sessions and not s["is_current"]:
                continue

            # Count native applicants in this session
            native_stmt = select(func.count(Candidate.id)).where(
                and_(
                    Candidate.applied_job_id == job_id,
                    Candidate.created_at >= s["start_date"],
                )
            )
            if s["end_date"]:
                native_stmt = native_stmt.where(Candidate.created_at <= s["end_date"])

            # Count AI cross-matches in this session
            matched_stmt = select(func.count(CrossJobMatch.id)).where(
                and_(
                    CrossJobMatch.matched_job_id == job_id,
                    CrossJobMatch.created_at >= s["start_date"],
                )
            )
            if s["end_date"]:
                matched_stmt = matched_stmt.where(CrossJobMatch.created_at <= s["end_date"])

            native_res = await db.execute(native_stmt)
            matched_res = await db.execute(matched_stmt)
            
            count_val = (native_res.scalar() or 0) + (matched_res.scalar() or 0)
            s["candidate_count"] = count_val
            
            if s["is_current"]:
                current_session_count = count_val
            
            if include_sessions:
                final_sessions.append(JobActivitySession(**s))

        return {
            "total_candidates": total_candidates,
            "current_session_count": current_session_count,
            "sessions": final_sessions,
        }


job_admin_service = JobAdminService()
