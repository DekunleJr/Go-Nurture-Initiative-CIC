from pydantic import BaseModel, EmailStr, Field, model_validator
from typing import Optional, List, Literal
from datetime import datetime, date
from uuid import UUID

ReferralType = Literal["birth_confidence", "breastfeeding_clinic", "both"]
SafeContact = Literal["telephone", "email", "either"]
YesNoNotSure = Literal["yes", "no", "not_sure"]
YesNoUnsure = Literal["yes", "no", "unsure"]
YesNoNotKnown = Literal["yes", "no", "not_known"]
Barrier = Literal[
    "affordability",
    "language",
    "migration",
    "isolation",
    "service_access",
    "disability",
    "housing",
    "other",
]


class ReferralCreate(BaseModel):
    # 1. Referrer
    referrer_name: str = Field(min_length=1, max_length=255)
    referrer_email: EmailStr
    referrer_phone: str = Field(min_length=1, max_length=50)

    # 2. Person being referred
    mother_name: str = Field(min_length=1, max_length=255)
    preferred_name: Optional[str] = Field(default=None, max_length=255)
    mother_phone: Optional[str] = Field(default=None, max_length=50)
    mother_email: Optional[EmailStr] = None
    safe_contact_method: SafeContact
    voicemail_ok: YesNoNotSure
    communication_restrictions: Optional[str] = Field(default=None, max_length=500)
    locality: str = Field(min_length=1, max_length=255)
    postcode_area: Optional[str] = Field(default=None, max_length=20)

    # 3. Support requested
    referral_type: ReferralType = "birth_confidence"
    estimated_due_date: Optional[date] = None
    gestation_info: Optional[str] = Field(default=None, max_length=100)
    can_attend_course: Optional[YesNoUnsure] = None
    timing_notes: Optional[str] = Field(default=None, max_length=500)
    baby_born: Optional[YesNoNotKnown] = None
    baby_age_or_due: Optional[str] = Field(default=None, max_length=100)
    preferred_appointment_timing: Optional[str] = Field(default=None, max_length=255)

    # 4. Barriers
    barriers: List[Barrier] = Field(min_length=1)
    barriers_other: Optional[str] = Field(default=None, max_length=255)
    additional_notes: Optional[str] = Field(default=None, max_length=1000)

    # 5. Access and communication needs
    interpreter_support: Optional[YesNoNotSure] = None
    language_requirement: Optional[str] = Field(default=None, max_length=255)
    adjustments_needed: Optional[str] = Field(default=None, max_length=500)

    # 6. Declaration
    consent_obtained: bool = False

    @model_validator(mode="after")
    def check_safe_contact(self):
        if self.safe_contact_method == "telephone" and not self.mother_phone:
            raise ValueError("A telephone number is required when telephone is the safe contact method")
        if self.safe_contact_method == "email" and not self.mother_email:
            raise ValueError("An email address is required when email is the safe contact method")
        if self.safe_contact_method == "either" and not (self.mother_phone or self.mother_email):
            raise ValueError("Provide a telephone number or email address for the safe contact method")
        if "other" in self.barriers and not (self.barriers_other and self.barriers_other.strip()):
            raise ValueError("Please specify the other barrier")
        return self


class ReferralResponse(BaseModel):
    id: UUID
    partner_id: UUID
    reference_number: Optional[str] = None
    mother_name: str
    mother_phone: Optional[str] = None
    mother_email: Optional[str] = None
    estimated_due_date: Optional[date] = None
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

    referrer_name: Optional[str] = None
    referrer_email: Optional[str] = None
    referrer_phone: Optional[str] = None
    preferred_name: Optional[str] = None
    safe_contact_method: Optional[str] = None
    voicemail_ok: Optional[str] = None
    communication_restrictions: Optional[str] = None
    locality: Optional[str] = None
    postcode_area: Optional[str] = None
    gestation_info: Optional[str] = None
    can_attend_course: Optional[str] = None
    timing_notes: Optional[str] = None
    baby_born: Optional[str] = None
    baby_age_or_due: Optional[str] = None
    preferred_appointment_timing: Optional[str] = None
    barriers: Optional[List[str]] = None
    barriers_other: Optional[str] = None
    interpreter_support: Optional[str] = None
    adjustments_needed: Optional[str] = None

    model_config = {"from_attributes": True}


class ReferralUpdate(BaseModel):
    """Editable referral details (status & cohort assignment excluded).

    Every field is optional so partners and admins can send just what changed.
    Clearing a value is done by sending null.
    """
    # Referrer
    referrer_name: Optional[str] = Field(default=None, max_length=255)
    referrer_email: Optional[EmailStr] = None
    referrer_phone: Optional[str] = Field(default=None, max_length=50)
    # Person
    mother_name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    preferred_name: Optional[str] = Field(default=None, max_length=255)
    mother_phone: Optional[str] = Field(default=None, max_length=50)
    mother_email: Optional[EmailStr] = None
    safe_contact_method: Optional[SafeContact] = None
    voicemail_ok: Optional[YesNoNotSure] = None
    communication_restrictions: Optional[str] = Field(default=None, max_length=500)
    locality: Optional[str] = Field(default=None, max_length=255)
    postcode_area: Optional[str] = Field(default=None, max_length=20)
    # Support requested
    referral_type: Optional[ReferralType] = None
    estimated_due_date: Optional[date] = None
    gestation_info: Optional[str] = Field(default=None, max_length=100)
    can_attend_course: Optional[YesNoUnsure] = None
    timing_notes: Optional[str] = Field(default=None, max_length=500)
    baby_born: Optional[YesNoNotKnown] = None
    baby_age_or_due: Optional[str] = Field(default=None, max_length=100)
    preferred_appointment_timing: Optional[str] = Field(default=None, max_length=255)
    # Barriers
    barriers: Optional[List[Barrier]] = None
    barriers_other: Optional[str] = Field(default=None, max_length=255)
    additional_notes: Optional[str] = Field(default=None, max_length=1000)
    # Access needs
    interpreter_support: Optional[YesNoNotSure] = None
    requires_interpreter: Optional[bool] = None
    language_requirement: Optional[str] = Field(default=None, max_length=255)
    adjustments_needed: Optional[str] = Field(default=None, max_length=500)


class ReferralStatusUpdate(BaseModel):
    status: str
    cohort_id: Optional[UUID] = None
