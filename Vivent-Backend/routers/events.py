"""Event routes."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status

from dependencies import get_current_user, require_roles
from schemas import EventCreate, EventListResponse, EventOut, EventUpdate, MessageResponse
from supabase_client import supabase
from utils.helpers import (
    ensure_event_access,
    ensure_plan_active,
    get_row_or_404,
    parse_datetime,
    utc_now_iso,
    validate_event_category,
    validate_event_status,
)

router = APIRouter(prefix="/events", tags=["events"])


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
    """Create a new event in pending state."""
    validate_event_category(payload.category)
    ensure_plan_active(payload.plan_id)
    if parse_datetime(payload.end_date) <= parse_datetime(payload.start_date):
        raise HTTPException(status_code=400, detail="Event end date must be after start date.")

    event_data = payload.model_dump()
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
    response = supabase.table("events").insert(event_data).execute()
    return response.data[0]


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
    """List events with filters and pagination."""
    query = supabase.table("events").select("*", count="exact")
    if category:
        validate_event_category(category)
        query = query.eq("category", category)
    if status_filter:
        validate_event_status(status_filter)
        query = query.eq("status", status_filter)
    if start_date:
        query = query.gte("start_date", start_date)
    if end_date:
        query = query.lte("end_date", end_date)
    if plan_id:
        query = query.eq("plan_id", plan_id)

    start = (page - 1) * page_size
    end = start + page_size - 1
    response = query.order("start_date", desc=False).range(start, end).execute()
    items = response.data or []
    return EventListResponse(items=items, total=response.count or 0, page=page, page_size=page_size)


@router.get("/{event_id}", response_model=EventOut)
def get_event(event_id: str) -> dict:
    """Get event details plus discussion and registration counts."""
    event = get_row_or_404("events", event_id)
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
    return event


@router.patch("/{event_id}", response_model=EventOut)
def update_event(
    event_id: str,
    payload: EventUpdate,
    current_user: dict = Depends(get_current_user),
) -> dict:
    """Update an event for creator or admin."""
    event = get_row_or_404("events", event_id)
    ensure_event_access(current_user, event)
    update_data = payload.model_dump(exclude_unset=True)
    if "category" in update_data:
        validate_event_category(update_data["category"])
    if "status" in update_data:
        validate_event_status(update_data["status"])
        if current_user.get("role") != "admin" and update_data["status"] in {"approved", "rejected"}:
            raise HTTPException(status_code=403, detail="Only admins can approve or reject events.")
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
    response = supabase.table("events").update(update_data).eq("id", event_id).execute()
    return response.data[0]


@router.delete("/{event_id}", response_model=MessageResponse)
def delete_event(event_id: str, current_user: dict = Depends(get_current_user)) -> MessageResponse:
    """Delete an event for creator or admin."""
    event = get_row_or_404("events", event_id)
    ensure_event_access(current_user, event)
    supabase.table("events").delete().eq("id", event_id).execute()
    return MessageResponse(detail="Event deleted successfully.")
