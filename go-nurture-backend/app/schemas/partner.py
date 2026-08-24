from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from uuid import UUID


class AdminPartnerCreate(BaseModel):
    """Admin-only: create a partner account (no password - invite will be sent)."""
    organisation_name: str
    contact_name: str
    email: EmailStr
    phone: Optional[str] = None
    organisation_type: str = "community"


class SetPassword(BaseModel):
    """First-time password set using the token from email."""
    token: str
    password: str = Field(min_length=8, max_length=256)


class PartnerLogin(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=256)


class PartnerResponse(BaseModel):
    id: UUID
    organisation_name: str
    contact_name: str
    email: str
    phone: Optional[str] = None
    organisation_type: str
    is_active: bool
    is_verified: bool
    is_admin: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class FacilitatorCreate(BaseModel):
    """Admin-only: create a facilitator account (no password - invite will be sent)."""
    name: str
    email: EmailStr
    phone: Optional[str] = None


class FacilitatorResponse(BaseModel):
    id: UUID
    name: str
    email: str
    phone: Optional[str] = None
    is_active: bool
    is_verified: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    # Role of the authenticated user: "partner", "admin" or "facilitator"
    role: str = "partner"
    partner: Optional[PartnerResponse] = None
    facilitator: Optional["FacilitatorResponse"] = None


class PartnerInviteResponse(BaseModel):
    message: str
    partner: PartnerResponse
    invite_link: str
