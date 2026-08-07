"""Plan management routes."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status

from dependencies import require_admin
from schemas import MessageResponse, PlanCreate, PlanOut, PlanUpdate
from supabase_client import supabase
from utils.helpers import get_row_or_404, utc_now_iso, validate_plan_name
from utils.promotion_plans import PLAN_PRICES, PROMOTION_CURRENCY

router = APIRouter(prefix="/plans", tags=["plans"])


@router.get("", response_model=list[PlanOut])
def list_active_plans() -> list[dict]:
    """List public active plans."""
    response = (
        supabase.table("plans")
        .select("*")
        .eq("is_active", True)
        .order("price", desc=False)
        .execute()
    )
    plans = response.data or []
    return [{**plan, "price": PLAN_PRICES.get(plan["name"], plan["price"]), "currency": PROMOTION_CURRENCY} for plan in plans]


@router.post("", response_model=PlanOut, status_code=status.HTTP_201_CREATED)
def create_plan(payload: PlanCreate, current_user: dict = Depends(require_admin)) -> dict:
    """Create a new pricing plan — admin only."""
    _ = current_user
    validate_plan_name(payload.name)
    existing = supabase.table("plans").select("id").eq("name", payload.name).limit(1).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="A plan with this name already exists.")
    data = payload.model_dump(exclude={"currency"})
    data["price"] = PLAN_PRICES[payload.name]
    if "price" in data and data["price"] is not None:
        data["price"] = float(data["price"])
    data["created_at"] = utc_now_iso()
    data["updated_at"] = utc_now_iso()
    response = supabase.table("plans").insert(data).execute()
    return response.data[0]


@router.patch("/{plan_id}", response_model=PlanOut)
def update_plan(
    plan_id: str,
    payload: PlanUpdate,
    current_user: dict = Depends(require_admin),
) -> dict:
    """Update an existing plan — admin only."""
    _ = current_user
    get_row_or_404("plans", plan_id)
    update_data = payload.model_dump(exclude_unset=True)
    if "price" in update_data and update_data["price"] is not None:
        update_data["price"] = float(update_data["price"])
    if "name" in update_data:
        validate_plan_name(update_data["name"])
    existing = get_row_or_404("plans", plan_id)
    canonical_name = update_data.get("name", existing["name"])
    update_data["price"] = PLAN_PRICES[canonical_name]
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields provided for update.")
    update_data["updated_at"] = utc_now_iso()
    response = supabase.table("plans").update(update_data).eq("id", plan_id).execute()
    return response.data[0]


@router.delete("/{plan_id}", response_model=MessageResponse)
def delete_plan(plan_id: str, current_user: dict = Depends(require_admin)) -> MessageResponse:
    """Soft-delete a plan by marking it inactive — admin only."""
    _ = current_user
    get_row_or_404("plans", plan_id)
    supabase.table("plans").update({"is_active": False, "updated_at": utc_now_iso()}).eq("id", plan_id).execute()
    return MessageResponse(detail="Plan deactivated successfully.")
