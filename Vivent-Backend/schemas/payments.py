"""Payment schemas."""

from __future__ import annotations

from decimal import Decimal

from pydantic import BaseModel, Field


class PaymentInitiate(BaseModel):
    """Payment initiation payload."""

    event_id: str | None = None
    plan_id: str | None = None
    amount: Decimal = Field(gt=0)
    payment_method: str | None = None


class PaymentOut(BaseModel):
    """Payment response."""

    id: str
    user_id: str
    event_id: str
    amount: Decimal
    status: str
    transaction_id: str
    payment_method: str | None = None
    created_at: str | None = None
    updated_at: str | None = None
    currency: str = "PKR"


class StripeSessionCreate(BaseModel):
    """Payload to create a Stripe checkout session."""

    # A checkout can be for either an event ticket or a promotion plan.  The
    # route validates that callers provide exactly one of these identifiers.
    event_id: str | None = None
    plan_id: str | None = None
    success_url: str | None = None
    cancel_url: str | None = None


class StripeSessionOut(BaseModel):
    """Stripe checkout session details."""

    session_id: str
    checkout_url: str
    amount: Decimal
    currency: str = "pkr"
