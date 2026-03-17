import logging
import traceback
from typing import Any, Callable

from fastapi import Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from app.v1.core.config import settings

logger = logging.getLogger(__name__)


class GlobalErrorHandlerMiddleware(BaseHTTPMiddleware):
    """Middleware for handling global exceptions and errors."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        try:
            response = await call_next(request)
            return response
        except Exception as exc:  # noqa: BLE001
            return self._handle_exception(request, exc)

    def _handle_exception(self, request: Request, exc: Exception) -> JSONResponse:
        """Handle uncaught exceptions and return a structured error response."""
        error_id = id(exc)

        logger.error(
            "Unhandled exception: %s\n%s",
            str(exc),
            traceback.format_exc(),
            extra={
                "error_id": error_id,
                "path": request.url.path,
                "method": request.method,
            },
        )

        status_code = getattr(exc, "status_code", 500)
        detail = (
            "Internal server error"
            if status_code == 500 and not settings.DEBUG
            else str(exc)
        )

        response: dict[str, Any] = {
            "error": {
                "type": exc.__class__.__name__,
                "message": detail,
                "code": status_code,
            }
        }

        if settings.DEBUG:
            response["error"]["detail"] = str(exc)
            response["error"]["traceback"] = traceback.format_exc()

        return JSONResponse(
            status_code=status_code,
            content=response,
        )
