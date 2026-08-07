"""Event routes."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status

from dependencies import get_current_user, require_roles
from schemas import EventCreate, EventListResponse, EventOut, EventUpdate, MessageResponse
from supabase_client import supabase
from utils.helpers import (
    create_notification,
    ensure_event_access,
    ensure_plan_active,
    get_row_or_404,
    notify_admins,
    parse_datetime,
    utc_now_iso,
    validate_event_category,
    validate_event_status,
)

router = APIRouter(prefix="/events", tags=["events"])
public_router = APIRouter(tags=["public-events"])
TICKET_FIRST_CATEGORIES = {"food", "educational"}


def _with_ticket_price(event: dict[str, Any]) -> dict[str, Any]:
    """Expose the stored event ticket price as a first-class API field."""
    ticket_price = event.get("price")
    stored_price = _ticket_price(ticket_price, None)
    if stored_price is None or stored_price <= 0:
        ticket_price = (event.get("venue_details") or {}).get("ticket_price")
    try:
        normalized_price = float(ticket_price) if ticket_price is not None else None
    except (TypeError, ValueError):
        normalized_price = None
    return {**event, "ticket_price": normalized_price}


def _ticket_price(price: Any, venue_details: dict[str, Any] | None) -> float | None:
    """Read the new column first, while supporting legacy JSON ticket prices."""
    raw_price = price if price is not None else (venue_details or {}).get("ticket_price")
    try:
        return float(raw_price) if raw_price is not None else None
    except (TypeError, ValueError):
        return None


def _validate_ticket_price(category: str, price: Any, venue_details: dict[str, Any] | None) -> float | None:
    """Require a real ticket price for categories that sell tickets first."""
    if category not in TICKET_FIRST_CATEGORIES:
        return _ticket_price(price, venue_details)
    normalized_price = _ticket_price(price, venue_details)
    if normalized_price is None:
        raise HTTPException(status_code=422, detail="Food and educational events require a ticket price.")
    if normalized_price <= 0:
        raise HTTPException(status_code=422, detail="Food and educational event ticket prices must be greater than zero.")
    return normalized_price


def _get_event_for_update_or_delete(event_id: str) -> tuple[str, dict[str, Any]]:
    """Fetch an approved event first, then a pending submission."""
    event_response = supabase.table("events").select("*").eq("id", event_id).limit(1).execute()
    if event_response.data:
        return "events", event_response.data[0]
    pending_response = supabase.table("pending_events").select("*").eq("id", event_id).limit(1).execute()
    if pending_response.data:
        return "pending_events", pending_response.data[0]
    raise HTTPException(status_code=404, detail="Event not found.")


@router.post("/ai/generate-description", status_code=200, tags=["ai"])
def ai_generate_description(
    payload: dict,
    current_user: dict = Depends(require_roles("student", "business")),
) -> dict:
    """Use AI to generate a polished event description from raw notes.

    Accepts JSON body with: notes (str), category (str), tone (str, optional).
    Uses Google Gemini when GEMINI_API_KEY is set, otherwise falls back to
    a premium local copywriting engine.
    """
    from schemas.ai import AICopywriteRequest
    from utils.ai_services import generate_ai_description

    # Validate input
    try:
        validated = AICopywriteRequest(**payload)
    except Exception as e:
        from fastapi import HTTPException as HE
        raise HE(status_code=422, detail=str(e))

    result = generate_ai_description(
        notes=validated.notes,
        category=validated.category,
        tone=validated.tone,
    )
    return result


@router.post("", response_model=EventOut, status_code=status.HTTP_201_CREATED)
def create_event(
    payload: EventCreate,
    current_user: dict = Depends(require_roles("student", "business")),
) -> dict:
    """Create a new event submission in pending state."""
    validate_event_category(payload.category)
    normalized_price = _validate_ticket_price(payload.category, payload.price, payload.venue_details)
    ensure_plan_active(payload.plan_id)
    if parse_datetime(payload.end_date) <= parse_datetime(payload.start_date):
        raise HTTPException(status_code=400, detail="Event end date must be after start date.")

    event_data = payload.model_dump()
    event_data["price"] = normalized_price
    event_data.update(
        {
            "status": "pending",
            "created_by": current_user["id"],
            "approved_by": None,
            "current_participants": 0,
            "created_at": utc_now_iso(),
            "updated_at": utc_now_iso(),
        }
    )
    response = supabase.table("pending_events").insert(event_data).execute()
    event = response.data[0]
    notify_admins("New Event Submitted", f"New {event['category'].replace('_', ' ')} event submitted: '{event['title']}'.", notification_type="event_submitted", reference_id=event["id"], reference_type="event")
    create_notification(current_user["id"], "Event Submitted", f"Your event '{event['title']}' has been submitted for review.", notification_type="event_submitted", reference_id=event["id"], reference_type="event")
    return _with_ticket_price(event)


@router.get("", response_model=EventListResponse)
def list_events(
    category: str | None = None,
    status_filter: str | None = Query(default=None, alias="status"),
    start_date: str | None = None,
    end_date: str | None = None,
    plan_id: str | None = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
) -> EventListResponse:
    """List public approved events with filters and pagination."""
    query = supabase.table("events").select("*", count="exact")
    if category:
        validate_event_category(category)
        query = query.eq("category", category)
    if status_filter:
        validate_event_status(status_filter)
        query = query.eq("status", status_filter)
    else:
        query = query.eq("status", "approved")
    if start_date:
        query = query.gte("start_date", start_date)
    if end_date:
        # Calendar clients query by the date an event starts.  Filtering on
        # end_date here omitted events that start in the selected month but
        # finish later, so their actual calendar day could disappear.
        query = query.lte("start_date", end_date)
    if plan_id:
        query = query.eq("plan_id", plan_id)

    start = (page - 1) * page_size
    end = start + page_size - 1
    response = query.order("start_date", desc=False).range(start, end).execute()
    items = response.data or []
    return EventListResponse(
        items=[_with_ticket_price(event) for event in items],
        total=response.count or 0,
        page=page,
        page_size=page_size,
    )


@router.get("/job-fairs", response_model=EventListResponse)
def list_job_fairs(page: int = Query(default=1, ge=1), page_size: int = Query(default=10, ge=1, le=100)) -> EventListResponse:
    """Public job-fair catalogue."""
    return list_events(category="job_fair", page=page, page_size=page_size)


@router.get("/food-events", response_model=EventListResponse)
def list_food_events(page: int = Query(default=1, ge=1), page_size: int = Query(default=10, ge=1, le=100)) -> EventListResponse:
    """Public food-event catalogue."""
    return list_events(category="food", page=page, page_size=page_size)


@router.get("/educational-expos", response_model=EventListResponse)
def list_educational_expos(page: int = Query(default=1, ge=1), page_size: int = Query(default=10, ge=1, le=100)) -> EventListResponse:
    """Public educational-expo catalogue."""
    return list_events(category="educational", page=page, page_size=page_size)


@router.get("/categories")
def list_categories() -> list[str]:
    """Public list of event categories used by browsing filters."""
    return ["job_fair", "food", "educational", "expo"]


@router.get("/organizers")
def list_organizers() -> list[dict[str, str]]:
    """Public, minimal organizer directory for event browsing."""
    response = supabase.table("events").select("created_by,venue_details").eq("status", "approved").execute()
    organizers: dict[str, dict[str, str]] = {}
    for event in response.data or []:
        details = event.get("venue_details") or {}
        name = details.get("organizer") or details.get("company") or "VIVENT"
        key = event.get("created_by") or name
        organizers[key] = {"id": str(key), "name": str(name)}
    return list(organizers.values())


# Backwards-compatible public catalogue endpoints.  The frontend uses the
# filtered /events endpoint, while these concise paths are useful to public
# clients and deliberately have no authentication dependency.
@public_router.get("/job-fairs", response_model=EventListResponse)
def public_job_fairs(page: int = Query(default=1, ge=1), page_size: int = Query(default=10, ge=1, le=100)) -> EventListResponse:
    return list_job_fairs(page=page, page_size=page_size)


@public_router.get("/food-events", response_model=EventListResponse)
def public_food_events(page: int = Query(default=1, ge=1), page_size: int = Query(default=10, ge=1, le=100)) -> EventListResponse:
    return list_food_events(page=page, page_size=page_size)


@public_router.get("/educational-expos", response_model=EventListResponse)
def public_educational_expos(page: int = Query(default=1, ge=1), page_size: int = Query(default=10, ge=1, le=100)) -> EventListResponse:
    return list_educational_expos(page=page, page_size=page_size)


@public_router.get("/categories")
def public_categories() -> list[str]:
    return list_categories()


@public_router.get("/organizers")
def public_organizers() -> list[dict[str, str]]:
    return list_organizers()


@router.get("/{event_id}", response_model=EventOut)
def get_event(event_id: str) -> dict:
    """Get public approved event details plus discussion and registration counts."""
    event = get_row_or_404("events", event_id)
    if event.get("status") != "approved":
        raise HTTPException(status_code=404, detail="Event not found.")
    discussions_count = (
        supabase.table("discussions").select("id", count="exact").eq("event_id", event_id).execute().count or 0
    )
    registrations_count = (
        supabase.table("event_registrations")
        .select("id", count="exact")
        .eq("event_id", event_id)
        .execute()
        .count
        or 0
    )
    event["discussion_count"] = discussions_count
    event["registration_count"] = registrations_count
    return _with_ticket_price(event)


@router.patch("/{event_id}", response_model=EventOut)
def update_event(
    event_id: str,
    payload: EventUpdate,
    current_user: dict = Depends(get_current_user),
) -> dict:
    """Update an approved event or a creator-owned pending submission."""
    table_name, event = _get_event_for_update_or_delete(event_id)
    ensure_event_access(current_user, event)
    update_data = payload.model_dump(exclude_unset=True)
    if "category" in update_data:
        validate_event_category(update_data["category"])
    if "status" in update_data:
        validate_event_status(update_data["status"])
        if table_name == "pending_events":
            raise HTTPException(status_code=400, detail="Pending events must be approved through admin moderation.")
        if current_user.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Only admins can change event status.")
    new_category = update_data.get("category", event["category"])
    if new_category in TICKET_FIRST_CATEGORIES and ("price" in update_data or "venue_details" in update_data or new_category != event["category"]):
        update_data["price"] = _validate_ticket_price(
            new_category,
            update_data.get("price", event.get("price")),
            update_data.get("venue_details", event.get("venue_details")),
        )
    if "plan_id" in update_data:
        ensure_plan_active(update_data["plan_id"])
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields provided for update.")
    if "start_date" in update_data or "end_date" in update_data:
        new_start = update_data.get("start_date", event["start_date"])
        new_end = update_data.get("end_date", event["end_date"])
        if parse_datetime(new_end) <= parse_datetime(new_start):
            raise HTTPException(status_code=400, detail="Event end date must be after start date.")
    update_data["updated_at"] = utc_now_iso()
    response = supabase.table(table_name).update(update_data).eq("id", event_id).execute()
    updated = response.data[0]
    if table_name == "events":
        changed_date = "start_date" in update_data or "end_date" in update_data
        changed_location = "location" in update_data or "venue_details" in update_data
        if changed_date:
            title, message, kind = "Event Rescheduled", f"'{event['title']}' has been rescheduled.", "event_date_changed"
        elif changed_location:
            title, message, kind = "Event Location Updated", f"The location for '{event['title']}' has changed.", "event_location_changed"
        else:
            title, message, kind = "Event Updated", f"'{event['title']}' has been updated.", "event_updated"
        registrations = supabase.table("event_registrations").select("user_id").eq("event_id", event_id).execute()
        for registration in registrations.data or []:
            create_notification(registration["user_id"], title, message, notification_type=kind, reference_id=event_id, reference_type="event")
    return _with_ticket_price(updated)


@router.delete("/{event_id}", response_model=MessageResponse)
def delete_event(event_id: str, current_user: dict = Depends(get_current_user)) -> MessageResponse:
    """Delete an approved event or a creator-owned pending submission."""
    table_name, event = _get_event_for_update_or_delete(event_id)
    ensure_event_access(current_user, event)
    registrations = []
    if table_name == "events":
        registrations = supabase.table("event_registrations").select("user_id").eq("event_id", event_id).execute().data or []
    supabase.table(table_name).delete().eq("id", event_id).execute()
    if table_name == "events":
        for registration in registrations:
            create_notification(registration["user_id"], "Event Cancelled", f"'{event['title']}' has been cancelled.", notification_type="event_cancelled", reference_id=event_id, reference_type="event")
    if current_user.get("role") == "admin":
        notify_admins("Event Deleted", f"Event '{event['title']}' was deleted.", notification_type="event_deleted", reference_id=event_id, reference_type="event")
    return MessageResponse(detail="Event deleted successfully.")
