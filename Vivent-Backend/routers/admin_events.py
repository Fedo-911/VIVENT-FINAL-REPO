"""Admin-only event moderation routes."""

from __future__ import annotations

from fastapi import APIRouter, Depends

from dependencies import require_roles
from schemas import EventOut, MessageResponse
from supabase_client import supabase
from utils.helpers import create_notification, get_row_or_404, utc_now_iso

router = APIRouter(prefix="/admin/events", tags=["admin-events"])


@router.get("/pending", response_model=list[EventOut])
def list_pending_events(current_user: dict = Depends(require_roles("admin"))) -> list[dict]:
    """List all events pending moderation."""
    _ = current_user
    response = supabase.table("events").select("*").eq("status", "pending").order("created_at", desc=False).execute()
    return response.data or []


@router.put("/{event_id}/approve", response_model=EventOut)
def approve_event(event_id: str, current_user: dict = Depends(require_roles("admin"))) -> dict:
    """Approve an event."""
    event = get_row_or_404("events", event_id)
    update = {"status": "approved", "approved_by": current_user["id"], "updated_at": utc_now_iso()}
    response = supabase.table("events").update(update).eq("id", event_id).execute()
    create_notification(
        event["created_by"],
        "Event Approved",
        f"Your event '{event['title']}' has been approved.",
    )
    return response.data[0]


@router.put("/{event_id}/reject", response_model=EventOut)
def reject_event(
    event_id: str,
    payload: MessageResponse,
    current_user: dict = Depends(require_roles("admin")),
) -> dict:
    """Reject an event and store the reason inside venue_details metadata."""
    event = get_row_or_404("events", event_id)
    venue_details = event.get("venue_details") or {}
    venue_details["_admin_review"] = {"rejection_reason": payload.detail, "reviewed_at": utc_now_iso()}
    update = {
        "status": "rejected",
        "approved_by": current_user["id"],
        "venue_details": venue_details,
        "updated_at": utc_now_iso(),
    }
    response = supabase.table("events").update(update).eq("id", event_id).execute()
    create_notification(
        event["created_by"],
        "Event Rejected",
        f"Your event '{event['title']}' was rejected. Reason: {payload.detail}",
    )
    return response.data[0]

