from pathlib import Path
from typing import Any

from jinja2 import Environment, FileSystemLoader, StrictUndefined
from sqlalchemy.orm import Session

from app.models.email_template import EmailTemplate


TEMPLATE_DIR = Path(__file__).resolve().parent.parent / "templates" / "email"
environment = Environment(
    loader=FileSystemLoader(TEMPLATE_DIR),
    undefined=StrictUndefined,
    autoescape=False,
    trim_blocks=True,
    lstrip_blocks=True,
)


def render_email(template_name: str, **context: str) -> str:
    return environment.get_template(template_name).render(**context).strip()


def render_managed_email(
    db: Session | None,
    template_key: str,
    fallback_template: str,
    variables: dict[str, Any],
    fallback_subject: str,
) -> tuple[str, str]:
    """Render the active admin version, falling back safely before seeding."""
    template = None
    if db is not None:
        template = (
            db.query(EmailTemplate)
            .filter(EmailTemplate.template_key == template_key, EmailTemplate.is_active.is_(True))
            .order_by(EmailTemplate.version.desc())
            .first()
        )
    if template:
        return (
            environment.from_string(template.subject).render(**variables).strip(),
            environment.from_string(template.body).render(**variables).strip(),
        )
    return fallback_subject, render_email(fallback_template, **variables)
