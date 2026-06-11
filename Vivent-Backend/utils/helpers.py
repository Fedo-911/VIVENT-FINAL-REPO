"""Shared application helpers."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any

from fastapi import HTTPException

from supabase_client import supabase

VALID_EVENT_CATEGORIES = {"educational", "expo", "food", "job_fair"}
VALID_EVENT_STATUSES = {"pending", "approved", "rejected", "completed"}
VALID_PLAN_NAMES = {"Basic", "Normal", "Premium"}
VALID_ROLES = {"admin", "student", "business"}
VALID_PAYMENT_STATUSES = {"pending", "completed", "failed"}
VALID_AD_STATUSES = {"pending", "approved", "rejected"}
VALID_AD_PLATFORMS = {"instagram", "facebook", "linkedin", "tiktok", "whatsapp", "offline_posters"}


def utc_now_iso() -> str:
    """Return the current UTC timestamp in ISO 8601 format."""
    return datetime.now(timezone.utc).isoformat()


def parse_datetime(value: str) -> datetime:
    """Parse an ISO datetime string into an aware datetime."""
    normalized = value.replace("Z", "+00:00")
    parsed = datetime.fromisoformat(normalized)
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed


def generate_transaction_id() -> str:
    """Generate a dummy transaction identifier."""
    return f"TXN-{uuid.uuid4().hex[:18].upper()}"


def generate_dummy_meeting_url(event_id: str) -> str:
    """Generate a placeholder video meeting URL."""
    return f"https://meet.vivent.local/{event_id}/{uuid.uuid4().hex[:10]}"


def serialize_decimal(value: Any) -> Any:
    """Convert Decimal values to JSON-safe types."""
    if isinstance(value, Decimal):
        return float(value)
    return value


def get_row_or_404(table: str, row_id: str) -> dict[str, Any]:
    """Fetch a single row by ID or raise 404."""
    response = supabase.table(table).select("*").eq("id", row_id).limit(1).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail=f"{table[:-1].replace('_', ' ').title()} not found.")
    return response.data[0]


def ensure_plan_active(plan_id: str) -> dict[str, Any]:
    """Fetch and validate an active plan."""
    plan = get_row_or_404("plans", plan_id)
    if not plan.get("is_active", False):
        raise HTTPException(status_code=400, detail="Selected plan is inactive.")
    return plan


def ensure_event_access(current_user: dict[str, Any], event: dict[str, Any]) -> None:
    """Allow access to admins or event creators."""
    if current_user.get("role") == "admin" or event.get("created_by") == current_user.get("id"):
        return
    raise HTTPException(status_code=403, detail="You do not have permission to access this event.")


def ensure_registered_or_privileged(current_user: dict[str, Any], event: dict[str, Any]) -> None:
    """Allow admin, creator, or registered participant."""
    if current_user.get("role") == "admin" or event.get("created_by") == current_user.get("id"):
        return
    registration = (
        supabase.table("event_registrations")
        .select("id")
        .eq("event_id", event["id"])
        .eq("user_id", current_user["id"])
        .limit(1)
        .execute()
    )
    if not registration.data:
        raise HTTPException(status_code=403, detail="You must be registered for this event.")


def create_notification(user_id: str, title: str, message: str) -> dict[str, Any]:
    """Create a notification record."""
    payload = {
        "user_id": user_id,
        "title": title,
        "message": message,
        "is_read": False,
        "created_at": utc_now_iso(),
        "updated_at": utc_now_iso(),
    }
    result = supabase.table("notifications").insert(payload).execute()
    return result.data[0]


def validate_role(role: str, *, allow_admin: bool = False) -> None:
    """Validate a role value."""
    allowed = {"student", "business"}
    if allow_admin:
        allowed = VALID_ROLES
    if role not in allowed:
        raise HTTPException(status_code=400, detail="Invalid role.")


def validate_event_category(category: str) -> None:
    """Validate an event category."""
    if category not in VALID_EVENT_CATEGORIES:
        raise HTTPException(status_code=400, detail="Invalid event category.")


def validate_event_status(status: str) -> None:
    """Validate an event status."""
    if status not in VALID_EVENT_STATUSES:
        raise HTTPException(status_code=400, detail="Invalid event status.")


def validate_plan_name(name: str) -> None:
    """Validate a plan name."""
    if not name or not name.strip() or len(name) < 2 or len(name) > 100:
        raise HTTPException(
            status_code=400,
            detail="Invalid plan name. Plan name must be between 2 and 100 characters long."
        )


def validate_payment_status(status: str) -> None:
    """Validate a payment status."""
    if status not in VALID_PAYMENT_STATUSES:
        raise HTTPException(status_code=400, detail="Invalid payment status.")


def validate_ad_platforms(platforms: list[str]) -> None:
    """Validate social ad platform values."""
    normalized = {platform.lower() for platform in platforms}
    if not normalized.issubset(VALID_AD_PLATFORMS):
        raise HTTPException(status_code=400, detail="One or more ad platforms are invalid.")
