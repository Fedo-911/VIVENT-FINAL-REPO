"""User schemas."""

from __future__ import annotations

from pydantic import BaseModel, EmailStr, Field


class UserOut(BaseModel):
    """Public user representation."""

    id: str
    email: EmailStr
    full_name: str
    role: str
    is_active: bool
    created_at: str | None = None
    updated_at: str | None = None


class UserUpdate(BaseModel):
    """User update payload."""

    full_name: str | None = Field(default=None, min_length=2, max_length=255)
    password: str | None = Field(default=None, min_length=8)
    is_active: bool | None = None

