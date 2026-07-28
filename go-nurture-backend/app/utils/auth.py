import os
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional
from uuid import UUID

from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from dotenv import load_dotenv

from app.database.session import get_db
from app.models.partner import PartnerOrganisation

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"))

SECRET_KEY = os.getenv("SECRET_KEY", "change-this-secret-key")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def generate_set_password_token() -> str:
    """Generate a cryptographically secure random token for first-time password setup."""
    return secrets.token_urlsafe(48)


def create_access_token(partner_id: UUID, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = {"sub": str(partner_id)}
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode["exp"] = expire
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def get_current_partner(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> PartnerOrganisation:
    """Dependency to extract and verify the current partner from JWT token."""
    token = credentials.credentials
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        partner_id: str = payload.get("sub")
        if partner_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    partner = db.query(PartnerOrganisation).filter(PartnerOrganisation.id == partner_id).first()
    if partner is None:
        raise credentials_exception
    return partner


def get_current_admin(
    current_partner: PartnerOrganisation = Depends(get_current_partner),
) -> PartnerOrganisation:
    """Dependency to ensure the current partner is an admin."""
    if not current_partner.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return current_partner