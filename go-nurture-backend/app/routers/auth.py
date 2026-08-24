import os
from uuid import UUID
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Request
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from dotenv import load_dotenv

from app.database.session import get_db
from app.models.partner import PartnerOrganisation
from app.models.facilitator import Facilitator
from app.schemas.partner import (
    AdminPartnerCreate,
    SetPassword,
    PartnerLogin,
    PartnerResponse,
    PartnerInviteResponse,
    TokenResponse,
    FacilitatorCreate,
    FacilitatorResponse,
)
from app.utils.auth import (
    hash_password,
    verify_password,
    create_access_token,
    generate_set_password_token,
    get_current_partner,
    get_current_admin,
)
from app.services.email import send_invite_email, send_password_reset_email
from app.middleware.rate_limit import limiter

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"))

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

FRONTEND_URL = os.getenv("FRONTEND_URL")


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


@router.post("/forgot-password", response_model=dict)
@limiter.limit("5/15minutes")
def forgot_password(
    request: Request,
    data: ForgotPasswordRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """
    Request a password reset link. Always returns success (regardless of whether
    the email exists) to prevent account enumeration. Works for both partner
    organisations and facilitators.
    """
    partner = db.query(PartnerOrganisation).filter(
        PartnerOrganisation.email == data.email.lower() if hasattr(PartnerOrganisation.email, "lower") else PartnerOrganisation.email == data.email
    ).first()

    if partner:
        # Generate a fresh reset token (reuses the set-password token columns)
        reset_token = generate_set_password_token()
        token_expires = datetime.now(timezone.utc) + timedelta(hours=48)

        partner.set_password_token = reset_token
        partner.set_password_token_expires = token_expires
        db.commit()

        reset_link = f"{FRONTEND_URL}/portal/set-password?token={reset_token}&reset=true"

        background_tasks.add_task(
            send_password_reset_email,
            recipient_email=partner.email,
            recipient_name=partner.contact_name or "Partner",
            reset_link=reset_link,
            db=db,
        )

    # Also check facilitator accounts
    facilitator = db.query(Facilitator).filter(Facilitator.email == data.email).first()
    if facilitator:
        reset_token = generate_set_password_token()
        token_expires = datetime.now(timezone.utc) + timedelta(hours=48)

        facilitator.set_password_token = reset_token
        facilitator.set_password_token_expires = token_expires
        db.commit()

        reset_link = f"{FRONTEND_URL}/portal/set-password?token={reset_token}&reset=true"

        background_tasks.add_task(
            send_password_reset_email,
            recipient_email=facilitator.email,
            recipient_name=facilitator.name or "Facilitator",
            reset_link=reset_link,
            db=db,
        )

    return {
        "message": "If an account exists with that email, a password reset link has been sent."
    }


@router.post("/admin/create-partner", response_model=PartnerInviteResponse)
def admin_create_partner(
    data: AdminPartnerCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    admin: PartnerOrganisation = Depends(get_current_admin),
):
    """
    Admin only: Create a new partner organisation account.
    An invite email is sent to the partner with a link to set their password.
    """
    # Check if email already exists
    existing = db.query(PartnerOrganisation).filter(PartnerOrganisation.email == data.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A partner with this email already exists",
        )

    # Generate a unique token for first-time password setup
    set_password_token = generate_set_password_token()
    token_expires = datetime.now(timezone.utc) + timedelta(hours=48)

    # Create partner without password
    partner = PartnerOrganisation(
        organisation_name=data.organisation_name,
        contact_name=data.contact_name,
        email=data.email,
        hashed_password=None,  # No password yet - they'll set it
        phone=data.phone,
        organisation_type=data.organisation_type,
        set_password_token=set_password_token,
        set_password_token_expires=token_expires,
        is_verified=False,
    )
    db.add(partner)
    db.commit()
    db.refresh(partner)

    # Build invite link
    invite_link = f"{FRONTEND_URL}/portal/set-password?token={set_password_token}"

    # Send invite email in the background
    background_tasks.add_task(
        send_invite_email,
        recipient_email=partner.email,
        recipient_name=partner.contact_name,
        organisation_name=partner.organisation_name,
        invite_link=invite_link,
        db=db,
    )

    return PartnerInviteResponse(
        message=f"Invitation sent to {partner.email}",
        partner=PartnerResponse.model_validate(partner),
        invite_link=invite_link,
    )


@router.post("/admin/create-facilitator", response_model=dict)
def admin_create_facilitator(
    data: FacilitatorCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    admin: PartnerOrganisation = Depends(get_current_admin),
):
    """Admin only: Create a new facilitator account. An invite email is sent."""
    existing = db.query(Facilitator).filter(Facilitator.email == data.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A facilitator with this email already exists",
        )

    set_password_token = generate_set_password_token()
    token_expires = datetime.now(timezone.utc) + timedelta(hours=48)

    facilitator = Facilitator(
        name=data.name,
        email=data.email,
        hashed_password=None,
        phone=data.phone,
        set_password_token=set_password_token,
        set_password_token_expires=token_expires,
        is_verified=False,
    )
    db.add(facilitator)
    db.commit()
    db.refresh(facilitator)

    invite_link = f"{FRONTEND_URL}/portal/set-password?token={set_password_token}"

    background_tasks.add_task(
        send_invite_email,
        recipient_email=facilitator.email,
        recipient_name=facilitator.name,
        organisation_name="Go Nurture Initiative CIC",
        invite_link=invite_link,
        db=db,
    )

    return {
        "message": f"Invitation sent to {facilitator.email}",
        "facilitator": FacilitatorResponse.model_validate(facilitator).model_dump(mode="json"),
        "invite_link": invite_link,
    }


@router.post("/admin/resend-invite/{partner_id}", response_model=dict)
def admin_resend_invite(
    partner_id: UUID,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    admin: PartnerOrganisation = Depends(get_current_admin),
):
    """
    Admin only: Resend the invite/activation link to a partner who hasn't
    set their password yet (pending account). Generates a fresh 48-hour token.
    """
    partner = db.query(PartnerOrganisation).filter(PartnerOrganisation.id == partner_id).first()
    if not partner:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Partner not found")

    if partner.hashed_password is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This partner has already activated their account. Use the password reset flow instead.",
        )

    # Generate a fresh token and expiry
    set_password_token = generate_set_password_token()
    token_expires = datetime.now(timezone.utc) + timedelta(hours=48)

    partner.set_password_token = set_password_token
    partner.set_password_token_expires = token_expires
    db.commit()

    invite_link = f"{FRONTEND_URL}/portal/set-password?token={set_password_token}"

    background_tasks.add_task(
        send_invite_email,
        recipient_email=partner.email,
        recipient_name=partner.contact_name or "Partner",
        organisation_name=partner.organisation_name,
        invite_link=invite_link,
        db=db,
    )

    return {"message": f"Invitation resent to {partner.email}", "invite_link": invite_link}


@router.post("/set-password", response_model=TokenResponse)
@limiter.limit("5/15minutes")
def set_password(request: Request, data: SetPassword, db: Session = Depends(get_db)):
    """
    First-time password set using the token from an invite email.
    Works for both partner organisations and facilitators.
    After setting, the user is automatically logged in.
    """
    # Find a partner account by token
    partner = db.query(PartnerOrganisation).filter(
        PartnerOrganisation.set_password_token == data.token
    ).first()

    if partner:
        if partner.set_password_token_expires and partner.set_password_token_expires < datetime.now(timezone.utc):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This invitation link has expired. Please contact the administrator.",
            )
        if len(data.password) < 8:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must be at least 8 characters long",
            )

        partner.hashed_password = hash_password(data.password)
        partner.set_password_token = None
        partner.set_password_token_expires = None
        partner.is_verified = True
        db.commit()
        db.refresh(partner)

        role = "admin" if partner.is_admin else "partner"
        access_token = create_access_token(partner.id, role=role)
        return TokenResponse(
            access_token=access_token,
            role=role,
            partner=PartnerResponse.model_validate(partner),
        )

    # Find a facilitator account by token
    facilitator = db.query(Facilitator).filter(
        Facilitator.set_password_token == data.token
    ).first()

    if facilitator:
        if facilitator.set_password_token_expires and facilitator.set_password_token_expires < datetime.now(timezone.utc):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This invitation link has expired. Please contact the administrator.",
            )
        if len(data.password) < 8:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must be at least 8 characters long",
            )

        facilitator.hashed_password = hash_password(data.password)
        facilitator.set_password_token = None
        facilitator.set_password_token_expires = None
        facilitator.is_verified = True
        db.commit()
        db.refresh(facilitator)

        access_token = create_access_token(facilitator.id, role="facilitator")
        return TokenResponse(
            access_token=access_token,
            role="facilitator",
            facilitator=FacilitatorResponse.model_validate(facilitator),
        )

    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Invalid or expired invitation link",
    )


@router.post("/login", response_model=TokenResponse)
@limiter.limit("5/15minutes")
def login(request: Request, data: PartnerLogin, db: Session = Depends(get_db)):
    """
    Unified login for all user types (partner organisations, admins and
    facilitators). The response includes a `role` so clients can route the
    user to the correct portal.
    """
    invalid = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid email or password",
    )

    # 1) Try partner organisation accounts (admins are partners too)
    partner = db.query(PartnerOrganisation).filter(PartnerOrganisation.email == data.email).first()
    if partner:
        if partner.hashed_password is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="You have not set your password yet. Please use the link sent to your email.",
            )
        if not verify_password(data.password, partner.hashed_password):
            raise invalid
        if not partner.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is deactivated",
            )
        role = "admin" if partner.is_admin else "partner"
        token = create_access_token(partner.id, role=role)
        return TokenResponse(
            access_token=token,
            role=role,
            partner=PartnerResponse.model_validate(partner),
        )

    # 2) Try facilitator accounts
    facilitator = db.query(Facilitator).filter(Facilitator.email == data.email).first()
    if facilitator:
        if facilitator.hashed_password is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="You have not set your password yet. Please use the link sent to your email.",
            )
        if not verify_password(data.password, facilitator.hashed_password):
            raise invalid
        if not facilitator.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is deactivated",
            )
        token = create_access_token(facilitator.id, role="facilitator")
        return TokenResponse(
            access_token=token,
            role="facilitator",
            facilitator=FacilitatorResponse.model_validate(facilitator),
        )

    raise invalid


@router.get("/me", response_model=PartnerResponse)
def get_me(current_partner: PartnerOrganisation = Depends(get_current_partner)):
    """Get the currently authenticated partner's details."""
    return PartnerResponse.model_validate(current_partner)