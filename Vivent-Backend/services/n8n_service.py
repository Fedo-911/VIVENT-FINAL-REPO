"""Outbound n8n client. The webhook URL and signature secret remain server-side."""

from __future__ import annotations

import hashlib
import hmac
import json

import httpx

from config import settings


def trigger_social_workflow(payload: dict) -> tuple[bool, str | None]:
    """Send a signed request to n8n; an empty URL keeps local installs operational."""
    if not settings.n8n_social_webhook_url:
        return False, "N8N_SOCIAL_WEBHOOK_URL is not configured"
    body = json.dumps(payload, separators=(",", ":")).encode()
    headers = {"Content-Type": "application/json"}
    if settings.n8n_social_webhook_secret:
        # n8n checks this value before it starts the AI pipeline.
        headers["X-VIVENT-Webhook-Secret"] = settings.n8n_social_webhook_secret
        headers["X-VIVENT-Signature"] = hmac.new(
            settings.n8n_social_webhook_secret.encode(), body, hashlib.sha256
        ).hexdigest()
    try:
        response = httpx.post(settings.n8n_social_webhook_url, content=body, headers=headers, timeout=20)
        response.raise_for_status()
        return True, None
    except httpx.HTTPError as exc:
        return False, str(exc)
