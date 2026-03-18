"""
Authentication models.

This module re-exports core database models related to authentication.
"""
from app.v1.db import Permission, Role, User, role_permission


__all__ = ["User", "Role", "Permission", "role_permission"]
