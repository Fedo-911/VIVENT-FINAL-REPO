"""Social media ad schemas."""

from __future__ import annotations

from pydantic import BaseModel, Field


class AdRequestCreate(BaseModel):
    """Promotion request payload."""

    platforms: list[str] = Field(min_length=1)


class AdApprovalRequest(BaseModel):
    """Admin approval/rejection payload."""

    admin_notes: str | None = None


class SocialMediaAdOut(BaseModel):
    """Ad response."""

    id: str
    event_id: str
    requested_by: str
    platforms: list[str]
    status: str
    admin_notes: str | None = None
    created_at: str | None = None
    updated_at: str | None = None

