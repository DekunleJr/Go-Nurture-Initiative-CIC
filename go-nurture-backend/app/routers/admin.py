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
from app.schemas.referral import ReferralResponse, ReferralStatusUpdate
from app.schemas.partner import PartnerResponse
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

    return {
        "total": total,
        "skip": skip,
        "limit": limit,
    "referrals": [ReferralResponse.model_validate(r) for r in referrals],
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
        "contacts": [c.to_dict() for c in contacts],
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
        "donations": [d.to_dict() for d in donations],
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
    """Admin only: Get all cohorts."""
    cohorts = db.query(Cohort).order_by(Cohort.start_date.desc()).all()
    return [c.to_dict() for c in cohorts]


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