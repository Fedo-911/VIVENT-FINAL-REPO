"""Authoritative social-media promotion plan catalogue."""

from __future__ import annotations

PROMOTION_CURRENCY = "PKR"
PLAN_PRICES = {
    "Basic": 5539,
    "Standard": 8309,
    "Premium": 13349,
}


def plan_price(name: str) -> float:
    """Return the canonical monthly price for a promotion plan."""
    return float(PLAN_PRICES[name])
