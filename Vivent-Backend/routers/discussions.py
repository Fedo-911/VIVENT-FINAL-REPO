"""Discussion routes."""

from __future__ import annotations

from fastapi import APIRouter, Depends, status

from dependencies import get_current_user
from schemas import DiscussionCreate, DiscussionOut
from supabase_client import supabase
from utils.helpers import ensure_registered_or_privileged, get_row_or_404, utc_now_iso

router = APIRouter(tags=["discussions"])


@router.get("/events/{event_id}/discussions", response_model=list[DiscussionOut])
def list_discussions(event_id: str, current_user: dict = Depends(get_current_user)) -> list[dict]:
    """List discussion messages for an event."""
    event = get_row_or_404("events", event_id)
    ensure_registered_or_privileged(current_user, event)
    response = supabase.table("discussions").select("*").eq("event_id", event_id).order("sent_at", desc=False).execute()
    return response.data or []


@router.post("/events/{event_id}/discussions", response_model=DiscussionOut, status_code=status.HTTP_201_CREATED)
def post_discussion(
    event_id: str,
    payload: DiscussionCreate,
    current_user: dict = Depends(get_current_user),
) -> dict:
    """Post a new discussion message."""
    event = get_row_or_404("events", event_id)
    ensure_registered_or_privileged(current_user, event)
    message_data = {
        "event_id": event_id,
        "user_id": current_user["id"],
        "message": payload.message,
        "sent_at": utc_now_iso(),
        "created_at": utc_now_iso(),
        "updated_at": utc_now_iso(),
    }
    response = supabase.table("discussions").insert(message_data).execute()
    return response.data[0]

