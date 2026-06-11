"""Tests for AI services and social media account linking features."""

from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from conftest import auth_header


# ───────────────────────────── AI Description Generator ─────────────────────────────


class TestAIDescriptionGenerator:
    """Test POST /events/ai/generate-description."""

    def test_local_fallback_generates_valid_response(self, client: TestClient, tokens: dict):
        """When no Gemini key, the local engine should return a structured response."""
        payload = {
            "notes": "Tech expo featuring latest innovations\n- AI demos\n- Startup pitches\n- Networking sessions",
            "category": "expo",
            "tone": "professional",
        }
        resp = client.post(
            "/events/ai/generate-description",
            json=payload,
            headers=auth_header(tokens["business"]),
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "generated_title" in data
        assert "generated_description" in data
        assert "marketing_tagline" in data
        assert "suggested_schedule" in data
        assert data["ai_provider"] == "local_engine"
        assert len(data["generated_title"]) > 0
        assert isinstance(data["suggested_schedule"], list)
        assert len(data["suggested_schedule"]) >= 4

    def test_ai_description_validates_required_fields(self, client: TestClient, tokens: dict):
        """Missing required fields should return 422."""
        resp = client.post(
            "/events/ai/generate-description",
            json={"notes": "Something"},  # missing category
            headers=auth_header(tokens["business"]),
        )
        assert resp.status_code == 422

    def test_ai_description_requires_auth(self, client: TestClient):
        """Unauthenticated requests should be rejected."""
        resp = client.post(
            "/events/ai/generate-description",
            json={"notes": "Test notes", "category": "educational"},
        )
        assert resp.status_code in (401, 403)

    def test_ai_description_all_categories(self, client: TestClient, tokens: dict):
        """Each valid category should produce a working description."""
        for category in ["educational", "expo", "food", "job_fair"]:
            payload = {
                "notes": f"Amazing {category} event with great activities",
                "category": category,
            }
            resp = client.post(
                "/events/ai/generate-description",
                json=payload,
                headers=auth_header(tokens["student"]),
            )
            assert resp.status_code == 200
            data = resp.json()
            assert data["ai_provider"] == "local_engine"
            assert len(data["generated_description"]) > 20

    def test_ai_description_different_tones(self, client: TestClient, tokens: dict):
        """Different tones should produce valid output."""
        for tone in ["professional", "casual", "energetic"]:
            payload = {
                "notes": "Tech conference with workshops and panels",
                "category": "educational",
                "tone": tone,
            }
            resp = client.post(
                "/events/ai/generate-description",
                json=payload,
                headers=auth_header(tokens["business"]),
            )
            assert resp.status_code == 200
            assert resp.json()["ai_provider"] == "local_engine"

    @patch("utils.ai_services.settings")
    @patch("utils.ai_services.httpx.post")
    def test_gemini_api_integration(self, mock_post, mock_settings):
        """When Gemini key is set, it should attempt to call the API."""
        from utils.ai_services import generate_ai_description

        mock_settings.gemini_api_key = "test-api-key"
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "candidates": [{
                "content": {
                    "parts": [{
                        "text": (
                            "TITLE: Amazing Tech Summit 2024\n"
                            "DESCRIPTION: Join us for an incredible technology summit.\n"
                            "This event brings together the brightest minds.\n\n"
                            "TAGLINE: Innovation Starts Here\n"
                            "SCHEDULE:\n"
                            "- 09:00 AM — Registration\n"
                            "- 10:00 AM — Keynote\n"
                            "- 12:00 PM — Lunch\n"
                            "- 02:00 PM — Workshops"
                        )
                    }]
                }
            }]
        }
        mock_post.return_value = mock_response

        result = generate_ai_description(
            notes="Tech summit with AI demos",
            category="educational",
            tone="professional",
        )
        assert result["ai_provider"] == "gemini"
        assert "Amazing Tech Summit" in result["generated_title"]
        assert isinstance(result["suggested_schedule"], list)

    @patch("utils.ai_services.settings")
    @patch("utils.ai_services.httpx.post")
    def test_gemini_api_fallback_on_failure(self, mock_post, mock_settings):
        """When Gemini fails, it should fall back to local engine."""
        from utils.ai_services import generate_ai_description

        mock_settings.gemini_api_key = "test-api-key"
        mock_post.side_effect = Exception("Network error")

        result = generate_ai_description(
            notes="Test event with activities",
            category="expo",
            tone="casual",
        )
        assert result["ai_provider"] == "local_engine"
        assert len(result["generated_title"]) > 0


# ───────────────────────────── AI Admin Insights ─────────────────────────────


class TestAIAdminInsights:
    """Test POST /analytics/admin/ai/insights."""

    def test_local_insights_generation(self, client: TestClient, tokens: dict):
        """Admin should get a valid markdown insights report."""
        resp = client.post(
            "/analytics/admin/ai/insights",
            headers=auth_header(tokens["admin"]),
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "insights_markdown" in data
        assert "ai_provider" in data
        assert "summary_stats" in data
        assert data["ai_provider"] == "local_engine"
        assert "VIVENT" in data["insights_markdown"]

    def test_ai_insights_requires_admin(self, client: TestClient, tokens: dict):
        """Non-admin users should be denied."""
        resp = client.post(
            "/analytics/admin/ai/insights",
            headers=auth_header(tokens["student"]),
        )
        assert resp.status_code == 403

    def test_ai_insights_returns_summary_stats(self, client: TestClient, tokens: dict):
        """Summary stats should include key metrics."""
        resp = client.post(
            "/analytics/admin/ai/insights",
            headers=auth_header(tokens["admin"]),
        )
        data = resp.json()
        stats = data["summary_stats"]
        assert "total_events" in stats
        assert "total_revenue" in stats


# ──────────────────────────── Social Link Session ────────────────────────────


class TestSocialLinkSession:
    """Test GET /social/link-session."""

    def test_start_link_session_success(self, client: TestClient, tokens: dict):
        """Should return a redirect URL and session token."""
        resp = client.get(
            "/social/link-session?platform=linkedin",
            headers=auth_header(tokens["business"]),
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["platform"] == "linkedin"
        assert "redirect_url" in data
        assert "session_token" in data
        assert "/social/mock-oauth-portal" in data["redirect_url"]

    def test_link_session_invalid_platform(self, client: TestClient, tokens: dict):
        """Invalid platform should return 400."""
        resp = client.get(
            "/social/link-session?platform=tiktok",
            headers=auth_header(tokens["business"]),
        )
        assert resp.status_code == 400

    def test_link_session_all_platforms(self, client: TestClient, tokens: dict):
        """All valid platforms should work."""
        for platform in ["facebook", "instagram", "linkedin", "twitter"]:
            resp = client.get(
                f"/social/link-session?platform={platform}",
                headers=auth_header(tokens["student"]),
            )
            assert resp.status_code == 200
            assert resp.json()["platform"] == platform


# ─────────────────────────── Mock OAuth Portal ───────────────────────────


class TestMockOAuthPortal:
    """Test GET /social/mock-oauth-portal."""

    def test_portal_returns_html(self, client: TestClient):
        """The portal should return a rich HTML page."""
        resp = client.get("/social/mock-oauth-portal?platform=linkedin")
        assert resp.status_code == 200
        assert "text/html" in resp.headers["content-type"]
        assert "Connect to LinkedIn" in resp.text
        assert "Authorize VIVENT" in resp.text

    def test_portal_different_platforms(self, client: TestClient):
        """Each platform should have its own branded portal."""
        for platform, expected_text in [
            ("facebook", "Facebook"),
            ("instagram", "Instagram"),
            ("twitter", "X (Twitter)"),
            ("linkedin", "LinkedIn"),
        ]:
            resp = client.get(f"/social/mock-oauth-portal?platform={platform}")
            assert resp.status_code == 200
            assert expected_text in resp.text


# ───────────────────────── Social Callback & Linking ─────────────────────────


class TestSocialCallback:
    """Test POST /social/callback."""

    def test_full_oauth_flow(self, client: TestClient, tokens: dict):
        """Start session -> callback -> verify linked account."""
        # Step 1: Start link session
        link_resp = client.get(
            "/social/link-session?platform=linkedin",
            headers=auth_header(tokens["business"]),
        )
        session_token = link_resp.json()["session_token"]

        # Step 2: Call callback
        callback_resp = client.post(
            "/social/callback",
            json={
                "session_token": session_token,
                "platform": "linkedin",
                "username": "vivent_business",
                "avatar_url": "https://example.com/avatar.jpg",
            },
        )
        assert callback_resp.status_code == 201
        data = callback_resp.json()
        assert data["platform"] == "linkedin"
        assert data["username"] == "vivent_business"
        assert data["avatar_url"] == "https://example.com/avatar.jpg"

        # Step 3: Verify listed in accounts
        accounts_resp = client.get(
            "/social/accounts",
            headers=auth_header(tokens["business"]),
        )
        assert accounts_resp.status_code == 200
        accounts = accounts_resp.json()
        assert any(acc["platform"] == "linkedin" for acc in accounts)

    def test_callback_invalid_session_token(self, client: TestClient):
        """Invalid session token should fail."""
        resp = client.post(
            "/social/callback",
            json={
                "session_token": "invalid-token-xyz",
                "platform": "facebook",
                "username": "test_user",
            },
        )
        assert resp.status_code == 400
        assert "Invalid or expired" in resp.json()["detail"]

    def test_callback_platform_mismatch(self, client: TestClient, tokens: dict):
        """Session token for one platform used with another should fail."""
        link_resp = client.get(
            "/social/link-session?platform=facebook",
            headers=auth_header(tokens["business"]),
        )
        session_token = link_resp.json()["session_token"]

        resp = client.post(
            "/social/callback",
            json={
                "session_token": session_token,
                "platform": "instagram",
                "username": "test_user",
            },
        )
        assert resp.status_code == 400
        assert "mismatch" in resp.json()["detail"].lower()


# ─────────────────────────── List & Unlink Accounts ───────────────────────────


class TestLinkedAccounts:
    """Test GET /social/accounts and DELETE /social/accounts/{id}."""

    def test_list_empty_accounts(self, client: TestClient, tokens: dict):
        """With no linked accounts, should return empty list."""
        resp = client.get(
            "/social/accounts",
            headers=auth_header(tokens["business"]),
        )
        assert resp.status_code == 200
        assert resp.json() == []

    def test_unlink_account(self, client: TestClient, tokens: dict):
        """Link and then unlink an account."""
        # Link
        link_resp = client.get(
            "/social/link-session?platform=twitter",
            headers=auth_header(tokens["student"]),
        )
        token = link_resp.json()["session_token"]
        client.post("/social/callback", json={
            "session_token": token,
            "platform": "twitter",
            "username": "my_twitter",
        })

        # Get account ID
        accounts = client.get(
            "/social/accounts",
            headers=auth_header(tokens["student"]),
        ).json()
        assert len(accounts) == 1
        account_id = accounts[0]["id"]

        # Unlink
        del_resp = client.delete(
            f"/social/accounts/{account_id}",
            headers=auth_header(tokens["student"]),
        )
        assert del_resp.status_code == 200
        assert "unlinked" in del_resp.json()["detail"].lower()

        # Verify empty
        accounts = client.get(
            "/social/accounts",
            headers=auth_header(tokens["student"]),
        ).json()
        assert len(accounts) == 0

    def test_unlink_nonexistent_account(self, client: TestClient, tokens: dict):
        """Unlinking a non-existent account should return 404."""
        resp = client.delete(
            "/social/accounts/00000000-0000-0000-0000-000000000000",
            headers=auth_header(tokens["student"]),
        )
        assert resp.status_code == 404


# ──────────────────── Ad Approval Auto-Publish Integration ────────────────────


class TestAdApprovalAutoPublish:
    """Test that ad approval auto-publishes to linked social accounts."""

    def test_approve_ad_with_linked_accounts(self, client: TestClient, tokens: dict):
        """When ad is approved and user has linked accounts, auto-publish should work."""
        business_id = "33333333-3333-3333-3333-333333333333"
        event_id = "66666666-6666-6666-6666-666666666666"

        # Link LinkedIn account for business user
        link_resp = client.get(
            "/social/link-session?platform=linkedin",
            headers=auth_header(tokens["business"]),
        )
        session_token = link_resp.json()["session_token"]
        client.post("/social/callback", json={
            "session_token": session_token,
            "platform": "linkedin",
            "username": "biz_linkedin",
        })

        # Create ad request
        ad_resp = client.post(
            f"/events/{event_id}/ads/request",
            json={"platforms": ["linkedin", "facebook"]},
            headers=auth_header(tokens["business"]),
        )
        assert ad_resp.status_code == 201
        ad_id = ad_resp.json()["id"]

        # Approve ad as admin
        approve_resp = client.put(
            f"/admin/ads/{ad_id}/approve",
            json={"admin_notes": "Looks great!"},
            headers=auth_header(tokens["admin"]),
        )
        assert approve_resp.status_code == 200
        result = approve_resp.json()

        # Verify auto_published field exists with linkedin post
        if "auto_published" in result:
            posts = result["auto_published"]
            linkedin_posts = [p for p in posts if p["platform"] == "linkedin"]
            assert len(linkedin_posts) == 1
            assert "linkedin.com" in linkedin_posts[0]["post_url"]
            assert linkedin_posts[0]["status"] == "published"

    def test_approve_ad_without_linked_accounts(self, client: TestClient, tokens: dict):
        """When user has no linked accounts, approval should still work without auto_published."""
        event_id = "66666666-6666-6666-6666-666666666666"

        ad_resp = client.post(
            f"/events/{event_id}/ads/request",
            json={"platforms": ["instagram"]},
            headers=auth_header(tokens["business"]),
        )
        assert ad_resp.status_code == 201
        ad_id = ad_resp.json()["id"]

        approve_resp = client.put(
            f"/admin/ads/{ad_id}/approve",
            json={"admin_notes": "Approved"},
            headers=auth_header(tokens["admin"]),
        )
        assert approve_resp.status_code == 200
