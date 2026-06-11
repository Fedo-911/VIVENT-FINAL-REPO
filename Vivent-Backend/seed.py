"""Seed default plans and admin user."""

from __future__ import annotations

from supabase_client import supabase
from utils.helpers import utc_now_iso
from utils.passwords import hash_password

DEFAULT_PLANS = [
    {
        "name": "Basic",
        "price": 99.0,
        "facilities": {
            "parking": False,
            "refreshments": False,
            "stalls": 1,
            "seating": 25,
            "social_media_ads": ["offline_posters"],
        },
        "is_active": True,
    },
    {
        "name": "Normal",
        "price": 249.0,
        "facilities": {
            "parking": True,
            "refreshments": True,
            "stalls": 2,
            "seating": 75,
            "social_media_ads": ["instagram", "facebook"],
        },
        "is_active": True,
    },
    {
        "name": "Premium",
        "price": 499.0,
        "facilities": {
            "parking": True,
            "refreshments": True,
            "stalls": 5,
            "seating": 200,
            "social_media_ads": ["instagram", "facebook", "linkedin", "tiktok", "whatsapp"],
        },
        "is_active": True,
    },
]


def seed_plans() -> None:
    """Insert default plans if missing."""
    for plan in DEFAULT_PLANS:
        existing = supabase.table("plans").select("id").eq("name", plan["name"]).limit(1).execute()
        if existing.data:
            continue
        supabase.table("plans").insert(
            {**plan, "created_at": utc_now_iso(), "updated_at": utc_now_iso()}
        ).execute()


def seed_admin() -> None:
    """Insert the default admin user if missing."""
    email = "admin@vivent.com"
    existing = supabase.table("users").select("id").eq("email", email).limit(1).execute()
    if existing.data:
        return
    supabase.table("users").insert(
        {
            "email": email,
            "hashed_password": hash_password("Admin123!"),
            "full_name": "VIVENT Admin",
            "role": "admin",
            "is_active": True,
            "created_at": utc_now_iso(),
            "updated_at": utc_now_iso(),
        }
    ).execute()


if __name__ == "__main__":
    seed_plans()
    seed_admin()
    print("Seeding complete.")

