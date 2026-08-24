from pydantic import BaseModel, Field
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
    name: str = Field(min_length=1, max_length=255)


class CommunityPartnerUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    is_active: Optional[bool] = None
