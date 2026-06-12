# VIVENT Event Management System

![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/Frontend-React-61DAFB?style=for-the-badge&logo=react&logoColor=111)
![Vite](https://img.shields.io/badge/Build-Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Supabase](https://img.shields.io/badge/Database-Supabase-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)

VIVENT is a full-stack event management platform for students, business organizers, and administrators. It combines a FastAPI backend, a React + Vite frontend, and a Supabase PostgreSQL database to support event discovery, event creation, role-based dashboards, registration, payments, notifications, analytics, moderation, and promotion workflows.

The repository is organized as a monorepo with separate backend and frontend applications. The backend exposes modular REST APIs for authentication, users, events, plans, registrations, payments, ads, discussions, notifications, analytics, records, social-account linking, and subscriptions. The frontend provides role-specific panels, protected routes, and JWT-based session storage in the browser.

## Project Overview

VIVENT solves the coordination problem around campus and commercial events. Students need one place to discover job fairs, food events, and educational expos; businesses need tools to create and promote events; administrators need approval workflows, analytics, and platform-level controls.

The target users are students, event-hosting businesses, and platform administrators. Its business value is centralization: event approval, participant tracking, payments, records, dashboards, and promotion plans are handled in one role-aware system.

## Key Features

### Student Features

- Registration/login through `POST /auth/register` and `POST /auth/login`.
- JWT-backed protected routes using `localStorage`.
- Student dashboard at `/studentpanel`.
- Browse approved job fair, food, and educational events from `/events`.
- Register for approved events through `POST /events/{event_id}/register`.
- Submit job fair application details and CV file selection UI in the job fair flow.
- Initiate mock card payments through `POST /payments/initiate`.
- View joined/current events and past event records through `/records/my-events`.
- View student dashboard analytics through `/analytics/student/dashboard`, including registered events, pending payments, and upcoming events.
- Navigate event categories and view public pricing/promotion plans through `/plans`.
- Select or change an active subscription plan through `/subscriptions`.
- Cancel an active subscription through `/subscriptions/cancel`.
- Receive backend notifications for registration, payment, approval, rejection, and ad decisions.
- Read event discussion threads and post messages when registered or otherwise authorized.
- Link mock social accounts for Facebook, Instagram, LinkedIn, and X/Twitter through `/social/link-session` and `/social/callback`.

### Business Features

- Business registration and login.
- Business dashboard at `/businesspanel`.
- Create pending events with title, description, category, dates, location, venue details, plan, and participant limit.
- Edit own events through `PATCH /events/{event_id}`.
- Delete own events through `DELETE /events/{event_id}`.
- View business analytics, created events, registration counts, and revenue per event.
- View current/past events and financial records through `/records`.
- View registrations for events created by the business through `GET /events/{event_id}/registrations`.
- View payments for owned events through `GET /payments/event/{event_id}`.
- Select pricing or promotion plans from `/plans` and `/subscriptions`.
- Request social media promotion for an event through `POST /events/{event_id}/ads/request`.
- Link mock social accounts for promotion workflows.
- Use AI-assisted event description generation through `POST /events/ai/generate-description`.

### Admin Features

- Admin login through the seeded admin account from `seed.py`.
- Admin dashboard at `/adminpanel`.
- List all users through `GET /users`.
- Read and update user profiles through `GET /users/{user_id}` and `PATCH /users/{user_id}`.
- Activate or deactivate users through admin update permissions.
- View pending event approvals through `GET /admin/events/pending`.
- Approve events through `PUT /admin/events/{event_id}/approve`.
- Reject events with a reason through `PUT /admin/events/{event_id}/reject`.
- Create, update, and deactivate pricing plans through `/plans`.
- View all platform events through records and dashboard flows.
- View all financial records through `/records/financial`.
- Access and refresh cached admin analytics.
- Generate AI-powered admin insight reports through `POST /analytics/admin/ai/insights`.
- Review all ad requests through `GET /ads/requests`.
- Approve ad requests through `PUT /admin/ads/{ad_id}/approve`.
- Reject ad requests through `PUT /admin/ads/{ad_id}/reject`.
- Trigger simulated auto-publishing to linked social accounts.
- Manage frontend post-management and client-analytics UI sections in the admin panel.

## System Architecture

### Frontend

The frontend is built with React 19, Vite 8, React Router DOM 7, Tailwind CSS 4, and React Icons. Routing lives in `Vivent-frontend/src/App.jsx`, with a `ProtectedRoute` wrapper for authenticated pages.

State is mostly local React state with `useState` and `useEffect`. Authentication is persisted in `localStorage`. API calls are centralized in `src/utils/api.js`, which injects the JWT bearer token and redirects to `/login` on `401`.

Main frontend pages include authentication, event browsing, static information pages, and role dashboards for students, businesses, and admins.

### Backend

The backend starts in `Vivent-Backend/main.py`, configures CORS, validates Supabase access, starts an analytics cache worker, and mounts routers from `routers/`. Pydantic schemas in `schemas/` validate requests and responses. Shared logic in `utils/` covers JWTs, password hashing, AI helpers, analytics caching, and validation.

### Database

Supabase PostgreSQL is accessed from the backend through the Supabase Python client. The schema is defined in `Vivent-Backend/schema.sql` and includes `users`, `plans`, `user_subscriptions`, `events`, `event_registrations`, `payments`, `discussions`, `social_media_ads`, `notifications`, `analytics_cache`, and `linked_social_accounts`.

### Authentication

Authentication uses email/password login, bcrypt password hashing, and JWT access tokens with `sub`, `role`, `email`, `exp`, and `iat` claims. Protected endpoints use `HTTPBearer`, `get_current_user`, `require_roles`, and `require_self_or_admin`.

## Repository Structure

```text
VIVENT-FINAL-REPO/
|
├── Vivent-Backend/
|   ├── routers/                 # FastAPI route modules grouped by domain
|   ├── schemas/                 # Pydantic request/response models
|   ├── tests/                   # Pytest test suite with mocked Supabase client
|   ├── utils/                   # JWT, password, AI, analytics, and helper utilities
|   ├── config.py                # Environment-based backend settings
|   ├── dependencies.py          # Auth and role-based dependency functions
|   ├── main.py                  # FastAPI app, CORS, startup hooks, router mounting
|   ├── requirements.txt         # Python dependencies
|   ├── schema.sql               # Supabase/PostgreSQL schema
|   ├── seed.py                  # Default plans and admin seed script
|   ├── seed_mock_data.py        # Demo data seeder for users, events, payments
|   └── supabase_client.py       # Supabase client initialization and key validation
|
├── Vivent-frontend/
|   ├── public/                  # Static public assets
|   ├── src/
|   |   ├── Pages/               # Main React pages and role dashboards
|   |   ├── assets/              # Frontend image/SVG assets
|   |   ├── data/                # Static event catalog used by UI
|   |   ├── layout/              # Header, footer, floating FAQ
|   |   ├── utils/               # API client and localStorage helpers
|   |   ├── App.jsx              # Router and protected route setup
|   |   ├── main.jsx             # React app entrypoint
|   |   └── index.css            # Global styles
|   ├── package.json             # Frontend scripts and dependencies
|   ├── vite.config.js           # Vite and Tailwind configuration
|   └── eslint.config.js         # ESLint configuration
|
└── README.md
```

## Technology Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, Vite 8, React Router DOM 7 |
| Styling | Tailwind CSS 4, custom CSS, React Icons |
| Backend | FastAPI, Uvicorn, Pydantic v2 |
| Database | Supabase PostgreSQL via Supabase Python client |
| Authentication | Backend JWT, bcrypt password hashing, FastAPI HTTPBearer |
| Authorization | Role-based access control for `student`, `business`, and `admin` |
| AI | Gemini API support through `GEMINI_API_KEY`, with local fallback logic |
| Payments | Mock direct payment flow and mock Stripe checkout/webhook flow |
| Testing | Pytest, FastAPI TestClient, mocked Supabase |
| Deployment | Backend can run with Uvicorn; frontend can be built with Vite |

## Database Design

| Table | Purpose | Key Relationships |
| --- | --- | --- |
| `users` | Stores platform users, password hashes, roles, and active status. | Referenced by events, registrations, payments, discussions, ads, notifications, and linked accounts. |
| `plans` | Stores Basic, Normal, and Premium plans with price and facilities JSON. | Referenced by `events.plan_id`. |
| `user_subscriptions` | Stores each user's active or cancelled plan subscription. | Links `users` to `plans`; enforces one active subscription per user. |
| `events` | Stores event details, category, status, schedule, location, creator, approval user, and capacity. | Created by `users`; approved by admin users; linked to plans. |
| `event_registrations` | Tracks user registration for events and payment status. | Links `users` and `events`; unique per user/event pair. |
| `payments` | Stores event payment transactions, status, method, and amount. | Links users to paid event transactions. |
| `discussions` | Stores event discussion messages. | Links messages to users and events. |
| `social_media_ads` | Stores event promotion requests and admin review status. | Links promotion requests to events and requesting users. |
| `notifications` | Stores user-facing messages. | Linked to users. |
| `analytics_cache` | Stores precomputed dashboard metrics. | Used by the admin analytics cache worker. |
| `linked_social_accounts` | Stores mock linked social accounts and generated access tokens. | Linked to users, unique per user/platform. |

The schema uses UUID primary keys, foreign keys, status/category checks, timestamps, update triggers, and Supabase service-role grants.

## API Overview

| Router | Purpose | Main Endpoints | Operations |
| --- | --- | --- | --- |
| `auth` | Registration, login, current user, logout placeholder. | `/auth/register`, `/auth/login`, `/auth/me`, `/auth/logout` | Create accounts, issue JWTs, read session user. |
| `users` | User profile and admin user management. | `/users`, `/users/{user_id}` | List, read, update users. |
| `events` | Event creation, listing, detail, update, delete, AI description generation. | `/events`, `/events/{event_id}`, `/events/ai/generate-description` | CRUD, filters, pagination, AI copy. |
| `admin_events` | Admin event moderation. | `/admin/events/pending`, `/admin/events/{event_id}/approve`, `/admin/events/{event_id}/reject` | Review, approve, reject. |
| `plans` | Public plan listing and admin plan management. | `/plans`, `/plans/{plan_id}` | List, create, update, soft-delete. |
| `registrations` | Event registration and attendee lists. | `/events/{event_id}/register`, `/events/{event_id}/registrations` | Register, list registrations. |
| `payments` | Mock payments and mock Stripe checkout. | `/payments/initiate`, `/payments/user`, `/payments/event/{event_id}`, `/payments/stripe/create-checkout-session`, `/payments/stripe/mock-checkout`, `/payments/stripe/webhook` | Pay, list payments, simulate checkout and webhook. |
| `ads` | Social media ad requests and admin decisions. | `/events/{event_id}/ads/request`, `/ads/requests`, `/admin/ads/{ad_id}/approve`, `/admin/ads/{ad_id}/reject` | Request, list, approve, reject, simulated publishing. |
| `discussions` | Event discussion messages. | `/events/{event_id}/discussions` | List and create messages. |
| `notifications` | User notifications. | `/notifications`, `/notifications/{notif_id}/read` | List and mark read. |
| `analytics` | Role-based dashboards and AI insights. | `/analytics/admin/dashboard`, `/analytics/admin/dashboard/refresh`, `/analytics/student/dashboard`, `/analytics/business/dashboard`, `/analytics/admin/ai/insights` | Metrics, cache refresh, AI reports. |
| `records` | Event and financial records. | `/records/my-events`, `/records/financial` | Current/past event records and payment history. |
| `social` | Mock OAuth social linking. | `/social/link-session`, `/social/mock-oauth-portal`, `/social/callback`, `/social/accounts`, `/social/accounts/{account_id}` | Link, list, unlink accounts. |
| `subscriptions` | User plan subscription lifecycle. | `/subscriptions/me`, `/subscriptions`, `/subscriptions/cancel` | Read active plan, subscribe/switch, cancel. |

## Installation Guide

### Prerequisites

- Python 3.10 or later.
- Node.js and npm.
- Supabase project with a backend service-role or secret key.

### Backend Setup

```bash
cd Vivent-Backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file in `Vivent-Backend/` using `.env.example` as a template.

```bash
python seed.py
uvicorn main:app --reload
```

The backend runs at:

```text
http://127.0.0.1:8000
```

Interactive API documentation is available at `http://127.0.0.1:8000/docs`.

### Frontend Setup

```bash
cd Vivent-frontend
npm install
npm run dev
```

The Vite development server runs at:

```text
http://localhost:5173
```

Other frontend commands are `npm run build`, `npm run lint`, and `npm run preview`.

## Environment Variables

| Variable | Description |
| --- | --- |
| `APP_NAME` | Backend application name. Defaults to `VIVENT Event Management System`. |
| `APP_VERSION` | Backend version string. |
| `SUPABASE_URL` | Supabase project URL. |
| `SUPABASE_SECRET_KEY` | Preferred backend Supabase secret/service key. |
| `SUPABASE_SERVICE_ROLE_KEY` | Legacy fallback service-role key name. |
| `SUPABASE_KEY` | Legacy fallback Supabase key name. |
| `JWT_SECRET` | Secret used to sign and verify JWT access tokens. |
| `JWT_ALGORITHM` | JWT algorithm, default `HS256`. |
| `ACCESS_TOKEN_EXPIRE_HOURS` | JWT expiry duration in hours. |
| `CORS_ALLOW_ORIGINS` | Comma-separated CORS origins or `*`. |
| `ZOOM_CLIENT_ID` | Reserved for Zoom server-to-server OAuth credentials. |
| `ZOOM_CLIENT_SECRET` | Reserved for Zoom server-to-server OAuth credentials. |
| `ZOOM_ACCOUNT_ID` | Reserved for Zoom server-to-server OAuth credentials. |
| `GEMINI_API_KEY` | Optional Gemini API key for AI event descriptions and admin insights. |

The frontend currently uses `http://127.0.0.1:8000` as the backend base URL in `src/utils/api.js`.

## Running the Application

1. Run `Vivent-Backend/schema.sql` in the Supabase SQL editor.
2. Add backend environment variables in `Vivent-Backend/.env`.
3. Start FastAPI with `uvicorn main:app --reload`.
4. Run `python seed.py` for default plans and admin access.
5. Start the frontend with `npm run dev`.
6. Open `http://localhost:5173`.

Default seeded admin account: `admin@vivent.com` / `Admin123!`.

## User Workflow

### Student Journey

Students register on `/signup`, log in automatically, and are redirected to `/studentpanel`. They browse approved event categories, register for events, complete mock payments where required, and then track joined events, records, subscriptions, notifications, and dashboard analytics.

### Business Journey

Business users log in to `/businesspanel`, where they can view analytics, plans, events, and records. They create pending events for admin approval, then manage event updates, registrations, payment records, subscription plans, and social media promotion requests.

### Admin Journey

Admins enter `/adminpanel` to review pending events, approve or reject submissions, inspect analytics, refresh cached metrics, view records, manage plans/users through backend APIs, and handle ad approval workflows. Approval and rejection flows create user notifications.

## Security Features

- Passwords are hashed with bcrypt before being stored.
- JWT access tokens are signed with the configured `JWT_SECRET`.
- FastAPI dependencies enforce authentication and role-based access.
- Admin-only routes are protected through `require_roles("admin")`.
- Student and business routes are protected through role checks.
- Self-or-admin profile access prevents users from editing other users.
- Pydantic schemas validate request data, including email format, password length, event fields, payment amounts, and discussion length.
- Supabase key validation rejects frontend publishable keys for backend usage.
- The frontend protects routes and automatically clears session storage on `401` responses.
- Supabase schema includes foreign keys, check constraints, unique constraints, and update triggers.

## Testing

The backend includes Pytest tests in `Vivent-Backend/tests/`. Tests use FastAPI `TestClient` and a fake in-memory Supabase implementation, so major API behavior can be tested without a live Supabase project.

Run tests with:

```bash
cd Vivent-Backend
pytest
```

Existing tests cover:

- Authentication, users, and plans smoke flows.
- Event creation, admin approval, registration, payments, discussions, and ads.
- Notifications, analytics, and records.
- Negative access-control cases.
- Analytics cache creation, refresh, and day slicing.
- AI description generation and AI admin insights.
- Mock social OAuth account linking and unlinking.
- Mock Stripe checkout session, portal, webhook, and duplicate webhook handling.

No coverage report configuration is included in the repository.

## Future Enhancements

- Replace mock Stripe and mock social OAuth with production integrations.
- Add email notifications, CV uploads through Supabase Storage, and richer admin user-management screens.
- Add event search, deployment configuration, PWA support, and event recommendations.

## Contributors

| Name | Role |
| --- | --- |
| Your Name | Project Lead / Full-Stack Developer |
| Contributor Name | Backend Developer |
| Contributor Name | Frontend Developer |
| Supervisor Name | Project Supervisor |

## License

This project is licensed under the MIT License. Add the full license text to a dedicated `LICENSE` file before public release.
