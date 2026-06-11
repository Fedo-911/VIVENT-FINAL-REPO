"""Supabase client initialization."""

from __future__ import annotations

import base64
import json

import httpx
from postgrest.exceptions import APIError
from supabase import Client, create_client

from config import settings


def _decode_legacy_jwt_role(api_key: str) -> str | None:
    """Decode the role claim from legacy JWT-style Supabase API keys."""
    parts = api_key.split(".")
    if len(parts) != 3:
        return None

    payload = parts[1]
    padding = "=" * (-len(payload) % 4)
    try:
        decoded = base64.urlsafe_b64decode(f"{payload}{padding}".encode("utf-8")).decode("utf-8")
        payload_data = json.loads(decoded)
    except (ValueError, json.JSONDecodeError):
        return None
    return payload_data.get("role")


def _validate_backend_key(api_key: str) -> None:
    """Reject frontend-facing Supabase keys for backend use."""
    if api_key.startswith("sb_publishable_"):
        raise RuntimeError(
            "SUPABASE_SECRET_KEY is required for backend access. "
            "Do not use an sb_publishable key."
        )

    legacy_role = _decode_legacy_jwt_role(api_key)
    if legacy_role and legacy_role != "service_role":
        raise RuntimeError(
            "The configured Supabase key is not a backend service key. "
            "Use SUPABASE_SECRET_KEY or a legacy service_role key."
        )


def _create_supabase_client() -> Client:
    if not settings.supabase_url or not settings.supabase_backend_key:
        raise RuntimeError(
            "Supabase is not configured. Set SUPABASE_URL and one of "
            "SUPABASE_SECRET_KEY, SUPABASE_SERVICE_ROLE_KEY, or SUPABASE_KEY."
        )
    _validate_backend_key(settings.supabase_backend_key)
    return create_client(settings.supabase_url, settings.supabase_backend_key)


def validate_supabase_access() -> str | None:
    """Return a startup warning if Supabase access is unavailable."""
    try:
        supabase.table("users").select("id").limit(1).execute()
        return None
    except APIError as exc:
        if "permission denied" in str(exc).lower():
            return (
                "Supabase backend access failed for table 'users'. "
                "Your key is loading, but the database grants are incomplete. "
                "Run the GRANT statements from schema.sql with your service-role/secret setup."
            )
        return f"Supabase API request failed during startup: {exc}"
    except httpx.ConnectError as exc:
        return (
            "Supabase connection failed during startup. "
            "Check firewall, antivirus, proxy, VPN, or network rules blocking outbound HTTPS. "
            f"Original error: {exc}"
        )
    except Exception as exc:
        return f"Unexpected Supabase startup validation error: {exc}"


supabase: Client = _create_supabase_client()
