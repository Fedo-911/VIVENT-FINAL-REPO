"""Admin CRM endpoints for paid AI social-media campaign management."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status

from dependencies import require_admin
from routers.campaigns import start_campaign
from schemas.campaigns import SocialAutomationStart
from services.campaign_service import add_log
from supabase_client import supabase
from utils.helpers import get_row_or_404, utc_now_iso

router = APIRouter(prefix="/admin/post-management", tags=["admin-post-management"])

ALLOWED_SORTS = {
    "user_id": "business_id",
    "full_name": "created_at",
    "email": "created_at",
    "business_name": "created_at",
    "organization": "created_at",
    "plan": "created_at",
    "campaign_status": "status",
    "remaining_posts": "remaining_posts",
    "remaining_days": "end_date",
    "last_ai_run": "last_ai_run",
    "created_at": "created_at",
}


def _safe_table(table: str, select: str = "*", **filters: Any) -> list[dict]:
    query = supabase.table(table).select(select)
    for key, value in filters.items():
        if value is not None:
            query = query.eq(key, value)
    try:
        return query.execute().data or []
    except Exception:
        return []


def _as_dt(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None


def _days_left(end_date: str | None) -> int:
    end = _as_dt(end_date)
    if not end:
        return 0
    return max(0, (end - datetime.now(timezone.utc)).days)


def _label_status(campaign: dict) -> str:
    if _days_left(campaign.get("end_date")) == 0 and campaign.get("status") in {"active", "scheduled"}:
        return "expired"
    return campaign.get("status") or "pending"


def _audit(admin_id: str, campaign_id: str, action: str, payload: dict | None = None) -> None:
    try:
        supabase.table("automation_history").insert({
            "campaign_id": campaign_id,
            "event_type": f"admin_{action}",
            "payload": {"admin_id": admin_id, **(payload or {})},
            "created_at": utc_now_iso(),
        }).execute()
    except Exception:
        add_log(campaign_id, f"Admin {action}", details={"admin_id": admin_id, **(payload or {})})


def _first_payment(campaign: dict) -> dict:
    ref = campaign.get("payment_reference")
    rows = _safe_table("payments", "*", transaction_id=ref) if ref else []
    return rows[0] if rows else {}


def _plan_map() -> dict[str, dict]:
    return {row["id"]: row for row in _safe_table("plans", "*")}


def _user_map(user_ids: list[str]) -> dict[str, dict]:
    if not user_ids:
        return {}
    try:
        rows = supabase.table("users").select("id,email,full_name,role,is_active,created_at,updated_at").in_("id", user_ids).execute().data or []
    except Exception:
        rows = []
    return {row["id"]: row for row in rows}


def _platforms(campaign: dict) -> list[dict]:
    campaign_id = campaign["id"]
    rows = _safe_table("campaign_platforms", "id,campaign_id,platform,is_enabled,created_at,updated_at", campaign_id=campaign_id)
    platforms = [
        {
            "platform": row.get("platform"),
            "connected": bool(row.get("is_enabled")),
            "status": "connected" if row.get("is_enabled") else "disconnected",
        }
        for row in rows
    ]
    seen = {platform["platform"] for platform in platforms}
    for platform in (campaign.get("settings") or {}).get("included_platforms", []):
        if platform not in seen:
            platforms.append({"platform": platform, "connected": False, "status": "metadata_required"})
    for account in (campaign.get("business_profile") or {}).get("social_accounts", []):
        platform = account.get("platform")
        existing = next((item for item in platforms if item.get("platform") == platform), None)
        if existing:
            existing["connected"] = account.get("connection_status") == "connected"
            existing["status"] = account.get("connection_status") or existing["status"]
        elif platform:
            platforms.append({
                "platform": platform,
                "connected": account.get("connection_status") == "connected",
                "status": account.get("connection_status") or "metadata_saved",
            })
    return platforms


def _linked_accounts(user_id: str) -> list[dict]:
    linked = _safe_table(
        "linked_social_accounts",
        "id,user_id,platform,username,avatar_url,linked_at,updated_at",
        user_id=user_id,
    )
    credential_rows = _safe_table("platform_credentials", "platform,status,created_at,updated_at", business_id=user_id)
    credential_status = {row.get("platform"): row for row in credential_rows}
    return [
        {
            "id": row.get("id"),
            "platform": row.get("platform"),
            "username": row.get("username"),
            "profile_url": "",
            "connection_status": "connected",
            "account_type": "Business",
            "followers": None,
            "connected_date": row.get("linked_at"),
            "token_status": credential_status.get(row.get("platform"), {}).get("status", "healthy"),
            "last_sync": row.get("updated_at"),
            "last_published_post": None,
            "avatar_url": row.get("avatar_url"),
        }
        for row in linked
    ]


def _setup_social_accounts(campaign: dict) -> list[dict]:
    accounts = (campaign.get("business_profile") or {}).get("social_accounts") or []
    return [
        {
            "id": f"{campaign['id']}-{account.get('platform')}",
            "platform": account.get("platform"),
            "username": account.get("username"),
            "profile_url": account.get("profile_url"),
            "connection_status": account.get("connection_status", "metadata_saved"),
            "account_type": "Business" if account.get("business_account") else "Creator",
            "followers": account.get("followers"),
            "connected_date": account.get("last_connected"),
            "token_status": account.get("token_status", "not_connected"),
            "last_sync": account.get("last_connected"),
            "last_published_post": None,
            "page_name": account.get("page_name"),
            "business_number": account.get("business_number"),
            "display_name": account.get("display_name"),
        }
        for account in accounts
    ]


def _posts(campaign_id: str) -> list[dict]:
    rows = _safe_table("generated_posts", "*", campaign_id=campaign_id)
    return sorted(rows, key=lambda item: item.get("created_at") or "", reverse=True)


def _publishing_history(posts: list[dict]) -> list[dict]:
    post_ids = [post["id"] for post in posts if post.get("id")]
    if not post_ids:
        return []
    try:
        logs = supabase.table("publishing_logs").select("*").in_("post_id", post_ids).order("created_at", desc=True).execute().data or []
    except Exception:
        logs = []
    posts_by_id = {post["id"]: post for post in posts}
    return [
        {
            "id": row.get("id"),
            "platform": row.get("platform"),
            "caption": posts_by_id.get(row.get("post_id"), {}).get("caption", ""),
            "media": posts_by_id.get(row.get("post_id"), {}).get("image_url"),
            "published_time": row.get("published_at"),
            "status": row.get("status"),
            "response": row.get("provider_response"),
            "post_url": posts_by_id.get(row.get("post_id"), {}).get("post_url"),
            "post_id": row.get("post_id"),
        }
        for row in logs
    ]


def _run_history(campaign_id: str) -> list[dict]:
    executions = _safe_table("workflow_executions", "*", campaign_id=campaign_id)
    executions = sorted(executions, key=lambda item: item.get("created_at") or "", reverse=True)
    return [
        {
            "id": item.get("id"),
            "run_time": item.get("started_at") or item.get("created_at"),
            "triggered_by": "AI workflow",
            "duration": item.get("duration_ms"),
            "posts_generated": len((item.get("raw_output") or {}).get("posts", []) or []),
            "images_generated": len([p for p in ((item.get("raw_output") or {}).get("posts", []) or []) if p.get("image_url")]),
            "status": item.get("status"),
            "error_message": item.get("error_message"),
            "logs": item.get("raw_output") or {},
        }
        for item in executions
    ]


def _logs(campaign_id: str) -> list[dict]:
    rows = _safe_table("ai_logs", "*", campaign_id=campaign_id)
    return sorted(rows, key=lambda item: item.get("created_at") or "", reverse=True)


def _notifications(user_id: str, campaign_id: str) -> list[dict]:
    try:
        rows = (
            supabase.table("notifications")
            .select("*")
            .eq("user_id", user_id)
            .eq("reference_id", campaign_id)
            .order("created_at", desc=True)
            .limit(25)
            .execute()
            .data
            or []
        )
    except Exception:
        rows = []
    return rows


def _analytics(posts: list[dict], platforms: list[dict]) -> dict:
    generated = len(posts)
    published = len([post for post in posts if post.get("status") == "published"])
    failed = len([post for post in posts if post.get("status") == "failed"])
    by_platform: dict[str, dict] = {}
    for platform in platforms:
        by_platform.setdefault(platform.get("platform"), {"posts": 0, "published": 0, "failed": 0})
    for post in posts:
        bucket = by_platform.setdefault(post.get("platform"), {"posts": 0, "published": 0, "failed": 0})
        bucket["posts"] += 1
        if post.get("status") == "published":
            bucket["published"] += 1
        if post.get("status") == "failed":
            bucket["failed"] += 1
    return {
        "posts_generated": generated,
        "posts_published": published,
        "failed_posts": failed,
        "reach": 0,
        "impressions": 0,
        "clicks": 0,
        "ctr": 0,
        "engagement": 0,
        "growth": 0,
        "follower_growth": 0,
        "top_performing_platform": max(by_platform.items(), key=lambda item: item[1]["published"], default=("", {}))[0],
        "top_performing_post": next((post for post in posts if post.get("status") == "published"), None),
        "monthly_trend": [],
        "platform_performance": by_platform,
    }


def _campaign_summary(campaign: dict, user: dict, plan: dict) -> dict:
    profile = campaign.get("business_profile") or {}
    settings = campaign.get("settings") or {}
    campaign_posts = _posts(campaign["id"])
    posts_used = max(0, int(campaign.get("total_posts") or 0) - int(campaign.get("remaining_posts") or 0))
    return {
        "id": campaign.get("id"),
        "campaign_id": campaign.get("id"),
        "user_id": campaign.get("business_id"),
        "profile_photo": profile.get("profile_photo") or profile.get("avatar_url"),
        "full_name": user.get("full_name") or "Unknown user",
        "business_name": profile.get("business_name") or profile.get("company_name") or user.get("full_name") or "",
        "organization": profile.get("organization") or profile.get("company_name") or "",
        "campaign_name": profile.get("campaign_name") or f"{plan.get('name', 'Promotion')} Campaign",
        "email": user.get("email") or "",
        "phone": profile.get("phone") or profile.get("phone_number") or "",
        "purchased_plan": plan.get("name") or "Promotion",
        "campaign_status": _label_status(campaign),
        "connected_platforms": _platforms(campaign),
        "remaining_posts": campaign.get("remaining_posts") or 0,
        "remaining_days": _days_left(campaign.get("end_date")),
        "assigned_ai_agent": settings.get("assigned_ai_agent") or settings.get("agent") or "VIVENT AI",
        "last_ai_run": campaign.get("last_ai_run"),
        "created_date": campaign.get("created_at"),
        "approval_mode": "manual" if settings.get("manual_approval", True) else "auto",
        "auto_publish": bool(settings.get("auto_publish")),
        "posts_used": posts_used,
        "failed_posts": len([post for post in campaign_posts if post.get("status") == "failed"]),
        "scheduled_posts": len([post for post in campaign_posts if post.get("status") == "scheduled"]),
    }


def _campaign_detail(campaign: dict) -> dict:
    users = _user_map([campaign["business_id"]])
    plans = _plan_map()
    user = users.get(campaign["business_id"], {})
    plan = plans.get(campaign.get("plan_id"), {})
    profile = campaign.get("business_profile") or {}
    settings = campaign.get("settings") or {}
    posts = _posts(campaign["id"])
    platforms = _platforms(campaign)
    payment = _first_payment(campaign)
    return {
        "user": {
            "profile_picture": profile.get("profile_photo") or profile.get("avatar_url"),
            "user_id": campaign.get("business_id"),
            "full_name": user.get("full_name"),
            "email": user.get("email"),
            "phone": profile.get("phone") or profile.get("phone_number"),
            "business_name": profile.get("business_name") or profile.get("company_name"),
            "organization": profile.get("organization") or profile.get("company_name"),
            "role": user.get("role"),
            "country": profile.get("country"),
            "registration_date": user.get("created_at"),
            "last_login": profile.get("last_login"),
            "account_status": "active" if user.get("is_active", True) else "inactive",
            "subscription_status": "active" if _days_left(campaign.get("end_date")) > 0 else "expired",
        },
        "plan": {
            "plan_name": plan.get("name"),
            "purchase_date": payment.get("created_at") or campaign.get("start_date"),
            "expiration_date": campaign.get("end_date"),
            "price": float(plan.get("price") or payment.get("amount") or 0),
            "remaining_posts": campaign.get("remaining_posts"),
            "posts_used": max(0, int(campaign.get("total_posts") or 0) - int(campaign.get("remaining_posts") or 0)),
            "remaining_days": _days_left(campaign.get("end_date")),
            "campaign_type": settings.get("campaign_type") or plan.get("name") or "Promotion",
            "campaign_frequency": settings.get("posting_frequency") or "weekly",
            "approval_mode": "Manual Approval" if settings.get("manual_approval", True) else "Auto Publish",
        },
        "campaign": {
            "id": campaign.get("id"),
            "campaign_name": profile.get("campaign_name") or f"{plan.get('name', 'Promotion')} Campaign",
            "goal": profile.get("promotion_goal") or profile.get("goal"),
            "target_audience": profile.get("target_audience"),
            "brand_voice": profile.get("brand_voice") or settings.get("brand_voice"),
            "language": settings.get("language") or "English",
            "posting_frequency": settings.get("posting_frequency") or "weekly",
            "posting_time": settings.get("posting_time"),
            "hashtags": settings.get("hashtags") or [],
            "approval_workflow": "Manual Approval" if settings.get("manual_approval", True) else "Auto Publish",
            "image_generation_enabled": bool(settings.get("generate_images", True)),
            "auto_publish_enabled": bool(settings.get("auto_publish")),
            "status": _label_status(campaign),
            "next_scheduled_post": campaign.get("next_scheduled_post"),
        },
        "social_accounts": _setup_social_accounts(campaign) or _linked_accounts(campaign["business_id"]),
        "platforms": platforms,
        "posting_preferences": settings.get("posting_preferences") or {},
        "content_preferences": settings.get("content_preferences") or {},
        "brand_assets": profile.get("brand_assets") or [],
        "ai_run_history": _run_history(campaign["id"]),
        "generated_posts": posts,
        "publishing_history": _publishing_history(posts),
        "analytics": _analytics(posts, platforms),
        "notifications": _notifications(campaign["business_id"], campaign["id"]),
        "logs": _logs(campaign["id"]),
        "campaign_timeline": _logs(campaign["id"]),
        "payment_information": payment,
        "subscription_information": (supabase.table("user_subscriptions").select("*").eq("user_id", campaign["business_id"]).eq("status", "active").limit(1).execute().data or [{}])[0],
    }


@router.get("/users")
def list_post_management_users(
    current_user: dict = Depends(require_admin),
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    q: str = "",
    filter: str = "all",
    sort_by: str = "created_at",
    sort_dir: str = "desc",
) -> dict:
    query = supabase.table("campaigns").select("*")
    sort_column = ALLOWED_SORTS.get(sort_by, "created_at")
    query = query.order(sort_column, desc=sort_dir != "asc")
    campaigns = query.execute().data or []
    users = _user_map(list({row["business_id"] for row in campaigns if row.get("business_id")}))
    plans = _plan_map()
    rows = [_campaign_summary(campaign, users.get(campaign.get("business_id"), {}), plans.get(campaign.get("plan_id"), {})) for campaign in campaigns]
    needle = q.strip().lower()
    if needle:
        rows = [
            row for row in rows
            if any(needle in str(row.get(key, "")).lower() for key in ["user_id", "full_name", "email", "organization", "business_name", "campaign_name", "purchased_plan"])
        ]
    if filter != "all":
        normalized = filter.replace("-", "_")
        rows = [
            row for row in rows
            if normalized in {
                str(row.get("purchased_plan", "")).lower(),
                str(row.get("campaign_status", "")).lower(),
                f"{str(row.get('purchased_plan', '')).lower()}_plan",
                "connected_accounts" if any(p.get("connected") for p in row.get("connected_platforms", [])) else "disconnected_accounts",
                "manual_approval" if row.get("approval_mode") == "manual" else "auto_publish",
                "failed_posts" if row.get("failed_posts") else "",
                "scheduled_posts" if row.get("scheduled_posts") else "",
            }
        ]
    total = len(rows)
    start = (page - 1) * page_size
    return {"items": rows[start:start + page_size], "total": total, "page": page, "page_size": page_size}


@router.get("/user/{user_id}")
def user_detail(user_id: str, current_user: dict = Depends(require_admin)) -> dict:
    campaign = supabase.table("campaigns").select("*").eq("business_id", user_id).order("created_at", desc=True).limit(1).execute().data
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign user not found.")
    return _campaign_detail(campaign[0])


@router.get("/user/{user_id}/campaign")
def user_campaign(user_id: str, current_user: dict = Depends(require_admin)) -> dict:
    return user_detail(user_id, current_user)["campaign"]


@router.get("/user/{user_id}/social-accounts")
def user_social_accounts(user_id: str, current_user: dict = Depends(require_admin)) -> list[dict]:
    _ = current_user
    return _linked_accounts(user_id)


@router.get("/user/{user_id}/analytics")
def user_analytics(user_id: str, current_user: dict = Depends(require_admin)) -> dict:
    detail = user_detail(user_id, current_user)
    return detail["analytics"]


@router.get("/user/{user_id}/posts")
def user_posts(user_id: str, current_user: dict = Depends(require_admin)) -> list[dict]:
    detail = user_detail(user_id, current_user)
    return detail["generated_posts"]


@router.get("/user/{user_id}/history")
def user_history(user_id: str, current_user: dict = Depends(require_admin)) -> dict:
    detail = user_detail(user_id, current_user)
    return {"ai_run_history": detail["ai_run_history"], "publishing_history": detail["publishing_history"], "logs": detail["logs"]}


def _latest_campaign(user_id: str) -> dict:
    rows = supabase.table("campaigns").select("*").eq("business_id", user_id).order("created_at", desc=True).limit(1).execute().data or []
    if not rows:
        raise HTTPException(status_code=404, detail="Campaign user not found.")
    return rows[0]


@router.post("/user/{user_id}/run-ai", status_code=status.HTTP_202_ACCEPTED)
def run_ai(user_id: str, current_user: dict = Depends(require_admin)) -> dict:
    campaign = _latest_campaign(user_id)
    _audit(current_user["id"], campaign["id"], "run_ai")
    return start_campaign(SocialAutomationStart(campaign_id=campaign["id"]), current_user)


@router.post("/user/{user_id}/pause")
def pause_campaign(user_id: str, current_user: dict = Depends(require_admin)) -> dict:
    campaign = _latest_campaign(user_id)
    updated = supabase.table("campaigns").update({"status": "paused", "updated_at": utc_now_iso()}).eq("id", campaign["id"]).execute().data[0]
    _audit(current_user["id"], campaign["id"], "pause")
    add_log(campaign["id"], "Campaign paused", details={"admin_id": current_user["id"]})
    return updated


@router.post("/user/{user_id}/resume")
def resume_campaign(user_id: str, current_user: dict = Depends(require_admin)) -> dict:
    campaign = _latest_campaign(user_id)
    updated = supabase.table("campaigns").update({"status": "active", "updated_at": utc_now_iso()}).eq("id", campaign["id"]).execute().data[0]
    _audit(current_user["id"], campaign["id"], "resume")
    add_log(campaign["id"], "Campaign resumed", details={"admin_id": current_user["id"]})
    return updated


@router.post("/user/{user_id}/generate-content", status_code=status.HTTP_202_ACCEPTED)
def generate_content(user_id: str, current_user: dict = Depends(require_admin)) -> dict:
    return run_ai(user_id, current_user)


@router.post("/user/{user_id}/publish")
def publish_approved(user_id: str, current_user: dict = Depends(require_admin)) -> dict:
    campaign = _latest_campaign(user_id)
    posts = _posts(campaign["id"])
    approved = [post for post in posts if post.get("status") == "approved"]
    for post in approved:
        supabase.table("generated_posts").update({"status": "publishing", "updated_at": utc_now_iso()}).eq("id", post["id"]).execute()
    _audit(current_user["id"], campaign["id"], "publish_approved", {"post_count": len(approved)})
    add_log(campaign["id"], "Approved posts queued for publishing", details={"count": len(approved), "admin_id": current_user["id"]})
    return {"queued": len(approved)}


@router.delete("/user/{user_id}/campaign")
def delete_campaign(user_id: str, current_user: dict = Depends(require_admin)) -> dict:
    campaign = _latest_campaign(user_id)
    _audit(current_user["id"], campaign["id"], "delete")
    supabase.table("campaigns").delete().eq("id", campaign["id"]).execute()
    return {"detail": "Campaign deleted."}
