"""User management routes."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from dependencies import get_current_user, require_admin, require_self_or_admin
from schemas import MessageResponse, UserOut, UserUpdate
from supabase_client import supabase
from utils.helpers import get_row_or_404, utc_now_iso
from utils.passwords import hash_password

router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=list[UserOut], dependencies=[Depends(require_admin)])
def list_users() -> list[dict]:
    """List all users — admin only."""
    response = supabase.table("users").select("*").order("created_at", desc=True).execute()
    return response.data or []


@router.get("/{user_id}", response_model=UserOut)
def get_user(user_id: str, current_user: dict = Depends(get_current_user)) -> dict:
    """Get a user by ID for admin or self."""
    require_self_or_admin(user_id, current_user)
    return get_row_or_404("users", user_id)


@router.patch("/{user_id}", response_model=UserOut)
def update_user(user_id: str, payload: UserUpdate, current_user: dict = Depends(get_current_user)) -> dict:
    """Update a user profile.

    The ``role`` field is intentionally excluded from ``UserUpdate`` and cannot
    be changed through this endpoint regardless of who calls it.  Role changes
    must be performed directly by a Supabase administrator via the Supabase
    dashboard or the database.  Any attempt to inject a ``role`` key into the
    payload is rejected with 403.
    """
    require_self_or_admin(user_id, current_user)
    update_data = payload.model_dump(exclude_unset=True)

    # Belt-and-suspenders: block any attempt to escalate privileges by injecting
    # the role field, even though UserUpdate does not expose it in its schema.
    if "role" in update_data:
        raise HTTPException(
            status_code=403,
            detail="You are not permitted to change user roles through this endpoint.",
        )

    if current_user.get("role") != "admin" and "is_active" in update_data:
        raise HTTPException(status_code=403, detail="You cannot change account activation status.")
    if "password" in update_data:
        update_data["hashed_password"] = hash_password(update_data.pop("password"))
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields provided for update.")
    update_data["updated_at"] = utc_now_iso()
    response = supabase.table("users").update(update_data).eq("id", user_id).execute()
    return response.data[0]
