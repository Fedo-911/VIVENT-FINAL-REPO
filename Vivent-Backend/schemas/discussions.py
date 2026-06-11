"""Discussion schemas."""

from __future__ import annotations

from pydantic import BaseModel, Field


class DiscussionCreate(BaseModel):
    """Discussion message payload."""

    message: str = Field(min_length=1, max_length=5000)


class DiscussionOut(BaseModel):
    """Discussion message response."""

    id: str
    event_id: str
    user_id: str
    message: str
    sent_at: str | None = None
    created_at: str | None = None
    updated_at: str | None = None

