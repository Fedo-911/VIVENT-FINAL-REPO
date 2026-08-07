"""Contact message schemas."""

from __future__ import annotations

import re

from pydantic import BaseModel, EmailStr, Field, field_validator

CONTACT_SERVICES = {
    "General Inquiry",
    "Event Registration",
    "Business Partnership",
    "Technical Support",
    "Payment Issue",
    "Event Promotion",
    "Feedback",
    "Other",
}

CONTACT_STATUSES = {"New", "In Progress", "Replied", "Closed"}


def clean_text(value: str) -> str:
    """Normalize user-submitted text before validation/storage."""
    return re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", "", value).strip()


class ContactMessageCreate(BaseModel):
    """Payload for public contact form submissions."""

    name: str = Field(min_length=3, max_length=120)
    email: EmailStr
    phone: str = Field(min_length=10, max_length=20)
    service: str
    message: str = Field(min_length=20, max_length=1000)

    @field_validator("name", "phone", "service", "message", mode="before")
    @classmethod
    def strip_fields(cls, value: str) -> str:
        if not isinstance(value, str):
            return value
        return clean_text(value)

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, value: str) -> str:
        if not re.fullmatch(r"\+?\d+", value):
            raise ValueError("Phone number may contain digits and an optional leading + only.")
        digits = value[1:] if value.startswith("+") else value
        if len(digits) < 10:
            raise ValueError("Phone number must contain at least 10 digits.")
        return value

    @field_validator("service")
    @classmethod
    def validate_service(cls, value: str) -> str:
        if value not in CONTACT_SERVICES:
            raise ValueError("Invalid contact service.")
        return value


class ContactStatusUpdate(BaseModel):
    """Payload for admin contact status updates."""

    status: str

    @field_validator("status")
    @classmethod
    def validate_status(cls, value: str) -> str:
        if value not in CONTACT_STATUSES:
            raise ValueError("Invalid contact status.")
        return value


class ContactReplyCreate(BaseModel):
    """An administrator's response to a contact inquiry."""

    reply: str = Field(min_length=1, max_length=5000)

    @field_validator("reply", mode="before")
    @classmethod
    def clean_reply(cls, value: str) -> str:
        if not isinstance(value, str):
            return value
        return clean_text(value)


class ContactMessageOut(BaseModel):
    """Contact message response."""

    id: str
    name: str
    email: str
    phone: str
    service: str
    message: str
    status: str
    user_id: str | None = None
    admin_reply: str | None = None
    is_replied: bool = False
    replied_at: str | None = None
    replied_by: str | None = None
    created_at: str | None = None
    updated_at: str | None = None
