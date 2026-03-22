"""
Repository for department-related database operations.
"""

from fastcrud import FastCRUD

from app.v1.db.models.departments import Department


class DepartmentRepository:
    """
    Repository class for handling Department database operations using FastCRUD.
    """

    def __init__(self) -> None:
        """
        Initialize the DepartmentRepository with FastCRUD.
        """
        self.crud = FastCRUD(Department)


department_repository = DepartmentRepository()
