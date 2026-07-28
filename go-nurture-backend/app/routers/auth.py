import os
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from dotenv import load_dotenv

from app.database.session import get_db
from app.models.partner import PartnerOrganisation
from app.schemas.partner import (
    AdminPartnerCreate,
    SetPassword,
    PartnerLogin,
    PartnerResponse,
    PartnerInviteResponse,
    TokenResponse,
)
from app.utils.auth import (
    hash_password,
    verify_password,
    create_access_token,
    generate_set_password_token,
    get_current_partner,
    get_current_admin,
)
from app.services.email import send_invite_email

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"))

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")


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
    )

    return PartnerInviteResponse(
        message=f"Invitation sent to {partner.email}",
        partner=PartnerResponse.model_validate(partner),
        invite_link=invite_link,
    )


@router.post("/set-password", response_model=TokenResponse)
def set_password(data: SetPassword, db: Session = Depends(get_db)):
    """
    First-time password set. The partner uses the token from their invite email
    to create their password. After setting, they are automatically logged in.
    """
    # Find partner by token
    partner = db.query(PartnerOrganisation).filter(
        PartnerOrganisation.set_password_token == data.token
    ).first()

    if not partner:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired invitation link",
        )

    # Check if token has expired
    if partner.set_password_token_expires and partner.set_password_token_expires < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This invitation link has expired. Please contact the administrator.",
        )

    # Validate password strength
    if len(data.password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long",
        )

    # Set the password and clear the token
    partner.hashed_password = hash_password(data.password)
    partner.set_password_token = None
    partner.set_password_token_expires = None
    partner.is_verified = True
    db.commit()
    db.refresh(partner)

    # Generate JWT token for auto-login
    access_token = create_access_token(partner.id)
    return TokenResponse(
        access_token=access_token,
        partner=PartnerResponse.model_validate(partner),
    )


@router.post("/login", response_model=TokenResponse)
def login_partner(data: PartnerLogin, db: Session = Depends(get_db)):
    """
    Authenticate a partner organisation and return a JWT token.
    """
    partner = db.query(PartnerOrganisation).filter(PartnerOrganisation.email == data.email).first()

    if not partner:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    # Check if password has been set yet
    if partner.hashed_password is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="You have not set your password yet. Please use the link sent to your email.",
        )

    if not verify_password(data.password, partner.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not partner.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated",
        )

    token = create_access_token(partner.id)
    return TokenResponse(
        access_token=token,
        partner=PartnerResponse.model_validate(partner),
    )


@router.get("/me", response_model=PartnerResponse)
def get_me(current_partner: PartnerOrganisation = Depends(get_current_partner)):
    """Get the currently authenticated partner's details."""
    return PartnerResponse.model_validate(current_partner)