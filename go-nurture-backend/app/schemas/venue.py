from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID


class VenueResponse(BaseModel):
    id: UUID
    name: str
    address: str
    postcode: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    description: Optional[str] = None
    transport_links: Optional[str] = None
    nearby_landmarks: Optional[str] = None
    accessibility_info: Optional[str] = None
    is_active: bool

    model_config = {"from_attributes": True}


class VenueCreate(BaseModel):
    name: str
    address: str
    postcode: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    description: Optional[str] = None
    transport_links: Optional[str] = None
    nearby_landmarks: Optional[str] = None
    accessibility_info: Optional[str] = None