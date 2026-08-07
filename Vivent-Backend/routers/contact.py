"""Contact form routes."""

from __future__ import annotations

import html
import time
from collections import defaultdict, deque
from threading import Lock

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials

from dependencies import bearer_scheme, get_current_user, require_admin
from schemas import ContactMessageCreate, ContactMessageOut, ContactReplyCreate, ContactStatusUpdate, MessageResponse
from supabase_client import supabase
from utils.helpers import create_notification, get_row_or_404, notify_admins, utc_now_iso

router = APIRouter(prefix="/contact", tags=["contact"])

RATE_LIMIT_WINDOW_SECONDS = 300
RATE_LIMIT_MAX_SUBMISSIONS = 5
_submission_log: dict[str, deque[float]] = defaultdict(deque)
_rate_limit_lock = Lock()


def _sanitize(value: str) -> str:
    return html.escape(value.strip(), quote=True)


def _client_key(request: Request) -> str:
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        return forwarded_for.split(",", 1)[0].strip()
    return request.client.host if request.client else "unknown"


def _enforce_rate_limit(request: Request) -> None:
    now = time.monotonic()
    key = _client_key(request)
    with _rate_limit_lock:
        entries = _submission_log[key]
        while entries and now - entries[0] > RATE_LIMIT_WINDOW_SECONDS:
            entries.popleft()
        if len(entries) >= RATE_LIMIT_MAX_SUBMISSIONS:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many contact submissions. Please try again later.",
            )
        entries.append(now)


def _notify_admins(name: str) -> None:
    notify_admins("New Contact Inquiry", f"New contact inquiry received from {name}.", notification_type="contact")


@router.post("", response_model=ContactMessageOut, status_code=status.HTTP_201_CREATED)
def submit_contact_message(
    request: Request,
    payload: ContactMessageCreate,
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> dict:
    """Validate and store a contact form message."""
    _enforce_rate_limit(request)
    now = utc_now_iso()
    # The UI requires sign-in, but accepting legacy anonymous form submissions
    # avoids breaking pre-existing integrations. Only authenticated submissions
    # can be shown in a user's history or receive an in-app reply notification.
    current_user = get_current_user(credentials) if credentials else None
    contact_data = {
        "name": _sanitize(payload.name),
        "email": str(payload.email).strip().lower(),
        "phone": payload.phone.strip(),
        "service": payload.service,
        "message": _sanitize(payload.message),
        "status": "New",
        "created_at": now,
        "updated_at": now,
    }
    if current_user:
        contact_data["user_id"] = current_user["id"]
    response = supabase.table("contact_messages").insert(contact_data).execute()
    if not response.data:
        raise HTTPException(status_code=500, detail="Could not submit contact message.")
    _notify_admins(contact_data["name"])
    return response.data[0]


@router.get("", response_model=list[ContactMessageOut])
def list_contact_messages(current_user: dict = Depends(require_admin)) -> list[dict]:
    """List contact messages newest first for administrators."""
    _ = current_user
    response = supabase.table("contact_messages").select("*").order("created_at", desc=True).execute()
    return response.data or []


@router.get("/mine", response_model=list[ContactMessageOut])
def list_my_contact_messages(current_user: dict = Depends(get_current_user)) -> list[dict]:
    """List only the authenticated user's own contact inquiries."""
    response = (
        supabase.table("contact_messages")
        .select("*")
        .eq("user_id", current_user["id"])
        .order("created_at", desc=True)
        .execute()
    )
    return response.data or []


@router.get("/{message_id}", response_model=ContactMessageOut)
def get_contact_message(message_id: str, current_user: dict = Depends(get_current_user)) -> dict:
    """Return a conversation only to its owner or an administrator."""
    message = get_row_or_404("contact_messages", message_id)
    if current_user.get("role") != "admin" and message.get("user_id") != current_user["id"]:
        raise HTTPException(status_code=403, detail="You can only view your own contact inquiries.")
    return message


@router.post("/{message_id}/reply")
def reply_to_contact_message(
    message_id: str,
    payload: ContactReplyCreate,
    current_user: dict = Depends(require_admin),
) -> dict:
    """Persist an admin reply and notify the inquiry owner."""
    message = get_row_or_404("contact_messages", message_id)
    now = utc_now_iso()
    response = (
        supabase.table("contact_messages")
        .update({
            "admin_reply": _sanitize(payload.reply),
            "is_replied": True,
            "replied_at": now,
            "replied_by": current_user["id"],
            # A reply is the default status; a later explicit status update may
            # intentionally change it to Closed or another valid state.
            "status": "Replied",
            "updated_at": now,
        })
        .eq("id", message_id)
        .execute()
    )
    if not response.data:
        raise HTTPException(status_code=404, detail="Contact message not found.")

    if message.get("user_id"):
        create_notification(
            message["user_id"],
            "Contact inquiry reply",
            "Your contact inquiry has received a reply from the VIVENT Admin.",
            notification_type="contact_reply",
            reference_id=message_id,
            reference_type="contact_message",
        )
    return {"success": True}


@router.patch("/{message_id}/status", response_model=ContactMessageOut)
def update_contact_status(
    message_id: str,
    payload: ContactStatusUpdate,
    current_user: dict = Depends(require_admin),
) -> dict:
    """Update a contact message status."""
    _ = current_user
    get_row_or_404("contact_messages", message_id)
    response = (
        supabase.table("contact_messages")
        .update({"status": payload.status, "updated_at": utc_now_iso()})
        .eq("id", message_id)
        .execute()
    )
    if not response.data:
        raise HTTPException(status_code=404, detail="Contact message not found.")
    return response.data[0]


@router.delete("/{message_id}", response_model=MessageResponse)
def delete_contact_message(
    message_id: str,
    current_user: dict = Depends(require_admin),
) -> MessageResponse:
    """Delete a contact message."""
    _ = current_user
    get_row_or_404("contact_messages", message_id)
    supabase.table("contact_messages").delete().eq("id", message_id).execute()
    return MessageResponse(detail="Contact message deleted.")
