"""
Structured logging configuration
Provides JSON-formatted logging for consistent log parsing and monitoring
"""

import logging
import sys
from typing import Any
import structlog
from app.config import settings

# Configure structlog
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer(),
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    cache_logger_on_first_use=True,
)


def get_logger(name: str) -> structlog.BoundLogger:
    """
    Get a structured logger instance
    
    Args:
        name: Logger name, typically __name__
    
    Returns:
        structlog.BoundLogger: Bound logger with automatic context
    """
    return structlog.get_logger(name)


def setup_logging() -> None:
    """
    Configure Python's stdlib logging to use structlog
    Called once at application startup
    """
    # Get log level from settings
    log_level = getattr(logging, settings.log_level, logging.INFO)

    # Configure stdlib logging
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=log_level,
    )

    # Make structlog use stdlib logging
    structlog.configure(
        processors=[
            structlog.stdlib.filter_by_level,
            structlog.stdlib.add_logger_name,
            structlog.stdlib.add_log_level,
            structlog.stdlib.PositionalArgumentsFormatter(),
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.processors.UnicodeDecoder(),
            structlog.processors.JSONRenderer(),
        ],
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        cache_logger_on_first_use=True,
    )


# Example usage:
# logger = get_logger(__name__)
# logger.info("user_login", user_id="123", success=True)
# Output: {"timestamp": "2024-01-01T12:00:00", "event": "user_login", "user_id": "123", "success": true}
