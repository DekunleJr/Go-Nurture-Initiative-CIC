from datetime import datetime
from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


class EmailTemplateUpdate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    subject: str = Field(min_length=1, max_length=500)
    body: str = Field(min_length=1, max_length=100000)


class EmailTemplateResponse(BaseModel):
    id: UUID
    template_key: str
    name: str
    subject: str
    body: str
    version: int
    is_active: bool
    created_by: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class EmailPreviewRequest(BaseModel):
    variables: dict[str, Any] = Field(default_factory=dict)


class EmailTestSendRequest(EmailPreviewRequest):
    recipient_email: EmailStr


class EmailQueueResponse(BaseModel):
    id: UUID
    template_key: str
    recipient_email: EmailStr
    subject: str
    status: str
    attempts: int
    max_attempts: int
    next_attempt_at: Optional[datetime]
    last_error: Optional[str]
    sent_at: Optional[datetime]
    created_at: datetime

    model_config = {"from_attributes": True}