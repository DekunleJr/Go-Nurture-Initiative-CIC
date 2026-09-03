import os
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional
from uuid import UUID

import jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, Request, Response, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from dotenv import load_dotenv

from app.database.session import get_db
from app.models.partner import PartnerOrganisation
from app.models.facilitator import Facilitator

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"))

SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError("SECRET_KEY must be set before starting the application")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

AUTH_COOKIE_NAME = "access_token"

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
# auto_error=False: we accept a bearer token for non-browser API clients, but
# the primary path is the httpOnly cookie set by /login and /set-password —
# neither is required on its own so a missing Authorization header doesn't
# 403 before we've had a chance to check the cookie.
bearer_scheme = HTTPBearer(auto_error=False)


def _cookie_security() -> tuple[bool, str]:
    """(secure, samesite) for the auth cookie, based on environment."""
    is_production = os.getenv("ENVIRONMENT", "development") == "production"
    return (True, "none") if is_production else (False, "lax")


def set_auth_cookie(response: Response, token: str) -> None:
    """Set the JWT as an httpOnly cookie so client-side JS can never read it
    (mitigates token theft via XSS). This is the only place the token is
    transmitted to the browser going forward."""
    secure, samesite = _cookie_security()
    response.set_cookie(
        key=AUTH_COOKIE_NAME,
        value=token,
        httponly=True,
        secure=secure,
        samesite=samesite,
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
    )


def clear_auth_cookie(response: Response) -> None:
    secure, samesite = _cookie_security()
    response.delete_cookie(key=AUTH_COOKIE_NAME, path="/", secure=secure, samesite=samesite)


def _extract_token(request: Request, credentials: Optional[HTTPAuthorizationCredentials]) -> Optional[str]:
    """Prefer an Authorization: Bearer header (API clients), fall back to the
    httpOnly cookie (browser sessions)."""
    if credentials:
        return credentials.credentials
    return request.cookies.get(AUTH_COOKIE_NAME)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def generate_set_password_token() -> str:
    """Generate a cryptographically secure random token for first-time password setup."""
    return secrets.token_urlsafe(48)


def create_access_token(
    user_id: UUID,
    expires_delta: Optional[timedelta] = None,
    role: str = "partner",
) -> str:
    """Create a JWT. `role` is one of: partner, admin, facilitator."""
    to_encode = {"sub": str(user_id), "role": role}
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode["exp"] = expire
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def get_current_partner(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> PartnerOrganisation:
    """Dependency to extract and verify the current partner from JWT token."""
    token = _extract_token(request, credentials)
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_exception
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        partner_id: str = payload.get("sub")
        role: str = payload.get("role", "")
        # Only tokens issued for a partner/admin login may authenticate here —
        # a facilitator token has a different `sub` namespace but we check the
        # role explicitly too, as defense-in-depth against ID collisions.
        if partner_id is None or role not in ("partner", "admin"):
            raise credentials_exception
    except jwt.PyJWTError:
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


def get_current_facilitator(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> Facilitator:
    """Dependency to extract and verify the current facilitator from JWT token."""
    token = _extract_token(request, credentials)
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_exception
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        role: str = payload.get("role", "")
        if user_id is None or role != "facilitator":
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception

    facilitator = db.query(Facilitator).filter(Facilitator.id == user_id).first()
    if facilitator is None:
        raise credentials_exception
    return facilitator
