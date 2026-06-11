"""Notification schemas."""

from __future__ import annotations

from pydantic import BaseModel


class NotificationOut(BaseModel):
    """Notification response."""

    id: str
    user_id: str
    title: str
    message: str
    is_read: bool
    created_at: str | None = None
    updated_at: str | None = None

