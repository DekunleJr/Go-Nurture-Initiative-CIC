from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv
import logging
from sqlalchemy import text

from app.routers import auth, referrals, contact, donations, venues
from app.database.session import SessionLocal, engine
from app.models.partner import PartnerOrganisation
from app.utils.auth import hash_password

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Go Nurture API",
    description="Backend API for Go Nurture Initiative CIC - Perinatal education and community support platform",
    version="1.0.0",
)


@app.on_event("startup")
def startup_events():
    """Check database connectivity and seed admin account if needed."""
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info("Database connected successfully")
    except Exception as e:
        logger.error(f"Failed to connect to database: {e}")
        raise SystemExit("Database connection failed. Application shutting down.")

    seed_admin()


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


@app.get("/")
def root():
    return {"message": "Welcome to Go Nurture API"}


@app.get("/api/health")
def health_check():
    return {"status": "healthy", "version": "1.0.0"}