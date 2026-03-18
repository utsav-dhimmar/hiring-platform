import uuid
from typing import Optional


class UUIDHelper:
    """
    Utility class for UUID operations, specifically handling UUID v7.
    """

    @staticmethod
    def generate_uuid7() -> uuid.UUID:
        """
        Generates a UUID v7 (time-ordered UUID).

        Returns:
            uuid.UUID: A new UUID v7 object.
        """
        # uuid.uuid7() is available in Python 3.14+
        if hasattr(uuid, "uuid7"):
            return uuid.uuid7()
        
        # Fallback for environments where uuid7 might not be available yet
        # though the project specifies Python >= 3.14
        raise RuntimeError("uuid.uuid7 is not available in the current Python environment.")

    @staticmethod
    def to_string(u: uuid.UUID) -> str:
        """
        Converts a UUID object to its canonical string representation.

        Args:
            u (uuid.UUID): The UUID object to convert.

        Returns:
            str: The string representation of the UUID.
        """
        return str(u)

    @staticmethod
    def validate_uuid(uuid_to_test: Optional[str]) -> bool:
        """
        Validates whether a given string is a valid UUID.

        Args:
            uuid_to_test (str): The string to validate.

        Returns:
            bool: True if the string is a valid UUID, False otherwise.
        """
        if not uuid_to_test:
            return False
        try:
            uuid.UUID(str(uuid_to_test))
            return True
        except (ValueError, TypeError, AttributeError):
            return False
