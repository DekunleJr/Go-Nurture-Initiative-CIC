from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID


class CommunityPartnerResponse(BaseModel):
    id: UUID
    name: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class CommunityPartnerCreate(BaseModel):
    name: str
