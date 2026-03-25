"""Shared helpers for resolving storage paths."""

from __future__ import annotations

from pathlib import Path, PureWindowsPath


APP_ROOT = Path(__file__).resolve().parents[4]
UPLOADS_DIRNAME = "uploads"


def _normalize_path_string(path_value: str | Path) -> str:
    return str(path_value).replace("\\", "/")


def _extract_uploads_subpath(path_value: str | Path) -> str | None:
    """Extract an ``uploads/...`` path from relative or absolute input."""

    normalized = _normalize_path_string(path_value).strip()
    lowered = normalized.lower()

    if lowered == UPLOADS_DIRNAME:
        return UPLOADS_DIRNAME

    if lowered.startswith(f"{UPLOADS_DIRNAME}/"):
        return normalized

    marker = f"/{UPLOADS_DIRNAME}/"
    marker_index = lowered.find(marker)
    if marker_index != -1:
        return normalized[marker_index + 1 :]

    if lowered.endswith(f"/{UPLOADS_DIRNAME}"):
        return UPLOADS_DIRNAME

    return None


def resolve_storage_path(path_value: str | Path) -> Path:
    """Resolve application storage paths against the project root.

    Relative paths such as ``uploads/resumes/...`` must map to ``/app/uploads/...``
    inside containers rather than the runtime working directory (``/app/backend``).
    """

    uploads_subpath = _extract_uploads_subpath(path_value)
    if uploads_subpath is not None:
        return APP_ROOT / Path(uploads_subpath)

    native_path = Path(str(path_value))
    if native_path.is_absolute():
        return native_path

    windows_path = PureWindowsPath(str(path_value))
    if windows_path.is_absolute():
        # Non-native Windows absolute path on Linux. We cannot reliably access it
        # unless it points into the shared uploads directory handled above.
        return Path(_normalize_path_string(path_value))

    return APP_ROOT / native_path


def to_storage_relative_path(path_value: str | Path) -> str:
    """Convert a path to a portable app-relative POSIX path when possible."""

    uploads_subpath = _extract_uploads_subpath(path_value)
    if uploads_subpath is not None:
        return uploads_subpath

    resolved_path = resolve_storage_path(path_value).resolve()
    try:
        return resolved_path.relative_to(APP_ROOT.resolve()).as_posix()
    except ValueError:
        return _normalize_path_string(path_value)
