"""Authentication and authorization dependencies."""

from __future__ import annotations

from collections.abc import Callable
from typing import Any

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from supabase_client import supabase
from utils.jwt_handler import decode_access_token

bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> dict[str, Any]:
    """Return the current authenticated user from the JWT token."""
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided.",
        )

    payload = decode_access_token(credentials.credentials)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload.")

    response = supabase.table("users").select("*").eq("id", user_id).limit(1).execute()
    user = response.data[0] if response.data else None
    if not user or not user.get("is_active", True):
        raise HTTPException(status_code=401, detail="User not found or inactive.")
    return user


def require_roles(*roles: str) -> Callable[[dict[str, Any]], dict[str, Any]]:
    """Require one of the provided roles, while allowing admins universally."""

    def dependency(current_user: dict[str, Any] = Depends(get_current_user)) -> dict[str, Any]:
        user_role = current_user.get("role")
        if user_role == "admin":
            return current_user
        if user_role not in roles:
            raise HTTPException(status_code=403, detail="You do not have permission to access this resource.")
        return current_user

    return dependency


def require_self_or_admin(user_id: str, current_user: dict[str, Any]) -> None:
    """Ensure the current user is the owner or an admin."""
    if current_user.get("role") == "admin":
        return
    if current_user.get("id") != user_id:
        raise HTTPException(status_code=403, detail="You can only access your own profile.")

