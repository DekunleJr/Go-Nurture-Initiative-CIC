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