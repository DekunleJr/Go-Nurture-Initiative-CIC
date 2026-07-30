import os
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from dotenv import load_dotenv

from app.database.session import get_db
from app.models.donation import Donation, DonationStatus
from app.schemas.donation import DonationCreate, DonationResponse, PaymentIntentResponse

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"))

router = APIRouter(prefix="/api/donations", tags=["Donations"])


@router.post("/create-payment-intent", response_model=PaymentIntentResponse)
def create_donation_intent(data: DonationCreate, db: Session = Depends(get_db)):
    """
    Create a Stripe PaymentIntent for a donation.
    In production, this would use stripe.PaymentIntent.create().
    Currently returns a mock client_secret for frontend development.
    """
    import stripe

    stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "sk_test_placeholder")

    # Create donation record
    donation = Donation(
        amount=data.amount,
        currency=data.currency,
        donor_name=data.donor_name,
        donor_email=data.donor_email,
        message=data.message,
        is_anonymous=data.is_anonymous,
        payment_provider="stripe",
    )
    db.add(donation)
    db.commit()
    db.refresh(donation)

    try:
        # Attempt to create a real Stripe PaymentIntent
        intent = stripe.PaymentIntent.create(
            amount=int(data.amount * 100),  # Convert to cents/pence
            currency=data.currency.lower(),
            metadata={"donation_id": str(donation.id)},
        )
        return PaymentIntentResponse(
            client_secret=intent.client_secret,
            donation_id=donation.id,
            amount=data.amount,
            currency=data.currency,
        )
    except Exception:
        # If Stripe is not configured, return a mock response for development
        return PaymentIntentResponse(
            client_secret="pi_mock_secret_for_development",
            donation_id=donation.id,
            amount=data.amount,
            currency=data.currency,
        )


@router.post("/confirm/{donation_id}")
def confirm_donation(donation_id: str, db: Session = Depends(get_db)):
    """Mark a donation as completed after successful payment."""
    import uuid
    try:
        uid = uuid.UUID(donation_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid ID")

    donation = db.query(Donation).filter(Donation.id == uid).first()
    if not donation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Donation not found")

    donation.status = DonationStatus.COMPLETED
    db.commit()
    return {"message": "Donation confirmed successfully"}


@router.get("/total")
def get_total_donations(db: Session = Depends(get_db)):
    """Get total donation amount (public)."""
    from sqlalchemy import func

    total = (
        db.query(func.sum(Donation.amount))
        .filter(Donation.status == DonationStatus.COMPLETED)
        .scalar()
    ) or 0
    return {"total": float(total)}


@router.get("/", response_model=List[DonationResponse])
def list_donations(db: Session = Depends(get_db)):
    """List recent completed donations (public)."""
    donations = (
        db.query(Donation)
        .filter(Donation.status == DonationStatus.COMPLETED)
        .order_by(Donation.created_at.desc())
        .limit(50)
        .all()
    )
    return [DonationResponse.model_validate(d) for d in donations]


@router.post("/", response_model=DonationResponse, status_code=status.HTTP_201_CREATED)
def create_donation(data: DonationCreate, db: Session = Depends(get_db)):
    """Create a donation directly (demo/test flow without Stripe)."""
    donation = Donation(
        amount=data.amount,
        currency=data.currency,
        donor_name=data.donor_name,
        donor_email=data.donor_email,
        message=data.message,
        is_anonymous=data.is_anonymous,
        payment_provider="direct",
        status=DonationStatus.COMPLETED,
    )
    db.add(donation)
    db.commit()
    db.refresh(donation)
    return DonationResponse.model_validate(donation)
