"""Authentication routes."""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException, status

from dependencies import get_current_user
from schemas import LoginRequest, MessageResponse, RegisterRequest, TokenResponse, UserOut
from supabase_client import supabase
from utils.helpers import utc_now_iso, validate_role
from utils.jwt_handler import create_access_token
from utils.passwords import hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])
logger = logging.getLogger(__name__)


def normalize_email(email: str) -> str:
    """Normalize email addresses for consistent storage and login."""
    return email.strip().lower()


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest) -> dict:
    """Register a new student or business user."""
    validate_role(payload.role)
    normalized_email = normalize_email(str(payload.email))
    existing = supabase.table("users").select("id").ilike("email", normalized_email).limit(1).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="A user with this email already exists.")

    user_data = {
        "email": normalized_email,
        "hashed_password": hash_password(payload.password),
        "full_name": payload.full_name.strip(),
        "role": payload.role,
        "is_active": True,
        "created_at": utc_now_iso(),
        "updated_at": utc_now_iso(),
    }
    result = supabase.table("users").insert(user_data).execute()
    return result.data[0]


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest) -> TokenResponse:
    """Authenticate a user and return a JWT token."""
    normalized_email = normalize_email(str(payload.email))
    response = supabase.table("users").select("*").ilike("email", normalized_email).limit(1).execute()
    user = response.data[0] if response.data else None
    if not user:
        logger.warning("Login failed: user not found for email '%s'", normalized_email)
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    if not verify_password(payload.password, user["hashed_password"]):
        logger.warning(
            "Login failed: password mismatch for email '%s'; stored hash prefix='%s'",
            normalized_email,
            str(user.get("hashed_password", ""))[:4],
        )
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    if not user.get("is_active", True):
        raise HTTPException(status_code=403, detail="User account is inactive.")

    token = create_access_token(user["id"], user["role"], user["email"])
    return TokenResponse(
        access_token=token,
        expires_in_hours=24,
        user={key: value for key, value in user.items() if key != "hashed_password"},
    )


@router.get("/me", response_model=UserOut)
def me(current_user: dict = Depends(get_current_user)) -> dict:
    """Return the current authenticated user."""
    return current_user


@router.post("/logout", response_model=MessageResponse)
def logout() -> MessageResponse:
    """Client-side logout placeholder."""
    return MessageResponse(detail="Logout successful. Discard the token on the client.")
