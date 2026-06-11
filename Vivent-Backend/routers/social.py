"""Social media account linking routes."""

from __future__ import annotations

import hashlib
import secrets
import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import HTMLResponse

from dependencies import get_current_user, require_roles
from schemas.social import (
    LinkedAccountOut,
    LinkSessionResponse,
    SocialCallbackRequest,
)
from supabase_client import supabase
from utils.helpers import utc_now_iso

router = APIRouter(prefix="/social", tags=["social"])

VALID_PLATFORMS = {"facebook", "instagram", "linkedin", "twitter"}

# In-memory session store for mock OAuth flow (production would use Redis/DB)
_link_sessions: dict[str, dict[str, Any]] = {}


@router.get("/link-session", response_model=LinkSessionResponse)
def start_link_session(
    platform: str = Query(..., description="Social platform to link: facebook, instagram, linkedin, twitter"),
    current_user: dict = Depends(require_roles("student", "business")),
) -> LinkSessionResponse:
    """Start a social media linking session with a mock redirect token."""
    platform = platform.lower().strip()
    if platform not in VALID_PLATFORMS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid platform. Choose from: {', '.join(sorted(VALID_PLATFORMS))}",
        )

    session_token = secrets.token_urlsafe(32)
    _link_sessions[session_token] = {
        "user_id": current_user["id"],
        "platform": platform,
        "created_at": utc_now_iso(),
    }

    redirect_url = f"/social/mock-oauth-portal?platform={platform}&session_token={session_token}"
    return LinkSessionResponse(
        platform=platform,
        redirect_url=redirect_url,
        session_token=session_token,
    )


@router.get("/mock-oauth-portal", response_class=HTMLResponse)
def mock_oauth_portal(
    platform: str = Query("linkedin"),
    session_token: str = Query(""),
) -> HTMLResponse:
    """Premium mock OAuth authorization portal simulating real social sign-in UX."""
    platform = platform.lower().strip()
    if platform not in VALID_PLATFORMS:
        platform = "linkedin"

    platform_config = {
        "linkedin": {
            "name": "LinkedIn",
            "icon": "💼",
            "color": "#0077B5",
            "gradient": "linear-gradient(135deg, #0077B5, #00a0dc)",
            "bg": "#f0f7ff",
        },
        "facebook": {
            "name": "Facebook",
            "icon": "📘",
            "color": "#1877F2",
            "gradient": "linear-gradient(135deg, #1877F2, #42a5f5)",
            "bg": "#f0f4ff",
        },
        "instagram": {
            "name": "Instagram",
            "icon": "📸",
            "color": "#E4405F",
            "gradient": "linear-gradient(135deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)",
            "bg": "#fff0f3",
        },
        "twitter": {
            "name": "X (Twitter)",
            "icon": "🐦",
            "color": "#1DA1F2",
            "gradient": "linear-gradient(135deg, #1DA1F2, #0d8bd9)",
            "bg": "#f0f9ff",
        },
    }

    cfg = platform_config.get(platform, platform_config["linkedin"])

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Connect {cfg['name']} — VIVENT</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{
            font-family: 'Inter', -apple-system, sans-serif;
            background: {cfg['bg']};
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }}
        .oauth-card {{
            background: white;
            border-radius: 20px;
            box-shadow: 0 25px 60px rgba(0,0,0,0.1), 0 1px 3px rgba(0,0,0,0.05);
            max-width: 440px;
            width: 100%;
            overflow: hidden;
            animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }}
        @keyframes slideUp {{
            from {{ opacity: 0; transform: translateY(30px); }}
            to {{ opacity: 1; transform: translateY(0); }}
        }}
        .oauth-header {{
            background: {cfg['gradient']};
            padding: 32px 28px;
            text-align: center;
            color: white;
        }}
        .oauth-header .platform-icon {{
            font-size: 48px;
            margin-bottom: 12px;
        }}
        .oauth-header h1 {{
            font-size: 22px;
            font-weight: 700;
            margin-bottom: 6px;
        }}
        .oauth-header p {{
            font-size: 14px;
            opacity: 0.9;
        }}
        .oauth-body {{
            padding: 28px;
        }}
        .permissions-box {{
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 16px;
            margin-bottom: 20px;
        }}
        .permissions-box h3 {{
            font-size: 13px;
            font-weight: 600;
            color: #475569;
            margin-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }}
        .permission-item {{
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 6px 0;
            font-size: 14px;
            color: #334155;
        }}
        .permission-item .check {{ color: #22c55e; }}
        .form-group {{
            margin-bottom: 16px;
        }}
        .form-group label {{
            display: block;
            font-size: 13px;
            font-weight: 600;
            color: #374151;
            margin-bottom: 6px;
        }}
        .form-group input {{
            width: 100%;
            padding: 12px 16px;
            border: 2px solid #e5e7eb;
            border-radius: 10px;
            font-size: 15px;
            font-family: 'Inter', sans-serif;
            transition: border-color 0.2s, box-shadow 0.2s;
            outline: none;
        }}
        .form-group input:focus {{
            border-color: {cfg['color']};
            box-shadow: 0 0 0 3px {cfg['color']}22;
        }}
        .btn-authorize {{
            width: 100%;
            padding: 14px;
            background: {cfg['gradient']};
            color: white;
            border: none;
            border-radius: 12px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.15s, box-shadow 0.15s;
            font-family: 'Inter', sans-serif;
        }}
        .btn-authorize:hover {{
            transform: translateY(-1px);
            box-shadow: 0 8px 20px {cfg['color']}44;
        }}
        .btn-authorize:active {{ transform: translateY(0); }}
        .btn-cancel {{
            width: 100%;
            padding: 12px;
            background: transparent;
            color: #6b7280;
            border: 1px solid #d1d5db;
            border-radius: 12px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            margin-top: 10px;
            font-family: 'Inter', sans-serif;
            transition: background 0.2s;
        }}
        .btn-cancel:hover {{ background: #f9fafb; }}
        .vivent-badge {{
            text-align: center;
            padding: 16px;
            font-size: 12px;
            color: #94a3b8;
        }}
        .vivent-badge span {{ font-weight: 600; color: #64748b; }}
        .success-overlay {{
            display: none;
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.5);
            z-index: 1000;
            align-items: center;
            justify-content: center;
            backdrop-filter: blur(8px);
        }}
        .success-card {{
            background: white;
            border-radius: 20px;
            padding: 40px;
            text-align: center;
            max-width: 380px;
            animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }}
        .success-card .checkmark {{
            font-size: 64px;
            margin-bottom: 16px;
        }}
        .success-card h2 {{ color: #059669; font-size: 22px; margin-bottom: 8px; }}
        .success-card p {{ color: #6b7280; font-size: 14px; line-height: 1.5; }}
        .success-card .response-box {{
            background: #f0fdf4;
            border: 1px solid #bbf7d0;
            border-radius: 10px;
            padding: 12px;
            margin-top: 16px;
            font-family: monospace;
            font-size: 12px;
            color: #166534;
            text-align: left;
            word-break: break-all;
        }}
    </style>
</head>
<body>
    <div class="oauth-card">
        <div class="oauth-header">
            <div class="platform-icon">{cfg['icon']}</div>
            <h1>Connect to {cfg['name']}</h1>
            <p>VIVENT would like to access your {cfg['name']} profile</p>
        </div>
        <div class="oauth-body">
            <div class="permissions-box">
                <h3>Permissions Requested</h3>
                <div class="permission-item"><span class="check">✓</span> Read your profile information</div>
                <div class="permission-item"><span class="check">✓</span> Post content on your behalf</div>
                <div class="permission-item"><span class="check">✓</span> Access your follower count</div>
            </div>
            <form id="authForm" onsubmit="handleAuthorize(event)">
                <div class="form-group">
                    <label for="username">Your {cfg['name']} Username</label>
                    <input type="text" id="username" name="username" placeholder="@your_handle" required />
                </div>
                <div class="form-group">
                    <label for="avatar_url">Profile Picture URL (optional)</label>
                    <input type="url" id="avatar_url" name="avatar_url" placeholder="https://..." />
                </div>
                <button type="submit" class="btn-authorize">Authorize VIVENT</button>
                <button type="button" class="btn-cancel" onclick="window.close()">Cancel</button>
            </form>
        </div>
        <div class="vivent-badge">Powered by <span>VIVENT</span> Event Management</div>
    </div>

    <div class="success-overlay" id="successOverlay">
        <div class="success-card">
            <div class="checkmark">✅</div>
            <h2>Connected Successfully!</h2>
            <p>Your {cfg['name']} account has been linked to VIVENT.</p>
            <div class="response-box" id="responseBox"></div>
        </div>
    </div>

    <script>
        async function handleAuthorize(e) {{
            e.preventDefault();
            const username = document.getElementById('username').value.trim();
            const avatar_url = document.getElementById('avatar_url').value.trim();

            const body = {{
                session_token: "{session_token}",
                platform: "{platform}",
                username: username,
                avatar_url: avatar_url || null,
            }};

            try {{
                const res = await fetch('/social/callback', {{
                    method: 'POST',
                    headers: {{'Content-Type': 'application/json'}},
                    body: JSON.stringify(body),
                }});
                const data = await res.json();
                document.getElementById('responseBox').textContent = JSON.stringify(data, null, 2);
                document.getElementById('successOverlay').style.display = 'flex';
            }} catch (err) {{
                alert('Connection failed: ' + err.message);
            }}
        }}
    </script>
</body>
</html>"""
    return HTMLResponse(content=html)


@router.post("/callback", response_model=LinkedAccountOut, status_code=status.HTTP_201_CREATED)
def social_callback(payload: SocialCallbackRequest) -> dict:
    """Process OAuth callback — validate session and link the social account."""
    platform = payload.platform.lower().strip()
    if platform not in VALID_PLATFORMS:
        raise HTTPException(status_code=400, detail=f"Invalid platform: {platform}")

    # Validate session
    session = _link_sessions.pop(payload.session_token, None)
    if not session:
        raise HTTPException(
            status_code=400,
            detail="Invalid or expired session token. Please start a new link session.",
        )

    if session["platform"] != platform:
        raise HTTPException(status_code=400, detail="Platform mismatch with session.")

    user_id = session["user_id"]

    # Generate mock access token
    access_token = hashlib.sha256(
        f"{user_id}:{platform}:{payload.username}:{secrets.token_hex(8)}".encode()
    ).hexdigest()

    now = utc_now_iso()
    account_data = {
        "user_id": user_id,
        "platform": platform,
        "username": payload.username,
        "avatar_url": payload.avatar_url,
        "access_token": access_token,
        "linked_at": now,
        "updated_at": now,
    }

    # Upsert — update if same user+platform exists, otherwise insert
    existing = (
        supabase.table("linked_social_accounts")
        .select("id")
        .eq("user_id", user_id)
        .eq("platform", platform)
        .limit(1)
        .execute()
    )

    if existing.data:
        # Update existing link
        record_id = existing.data[0]["id"]
        response = (
            supabase.table("linked_social_accounts")
            .update({
                "username": payload.username,
                "avatar_url": payload.avatar_url,
                "access_token": access_token,
                "updated_at": now,
            })
            .eq("id", record_id)
            .execute()
        )
    else:
        # Insert new link
        response = supabase.table("linked_social_accounts").insert(account_data).execute()

    return response.data[0]


@router.get("/accounts", response_model=list[LinkedAccountOut])
def list_linked_accounts(
    current_user: dict = Depends(get_current_user),
) -> list[dict]:
    """List all social media accounts linked to the current user."""
    response = (
        supabase.table("linked_social_accounts")
        .select("*")
        .eq("user_id", current_user["id"])
        .order("linked_at", desc=True)
        .execute()
    )
    return response.data or []


@router.delete("/accounts/{account_id}", status_code=status.HTTP_200_OK)
def unlink_account(
    account_id: str,
    current_user: dict = Depends(get_current_user),
) -> dict:
    """Disconnect and unlink a social media account."""
    # Verify ownership
    response = (
        supabase.table("linked_social_accounts")
        .select("*")
        .eq("id", account_id)
        .limit(1)
        .execute()
    )
    if not response.data:
        raise HTTPException(status_code=404, detail="Linked account not found.")

    account = response.data[0]
    if account["user_id"] != current_user["id"] and current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="You can only unlink your own accounts.")

    supabase.table("linked_social_accounts").delete().eq("id", account_id).execute()
    return {
        "detail": f"{account['platform'].title()} account @{account['username']} has been unlinked successfully.",
    }
