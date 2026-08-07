"""Publishing boundary for platform/Buffer providers.

Provider credentials are referenced from `platform_credentials` and must be
resolved by n8n or a secret manager, never returned by the API.
"""

from __future__ import annotations

SUPPORTED_PLATFORMS = {"instagram", "facebook", "linkedin", "tiktok"}


def can_publish(platform: str, included_platforms: set[str]) -> bool:
    """Prevent provider calls for platforms outside the paid campaign."""
    return platform.lower() in SUPPORTED_PLATFORMS and platform.lower() in included_platforms
