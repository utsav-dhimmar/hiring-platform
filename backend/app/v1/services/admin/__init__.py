from app.v1.services.admin.audit_service import audit_service
from app.v1.services.admin.user_admin_service import user_admin_service
from app.v1.services.admin.role_service import role_service
from app.v1.services.admin.analytics_service import analytics_service
from app.v1.services.admin.job_service import job_admin_service
from app.v1.services.admin.skill_service import skill_service
from app.v1.services.admin.candidate_service import candidate_admin_service

__all__ = [
    "audit_service",
    "user_admin_service",
    "role_service",
    "analytics_service",
    "job_admin_service",
    "skill_service",
    "candidate_admin_service",
]
