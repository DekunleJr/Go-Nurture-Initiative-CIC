from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
import os
from dotenv import load_dotenv
import logging
from pathlib import Path
from sqlalchemy import text

from app.routers import auth, referrals, contact, donations, venues, admin, community, facilitator
from app.database.session import SessionLocal, engine
from app.models.partner import PartnerOrganisation
from app.models.community_partner import CommunityPartner
from app.models.email_template import EmailTemplate
from app.utils.auth import hash_password
from app.utils.exceptions import AppException, error_payload
from app.middleware.rate_limit import limiter
from app.middleware.request_logging import RequestLoggingMiddleware
from app.config import validate_production_settings

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Go Nurture API",
    description="Backend API for Go Nurture Initiative CIC - Perinatal education and community support platform",
    version="1.0.0",
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(RequestLoggingMiddleware)


@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content=error_payload(exc.code, exc.message, exc.details),
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        headers=exc.headers,
        content=error_payload("HTTP_ERROR", str(exc.detail)),
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    return JSONResponse(
        status_code=422,
        content=error_payload("VALIDATION_ERROR", "Request validation failed", exc.errors()),
    )


@app.on_event("startup")
def startup_events():
    """Validate production config, check database connectivity, and seed admin account if needed."""
    try:
        validate_production_settings()
    except ValueError as e:
        logger.error(f"Production configuration validation failed: {e}")
        raise SystemExit(str(e))

    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info("Database connected successfully")
    except Exception as e:
        logger.error(f"Failed to connect to database: {e}")
        raise SystemExit("Database connection failed. Application shutting down.")

    seed_admin()
    seed_community_partners()
    seed_email_templates()


def seed_admin():
    """Create an admin account if one doesn't already exist."""
    admin_email = os.getenv("ADMIN_EMAIL")
    admin_password = os.getenv("ADMIN_PASSWORD")

    if not admin_email or not admin_password:
        logger.warning("ADMIN_EMAIL or ADMIN_PASSWORD not set in .env. Skipping admin seeding.")
        return

    db = SessionLocal()
    try:
        existing_admin = db.query(PartnerOrganisation).filter(
            PartnerOrganisation.email == admin_email,
            PartnerOrganisation.is_admin == True,
        ).first()

        if existing_admin:
            logger.info(f"Admin account already exists: {admin_email}")
            return

        # Create admin account
        admin = PartnerOrganisation(
            organisation_name="Go Nurture Admin",
            contact_name="Administrator",
            email=admin_email,
            hashed_password=hash_password(admin_password),
            organisation_type="admin",
            is_active=True,
            is_verified=True,
            is_admin=True,
        )
        db.add(admin)
        db.commit()
        logger.info(f"Admin account created successfully: {admin_email}")
    except Exception as e:
        logger.error(f"Failed to seed admin account: {e}")
        db.rollback()
    finally:
        db.close()


def seed_community_partners():
    """Seed initial community partners if the table is empty."""
    initial_partners = [
        "NHS Norfolk & Waveney Integrated Care Board",
        "Community Midwives & Health Visitors",
        "English Plus (Language Support)",
        "Bridge Plus (Migrant Support)",
        "New Routes (Refugee Support)",
        "Local Churches & Community Groups",
        "Local Mosques & Faith Centres",
        "Family Support Services",
    ]

    db = SessionLocal()
    try:
        count = db.query(CommunityPartner).count()
        if count > 0:
            logger.info(f"Community partners already seeded ({count} partners)")
            return

        for name in initial_partners:
            partner = CommunityPartner(name=name)
            db.add(partner)
        db.commit()
        logger.info(f"Seeded {len(initial_partners)} community partners")
    except Exception as e:
        logger.error(f"Failed to seed community partners: {e}")
        db.rollback()
    finally:
        db.close()


def seed_email_templates():
    """Create the initial editable email templates when the table is empty."""
    templates = [
        ("partner_invite", "Partner invitation", "You've been invited to join {{ organisation_name }} on Go Nurture Initiative", "partner_invite.txt"),
        ("password_reset", "Password reset", "Reset your Go Nurture Initiative password", "password_reset.txt"),
        ("referral_notification", "New referral notification", "[New Referral] A new mother needs approval", "referral_notification.txt"),
        ("donation_notification", "Donation notification", "[New Donation] A new donation has been received", "donation_notification.txt"),
        ("referral_approval", "Referral approval", "[Referral Approved] {{ mother_name }}'s referral has been approved", "referral_approval.txt"),
        ("contact", "Contact form notification", "[Contact Form] {{ message_subject }}", "contact_notification.txt"),
        ("facilitator_assignment", "Facilitator assignment", "You've been assigned: {{ cohort_name }}", "facilitator_assignment.txt"),
        ("cohort_assignment_mother", "Cohort assignment to mother", "Your Go Nurture programme booking", "cohort_assignment_mother.txt"),
        ("cohort_assignment_partner", "Cohort assignment to partner", "[Cohort Assigned] {{ mother_name }}", "cohort_assignment_partner.txt"),
    ]
    template_dir = Path(__file__).resolve().parent / "templates" / "email"
    db = SessionLocal()
    try:
        for key, name, subject, filename in templates:
            exists = db.query(EmailTemplate).filter(EmailTemplate.template_key == key).first()
            if not exists:
                db.add(EmailTemplate(
                    template_key=key,
                    name=name,
                    subject=subject,
                    body=(template_dir / filename).read_text(encoding="utf-8"),
                    version=1,
                    is_active=True,
                ))
        db.commit()
    except Exception:
        db.rollback()
        logger.exception("Failed to seed email templates")
    finally:
        db.close()


# CORS configuration
FRONTEND_URLS = os.getenv("FRONTEND_URL", "http://localhost:3000")
# Split comma-separated origins into a list and strip whitespace
allowed_origins = [origin.strip() for origin in FRONTEND_URLS.split(",") if origin.strip()]

logger.info(f"CORS allowed origins: {allowed_origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router)
app.include_router(referrals.router)
app.include_router(contact.router)
app.include_router(donations.router)
app.include_router(venues.router)
app.include_router(admin.router)
app.include_router(community.router)
app.include_router(facilitator.router)


@app.get("/")
def root():
    return {"message": "Welcome to Go Nurture API"}


@app.get("/api/health")
def health_check():
    return {"status": "healthy", "version": "1.0.0"}
