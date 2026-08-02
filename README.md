# VIVENT Event Management System

![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/Frontend-React-61DAFB?style=for-the-badge&logo=react&logoColor=111)
![Vite](https://img.shields.io/badge/Build-Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Supabase](https://img.shields.io/badge/Database-Supabase-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white)

VIVENT is a full-stack event-management platform for students, business organizers, and platform administrators. The repository contains a FastAPI backend, a React/Vite frontend, and a Supabase PostgreSQL schema for event discovery, event creation, admin approval, ticketing, registration, payments, dashboards, records, plans, notifications, discussions, analytics, and mock social promotion workflows.

The current implementation is a two-application monorepo:

- [Vivent-Backend](./Vivent-Backend/README.md): FastAPI REST API, Supabase persistence, JWT authentication, business rules, tests, and seed scripts.
- [Vivent-frontend](./Vivent-frontend/README.md): React single-page app with public pages, protected routes, event-category pages, and role dashboards.

Dependency/cache README files inside `node_modules`, `.pytest_cache`, and the checked-in backend virtual environment are generated/vendor documentation and are not project documentation.

## Current Architecture

```text
VIVENT-FINAL-REPO/
|-- README.md
|-- Vivent-Backend/
|   |-- main.py
|   |-- config.py
|   |-- dependencies.py
|   |-- supabase_client.py
|   |-- schema.sql
|   |-- seed.py
|   |-- seed_mock_data.py
|   |-- requirements.txt
|   |-- routers/
|   |-- schemas/
|   |-- tests/
|   `-- utils/
`-- Vivent-frontend/
    |-- index.html
    |-- package.json
    |-- vite.config.js
    |-- eslint.config.js
    |-- public/
    `-- src/
        |-- App.jsx
        |-- main.jsx
        |-- Pages/
        |-- layout/
        |-- utils/
        |-- data/
        `-- assets/
```

## Tech Stack

| Layer | Current implementation |
| --- | --- |
| Frontend | React 19, Vite 8, React Router DOM 7 |
| Styling | Tailwind CSS 4, custom CSS, React Icons |
| Backend | FastAPI, Uvicorn, Pydantic v2 |
| Database | Supabase PostgreSQL through the Supabase Python client |
| Auth | Email/password, bcrypt password hashes, JWT bearer tokens; fallback support for Supabase Auth access tokens in backend dependencies |
| Authorization | Backend role checks for `student`, `business`, and `admin` |
| Payments | Direct mock payment endpoint and mock Stripe checkout/webhook simulator |
| AI | Gemini-backed event/admin copy helpers when `GEMINI_API_KEY` is set, with local fallback logic |
| Tests | Pytest, FastAPI TestClient, in-memory fake Supabase client |

## Main Features

### Student

- Sign up and log in as a `student`.
- Browse approved event categories: Job Fair, Food Events, and Educational Expo.
- Register for approved job fair events.
- Purchase tickets before joining/registering for food and educational events.
- View joined/current events and records in the student dashboard.
- View student dashboard analytics.
- Select, switch, or cancel an active plan subscription.
- View notifications and event discussion content where authorized.

### Business

- Sign up and log in as a `business`.
- Create event submissions with category, dates, location, participant limit, selected plan, and `venue_details`.
- Include ticket pricing in `venue_details.ticket_price`.
- Edit or delete owned approved events or pending submissions.
- View business dashboard metrics, created event records, registration counts, and revenue.
- Request social media promotion for owned events.
- Select, switch, or cancel plan subscriptions.
- Generate AI-assisted event descriptions.

### Admin

- Access admin APIs with an admin account managed outside public registration.
- Use the frontend `/adminpanel` only after the app verifies the JWT through `GET /auth/me`.
- Review pending events from `pending_events`.
- Approve events by moving them into the public `events` table.
- Reject events with a reason and notify the creator.
- Manage users and plans through backend APIs.
- View platform analytics, financial records, ad requests, and cached admin metrics.
- Approve or reject social media ad requests.

## Event, Ticket, and Registration Flow

Event creation currently uses a review queue:

1. A student or business creates an event with `POST /events`.
2. The backend writes the submission to `pending_events` with `status = pending`.
3. Admins list submissions with `GET /admin/events/pending`.
4. Approval via `PUT` or `PATCH /admin/events/{event_id}/approve` inserts the row into `events` with `status = approved` and deletes it from `pending_events`.
5. Rejection via `PUT` or `PATCH /admin/events/{event_id}/reject` deletes the pending row, records the rejection reason in the returned payload, and notifies the creator.

Ticketing has category-specific rules:

| Category | Backend category value | Current user flow |
| --- | --- | --- |
| Job Fair | `job_fair` | Register first through `/events/{event_id}/register`; payment can be initiated afterward when needed. |
| Food Events | `food` | Purchase a completed ticket first, then register/join. |
| Educational Expo | `educational` | Purchase a completed ticket first, then register/join. |
| Expo | `expo` | Supported by backend validation, but no dedicated frontend category page exists. |

Food and educational ticket purchase can use the mock Stripe session flow:

1. Frontend calls `POST /payments/stripe/create-checkout-session`.
2. Backend returns a mock checkout URL.
3. The mock portal posts `checkout.session.completed` to `POST /payments/stripe/webhook`.
4. Backend records a completed payment.
5. The user returns to the category page and can register.

The direct `POST /payments/initiate` endpoint also creates a completed mock payment. For food and educational events it allows ticket purchase before registration; for non-ticket-first events it requires an existing registration unless the caller is the event creator or admin.

## Database

The Supabase/PostgreSQL schema is in [Vivent-Backend/schema.sql](./Vivent-Backend/schema.sql). It defines:

| Table | Purpose |
| --- | --- |
| `users` | Application users, roles, password hashes, and active status. |
| `plans` | Basic, Normal, and Premium plan definitions. |
| `user_subscriptions` | One active plan subscription per user. |
| `pending_events` | Event submissions waiting for admin approval. |
| `events` | Public approved or completed events. |
| `event_registrations` | User/event joins with payment status and payment reference. |
| `payments` | Mock payment ledger and Stripe simulator transactions. |
| `discussions` | Event discussion messages. |
| `social_media_ads` | Promotion requests and admin decisions. |
| `notifications` | User-facing backend notifications. |
| `analytics_cache` | Cached admin dashboard data. |
| `linked_social_accounts` | Mock linked social accounts for promotion flows. |

The schema enables RLS, defines policies, grants service-role access, and adds constraints/triggers for statuses, roles, categories, timestamps, and role-escalation protection.

No Supabase Storage bucket or backend file-upload endpoint is currently implemented. Job fair CV selection exists in the frontend UI, but selected files are not uploaded to storage by the current backend.

## Authentication and Roles

Public registration accepts only `student` and `business` roles. Public login at `POST /auth/login` rejects `admin` users.

Admin accounts are seeded or managed through trusted backend/Supabase operations. The backend includes a hidden `POST /auth/admin/login` endpoint for admin accounts; it is excluded from public OpenAPI docs and has no frontend login page. In production, protect that path at the deployment/reverse-proxy layer.

The frontend stores session state in:

- `viventAuth`
- `viventToken`
- `viventAuthRole`
- `viventUser`

The API client attaches `Authorization: Bearer <token>` and clears local session data on `401`.

## API Overview

| Area | Endpoints |
| --- | --- |
| Health | `GET /` |
| Auth | `POST /auth/register`, `POST /auth/login`, hidden `POST /auth/admin/login`, `GET /auth/me`, `POST /auth/logout` |
| Users | `GET /users`, `GET /users/{user_id}`, `PATCH /users/{user_id}` |
| Events | `GET /events`, `POST /events`, `GET /events/{event_id}`, `PATCH /events/{event_id}`, `DELETE /events/{event_id}`, `POST /events/ai/generate-description` |
| Admin events | `GET /admin/events/pending`, `PUT/PATCH /admin/events/{event_id}/approve`, `PUT/PATCH /admin/events/{event_id}/reject` |
| Registrations | `POST /events/{event_id}/register`, `GET /registrations/my`, `GET /events/{event_id}/registrations` |
| Payments | `POST /payments/initiate`, `GET /payments/user`, `GET /payments/my-payments`, `GET /payments/admin/all`, `GET /payments/event/{event_id}`, `POST /payments/stripe/create-checkout-session`, `GET /payments/stripe/mock-checkout`, `POST /payments/stripe/webhook` |
| Plans | `GET /plans`, `POST /plans`, `PATCH /plans/{plan_id}`, `DELETE /plans/{plan_id}` |
| Subscriptions | `GET /subscriptions/me`, `POST /subscriptions`, `PATCH /subscriptions/cancel` |
| Records | `GET /records/my-events`, `GET /records/financial` |
| Analytics | `GET /analytics/admin/dashboard`, `POST /analytics/admin/dashboard/refresh`, `GET /analytics/student/dashboard`, `GET /analytics/business/dashboard`, `POST /analytics/admin/ai/insights` |
| Ads | `POST /events/{event_id}/ads/request`, `GET /ads/requests`, `PUT /admin/ads/{ad_id}/approve`, `PUT /admin/ads/{ad_id}/reject` |
| Discussions | `GET /events/{event_id}/discussions`, `POST /events/{event_id}/discussions` |
| Notifications | `GET /notifications`, `PUT /notifications/{notif_id}/read` |
| Social | `GET /social/link-session`, `GET /social/mock-oauth-portal`, `POST /social/callback`, `GET /social/accounts`, `DELETE /social/accounts/{account_id}` |

## Environment Variables

Backend variables are loaded from `Vivent-Backend/.env`:

| Variable | Required | Description |
| --- | --- | --- |
| `APP_NAME` | No | FastAPI application name. |
| `APP_VERSION` | No | FastAPI version string. |
| `SUPABASE_URL` | Yes | Supabase project URL. |
| `SUPABASE_SECRET_KEY` | Yes, preferred | Backend secret key. Do not use a publishable key. |
| `SUPABASE_SERVICE_ROLE_KEY` | Fallback | Legacy service-role key name. |
| `SUPABASE_KEY` | Fallback | Legacy service-role key name. |
| `JWT_SECRET` | Yes | JWT signing secret. |
| `JWT_ALGORITHM` | No | Defaults to `HS256`. |
| `ACCESS_TOKEN_EXPIRE_HOURS` | No | Defaults to `24`. |
| `CORS_ALLOW_ORIGINS` | No | Comma-separated origins or `*`. |
| `ZOOM_CLIENT_ID` | No | Present in settings, not currently wired to routes. |
| `ZOOM_CLIENT_SECRET` | No | Present in settings, not currently wired to routes. |
| `ZOOM_ACCOUNT_ID` | No | Present in settings, not currently wired to routes. |
| `GEMINI_API_KEY` | No | Enables Gemini-backed AI helpers; local fallback is used without it. |

The frontend currently reads no Vite environment variables. Its backend base URL is hardcoded in [Vivent-frontend/src/utils/api.js](./Vivent-frontend/src/utils/api.js).

## Installation

### Backend

```bash
cd Vivent-Backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

Create `Vivent-Backend/.env` from [Vivent-Backend/.env.example](./Vivent-Backend/.env.example), then run [Vivent-Backend/schema.sql](./Vivent-Backend/schema.sql) in the Supabase SQL editor.

Seed default plans and the default admin user:

```bash
python seed.py
```

Start the API:

```bash
uvicorn main:app --reload
```

Backend URLs:

- API root: `http://127.0.0.1:8000/`
- Swagger UI: `http://127.0.0.1:8000/docs`
- OpenAPI JSON: `http://127.0.0.1:8000/openapi.json`

### Frontend

```bash
cd Vivent-frontend
npm install
npm run dev
```

The dev server is configured for `http://localhost:5173`.

## Commands

| Location | Command | Purpose |
| --- | --- | --- |
| `Vivent-Backend` | `uvicorn main:app --reload` | Run FastAPI locally. |
| `Vivent-Backend` | `python seed.py` | Seed Basic/Normal/Premium plans and default admin. |
| `Vivent-Backend` | `python seed_mock_data.py` | Seed demo users/events/payments for development. |
| `Vivent-Backend` | `python -m pytest` | Run backend tests. |
| `Vivent-frontend` | `npm run dev` | Run Vite dev server. |
| `Vivent-frontend` | `npm run build` | Build frontend into `dist/`. |
| `Vivent-frontend` | `npm run preview` | Preview a production build locally. |
| `Vivent-frontend` | `npm run lint` | Run ESLint. |

## Build and Deployment

No production deployment manifests or CI/CD files are present in the repository.

For deployment, build the frontend with `npm run build` and serve `Vivent-frontend/dist` from a static host. Run the backend with an ASGI server such as Uvicorn behind your platform's process manager or reverse proxy, with production Supabase and JWT environment variables configured.

The mock Stripe checkout, mock social OAuth, and hidden admin login endpoint should be reviewed before production use.

## Testing and Validation

Backend tests live in [Vivent-Backend/tests](./Vivent-Backend/tests). They use a fake in-memory Supabase implementation and cover auth, users, plans, events, admin approval, registrations, ticket-first payment behavior, payments, mock Stripe webhook idempotency, analytics, AI helpers, records, notifications, discussions, ads, and social linking.

Run:

```bash
cd Vivent-Backend
python -m pytest
```

Frontend has ESLint configured but no automated React test suite.

## Troubleshooting

| Issue | Fix |
| --- | --- |
| Backend fails during import with Supabase config error | Set `SUPABASE_URL` and a backend secret/service-role key in `Vivent-Backend/.env`. |
| Supabase key is rejected | Use `SUPABASE_SECRET_KEY` or a service-role key, not an `sb_publishable` key. |
| Supabase permission errors | Apply the grants and RLS policies from `schema.sql`. |
| Frontend cannot call the API | Start FastAPI at `http://127.0.0.1:8000` or edit `BASE_URL` in `src/utils/api.js`. |
| Food or educational registration fails | Purchase a completed ticket first, then register. |
| Job fair payment fails before registration | Register for the job fair first, then pay if needed. |
| Admin panel redirects | Use a valid admin JWT; the frontend verifies role through `GET /auth/me`. |

## Contribution Notes

- Keep backend business rules in routers/helpers and validate inputs with schemas.
- Keep frontend backend calls inside `src/utils/api.js`.
- Update [Vivent-Backend/schema.sql](./Vivent-Backend/schema.sql) whenever database tables, constraints, RLS policies, or grants change.
- Update all project README files when routes, env vars, commands, or user flows change.
- Do not commit real secrets or frontend publishable keys as backend keys.

## License

No `LICENSE` file is currently present in this repository. Add a license file before publishing or distributing the project.
