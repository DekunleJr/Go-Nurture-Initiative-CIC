from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID
from app.models.donation import DonationStatus


class DonationCreate(BaseModel):
    amount: float
    currency: str = "GBP"
    donor_name: Optional[str] = None
    donor_email: Optional[str] = None
    message: Optional[str] = None
    is_anonymous: bool = False


class DonationResponse(BaseModel):
    id: UUID
    amount: float
    currency: str
    donor_name: Optional[str] = None
    donor_email: Optional[str] = None
    payment_provider: str
    status: DonationStatus
    message: Optional[str] = None
    is_anonymous: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class PaymentIntentResponse(BaseModel):
    client_secret: str
    donation_id: UUID
    amount: float
    currency: str