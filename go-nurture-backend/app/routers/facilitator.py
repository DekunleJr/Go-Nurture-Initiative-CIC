from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List
from uuid import UUID

from app.database.session import get_db
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

    cohort_ids = [cohort.id for cohort in cohorts]
    venue_ids = [cohort.venue_id for cohort in cohorts if cohort.venue_id]
    venues_by_id = {
        venue.id: venue
        for venue in db.query(Venue).filter(Venue.id.in_(venue_ids)).all()
    } if venue_ids else {}

    referrals_by_cohort: dict[UUID, list[Referral]] = {cohort_id: [] for cohort_id in cohort_ids}
    if cohort_ids:
        referrals = (
            db.query(Referral)
            .filter(
                or_(
                    Referral.cohort_id.in_(cohort_ids),
                    Referral.clinic_cohort_id.in_(cohort_ids),
                )
            )
            .order_by(Referral.mother_name.asc())
            .all()
        )
        for referral in referrals:
            for assigned_cohort_id in (referral.cohort_id, referral.clinic_cohort_id):
                if assigned_cohort_id in referrals_by_cohort:
                    referrals_by_cohort[assigned_cohort_id].append(referral)

    result = []
    for cohort in cohorts:
        data = cohort.to_dict()

        # Computed class schedule (Birth Confidence: 6 weekly classes; Clinic: single date)
        if cohort.cohort_type == "breastfeeding_clinic":
            data["schedule"] = [cohort.start_date.isoformat()]
        else:
            data["schedule"] = [d.isoformat() for d in compute_class_schedule(cohort.start_date)]

        # Venue details
        venue = venues_by_id.get(cohort.venue_id)
        if venue:
            data["venue_name"] = venue.name if venue else None
            data["venue_address"] = venue.address if venue else None
            data["venue_city"] = venue.city if venue else None
        else:
            data["venue_name"] = None
            data["venue_address"] = None
            data["venue_city"] = None

        # Enrolled mothers (via either assignment slot)
        referrals = referrals_by_cohort.get(cohort.id, [])
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


@router.get("/reviews", response_model=List[SessionReviewResponse])
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
        data = SessionReviewResponse.model_validate(r)
        data.cohort_name = cohort.name if cohort else None
        data.facilitator_name = current_facilitator.name
        result.append(data)
    return result
