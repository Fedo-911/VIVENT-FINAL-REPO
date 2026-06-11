"""Analytics routes."""

from __future__ import annotations

from datetime import datetime, timezone
from collections import Counter, defaultdict
from decimal import Decimal
from fastapi import APIRouter, Depends

from dependencies import get_current_user, require_roles
from schemas import AdminDashboardResponse, BusinessDashboardResponse, StudentDashboardResponse
from supabase_client import supabase
from utils.cache_worker import (
    compute_live_admin_metrics,
    compute_and_cache_admin_metrics,
    METRIC_NAME_ADMIN,
)

router = APIRouter(prefix="/analytics", tags=["analytics"])


def _to_date(value: str) -> datetime:
    val = value.replace("Z", "+00:00")
    if "." in val:
        base, fraction_offset = val.split(".", 1)
        tz_char = "+" if "+" in fraction_offset else "-"
        fraction, offset = fraction_offset.split(tz_char, 1)
        fraction = fraction.ljust(6, "0")[:6]
        val = f"{base}.{fraction}{tz_char}{offset}"
    return datetime.fromisoformat(val)


import copy


def _slice_chart_data(metrics: dict | None, days: int) -> dict | None:
    """Slice the chart_data series to contain only the most recent N days."""
    if not metrics or "chart_data" not in metrics:
        return metrics
    
    # Ensure days is a sensible positive integer
    days = max(1, days)
    
    sliced_metrics = copy.deepcopy(metrics)
    chart_data = sliced_metrics.get("chart_data", {})
    
    for key, series in chart_data.items():
        if isinstance(series, list):
            sliced_metrics["chart_data"][key] = series[-days:]
            
    return sliced_metrics


@router.get("/admin/dashboard", response_model=AdminDashboardResponse)
def admin_dashboard(
    days: int = 7,
    force_refresh: bool = False,
    current_user: dict = Depends(require_roles("admin")),
) -> dict:
    """Return aggregated metrics for the admin dashboard, using the pre-computed analytics cache."""
    _ = current_user
    
    if not force_refresh:
        # Check cache table
        cached_res = supabase.table("analytics_cache").select("value").eq("metric_name", METRIC_NAME_ADMIN).limit(1).execute()
        if cached_res.data:
            return _slice_chart_data(cached_res.data[0]["value"], days)
            
    # Cache miss or force refresh
    metrics = compute_and_cache_admin_metrics()
    if not metrics:
        # Fallback to live computation
        metrics = compute_live_admin_metrics()
    return _slice_chart_data(metrics, days)


@router.post("/admin/dashboard/refresh", response_model=AdminDashboardResponse)
def refresh_admin_dashboard(
    days: int = 7,
    current_user: dict = Depends(require_roles("admin")),
) -> dict:
    """Force re-compute and update the analytics cache for the admin dashboard, returning fresh metrics."""
    _ = current_user
    metrics = compute_and_cache_admin_metrics()
    if not metrics:
        metrics = compute_live_admin_metrics()
    return _slice_chart_data(metrics, days)


@router.get("/student/dashboard", response_model=StudentDashboardResponse)
def student_dashboard(current_user: dict = Depends(require_roles("student"))) -> StudentDashboardResponse:
    """Return student-specific dashboard information."""
    registrations = (
        supabase.table("event_registrations").select("*").eq("user_id", current_user["id"]).execute().data or []
    )
    payments = supabase.table("payments").select("*").eq("user_id", current_user["id"]).execute().data or []
    event_ids = [registration["event_id"] for registration in registrations]
    events = (
        supabase.table("events").select("*").in_("id", event_ids).execute().data if event_ids else []
    ) or []
    pending_payments = [registration for registration in registrations if registration["payment_status"] == "pending"]
    upcoming_events = [event for event in events if _to_date(event["start_date"]) >= datetime.now(timezone.utc)]
    return StudentDashboardResponse(
        my_registered_events=events,
        pending_payments=pending_payments,
        upcoming_events=upcoming_events,
    )


@router.get("/business/dashboard", response_model=BusinessDashboardResponse)
def business_dashboard(current_user: dict = Depends(require_roles("business"))) -> BusinessDashboardResponse:
    """Return business-specific dashboard information."""
    events = (
        supabase.table("events").select("*").eq("created_by", current_user["id"]).order("created_at", desc=True).execute().data
        or []
    )
    event_ids = [event["id"] for event in events]
    registrations = (
        supabase.table("event_registrations").select("*").in_("event_id", event_ids).execute().data if event_ids else []
    ) or []
    payments = (
        supabase.table("payments").select("*").in_("event_id", event_ids).execute().data if event_ids else []
    ) or []

    registration_counter = Counter(reg["event_id"] for reg in registrations)
    revenue_map: dict[str, Decimal] = defaultdict(lambda: Decimal("0"))
    for payment in payments:
        if payment["status"] == "completed":
            revenue_map[payment["event_id"]] += Decimal(str(payment["amount"]))

    registration_count_per_event = [
        {"event_id": event["id"], "title": event["title"], "registration_count": registration_counter.get(event["id"], 0)}
        for event in events
    ]
    revenue_per_event = [
        {"event_id": event["id"], "title": event["title"], "revenue": revenue_map.get(event["id"], Decimal("0"))}
        for event in events
    ]
    return BusinessDashboardResponse(
        my_created_events=events,
        registration_count_per_event=registration_count_per_event,
        revenue_per_event=revenue_per_event,
    )


@router.post("/admin/ai/insights", tags=["ai"])
def ai_admin_insights(
    current_user: dict = Depends(require_roles("admin")),
) -> dict:
    """Generate AI-powered business insights from live platform metrics.

    Uses Google Gemini when GEMINI_API_KEY is set, otherwise falls back to
    a rich local analytical engine producing professional markdown reports.
    """
    _ = current_user

    from utils.ai_services import generate_ai_admin_insights

    # Gather live metrics
    metrics = compute_live_admin_metrics()
    if not metrics:
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail="Could not compute admin metrics for AI analysis.")

    result = generate_ai_admin_insights(metrics)
    return result
