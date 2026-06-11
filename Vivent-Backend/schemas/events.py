"""Event schemas."""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class EventCreate(BaseModel):
    """Payload for event creation."""

    title: str = Field(min_length=3, max_length=255)
    description: str = Field(min_length=10)
    category: str
    start_date: str
    end_date: str
    location: str
    venue_details: dict[str, Any] | None = None
    plan_id: str
    max_participants: int = Field(gt=0)


class EventUpdate(BaseModel):
    """Payload for event updates."""

    title: str | None = Field(default=None, min_length=3, max_length=255)
    description: str | None = Field(default=None, min_length=10)
    category: str | None = None
    status: str | None = None
    start_date: str | None = None
    end_date: str | None = None
    location: str | None = None
    venue_details: dict[str, Any] | None = None
    plan_id: str | None = None
    max_participants: int | None = Field(default=None, gt=0)


class EventOut(BaseModel):
    """Event response."""

    id: str
    title: str
    description: str
    category: str
    status: str
    start_date: str
    end_date: str
    location: str
    venue_details: dict[str, Any] | None = None
    created_by: str
    approved_by: str | None = None
    plan_id: str
    max_participants: int
    current_participants: int
    created_at: str | None = None
    updated_at: str | None = None
    discussion_count: int | None = None
    registration_count: int | None = None


class EventListResponse(BaseModel):
    """Paginated event listing."""

    items: list[EventOut]
    total: int
    page: int
    page_size: int

