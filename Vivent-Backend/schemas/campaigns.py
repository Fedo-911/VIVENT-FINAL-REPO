"""Schemas for the paid social-media campaign automation module."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class SocialAutomationStart(BaseModel):
    campaign_id: str


class GeneratedPostAction(BaseModel):
    action: str = Field(pattern="^(approve|reject|publish_now)$")
    scheduled_at: datetime | None = None


class WorkflowPostResult(BaseModel):
    platform: str
    caption: str = ""
    image_url: str | None = None
    status: str = "generated"
    published_at: datetime | None = None
    post_url: str | None = None
    ai_prompt: str | None = None
    image_prompt: str | None = None
    model_used: str | None = None
    error_message: str | None = None


class WorkflowResult(BaseModel):
    campaign_id: str
    execution_id: str | None = None
    status: str = "completed"
    duration_ms: int | None = Field(default=None, ge=0)
    posts: list[WorkflowPostResult] = []
    message: str | None = None
    raw_output: dict[str, Any] | None = None
