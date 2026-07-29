import os
import resend
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"))


def send_invite_email(
    recipient_email: str,
    recipient_name: str,
    organisation_name: str,
    invite_link: str,
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

    # If no API key is configured, print to console (for development/testing)
    if not api_key or api_key == "re_xxxxxxxxxxxx":
        print(f"=== EMAIL TO: {recipient_email} ===")
        print(f"From: {from_email}")
        print(f"Subject: {subject}")
        print(body)
        print("=== END EMAIL ===")
        return True

    try:
        resend.api_key = api_key
        response = resend.Emails.send({
            "from": from_email,
            "to": recipient_email,
            "subject": subject,
            "text": body.strip(),
        })
        print(f"Email sent to {recipient_email}: {response}")
        return True
    except Exception as e:
        print(f"Failed to send email via Resend: {e}")
        # Fallback: print to console so development isn't blocked
        print(f"=== EMAIL TO: {recipient_email} ===")
        print(f"From: {from_email}")
        print(f"Subject: {subject}")
        print(body)
        print("=== END EMAIL ===")
        return False


def send_contact_email(
    sender_name: str,
    sender_email: str,
    subject: str,
    message: str,
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

    # If no API key is configured, print to console (for development/testing)
    if not api_key or api_key == "re_xxxxxxxxxxxx":
        print(f"=== CONTACT EMAIL TO: {contact_email} ===")
        print(f"From: {from_email}")
        print(f"Subject: {email_subject}")
        print(body)
        print("=== END CONTACT EMAIL ===")
        return True

    try:
        resend.api_key = api_key
        response = resend.Emails.send({
            "from": from_email,
            "to": contact_email,
            "subject": email_subject,
            "text": body.strip(),
        })
        print(f"Contact email sent to {contact_email}: {response}")
        return True
    except Exception as e:
        print(f"Failed to send contact email via Resend: {e}")
        # Fallback: print to console so development isn't blocked
        print(f"=== CONTACT EMAIL TO: {contact_email} ===")
        print(f"From: {from_email}")
        print(f"Subject: {email_subject}")
        print(body)
        print("=== END CONTACT EMAIL ===")
        return False
