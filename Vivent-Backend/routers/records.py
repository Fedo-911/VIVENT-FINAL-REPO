"""Record management routes."""

from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends

from dependencies import get_current_user
from schemas import FinancialRecordResponse, MyEventsResponse
from supabase_client import supabase

router = APIRouter(prefix="/records", tags=["records"])


def _is_past(event: dict) -> bool:
    return datetime.fromisoformat(event["end_date"].replace("Z", "+00:00")) < datetime.now(timezone.utc)


@router.get("/my-events", response_model=MyEventsResponse)
def my_events(current_user: dict = Depends(get_current_user)) -> MyEventsResponse:
    """Return current and past events for the current user."""
    if current_user["role"] == "admin":
        events = supabase.table("events").select("*").order("start_date", desc=False).execute().data or []
    elif current_user["role"] == "business":
        events = (
            supabase.table("events").select("*").eq("created_by", current_user["id"]).order("start_date", desc=False).execute().data
            or []
        )
    else:
        registrations = (
            supabase.table("event_registrations").select("event_id").eq("user_id", current_user["id"]).execute().data or []
        )
        event_ids = [item["event_id"] for item in registrations]
        events = supabase.table("events").select("*").in_("id", event_ids).order("start_date", desc=False).execute().data if event_ids else []
        events = events or []

    current_events = [event for event in events if not _is_past(event)]
    past_events = [event for event in events if _is_past(event)]
    return MyEventsResponse(current_events=current_events, past_events=past_events)


@router.get("/financial", response_model=FinancialRecordResponse)
def financial_records(current_user: dict = Depends(get_current_user)) -> FinancialRecordResponse:
    """Return payment history for the current user or all payments for admin."""
    query = supabase.table("payments").select("*").order("created_at", desc=True)
    if current_user["role"] != "admin":
        query = query.eq("user_id", current_user["id"])
    payments = query.execute().data or []
    return FinancialRecordResponse(payments=payments)
