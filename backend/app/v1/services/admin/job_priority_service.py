import uuid
from typing import List, Optional
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from app.v1.db.models.job_priorities import JobPriority
from app.v1.schemas.job_priority import JobPriorityCreate, JobPriorityUpdate
from app.v1.services.admin.audit_service import audit_service


class JobPriorityService:
    async def get_all_priorities(self, db: AsyncSession) -> List[JobPriority]:
        stmt = select(JobPriority).order_by(JobPriority.name)
        result = await db.execute(stmt)
        return list(result.scalars().all())

    async def get_priority_by_id(self, db: AsyncSession, priority_id: uuid.UUID) -> Optional[JobPriority]:
        return await db.get(JobPriority, priority_id)

    async def create_priority(self, db: AsyncSession, admin_user_id: uuid.UUID, obj_in: JobPriorityCreate) -> JobPriority:
        db_obj = JobPriority(**obj_in.model_dump())
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        
        await audit_service.log_action(
            db=db,
            user_id=admin_user_id,
            action="create_priority",
            target_type="job_priority",
            target_id=db_obj.id,
            details={"name": db_obj.name},
        )
        return db_obj

    async def update_priority(self, db: AsyncSession, admin_user_id: uuid.UUID, priority_id: uuid.UUID, obj_in: JobPriorityUpdate) -> Optional[JobPriority]:
        db_obj = await self.get_priority_by_id(db, priority_id)
        if not db_obj:
            return None
        
        update_data = obj_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        
        await db.commit()
        await db.refresh(db_obj)

        await audit_service.log_action(
            db=db,
            user_id=admin_user_id,
            action="update_priority",
            target_type="job_priority",
            target_id=db_obj.id,
            details={"updated_fields": list(update_data.keys())},
        )
        return db_obj

    async def delete_priority(self, db: AsyncSession, admin_user_id: uuid.UUID, priority_id: uuid.UUID) -> bool:
        db_obj = await self.get_priority_by_id(db, priority_id)
        if not db_obj:
            return False
        
        priority_name = db_obj.name
        await db.delete(db_obj)
        await db.commit()

        await audit_service.log_action(
            db=db,
            user_id=admin_user_id,
            action="delete_priority",
            target_type="job_priority",
            target_id=priority_id,
            details={"name": priority_name},
        )
        return True


job_priority_service = JobPriorityService()
