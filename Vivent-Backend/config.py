"""Application configuration loaded from environment variables."""

from __future__ import annotations

import os
from dataclasses import dataclass, field

from dotenv import load_dotenv

load_dotenv()


@dataclass(frozen=True)
class Settings:
    """Runtime settings for the API."""

    app_name: str = os.getenv("APP_NAME", "VIVENT Event Management System")
    app_version: str = os.getenv("APP_VERSION", "1.0.0")
    jwt_secret: str = os.getenv("JWT_SECRET", "change-me")
    jwt_algorithm: str = os.getenv("JWT_ALGORITHM", "HS256")
    access_token_expire_hours: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_HOURS", "24"))
    supabase_url: str = os.getenv("SUPABASE_URL", "")
    supabase_secret_key: str = os.getenv("SUPABASE_SECRET_KEY", "")
    supabase_service_role_key: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    supabase_key: str = os.getenv("SUPABASE_KEY", "")
    cors_allow_origins: list[str] = field(
        default_factory=lambda: os.getenv("CORS_ALLOW_ORIGINS", "*").split(",")
    )
    zoom_client_id: str = os.getenv("ZOOM_CLIENT_ID", "")
    zoom_client_secret: str = os.getenv("ZOOM_CLIENT_SECRET", "")
    zoom_account_id: str = os.getenv("ZOOM_ACCOUNT_ID", "")
    gemini_api_key: str = os.getenv("GEMINI_API_KEY", "")

    @property
    def supabase_backend_key(self) -> str:
        """Return the preferred backend key, supporting old and new env names."""
        return self.supabase_secret_key or self.supabase_service_role_key or self.supabase_key


settings = Settings()
