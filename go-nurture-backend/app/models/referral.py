import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, Text, ForeignKey, Date
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database.session import Base


class Referral(Base):
    """
    GDPR-compliant referral intake form.
    Mandatory checkbox for explicit consent from the mother.
    """

    __tablename__ = "referrals"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    # Referrer (partner organisation who submits the referral)
    partner_id = Column(
        UUID(as_uuid=True), ForeignKey("partner_organisations.id"), nullable=False
    )
    # Mother's details
    mother_name = Column(String(255), nullable=False)
    mother_phone = Column(String(50), nullable=False)
    estimated_due_date = Column(Date, nullable=False)
    language_requirement = Column(String(255), nullable=True)
    additional_notes = Column(Text, nullable=True)
    # Interpreter requirement
    requires_interpreter = Column(Boolean, default=False)
    # GDPR consent - mandatory
    consent_obtained = Column(Boolean, nullable=False, default=False)
    # Cohort assignment
    cohort_id = Column(
        UUID(as_uuid=True), ForeignKey("cohorts.id"), nullable=True
    )
    # Status tracking
    status = Column(
        String(50), default="pending", nullable=False
    )  # pending, assigned, completed, declined
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    partner = relationship("PartnerOrganisation", backref="referrals")
    cohort = relationship("Cohort", backref="referrals")