from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database.session import get_db
from app.models.contact import ContactSubmission
from app.schemas.contact import ContactCreate, ContactResponse
from app.services.email import send_contact_email

router = APIRouter(prefix="/api/contact", tags=["Contact"])


@router.post("/", response_model=ContactResponse, status_code=status.HTTP_201_CREATED)
def submit_contact(data: ContactCreate, db: Session = Depends(get_db)):
    """Submit a contact form message (public)."""
    submission = ContactSubmission(
        name=data.name,
        email=data.email,
        subject=data.subject,
        message=data.message,
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)

    # Send notification email to CONTACT_EMAIL
    send_contact_email(
        sender_name=data.name,
        sender_email=data.email,
        subject=data.subject or "",
        message=data.message,
        db=db,
    )

    return ContactResponse.model_validate(submission)
