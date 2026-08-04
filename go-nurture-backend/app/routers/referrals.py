from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
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
from app.services.email import send_referral_notification_email

router = APIRouter(prefix="/api/referrals", tags=["Referrals"])


@router.post("/", response_model=ReferralResponse, status_code=status.HTTP_201_CREATED)
def create_referral(
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

    referral = Referral(
        partner_id=current_partner.id,
        mother_name=data.mother_name,
        mother_phone=data.mother_phone,
        estimated_due_date=data.estimated_due_date,
        language_requirement=data.language_requirement,
        additional_notes=data.additional_notes,
        requires_interpreter=data.requires_interpreter,
        consent_obtained=data.consent_obtained,
    )
    db.add(referral)
    db.commit()
    db.refresh(referral)

    # Send admin notification email in the background
    background_tasks.add_task(
        send_referral_notification_email,
        mother_name=referral.mother_name,
        mother_phone=referral.mother_phone,
        due_date=referral.estimated_due_date.isoformat() if referral.estimated_due_date else "",
        partner_name=current_partner.organisation_name,
        language_requirement=referral.language_requirement,
        requires_interpreter=referral.requires_interpreter,
        additional_notes=referral.additional_notes,
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