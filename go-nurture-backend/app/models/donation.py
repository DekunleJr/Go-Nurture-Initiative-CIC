import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, Text, Float, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from app.database.session import Base
import enum


class DonationStatus(enum.Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"


class Donation(Base):
    """Donation records from the Stripe/PayPal payment gateway."""

    __tablename__ = "donations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    amount = Column(Float, nullable=False)
    currency = Column(String(3), default="GBP")
    donor_name = Column(String(255), nullable=True)
    donor_email = Column(String(255), nullable=True)
    payment_provider = Column(String(50), default="stripe")  # stripe or paypal
    payment_intent_id = Column(String(255), unique=True, nullable=True)
    status = Column(SAEnum(DonationStatus), default=DonationStatus.PENDING, nullable=False)
    message = Column(Text, nullable=True)
    is_anonymous = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))