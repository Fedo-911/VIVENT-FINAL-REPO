"""Authentication and authorization dependencies."""

from __future__ import annotations

from collections.abc import Callable
from typing import Any

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from supabase_client import supabase
from utils.jwt_handler import decode_access_token

bearer_scheme = HTTPBearer(auto_error=False)


def _get_attr_or_key(value: Any, key: str) -> Any:
    """Read a value from either a dict-like object or Supabase response model."""
    if isinstance(value, dict):
        return value.get(key)
    return getattr(value, key, None)


def _lookup_user_by_token_payload(payload: dict[str, Any]) -> dict[str, Any] | None:
    user_id = payload.get("sub")
    if user_id:
        response = supabase.table("users").select("*").eq("id", user_id).limit(1).execute()
        if response.data:
            return response.data[0]
    return None


def _lookup_user_from_supabase_auth_token(token: str) -> dict[str, Any] | None:
    """Resolve a Supabase Auth access token to the application user row."""
    try:
        auth_response = supabase.auth.get_user(token)
    except Exception:
        return None

    auth_user = _get_attr_or_key(auth_response, "user") or auth_response
    auth_user_id = _get_attr_or_key(auth_user, "id")
    auth_email = _get_attr_or_key(auth_user, "email")

    if auth_user_id:
        response = supabase.table("users").select("*").eq("id", auth_user_id).limit(1).execute()
        if response.data:
            return response.data[0]

    if auth_email:
        response = supabase.table("users").select("*").ilike("email", str(auth_email).lower()).limit(1).execute()
        if response.data:
            return response.data[0]

    return None


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> dict[str, Any]:
    """Return the current authenticated user from the JWT token."""
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided.",
        )

    token = credentials.credentials
    user: dict[str, Any] | None = None
    try:
        payload = decode_access_token(token)
        user = _lookup_user_by_token_payload(payload)
    except HTTPException:
        user = _lookup_user_from_supabase_auth_token(token)

    if not user or not user.get("is_active", True):
        raise HTTPException(status_code=401, detail="User not found or inactive.")
    return user


def require_roles(*roles: str) -> Callable[[dict[str, Any]], dict[str, Any]]:
    """Require one of the provided roles.

    Use this for endpoints that are accessible to specific non-admin roles
    (e.g. student or business dashboards).  Admins are NOT implicitly granted
    access through this dependency — use ``require_admin`` for admin endpoints.
    """

    def dependency(current_user: dict[str, Any] = Depends(get_current_user)) -> dict[str, Any]:
        user_role = current_user.get("role")
        if user_role not in roles:
            raise HTTPException(status_code=403, detail="You do not have permission to access this resource.")
        return current_user

    return dependency


def require_admin(current_user: dict[str, Any] = Depends(get_current_user)) -> dict[str, Any]:
    """Strictly require the authenticated user to have the 'admin' role.

    This dependency must be used on every admin-only endpoint.  It performs a
    fresh database lookup via ``get_current_user`` on every request, so a
    server-side role change takes effect immediately.  No amount of
    localStorage manipulation on the client side can bypass this check.
    """
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=403,
            detail="Admin access is required. You do not have permission to access this resource.",
        )
    return current_user


def require_self_or_admin(user_id: str, current_user: dict[str, Any]) -> None:
    """Ensure the current user is the owner or an admin."""
    if current_user.get("role") == "admin":
        return
    if current_user.get("id") != user_id:
        raise HTTPException(status_code=403, detail="You can only access your own profile.")

