"""Application exceptions and a consistent API error payload."""

from typing import Any


class AppException(Exception):
    """Base application exception with an HTTP status and stable error code."""

    def __init__(self, status_code: int, code: str, message: str, details: Any = None):
        super().__init__(message)
        self.status_code = status_code
        self.code = code
        self.message = message
        self.details = details


def error_payload(code: str, message: str, details: Any = None) -> dict[str, Any]:
    """Build the shared error shape while retaining FastAPI's legacy detail key."""
    payload: dict[str, Any] = {
        "detail": message,
        "error": {"code": code, "message": message},
    }
    if details is not None:
        payload["error"]["details"] = details
    return payload
