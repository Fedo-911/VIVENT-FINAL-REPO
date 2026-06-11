"""Social media account linking Pydantic schemas."""

from __future__ import annotations

from pydantic import BaseModel, Field


class LinkSessionResponse(BaseModel):
    """Response for initiating a social link session."""

    platform: str
    redirect_url: str
    session_token: str


class SocialCallbackRequest(BaseModel):
    """Request body for the OAuth callback."""

    session_token: str = Field(..., description="The session token from the link flow.")
    platform: str = Field(..., description="Social platform: facebook, instagram, linkedin, or twitter.")
    username: str = Field(..., min_length=1, description="The social media username/handle.")
    avatar_url: str | None = Field(default=None, description="Optional profile picture URL.")


class LinkedAccountOut(BaseModel):
    """Response model for a linked social account."""

    id: str
    user_id: str
    platform: str
    username: str
    avatar_url: str | None = None
    linked_at: str | None = None
    updated_at: str | None = None
