import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, Text, ForeignKey, Date
from sqlalchemy.dialects.postgresql import UUID, JSONB
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
    mother_phone = Column(String(50), nullable=True)
    mother_email = Column(String(255), nullable=True)
    estimated_due_date = Column(Date, nullable=True)
    # Public reference returned to the referrer on submission, e.g. GNI-2026-7K3QXM
    reference_number = Column(String(32), unique=True, index=True, nullable=True)
    # Referrer (individual at the partner organisation)
    referrer_name = Column(String(255), nullable=True)
    referrer_email = Column(String(255), nullable=True)
    referrer_phone = Column(String(50), nullable=True)
    # Person being referred - safe contact
    preferred_name = Column(String(255), nullable=True)
    safe_contact_method = Column(String(20), nullable=True)  # telephone, email, either
    voicemail_ok = Column(String(20), nullable=True)  # yes, no, not_sure
    communication_restrictions = Column(Text, nullable=True)
    locality = Column(String(255), nullable=True)
    postcode_area = Column(String(20), nullable=True)
    # Antenatal-specific
    gestation_info = Column(String(100), nullable=True)  # "approx. 24 weeks" / "not known"
    can_attend_course = Column(String(20), nullable=True)  # yes, no, unsure
    timing_notes = Column(Text, nullable=True)
    # Infant-feeding-specific
    baby_born = Column(String(20), nullable=True)  # yes, no, not_known
    baby_age_or_due = Column(String(100), nullable=True)
    preferred_appointment_timing = Column(String(255), nullable=True)
    # Barriers and access
    barriers = Column(JSONB, nullable=True)
    barriers_other = Column(String(255), nullable=True)
    interpreter_support = Column(String(20), nullable=True)  # yes, no, not_sure
    adjustments_needed = Column(Text, nullable=True)
    # Service the mother needs (birth_confidence, breastfeeding_clinic or both)
    referral_type = Column(String(100), nullable=False, default="birth_confidence")
    language_requirement = Column(String(255), nullable=True)
    additional_notes = Column(Text, nullable=True)
    # Interpreter requirement
    requires_interpreter = Column(Boolean, default=False)
    # GDPR consent - mandatory
    consent_obtained = Column(Boolean, nullable=False, default=False)
    # Cohort assignments — one slot per program type.
    # cohort_id: Birth Confidence Program cohort
    # clinic_cohort_id: Breastfeeding Support Clinic cohort
    cohort_id = Column(
        UUID(as_uuid=True), ForeignKey("cohorts.id"), nullable=True
    )
    clinic_cohort_id = Column(
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
    cohort = relationship(
        "Cohort", foreign_keys=[cohort_id], backref="birth_confidence_referrals"
    )
    clinic_cohort = relationship(
        "Cohort", foreign_keys=[clinic_cohort_id], backref="clinic_referrals"
    )
