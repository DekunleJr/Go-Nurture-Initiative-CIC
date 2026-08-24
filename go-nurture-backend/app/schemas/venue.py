from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from uuid import UUID


class VenueResponse(BaseModel):
    id: UUID
    name: str
    address: str
    city: str
    postcode: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    description: Optional[str] = None
    transport_links: Optional[str] = None
    nearby_landmarks: Optional[str] = None
    accessibility_info: Optional[str] = None
    is_active: bool

    model_config = {"from_attributes": True}


class VenueCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    address: str = Field(min_length=1, max_length=500)
    city: str = Field(min_length=1, max_length=100)
    postcode: Optional[str] = Field(default=None, max_length=20)
    capacity: Optional[int] = Field(default=None, ge=0)
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    description: Optional[str] = None
    transport_links: Optional[str] = None
    nearby_landmarks: Optional[str] = None
    accessibility_info: Optional[str] = None


class VenueUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    address: Optional[str] = Field(default=None, min_length=1, max_length=500)
    city: Optional[str] = Field(default=None, min_length=1, max_length=100)
    postcode: Optional[str] = Field(default=None, max_length=20)
    capacity: Optional[int] = Field(default=None, ge=0)
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    description: Optional[str] = None
    transport_links: Optional[str] = None
    nearby_landmarks: Optional[str] = None
    accessibility_info: Optional[str] = None
    is_active: Optional[bool] = None
