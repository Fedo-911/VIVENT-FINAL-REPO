"""Analytics schemas."""

from __future__ import annotations

from decimal import Decimal
from typing import Any

from pydantic import BaseModel


class ChartPoint(BaseModel):
    """Daily chart metric."""

    date: str
    count: int | None = None
    value: Decimal | float | int | None = None


class AdminDashboardResponse(BaseModel):
    """Admin dashboard response."""

    total_events_by_status: dict[str, int]
    total_events_by_category: dict[str, int]
    total_revenue: Decimal | float
    participation_per_event: list[dict[str, Any]]
    chart_data: dict[str, list[ChartPoint]]


class StudentDashboardResponse(BaseModel):
    """Student dashboard response."""

    my_registered_events: list[dict[str, Any]]
    pending_payments: list[dict[str, Any]]
    upcoming_events: list[dict[str, Any]]


class BusinessDashboardResponse(BaseModel):
    """Business dashboard response."""

    my_created_events: list[dict[str, Any]]
    registration_count_per_event: list[dict[str, Any]]
    revenue_per_event: list[dict[str, Any]]

