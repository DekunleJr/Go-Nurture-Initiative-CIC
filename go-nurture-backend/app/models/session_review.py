import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, DateTime, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB, UUID
from app.database.session import Base


class SessionReview(Base):
    """Delivery audit / review record for a single cohort meeting (Part B of the manual)."""

    __tablename__ = "session_reviews"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    cohort_id = Column(UUID(as_uuid=True), ForeignKey("cohorts.id"), nullable=False)
    facilitator_id = Column(UUID(as_uuid=True), ForeignKey("facilitators.id"), nullable=False)

    # Delivery record
    session_date = Column(DateTime(timezone=True), nullable=False)
    week_number = Column(Integer, nullable=True)  # e.g. 4 for the Week 4 manual
    mode = Column(String(50), nullable=True)  # face_to_face / online / hybrid
    venue_or_platform = Column(String(255), nullable=True)
    lead_facilitator = Column(String(255), nullable=True)
    co_facilitator = Column(String(255), nullable=True)
    start_time = Column(String(50), nullable=True)
    finish_time = Column(String(50), nullable=True)
    registered_count = Column(Integer, nullable=True)
    attended_count = Column(Integer, nullable=True)
    supporter_count = Column(Integer, nullable=True)
    reasonable_adjustments = Column(Text, nullable=True)

    # Fidelity checklist (array of checked item keys)
    fidelity_checked = Column(JSONB, nullable=True, default=list)

    # Quality dashboard: {"measure_key": {"score": 1-5, "comment": ""}}
    quality_ratings = Column(JSONB, nullable=True, default=dict)

    # Deviations
    deviations = Column(Text, nullable=True)

    # Incidents: [{"ref": "", "type": "", "action": "", "escalated_to": "", "closed_at": ""}]
    incidents = Column(JSONB, nullable=True, default=list)

    # Reflection answers
    reflection = Column(JSONB, nullable=True, default=dict)

    # Status: draft / submitted
    status = Column(String(20), nullable=False, default="draft")
    submitted_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )