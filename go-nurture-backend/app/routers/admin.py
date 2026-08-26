from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi import Query
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
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
from app.models.community_partner import CommunityPartner
from app.models.facilitator import Facilitator
from app.models.session_review import SessionReview
from app.schemas.referral import ReferralResponse, ReferralStatusUpdate, ReferralUpdate
from app.schemas.partner import PartnerResponse
from app.schemas.donation import DonationResponse
from app.schemas.contact import ContactResponse
from app.schemas.community_partner import CommunityPartnerResponse, CommunityPartnerCreate, CommunityPartnerUpdate
from app.schemas.partner import FacilitatorResponse, FacilitatorCreate
from app.schemas.session_review import SessionReviewResponse
from app.schemas.admin import CohortCreate, CohortUpdate, FacilitatorAssignment, PartnerUpdate
from app.schemas.venue import VenueCreate, VenueUpdate
from app.utils.auth import get_current_admin
from app.services.geocode import geocode_address
from app.services.email import (
    send_referral_approval_email,
    send_cohort_assignment_email_to_partner,
    send_cohort_assignment_email_to_mother,
    send_facilitator_assignment_email,
)
from app.models.email_template import EmailTemplate, EmailQueueItem
from app.schemas.email import (
    EmailPreviewRequest,
    EmailQueueResponse,
    EmailTemplateResponse,
    EmailTemplateUpdate,
    EmailTestSendRequest,
)
from app.services.email_queue import enqueue_email, process_email_queue
from app.services.email_templates import environment
from jinja2 import UndefinedError
import os
import resend

router = APIRouter(prefix="/api/admin", tags=["Admin"])


@router.get("/email-templates", response_model=List[EmailTemplateResponse])
def admin_list_email_templates(
    db: Session = Depends(get_db),
    admin: PartnerOrganisation = Depends(get_current_admin),
):
    return db.query(EmailTemplate).order_by(EmailTemplate.template_key, EmailTemplate.version.desc()).all()


@router.patch("/email-templates/{template_key}", response_model=EmailTemplateResponse)
def admin_update_email_template(
    template_key: str,
    data: EmailTemplateUpdate,
    db: Session = Depends(get_db),
    admin: PartnerOrganisation = Depends(get_current_admin),
):
    current = (
        db.query(EmailTemplate)
        .filter(EmailTemplate.template_key == template_key, EmailTemplate.is_active.is_(True))
        .order_by(EmailTemplate.version.desc())
        .first()
    )
    if not current:
        raise HTTPException(status_code=404, detail="Email template not found")
    current.is_active = False
    version = EmailTemplate(
        template_key=template_key,
        name=data.name,
        subject=data.subject,
        body=data.body,
        version=current.version + 1,
        is_active=True,
        created_by=admin.email,
    )
    db.add(version)
    db.commit()
    db.refresh(version)
    return version


def _render_template(template_key: str, variables: dict[str, object], db: Session) -> tuple[str, str]:
    template = (
        db.query(EmailTemplate)
        .filter(EmailTemplate.template_key == template_key, EmailTemplate.is_active.is_(True))
        .order_by(EmailTemplate.version.desc())
        .first()
    )
    if not template:
        raise HTTPException(status_code=404, detail="Email template not found")
    try:
        subject = environment.from_string(template.subject).render(**variables).strip()
        body = environment.from_string(template.body).render(**variables).strip()
    except UndefinedError as exc:
        missing_variable = str(exc).split("'")[1] if "'" in str(exc) else str(exc)
        raise HTTPException(
            status_code=422,
            detail=f"Missing template variable: {missing_variable}",
        ) from exc
    return subject, body


@router.post("/email-templates/{template_key}/preview", response_model=dict)
def admin_preview_email_template(
    template_key: str,
    data: EmailPreviewRequest,
    db: Session = Depends(get_db),
    admin: PartnerOrganisation = Depends(get_current_admin),
):
    subject, body = _render_template(template_key, data.variables, db)
    return {"template_key": template_key, "subject": subject, "body": body}


@router.post("/email-templates/{template_key}/test-send", response_model=dict)
def admin_test_send_email_template(
    template_key: str,
    data: EmailTestSendRequest,
    db: Session = Depends(get_db),
    admin: PartnerOrganisation = Depends(get_current_admin),
):
    subject, body = _render_template(template_key, data.variables, db)
    api_key = os.getenv("RESEND_API_KEY", "")
    if not api_key or api_key == "re_xxxxxxxxxxxx":
        raise HTTPException(status_code=503, detail="Email provider is not configured")
    resend.api_key = api_key
    try:
        response = resend.Emails.send({
            "from": os.getenv("RESEND_FROM_EMAIL", "Go Nurture <noreply@gonurture.org>"),
            "to": data.recipient_email,
            "subject": subject,
            "text": body,
        })
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Test email failed: {exc}") from exc
    return {"message": "Test email sent", "provider_response": str(response)}


@router.post("/email-templates/{template_key}/queue", response_model=EmailQueueResponse)
def admin_queue_email_template(
    template_key: str,
    data: EmailTestSendRequest,
    db: Session = Depends(get_db),
    admin: PartnerOrganisation = Depends(get_current_admin),
):
    subject, body = _render_template(template_key, data.variables, db)
    return enqueue_email(db, template_key, data.recipient_email, subject, body)


@router.get("/email-queue", response_model=List[EmailQueueResponse])
def admin_list_email_queue(
    db: Session = Depends(get_db),
    admin: PartnerOrganisation = Depends(get_current_admin),
    status_filter: str | None = Query(None, alias="status"),
    limit: int = Query(50, ge=1, le=100),
):
    query = db.query(EmailQueueItem)
    if status_filter:
        query = query.filter(EmailQueueItem.status == status_filter)
    return query.order_by(EmailQueueItem.created_at.desc()).limit(limit).all()


@router.post("/email-queue/process", response_model=dict)
def admin_process_email_queue(
    db: Session = Depends(get_db),
    admin: PartnerOrganisation = Depends(get_current_admin),
):
    return {"processed": process_email_queue(db)}


@router.post("/email-queue/{queue_id}/retry", response_model=EmailQueueResponse)
def admin_retry_email(
    queue_id: UUID,
    db: Session = Depends(get_db),
    admin: PartnerOrganisation = Depends(get_current_admin),
):
    item = db.query(EmailQueueItem).filter(EmailQueueItem.id == queue_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Queued email not found")
    item.status = "pending"
    item.next_attempt_at = datetime.utcnow()
    item.last_error = None
    db.commit()
    db.refresh(item)
    return item


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
        # cohort name (birth confidence slot)
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
    """Admin only: Update referral status and assign to cohort.

    A mother can hold ONE cohort per program type:
      - Birth Confidence Program cohorts fill `cohort_id`
      - Breastfeeding Support Clinic cohorts fill `clinic_cohort_id`
    Assigning within a type replaces the previous assignment of that type.
    """
    referral = db.query(Referral).filter(Referral.id == referral_id).first()
    if not referral:
        raise HTTPException(status_code=404, detail="Referral not found")

    previous_bc_cohort_id = referral.cohort_id
    previous_clinic_cohort_id = referral.clinic_cohort_id

    target_cohort = None
    if update.cohort_id is not None:
        target_cohort = db.query(Cohort).filter(Cohort.id == update.cohort_id).first()
        if not target_cohort:
            raise HTTPException(status_code=404, detail="Cohort not found")

    referral.status = update.status
    assignment_changed = False
    if target_cohort is not None:
        if target_cohort.cohort_type == "breastfeeding_clinic":
            assignment_changed = update.cohort_id != previous_clinic_cohort_id
            referral.clinic_cohort_id = update.cohort_id  # replaces previous clinic slot
        else:
            assignment_changed = update.cohort_id != previous_bc_cohort_id
            referral.cohort_id = update.cohort_id  # replaces previous birth-confidence slot

    db.commit()
    db.refresh(referral)

    partner = db.query(PartnerOrganisation).filter(PartnerOrganisation.id == referral.partner_id).first()

    # When a mother is assigned (or re-assigned) to a cohort, notify BOTH the
    # referring partner organisation AND the mother herself.
    if assignment_changed and target_cohort is not None:
        cohort = target_cohort
        venue = None
        if cohort.venue_id:
            venue = db.query(Venue).filter(Venue.id == cohort.venue_id).first()

        venue_name = venue.name if venue else None
        venue_address = venue.address if venue else None
        venue_city = venue.city if venue else None

        if partner:
            send_cohort_assignment_email_to_partner(
                partner_email=partner.email,
                partner_name=partner.organisation_name,
                mother_name=referral.mother_name,
                mother_email=referral.mother_email,
                cohort_name=cohort.name,
                cohort_type=cohort.cohort_type,
                start_date=cohort.start_date,
                venue_name=venue_name,
                db=db,
            )

        if referral.mother_email:
            send_cohort_assignment_email_to_mother(
                mother_name=referral.mother_name,
                mother_email=referral.mother_email,
                cohort_name=cohort.name,
                cohort_type=cohort.cohort_type,
                start_date=cohort.start_date,
                venue_name=venue_name,
                venue_address=venue_address,
                venue_city=venue_city,
                db=db,
            )
        else:
            print(f"[Assignment] No email on file for {referral.mother_name} — skipped mother notification.")

    # If approved without a cohort assignment, send the standard approval email
    elif update.status == "approved" and update.cohort_id is None:
        if partner:
            send_referral_approval_email(
                partner_email=partner.email,
                partner_name=partner.organisation_name,
                mother_name=referral.mother_name,
                due_date=referral.estimated_due_date.isoformat() if referral.estimated_due_date else "",
                cohort_name=None,
                venue_name=None,
                language_requirement=referral.language_requirement,
                requires_interpreter=referral.requires_interpreter,
                additional_notes=referral.additional_notes,
                db=db,
            )

    return {"message": "Referral updated successfully", "referral_id": referral.id}


@router.patch("/referrals/{referral_id}/edit", response_model=dict)
def admin_edit_referral(
    referral_id: UUID,
    update: ReferralUpdate,
    db: Session = Depends(get_db),
    admin: PartnerOrganisation = Depends(get_current_admin),
):
    """Admin only: Edit a referral's details (status & cohort handled separately)."""
    referral = db.query(Referral).filter(Referral.id == referral_id).first()
    if not referral:
        raise HTTPException(status_code=404, detail="Referral not found")

    updates = update.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(referral, field, value)

    db.commit()
    db.refresh(referral)
    return {
        "message": "Referral updated successfully",
        "referral": ReferralResponse.model_validate(referral).model_dump(mode="json"),
    }


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
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
):
    """Admin only: Get all partner organisations."""
    partners = db.query(PartnerOrganisation).order_by(PartnerOrganisation.created_at.desc()).offset(skip).limit(limit).all()
    return [PartnerResponse.model_validate(p) for p in partners]


@router.patch("/partners/{partner_id}", response_model=dict)
def admin_update_partner(
    partner_id: UUID,
    update_data: PartnerUpdate,
    db: Session = Depends(get_db),
    admin: PartnerOrganisation = Depends(get_current_admin),
):
    """Admin only: Update partner details (name, contact, phone, type, is_admin)."""
    partner = db.query(PartnerOrganisation).filter(PartnerOrganisation.id == partner_id).first()
    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")

    allowed_fields = {"organisation_name", "contact_name", "phone", "organisation_type", "is_admin"}
    for key, value in update_data.model_dump(exclude_unset=True).items():
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
    total_facilitators = db.query(Facilitator).count()

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
        "total_facilitators": total_facilitators,
        "referrals_by_status": status_counts,
    }


@router.get("/venues", response_model=List[dict])
def admin_get_all_venues(
    db: Session = Depends(get_db),
    admin: PartnerOrganisation = Depends(get_current_admin),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
):
    """Admin only: Get all venues with details."""
    venues = db.query(Venue).offset(skip).limit(limit).all()
    return [v.to_dict() for v in venues]


@router.post("/venues", response_model=dict)
def admin_create_venue(
    venue_data: VenueCreate,
    db: Session = Depends(get_db),
    admin: PartnerOrganisation = Depends(get_current_admin),
):
    """Admin only: Create a new venue. Geocodes the address if no coordinates provided."""
    # If coordinates are missing, try to geocode from the address
    venue_values = venue_data.model_dump()
    if not venue_values.get("latitude") or not venue_values.get("longitude"):
        coords = geocode_address(
            venue_values.get("address", ""),
            venue_values.get("city"),
            venue_values.get("postcode"),
        )
        if coords:
            venue_values["latitude"] = coords["lat"]
            venue_values["longitude"] = coords["lon"]

    venue = Venue(**venue_values)
    db.add(venue)
    db.commit()
    db.refresh(venue)
    return {"message": "Venue created successfully", "venue_id": venue.id}


@router.patch("/venues/{venue_id}", response_model=dict)
def admin_update_venue(
    venue_id: UUID,
    venue_data: VenueUpdate,
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
        "transport_links", "nearby_landmarks", "accessibility_info",
    }

    for key, value in venue_data.model_dump(exclude_unset=True).items():
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


@router.get("/session-reviews", response_model=List[SessionReviewResponse])
def admin_get_session_reviews(
    db: Session = Depends(get_db),
    admin: PartnerOrganisation = Depends(get_current_admin),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
):
    """Admin only: View all submitted session reviews with cohort & facilitator names."""
    reviews = (
        db.query(SessionReview)
        .order_by(SessionReview.session_date.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    result = []
    for r in reviews:
        cohort = db.query(Cohort).filter(Cohort.id == r.cohort_id).first()
        facilitator = db.query(Facilitator).filter(Facilitator.id == r.facilitator_id).first()
        data = SessionReviewResponse.model_validate(r)
        data.cohort_name = cohort.name if cohort else None
        data.facilitator_name = facilitator.name if facilitator else None
        result.append(data)
    return result


@router.get("/facilitators", response_model=List[FacilitatorResponse])
def admin_get_all_facilitators(
    db: Session = Depends(get_db),
    admin: PartnerOrganisation = Depends(get_current_admin),
):
    """Admin only: Get all facilitators."""
    facilitators = db.query(Facilitator).order_by(Facilitator.created_at.desc()).all()
    return [FacilitatorResponse.model_validate(f) for f in facilitators]


@router.post("/cohorts/{cohort_id}/assign-facilitator", response_model=dict)
def admin_assign_facilitator(
    cohort_id: UUID,
    data: FacilitatorAssignment,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    admin: PartnerOrganisation = Depends(get_current_admin),
):
    """Admin only: Assign a lead facilitator to a cohort and email them."""
    cohort = db.query(Cohort).filter(Cohort.id == cohort_id).first()
    if not cohort:
        raise HTTPException(status_code=404, detail="Cohort not found")

    facilitator = db.query(Facilitator).filter(Facilitator.id == data.facilitator_id).first()
    if not facilitator:
        raise HTTPException(status_code=404, detail="Facilitator not found")

    cohort.facilitator_id = facilitator.id
    db.commit()
    db.refresh(cohort)

    venue = None
    if cohort.venue_id:
        venue = db.query(Venue).filter(Venue.id == cohort.venue_id).first()

    background_tasks.add_task(
        send_facilitator_assignment_email,
        facilitator_email=facilitator.email,
        facilitator_name=facilitator.name,
        cohort_name=cohort.name,
        cohort_type=cohort.cohort_type,
        start_date=cohort.start_date,
        venue_name=venue.name if venue else None,
        db=db,
    )

    return {
        "message": f"{facilitator.name} assigned to {cohort.name}",
        "facilitator": FacilitatorResponse.model_validate(facilitator).model_dump(mode="json"),
    }


@router.get("/cohorts", response_model=List[dict])
def admin_get_all_cohorts(
    db: Session = Depends(get_db),
    admin: PartnerOrganisation = Depends(get_current_admin),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
):
    """Admin only: Get all cohorts with venue details and assigned referrals."""
    cohorts = db.query(Cohort).order_by(Cohort.start_date.desc()).offset(skip).limit(limit).all()
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

        # Attach the assigned facilitator name
        if cohort.facilitator_id:
            facilitator = db.query(Facilitator).filter(Facilitator.id == cohort.facilitator_id).first()
            data["facilitator_name"] = facilitator.name if facilitator else None
        else:
            data["facilitator_name"] = None

        # Attach the referrals (people) assigned to this cohort — via either slot
        referrals = (
            db.query(Referral)
            .filter(or_(Referral.cohort_id == cohort.id, Referral.clinic_cohort_id == cohort.id))
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
    cohort_data: CohortCreate,
    db: Session = Depends(get_db),
    admin: PartnerOrganisation = Depends(get_current_admin),
):
    """Admin only: Create a new cohort."""
    cohort = Cohort(**cohort_data.model_dump())
    db.add(cohort)
    db.commit()
    db.refresh(cohort)
    return {"message": "Cohort created successfully", "cohort_id": cohort.id}


@router.patch("/cohorts/{cohort_id}", response_model=dict)
def admin_update_cohort(
    cohort_id: UUID,
    cohort_data: CohortUpdate,
    db: Session = Depends(get_db),
    admin: PartnerOrganisation = Depends(get_current_admin),
):
    """Admin only: Update a cohort."""
    cohort = db.query(Cohort).filter(Cohort.id == cohort_id).first()
    if not cohort:
        raise HTTPException(status_code=404, detail="Cohort not found")

    allowed_fields = {
        "name", "year", "start_date", "end_date", "cohort_type",
        "max_participants", "is_active", "description", "venue_id",
    }

    for key, value in cohort_data.model_dump(exclude_unset=True).items():
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


@router.get("/community-partners", response_model=List[CommunityPartnerResponse])
def admin_get_all_community_partners(
    db: Session = Depends(get_db),
    admin: PartnerOrganisation = Depends(get_current_admin),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
):
    """Admin only: Get all community partners (active and inactive)."""
    partners = (
        db.query(CommunityPartner)
        .order_by(CommunityPartner.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return [CommunityPartnerResponse.model_validate(p) for p in partners]


@router.post("/community-partners", response_model=dict)
def admin_create_community_partner(
    partner_data: CommunityPartnerCreate,
    db: Session = Depends(get_db),
    admin: PartnerOrganisation = Depends(get_current_admin),
):
    """Admin only: Create a new community partner."""
    partner = CommunityPartner(name=partner_data.name)
    db.add(partner)
    db.commit()
    db.refresh(partner)
    return {"message": "Community partner created successfully", "partner_id": str(partner.id)}


@router.patch("/community-partners/{partner_id}", response_model=dict)
def admin_update_community_partner(
    partner_id: UUID,
    partner_data: CommunityPartnerUpdate,
    db: Session = Depends(get_db),
    admin: PartnerOrganisation = Depends(get_current_admin),
):
    """Admin only: Update a community partner."""
    partner = db.query(CommunityPartner).filter(CommunityPartner.id == partner_id).first()
    if not partner:
        raise HTTPException(status_code=404, detail="Community partner not found")

    allowed_fields = {"name", "is_active"}
    for key, value in partner_data.model_dump(exclude_unset=True).items():
        if key in allowed_fields:
            setattr(partner, key, value)

    db.commit()
    db.refresh(partner)
    return {"message": "Community partner updated successfully", "partner_id": str(partner_id)}


@router.delete("/community-partners/{partner_id}", response_model=dict)
def admin_delete_community_partner(
    partner_id: UUID,
    db: Session = Depends(get_db),
    admin: PartnerOrganisation = Depends(get_current_admin),
):
    """Admin only: Delete a community partner."""
    partner = db.query(CommunityPartner).filter(CommunityPartner.id == partner_id).first()
    if not partner:
        raise HTTPException(status_code=404, detail="Community partner not found")
    db.delete(partner)
    db.commit()
    return {"message": "Community partner deleted successfully", "partner_id": str(partner_id)}
