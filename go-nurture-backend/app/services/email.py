import os
import resend
from dotenv import load_dotenv
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from app.models.email_log import EmailLog

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"))


def log_email(db: Session, recipient_email: str, subject: str, body: str, email_type: str, status: str, error_message: str | None = None):
    """Helper to log email to database."""
    log = EmailLog(
        recipient_email=recipient_email,
        subject=subject,
        body=body,
        email_type=email_type,
        status=status,
        error_message=error_message,
        created_at=datetime.now(timezone.utc),
    )
    db.add(log)
    db.commit()


def send_invite_email(
    recipient_email: str,
    recipient_name: str,
    organisation_name: str,
    invite_link: str,
    db: Session = None,
) -> bool:
    """
    Send an invitation email to a new partner with a link to set their password.
    Uses Resend (https://resend.com) for email delivery.
    Falls back to printing to console if Resend API key is not configured.
    """
    api_key = os.getenv("RESEND_API_KEY", "")
    from_email = os.getenv("RESEND_FROM_EMAIL", "Go Nurture <noreply@gonurture.org>")

    subject = f"You've been invited to join {organisation_name} on Go Nurture Initiative"
    body = f"""
Hello {recipient_name},

You have been registered as a partner organisation for Go Nurture Initiative CIC.

To access the Partner Portal and start submitting referrals, please set your password using the link below:

{invite_link}

This link will expire in 48 hours.

If you have any questions, please contact the Go Nurture team.

Best regards,
Go Nurture Initiative CIC
"""

    sent = False
    error_msg = None

    # If no API key is configured, print to console (for development/testing)
    if not api_key or api_key == "re_xxxxxxxxxxxx":
        print(f"=== EMAIL TO: {recipient_email} ===")
        print(f"From: {from_email}")
        print(f"Subject: {subject}")
        print(body)
        print("=== END EMAIL ===")
        sent = True
    else:
        try:
            resend.api_key = api_key
            response = resend.Emails.send({
                "from": from_email,
                "to": recipient_email,
                "subject": subject,
                "text": body.strip(),
            })
            print(f"Email sent to {recipient_email}: {response}")
            sent = True
        except Exception as e:
            error_msg = str(e)
            print(f"Failed to send email via Resend: {e}")
            # Fallback: print to console so development isn't blocked
            print(f"=== EMAIL TO: {recipient_email} ===")
            print(f"From: {from_email}")
            print(f"Subject: {subject}")
            print(body)
            print("=== END EMAIL ===")

    # Log to database if db session provided
    if db is not None:
        log_email(
            db=db,
            recipient_email=recipient_email,
            subject=subject,
            body=body.strip(),
            email_type="partner_invite",
            status="success" if sent else "failed",
            error_message=error_msg,
        )

    return sent


def send_referral_notification_email(
    mother_name: str,
    mother_phone: str,
    due_date: str,
    partner_name: str,
    language_requirement: str | None,
    requires_interpreter: bool,
    additional_notes: str | None,
    db: Session = None,
) -> bool:
    """
    Send an admin notification email when a new referral is created.
    Uses Resend for email delivery with console fallback for development.
    """
    api_key = os.getenv("RESEND_API_KEY", "")
    from_email = os.getenv("RESEND_FROM_EMAIL", "Go Nurture <noreply@gonurture.org>")
    contact_email = os.getenv("CONTACT_EMAIL", "")

    if not contact_email:
        print("CONTACT_EMAIL not set in environment. Cannot send referral notification email.")
        return False

    email_subject = "[New Referral] A new mother needs approval"
    body = f"""
A new referral has been submitted and requires your attention.

Mother Details:
- Name: {mother_name}
- Phone: {mother_phone}
- Estimated Due Date: {due_date}
- Language Requirement: {language_requirement or "None specified"}
- Requires Interpreter: {"Yes" if requires_interpreter else "No"}

Referral Source:
- Partner Organisation: {partner_name}

Additional Notes:
{additional_notes or "None"}

Please review and approve/reject this referral in the admin dashboard.

---
This email was sent automatically from the Go Nurture referral system.
"""

    sent = False
    error_msg = None

    if not api_key or api_key == "re_xxxxxxxxxxxx":
        print(f"=== REFERRAL NOTIFICATION EMAIL TO: {contact_email} ===")
        print(f"From: {from_email}")
        print(f"Subject: {email_subject}")
        print(body)
        print("=== END EMAIL ===")
        sent = True
    else:
        try:
            resend.api_key = api_key
            response = resend.Emails.send({
                "from": from_email,
                "to": contact_email,
                "subject": email_subject,
                "text": body.strip(),
            })
            print(f"Referral notification email sent to {contact_email}: {response}")
            sent = True
        except Exception as e:
            error_msg = str(e)
            print(f"Failed to send referral notification email via Resend: {e}")
            print(f"=== REFERRAL NOTIFICATION EMAIL TO: {contact_email} ===")
            print(f"From: {from_email}")
            print(f"Subject: {email_subject}")
            print(body)
            print("=== END EMAIL ===")

    if db is not None:
        log_email(
            db=db,
            recipient_email=contact_email,
            subject=email_subject,
            body=body.strip(),
            email_type="referral",
            status="success" if sent else "failed",
            error_message=error_msg,
        )

    return sent


def send_donation_notification_email(
    donor_name: str | None,
    donor_email: str | None,
    amount: float,
    currency: str,
    is_anonymous: bool,
    message: str | None,
    db: Session = None,
) -> bool:
    """
    Send an admin notification email when a new donation is received.
    Uses Resend for email delivery with console fallback for development.
    """
    api_key = os.getenv("RESEND_API_KEY", "")
    from_email = os.getenv("RESEND_FROM_EMAIL", "Go Nurture <noreply@gonurture.org>")
    contact_email = os.getenv("CONTACT_EMAIL", "")

    if not contact_email:
        print("CONTACT_EMAIL not set in environment. Cannot send donation notification email.")
        return False

    email_subject = "[New Donation] A new donation has been received"
    body = f"""
A new donation has been received.

Donor Details:
- Name: {donor_name or "Anonymous"}
- Email: {donor_email or "N/A"}
- Amount: {amount:.2f} {currency.upper()}
- Message: {message or "No message"}

Please review the donation in the admin dashboard.

---
This email was sent automatically from the Go Nurture donation system.
"""

    sent = False
    error_msg = None

    if not api_key or api_key == "re_xxxxxxxxxxxx":
        print(f"=== DONATION NOTIFICATION EMAIL TO: {contact_email} ===")
        print(f"From: {from_email}")
        print(f"Subject: {email_subject}")
        print(body)
        print("=== END EMAIL ===")
        sent = True
    else:
        try:
            resend.api_key = api_key
            response = resend.Emails.send({
                "from": from_email,
                "to": contact_email,
                "subject": email_subject,
                "text": body.strip(),
            })
            print(f"Donation notification email sent to {contact_email}: {response}")
            sent = True
        except Exception as e:
            error_msg = str(e)
            print(f"Failed to send donation notification email via Resend: {e}")
            print(f"=== DONATION NOTIFICATION EMAIL TO: {contact_email} ===")
            print(f"From: {from_email}")
            print(f"Subject: {email_subject}")
            print(body)
            print("=== END EMAIL ===")

    if db is not None:
        log_email(
            db=db,
            recipient_email=contact_email,
            subject=email_subject,
            body=body.strip(),
            email_type="donation",
            status="success" if sent else "failed",
            error_message=error_msg,
        )

    return sent


def send_contact_email(
    sender_name: str,
    sender_email: str,
    subject: str,
    message: str,
    db: Session = None,
) -> bool:
    """
    Send a contact form submission to CONTACT_EMAIL.
    Uses Resend for email delivery with console fallback for development.
    """
    api_key = os.getenv("RESEND_API_KEY", "")
    from_email = os.getenv("RESEND_FROM_EMAIL", "Go Nurture <noreply@gonurture.org>")
    contact_email = os.getenv("CONTACT_EMAIL", "")

    if not contact_email:
        print("CONTACT_EMAIL not set in environment. Cannot send contact email.")
        return False

    email_subject = f"[Contact Form] {subject}" if subject else "[Contact Form] New message from website"
    body = f"""
You have received a new message from the Go Nurture Initiative website contact form.

Sender: {sender_name}
Email: {sender_email}
Subject: {subject}

Message:
{message}

---
This email was sent automatically from the Go Nurture website contact form.
"""

    sent = False
    error_msg = None

    # If no API key is configured, print to console (for development/testing)
    if not api_key or api_key == "re_xxxxxxxxxxxx":
        print(f"=== CONTACT EMAIL TO: {contact_email} ===")
        print(f"From: {from_email}")
        print(f"Subject: {email_subject}")
        print(body)
        print("=== END CONTACT EMAIL ===")
        sent = True
    else:
        try:
            resend.api_key = api_key
            response = resend.Emails.send({
                "from": from_email,
                "to": contact_email,
                "subject": email_subject,
                "text": body.strip(),
            })
            print(f"Contact email sent to {contact_email}: {response}")
            sent = True
        except Exception as e:
            error_msg = str(e)
            print(f"Failed to send contact email via Resend: {e}")
            print(f"=== CONTACT EMAIL TO: {contact_email} ===")
            print(f"From: {from_email}")
            print(f"Subject: {email_subject}")
            print(body)
            print("=== END CONTACT EMAIL ===")

    if db is not None:
        log_email(
            db=db,
            recipient_email=contact_email,
            subject=email_subject,
            body=body.strip(),
            email_type="contact",
            status="success" if sent else "failed",
            error_message=error_msg,
        )

    return sent