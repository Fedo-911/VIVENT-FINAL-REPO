"""Registration schemas."""

from __future__ import annotations

from pydantic import BaseModel


class RegistrationCreate(BaseModel):
    """Registration payload."""

    role_at_event: str = "participant"


class RegistrationOut(BaseModel):
    """Registration response."""

    id: str
    user_id: str
    event_id: str
    role_at_event: str
    registration_date: str | None = None
    payment_status: str
    payment_id: str | None = None
    created_at: str | None = None
    updated_at: str | None = None

