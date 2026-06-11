"""FastAPI entrypoint for the VIVENT backend."""

from __future__ import annotations

import httpx
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from postgrest.exceptions import APIError

from config import settings
from routers import (
    admin_events,
    ads,
    analytics,
    auth,
    discussions,
    events,
    notifications,
    payments,
    plans,
    records,
    registrations,
    social,
    subscriptions,
    users,
)
from supabase_client import validate_supabase_access

app = FastAPI(title=settings.app_name, version=settings.app_version)
app.state.startup_warning = None

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if settings.cors_allow_origins == ["*"] else settings.cors_allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(events.router)
app.include_router(admin_events.router)
app.include_router(plans.router)
app.include_router(registrations.router)
app.include_router(payments.router)
app.include_router(ads.router)
app.include_router(discussions.router)
app.include_router(notifications.router)
app.include_router(analytics.router)
app.include_router(records.router)
app.include_router(social.router)
app.include_router(subscriptions.router)


@app.on_event("startup")
def startup_validation() -> None:
    """Validate Supabase connectivity without crashing app startup."""
    app.state.startup_warning = validate_supabase_access()
    # Start the asynchronous analytics caching worker loop in a background thread
    from utils.cache_worker import start_analytics_cache_loop
    start_analytics_cache_loop()


@app.exception_handler(APIError)
async def handle_postgrest_api_error(_: Request, exc: APIError) -> JSONResponse:
    """Return cleaner API errors for Supabase permission/configuration issues."""
    if "permission denied" in str(exc).lower():
        return JSONResponse(
            status_code=500,
            content={
                "detail": (
                    "Supabase denied access to one of the required tables. "
                    "Use a backend secret/service-role key and apply the GRANT statements in schema.sql."
                )
            },
        )
    return JSONResponse(status_code=500, content={"detail": "Supabase request failed."})


@app.exception_handler(httpx.ConnectError)
async def handle_httpx_connect_error(_: Request, exc: httpx.ConnectError) -> JSONResponse:
    """Return a clear database connectivity error instead of a raw traceback."""
    return JSONResponse(
        status_code=503,
        content={
            "detail": (
                "Supabase is unreachable from this machine right now. "
                "Check firewall, antivirus, proxy, VPN, or outbound network rules. "
                f"Original error: {exc}"
            )
        },
    )


@app.get("/", tags=["health"])
def root() -> dict[str, str | None]:
    """Healthcheck endpoint."""
    return {
        "message": "VIVENT backend is running.",
        "startup_warning": app.state.startup_warning,
    }
