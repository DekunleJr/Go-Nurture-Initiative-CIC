from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.database.session import get_db
from app.models.referral import Referral
from app.models.partner import PartnerOrganisation
from app.schemas.referral import ReferralCreate, ReferralResponse, ReferralStatusUpdate
from app.utils.auth import get_current_partner

router = APIRouter(prefix="/api/referrals", tags=["Referrals"])


@router.post("/", response_model=ReferralResponse, status_code=status.HTTP_201_CREATED)
def create_referral(
    data: ReferralCreate,
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
    return [ReferralResponse.model_validate(r) for r in referrals]


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