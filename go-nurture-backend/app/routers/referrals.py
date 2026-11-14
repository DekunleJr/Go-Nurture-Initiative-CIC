import secrets
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Request
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.database.session import get_db
from app.models.referral import Referral
from app.models.partner import PartnerOrganisation
from app.models.cohort import Cohort
from app.models.venue import Venue
from app.schemas.referral import ReferralCreate, ReferralResponse, ReferralStatusUpdate
from app.utils.auth import get_current_partner
from app.schemas.referral import ReferralUpdate
from app.services.email import send_referral_notification_email, PROGRAM_NAMES
from app.middleware.rate_limit import limiter

router = APIRouter(prefix="/api/referrals", tags=["Referrals"])

# No 0/O/1/I so references are easy to read out over the phone.
_REFERENCE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"


def _generate_reference() -> str:
    suffix = "".join(secrets.choice(_REFERENCE_ALPHABET) for _ in range(6))
    return f"GNI-{datetime.now(timezone.utc).year}-{suffix}"


def apply_referral_updates(referral: Referral, updates: dict) -> None:
    """Apply edited fields, keeping `interpreter_support` and the legacy
    `requires_interpreter` boolean consistent with each other."""
    # mother_name / due date etc. are plain columns; a null name is never valid.
    if "mother_name" in updates and not updates["mother_name"]:
        raise HTTPException(status_code=400, detail="Name cannot be empty")
    for field, value in updates.items():
        setattr(referral, field, value)
    if "interpreter_support" in updates:
        referral.requires_interpreter = updates["interpreter_support"] == "yes"
    elif "requires_interpreter" in updates:
        if updates["requires_interpreter"]:
            referral.interpreter_support = "yes"
        elif referral.interpreter_support == "yes":
            referral.interpreter_support = "no"


@router.post("/", response_model=ReferralResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("20/15minutes")
def create_referral(
    request: Request,
    data: ReferralCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_partner: PartnerOrganisation = Depends(get_current_partner),
):
    """Submit a new referral (authenticated partner only)."""
    if not data.consent_obtained:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You must confirm that explicit consent has been obtained from the mother",
        )

    values = data.model_dump(exclude={"consent_obtained", "interpreter_support"})
    referral = Referral(
        partner_id=current_partner.id,
        interpreter_support=data.interpreter_support,
        requires_interpreter=data.interpreter_support == "yes",
        consent_obtained=data.consent_obtained,
        **values,
    )

    # Public reference number; retry on the (very unlikely) collision.
    for _ in range(5):
        candidate = _generate_reference()
        if not db.query(Referral.id).filter(Referral.reference_number == candidate).first():
            referral.reference_number = candidate
            break
    else:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not generate a referral reference. Please try again.",
        )

    db.add(referral)
    db.commit()
    db.refresh(referral)

    # Admin notification (no personal details in the email body)
    background_tasks.add_task(
        send_referral_notification_email,
        reference_number=referral.reference_number,
        partner_name=current_partner.organisation_name,
        referral_type=referral.referral_type,
        interpreter_support=referral.interpreter_support,
        db=db,
    )

    return ReferralResponse.model_validate(referral)


@router.get("/", response_model=List[ReferralResponse])
def list_my_referrals(
    db: Session = Depends(get_db),
    current_partner: PartnerOrganisation = Depends(get_current_partner),
):
    """List all referrals submitted by the authenticated partner."""
    referrals = (
        db.query(Referral)
        .filter(Referral.partner_id == current_partner.id)
        .order_by(Referral.created_at.desc())
        .all()
    )

    enriched = []
    for r in referrals:
        data = ReferralResponse.model_validate(r).model_dump(mode="json")
        # cohort name
        if r.cohort_id:
            cohort = db.query(Cohort).filter(Cohort.id == r.cohort_id).first()
            data["cohort_name"] = cohort.name if cohort else None
            # venue name via cohort
            if cohort and cohort.venue_id:
                venue = db.query(Venue).filter(Venue.id == cohort.venue_id).first()
                data["venue_name"] = venue.name if venue else None
            else:
                data["venue_name"] = None
        else:
            data["cohort_name"] = None
            data["venue_name"] = None
        # clinic cohort name (breastfeeding clinic slot)
        if r.clinic_cohort_id:
            clinic_cohort = db.query(Cohort).filter(Cohort.id == r.clinic_cohort_id).first()
            data["clinic_cohort_name"] = clinic_cohort.name if clinic_cohort else None
        else:
            data["clinic_cohort_name"] = None
        enriched.append(data)

    return enriched


@router.get("/{referral_id}", response_model=ReferralResponse)
def get_referral(
    referral_id: UUID,
    db: Session = Depends(get_db),
    current_partner: PartnerOrganisation = Depends(get_current_partner),
):
    """Get a specific referral by ID."""
    referral = db.query(Referral).filter(Referral.id == referral_id).first()
    if not referral:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Referral not found")
    if referral.partner_id != current_partner.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your referral")
    return ReferralResponse.model_validate(referral)


@router.patch("/{referral_id}", response_model=ReferralResponse)
def update_my_referral(
    referral_id: UUID,
    update: ReferralUpdate,
    db: Session = Depends(get_db),
    current_partner: PartnerOrganisation = Depends(get_current_partner),
):
    """
    Edit a referral's details (partner who submitted it only).
    Blocked once the referral is completed or declined.
    """
    referral = db.query(Referral).filter(Referral.id == referral_id).first()
    if not referral:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Referral not found")
    if referral.partner_id != current_partner.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your referral")
    if referral.status in ("completed", "declined"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This referral can no longer be edited because it has been completed or declined.",
        )

    apply_referral_updates(referral, update.model_dump(exclude_unset=True))

    db.commit()
    db.refresh(referral)
    return ReferralResponse.model_validate(referral)
