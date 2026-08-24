import os
from datetime import datetime, timedelta, timezone

import resend
from sqlalchemy.orm import Session

from app.models.email_template import EmailQueueItem


def enqueue_email(
    db: Session,
    template_key: str,
    recipient_email: str,
    subject: str,
    body: str,
    max_attempts: int = 3,
) -> EmailQueueItem:
    item = EmailQueueItem(
        template_key=template_key,
        recipient_email=recipient_email,
        subject=subject,
        body=body,
        status="pending",
        max_attempts=max(1, min(max_attempts, 10)),
        next_attempt_at=datetime.now(timezone.utc),
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def process_email_queue(db: Session, batch_size: int = 25) -> int:
    """Attempt due messages once; call from a scheduler or worker process."""
    now = datetime.now(timezone.utc)
    items = (
        db.query(EmailQueueItem)
        .filter(
            EmailQueueItem.status == "pending",
            (EmailQueueItem.next_attempt_at.is_(None)) | (EmailQueueItem.next_attempt_at <= now),
        )
        .order_by(EmailQueueItem.created_at.asc())
        .limit(batch_size)
        .all()
    )
    for item in items:
        _send_queue_item(db, item)
    return len(items)


def queue_and_process_email(
    db: Session,
    template_key: str,
    recipient_email: str,
    subject: str,
    body: str,
) -> bool:
    """Persist a message and make its first attempt without losing retry state."""
    item = enqueue_email(db, template_key, recipient_email, subject, body)
    _send_queue_item(db, item)
    db.refresh(item)
    return item.status == "sent"


def _send_queue_item(db: Session, item: EmailQueueItem) -> None:
    item.attempts += 1
    try:
        api_key = os.getenv("RESEND_API_KEY", "")
        if not api_key or api_key == "re_xxxxxxxxxxxx":
            item.status = "sent"
            item.sent_at = datetime.now(timezone.utc)
        else:
            resend.api_key = api_key
            resend.Emails.send({
                "from": os.getenv("RESEND_FROM_EMAIL", "Go Nurture <noreply@gonurture.org>"),
                "to": item.recipient_email,
                "subject": item.subject,
                "text": item.body,
            })
            item.status = "sent"
            item.sent_at = datetime.now(timezone.utc)
        item.last_error = None
    except Exception as exc:
        item.last_error = str(exc)
        if item.attempts >= item.max_attempts:
            item.status = "failed"
            item.next_attempt_at = None
        else:
            delay = min(3600, 60 * (2 ** (item.attempts - 1)))
            item.next_attempt_at = datetime.now(timezone.utc) + timedelta(seconds=delay)
    db.commit()
