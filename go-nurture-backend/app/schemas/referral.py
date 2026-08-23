from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date
from uuid import UUID


class ReferralCreate(BaseModel):
    mother_name: str
    mother_phone: str
    mother_email: Optional[str] = None
    estimated_due_date: date
    referral_type: str = "birth_confidence"
    language_requirement: Optional[str] = None
    additional_notes: Optional[str] = None
    requires_interpreter: bool = False
    consent_obtained: bool = False


class ReferralResponse(BaseModel):
    id: UUID
    partner_id: UUID
    mother_name: str
    mother_phone: str
    mother_email: Optional[str] = None
    estimated_due_date: date
    referral_type: str = "birth_confidence"
    language_requirement: Optional[str] = None
    additional_notes: Optional[str] = None
    requires_interpreter: bool
    consent_obtained: bool
    cohort_id: Optional[UUID] = None
    clinic_cohort_id: Optional[UUID] = None
    status: str
    created_at: datetime
    updated_at: datetime
    cohort_name: Optional[str] = None
    venue_name: Optional[str] = None
    clinic_cohort_name: Optional[str] = None

    model_config = {"from_attributes": True}


class ReferralUpdate(BaseModel):
    """Editable referral details (status & cohort assignment excluded)."""
    mother_name: Optional[str] = None
    mother_phone: Optional[str] = None
    mother_email: Optional[str] = None
    estimated_due_date: Optional[date] = None
    referral_type: Optional[str] = None
    language_requirement: Optional[str] = None
    additional_notes: Optional[str] = None
    requires_interpreter: Optional[bool] = None


class ReferralStatusUpdate(BaseModel):
    status: str
    cohort_id: Optional[UUID] = None
