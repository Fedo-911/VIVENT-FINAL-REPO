# VIVENT — AI-Powered Event Management System Backend

Professional, robust, and high-fidelity FastAPI backend for the **VIVENT** platform. Features an advanced architecture utilizing a **Supabase PostgreSQL database**, JWT authentication, role-based access control (RBAC), **Google Gemini AI integrations**, mock OAuth social channels, automated campaign publishing, high-fidelity payment gateways, and aggregate analytics caching.

---

##  Table of Contents
- [ Architecture & Overview](#-architecture--overview)
- [ Tech Stack](#️-tech-stack)
- [ Key Subsystems & Features](#-key-subsystems--features)
- [ Project Directory Structure](#-project-directory-structure)
- [ Environment Variables](#-environment-variables)
- [ Database Setup & Schema](#-database-setup--schema)
- [ Installation & Local Run Guide](#-installation--local-run-guide)
- [ Complete API Routing Reference](#-complete-api-routing-reference)
- [ Automated Test Suite](#-automated-test-suite)
- [ Security & Production Guidelines](#-security--production-guidelines)

---

##  Architecture & Overview

VIVENT is a comprehensive event lifecycle management platform designed with distinct access structures for three core user personas:
* **Admin**: System moderation, sponsor plan management, event approvals, ad campaign verification, system audit logs, and AI-powered platform analytics.
* **Business Users (Sponsors/Organizers)**: Create events, link professional social media channels, track registrations, and access financial revenue dashboards.
* **Student Users (Attendees)**: Browse events, register for events, complete secure card payments, participate in discussion forums, and track registered events.

The backend is built around a secure REST architecture enforcing strict role boundaries (`admin`, `business`, `student`) through FastAPI dependencies, communicating directly with a Supabase PostgreSQL backend.

---

##  Tech Stack

* **Core Framework**: FastAPI (Python `3.10.11`) with Uvicorn dev server.
* **Data Model & Validation**: Pydantic v2.
* **Database & Auth Integration**: Supabase Python Client (PostgREST integration).
* **AI Engine**: Google Gemini API via official `google-generativeai` with a local fallback copywriting processor.
* **Cryptography & Security**: `python-jwt` + `passlib` (bcrypt) for robust hash and claim verification.
* **Billing Gateway**: High-fidelity simulated Stripe checkout gateway.
* **Testing Framework**: Pytest suite utilizing comprehensive unit mocks.

---

##  Key Subsystems & Features

### 1.  AI Event Copilot (`/events/ai`)
* **Feature**: Provides copywriting support for event organizers during draft creation.
* **Implementation**: Accepts raw bullet notes and applies **Google Gemini AI** to generate polished marketing titles, descriptions, punchy taglines, and hourly agendas. Falls back to a local pattern-based copywriter if the API key is not configured.

### 2.  Social Media OAuth Account Linking (`/social`)
* **Feature**: Enables organizers to connect their professional channels (LinkedIn, Facebook, Instagram, X/Twitter).
* **Implementation**: Generates secure linking sessions that redirect the user to a premium, interactive mock OAuth consent portal. When accepted, it records secure access tokens and profile handles in the `linked_social_accounts` schema.

### 3.  Ad Approval & Auto-Publishing (`/ads`, `/admin/ads`)
* **Feature**: Simplifies marketing by automating posts to social channels upon event promotion approval.
* **Implementation**: When an admin approves an ad request, the system checks the owner's linked accounts. If a connected channel matches, it automatically posts the event campaign and returns active post links (e.g., simulated LinkedIn, Facebook, and Instagram feed URLs).

### 4.  High-Fidelity Stripe Simulator (`/payments`)
* **Feature**: Provides real-world billing simulation without incurring actual credit card charges.
* **Implementation**: Generates simulated Stripe Checkout session sessions. paste the URL in a browser to use the interactive payment checkout portal, complete with card entry forms, spinner states, and dynamic webhook generators (`POST /payments/stripe/webhook`).

### 5. Advanced Analytics Caching (`/analytics`)
* **Feature**: High-speed metrics delivery protecting primary tables from slow aggregate scans.
* **Implementation**: Built with a dedicated `analytics_cache` Supabase table.
  - Supports live computing fallbacks and automated database cache workers.
  - The admin dashboard (`GET /analytics/admin/dashboard`) slice-scales chart metrics dynamically based on a `days` query parameter (e.g., showing `7`, `14`, or `30` days) to keep dashboard renders fast.
  - Includes **AI Admin Insights** (`POST /analytics/admin/ai/insights`) using Gemini to audit live dashboard metrics and generate growth recommendations.

---

##  Project Directory Structure

```text
BACKEND/
├── routers/                    # FastAPI Endpoints separated by domains
│   ├── admin_events.py         # Event moderation controls
│   ├── ads.py                  # Ad request creation and admin approvals
│   ├── analytics.py            # Cached dashboards & AI insights
│   ├── auth.py                 # Register, login, and token generation
│   ├── discussions.py          # Attendee discussion boards
│   ├── events.py               # Event management & AI event copilot
│   ├── notifications.py        # User notifications inbox
│   ├── payments.py             # Checkout gateway and webhooks
│   ├── plans.py                # Sponsor package configurations
│   ├── records.py              # Financial audit trails and event registries
│   ├── registrations.py        # Event attendee list controls
│   ├── social.py               # Social OAuth links & mock portals
│   └── users.py                # User profile overrides
│
├── schemas/                    # Pydantic validation schemas
│   ├── ai.py                   # AI copywriting request validation
│   ├── social.py               # Social session and callback structures
│   └── ...                     # Core domain validation models
│
├── utils/                      # Helper scripts and core logic
│   ├── ai_services.py          # Gemini AI connector and templates
│   ├── cache_worker.py         # Metrics aggregator and database cacher
│   └── helpers.py              # RBAC dependencies, time parsers, and email lookups
│
├── main.py                     # App startup, middleware, and router mounting
├── config.py                   # Environment variable mappings
├── supabase_client.py          # Core Supabase client setup
├── schema.sql                  # PostgreSQL database schemas, constraints, and index seeding
├── seed.py                     # Initial seed for administrative access & core pricing plans
├── requirements.txt            # Python packages manifest
├── .env.example                # Sample environment configurations
└── tests/                      # Extensive test suites (unit + integration mocks)
```

---

##  Environment Variables

To run the backend, create a `.env` file in the root `BACKEND` directory matching these settings:

```env
# Application Settings
APP_NAME="VIVENT Event Management System"
APP_VERSION=1.0.0

# Database & Storage (Supabase)
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SECRET_KEY=your-supabase-service-role-jwt-key # DO NOT use anon key

# Authentication Credentials
JWT_SECRET=generate-a-long-cryptographically-secure-random-string
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_HOURS=24
CORS_ALLOW_ORIGINS=*

# AI Copilot Integration
GEMINI_API_KEY=your-google-gemini-api-key # Optional. If omitted, local copywriting fallback is active
```

---

##  Database Setup & Schema

1. Log in to your **Supabase Dashboard** and navigate to your project.
2. Select the **SQL Editor** from the left panel.
3. Copy the contents of [schema.sql](file:///C:/Users/G%20L%20%20B/Desktop/VIVENT/Vivent-Backend/BACKEND/schema.sql) and paste them into a new query window.
4. Click **Run** to provision all system tables, foreign key constraints, default cascade deletes, and security permissions.
5. If tables already existed, ensure the `GRANT` statements at the bottom of the SQL script are run to authorize the service role key.

---

##  Installation & Local Run Guide

### 1. Provision Virtual Environment
```bash
# Navigate to the backend directory
cd C:\Users\G L  B\Desktop\VIVENT\Vivent-Backend\BACKEND

# Create Python environment
python -m venv venv

# Activate on Windows Powershell
.\venv\Scripts\Activate.ps1
```

### 2. Install Packages
```bash
pip install -r requirements.txt
```

### 3. Seed Pricing Plans & Admin Account
```bash
python seed.py
```
This setups the core database rows:
* Admin User: `admin@vivent.com` / `Admin123!`
* Pricing Plans: `Basic` ($99.00), `Normal` ($199.00), `Premium` ($299.00)

### 4. Boot Dev Server
```bash
uvicorn main:app --reload
```
Navigate your browser to `http://127.0.0.1:8000/docs` to open the **Swagger UI Interactive Portal**!

---

## 🗺️ Complete API Routing Reference

###  Authentication & User Profiles
* `POST /auth/register` — Create new accounts (`student` or `business`).
* `POST /auth/login` — Exchange credentials for a secure JWT bearer token.
* `GET /auth/me` — Read the authenticated user's profile metadata.
* `PATCH /users/{id}` — Modify individual profile info (e.g., name or avatar).
* `GET /users` — List all registered users (Admin privilege required).

###  AI Event Copilot
* `POST /events/ai/generate-description` — Draft polished marketing text, taglines, and event agendas from raw bullet notes using Google Gemini.

###  Event Management
* `POST /events` — Business users create a new event (starts in `pending` state).
* `GET /events` — Query and paginate active events. Supports filters by category and dates.
* `GET /events/{id}` — Fetch detailed info for a single event (includes registration & discussion counts).
* `PATCH /events/{id}` — Edit event specifics (location, description, dates).
* `DELETE /events/{id}` — Remove an event and cascade-delete registrations.

###  Admin Event Controls
* `GET /admin/events/pending` — Lists all pending events awaiting review.
* `PUT /admin/events/{event_id}/approve` — Mark event as approved (makes it publicly visible).
* `PUT /admin/events/{event_id}/reject` — Reject a pending event request.

###  Social Media Account Linking
* `GET /social/link-session` — Start a linking session for `linkedin`, `facebook`, `instagram`, or `twitter`.
* `GET /social/mock-oauth-portal` — Visually log in via a premium simulated OAuth portal.
* `POST /social/callback` — Securely write verified social credentials back to the database.
* `GET /social/accounts` — View linked social media accounts for the current user.
* `DELETE /social/accounts/{id}` — Revoke access and unlink a social account.

###  Event Registrations
* `POST /events/{event_id}/register` — Register as an attendee for an approved event.
* `GET /events/{event_id}/registrations` — Query registered participants for an event.

###  Stripe Simulator Billing
* `POST /payments/stripe/create-checkout-session` — Initialize plan purchasing and receive a simulated Stripe portal redirect URL.
* `POST /payments/stripe/webhook` — Process checkout callbacks to automatically authorize plan sponsorship.
* `GET /payments/user` — Read transaction histories for the logged-in user.
* `GET /payments/event/{event_id}` — View payment logs associated with a specific event.

###  Social Ads & Campaign Approvals
* `POST /events/{event_id}/ads/request` — Request social platform ad campaigns.
* `GET /ads/requests` — Review the system-wide ad queue (Admin only).
* `PUT /admin/ads/{ad_id}/approve` — Approve ad request. **Triggers automated publishing** to the organizer's linked social media feeds.
* `PUT /admin/ads/{ad_id}/reject` — Reject ad campaign. Requires detailed admin notes.

###  Discussions Board
* `POST /events/{event_id}/discussions` — Post messages to the event discussion wall.
* `GET /events/{event_id}/discussions` — Fetch chronologically ordered discussion posts.

###  User Notifications
* `GET /notifications` — Fetch user inbox messages (e.g. ad approval status).
* `PUT /notifications/{id}/read` — Acknowledge and mark a notification as read.

###  Analytics Dashboards & AI Insights
* `GET /analytics/student/dashboard` — Personal dashboard metrics for attendees.
* `GET /analytics/business/dashboard` — Revenue tracking and participant metrics for organizers.
* `GET /analytics/admin/dashboard` — System-wide analytics cache. The metrics slice can be scaled dynamically using the `days` parameter (e.g., `days=7`, `days=30`).
* `POST /analytics/admin/dashboard/refresh` — Invalidate cache and run an on-demand aggregate rebuild.
* `POST /analytics/admin/ai/insights` — Run **Google Gemini** against live dashboard databases to generate strategic marketing reports.

---

##  Automated Test Suite

VIVENT includes a robust testing framework built on **Pytest**. It simulates database interactions via high-fidelity Supabase mock units.

### Run All Tests
```bash
pytest tests/ -v
```

### Key Test Categories
* `tests/test_ai_social.py` — Verifies Google Gemini copywriting, AI dashboard insights, OAuth portals, and automated campaign publishing.
* `tests/test_analytics.py` — Validates caching limits and date-slice logic.
* `tests/test_payments.py` — Validates mock Stripe transactions and webhook sync.

---

## Security & Production Guidelines

1. **Keep Secrets Secret**: Never commit your `.env` file to version control.
2. **Supabase Key Isolation**: Always use `SUPABASE_SECRET_KEY` on the backend and keep it hidden from frontend clients.
3. **Change Admin Credentials**: Use the Swagger console to update the default `admin@vivent.com` password (`Admin123!`) before deployment.
4. **HTTPS Enforcement**: Ensure the hosting environment redirects all HTTP requests to secure HTTPS endpoints to safeguard active JWT tokens in transit.
