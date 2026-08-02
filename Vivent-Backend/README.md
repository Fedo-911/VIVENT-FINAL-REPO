# VIVENT Backend

The VIVENT backend is a FastAPI API for authentication, event moderation, registrations, ticket payments, dashboards, records, subscriptions, notifications, discussions, and mock social promotion workflows. It stores data in Supabase PostgreSQL through the Supabase Python client.

`main.py` creates the FastAPI app, configures CORS, mounts all routers, validates Supabase access at startup, starts the analytics cache worker, and exposes the root healthcheck endpoint.

## Tech Stack

| Area | Technology |
| --- | --- |
| API framework | FastAPI |
| Server | Uvicorn |
| Data validation | Pydantic v2 |
| Database | Supabase PostgreSQL via `supabase` and PostgREST |
| Auth | bcrypt password hashing and JWT bearer tokens |
| Tests | Pytest and FastAPI TestClient |
| Config | `python-dotenv` and environment variables |
| Integrations | Gemini-compatible AI helper, mock Stripe checkout, mock social OAuth |

## Folder Structure

```text
Vivent-Backend/
|-- README.md
|-- .env.example
|-- main.py
|-- config.py
|-- dependencies.py
|-- supabase_client.py
|-- schema.sql
|-- seed.py
|-- seed_mock_data.py
|-- requirements.txt
|-- routers/
|   |-- admin_events.py
|   |-- ads.py
|   |-- analytics.py
|   |-- auth.py
|   |-- discussions.py
|   |-- events.py
|   |-- notifications.py
|   |-- payments.py
|   |-- plans.py
|   |-- records.py
|   |-- registrations.py
|   |-- social.py
|   |-- subscriptions.py
|   `-- users.py
|-- schemas/
|-- tests/
`-- utils/
```

Generated directories such as `.pytest_cache`, `__pycache__`, and the checked-in `Vivent/` virtual environment are not part of the source architecture.

## Configuration

Create `Vivent-Backend/.env` from `.env.example`.

| Variable | Required | Description |
| --- | --- | --- |
| `APP_NAME` | No | FastAPI title. Defaults to `VIVENT Event Management System`. |
| `APP_VERSION` | No | API version. Defaults to `1.0.0`. |
| `SUPABASE_URL` | Yes | Supabase project URL. |
| `SUPABASE_SECRET_KEY` | Yes, preferred | Backend Supabase secret key. |
| `SUPABASE_SERVICE_ROLE_KEY` | Fallback | Legacy backend service-role key name. |
| `SUPABASE_KEY` | Fallback | Legacy backend service-role key name. |
| `JWT_SECRET` | Yes | JWT signing key. |
| `JWT_ALGORITHM` | No | Defaults to `HS256`. |
| `ACCESS_TOKEN_EXPIRE_HOURS` | No | Defaults to `24`. |
| `CORS_ALLOW_ORIGINS` | No | Comma-separated origins or `*`. |
| `ZOOM_CLIENT_ID` | No | Present in settings; no active route currently uses it. |
| `ZOOM_CLIENT_SECRET` | No | Present in settings; no active route currently uses it. |
| `ZOOM_ACCOUNT_ID` | No | Present in settings; no active route currently uses it. |
| `GEMINI_API_KEY` | No | Enables Gemini-backed AI output. Local fallback is used when unset. |

`supabase_client.py` rejects publishable Supabase keys. Use a backend secret/service-role key on the server only.

## Installation

```bash
cd Vivent-Backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

Apply `schema.sql` in the Supabase SQL editor before running the app against a fresh project.

Seed default plans and the default admin account:

```bash
python seed.py
```

`seed.py` creates:

- Plans: `Basic`, `Normal`, `Premium`
- Admin: `admin@vivent.com` with password `Admin123!`

`seed_mock_data.py` can add demo data for local development.

## Running Locally

```bash
uvicorn main:app --reload
```

Local URLs:

- API root: `http://127.0.0.1:8000/`
- Swagger UI: `http://127.0.0.1:8000/docs`
- OpenAPI JSON: `http://127.0.0.1:8000/openapi.json`

The private admin login endpoint is excluded from public OpenAPI docs.

## Available Commands

| Command | Purpose |
| --- | --- |
| `uvicorn main:app --reload` | Run the backend locally. |
| `python seed.py` | Seed default plans and default admin. |
| `python seed_mock_data.py` | Seed demo users, events, registrations, and payments. |
| `python -m pytest` | Run backend tests. |
| `pip install -r requirements.txt` | Install backend dependencies. |

## Database Schema

The canonical schema is [schema.sql](./schema.sql).

| Table | Purpose |
| --- | --- |
| `users` | App users, bcrypt hashes, role, and active flag. |
| `plans` | Basic/Normal/Premium plans and JSON facilities. |
| `user_subscriptions` | Active or cancelled user plan subscriptions. |
| `pending_events` | Event submissions waiting for admin moderation. |
| `events` | Approved or completed public events. |
| `event_registrations` | User/event registrations with payment status. |
| `payments` | Completed/failed/pending mock payment ledger. |
| `discussions` | Event discussion messages. |
| `social_media_ads` | Promotion requests and admin decisions. |
| `notifications` | User notifications. |
| `analytics_cache` | Cached admin dashboard metrics. |
| `linked_social_accounts` | Mock linked social accounts. |

Important schema behavior:

- `pending_events` stores submitted events with `status = pending`.
- `events` allows only `approved` and `completed` statuses.
- RLS is enabled across application tables.
- Policies restrict users to their own records, event owners, or admins.
- `prevent_user_role_escalation()` blocks non-admin role changes.
- A partial unique index enforces one active subscription per user.
- Event registrations are unique per user/event.

No Supabase Storage buckets are defined in the schema.

## Authentication and Authorization

Public registration:

- `POST /auth/register`
- Accepts only `student` and `business`.
- Normalizes email, checks duplicates, hashes passwords with bcrypt, and inserts a `users` row.

Public login:

- `POST /auth/login`
- Accepts student/business accounts only.
- Rejects admin accounts with `403`.
- Returns a JWT containing `sub`, `role`, `email`, `exp`, and `iat`.

Private admin login:

- `POST /auth/admin/login`
- Excluded from generated OpenAPI documentation with `include_in_schema=False`.
- Not wired to the frontend.
- Only returns a token when the database user role is `admin`.
- Should be protected at the deployment/reverse-proxy layer in production.

Protected endpoints use `HTTPBearer` in `dependencies.py`. `get_current_user` validates a VIVENT JWT, then loads the current user from Supabase; if JWT decoding fails it attempts to resolve a Supabase Auth access token. `require_roles(...)` is strict and allows only the listed roles. Admin-only routes use `require_admin`.

## Event Lifecycle

1. `POST /events` creates a pending event in `pending_events`.
2. Admins review submissions with `GET /admin/events/pending`.
3. `PUT` or `PATCH /admin/events/{event_id}/approve` inserts the row into `events` as `approved`, deletes the pending row, and notifies the creator.
4. `PUT` or `PATCH /admin/events/{event_id}/reject` deletes the pending row, returns a rejected payload with `_admin_review` details in `venue_details`, and notifies the creator.
5. Public event listing reads from `events` and defaults to `status = approved`.

Valid backend categories are:

- `job_fair`
- `food`
- `educational`
- `expo`

The current frontend has dedicated pages for job fair, food, and educational events.

## Ticket, Payment, and Registration Rules

Food and educational events are ticket-first:

- Backend categories: `food`, `educational`
- A completed payment must exist before `POST /events/{event_id}/register` succeeds.
- Duplicate completed tickets for the same user/event are rejected or skipped.

Job fair and other non-ticket-first events are registration-first:

- Register through `POST /events/{event_id}/register`.
- Then initiate payment if required.
- `POST /payments/initiate` and mock Stripe session creation require an existing registration for non-ticket-first events, unless the caller is the event creator or admin.

Payment implementations:

- `POST /payments/initiate` creates a completed direct mock payment.
- `POST /payments/stripe/create-checkout-session` returns a mock checkout URL.
- `GET /payments/stripe/mock-checkout` renders an HTML card-payment simulator.
- `POST /payments/stripe/webhook` processes `checkout.session.completed`, writes the payment, updates registration payment status when a registration id is provided, and is idempotent by transaction/session id.

Ticket price is read from `event.venue_details.ticket_price` when available; otherwise the mock Stripe flow falls back to the event plan price, then `99.0`.

## API Endpoints

| Area | Method and path | Access |
| --- | --- | --- |
| Health | `GET /` | Public |
| Auth | `POST /auth/register` | Public student/business |
| Auth | `POST /auth/login` | Public student/business |
| Auth | `POST /auth/admin/login` | Hidden/private admin endpoint |
| Auth | `GET /auth/me` | Authenticated |
| Auth | `POST /auth/logout` | Public placeholder |
| Users | `GET /users` | Admin |
| Users | `GET /users/{user_id}` | Self or admin |
| Users | `PATCH /users/{user_id}` | Self or admin; admin controls active status |
| Events | `GET /events` | Public approved events |
| Events | `POST /events` | Student/business |
| Events | `GET /events/{event_id}` | Public approved event |
| Events | `PATCH /events/{event_id}` | Creator or admin |
| Events | `DELETE /events/{event_id}` | Creator or admin |
| Events AI | `POST /events/ai/generate-description` | Student/business |
| Admin events | `GET /admin/events/pending` | Admin |
| Admin events | `PUT/PATCH /admin/events/{event_id}/approve` | Admin |
| Admin events | `PUT/PATCH /admin/events/{event_id}/reject` | Admin |
| Registrations | `POST /events/{event_id}/register` | Student/business |
| Registrations | `GET /registrations/my` | Authenticated |
| Registrations | `GET /events/{event_id}/registrations` | Event creator or admin |
| Payments | `POST /payments/initiate` | Authenticated |
| Payments | `GET /payments/user` | Authenticated |
| Payments | `GET /payments/my-payments` | Authenticated |
| Payments | `GET /payments/admin/all` | Admin |
| Payments | `GET /payments/event/{event_id}` | Event creator or admin |
| Payments | `POST /payments/stripe/create-checkout-session` | Authenticated |
| Payments | `GET /payments/stripe/mock-checkout` | Public mock portal |
| Payments | `POST /payments/stripe/webhook` | Public mock webhook |
| Plans | `GET /plans` | Public active plans |
| Plans | `POST /plans` | Admin |
| Plans | `PATCH /plans/{plan_id}` | Admin |
| Plans | `DELETE /plans/{plan_id}` | Admin; soft delete |
| Subscriptions | `GET /subscriptions/me` | Authenticated |
| Subscriptions | `POST /subscriptions` | Authenticated |
| Subscriptions | `PATCH /subscriptions/cancel` | Authenticated |
| Records | `GET /records/my-events` | Authenticated |
| Records | `GET /records/financial` | Authenticated; admin sees all payments |
| Analytics | `GET /analytics/admin/dashboard` | Admin |
| Analytics | `POST /analytics/admin/dashboard/refresh` | Admin |
| Analytics | `GET /analytics/student/dashboard` | Student |
| Analytics | `GET /analytics/business/dashboard` | Business |
| Analytics AI | `POST /analytics/admin/ai/insights` | Admin |
| Ads | `POST /events/{event_id}/ads/request` | Student/business |
| Ads | `GET /ads/requests` | Admin |
| Ads | `PUT /admin/ads/{ad_id}/approve` | Admin |
| Ads | `PUT /admin/ads/{ad_id}/reject` | Admin |
| Discussions | `GET /events/{event_id}/discussions` | Registered participant, creator, or admin |
| Discussions | `POST /events/{event_id}/discussions` | Registered participant, creator, or admin |
| Notifications | `GET /notifications` | Authenticated |
| Notifications | `PUT /notifications/{notif_id}/read` | Notification owner |
| Social | `GET /social/link-session` | Student/business |
| Social | `GET /social/mock-oauth-portal` | Public mock portal |
| Social | `POST /social/callback` | Student/business |
| Social | `GET /social/accounts` | Authenticated |
| Social | `DELETE /social/accounts/{account_id}` | Owner or admin |

## Validation Rules

- Register password: at least 8 characters.
- Register full name: 2-255 characters.
- Public roles: `student`, `business`.
- Event title: 3-255 characters.
- Event description: at least 10 characters.
- Event `max_participants`: greater than 0.
- Event end date must be after start date.
- Event categories: `educational`, `expo`, `food`, `job_fair`.
- Public event statuses: `approved`, `completed`.
- Pending event status: `pending`.
- Payment amount: greater than 0.
- Discussion message: 1-5000 characters.
- Plan names allowed by schema: `Basic`, `Normal`, `Premium`; helper validation allows non-empty 2-100 character names, but the database constraint is stricter.
- Social link platforms: `facebook`, `instagram`, `linkedin`, `twitter`.
- Ad request platforms: `instagram`, `facebook`, `linkedin`, `tiktok`, `whatsapp`, `offline_posters`.

## Tests

Run from this directory:

```bash
python -m pytest
```

The test suite replaces Supabase with an in-memory fake client. Existing tests cover:

- Auth and profile flows.
- Strict role access control.
- Plan listing/management.
- Event creation, update/delete, approval, and rejection.
- Registration and ticket-first registration behavior.
- Direct mock payments and mock Stripe checkout/webhook behavior.
- Duplicate webhook/ticket handling.
- Notifications, discussions, ads, records, analytics, AI helpers, and social linking.

## File Storage and Media

No backend upload route, Supabase Storage bucket, or media-processing pipeline is currently implemented. Event images and public-page imagery are represented by URLs in frontend data or `venue_details`. The job fair page has a CV file-selection UI, but this backend does not currently receive or store CV files.

## Security Considerations

- Never expose `SUPABASE_SECRET_KEY` or service-role keys to the frontend.
- Set a strong `JWT_SECRET` outside source control.
- Public login rejects admin accounts.
- The private admin login endpoint should be protected by network controls in production.
- `require_admin` must protect admin-only routes.
- RLS policies and backend role checks are both present; keep them aligned.
- Mock Stripe and mock social OAuth are development simulators, not production integrations.
- CORS defaults to `*`; restrict `CORS_ALLOW_ORIGINS` for production.

## Troubleshooting

| Issue | Fix |
| --- | --- |
| `Supabase is not configured` | Set `SUPABASE_URL` and one backend key variable. |
| Backend rejects the Supabase key | Use a secret/service-role key, not an `sb_publishable` key. |
| Supabase permission denied | Apply `schema.sql`, including grants and RLS policies. |
| `401 Authentication credentials were not provided` | Send `Authorization: Bearer <token>`. |
| Public login rejects admin | Use the hidden admin endpoint operationally, or create a non-admin account for public login. |
| Food/educational registration fails | Complete ticket purchase before registering. |
| Job fair payment fails before registration | Register for the event first. |
| Tests cannot import modules | Run `python -m pytest` from `Vivent-Backend/`. |

## Deployment Notes

No backend deployment manifest is included. A production deployment should run the app with an ASGI server, configure environment variables securely, restrict CORS, protect private admin auth routes, and connect to a Supabase project where `schema.sql` has been applied.

## Contribution Notes

- Add or update Pydantic schemas when request/response contracts change.
- Keep route access checks explicit.
- Update `schema.sql` with every database change.
- Add tests for business-rule changes, especially auth, event moderation, payment, and registration flows.
- Update this README and the root README when backend behavior changes.
