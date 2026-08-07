"""Promotion campaign setup wizard endpoints for paid social plans."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status

from dependencies import get_current_user
from services.campaign_service import add_log, plan_entitlements
from supabase_client import supabase
from utils.helpers import get_row_or_404, utc_now_iso

router = APIRouter(prefix="/campaign", tags=["campaign-setup"])

SUPPORTED_PLATFORMS = {"facebook", "instagram", "linkedin", "tiktok"}


def _can_access(user_id: str, current_user: dict) -> None:
    if current_user.get("role") == "admin" or current_user.get("id") == user_id:
        return
    raise HTTPException(status_code=403, detail="You cannot access this campaign setup.")


def _latest_campaign_for_user(user_id: str) -> dict:
    rows = (
        supabase.table("campaigns")
        .select("*")
        .eq("business_id", user_id)
        .order("created_at", desc=True)
        .limit(1)
        .execute()
        .data
        or []
    )
    if not rows:
        raise HTTPException(status_code=404, detail="No paid promotion campaign found for this user.")
    return rows[0]


def _plan_for_campaign(campaign: dict) -> dict:
    return get_row_or_404("plans", campaign["plan_id"])


def _included_platforms(plan: dict) -> list[str]:
    plan_name = plan.get("name", "Basic")
    defaults = {
        "Basic": ["facebook", "instagram"],
        "Standard": ["facebook", "instagram", "tiktok"],
        "Premium": ["facebook", "instagram", "linkedin", "tiktok"],
    }
    entitlements = plan_entitlements(plan)
    raw = entitlements.get("platforms") or defaults.get(plan_name, defaults["Basic"])
    if plan_name == "Premium":
        raw = defaults["Premium"]
    if plan_name == "Standard":
        raw = defaults["Standard"]
    if plan_name == "Basic":
        raw = defaults["Basic"]
    return [platform for platform in raw if platform in SUPPORTED_PLATFORMS]


def _safe_social_accounts(campaign: dict) -> list[dict]:
    profile = campaign.get("business_profile") or {}
    accounts = profile.get("social_accounts") or []
    safe_accounts = []
    for account in accounts:
        safe_accounts.append({
            "platform": account.get("platform"),
            "username": account.get("username"),
            "profile_url": account.get("profile_url"),
            "page_name": account.get("page_name"),
            "business_account": bool(account.get("business_account")),
            "connection_status": account.get("connection_status", "disconnected"),
            "last_connected": account.get("last_connected"),
            "token_status": account.get("token_status", "not_connected"),
            "followers": account.get("followers"),
            "business_number": account.get("business_number"),
            "display_name": account.get("display_name"),
        })
    return safe_accounts


def _persist_setup_tables(campaign: dict, user_id: str, payload: dict, safe_accounts: list[dict]) -> None:
    now = utc_now_iso()
    try:
        supabase.table("campaign_preferences").upsert({
            "campaign_id": campaign["id"],
            "user_id": user_id,
            "campaign_information": payload.get("campaign_information") or {},
            "content_preferences": payload.get("content_preferences") or {},
            "updated_at": now,
        }, on_conflict="campaign_id").execute()
    except Exception:
        pass
    try:
        supabase.table("posting_preferences").upsert({
            "campaign_id": campaign["id"],
            "user_id": user_id,
            "preferences": payload.get("posting_preferences") or {},
            "updated_at": now,
        }, on_conflict="campaign_id").execute()
    except Exception:
        pass
    try:
        supabase.table("social_accounts").delete().eq("campaign_id", campaign["id"]).execute()
        if safe_accounts:
            supabase.table("social_accounts").insert([
                {
                    "campaign_id": campaign["id"],
                    "user_id": user_id,
                    "platform": account.get("platform"),
                    "username": account.get("username"),
                    "profile_url": account.get("profile_url"),
                    "page_name": account.get("page_name"),
                    "business_account": bool(account.get("business_account")),
                    "connection_status": account.get("connection_status", "metadata_saved"),
                    "token_status": account.get("token_status", "not_connected"),
                    "followers": account.get("followers"),
                    "metadata": {
                        "business_number": account.get("business_number"),
                        "display_name": account.get("display_name"),
                    },
                    "last_connected": account.get("last_connected"),
                    "created_at": now,
                    "updated_at": now,
                }
                for account in safe_accounts
            ]).execute()
    except Exception:
        pass
    try:
        supabase.table("brand_assets").delete().eq("campaign_id", campaign["id"]).execute()
        assets = payload.get("brand_assets") or []
        if assets:
            supabase.table("brand_assets").insert([
                {
                    "campaign_id": campaign["id"],
                    "user_id": user_id,
                    "asset_type": asset.get("asset_type") or "brand_asset",
                    "file_name": asset.get("file_name") or "Uploaded asset",
                    "file_url": asset.get("file_url"),
                    "mime_type": asset.get("mime_type"),
                    "size_bytes": asset.get("size_bytes"),
                    "metadata": asset.get("metadata") or {},
                    "created_at": now,
                    "updated_at": now,
                }
                for asset in assets
                if asset.get("file_name")
            ]).execute()
    except Exception:
        pass
    try:
        supabase.table("campaign_logs").insert({
            "campaign_id": campaign["id"],
            "user_id": user_id,
            "event_type": "setup_completed",
            "payload": {"platforms": [account.get("platform") for account in safe_accounts]},
            "created_at": now,
        }).execute()
    except Exception:
        pass


def _setup_payload(campaign: dict, user: dict | None = None) -> dict:
    plan = _plan_for_campaign(campaign)
    profile = campaign.get("business_profile") or {}
    settings = campaign.get("settings") or {}
    posting = settings.get("posting_preferences") or {}
    content = settings.get("content_preferences") or {}
    return {
        "campaign_id": campaign["id"],
        "user_id": campaign["business_id"],
        "user": user or {},
        "plan": {
            "id": plan.get("id"),
            "name": plan.get("name"),
            "price": float(plan.get("price") or 0),
            "included_platforms": _included_platforms(plan),
            "facilities": plan.get("facilities") or {},
        },
        "campaign_information": profile.get("campaign_information") or {},
        "social_accounts": _safe_social_accounts(campaign),
        "posting_preferences": posting,
        "content_preferences": content,
        "brand_assets": profile.get("brand_assets") or [],
        "setup_completed": bool(settings.get("setup_completed")),
        "status": campaign.get("status"),
        "created_at": campaign.get("created_at"),
        "updated_at": campaign.get("updated_at"),
    }


def _validate_setup(payload: dict, included: list[str]) -> None:
    info = payload.get("campaign_information") or {}
    required_info = [
        "campaign_name", "business_event_name", "campaign_goal", "event_type",
        "short_description", "long_description", "target_audience", "country",
        "city", "language", "brand_voice", "contact_email", "contact_phone",
    ]
    missing = [field for field in required_info if not str(info.get(field) or "").strip()]
    accounts = payload.get("social_accounts") or []
    by_platform = {account.get("platform"): account for account in accounts}
    for platform in included:
        account = by_platform.get(platform) or {}
        if platform == "whatsapp":
            fields = ["business_number", "display_name"]
        elif platform == "facebook":
            fields = ["page_name", "profile_url"]
        elif platform == "linkedin":
            fields = ["page_name", "profile_url"]
        
        else:
            fields = ["username", "profile_url"]
        missing.extend([f"{platform}.{field}" for field in fields if not str(account.get(field) or "").strip()])
    posting = payload.get("posting_preferences") or {}
    for field in ["posting_frequency", "preferred_posting_time", "timezone", "content_language", "hashtag_style", "maximum_posts_per_week"]:
        if not str(posting.get(field) or "").strip():
            missing.append(field)
    if missing:
        raise HTTPException(status_code=422, detail=f"Missing required campaign setup fields: {', '.join(missing)}")


def _upsert_setup(user_id: str, payload: dict, current_user: dict) -> dict:
    _can_access(user_id, current_user)
    campaign = _latest_campaign_for_user(user_id)
    plan = _plan_for_campaign(campaign)
    included = _included_platforms(plan)
    _validate_setup(payload, included)

    now = utc_now_iso()
    profile = campaign.get("business_profile") or {}
    settings = campaign.get("settings") or {}
    safe_accounts = [
        {
            **account,
            "platform": str(account.get("platform", "")).lower(),
            "connection_status": account.get("connection_status") or "metadata_saved",
            "token_status": account.get("token_status") or "not_connected",
            "last_connected": account.get("last_connected") or now if account.get("connection_status") == "connected" else account.get("last_connected"),
        }
        for account in payload.get("social_accounts", [])
        if str(account.get("platform", "")).lower() in included or str(account.get("platform", "")).lower() == "whatsapp"
    ]
    updated_profile = {
        **profile,
        "campaign_information": payload.get("campaign_information") or {},
        "campaign_name": (payload.get("campaign_information") or {}).get("campaign_name"),
        "business_name": (payload.get("campaign_information") or {}).get("business_event_name"),
        "organization": (payload.get("campaign_information") or {}).get("organization", ""),
        "phone": (payload.get("campaign_information") or {}).get("contact_phone"),
        "country": (payload.get("campaign_information") or {}).get("country"),
        "city": (payload.get("campaign_information") or {}).get("city"),
        "website": (payload.get("campaign_information") or {}).get("website_url"),
        "target_audience": (payload.get("campaign_information") or {}).get("target_audience"),
        "brand_voice": (payload.get("campaign_information") or {}).get("brand_voice"),
        "promotion_goal": (payload.get("campaign_information") or {}).get("campaign_goal"),
        "social_accounts": safe_accounts,
        "brand_assets": payload.get("brand_assets") or [],
    }
    updated_settings = {
        **settings,
        "setup_completed": True,
        "included_platforms": included,
        "posting_preferences": payload.get("posting_preferences") or {},
        "content_preferences": payload.get("content_preferences") or {},
        "posting_frequency": (payload.get("posting_preferences") or {}).get("posting_frequency", settings.get("posting_frequency", "weekly")),
        "posting_time": (payload.get("posting_preferences") or {}).get("preferred_posting_time"),
        "language": (payload.get("posting_preferences") or {}).get("content_language") or (payload.get("campaign_information") or {}).get("language"),
        "manual_approval": bool((payload.get("posting_preferences") or {}).get("manual_approval", True)),
        "auto_publish": bool((payload.get("posting_preferences") or {}).get("auto_publish", False)),
        "generate_images": bool((payload.get("posting_preferences") or {}).get("generate_ai_images", True)),
        "generate_videos": bool((payload.get("posting_preferences") or {}).get("generate_videos", False)),
    }
    updated = (
        supabase.table("campaigns")
        .update({"business_profile": updated_profile, "settings": updated_settings, "status": "active", "updated_at": now})
        .eq("id", campaign["id"])
        .execute()
        .data[0]
    )
    _persist_setup_tables(campaign, campaign["business_id"], payload, safe_accounts)
    add_log(campaign["id"], "Campaign setup completed", details={"user_id": current_user["id"], "included_platforms": included})
    return _setup_payload(updated, current_user)


@router.post("/setup", status_code=status.HTTP_201_CREATED)
def create_campaign_setup(payload: dict, current_user: dict = Depends(get_current_user)) -> dict:
    return _upsert_setup(current_user["id"], payload, current_user)


@router.get("/setup/{user_id}")
def get_campaign_setup(user_id: str, current_user: dict = Depends(get_current_user)) -> dict:
    _can_access(user_id, current_user)
    campaign = _latest_campaign_for_user(user_id)
    user = get_row_or_404("users", user_id) if current_user.get("role") == "admin" else current_user
    return _setup_payload(campaign, user)


@router.put("/setup/{user_id}")
def update_campaign_setup(user_id: str, payload: dict, current_user: dict = Depends(get_current_user)) -> dict:
    return _upsert_setup(user_id, payload, current_user)


@router.get("/social-accounts/{user_id}")
def get_campaign_social_accounts(user_id: str, current_user: dict = Depends(get_current_user)) -> list[dict]:
    _can_access(user_id, current_user)
    return _safe_social_accounts(_latest_campaign_for_user(user_id))


@router.post("/connect-platform")
def connect_platform(payload: dict, current_user: dict = Depends(get_current_user)) -> dict:
    platform = str(payload.get("platform") or "").lower()
    if platform not in SUPPORTED_PLATFORMS:
        raise HTTPException(status_code=422, detail="Unsupported social platform.")
    campaign = _latest_campaign_for_user(current_user["id"])
    profile = campaign.get("business_profile") or {}
    accounts = [account for account in profile.get("social_accounts", []) if account.get("platform") != platform]
    safe_account = {
        "platform": platform,
        "username": payload.get("username"),
        "profile_url": payload.get("profile_url"),
        "page_name": payload.get("page_name"),
        "business_account": bool(payload.get("business_account")),
        "business_number": payload.get("business_number"),
        "display_name": payload.get("display_name"),
        "connection_status": "connected",
        "token_status": "healthy",
        "followers": payload.get("followers"),
        "last_connected": utc_now_iso(),
    }
    profile["social_accounts"] = [*accounts, safe_account]
    updated = supabase.table("campaigns").update({"business_profile": profile, "updated_at": utc_now_iso()}).eq("id", campaign["id"]).execute().data[0]
    add_log(campaign["id"], f"{platform} account connected", details={"platform": platform})
    return {"account": safe_account, "setup": _setup_payload(updated, current_user)}


@router.post("/disconnect-platform")
def disconnect_platform(payload: dict, current_user: dict = Depends(get_current_user)) -> dict:
    platform = str(payload.get("platform") or "").lower()
    campaign = _latest_campaign_for_user(current_user["id"])
    profile = campaign.get("business_profile") or {}
    accounts = []
    for account in profile.get("social_accounts", []):
        if account.get("platform") == platform:
            accounts.append({**account, "connection_status": "disconnected", "token_status": "not_connected"})
        else:
            accounts.append(account)
    profile["social_accounts"] = accounts
    updated = supabase.table("campaigns").update({"business_profile": profile, "updated_at": utc_now_iso()}).eq("id", campaign["id"]).execute().data[0]
    add_log(campaign["id"], f"{platform} account disconnected", details={"platform": platform})
    return {"setup": _setup_payload(updated, current_user)}


@router.get("/preferences/{user_id}")
def get_campaign_preferences(user_id: str, current_user: dict = Depends(get_current_user)) -> dict:
    _can_access(user_id, current_user)
    campaign = _latest_campaign_for_user(user_id)
    settings = campaign.get("settings") or {}
    return {
        "posting_preferences": settings.get("posting_preferences") or {},
        "content_preferences": settings.get("content_preferences") or {},
        "brand_assets": (campaign.get("business_profile") or {}).get("brand_assets") or [],
    }
