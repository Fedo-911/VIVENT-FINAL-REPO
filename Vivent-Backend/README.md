# VIVENT Backend Documentation

## Backend Overview

The VIVENT backend is the API and data-access layer for the VIVENT Event Management System. It serves the React frontend by handling authentication, role-based authorization, event management, registrations, payments, notifications, analytics, social media promotion workflows, user records, and subscription plan selection.

The backend is built with FastAPI and is organized around domain-specific routers. Each router owns one functional area, such as authentication, events, payments, analytics, or social account linking. Request and response validation is handled with Pydantic schemas, while persistence is handled through the Supabase Python client against a Supabase PostgreSQL database.

At runtime, `main.py` creates the FastAPI application, configures CORS, registers all routers, validates Supabase connectivity on startup, starts the analytics cache worker, and exposes a root healthcheck endpoint. The backend expects a service-role or secret Supabase key because it performs server-side database operations directly.

## Tech Stack

| Component | Technology |
| --- | --- |
| Framework | FastAPI |
| ASGI Server / Deployment | Uvicorn (`uvicorn main:app --reload`) |
| Database | Supabase PostgreSQL via `supabase` Python client and PostgREST |
| Authentication | Email/password login, bcrypt password hashing, JWT bearer tokens |
| Authorization | FastAPI dependencies with role checks for `admin`, `student`, and `business` |
| Validation | Pydantic v2 schemas |
| Testing | Pytest, FastAPI `TestClient`, mocked Supabase client |
| Environment Management | `python-dotenv` and `.env.example` |
| External/Mock Integrations | Gemini-compatible AI helper, mock Stripe checkout, mock social OAuth |

## Project Structure

```text
Vivent-Backend/
|
├── routers/
|   ├── admin_events.py       # Admin event approval and rejection
|   ├── ads.py                # Social media ad requests and admin review
|   ├── analytics.py          # Admin, student, and business dashboards
|   ├── auth.py               # Register, login, current user, logout
|   ├── discussions.py        # Event discussion messages
|   ├── events.py             # Event CRUD and AI description generation
|   ├── notifications.py      # User notification inbox
|   ├── payments.py           # Simulated payments and mock Stripe checkout
|   ├── plans.py              # Pricing/promotion plan management
|   ├── records.py            # Event records and financial records
|   ├── registrations.py      # Event registration and attendee listing
|   ├── social.py             # Mock social account linking
|   ├── subscriptions.py      # User plan subscriptions
|   └── users.py              # User listing and profile updates
|
├── schemas/
|   ├── auth.py               # Register/login/token models
|   ├── events.py             # Event create/update/output models
|   ├── payments.py           # Payment and Stripe session models
|   ├── subscriptions.py      # Subscription and embedded plan models
|   └── ...                   # Domain schemas for each router
|
├── utils/
|   ├── ai_services.py        # Gemini call helper and local AI fallbacks
|   ├── cache_worker.py       # Admin analytics aggregation/cache worker
|   ├── helpers.py            # Shared validators, access checks, notifications
|   ├── jwt_handler.py        # JWT creation and decoding
|   └── passwords.py          # bcrypt password hashing and verification
|
├── tests/
|   ├── conftest.py           # Fake Supabase, fixtures, auth tokens
|   ├── test_api_smoke.py     # Core API smoke and access-control tests
|   ├── test_ai_social.py     # AI and social linking tests
|   ├── test_analytics_cache.py
|   └── test_payments_stripe.py
|
├── config.py                 # Settings loaded from environment variables
├── dependencies.py           # Auth dependencies and role guards
├── main.py                   # FastAPI app setup, middleware, routers, handlers
├── requirements.txt          # Python package list
├── schema.sql                # Supabase PostgreSQL schema and grants
├── seed.py                   # Default admin and plan seeder
├── seed_mock_data.py         # Demo users, events, registrations, payments
└── supabase_client.py        # Supabase client setup and backend key validation
```

## API Architecture

The API is organized by router modules under `routers/`. `main.py` imports and mounts each router with `app.include_router(...)`. Some routers define their own prefix, such as `/auth`, `/users`, `/events`, `/plans`, `/payments`, `/analytics`, `/records`, `/social`, and `/subscriptions`. Other routers expose nested event/admin paths directly, such as `/events/{event_id}/register` and `/admin/ads/{ad_id}/approve`.

The request flow is:

```text
Client -> FastAPI router -> Pydantic validation -> dependency checks -> business logic -> Supabase -> response model
```

FastAPI validates incoming JSON using schemas such as `RegisterRequest`, `EventCreate`, `PaymentInitiate`, `AdRequestCreate`, and `SubscriptionCreate`. Protected endpoints use `get_current_user` or `require_roles(...)`. Business logic then reads or writes Supabase tables. Responses are shaped by `response_model` declarations, such as `UserOut`, `EventOut`, `PaymentOut`, and dashboard response models.

Error handling includes router-level `HTTPException` usage for invalid credentials, forbidden access, missing records, invalid state transitions, and bad input. `main.py` also defines global handlers for Supabase `APIError` and `httpx.ConnectError`, returning cleaner JSON errors for database permission and connectivity failures.

## Database Design

The database schema is defined in `schema.sql`. It enables the `pgcrypto` extension, creates a shared `set_updated_at()` trigger function, creates tables, attaches update triggers, and grants privileges to the Supabase `service_role`.

| Table | Primary Key | Foreign Keys / Relationships | Purpose |
| --- | --- | --- | --- |
| `users` | `id uuid` | Referenced by events, registrations, payments, discussions, ads, notifications, subscriptions, linked accounts | Stores email, hashed password, full name, role, and active status. |
| `plans` | `id uuid` | Referenced by `events.plan_id` and `user_subscriptions.plan_id` | Stores Basic, Normal, and Premium plan details with price and facilities JSON. |
| `user_subscriptions` | `id uuid` | `user_id -> users.id`, `plan_id -> plans.id` | Stores active/cancelled user plan subscriptions. A partial unique index enforces one active subscription per user. |
| `events` | `id uuid` | `created_by -> users.id`, `approved_by -> users.id`, `plan_id -> plans.id` | Stores event details, status, category, dates, location, capacity, and approval metadata. |
| `event_registrations` | `id uuid` | `user_id -> users.id`, `event_id -> events.id` | Stores event registrations, role at event, payment status, and payment reference. Unique per user/event. |
| `payments` | `id uuid` | `user_id -> users.id`, `event_id -> events.id` | Stores transaction amount, status, transaction id, and payment method. |
| `discussions` | `id uuid` | `event_id -> events.id`, `user_id -> users.id` | Stores event discussion messages. |
| `social_media_ads` | `id uuid` | `event_id -> events.id`, `requested_by -> users.id` | Stores social media promotion requests and admin review status. |
| `notifications` | `id uuid` | `user_id -> users.id` | Stores user notifications and read status. |
| `analytics_cache` | `id uuid` | None | Stores precomputed dashboard metrics by metric name. |
| `linked_social_accounts` | `id uuid` | `user_id -> users.id` | Stores mock linked social accounts, platform, username, avatar URL, and token. |

The schema uses check constraints for roles, event categories, event statuses, payment statuses, ad statuses, social platforms, and subscription statuses.

## Authentication & Authorization

Authentication is implemented in `routers/auth.py`, `utils/passwords.py`, `utils/jwt_handler.py`, and `dependencies.py`.

Registration uses `POST /auth/register`. The backend validates role values through `validate_role`, normalizes email addresses, checks duplicate users with Supabase, hashes passwords with bcrypt, and inserts a user row. Only `student` and `business` roles are accepted by the public registration helper.

Login uses `POST /auth/login`. The backend finds the user by normalized email, verifies the bcrypt password hash, rejects inactive users, and returns a signed JWT. Token payloads include `sub`, `role`, `email`, `exp`, and `iat`. Expiry is controlled by `ACCESS_TOKEN_EXPIRE_HOURS`.

Protected routes use `HTTPBearer`. `get_current_user` decodes the token, loads the user from Supabase, and rejects missing or inactive accounts. `require_roles(...)` allows admins universally and otherwise checks the current user's role. `require_self_or_admin` protects profile access so users can only access themselves unless they are admins.

Session storage is client-side: the backend returns a bearer token and the frontend sends it in the `Authorization` header.

## API Endpoints

| Router | Endpoint | Method | Purpose |
| --- | --- | --- | --- |
| Health | `/` | GET | Return backend status and startup warning. |
| Auth | `/auth/register` | POST | Register a student or business user. |
| Auth | `/auth/login` | POST | Authenticate and return JWT token. |
| Auth | `/auth/me` | GET | Return current authenticated user. |
| Auth | `/auth/logout` | POST | Client-side logout placeholder response. |
| Users | `/users` | GET | List all users; admin only. |
| Users | `/users/{user_id}` | GET | Get own user profile or any profile as admin. |
| Users | `/users/{user_id}` | PATCH | Update profile, password, or admin-controlled active status. |
| Events | `/events/ai/generate-description` | POST | Generate event copy through Gemini or local fallback. |
| Events | `/events` | POST | Create pending event; student/business. |
| Events | `/events` | GET | List events with category/status/date/plan filters and pagination. |
| Events | `/events/{event_id}` | GET | Get event detail with discussion and registration counts. |
| Events | `/events/{event_id}` | PATCH | Update event as creator or admin. |
| Events | `/events/{event_id}` | DELETE | Delete event as creator or admin. |
| Admin Events | `/admin/events/pending` | GET | List pending events; admin only. |
| Admin Events | `/admin/events/{event_id}/approve` | PUT | Approve event and notify creator. |
| Admin Events | `/admin/events/{event_id}/reject` | PUT | Reject event with reason and notify creator. |
| Plans | `/plans` | GET | List active plans. |
| Plans | `/plans` | POST | Create plan; admin only. |
| Plans | `/plans/{plan_id}` | PATCH | Update plan; admin only. |
| Plans | `/plans/{plan_id}` | DELETE | Soft-delete plan by setting `is_active=false`; admin only. |
| Registrations | `/events/{event_id}/register` | POST | Register current student/business user for approved event. |
| Registrations | `/events/{event_id}/registrations` | GET | List event registrations for admin or event creator. |
| Payments | `/payments/initiate` | POST | Simulate completed payment for current user. |
| Payments | `/payments/user` | GET | List current user's payments. |
| Payments | `/payments/event/{event_id}` | GET | List event payments for admin or event creator. |
| Payments | `/payments/stripe/create-checkout-session` | POST | Create mock Stripe checkout session. |
| Payments | `/payments/stripe/mock-checkout` | GET | Serve mock checkout HTML page. |
| Payments | `/payments/stripe/webhook` | POST | Process mock checkout completion webhook. |
| Ads | `/events/{event_id}/ads/request` | POST | Request social media promotion for an event. |
| Ads | `/ads/requests` | GET | List all ad requests; admin only. |
| Ads | `/admin/ads/{ad_id}/approve` | PUT | Approve ad request and simulate publishing to linked accounts. |
| Ads | `/admin/ads/{ad_id}/reject` | PUT | Reject ad request with admin notes. |
| Discussions | `/events/{event_id}/discussions` | GET | List event discussion messages. |
| Discussions | `/events/{event_id}/discussions` | POST | Post event discussion message. |
| Notifications | `/notifications` | GET | List current user's notifications, optionally filtered by read status. |
| Notifications | `/notifications/{notif_id}/read` | PUT | Mark notification as read. |
| Analytics | `/analytics/admin/dashboard` | GET | Return cached or live admin metrics; admin only. |
| Analytics | `/analytics/admin/dashboard/refresh` | POST | Force recompute admin dashboard cache; admin only. |
| Analytics | `/analytics/student/dashboard` | GET | Return student registrations, pending payments, and upcoming events. |
| Analytics | `/analytics/business/dashboard` | GET | Return business events, registration counts, and revenue per event. |
| Analytics | `/analytics/admin/ai/insights` | POST | Generate AI/admin insights from live metrics; admin only. |
| Records | `/records/my-events` | GET | Return current and past events for current user role. |
| Records | `/records/financial` | GET | Return payment history, or all payments for admin. |
| Social | `/social/link-session` | GET | Start mock OAuth link session for supported platform. |
| Social | `/social/mock-oauth-portal` | GET | Serve mock OAuth portal HTML. |
| Social | `/social/callback` | POST | Link or update social account after mock OAuth session. |
| Social | `/social/accounts` | GET | List current user's linked social accounts. |
| Social | `/social/accounts/{account_id}` | DELETE | Unlink social account owned by user or admin. |
| Subscriptions | `/subscriptions/me` | GET | Return current user's active subscription with plan details. |
| Subscriptions | `/subscriptions` | POST | Subscribe, upgrade, or downgrade current user's plan. |
| Subscriptions | `/subscriptions/cancel` | PATCH | Cancel current user's active subscription. |

## Validation Layer

Schemas in `schemas/` define request and response contracts. Examples include:

- `RegisterRequest`: validates email, minimum password length, full name length, and role field.
- `EventCreate` and `EventUpdate`: validate title, description, max participants, dates, category, and plan references.
- `PaymentInitiate`: requires positive payment amounts using `Decimal`.
- `DiscussionCreate`: limits messages to 1-5000 characters.
- `AdRequestCreate`: requires at least one platform.
- `SocialCallbackRequest`: validates session token, platform, username, and optional avatar URL.
- `SubscriptionCreate`: requires a `plan_id`.

Additional validation happens in `utils/helpers.py`, including allowed event categories, statuses, roles, plan activity, social ad platforms, ownership checks, and registered-or-privileged access checks.

## Environment Variables

| Variable | Description |
| --- | --- |
| `APP_NAME` | FastAPI application title. |
| `APP_VERSION` | API version shown in FastAPI metadata. |
| `SUPABASE_URL` | Supabase project URL. |
| `SUPABASE_SECRET_KEY` | Preferred backend Supabase secret key. |
| `SUPABASE_SERVICE_ROLE_KEY` | Legacy fallback service-role key. |
| `SUPABASE_KEY` | Legacy fallback key name. |
| `JWT_SECRET` | Secret used to sign JWT tokens. |
| `JWT_ALGORITHM` | JWT algorithm, default `HS256`. |
| `ACCESS_TOKEN_EXPIRE_HOURS` | Token expiry duration in hours. |
| `CORS_ALLOW_ORIGINS` | Comma-separated allowed origins or `*`. |
| `ZOOM_CLIENT_ID` | Reserved Zoom OAuth value present in config. |
| `ZOOM_CLIENT_SECRET` | Reserved Zoom OAuth value present in config. |
| `ZOOM_ACCOUNT_ID` | Reserved Zoom OAuth value present in config. |
| `GEMINI_API_KEY` | Optional setting used by `utils.ai_services`; not included in `.env.example`. |

Never commit real secrets. `supabase_client.py` rejects publishable Supabase keys and expects a backend secret/service-role key.

## Installation

```bash
git clone <repo>
cd Vivent-Backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

Create `.env` from `.env.example`, fill in Supabase and JWT values, then apply `schema.sql` in the Supabase SQL editor.

Seed default data:

```bash
python seed.py
```

`seed.py` creates the default plans `Basic`, `Normal`, and `Premium`, plus the admin user `admin@vivent.com` with password `Admin123!` if missing. `seed_mock_data.py` can add demo students, businesses, events, registrations, and payments.

## Running Backend

```bash
uvicorn main:app --reload
```

Local endpoints:

- API root: `http://127.0.0.1:8000/`
- Swagger UI: `http://127.0.0.1:8000/docs`
- OpenAPI JSON: `http://127.0.0.1:8000/openapi.json`

## Testing

Run tests from the backend directory:

```bash
python -m pytest
```

The test suite uses `tests/conftest.py` to replace Supabase with an in-memory fake client. Existing tests cover authentication, users, plans, event moderation, registration, payments, discussions, ads, notifications, analytics, records, AI generation, social account linking, mock OAuth, mock Stripe checkout, webhook idempotency, and negative access-control cases.

## Security Features

- bcrypt password hashing in `utils/passwords.py`.
- JWT creation and validation in `utils/jwt_handler.py`.
- Bearer-token authentication through FastAPI `HTTPBearer`.
- Role guards through `require_roles`.
- Owner/admin checks through `require_self_or_admin` and event access helpers.
- Pydantic request validation and response models.
- Database check constraints for roles, statuses, categories, and platforms.
- Supabase backend key validation to reject publishable keys.
- Global JSON error responses for Supabase permission and connectivity failures.

## API Workflow

1. A client sends a request to a FastAPI endpoint.
2. FastAPI routes the request to the matching router function.
3. Pydantic validates body/query/path inputs.
4. Dependencies authenticate the bearer token and enforce role access.
5. Router logic validates business rules such as event status, ownership, active plans, and capacity.
6. The Supabase client reads or writes PostgreSQL data.
7. Optional helpers create notifications, update analytics cache, or simulate integrations.
8. FastAPI serializes the declared response model and returns JSON or HTML for mock portal endpoints.

## Troubleshooting

| Issue | Solution |
| --- | --- |
| `Supabase is not configured` | Set `SUPABASE_URL` and one of `SUPABASE_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, or `SUPABASE_KEY`. |
| Backend rejects Supabase key | Use a backend secret/service-role key, not an `sb_publishable` frontend key. |
| Permission denied from Supabase | Run the grants at the bottom of `schema.sql` and verify service-role access. |
| `401 Authentication credentials were not provided` | Send `Authorization: Bearer <token>` from `/auth/login`. |
| `403 permission` errors | Confirm the logged-in user's role matches the route requirements. |
| Event registration fails | Only approved events can be registered for, and capacity must not be full. |
| Stripe mock payment fails | Register for the event before creating or initiating payment. |
| Tests import the wrong path | Run `python -m pytest` from `Vivent-Backend/`. |

## Future Backend Improvements

- Add Alembic or Supabase migration versioning instead of a single schema file.
- Add refresh tokens or server-side token revocation.
- Add production Stripe integration with signed webhook verification.
- Replace mock social OAuth with real provider APIs.
- Add structured logging and request tracing.
- Add automated CI for linting, tests, and schema validation.
- Add rate limiting for authentication and payment endpoints.
- Add file storage support for CV uploads and event media.
