import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime
from sqlalchemy.dialects.postgresql import UUID
from app.database.session import Base


class PartnerOrganisation(Base):
    """Partner organisation accounts for the secure referral portal."""

    __tablename__ = "partner_organisations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organisation_name = Column(String(255), nullable=False)
    contact_name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=True)  # Null until first-time password set
    phone = Column(String(50), nullable=True)
    organisation_type = Column(
        String(100), nullable=False, default="community"
    )  # NHS, church, mosque, community group
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    is_admin = Column(Boolean, default=False)
    # First-time password set token
    set_password_token = Column(String(255), nullable=True, unique=True)
    set_password_token_expires = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )