import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, Text, Float
from sqlalchemy.dialects.postgresql import UUID
from app.database.session import Base


class Venue(Base):
    """Community venue locations for cohort sessions in Norfolk."""

    __tablename__ = "venues"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    address = Column(String(500), nullable=False)
    postcode = Column(String(20), nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    description = Column(Text, nullable=True)
    transport_links = Column(Text, nullable=True)  # Text about bus/train routes
    nearby_landmarks = Column(Text, nullable=True)
    accessibility_info = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))