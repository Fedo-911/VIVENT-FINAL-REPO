"""Registration routes."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status

from dependencies import get_current_user, require_roles
from schemas import RegistrationCreate, RegistrationOut
from supabase_client import supabase
from utils.helpers import create_notification, get_row_or_404, utc_now_iso

router = APIRouter(tags=["registrations"])


@router.post("/events/{event_id}/register", response_model=RegistrationOut, status_code=status.HTTP_201_CREATED)
def register_for_event(
    event_id: str,
    payload: RegistrationCreate,
    current_user: dict = Depends(require_roles("student", "business")),
) -> dict:
    """Register the current user for an approved event."""
    event = get_row_or_404("events", event_id)
    if event["status"] != "approved":
        raise HTTPException(status_code=400, detail="You can only register for approved events.")
    if event["current_participants"] >= event["max_participants"]:
        raise HTTPException(status_code=400, detail="This event has reached its participant limit.")

    existing = (
        supabase.table("event_registrations")
        .select("id")
        .eq("event_id", event_id)
        .eq("user_id", current_user["id"])
        .limit(1)
        .execute()
    )
    if existing.data:
        raise HTTPException(status_code=400, detail="You are already registered for this event.")

    registration = {
        "user_id": current_user["id"],
        "event_id": event_id,
        "role_at_event": payload.role_at_event,
        "registration_date": utc_now_iso(),
        "payment_status": "pending",
        "payment_id": None,
        "created_at": utc_now_iso(),
        "updated_at": utc_now_iso(),
    }
    response = supabase.table("event_registrations").insert(registration).execute()
    supabase.table("events").update(
        {"current_participants": event["current_participants"] + 1, "updated_at": utc_now_iso()}
    ).eq("id", event_id).execute()
    create_notification(
        current_user["id"],
        "Registration Created",
        f"You registered for '{event['title']}'. Complete payment if required.",
    )
    return response.data[0]


@router.get("/events/{event_id}/registrations", response_model=list[RegistrationOut])
def list_event_registrations(
    event_id: str,
    current_user: dict = Depends(get_current_user),
) -> list[dict]:
    """List registrations for an event for admins or event creators."""
    event = get_row_or_404("events", event_id)
    if current_user["role"] != "admin" and event["created_by"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="You do not have permission to view registrations.")
    response = (
        supabase.table("event_registrations")
        .select("*")
        .eq("event_id", event_id)
        .order("registration_date", desc=False)
        .execute()
    )
    return response.data or []

