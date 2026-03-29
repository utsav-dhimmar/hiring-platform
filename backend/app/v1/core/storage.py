"""
Storage utility functions.
"""

from pathlib import Path
from app.v1.core.config import settings

def resolve_storage_path(path_str: str) -> Path:
    """Resolve a string or relative path to a full absolute Path object.
    
    If the path is relative or absolute-looking but missing a drive (on Windows),
    it is resolved relative to the current working directory or normalized.
    """
    path = Path(path_str)
    if not path.is_absolute():
        # On Windows, if path_str is "/foo", path.is_absolute() is False.
        # Path.cwd() / path will correctly join it to the current drive.
        return (Path.cwd() / path).resolve()
    return path.resolve()

def to_storage_relative_path(path: Path) -> str:
    """Convert an absolute Path to a normalized string path.
    
    This is used to normalize paths before storing them in the database.
    Note: currently returns the absolute path string.
    """
    return str(path.resolve())
