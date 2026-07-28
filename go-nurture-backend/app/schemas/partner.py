from pydantic import BaseModel, EmailStr
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
    password: str


class PartnerLogin(BaseModel):
    email: EmailStr
    password: str


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


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    partner: PartnerResponse


class PartnerInviteResponse(BaseModel):
    message: str
    partner: PartnerResponse
    invite_link: str