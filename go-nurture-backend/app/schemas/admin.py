from datetime import date
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class PartnerUpdate(BaseModel):
    organisation_name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    contact_name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    phone: Optional[str] = Field(default=None, max_length=50)
    organisation_type: Optional[str] = Field(default=None, min_length=1, max_length=100)
    is_admin: Optional[bool] = None


class FacilitatorAssignment(BaseModel):
    facilitator_id: UUID


class CohortCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    year: int = Field(ge=2000, le=2200)
    cohort_type: str = Field(min_length=1, max_length=100)
    start_date: date
    end_date: Optional[date] = None
    max_participants: int = Field(default=30, ge=1, le=10000)
    venue_id: Optional[UUID] = None
    is_active: Optional[bool] = True
    description: Optional[str] = None


class CohortUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    year: Optional[int] = Field(default=None, ge=2000, le=2200)
    cohort_type: Optional[str] = Field(default=None, min_length=1, max_length=100)
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    max_participants: Optional[int] = Field(default=None, ge=1, le=10000)
    venue_id: Optional[UUID] = None
    is_active: Optional[bool] = None
    description: Optional[str] = None