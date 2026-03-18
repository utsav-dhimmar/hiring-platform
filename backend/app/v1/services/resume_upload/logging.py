"""
Logging helpers for resume processing.
"""

import time
from app.core.logging import get_logger

logger = get_logger(__name__)


def log_stage(
    *,
    stage: str,
    started_at: float,
    **context: object,
) -> None:
    """Log a processing stage duration and context.

    Args:
        stage: Name of the stage.
        started_at: Performance counter start time.
        **context: Additional key-value pairs for the log message.
    """
    logger.info(
        "resume_processing stage=%s duration_ms=%.2f %s",
        stage,
        (time.perf_counter() - started_at) * 1000,
        " ".join(f"{key}={value}" for key, value in context.items()),
    )


def log_event(
    *,
    event: str,
    **context: object,
) -> None:
    """Log a specific event with context.

    Args:
        event: Name of the event.
        **context: Additional key-value pairs for the log message.
    """
    logger.info(
        "resume_processing event=%s %s",
        event,
        " ".join(f"{key}={value}" for key, value in context.items()),
    )
