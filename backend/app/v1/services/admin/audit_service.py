import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.v1.db.models.audit_logs import AuditLog
from app.v1.repository.admin_repository import admin_repository
from app.v1.schemas.admin import AuditLogRead
from app.v1.schemas.response import PaginatedData


class AuditService:
    """
    Service for handling audit logging.
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

    async def get_audit_logs(
        self, db: AsyncSession, skip: int = 0, limit: int = 100, q: str | None = None
    ) -> PaginatedData[AuditLogRead]:
        """
        Retrieve all audit logs with pagination.

        @param db - Database session
        @param skip - Number of records to skip for pagination
        @param limit - Maximum number of records to return
        @returns List of AuditLog objects
        """
        logs = await admin_repository.get_audit_logs(
            db=db, skip=skip, limit=limit, q=q
        )
        total = await admin_repository.count_all_audit_logs(db=db, q=q)
        return PaginatedData[AuditLogRead](
            data=[AuditLogRead.model_validate(log) for log in logs],
            total=total,
        )


audit_service = AuditService()
