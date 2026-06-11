"""Subscription schemas."""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel


class SubscriptionCreate(BaseModel):
    """Payload for selecting a plan (POST /subscriptions)."""

    plan_id: str


class PlanSummary(BaseModel):
    """Lightweight plan info embedded in a subscription response."""

    id: str
    name: str
    price: float
    facilities: dict[str, Any] = {}
    is_active: bool = True


class SubscriptionOut(BaseModel):
    """Full subscription response returned to the frontend."""

    subscription_id: str
    user_id: str
    plan_id: str
    status: str          # "active" | "cancelled"
    started_at: str
    updated_at: str
    plan: PlanSummary | None = None
