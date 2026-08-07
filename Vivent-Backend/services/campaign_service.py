"""Campaign persistence and payload composition for paid promotions."""

from __future__ import annotations

from datetime import timedelta

from supabase_client import supabase
from utils.helpers import create_notification, notify_admins, utc_now_iso

PLAN_DEFAULTS = {
    "Basic": {"platforms": ["instagram", "facebook"], "posts": 8, "duration_days": 30},
    "Standard": {"platforms": ["instagram", "facebook", "tiktok"], "posts": 15, "duration_days": 30},
    "Premium": {"platforms": ["instagram", "facebook", "linkedin", "tiktok"], "posts": 24, "duration_days": 30},
}


def plan_entitlements(plan: dict) -> dict:
    defaults = PLAN_DEFAULTS.get(plan.get("name"), PLAN_DEFAULTS["Basic"]).copy()
    facilities = plan.get("facilities") or {}
    included = facilities.get("social_media_ads") or defaults["platforms"]
    allowed = [p.lower() for p in included if p.lower() in {"instagram", "facebook", "linkedin", "tiktok"}]
    return {**defaults, "platforms": allowed or defaults["platforms"]}


def add_log(campaign_id: str, action: str, status: str = "info", details: dict | None = None) -> None:
    supabase.table("ai_logs").insert({
        "campaign_id": campaign_id, "action": action, "status": status,
        "details": details or {}, "created_at": utc_now_iso(),
    }).execute()


def create_campaign_after_payment(user_id: str, plan: dict, payment_reference: str) -> dict:
    existing = supabase.table("campaigns").select("*").eq("payment_reference", payment_reference).limit(1).execute()
    if existing.data:
        return existing.data[0]
    entitlements = plan_entitlements(plan)
    now = utc_now_iso()
    from datetime import datetime, timezone
    start = datetime.now(timezone.utc)
    end = start + timedelta(days=entitlements["duration_days"])
    campaign = supabase.table("campaigns").insert({
        "business_id": user_id, "plan_id": plan["id"], "payment_reference": payment_reference,
        "status": "active", "start_date": start.isoformat(), "end_date": end.isoformat(),
        "total_posts": entitlements["posts"], "remaining_posts": entitlements["posts"],
        "settings": {"generate_images": True, "generate_videos": False, "auto_publish": False,
                     "manual_approval": True, "posting_frequency": "weekly", "language": "English", "creativity_level": "balanced",
                     "setup_completed": False},
        "created_at": now, "updated_at": now,
    }).execute().data[0]
    supabase.table("campaign_platforms").insert([
        {"campaign_id": campaign["id"], "platform": platform, "is_enabled": True, "created_at": now, "updated_at": now}
        for platform in entitlements["platforms"]
    ]).execute()
    add_log(campaign["id"], "Payment received")
    add_log(campaign["id"], "Campaign activated")
    create_notification(
        user_id,
        "Campaign Started",
        f"Your {plan['name']} promotion campaign is active.",
        notification_type="campaign_started",
        reference_id=campaign["id"],
        reference_type="campaign",
    )
    notify_admins(
        "Payment Received",
        f"A paid {plan['name']} promotion campaign was activated.",
        notification_type="payment_completed",
        reference_id=campaign["id"],
        reference_type="campaign",
    )
    return campaign


def workflow_payload(campaign: dict, plan: dict, business: dict) -> dict:
    event = supabase.table("events").select("title,description,category").eq("created_by", campaign["business_id"]).order("start_date", desc=False).limit(1).execute()
    current_event = event.data[0] if event.data else {}
    platforms = supabase.table("campaign_platforms").select("platform").eq("campaign_id", campaign["id"]).eq("is_enabled", True).execute()
    return {
        "business_id": campaign["business_id"], "plan_id": plan["id"], "campaign_id": campaign["id"],
        "company_name": business.get("full_name", "VIVENT Business"), "business_type": current_event.get("category", "events"),
        "description": current_event.get("description", ""), "website": (campaign.get("business_profile") or {}).get("website", ""),
        "target_audience": (campaign.get("business_profile") or {}).get("target_audience", ""),
        "brand_voice": (campaign.get("business_profile") or {}).get("brand_voice", "professional"),
        "promotion_goal": (campaign.get("business_profile") or {}).get("promotion_goal", "event awareness"),
        "campaign_type": plan.get("name", "promotion"), "current_event": current_event,
        "platforms": [row["platform"] for row in platforms.data or []], "settings": campaign.get("settings") or {},
    }
