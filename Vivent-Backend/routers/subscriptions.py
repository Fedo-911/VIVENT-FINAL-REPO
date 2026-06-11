"""Subscription management routes.

Handles user plan selection (Select Plan button) and subscription lifecycle.

Endpoints
---------
GET  /subscriptions/me       — Return the current user's active subscription
POST /subscriptions          — Subscribe to a plan (create or upgrade)
PATCH /subscriptions/cancel  — Cancel the current active subscription
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status

from dependencies import get_current_user
from schemas.common import MessageResponse
from schemas.subscriptions import SubscriptionCreate, SubscriptionOut, PlanSummary
from supabase_client import supabase
from utils.helpers import get_row_or_404, utc_now_iso

router = APIRouter(prefix="/subscriptions", tags=["subscriptions"])


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _fetch_plan(plan_id: str) -> dict:
    """Fetch a plan by ID or raise 404."""
    response = (
        supabase.table("plans")
        .select("*")
        .eq("id", plan_id)
        .eq("is_active", True)
        .limit(1)
        .execute()
    )
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Plan not found or is no longer active.",
        )
    return response.data[0]


def _get_active_subscription(user_id: str) -> dict | None:
    """Return the current active subscription row for a user, or None."""
    response = (
        supabase.table("user_subscriptions")
        .select("*")
        .eq("user_id", user_id)
        .eq("status", "active")
        .limit(1)
        .execute()
    )
    return response.data[0] if response.data else None


def _build_response(row: dict, plan: dict) -> SubscriptionOut:
    """Assemble a SubscriptionOut from a DB row and a plan dict."""
    plan_summary = PlanSummary(
        id=plan["id"],
        name=plan["name"],
        price=float(plan.get("price", 0)),
        facilities=plan.get("facilities") or {},
        is_active=plan.get("is_active", True),
    )
    return SubscriptionOut(
        subscription_id=row["id"],
        user_id=row["user_id"],
        plan_id=row["plan_id"],
        status=row["status"],
        started_at=row["started_at"],
        updated_at=row["updated_at"],
        plan=plan_summary,
    )


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.get("/me", response_model=SubscriptionOut | None)
def get_my_subscription(
    current_user: dict = Depends(get_current_user),
) -> SubscriptionOut | None:
    """Return the logged-in user's active subscription with full plan details.

    Returns ``null`` (HTTP 200) when the user has no active subscription so the
    frontend can handle the "no plan selected" state gracefully.
    """
    user_id: str = current_user["id"]
    row = _get_active_subscription(user_id)
    if row is None:
        return None

    # Fetch the related plan so the frontend can display name / price / features
    plan_response = (
        supabase.table("plans")
        .select("*")
        .eq("id", row["plan_id"])
        .limit(1)
        .execute()
    )
    if not plan_response.data:
        # Subscription row exists but the plan was deleted — return bare row
        return SubscriptionOut(
            subscription_id=row["id"],
            user_id=row["user_id"],
            plan_id=row["plan_id"],
            status=row["status"],
            started_at=row["started_at"],
            updated_at=row["updated_at"],
            plan=None,
        )

    return _build_response(row, plan_response.data[0])


@router.post("", response_model=SubscriptionOut, status_code=status.HTTP_200_OK)
def subscribe_to_plan(
    payload: SubscriptionCreate,
    current_user: dict = Depends(get_current_user),
) -> SubscriptionOut:
    """Subscribe the current user to a plan.

    - If the user has **no** active subscription → creates a new row.
    - If the user **already** has an active subscription → upgrades / downgrades
      by updating the existing row in-place (one active subscription per user).

    Called when the frontend "Select Plan" button is clicked.
    """
    user_id: str = current_user["id"]
    now = utc_now_iso()

    # 1. Validate the plan exists and is active
    plan = _fetch_plan(payload.plan_id)

    # 2. Check for an existing active subscription
    existing = _get_active_subscription(user_id)

    if existing:
        # ── Upgrade / downgrade: update in-place ──────────────────────────────
        if existing["plan_id"] == payload.plan_id:
            # Already on this plan — idempotent; just return current state
            return _build_response(existing, plan)

        update_resp = (
            supabase.table("user_subscriptions")
            .update({"plan_id": payload.plan_id, "updated_at": now})
            .eq("id", existing["id"])
            .execute()
        )
        if not update_resp.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update subscription. Please try again.",
            )
        return _build_response(update_resp.data[0], plan)

    # 3. No existing subscription → create a new one
    insert_resp = supabase.table("user_subscriptions").insert(
        {
            "user_id": user_id,
            "plan_id": payload.plan_id,
            "status": "active",
            "started_at": now,
            "updated_at": now,
        }
    ).execute()

    if not insert_resp.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create subscription. Please try again.",
        )
    return _build_response(insert_resp.data[0], plan)


@router.patch("/cancel", response_model=MessageResponse)
def cancel_subscription(
    current_user: dict = Depends(get_current_user),
) -> MessageResponse:
    """Cancel the current user's active subscription.

    Sets ``status = 'cancelled'`` on the active subscription row.
    Returns 404 if the user has no active subscription to cancel.
    """
    user_id: str = current_user["id"]
    existing = _get_active_subscription(user_id)

    if existing is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="You do not have an active subscription to cancel.",
        )

    supabase.table("user_subscriptions").update(
        {"status": "cancelled", "updated_at": utc_now_iso()}
    ).eq("id", existing["id"]).execute()

    return MessageResponse(detail="Subscription cancelled successfully.")
