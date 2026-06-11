"""AI services for event description generation and admin insights analysis."""

from __future__ import annotations

import logging
import re
from collections import Counter
from decimal import Decimal
from typing import Any

import httpx

from config import settings

logger = logging.getLogger(__name__)

VALID_TONES = {"professional", "casual", "energetic"}
CATEGORY_LABELS = {
    "educational": "Educational Seminar & Workshop",
    "expo": "Exhibition & Expo",
    "food": "Food Festival & Culinary Event",
    "job_fair": "Career Fair & Recruitment Drive",
}


def _call_gemini_api(prompt: str) -> str | None:
    """Call Google Gemini API and return generated text, or None on failure."""
    api_key = settings.gemini_api_key
    if not api_key:
        return None

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={api_key}"
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.8,
            "maxOutputTokens": 1024,
        },
    }

    try:
        response = httpx.post(url, json=payload, timeout=15.0)
        if response.status_code != 200:
            logger.warning("Gemini API returned status %d: %s", response.status_code, response.text)
            return None

        data = response.json()
        candidates = data.get("candidates", [])
        if not candidates:
            logger.warning("Gemini API returned no candidates.")
            return None

        parts = candidates[0].get("content", {}).get("parts", [])
        if not parts:
            return None

        return parts[0].get("text", "")

    except Exception as exc:
        logger.error("Gemini API call failed: %s", exc, exc_info=True)
        return None


def _local_generate_description(notes: str, category: str, tone: str) -> dict:
    """Generate a structured event description using local template engine."""
    cat_label = CATEGORY_LABELS.get(category, category.replace("_", " ").title())

    # Extract key phrases from notes
    lines = [line.strip("- •*").strip() for line in notes.strip().splitlines() if line.strip()]
    key_points = lines[:6] if lines else ["An exciting upcoming event"]

    tone_adj = {
        "professional": "premier",
        "casual": "awesome",
        "energetic": "electrifying",
    }
    adj = tone_adj.get(tone, "premier")

    title = f"{cat_label}: {key_points[0][:60]}"
    description_parts = [
        f"Join us for this {adj} {cat_label.lower()} experience!",
        "",
        "**Event Highlights:**",
    ]
    for point in key_points:
        description_parts.append(f"- {point}")

    description_parts.extend([
        "",
        f"This {cat_label.lower()} promises to deliver exceptional value to all attendees. "
        "Whether you're a student exploring career opportunities, a professional looking to expand "
        "your network, or a business seeking new partnerships — there's something for everyone.",
        "",
        "Don't miss out on this incredible opportunity. Register now to secure your spot!",
    ])

    tagline_map = {
        "educational": "Learn. Grow. Excel. — Your Future Starts Here.",
        "expo": "Discover Innovation. Build Connections. Shape Tomorrow.",
        "food": "Savor Every Moment. Taste the Extraordinary.",
        "job_fair": "Your Career Awaits. Connect with Top Employers Today.",
    }
    tagline = tagline_map.get(category, f"Experience the Best of {cat_label}.")

    schedule = [
        "09:00 AM — Registration & Welcome",
        "09:30 AM — Opening Ceremony & Keynote",
        "11:00 AM — Main Sessions & Activities",
        "01:00 PM — Lunch & Networking Break",
        "02:30 PM — Workshops & Panel Discussions",
        "04:30 PM — Closing Remarks & Awards",
    ]

    return {
        "generated_title": title,
        "generated_description": "\n".join(description_parts),
        "marketing_tagline": tagline,
        "suggested_schedule": schedule,
        "ai_provider": "local_engine",
    }


def generate_ai_description(notes: str, category: str, tone: str = "professional") -> dict:
    """Generate an AI-powered event description. Uses Gemini if available, else local engine."""
    if tone not in VALID_TONES:
        tone = "professional"

    # Try Gemini first
    if settings.gemini_api_key:
        prompt = (
            f"You are a professional event copywriter for a platform called VIVENT. "
            f"Generate a compelling event listing for a '{category}' category event.\n\n"
            f"User's notes:\n{notes}\n\n"
            f"Desired tone: {tone}\n\n"
            f"Return EXACTLY in this format (use these exact headers):\n"
            f"TITLE: <a catchy event title>\n"
            f"DESCRIPTION: <a professional 3-4 paragraph description>\n"
            f"TAGLINE: <a short marketing tagline>\n"
            f"SCHEDULE:\n- <time — activity>\n- <time — activity>\n- <time — activity>\n- <time — activity>"
        )

        gemini_text = _call_gemini_api(prompt)
        if gemini_text:
            try:
                return _parse_gemini_description(gemini_text)
            except Exception:
                logger.warning("Failed to parse Gemini output, falling back to local engine.")

    return _local_generate_description(notes, category, tone)


def _parse_gemini_description(text: str) -> dict:
    """Parse the structured Gemini output into our response format."""
    title = ""
    description = ""
    tagline = ""
    schedule: list[str] = []

    title_match = re.search(r"TITLE:\s*(.+?)(?:\n|$)", text)
    if title_match:
        title = title_match.group(1).strip()

    desc_match = re.search(r"DESCRIPTION:\s*(.+?)(?:TAGLINE:|$)", text, re.DOTALL)
    if desc_match:
        description = desc_match.group(1).strip()

    tagline_match = re.search(r"TAGLINE:\s*(.+?)(?:SCHEDULE:|$)", text, re.DOTALL)
    if tagline_match:
        tagline = tagline_match.group(1).strip()

    schedule_match = re.search(r"SCHEDULE:\s*(.+)", text, re.DOTALL)
    if schedule_match:
        raw_schedule = schedule_match.group(1).strip()
        schedule = [line.strip("- ").strip() for line in raw_schedule.splitlines() if line.strip().startswith("-")]

    if not title:
        raise ValueError("Could not parse title from Gemini output.")

    return {
        "generated_title": title,
        "generated_description": description or "A premium event experience.",
        "marketing_tagline": tagline or "Experience something extraordinary.",
        "suggested_schedule": schedule or ["Schedule to be announced."],
        "ai_provider": "gemini",
    }


def _local_generate_insights(metrics: dict) -> dict:
    """Generate admin insights using local analytical templates."""
    total_events = sum(metrics.get("total_events_by_status", {}).values())
    total_revenue = float(metrics.get("total_revenue", 0))
    events_by_category = metrics.get("total_events_by_category", {})
    events_by_status = metrics.get("total_events_by_status", {})
    participation = metrics.get("participation_per_event", [])

    # Find top category
    top_category = max(events_by_category, key=events_by_category.get) if events_by_category else "N/A"
    top_category_count = events_by_category.get(top_category, 0)

    # Find most popular event
    top_event = max(participation, key=lambda x: x.get("registration_count", 0)) if participation else None
    top_event_name = top_event["title"] if top_event else "N/A"
    top_event_regs = top_event.get("registration_count", 0) if top_event else 0

    approved = events_by_status.get("approved", 0)
    pending = events_by_status.get("pending", 0)
    approval_rate = (approved / total_events * 100) if total_events > 0 else 0

    avg_revenue = total_revenue / total_events if total_events > 0 else 0

    md = f"""# 📊 VIVENT Platform Analytics Report

## Executive Summary
The platform currently hosts **{total_events} total events** generating **${total_revenue:,.2f}** in total revenue.

---

## 📈 Key Performance Indicators

| Metric | Value |
|--------|-------|
| Total Events | {total_events} |
| Total Revenue | ${total_revenue:,.2f} |
| Average Revenue per Event | ${avg_revenue:,.2f} |
| Approval Rate | {approval_rate:.1f}% |
| Pending Events | {pending} |

---

## 🏆 Top Performers

- **Most Popular Category**: {top_category.replace('_', ' ').title()} ({top_category_count} events)
- **Most Registered Event**: {top_event_name} ({top_event_regs} registrations)

---

## 📊 Category Distribution

"""
    for cat, count in sorted(events_by_category.items(), key=lambda x: x[1], reverse=True):
        bar = "█" * min(count * 3, 30)
        md += f"- **{cat.replace('_', ' ').title()}**: {count} events {bar}\n"

    md += f"""
---

## 💡 Recommendations

1. **Scale {top_category.replace('_', ' ').title()} Events**: This category leads with {top_category_count} events. Consider premium pricing tiers for this segment.
2. **Address Pending Queue**: {pending} events are awaiting approval. Faster turnaround improves user satisfaction.
3. **Revenue Optimization**: At ${avg_revenue:,.2f} per event, there's opportunity to increase monetization through premium plan upsells.
4. **Engagement Focus**: The most popular event has {top_event_regs} registrations — replicate its success factors across other events.
"""

    summary_stats = {
        "total_events": total_events,
        "total_revenue": total_revenue,
        "top_category": top_category,
        "approval_rate": round(approval_rate, 1),
        "top_event": top_event_name,
    }

    return {
        "insights_markdown": md,
        "ai_provider": "local_engine",
        "summary_stats": summary_stats,
    }


def generate_ai_admin_insights(metrics: dict) -> dict:
    """Generate AI-powered admin insights. Uses Gemini if available, else local engine."""
    if settings.gemini_api_key:
        total_events = sum(metrics.get("total_events_by_status", {}).values())
        total_revenue = float(metrics.get("total_revenue", 0))
        events_by_category = metrics.get("total_events_by_category", {})
        events_by_status = metrics.get("total_events_by_status", {})

        prompt = (
            f"You are a business intelligence analyst for VIVENT, an event management platform.\n\n"
            f"Analyze these platform metrics and provide a professional markdown report:\n\n"
            f"- Total Events: {total_events}\n"
            f"- Total Revenue: ${total_revenue:,.2f}\n"
            f"- Events by Category: {events_by_category}\n"
            f"- Events by Status: {events_by_status}\n\n"
            f"Provide: Executive Summary, KPIs table, Category Analysis, Trend Insights, "
            f"and 4+ specific actionable Recommendations. Use markdown formatting with headers, "
            f"tables, bold text, and bullet points."
        )

        gemini_text = _call_gemini_api(prompt)
        if gemini_text:
            summary_stats = {
                "total_events": total_events,
                "total_revenue": total_revenue,
                "top_category": max(events_by_category, key=events_by_category.get) if events_by_category else "N/A",
            }
            return {
                "insights_markdown": gemini_text,
                "ai_provider": "gemini",
                "summary_stats": summary_stats,
            }

    return _local_generate_insights(metrics)
