import os
import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from dotenv import load_dotenv

from app.database.session import get_db
from app.models.donation import Donation, DonationStatus
from app.schemas.donation import DonationCreate, DonationResponse, PaymentIntentResponse, DonationStatusResponse
from app.services.email import send_donation_notification_email
from app.utils.auth import get_current_admin
from app.models.partner import PartnerOrganisation
from app.middleware.rate_limit import limiter

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"))

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/donations", tags=["Donations"])


@router.post("/create-payment-intent", response_model=PaymentIntentResponse)
@limiter.limit("10/15minutes")
def create_donation_intent(request: Request, data: DonationCreate, db: Session = Depends(get_db)):
    """
    Create a Stripe PaymentIntent for a donation.
    Returns a real client_secret from Stripe for the frontend to render PaymentElement.
    The donation is created with status=PENDING; it is only ever marked
    COMPLETED by the /webhook endpoint after Stripe confirms the charge.
    """
    import stripe

    stripe_key = os.getenv("STRIPE_SECRET_KEY")
    if not stripe_key:
        logger.error("[Stripe] STRIPE_SECRET_KEY is not configured")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Payments are not configured. Please try again later.",
        )
    stripe.api_key = stripe_key

    # Create donation record (pending until the webhook confirms payment)
    donation = Donation(
        amount=data.amount,
        currency=data.currency,
        donor_name=data.donor_name,
        donor_email=data.donor_email,
        message=data.message,
        is_anonymous=data.is_anonymous,
        payment_provider="stripe",
        status=DonationStatus.PENDING,
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
        donation.payment_intent_id = intent.id
        db.commit()

        logger.info(f"[Stripe] PaymentIntent created successfully for donation {donation.id} (amount: {data.amount} {data.currency})")
        return PaymentIntentResponse(
            client_secret=intent.client_secret,
            donation_id=donation.id,
            amount=data.amount,
            currency=data.currency,
        )
    except stripe.error.AuthenticationError as e:
        logger.error(f"[Stripe] AuthenticationError for donation {donation.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Stripe authentication failed",
        )
    except stripe.error.APIConnectionError as e:
        logger.error(f"[Stripe] APIConnectionError for donation {donation.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Could not connect to Stripe",
        )
    except stripe.error.InvalidRequestError as e:
        logger.error(f"[Stripe] InvalidRequestError for donation {donation.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Stripe request",
        )
    except Exception as e:
        logger.error(f"[Stripe] Unexpected error for donation {donation.id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Payment processing failed",
        )


@router.post("/webhook", include_in_schema=False)
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    """
    Stripe webhook endpoint. This is the ONLY place a donation is ever marked
    COMPLETED. The request signature is verified against STRIPE_WEBHOOK_SECRET
    so only Stripe itself (not a client) can trigger a status change.
    """
    import stripe

    webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET")
    if not webhook_secret:
        logger.error("[Stripe] STRIPE_WEBHOOK_SECRET is not configured; rejecting webhook")
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Webhook not configured")

    payload = await request.body()
    sig_header = request.headers.get("stripe-signature", "")

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
    except (ValueError, stripe.error.SignatureVerificationError) as e:
        logger.warning(f"[Stripe] Webhook signature verification failed: {e}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid signature")

    if event["type"] == "payment_intent.succeeded":
        intent = event["data"]["object"]
        donation = db.query(Donation).filter(Donation.payment_intent_id == intent["id"]).first()

        if not donation:
            logger.warning(f"[Stripe] Webhook for unknown payment_intent {intent['id']}")
            return {"received": True}

        if donation.status != DonationStatus.COMPLETED:
            donation.status = DonationStatus.COMPLETED
            db.commit()
            logger.info(f"[Donation] Confirmed via webhook: {donation.id} (amount: {donation.amount} {donation.currency})")

            send_donation_notification_email(
                donor_name=donation.donor_name,
                donor_email=donation.donor_email,
                amount=donation.amount,
                currency=donation.currency,
                is_anonymous=donation.is_anonymous,
                message=donation.message,
                db=db,
            )

    elif event["type"] == "payment_intent.payment_failed":
        intent = event["data"]["object"]
        donation = db.query(Donation).filter(Donation.payment_intent_id == intent["id"]).first()
        if donation and donation.status == DonationStatus.PENDING:
            donation.status = DonationStatus.FAILED
            db.commit()
            logger.info(f"[Donation] Marked failed via webhook: {donation.id}")

    return {"received": True}


@router.get("/status/{donation_id}", response_model=DonationStatusResponse)
def get_donation_status(donation_id: str, db: Session = Depends(get_db)):
    """
    Public, read-only status check so the frontend can poll for confirmation
    after redirecting back from Stripe. Cannot be used to change status.
    """
    import uuid
    try:
        uid = uuid.UUID(donation_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid ID")

    donation = db.query(Donation).filter(Donation.id == uid).first()
    if not donation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Donation not found")

    return DonationStatusResponse(id=donation.id, status=donation.status)


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


@router.post("/manual", response_model=DonationResponse, status_code=status.HTTP_201_CREATED)
def create_manual_donation(
    data: DonationCreate,
    db: Session = Depends(get_db),
    admin: PartnerOrganisation = Depends(get_current_admin),
):
    """
    Admin only: record a donation received outside Stripe (e.g. cash, bank
    transfer). This replaces the old public, unauthenticated demo endpoint —
    only an admin can mark a donation COMPLETED without a Stripe payment.
    """
    donation = Donation(
        amount=data.amount,
        currency=data.currency,
        donor_name=data.donor_name,
        donor_email=data.donor_email,
        message=data.message,
        is_anonymous=data.is_anonymous,
        payment_provider="manual",
        status=DonationStatus.COMPLETED,
    )
    db.add(donation)
    db.commit()
    db.refresh(donation)

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
