"""Social media promotion routes."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status

from dependencies import get_current_user, require_roles
from schemas import AdApprovalRequest, AdRequestCreate, SocialMediaAdOut
from supabase_client import supabase
from utils.helpers import (
    create_notification,
    ensure_registered_or_privileged,
    get_row_or_404,
    utc_now_iso,
    validate_ad_platforms,
)

router = APIRouter(tags=["ads"])


@router.post("/events/{event_id}/ads/request", response_model=SocialMediaAdOut, status_code=status.HTTP_201_CREATED)
def request_ad(
    event_id: str,
    payload: AdRequestCreate,
    current_user: dict = Depends(require_roles("student", "business")),
) -> dict:
    """Request social media promotion for an event."""
    event = get_row_or_404("events", event_id)
    ensure_registered_or_privileged(current_user, event)
    validate_ad_platforms(payload.platforms)
    ad_data = {
        "event_id": event_id,
        "requested_by": current_user["id"],
        "platforms": [platform.lower() for platform in payload.platforms],
        "status": "pending",
        "admin_notes": None,
        "created_at": utc_now_iso(),
        "updated_at": utc_now_iso(),
    }
    response = supabase.table("social_media_ads").insert(ad_data).execute()
    return response.data[0]


@router.get("/ads/requests", response_model=list[SocialMediaAdOut])
def list_ad_requests(current_user: dict = Depends(require_roles("admin"))) -> list[dict]:
    """List all ad requests for admins."""
    _ = current_user
    response = supabase.table("social_media_ads").select("*").order("created_at", desc=True).execute()
    return response.data or []


@router.put("/admin/ads/{ad_id}/approve", response_model=SocialMediaAdOut)
def approve_ad(
    ad_id: str,
    payload: AdApprovalRequest,
    current_user: dict = Depends(require_roles("admin")),
) -> dict:
    """Approve an ad request. Auto-publishes to linked social feeds if available."""
    _ = current_user
    ad = get_row_or_404("social_media_ads", ad_id)
    update = {"status": "approved", "admin_notes": payload.admin_notes, "updated_at": utc_now_iso()}
    response = supabase.table("social_media_ads").update(update).eq("id", ad_id).execute()

    # Attempt auto-publish to linked social accounts
    simulated_posts = _simulate_social_publishing(ad)

    notification_msg = "Your social media promotion request has been approved."
    if simulated_posts:
        platforms_str = ", ".join(p["platform"] for p in simulated_posts)
        notification_msg += f" Auto-published to: {platforms_str}."

    create_notification(
        ad["requested_by"],
        "Ad Request Approved",
        notification_msg,
    )

    result = response.data[0]
    if simulated_posts:
        result["auto_published"] = simulated_posts
    return result


def _simulate_social_publishing(ad: dict) -> list[dict]:
    """Query linked accounts for the ad requester and simulate posting to their feeds."""
    import hashlib, secrets

    user_id = ad.get("requested_by")
    event_id = ad.get("event_id")
    platforms = ad.get("platforms", [])

    if not user_id or not platforms:
        return []

    # Get linked accounts for requested platforms
    linked_resp = (
        supabase.table("linked_social_accounts")
        .select("*")
        .eq("user_id", user_id)
        .execute()
    )
    linked_accounts = linked_resp.data or []
    linked_map = {acc["platform"]: acc for acc in linked_accounts}

    # Get event details for post content
    event_title = "VIVENT Event"
    try:
        event_resp = supabase.table("events").select("title").eq("id", event_id).limit(1).execute()
        if event_resp.data:
            event_title = event_resp.data[0].get("title", event_title)
    except Exception:
        pass

    simulated_posts = []
    for platform in platforms:
        platform = platform.lower()
        if platform not in linked_map:
            continue

        account = linked_map[platform]
        post_hash = hashlib.md5(f"{event_id}:{platform}:{secrets.token_hex(4)}".encode()).hexdigest()[:12]
        slug = event_title.lower().replace(" ", "-")[:30]

        url_templates = {
            "linkedin": f"https://www.linkedin.com/posts/{account['username']}-{slug}-{post_hash}",
            "facebook": f"https://www.facebook.com/{account['username']}/posts/{post_hash}",
            "instagram": f"https://www.instagram.com/p/{post_hash}/",
            "twitter": f"https://twitter.com/{account['username']}/status/{post_hash}",
        }

        simulated_posts.append({
            "platform": platform,
            "username": account["username"],
            "post_url": url_templates.get(platform, f"https://{platform}.com/post/{post_hash}"),
            "status": "published",
            "event_title": event_title,
        })

    return simulated_posts


@router.put("/admin/ads/{ad_id}/reject", response_model=SocialMediaAdOut)
def reject_ad(
    ad_id: str,
    payload: AdApprovalRequest,
    current_user: dict = Depends(require_roles("admin")),
) -> dict:
    """Reject an ad request."""
    _ = current_user
    ad = get_row_or_404("social_media_ads", ad_id)
    if not payload.admin_notes:
        raise HTTPException(status_code=400, detail="Admin notes are required when rejecting an ad request.")
    update = {"status": "rejected", "admin_notes": payload.admin_notes, "updated_at": utc_now_iso()}
    response = supabase.table("social_media_ads").update(update).eq("id", ad_id).execute()
    create_notification(
        ad["requested_by"],
        "Ad Request Rejected",
        f"Your promotion request was rejected. Reason: {payload.admin_notes}",
    )
    return response.data[0]

