from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime, timedelta
from uuid import UUID

from app.database.session import get_db
from app.models.partner import PartnerOrganisation
from app.models.referral import Referral
from app.models.contact import ContactSubmission
from app.models.donation import Donation
from app.models.venue import Venue
from app.models.cohort import Cohort
from app.models.email_log import EmailLog
from app.schemas.referral import ReferralResponse, ReferralStatusUpdate
from app.schemas.partner import PartnerResponse
from app.schemas.donation import DonationResponse
from app.schemas.contact import ContactResponse
from app.utils.auth import get_current_admin
from app.services.geocode import geocode_address

router = APIRouter(prefix="/api/admin", tags=["Admin"])


@router.get("/referrals", response_model=dict)
def admin_get_all_referrals(
    db: Session = Depends(get_db),
    admin: PartnerOrganisation = Depends(get_current_admin),
    status_filter: Optional[str] = None,
    partner_id: Optional[UUID] = None,
    skip: int = 0,
    limit: int = 50,
):
    """Admin only: Get all referrals across all partners with filtering."""
    query = db.query(Referral)

    if status_filter:
        query = query.filter(Referral.status == status_filter)
    if partner_id:
        query = query.filter(Referral.partner_id == partner_id)

    total = query.count()
    referrals = query.order_by(Referral.created_at.desc()).offset(skip).limit(limit).all()

    enriched = []
    for r in referrals:
        data = ReferralResponse.model_validate(r).model_dump(mode="json")
        # partner name
        partner = db.query(PartnerOrganisation).filter(PartnerOrganisation.id == r.partner_id).first()
        data["partner_name"] = partner.organisation_name if partner else None
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

    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "referrals": enriched,
    }


@router.patch("/referrals/{referral_id}", response_model=dict)
def admin_update_referral_status(
    referral_id: UUID,
    update: ReferralStatusUpdate,
    db: Session = Depends(get_db),
    admin: PartnerOrganisation = Depends(get_current_admin),
):
    """Admin only: Update referral status and assign to cohort."""
    referral = db.query(Referral).filter(Referral.id == referral_id).first()
    if not referral:
        raise HTTPException(status_code=404, detail="Referral not found")

    referral.status = update.status
    if update.cohort_id is not None:
        cohort = db.query(Cohort).filter(Cohort.id == update.cohort_id).first()
        if not cohort:
            raise HTTPException(status_code=404, detail="Cohort not found")
        referral.cohort_id = update.cohort_id

    db.commit()
    db.refresh(referral)
    return {"message": "Referral updated successfully", "referral_id": referral.id}


@router.get("/contacts", response_model=dict)
def admin_get_all_contacts(
    db: Session = Depends(get_db),
    admin: PartnerOrganisation = Depends(get_current_admin),
    skip: int = 0,
    limit: int = 50,
):
    """Admin only: Get all contact form submissions."""
    query = db.query(ContactSubmission)
    total = query.count()
    contacts = query.order_by(ContactSubmission.created_at.desc()).offset(skip).limit(limit).all()
    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "contacts": [ContactResponse.model_validate(c) for c in contacts],
    }


@router.get("/donations", response_model=dict)
def admin_get_all_donations(
    db: Session = Depends(get_db),
    admin: PartnerOrganisation = Depends(get_current_admin),
    skip: int = 0,
    limit: int = 50,
):
    """Admin only: Get all donations with summary stats."""
    query = db.query(Donation)
    total = query.count()
    total_amount = db.query(func.sum(Donation.amount)).scalar() or 0
    donations = query.order_by(Donation.created_at.desc()).offset(skip).limit(limit).all()
    return {
        "total": total,
        "total_amount": total_amount,
        "skip": skip,
        "limit": limit,
        "donations": [DonationResponse.model_validate(d) for d in donations],
    }


@router.get("/partners", response_model=List[PartnerResponse])
def admin_get_all_partners(
    db: Session = Depends(get_db),
    admin: PartnerOrganisation = Depends(get_current_admin),
):
    """Admin only: Get all partner organisations."""
    partners = db.query(PartnerOrganisation).order_by(PartnerOrganisation.created_at.desc()).all()
    return [PartnerResponse.model_validate(p) for p in partners]


@router.patch("/partners/{partner_id}", response_model=dict)
def admin_update_partner(
    partner_id: UUID,
    update_data: dict,
    db: Session = Depends(get_db),
    admin: PartnerOrganisation = Depends(get_current_admin),
):
    """Admin only: Update partner details (name, contact, phone, type, is_admin)."""
    partner = db.query(PartnerOrganisation).filter(PartnerOrganisation.id == partner_id).first()
    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")

    allowed_fields = {"organisation_name", "contact_name", "phone", "organisation_type", "is_admin"}
    for key, value in update_data.items():
        if key in allowed_fields:
            setattr(partner, key, value)

    db.commit()
    db.refresh(partner)
    return {"message": "Partner updated successfully", "partner_id": str(partner_id)}


@router.patch("/partners/{partner_id}/activate")
def admin_activate_partner(
    partner_id: UUID,
    db: Session = Depends(get_db),
    admin: PartnerOrganisation = Depends(get_current_admin),
):
    """Admin only: Activate a partner account."""
    partner = db.query(PartnerOrganisation).filter(PartnerOrganisation.id == partner_id).first()
    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")
    partner.is_active = True
    db.commit()
    return {"message": "Partner activated successfully"}


@router.patch("/partners/{partner_id}/deactivate")
def admin_deactivate_partner(
    partner_id: UUID,
    db: Session = Depends(get_db),
    admin: PartnerOrganisation = Depends(get_current_admin),
):
    """Admin only: Deactivate a partner account."""
    partner = db.query(PartnerOrganisation).filter(PartnerOrganisation.id == partner_id).first()
    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")
    partner.is_active = False
    db.commit()
    return {"message": "Partner deactivated successfully"}


@router.get("/stats", response_model=dict)
def admin_get_stats(
    db: Session = Depends(get_db),
    admin: PartnerOrganisation = Depends(get_current_admin),
):
    """Admin only: Get overview statistics."""
    total_partners = db.query(PartnerOrganisation).count()
    active_partners = db.query(PartnerOrganisation).filter(PartnerOrganisation.is_active == True).count()
    total_referrals = db.query(Referral).count()
    pending_referrals = db.query(Referral).filter(Referral.status == "pending").count()
    total_donations = db.query(Donation).count()
    total_donation_amount = db.query(func.sum(Donation.amount)).scalar() or 0
    total_contacts = db.query(ContactSubmission).count()
    total_venues = db.query(Venue).count()
    total_cohorts = db.query(Cohort).count()

    referrals_by_status = db.query(Referral.status, func.count(Referral.id)).group_by(Referral.status).all()
    status_counts = {status: count for status, count in referrals_by_status}

    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    recent_referrals = db.query(Referral).filter(Referral.created_at >= thirty_days_ago).count()

    return {
        "total_partners": total_partners,
        "active_partners": active_partners,
        "total_referrals": total_referrals,
        "pending_referrals": pending_referrals,
        "recent_referrals": recent_referrals,
        "total_donations": total_donations,
        "total_donation_amount": total_donation_amount,
        "total_contacts": total_contacts,
        "total_venues": total_venues,
        "total_cohorts": total_cohorts,
        "referrals_by_status": status_counts,
    }


@router.get("/venues", response_model=List[dict])
def admin_get_all_venues(
    db: Session = Depends(get_db),
    admin: PartnerOrganisation = Depends(get_current_admin),
):
    """Admin only: Get all venues with details."""
    venues = db.query(Venue).all()
    return [v.to_dict() for v in venues]


@router.post("/venues", response_model=dict)
def admin_create_venue(
    venue_data: dict,
    db: Session = Depends(get_db),
    admin: PartnerOrganisation = Depends(get_current_admin),
):
    """Admin only: Create a new venue. Geocodes the address if no coordinates provided."""
    # If coordinates are missing, try to geocode from the address
    if not venue_data.get("latitude") or not venue_data.get("longitude"):
        coords = geocode_address(
            venue_data.get("address", ""),
            venue_data.get("city"),
            venue_data.get("postcode"),
        )
        if coords:
            venue_data["latitude"] = coords["lat"]
            venue_data["longitude"] = coords["lon"]

    venue = Venue(**venue_data)
    db.add(venue)
    db.commit()
    db.refresh(venue)
    return {"message": "Venue created successfully", "venue_id": venue.id}


@router.patch("/venues/{venue_id}", response_model=dict)
def admin_update_venue(
    venue_id: UUID,
    venue_data: dict,
    db: Session = Depends(get_db),
    admin: PartnerOrganisation = Depends(get_current_admin),
):
    """Admin only: Update a venue. Geocodes the address if coordinates are not provided."""
    venue = db.query(Venue).filter(Venue.id == venue_id).first()
    if not venue:
        raise HTTPException(status_code=404, detail="Venue not found")

    allowed_fields = {
        "name", "address", "city", "postcode", "capacity",
        "description", "latitude", "longitude", "is_active",
    }

    for key, value in venue_data.items():
        if key in allowed_fields:
            setattr(venue, key, value)

    # If coordinates are missing/null after the update, try to geocode from the address
    if not venue.latitude or not venue.longitude:
        coords = geocode_address(venue.address, venue.city, venue.postcode)
        if coords:
            venue.latitude = coords["lat"]
            venue.longitude = coords["lon"]

    db.commit()
    db.refresh(venue)
    return {"message": "Venue updated successfully", "venue": venue.to_dict()}


@router.delete("/venues/{venue_id}", response_model=dict)
def admin_delete_venue(
    venue_id: UUID,
    db: Session = Depends(get_db),
    admin: PartnerOrganisation = Depends(get_current_admin),
):
    """Admin only: Delete a venue."""
    venue = db.query(Venue).filter(Venue.id == venue_id).first()
    if not venue:
        raise HTTPException(status_code=404, detail="Venue not found")
    db.delete(venue)
    db.commit()
    return {"message": "Venue deleted successfully", "venue_id": str(venue_id)}


@router.get("/cohorts", response_model=List[dict])
def admin_get_all_cohorts(
    db: Session = Depends(get_db),
    admin: PartnerOrganisation = Depends(get_current_admin),
):
    """Admin only: Get all cohorts with venue details and assigned referrals."""
    cohorts = db.query(Cohort).order_by(Cohort.start_date.desc()).all()
    result = []
    for cohort in cohorts:
        data = cohort.to_dict()

        # Attach venue name, address, and city
        if cohort.venue_id:
            venue = db.query(Venue).filter(Venue.id == cohort.venue_id).first()
            data["venue_name"] = venue.name if venue else None
            data["venue_address"] = venue.address if venue else None
            data["venue_city"] = venue.city if venue else None
        else:
            data["venue_name"] = None
            data["venue_address"] = None
            data["venue_city"] = None

        # Attach the referrals (people) assigned to this cohort
        referrals = (
            db.query(Referral)
            .filter(Referral.cohort_id == cohort.id)
            .order_by(Referral.created_at.desc())
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
                "created_at": r.created_at.isoformat() if r.created_at else None,
            }
            for r in referrals
        ]

        result.append(data)
    return result


@router.post("/cohorts", response_model=dict)
def admin_create_cohort(
    cohort_data: dict,
    db: Session = Depends(get_db),
    admin: PartnerOrganisation = Depends(get_current_admin),
):
    """Admin only: Create a new cohort."""
    cohort = Cohort(**cohort_data)
    db.add(cohort)
    db.commit()
    db.refresh(cohort)
    return {"message": "Cohort created successfully", "cohort_id": cohort.id}


@router.patch("/cohorts/{cohort_id}", response_model=dict)
def admin_update_cohort(
    cohort_id: UUID,
    cohort_data: dict,
    db: Session = Depends(get_db),
    admin: PartnerOrganisation = Depends(get_current_admin),
):
    """Admin only: Update a cohort."""
    cohort = db.query(Cohort).filter(Cohort.id == cohort_id).first()
    if not cohort:
        raise HTTPException(status_code=404, detail="Cohort not found")

    allowed_fields = {
        "name", "year", "start_date", "end_date",
        "max_participants", "is_active", "description", "venue_id",
    }

    for key, value in cohort_data.items():
        if key in allowed_fields:
            setattr(cohort, key, value)

    db.commit()
    db.refresh(cohort)
    return {"message": "Cohort updated successfully", "cohort": cohort.to_dict()}


@router.get("/email-logs", response_model=dict)
def admin_get_email_logs(
    db: Session = Depends(get_db),
    admin: PartnerOrganisation = Depends(get_current_admin),
    skip: int = 0,
    limit: int = 50,
    email_type: str | None = None,
):
    """Admin only: Get all email logs with optional filtering."""
    query = db.query(EmailLog)
    if email_type:
        query = query.filter(EmailLog.email_type == email_type)
    total = query.count()
    logs = query.order_by(EmailLog.created_at.desc()).offset(skip).limit(limit).all()
    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "logs": [
            {
                "id": str(log.id),
                "recipient_email": log.recipient_email,
                "subject": log.subject,
                "email_type": log.email_type,
                "status": log.status,
                "error_message": log.error_message,
                "created_at": log.created_at.isoformat() if log.created_at else None,
            }
            for log in logs
        ],
    }


@router.delete("/cohorts/{cohort_id}", response_model=dict)
def admin_delete_cohort(
    cohort_id: UUID,
    db: Session = Depends(get_db),
    admin: PartnerOrganisation = Depends(get_current_admin),
):
    """Admin only: Delete a cohort."""
    cohort = db.query(Cohort).filter(Cohort.id == cohort_id).first()
    if not cohort:
        raise HTTPException(status_code=404, detail="Cohort not found")
    db.delete(cohort)
    db.commit()
    return {"message": "Cohort deleted successfully", "cohort_id": str(cohort_id)}
