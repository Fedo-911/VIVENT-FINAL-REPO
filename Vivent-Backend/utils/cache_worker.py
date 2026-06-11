"""Background worker service to compute and refresh analytics cache."""

from __future__ import annotations

import asyncio
import logging
import threading
import time
from collections import Counter, defaultdict
from datetime import datetime, timedelta, timezone
from decimal import Decimal

from supabase_client import supabase
from utils.helpers import utc_now_iso

logger = logging.getLogger(__name__)

METRIC_NAME_ADMIN = "admin_dashboard"

def _to_date(value: str) -> datetime:
    val = value.replace("Z", "+00:00")
    if "." in val:
        base, fraction_offset = val.split(".", 1)
        tz_char = "+" if "+" in fraction_offset else "-"
        fraction, offset = fraction_offset.split(tz_char, 1)
        fraction = fraction.ljust(6, "0")[:6]
        val = f"{base}.{fraction}{tz_char}{offset}"
    return datetime.fromisoformat(val)

def compute_live_admin_metrics() -> dict:
    """Query live tables and calculate admin dashboard aggregates."""
    events = supabase.table("events").select("*").execute().data or []
    payments = supabase.table("payments").select("*").execute().data or []
    registrations = supabase.table("event_registrations").select("*").execute().data or []

    status_counts = Counter(event["status"] for event in events)
    category_counts = Counter(event["category"] for event in events)
    total_revenue = sum(Decimal(str(payment["amount"])) for payment in payments if payment["status"] == "completed")

    registration_counter = Counter(reg["event_id"] for reg in registrations)
    participation_per_event = [
        {
            "event_id": event["id"],
            "title": event["title"],
            "registration_count": registration_counter.get(event["id"], 0),
        }
        for event in events
    ]

    today = datetime.now(timezone.utc).date()
    start_day = today - timedelta(days=29)
    event_points: dict[str, int] = defaultdict(int)
    registration_points: dict[str, int] = defaultdict(int)
    revenue_points: dict[str, Decimal] = defaultdict(lambda: Decimal("0"))

    for event in events:
        event_date = _to_date(event["created_at"]).date()
        if event_date >= start_day:
            event_points[event_date.isoformat()] += 1
    for registration in registrations:
        registration_date = _to_date(registration["created_at"]).date()
        if registration_date >= start_day:
            registration_points[registration_date.isoformat()] += 1
    for payment in payments:
        payment_date = _to_date(payment["created_at"]).date()
        if payment_date >= start_day and payment["status"] == "completed":
            revenue_points[payment_date.isoformat()] += Decimal(str(payment["amount"]))

    date_series = [(start_day + timedelta(days=index)).isoformat() for index in range(30)]
    chart_data = {
        "events_created": [{"date": day, "count": event_points.get(day, 0)} for day in date_series],
        "registrations": [{"date": day, "count": registration_points.get(day, 0)} for day in date_series],
        "revenue": [{"date": day, "value": float(revenue_points.get(day, Decimal("0")))} for day in date_series],
    }

    return {
        "total_events_by_status": dict(status_counts),
        "total_events_by_category": dict(category_counts),
        "total_revenue": float(total_revenue),
        "participation_per_event": participation_per_event,
        "chart_data": chart_data,
    }

def compute_and_cache_admin_metrics() -> dict | None:
    """Pre-compute admin metrics and save/update them in the analytics_cache table."""
    try:
        logger.info("Starting background pre-computation of admin metrics...")
        metrics = compute_live_admin_metrics()
        
        # Check if record already exists
        existing = supabase.table("analytics_cache").select("id").eq("metric_name", METRIC_NAME_ADMIN).limit(1).execute()
        
        if existing.data:
            record_id = existing.data[0]["id"]
            supabase.table("analytics_cache").update({
                "value": metrics,
                "updated_at": utc_now_iso()
            }).eq("id", record_id).execute()
            logger.info("Successfully updated existing admin analytics cache record (%s).", record_id)
        else:
            inserted = supabase.table("analytics_cache").insert({
                "metric_name": METRIC_NAME_ADMIN,
                "value": metrics,
                "created_at": utc_now_iso(),
                "updated_at": utc_now_iso()
            }).execute()
            logger.info("Successfully created new admin analytics cache record (%s).", inserted.data[0]["id"])
            
        return metrics
    except Exception as exc:
        logger.error("Failed to compute and cache admin analytics: %s", exc, exc_info=True)
        return None

def _run_background_cache_loop(interval_seconds: int = 600) -> None:
    """Internal loop executor to run in a background thread."""
    # Add a short delay on startup to let server fully initialize
    time.sleep(5)
    while True:
        try:
            compute_and_cache_admin_metrics()
        except Exception as exc:
            logger.error("Background analytics seeder error: %s", exc)
        time.sleep(interval_seconds)

def start_analytics_cache_loop(interval_seconds: int = 600) -> None:
    """Spawn a background thread to refresh the analytics cache periodically."""
    logger.info("Initializing Asynchronous Analytics Caching Worker thread...")
    thread = threading.Thread(
        target=_run_background_cache_loop, 
        args=(interval_seconds,), 
        daemon=True,
        name="ViventAnalyticsCacheWorker"
    )
    thread.start()
