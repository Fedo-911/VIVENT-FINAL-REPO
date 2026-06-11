"""JWT helpers using PyJWT."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

from fastapi import HTTPException
import jwt  # ✅ correct import

from config import settings


def create_access_token(subject: str, role: str, email: str) -> str:
    """Create a signed JWT access token."""
    expires_at = datetime.now(timezone.utc) + timedelta(
        hours=settings.access_token_expire_hours
    )

    payload = {
        "sub": subject,
        "role": role,
        "email": email,
        "exp": expires_at,  # PyJWT can handle datetime
        "iat": datetime.now(timezone.utc),
    }

    token = jwt.encode(
        payload,
        settings.jwt_secret,
        algorithm=settings.jwt_algorithm,
    )

    return token


def decode_access_token(token: str) -> dict[str, Any]:
    """Decode and validate a JWT token."""
    try:
        decoded = jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm],
        )
        return decoded

    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired.")

    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token.")