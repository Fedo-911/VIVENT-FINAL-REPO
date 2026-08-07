"""Paid social-media campaign endpoints and n8n callback boundary."""

from __future__ import annotations

import hashlib
import hmac
import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Header, HTTPException, Request, status

from config import settings
from dependencies import get_current_user, require_admin
from schemas.campaigns import GeneratedPostAction, SocialAutomationStart, WorkflowResult
from services.campaign_service import add_log, workflow_payload
from services.n8n_service import trigger_social_workflow
from supabase_client import supabase
from utils.helpers import create_notification, get_row_or_404, utc_now_iso

router = APIRouter(prefix="/automation/social-media", tags=["social-campaigns"])


def _campaign_for_user(campaign_id: str, user: dict) -> dict:
    campaign = get_row_or_404("campaigns", campaign_id)
    if user.get("role") != "admin" and campaign["business_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="You cannot access this campaign.")
    return campaign


@router.post("/start", status_code=status.HTTP_202_ACCEPTED)
def start_campaign(payload: SocialAutomationStart, current_user: dict = Depends(get_current_user)) -> dict:
    campaign = _campaign_for_user(payload.campaign_id, current_user)
    if not (campaign.get("settings") or {}).get("setup_completed"):
        raise HTTPException(status_code=409, detail="Complete the promotion campaign setup before running AI.")
    if campaign["status"] not in {"active", "scheduled"}:
        raise HTTPException(status_code=409, detail="Only active paid campaigns can be started.")
    execution = supabase.table("workflow_executions").insert({"campaign_id": campaign["id"], "status": "started", "started_at": utc_now_iso(), "created_at": utc_now_iso()}).execute().data[0]
    plan = get_row_or_404("plans", campaign["plan_id"])
    business = get_row_or_404("users", campaign["business_id"])
    workflow_input = workflow_payload(campaign, plan, business) | {"execution_id": execution["id"]}
    add_log(campaign["id"], "Webhook received", details={"execution_id": execution["id"]})
    add_log(campaign["id"], "Research started")
    ok, error = trigger_social_workflow(workflow_input)
    supabase.table("workflow_executions").update({"status": "queued" if ok else "failed", "error_message": error, "updated_at": utc_now_iso()}).eq("id", execution["id"]).execute()
    if not ok:
        add_log(campaign["id"], "n8n dispatch failed", "failed", {"error": error})
        raise HTTPException(status_code=503, detail="Campaign queued locally but n8n is unavailable.")
    return {"campaign_id": campaign["id"], "execution_id": execution["id"], "status": "queued"}


@router.post("/results", status_code=status.HTTP_200_OK)
async def receive_results(request: Request, x_vivent_webhook_secret: str = Header(default="")) -> dict:
    raw = await request.body()
    if settings.automation_callback_secret:
        if not hmac.compare_digest(settings.automation_callback_secret, x_vivent_webhook_secret):
            raise HTTPException(status_code=401, detail="Invalid automation callback secret.")
    result = WorkflowResult.model_validate_json(raw)
    campaign = get_row_or_404("campaigns", result.campaign_id)
    allowed = {r["platform"] for r in supabase.table("campaign_platforms").select("platform").eq("campaign_id", campaign["id"]).eq("is_enabled", True).execute().data or []}
    now = utc_now_iso()
    created = 0
    for post in result.posts:
        if post.platform.lower() not in allowed:
            continue
        record = post.model_dump(mode="json")
        record["platform"] = record["platform"].lower()
        record.update({"campaign_id": campaign["id"], "created_at": now, "updated_at": now})
        supabase.table("generated_posts").insert(record).execute()
        created += 1
    if result.execution_id:
        supabase.table("workflow_executions").update({"status": result.status, "duration_ms": result.duration_ms, "completed_at": now, "raw_output": result.raw_output or {}, "updated_at": now}).eq("id", result.execution_id).execute()
    supabase.table("campaigns").update({"last_ai_run": now, "remaining_posts": max(0, int(campaign["remaining_posts"]) - created), "updated_at": now}).eq("id", campaign["id"]).execute()
    add_log(campaign["id"], "Publishing completed" if result.status == "completed" else "Workflow failed", result.status, {"posts": created})
    create_notification(
        campaign["business_id"],
        "AI Generated New Post",
        f"{created} generated posts are ready for review.",
        notification_type="campaign_content_generated",
        reference_id=campaign["id"],
        reference_type="campaign",
    )
    return {"status": "accepted", "posts_saved": created}


@router.get("/campaigns")
def list_campaigns(current_user: dict = Depends(require_admin)) -> list[dict]:
    _ = current_user
    return supabase.table("campaigns").select("*, plans(name), campaign_platforms(*)").order("created_at", desc=True).execute().data or []


@router.get("/campaigns/{campaign_id}")
def campaign_detail(campaign_id: str, current_user: dict = Depends(get_current_user)) -> dict:
    campaign = _campaign_for_user(campaign_id, current_user)
    posts = supabase.table("generated_posts").select("*").eq("campaign_id", campaign_id).order("created_at", desc=True).execute().data or []
    logs = supabase.table("ai_logs").select("*").eq("campaign_id", campaign_id).order("created_at", desc=True).limit(30).execute().data or []
    return {"campaign": campaign, "posts": posts, "logs": logs}


@router.patch("/posts/{post_id}")
def action_post(post_id: str, payload: GeneratedPostAction, current_user: dict = Depends(require_admin)) -> dict:
    post = get_row_or_404("generated_posts", post_id)
    campaign = get_row_or_404("campaigns", post["campaign_id"])
    updates = {"status": {"approve": "approved", "reject": "rejected", "publish_now": "publishing"}[payload.action], "updated_at": utc_now_iso()}
    if payload.scheduled_at:
        updates["scheduled_at"] = payload.scheduled_at.isoformat()
    updated = supabase.table("generated_posts").update(updates).eq("id", post_id).execute().data[0]
    add_log(campaign["id"], f"Post {payload.action}", details={"post_id": post_id})
    return updated
