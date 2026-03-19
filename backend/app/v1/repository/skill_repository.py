"""
Repository for skill-related database operations.
"""

from fastcrud import FastCRUD

from app.v1.db.models.skills import Skill


class SkillRepository:
    """
    Repository class for handling Skill database operations using FastCRUD.
    """

    def __init__(self) -> None:
        """
        Initialize the SkillRepository with FastCRUD.
        """
        self.crud = FastCRUD(Skill)


skill_repository = SkillRepository()
