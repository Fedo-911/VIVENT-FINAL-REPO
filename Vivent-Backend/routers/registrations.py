"""Registration routes."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status

from dependencies import get_current_user
from schemas import RegistrationCreate, RegistrationOut
from supabase_client import supabase
from utils.helpers import create_notification, get_row_or_404, utc_now_iso

router = APIRouter(tags=["registrations"])

# Only food and educational events sell admission tickets. Job fairs can be
# registered for directly and may have an optional payment afterwards.
TICKET_FIRST_CATEGORIES = {"food", "educational"}

def _completed_ticket_for_user(event_id: str, user_id: str) -> dict | None:
    response = (
        supabase.table("payments")
        .select("*")
        .eq("event_id", event_id)
        .eq("user_id", user_id)
        .eq("status", "completed")
        .limit(1)
        .execute()
    )
    return response.data[0] if response.data else None


@router.post("/events/{event_id}/register", response_model=RegistrationOut, status_code=status.HTTP_201_CREATED)
def register_for_event(
    event_id: str,
    payload: RegistrationCreate,
    current_user: dict = Depends(get_current_user),
) -> dict:
    """Register the current user for an approved event."""
    event = get_row_or_404("events", event_id)
    if event["status"] != "approved":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found.")
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
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="You are already registered for this event.")

    ticket_payment = None
    if event.get("category") in TICKET_FIRST_CATEGORIES:
        # A completed payment is the authoritative ticket record. It is queried
        # by event and current user so another user's ticket cannot unlock
        # registration.
        ticket_payment = _completed_ticket_for_user(event_id, current_user["id"])
        if not ticket_payment:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Please purchase a ticket before registering for this event.",
            )

    registration = {
        "user_id": current_user["id"],
        "event_id": event_id,
        "role_at_event": payload.role_at_event,
        "registration_date": utc_now_iso(),
        "registration_status": "Registered",
        "payment_status": "completed" if ticket_payment else "pending",
        "payment_id": ticket_payment["id"] if ticket_payment else None,
        "created_at": utc_now_iso(),
        "updated_at": utc_now_iso(),
    }
    response = supabase.table("event_registrations").insert(registration).execute()
    if not response.data:
        raise HTTPException(status_code=500, detail="Could not save your registration. Please try again.")
    supabase.table("events").update(
        {"current_participants": event["current_participants"] + 1, "updated_at": utc_now_iso()}
    ).eq("id", event_id).execute()
    create_notification(
        current_user["id"],
        "Event Registration Successful",
        f"You have successfully registered for '{event['title']}'.",
        notification_type="event_registration", reference_id=response.data[0]["id"], reference_type="event",
    )
    if event.get("created_by") != current_user["id"]:
        create_notification(event["created_by"], "New Event Registration", f"A new attendee registered for '{event['title']}'.", notification_type="event_registration", reference_id=response.data[0]["id"], reference_type="event")
    return response.data[0]


@router.get("/registrations/my", response_model=list[RegistrationOut])
def list_my_registrations(current_user: dict = Depends(get_current_user)) -> list[dict]:
    """List the current user's registrations with their event details."""
    response = (
        supabase.table("event_registrations")
        .select("*")
        .eq("user_id", current_user["id"])
        .order("registration_date", desc=True)
        .execute()
    )
    registrations = response.data or []
    event_ids = [registration["event_id"] for registration in registrations]
    events = (
        supabase.table("events").select("*").in_("id", event_ids).execute().data if event_ids else []
    ) or []
    creator_ids = list({event["created_by"] for event in events if event.get("created_by")})
    creators = (
        supabase.table("users").select("id,full_name").in_("id", creator_ids).execute().data if creator_ids else []
    ) or []
    creators_by_id = {creator["id"]: creator["full_name"] for creator in creators}
    events_by_id = {
        event["id"]: {
            **event,
            "organizer": event.get("venue_details", {}).get("organizer")
            or creators_by_id.get(event.get("created_by"))
            or "VIVENT",
        }
        for event in events
    }

    return [
        {
            **registration,
            "registration_status": registration.get("registration_status") or "Registered",
            "event": events_by_id.get(registration["event_id"]),
        }
        for registration in registrations
    ]


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
