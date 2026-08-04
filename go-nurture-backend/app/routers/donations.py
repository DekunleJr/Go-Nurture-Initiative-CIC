import os
import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from dotenv import load_dotenv

from app.database.session import get_db
from app.models.donation import Donation, DonationStatus
from app.schemas.donation import DonationCreate, DonationResponse, PaymentIntentResponse
from app.services.email import send_donation_notification_email

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"))

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/donations", tags=["Donations"])


@router.post("/create-payment-intent", response_model=PaymentIntentResponse)
def create_donation_intent(data: DonationCreate, db: Session = Depends(get_db)):
    """
    Create a Stripe PaymentIntent for a donation.
    Returns a real client_secret from Stripe for the frontend to render PaymentElement.
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
        # Create a real Stripe PaymentIntent
        intent = stripe.PaymentIntent.create(
            amount=int(data.amount * 100),  # Convert to cents/pence
            currency=data.currency.lower(),
            metadata={"donation_id": str(donation.id)},
            automatic_payment_methods={"enabled": True},
        )
        logger.info(f"[Stripe] PaymentIntent created successfully for donation {donation.id} (amount: {data.amount} {data.currency})")
        return PaymentIntentResponse(
            client_secret=intent.client_secret,
            donation_id=donation.id,
            amount=data.amount,
            currency=data.currency,
        )
    except stripe.error.AuthenticationError as e:
        # Invalid API key
        logger.error(f"[Stripe] AuthenticationError for donation {donation.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Stripe authentication failed: {str(e)}"
        )
    except stripe.error.APIConnectionError as e:
        # Network problem
        logger.error(f"[Stripe] APIConnectionError for donation {donation.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Could not connect to Stripe: {str(e)}"
        )
    except stripe.error.InvalidRequestError as e:
        # Invalid parameters
        logger.error(f"[Stripe] InvalidRequestError for donation {donation.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid Stripe request: {str(e)}"
        )
    except Exception as e:
        # Any other Stripe error
        logger.error(f"[Stripe] Unexpected error for donation {donation.id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Payment processing failed: {str(e)}"
        )


@router.post("/confirm/{donation_id}")
def confirm_donation(donation_id: str, db: Session = Depends(get_db)):
    """Mark a donation as completed after successful payment."""
    import uuid
    try:
        uid = uuid.UUID(donation_id)
    except ValueError:
        logger.warning(f"[Donation] Confirm failed - invalid UUID: {donation_id}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid ID")

    donation = db.query(Donation).filter(Donation.id == uid).first()
    if not donation:
        logger.warning(f"[Donation] Confirm failed - donation not found: {donation_id}")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Donation not found")

    donation.status = DonationStatus.COMPLETED
    db.commit()
    logger.info(f"[Donation] Confirmed donation {donation_id} (amount: {donation.amount} {donation.currency})")

    # Send admin notification email
    send_donation_notification_email(
        donor_name=donation.donor_name,
        donor_email=donation.donor_email,
        amount=donation.amount,
        currency=donation.currency,
        is_anonymous=donation.is_anonymous,
        message=donation.message,
        db=db,
    )

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

    # Send admin notification email
    send_donation_notification_email(
        donor_name=donation.donor_name,
        donor_email=donation.donor_email,
        amount=donation.amount,
        currency=donation.currency,
        is_anonymous=donation.is_anonymous,
        message=donation.message,
        db=db,
    )

    return DonationResponse.model_validate(donation)
