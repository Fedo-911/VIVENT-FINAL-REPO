"""AI-related Pydantic schemas."""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class AICopywriteRequest(BaseModel):
    """Request body for AI event description generation."""

    notes: str = Field(..., min_length=5, description="Raw bullet points or outline notes about the event.")
    category: str = Field(..., description="Event category: educational, expo, food, or job_fair.")
    tone: str = Field(default="professional", description="Desired writing tone: professional, casual, or energetic.")


class AICopywriteResponse(BaseModel):
    """Response body containing AI-generated event copy."""

    generated_title: str
    generated_description: str
    marketing_tagline: str
    suggested_schedule: list[str]
    ai_provider: str = Field(description="Which AI engine produced this: 'gemini' or 'local_engine'.")


class AIInsightsResponse(BaseModel):
    """Response body for AI admin analytics insights."""

    insights_markdown: str = Field(description="Rich markdown analysis report.")
    ai_provider: str
    summary_stats: dict[str, Any] = Field(default_factory=dict)
