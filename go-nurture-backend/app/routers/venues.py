from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.database.session import get_db
from app.models.venue import Venue
from app.schemas.venue import VenueResponse

router = APIRouter(prefix="/api/venues", tags=["Venues"])


@router.get("/", response_model=List[VenueResponse])
def list_venues(db: Session = Depends(get_db)):
    """List all active community venues (public)."""
    venues = db.query(Venue).filter(Venue.is_active == True).all()
    return [VenueResponse.model_validate(v) for v in venues]