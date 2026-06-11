"""Notification routes."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query

from dependencies import get_current_user
from schemas import MessageResponse, NotificationOut
from supabase_client import supabase
from utils.helpers import get_row_or_404, utc_now_iso

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("", response_model=list[NotificationOut])
def list_notifications(
    read: bool | None = Query(default=None),
    current_user: dict = Depends(get_current_user),
) -> list[dict]:
    """List notifications for the current user."""
    query = supabase.table("notifications").select("*").eq("user_id", current_user["id"])
    if read is not None:
        query = query.eq("is_read", read)
    response = query.order("created_at", desc=True).execute()
    return response.data or []


@router.put("/{notif_id}/read", response_model=MessageResponse)
def mark_notification_read(notif_id: str, current_user: dict = Depends(get_current_user)) -> MessageResponse:
    """Mark a notification as read."""
    notification = get_row_or_404("notifications", notif_id)
    if notification["user_id"] != current_user["id"] and current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="You cannot update this notification.")
    supabase.table("notifications").update({"is_read": True, "updated_at": utc_now_iso()}).eq("id", notif_id).execute()
    return MessageResponse(detail="Notification marked as read.")

