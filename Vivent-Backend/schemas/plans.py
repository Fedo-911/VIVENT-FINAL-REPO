"""Plan schemas."""

from __future__ import annotations

from decimal import Decimal
from typing import Any

from pydantic import BaseModel, Field


class PlanBase(BaseModel):
    """Shared plan fields."""

    name: str
    price: Decimal = Field(ge=0)
    facilities: dict[str, Any]
    is_active: bool = True


class PlanCreate(PlanBase):
    """Plan creation payload."""


class PlanUpdate(BaseModel):
    """Plan update payload."""

    name: str | None = None
    price: Decimal | None = Field(default=None, ge=0)
    facilities: dict[str, Any] | None = None
    is_active: bool | None = None


class PlanOut(PlanBase):
    """Plan response payload."""

    id: str
    created_at: str | None = None
    updated_at: str | None = None

