import uuid
from datetime import datetime, timezone, date
from sqlalchemy import Column, String, Boolean, DateTime, Text, Integer, Date, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from app.database.session import Base
from sqlalchemy import inspect


class Cohort(Base):
    """
    Annual cohort groups for the CIC pilot programme.
    Year 1 target: 30 women per cohort.
    """

    __tablename__ = "cohorts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)  # e.g., "Cohort 1 - Spring 2027"
    year = Column(Integer, nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    max_participants = Column(Integer, default=30)
    is_active = Column(Boolean, default=True)
    description = Column(Text, nullable=True)
    venue_id = Column(UUID(as_uuid=True), ForeignKey("venues.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {c.key: getattr(self, c.key) for c in inspect(self).mapper.column_attrs}
