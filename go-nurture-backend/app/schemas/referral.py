from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date
from uuid import UUID


class ReferralCreate(BaseModel):
    mother_name: str
    mother_phone: str
    estimated_due_date: date
    language_requirement: Optional[str] = None
    additional_notes: Optional[str] = None
    requires_interpreter: bool = False
    consent_obtained: bool = False


class ReferralResponse(BaseModel):
    id: UUID
    partner_id: UUID
    mother_name: str
    mother_phone: str
    estimated_due_date: date
    language_requirement: Optional[str] = None
    additional_notes: Optional[str] = None
    requires_interpreter: bool
    consent_obtained: bool
    cohort_id: Optional[UUID] = None
    status: str
    created_at: datetime
    updated_at: datetime
    cohort_name: Optional[str] = None
    venue_name: Optional[str] = None

    model_config = {"from_attributes": True}


class ReferralStatusUpdate(BaseModel):
    status: str
    cohort_id: Optional[UUID] = None