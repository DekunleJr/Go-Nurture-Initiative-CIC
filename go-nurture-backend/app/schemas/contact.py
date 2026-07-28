from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from uuid import UUID


class ContactCreate(BaseModel):
    name: str
    email: EmailStr
    subject: Optional[str] = None
    message: str


class ContactResponse(BaseModel):
    id: UUID
    name: str
    email: str
    subject: Optional[str] = None
    message: str
    is_read: bool
    created_at: datetime

    model_config = {"from_attributes": True}