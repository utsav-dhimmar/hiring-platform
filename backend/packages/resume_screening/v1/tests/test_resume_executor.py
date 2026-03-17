import pytest

from app.v1.core.resume_executor import (
    initialize_resume_executor,
    run_in_resume_executor,
    shutdown_resume_executor,
)


@pytest.mark.anyio
async def test_run_in_resume_executor_executes_callable():
    shutdown_resume_executor()
    initialize_resume_executor()

    result = await run_in_resume_executor(lambda value: value + 1, 41)

    assert result == 42

    shutdown_resume_executor()
