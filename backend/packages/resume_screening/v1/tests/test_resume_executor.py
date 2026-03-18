"""
Tests for the resume executor utility.

Verifies that functions can be successfully offloaded to a thread pool executor.
"""
import pytest

from app.v1.core.resume_executor import (
    initialize_resume_executor,
    run_in_resume_executor,
    shutdown_resume_executor,
)


@pytest.mark.anyio
async def test_run_in_resume_executor_executes_callable():
    """Test that run_in_resume_executor correctly executes a function in a thread."""
    shutdown_resume_executor()
    initialize_resume_executor()

    result = await run_in_resume_executor(lambda value: value + 1, 41)

    assert result == 42

    shutdown_resume_executor()
