"""Record schemas."""

from __future__ import annotations

from pydantic import BaseModel


class MyEventsResponse(BaseModel):
    """Historical/current event records."""

    current_events: list[dict]
    past_events: list[dict]


class FinancialRecordResponse(BaseModel):
    """Payment history response."""

    payments: list[dict]

