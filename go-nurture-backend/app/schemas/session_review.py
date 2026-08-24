from pydantic import BaseModel
from typing import Optional, Any, Dict, List
from datetime import datetime
from uuid import UUID


class SessionReviewCreate(BaseModel):
    """Facilitator submits/updates a delivery audit for a cohort meeting."""
    cohort_id: UUID
    session_date: datetime
    week_number: Optional[int] = None
    mode: Optional[str] = None
    venue_or_platform: Optional[str] = None
    lead_facilitator: Optional[str] = None
    co_facilitator: Optional[str] = None
    start_time: Optional[str] = None
    finish_time: Optional[str] = None
    registered_count: Optional[int] = None
    attended_count: Optional[int] = None
    supporter_count: Optional[int] = None
    reasonable_adjustments: Optional[str] = None
    fidelity_checked: Optional[List[str]] = None
    quality_ratings: Optional[Dict[str, Any]] = None
    deviations: Optional[str] = None
    incidents: Optional[List[Dict[str, Any]]] = None
    reflection: Optional[Dict[str, Any]] = None
    status: str = "submitted"  # "draft" or "submitted"


class SessionReviewResponse(BaseModel):
    id: UUID
    cohort_id: UUID
    facilitator_id: UUID
    session_date: datetime
    week_number: Optional[int] = None
    mode: Optional[str] = None
    venue_or_platform: Optional[str] = None
    lead_facilitator: Optional[str] = None
    co_facilitator: Optional[str] = None
    start_time: Optional[str] = None
    finish_time: Optional[str] = None
    registered_count: Optional[int] = None
    attended_count: Optional[int] = None
    supporter_count: Optional[int] = None
    reasonable_adjustments: Optional[str] = None
    fidelity_checked: Optional[List[str]] = None
    quality_ratings: Optional[Dict[str, Any]] = None
    deviations: Optional[str] = None
    incidents: Optional[List[Dict[str, Any]]] = None
    reflection: Optional[Dict[str, Any]] = None
    status: str
    submitted_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    cohort_name: Optional[str] = None
    facilitator_name: Optional[str] = None

    model_config = {"from_attributes": True}