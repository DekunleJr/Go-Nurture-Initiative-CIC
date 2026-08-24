"""
Backend configuration and environment validation
Ensures all required environment variables are present at startup
"""

import os
from typing import Optional
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables
    Raises ValidationError if required vars are missing
    """

    # Database
    database_url: str = Field(
        ..., description="PostgreSQL connection URL"
    )  # Required

    # JWT/Security
    secret_key: str = Field(
        ..., description="Secret key for JWT signing. MUST be set in production"
    )  # Required
    algorithm: str = Field(default="HS256", description="JWT algorithm")
    access_token_expire_minutes: int = Field(
        default=60, description="JWT token expiration time in minutes"
    )

    # CORS
    frontend_url: str = Field(
        default="http://localhost:3000",
        description="Frontend URL(s), comma-separated for multiple origins",
    )

    # Email
    resend_api_key: Optional[str] = Field(
        default=None, description="Resend API key for email sending"
    )

    # Admin account setup
    admin_email: Optional[str] = Field(
        default=None, description="Initial admin email for seeding"
    )
    admin_password: Optional[str] = Field(
        default=None, description="Initial admin password for seeding"
    )

    # Logging
    log_level: str = Field(default="INFO", description="Logging level")

    # App
    environment: str = Field(
        default="development",
        description="Environment: development, staging, or production",
    )
    debug: bool = Field(
        default=False, description="Debug mode (should be False in production)"
    )

    class Config:
        env_file = ".env"
        case_sensitive = False


# Load settings at module level
settings = Settings()


def validate_production_settings() -> None:
    """
    Validate that critical settings are properly configured for production
    Raises ValueError if production requirements not met
    """
    if settings.environment == "production":
        errors = []

        # Check secret key is not default
        if not settings.secret_key or len(settings.secret_key) < 32:
            errors.append("SECRET_KEY must be at least 32 characters in production")

        # Check debug is disabled
        if settings.debug:
            errors.append("DEBUG must be False in production")

        # Check database URL exists
        if not settings.database_url:
            errors.append("DATABASE_URL must be set in production")

        # Check frontend URL is configured
        if not settings.frontend_url or settings.frontend_url == "http://localhost:3000":
            errors.append(
                "FRONTEND_URL must be set to production domain, not localhost"
            )

        if errors:
            raise ValueError(
                "Production configuration errors:\n- " + "\n- ".join(errors)
            )


def get_settings() -> Settings:
    """Get the current application settings"""
    return settings
