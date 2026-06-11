"""Shared response schemas."""

from __future__ import annotations

from pydantic import BaseModel


class MessageResponse(BaseModel):
    """Generic message response."""

    detail: str

