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
    db_pool_size: int = Field(default=5, description="SQLAlchemy connection pool size")
    db_max_overflow: int = Field(default=10, description="SQLAlchemy pool max overflow")
    db_pool_recycle: int = Field(default=1800, description="SQLAlchemy pool recycle seconds")

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
    resend_from_email: Optional[str] = Field(
        default=None, description="From address used for outgoing emails"
    )
    contact_email: Optional[str] = Field(
        default=None, description="Inbox that receives contact form / referral / donation notifications"
    )

    # Stripe
    stripe_secret_key: Optional[str] = Field(
        default=None, description="Stripe secret key for creating PaymentIntents"
    )
    stripe_publishable_key: Optional[str] = Field(
        default=None, description="Stripe publishable key (safe to expose to the frontend)"
    )
    stripe_webhook_secret: Optional[str] = Field(
        default=None, description="Stripe webhook signing secret used to verify donation confirmations"
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
        # Don't hard-fail on env vars this model doesn't know about yet —
        # keeps startup resilient to new keys added to .env before the model
        # is updated, while the fields above still give real validation for
        # the settings this app actually reads.
        extra = "ignore"


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

        # Check Stripe webhook secret is set if Stripe is in use, so donation
        # confirmations can only ever come from a verified Stripe webhook call
        if settings.stripe_secret_key and not settings.stripe_webhook_secret:
            errors.append(
                "STRIPE_WEBHOOK_SECRET must be set in production when STRIPE_SECRET_KEY is configured"
            )

        if errors:
            raise ValueError(
                "Production configuration errors:\n- " + "\n- ".join(errors)
            )


def get_settings() -> Settings:
    """Get the current application settings"""
    return settings
