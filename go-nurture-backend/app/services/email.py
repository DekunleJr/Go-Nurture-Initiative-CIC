import os
import resend
from dotenv import load_dotenv
from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta, date as date_type
from typing import Optional
from app.models.email_log import EmailLog
from app.services.email_templates import render_email, render_managed_email
from app.services.email_queue import queue_and_process_email

# Program display names
PROGRAM_NAMES = {
    "birth_confidence": "Free Antenatal Education",
    "breastfeeding_clinic": "Infant-Feeding Support",
    "both": "Antenatal Education and Infant-Feeding Support",
}


def compute_class_schedule(start_date: date_type, num_classes: int = 6) -> list:
    """
    Compute the class schedule for the Birth Confidence Program.
    Class 1 is on the start date; each subsequent class is 7 days later
    (same weekday). Returns a list of date objects.
    """
    return [start_date + timedelta(weeks=i) for i in range(num_classes)]


def _format_schedule_lines(schedule: list) -> str:
    """Format a list of dates into numbered class lines, e.g.
    'Class 1 — Sunday, 5 October 2026'."""
    lines = []
    for i, d in enumerate(schedule, start=1):
        lines.append(f"Class {i}: {d.strftime('%A, %d %B %Y')}")
    return chr(10).join(lines)

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"))


def log_email(db: Session, recipient_email: str, subject: str, body: str, email_type: str, status: str, error_message: str | None = None):
    """Helper to log email to database."""
    try:
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
    except Exception as e:
        # If the email_logs table doesn't exist or any DB error occurs,
        # don't crash the request — just log to console.
        print(f"[EmailLog] Failed to log email: {e}")


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
    subject, body = render_managed_email(
        db,
        "partner_invite",
        "partner_invite.txt",
        {"recipient_name": recipient_name, "organisation_name": organisation_name, "invite_link": invite_link},
        f"You've been invited to join {organisation_name} on Go Nurture Initiative",
    )
    sent = queue_and_process_email(db, "partner_invite", recipient_email, subject, body) if db is not None else False
    error_msg = None if sent else "Email queued for delivery or failed"

    # Log to database if db session provided
    if db is not None:
        log_email(
            db=db,
            recipient_email=recipient_email,
            subject=subject,
            body=body.strip(),
            email_type="partner_invite",
            status="success" if sent else "pending",
            error_message=error_msg,
        )

    return sent


def send_password_reset_email(
    recipient_email: str,
    recipient_name: str,
    reset_link: str,
    db: Session = None,
) -> bool:
    """
    Send a password reset email to a partner who forgot their password.
    Uses Resend for email delivery with console fallback for development.
    """
    subject, body = render_managed_email(
        db,
        "password_reset",
        "password_reset.txt",
        {"recipient_name": recipient_name, "reset_link": reset_link},
        "Reset your Go Nurture Initiative password",
    )
    sent = queue_and_process_email(db, "password_reset", recipient_email, subject, body) if db is not None else False
    error_msg = None if sent else "Email queued for delivery or failed"

    if db is not None:
        log_email(
            db=db,
            recipient_email=recipient_email,
            subject=subject,
            body=body.strip(),
            email_type="password_reset",
            status="success" if sent else "pending",
            error_message=error_msg,
        )

    return sent


def send_referral_notification_email(
    reference_number: str | None,
    partner_name: str,
    referral_type: str = "birth_confidence",
    interpreter_support: str | None = None,
    db: Session = None,
) -> bool:
    """
    Send an admin notification email when a new referral is created.

    Deliberately contains no personal details about the woman being referred
    (name, contact details, barriers, notes): those stay in the admin dashboard.
    """
    api_key = os.getenv("RESEND_API_KEY", "")
    from_email = os.getenv("RESEND_FROM_EMAIL", "Go Nurture <noreply@gonurtureinitiative.org.uk>")
    contact_email = os.getenv("CONTACT_EMAIL", "")

    if not contact_email:
        print("CONTACT_EMAIL not set in environment. Cannot send referral notification email.")
        return False

    program_name = PROGRAM_NAMES.get(referral_type, referral_type)
    email_subject = f"[New Referral] {reference_number or 'Reference pending'}"
    body = f"""
A new referral has been submitted and requires your attention.

- Reference: {reference_number or "Not available"}
- Service requested: {program_name}
- Referring organisation: {partner_name}
- Interpretation or communication support: {interpreter_support or "Not stated"}

Personal details are not included in this email. Please review and approve/reject
this referral in the admin dashboard.

---
This email was sent automatically from the Go Nurture referral system.
"""

    email_subject, body = render_managed_email(db, "referral_notification", "referral_notification.txt", {
        "reference_number": reference_number, "program_name": program_name,
        "partner_name": partner_name, "interpreter_support": interpreter_support,
    }, email_subject)

    if db is not None:
        sent = queue_and_process_email(db, "referral_notification", contact_email, email_subject, body)
        log_email(db, contact_email, email_subject, body.strip(), "referral", "success" if sent else "pending", None if sent else "Email queued for delivery or failed")
        return sent

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
    from_email = os.getenv("RESEND_FROM_EMAIL", "Go Nurture <noreply@gonurtureinitiative.org.uk>")
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

    email_subject, body = render_managed_email(db, "donation_notification", "donation_notification.txt", {
        "donor_name": donor_name, "donor_email": donor_email, "amount": f"{amount:.2f}",
        "currency": currency.upper(), "message": message,
    }, email_subject)

    if db is not None:
        sent = queue_and_process_email(db, "donation_notification", contact_email, email_subject, body)
        log_email(db, contact_email, email_subject, body.strip(), "donation", "success" if sent else "pending", None if sent else "Email queued for delivery or failed")
        return sent

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


def send_referral_approval_email(
    partner_email: str,
    partner_name: str,
    mother_name: str,
    due_date: str,
    cohort_name: str | None,
    venue_name: str | None,
    language_requirement: str | None,
    requires_interpreter: bool,
    additional_notes: str | None,
    db: Session = None,
) -> bool:
    """
    Send an approval notification email to the partner organisation
    when a referral is approved by an admin.
    """
    api_key = os.getenv("RESEND_API_KEY", "")
    from_email = os.getenv("RESEND_FROM_EMAIL", "Go Nurture <noreply@gonurtureinitiative.org.uk>")

    subject = f"[Referral Approved] {mother_name}'s referral has been approved"
    body = f"""
Hello {partner_name},

Good news! A referral you submitted has been approved by the admin team.

Referral Details:
- Mother: {mother_name}
- Estimated Due Date: {due_date}
- Language Requirement: {language_requirement or "None specified"}
- Requires Interpreter: {"Yes" if requires_interpreter else "No"}

Approved Cohort: {cohort_name or "Not assigned yet"}
Venue: {venue_name or "Not assigned yet"}

Additional Notes:
{additional_notes or "None"}

Please contact the Go Nurture team if you have any questions.

Best regards,
Go Nurture Initiative CIC
"""

    subject, body = render_managed_email(db, "referral_approval", "referral_approval.txt", {
        "partner_name": partner_name, "mother_name": mother_name, "due_date": due_date,
        "language_requirement": language_requirement, "requires_interpreter": requires_interpreter,
        "cohort_name": cohort_name, "venue_name": venue_name, "additional_notes": additional_notes,
    }, subject)

    if db is not None:
        sent = queue_and_process_email(db, "referral_approval", partner_email, subject, body)
        log_email(db, partner_email, subject, body.strip(), "referral_approval", "success" if sent else "pending", None if sent else "Email queued for delivery or failed")
        return sent

    sent = False
    error_msg = None

    if not api_key or api_key == "re_xxxxxxxxxxxx":
        print(f"=== REFERRAL APPROVAL EMAIL TO: {partner_email} ===")
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
                "to": partner_email,
                "subject": subject,
                "text": body.strip(),
            })
            print(f"Referral approval email sent to {partner_email}: {response}")
            sent = True
        except Exception as e:
            error_msg = str(e)
            print(f"Failed to send referral approval email via Resend: {e}")
            print(f"=== REFERRAL APPROVAL EMAIL TO: {partner_email} ===")
            print(f"From: {from_email}")
            print(f"Subject: {subject}")
            print(body)
            print("=== END EMAIL ===")

    if db is not None:
        log_email(
            db=db,
            recipient_email=partner_email,
            subject=subject,
            body=body.strip(),
            email_type="referral_approval",
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
    from_email = os.getenv("RESEND_FROM_EMAIL", "Go Nurture <noreply@gonurtureinitiative.org.uk>")
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

    email_subject, body = render_managed_email(db, "contact", "contact_notification.txt", {
        "sender_name": sender_name, "sender_email": sender_email,
        "message_subject": subject, "message": message,
    }, email_subject)

    if db is not None:
        sent = queue_and_process_email(db, "contact", contact_email, email_subject, body)
        log_email(db, contact_email, email_subject, body.strip(), "contact", "success" if sent else "pending", None if sent else "Email queued for delivery or failed")
        return sent

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


def send_facilitator_assignment_email(
    facilitator_email: str,
    facilitator_name: str,
    cohort_name: str,
    cohort_type: str,
    start_date: date_type,
    venue_name: Optional[str],
    db: Session = None,
) -> bool:
    """
    Notify a facilitator that they have been assigned to a cohort,
    including the class schedule or appointment details.
    """
    api_key = os.getenv("RESEND_API_KEY", "")
    from_email = os.getenv("RESEND_FROM_EMAIL", "Go Nurture <noreply@gonurtureinitiative.org.uk>")

    program_name = PROGRAM_NAMES.get(cohort_type, cohort_type)
    venue_line = f"Venue: {venue_name}" if venue_name else "Venue: To be confirmed"

    if cohort_type == "breastfeeding_clinic":
        subject = f"You've been assigned: {cohort_name} (Breastfeeding Support Clinic)"
        body = f"""
Hello {facilitator_name},

You have been assigned as the facilitator for the following session:

─────────────────────────────
SESSION DETAILS
─────────────────────────────
Programme: {program_name}
Group: {cohort_name}
Date: {start_date.strftime('%A, %d %B %Y')}
{venue_line}

Please log into your facilitator portal to view enrolled participants
and submit your delivery audit after the session.

If you have any questions, please contact the Go Nurture team.

Best regards,
Go Nurture Initiative CIC
"""
    else:
        schedule = compute_class_schedule(start_date)
        subject = f"You've been assigned: {cohort_name} (Birth Confidence Program)"
        body = f"""
Hello {facilitator_name},

You have been assigned as the lead facilitator for the following cohort:

─────────────────────────────
COHORT DETAILS
─────────────────────────────
Programme: {program_name}
Group: {cohort_name}
{venue_line}

Class Schedule (weekly):
{_format_schedule_lines(schedule)}

Please log into your facilitator portal to view enrolled participants
and submit your delivery audit after each meeting.

If you have any questions, please contact the Go Nurture team.

Best regards,
Go Nurture Initiative CIC
"""

    subject, body = render_managed_email(db, "facilitator_assignment", "facilitator_assignment.txt", {
        "facilitator_name": facilitator_name, "program_name": program_name, "cohort_name": cohort_name,
        "is_clinic": cohort_type == "breastfeeding_clinic", "date_text": start_date.strftime('%A, %d %B %Y'),
        "schedule_lines": _format_schedule_lines(compute_class_schedule(start_date)), "venue_line": venue_line,
    }, subject)

    if db is not None:
        sent = queue_and_process_email(db, "facilitator_assignment", facilitator_email, subject, body)
        log_email(db, facilitator_email, subject, body.strip(), "facilitator_assignment", "success" if sent else "pending", None if sent else "Email queued for delivery or failed")
        return sent

    sent = False
    error_msg = None

    if not api_key or api_key == "re_xxxxxxxxxxxx":
        print(f"=== FACILITATOR ASSIGNMENT EMAIL TO: {facilitator_email} ===")
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
                "to": facilitator_email,
                "subject": subject,
                "text": body.strip(),
            })
            print(f"Facilitator assignment email sent to {facilitator_email}: {response}")
            sent = True
        except Exception as e:
            error_msg = str(e)
            print(f"Failed to send facilitator assignment email via Resend: {e}")
            print(f"=== FACILITATOR ASSIGNMENT EMAIL TO: {facilitator_email} ===")
            print(f"Subject: {subject}")
            print(body)
            print("=== END EMAIL ===")

    if db is not None:
        log_email(
            db=db,
            recipient_email=facilitator_email,
            subject=subject,
            body=body.strip(),
            email_type="facilitator_assignment",
            status="success" if sent else "failed",
            error_message=error_msg,
        )

    return sent


def send_cohort_assignment_email_to_mother(
    mother_name: str,
    mother_email: str,
    cohort_name: str,
    cohort_type: str,
    start_date: date_type,
    venue_name: Optional[str],
    venue_address: Optional[str],
    venue_city: Optional[str],
    db: Session = None,
) -> bool:
    """
    Send a warm welcome/appointment email to the mother when she is assigned
    to a cohort. Content differs by program type:
      - birth_confidence: full 6-class weekly schedule
      - breastfeeding_clinic: single appointment confirmation
    """
    api_key = os.getenv("RESEND_API_KEY", "")
    from_email = os.getenv("RESEND_FROM_EMAIL", "Go Nurture <noreply@gonurtureinitiative.org.uk>")

    program_name = PROGRAM_NAMES.get(cohort_type, cohort_type)
    venue_block = ""
    if venue_name:
        venue_block = f"Where: {venue_name}"
        if venue_address or venue_city:
            location_bits = ", ".join(filter(None, [venue_address, venue_city]))
            venue_block += f"{chr(10)}Address: {location_bits}"

    if cohort_type == "breastfeeding_clinic":
        subject = f"You're booked in! Your Breastfeeding Support Clinic appointment 💚"
        body = f"""
Dear {mother_name},

Wonderful news! You have been booked into our Breastfeeding Support Clinic.

We're so glad you're taking this step — our specialist team is here to support
you and your little one every step of the way.

─────────────────────────────
YOUR APPOINTMENT
─────────────────────────────
Programme: {program_name}
Group: {cohort_name}
Date: {start_date.strftime('%A, %d %B %Y')}
{venue_block}

─────────────────────────────
WHAT TO EXPECT
─────────────────────────────
• A relaxed, friendly one-to-one clinic session with a breastfeeding specialist
• Time to ask any questions — no question is too small!
• Practical hands-on support in a safe, judgement-free space
• Refreshments provided

Please arrive a few minutes early so we can welcome you properly.

If you need to reschedule or have any questions before your appointment,
just reply to this email or contact the Go Nurture team.

We can't wait to meet you and your baby! 🌿

With warmth,
The Go Nurture Initiative Team
"""
    else:
        schedule = compute_class_schedule(start_date)
        end_note = (
            f"{chr(10)}Your journey with us runs from {schedule[0].strftime('%d %B %Y')} "
            f"to {schedule[-1].strftime('%d %B %Y')}."
        )
        subject = "Welcome to the Favour Oloye Birth Confidence Program! 🌸"
        body = f"""
Dear {mother_name},

Congratulations, and welcome! You have been enrolled in the Favour Oloye
Birth Confidence Program — a free, six-week programme designed to help you
feel confident, informed, and supported as you prepare for your baby's arrival.

You'll be joining a warm community of mothers on the same journey, learning
together in a safe and culturally sensitive space.

─────────────────────────────
YOUR CLASS SCHEDULE (6 WEEKLY CLASSES)
─────────────────────────────
{_format_schedule_lines(schedule)}
{venue_block}
{end_note}

Each class builds on the last, covering everything from birth preparation to
newborn care — all at a pace that works for you.

─────────────────────────────
WHAT TO BRING
─────────────────────────────
• Yourself, just as you are — that's enough!
• A notebook and pen if you like taking notes
• Any questions you'd like answered

If you require an interpreter, one will be arranged for you — just let us know.

If anything changes and you can't make a class, please reply to this email or
contact the Go Nurture team so we can support you.

We are honoured to walk this journey with you. See you in Class 1! 💚

With love and warmth,
The Go Nurture Initiative Team
"""

    subject, body = render_managed_email(db, "cohort_assignment_mother", "cohort_assignment_mother.txt", {
        "mother_name": mother_name, "program_name": program_name, "cohort_name": cohort_name,
        "is_clinic": cohort_type == "breastfeeding_clinic", "date_text": start_date.strftime('%A, %d %B %Y'),
        "schedule_lines": _format_schedule_lines(compute_class_schedule(start_date)), "venue_block": venue_block,
    }, subject)

    if db is not None:
        sent = queue_and_process_email(db, "cohort_assignment_mother", mother_email, subject, body)
        log_email(db, mother_email, subject, body.strip(), "cohort_assignment", "success" if sent else "pending", None if sent else "Email queued for delivery or failed")
        return sent

    sent = False
    error_msg = None

    if not api_key or api_key == "re_xxxxxxxxxxxx":
        print(f"=== COHORT ASSIGNMENT EMAIL TO MOTHER: {mother_email} ===")
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
                "to": mother_email,
                "subject": subject,
                "text": body.strip(),
            })
            print(f"Cohort assignment email sent to mother {mother_email}: {response}")
            sent = True
        except Exception as e:
            error_msg = str(e)
            print(f"Failed to send cohort assignment email to mother via Resend: {e}")
            print(f"=== COHORT ASSIGNMENT EMAIL TO MOTHER: {mother_email} ===")
            print(f"Subject: {subject}")
            print(body)
            print("=== END EMAIL ===")

    if db is not None:
        log_email(
            db=db,
            recipient_email=mother_email,
            subject=subject,
            body=body.strip(),
            email_type="cohort_assignment_mother",
            status="success" if sent else "failed",
            error_message=error_msg,
        )

    return sent


def send_cohort_assignment_email_to_partner(
    partner_email: str,
    partner_name: str,
    mother_name: str,
    mother_email: Optional[str],
    cohort_name: str,
    cohort_type: str,
    start_date: date_type,
    venue_name: Optional[str],
    db: Session = None,
) -> bool:
    """
    Notify the referring partner organisation that their referred mother has
    been assigned to a cohort, including program-specific details.
    """
    api_key = os.getenv("RESEND_API_KEY", "")
    from_email = os.getenv("RESEND_FROM_EMAIL", "Go Nurture <noreply@gonurtureinitiative.org.uk>")

    program_name = PROGRAM_NAMES.get(cohort_type, cohort_type)

    if cohort_type == "breastfeeding_clinic":
        subject = f"[Cohort Assigned] {mother_name} booked into the Breastfeeding Support Clinic"
        body = f"""
Hello {partner_name},

Good news! The mother you referred has been assigned to a programme.

Referral Details:
- Mother: {mother_name}
- Mother's Email: {mother_email or "Not provided"}
- Programme: {program_name}
- Group: {cohort_name}
- Appointment Date: {start_date.strftime('%A, %d %B %Y')}
- Venue: {venue_name or "To be confirmed"}

The mother has been notified directly with her appointment details.

Thank you for your continued partnership in supporting mothers in our community.

Best regards,
Go Nurture Initiative CIC
"""

    else:
        schedule = compute_class_schedule(start_date)
        subject = f"[Cohort Assigned] {mother_name} enrolled in the Birth Confidence Program"
        body = f"""
Hello {partner_name},

Good news! The mother you referred has been enrolled in a programme.

Referral Details:
- Mother: {mother_name}
- Mother's Email: {mother_email or "Not provided"}
- Programme: {program_name}
- Group: {cohort_name}
- Venue: {venue_name or "To be confirmed"}

Class Schedule (weekly):
{_format_schedule_lines(schedule)}

The mother has been notified directly with her full class schedule and
welcome information.

Thank you for your continued partnership in supporting mothers in our community.

Best regards,
Go Nurture Initiative CIC
"""

    subject, body = render_managed_email(db, "cohort_assignment_partner", "cohort_assignment_partner.txt", {
        "partner_name": partner_name, "mother_name": mother_name, "mother_email": mother_email,
        "program_name": program_name, "cohort_name": cohort_name,
        "is_clinic": cohort_type == "breastfeeding_clinic", "date_text": start_date.strftime('%A, %d %B %Y'),
        "schedule_lines": _format_schedule_lines(compute_class_schedule(start_date)), "venue_name": venue_name,
    }, subject)

    if db is not None:
        sent = queue_and_process_email(db, "cohort_assignment_partner", partner_email, subject, body)
        log_email(db, partner_email, subject, body.strip(), "cohort_assignment", "success" if sent else "pending", None if sent else "Email queued for delivery or failed")
        return sent

    sent = False
    error_msg = None

    if not api_key or api_key == "re_xxxxxxxxxxxx":
        print(f"=== COHORT ASSIGNMENT EMAIL TO PARTNER: {partner_email} ===")
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
                "to": partner_email,
                "subject": subject,
                "text": body.strip(),
            })
            print(f"Cohort assignment email sent to partner {partner_email}: {response}")
            sent = True
        except Exception as e:
            error_msg = str(e)
            print(f"Failed to send cohort assignment email to partner via Resend: {e}")
            print(f"=== COHORT ASSIGNMENT EMAIL TO PARTNER: {partner_email} ===")
            print(f"Subject: {subject}")
            print(body)
            print("=== END EMAIL ===")

    if db is not None:
        log_email(
            db=db,
            recipient_email=partner_email,
            subject=subject,
            body=body.strip(),
            email_type="cohort_assignment_partner",
            status="success" if sent else "failed",
            error_message=error_msg,
        )

    return sent
