"""Notification schemas."""

from __future__ import annotations

from pydantic import BaseModel


class NotificationOut(BaseModel):
    """Notification response."""

    id: str
    user_id: str
    recipient_role: str | None = None
    title: str
    message: str
    type: str = "general"
    reference_id: str | None = None
    reference_type: str | None = None
    is_read: bool
    created_at: str | None = None
    updated_at: str | None = None
