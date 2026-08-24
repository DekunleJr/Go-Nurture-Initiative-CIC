from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.database.session import get_db
from app.models.facilitator import Facilitator
from app.models.cohort import Cohort
from app.models.referral import Referral
from app.models.venue import Venue
from app.utils.auth import get_current_facilitator
from app.schemas.partner import FacilitatorResponse
from app.services.email import compute_class_schedule
from app.models.session_review import SessionReview
from app.schemas.session_review import SessionReviewCreate, SessionReviewResponse
from app.models.facilitator import Facilitator

router = APIRouter(prefix="/api/facilitator", tags=["Facilitator"])


@router.get("/me", response_model=FacilitatorResponse)
def get_me(current_facilitator: Facilitator = Depends(get_current_facilitator)):
    """Get the currently authenticated facilitator's details."""
    return FacilitatorResponse.model_validate(current_facilitator)


@router.get("/my-cohorts", response_model=List[dict])
def get_my_cohorts(
    db: Session = Depends(get_db),
    current_facilitator: Facilitator = Depends(get_current_facilitator),
):
    """
    List all cohorts assigned to the authenticated facilitator, including the
    computed class schedule, venue details and enrolled mothers.
    """
    cohorts = (
        db.query(Cohort)
        .filter(Cohort.facilitator_id == current_facilitator.id)
        .order_by(Cohort.start_date.asc())
        .all()
    )

    result = []
    for cohort in cohorts:
        data = cohort.to_dict()

        # Computed class schedule (Birth Confidence: 6 weekly classes; Clinic: single date)
        if cohort.cohort_type == "breastfeeding_clinic":
            data["schedule"] = [cohort.start_date.isoformat()]
        else:
            data["schedule"] = [d.isoformat() for d in compute_class_schedule(cohort.start_date)]

        # Venue details
        if cohort.venue_id:
            venue = db.query(Venue).filter(Venue.id == cohort.venue_id).first()
            data["venue_name"] = venue.name if venue else None
            data["venue_address"] = venue.address if venue else None
            data["venue_city"] = venue.city if venue else None
        else:
            data["venue_name"] = None
            data["venue_address"] = None
            data["venue_city"] = None

        # Enrolled mothers (via either assignment slot)
        referrals = (
            db.query(Referral)
            .filter(
                (Referral.cohort_id == cohort.id) | (Referral.clinic_cohort_id == cohort.id)
            )
            .order_by(Referral.mother_name.asc())
            .all()
        )
        data["members"] = [
            {
                "id": str(r.id),
                "mother_name": r.mother_name,
                "mother_phone": r.mother_phone,
                "estimated_due_date": r.estimated_due_date.isoformat() if r.estimated_due_date else None,
                "status": r.status,
                "language_requirement": r.language_requirement,
                "requires_interpreter": r.requires_interpreter,
            }
            for r in referrals
        ]

        result.append(data)

    return result


@router.post("/reviews", response_model=dict)
def submit_session_review(
    data: SessionReviewCreate,
    db: Session = Depends(get_db),
    current_facilitator: Facilitator = Depends(get_current_facilitator),
):
    """Facilitator submits or updates a delivery audit for one of their cohorts."""
    # Verify this facilitator is assigned to that cohort
    cohort = db.query(Cohort).filter(
        Cohort.id == data.cohort_id,
        Cohort.facilitator_id == current_facilitator.id,
    ).first()
    if not cohort:
        raise HTTPException(status_code=404, detail="Cohort not found or not assigned to you")

    # Existing review for this cohort+session? Update it; otherwise create
    existing = (
        db.query(SessionReview)
        .filter(
            SessionReview.cohort_id == data.cohort_id,
            SessionReview.session_date == data.session_date,
            SessionReview.facilitator_id == current_facilitator.id,
        )
        .first()
    )

    payload = data.model_dump()
    if existing:
        for field, value in payload.items():
            setattr(existing, field, value)
        if data.status == "submitted":
            existing.submitted_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(existing)
        return {"message": "Review updated", "review_id": str(existing.id), "status": existing.status}

    review = SessionReview(
        cohort_id=data.cohort_id,
        facilitator_id=current_facilitator.id,
        **{k: v for k, v in payload.items() if k != "cohort_id"},
    )
    if data.status == "submitted":
        review.submitted_at = datetime.now(timezone.utc)
    db.add(review)
    db.commit()
    db.refresh(review)
    return {"message": "Review submitted", "review_id": str(review.id), "status": review.status}


@router.get("/reviews", response_model=List[dict])
def list_my_reviews(
    db: Session = Depends(get_db),
    current_facilitator: Facilitator = Depends(get_current_facilitator),
):
    """List this facilitator's session reviews with cohort names."""
    reviews = (
        db.query(SessionReview)
        .filter(SessionReview.facilitator_id == current_facilitator.id)
        .order_by(SessionReview.session_date.desc())
        .all()
    )
    result = []
    for r in reviews:
        cohort = db.query(Cohort).filter(Cohort.id == r.cohort_id).first()
        data = r.__dict__
        data["cohort_name"] = cohort.name if cohort else None
        data["facilitator_name"] = current_facilitator.name
        result.append(data)
    return result
