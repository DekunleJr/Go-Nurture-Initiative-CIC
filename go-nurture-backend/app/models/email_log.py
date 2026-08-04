import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Text, Boolean
from sqlalchemy.dialects.postgresql import UUID
from app.database.session import Base


class EmailLog(Base):
    """Log of all outgoing emails sent by the system."""

    __tablename__ = "email_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    recipient_email = Column(String(255), nullable=False)
    subject = Column(String(500), nullable=False)
    body = Column(Text, nullable=True)
    email_type = Column(String(50), nullable=False)  # referral, donation, contact, partner_invite
    status = Column(String(20), nullable=False)  # success, failed, pending
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))