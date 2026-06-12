# VIVENT Frontend Documentation

## Frontend Overview

The VIVENT frontend is the React single-page application for the VIVENT Event Management System. It provides the user interface for public browsing, authentication, protected event pages, and role-oriented dashboards for students, businesses, and administrators.

The application is designed around a practical event-management journey. Students can browse approved event categories, register for events, view joined events and records, and choose promotion/subscription plans. Business users can create and manage events, review records, view dashboard data, and select plans. Admin users can access dashboard, event management, record, post-management, calendar, and client-analytics screens.

The frontend integrates with the FastAPI backend through a central API client in `src/utils/api.js`. It stores JWT session data in `localStorage`, injects bearer tokens into requests, and redirects users to `/login` when the backend returns `401`.

## Technology Stack

| Component | Technology |
| --- | --- |
| Framework | React `^19.2.4` |
| Build Tool | Vite `^8.0.1` |
| Routing | `react-router-dom` `^7.14.0` |
| Styling | Tailwind CSS `^4.2.2`, custom CSS files, React Icons |
| State Management | React `useState`, `useEffect`, `useMemo`, and browser `localStorage` |
| API Layer | Fetch-based service module in `src/utils/api.js` |
| Linting | ESLint `^9.39.4`, React Hooks plugin, React Refresh plugin |

## Project Structure

```text
Vivent-frontend/
|
├── public/
|   ├── favicon.svg
|   └── icons.svg
|
├── src/
|   ├── Pages/
|   |   ├── About.jsx
|   |   ├── Adminpanel.jsx
|   |   ├── Businesspanel.jsx
|   |   ├── Contact.jsx
|   |   ├── Educationalexpo.jsx
|   |   ├── Eventpage.jsx
|   |   ├── Foodevents.jsx
|   |   ├── Home.jsx
|   |   ├── jobfair.jsx
|   |   ├── Login.jsx
|   |   ├── PrivacyPolicy.jsx
|   |   ├── Signup.jsx
|   |   ├── Studentpanel.jsx
|   |   └── TermsOfServices.jsx
|   |
|   ├── assets/
|   |   ├── hero.png
|   |   ├── react.svg
|   |   └── vite.svg
|   |
|   ├── data/
|   |   └── eventCatalog.js
|   |
|   ├── layout/
|   |   ├── FloatingFAQ.jsx
|   |   ├── Footer.jsx
|   |   └── Header.jsx
|   |
|   ├── utils/
|   |   ├── api.js
|   |   ├── authStorage.js
|   |   ├── createdEvents.js
|   |   └── joinedEvents.js
|   |
|   ├── App.css
|   ├── App.jsx
|   ├── index.css
|   └── main.jsx
|
├── eslint.config.js
├── index.html
├── package.json
├── package-lock.json
└── vite.config.js
```

`src/Pages/` contains the major route screens and dashboard modules. `src/layout/` contains reusable application shell components: header, footer, and floating FAQ modal. `src/utils/` contains the backend API wrapper and localStorage helpers for legacy/local event data. `src/data/eventCatalog.js` contains static showcase event data for UI presentation. `public/` stores browser-facing static SVG assets.

## Application Features

### Student Interface

The student dashboard is implemented in `Studentpanel.jsx`. It uses local state to switch between dashboard, events, records, and social promotion/plan views. It calls `analyticsApi.studentDashboard()`, `recordsApi.myEvents()`, `plansApi.list()`, and `subscriptionsApi.me()/subscribe()` through the API client.

Implemented student features include:

- Protected student panel at `/studentpanel`.
- Dashboard overview with joined/current and past event data.
- Navigation to Job Fair, Food Events, and Educational Expo pages.
- Joined event listing using backend records and local joined-event helpers.
- Records view with previous/completed event tables and seven-day review filtering.
- Social promotion/subscription plan cards loaded from `/plans`.
- Plan selection through `/subscriptions`.
- Logout that clears `viventAuth`, `viventAuthRole`, `viventToken`, and `viventUser`.

Event category pages add student-facing event actions. `jobfair.jsx`, `Foodevents.jsx`, and `Educationalexpo.jsx` fetch approved backend events by category, normalize event data for cards, display loading/error states, register users through `registrationsApi.register`, and in food/educational flows initiate card payments through `paymentsApi.initiate`. The job fair page includes an application form with applicant fields and CV file selection UI.

### Business Interface

The business dashboard is implemented in `Businesspanel.jsx`. It loads business dashboard analytics, user-created events, active plans, and event records. It also provides event creation and management screens.

Implemented business features include:

- Protected business panel at `/businesspanel`.
- Business dashboard data through `analyticsApi.businessDashboard()`.
- Managed event list loaded from backend event APIs.
- Event creation through `eventsApi.create`.
- Event editing through `eventsApi.update`.
- Event deletion through `eventsApi.delete`.
- Category selection for Job Fair, Food Event, and Educational Expo.
- Records table populated through `recordsApi.myEvents()`.
- Social media promotion/plan cards from `plansApi.list()`.
- Plan subscription through `subscriptionsApi.subscribe`.
- API error display when backend calls fail.
- Logout using the same localStorage cleanup pattern as the student panel.

### Admin Interface

The admin dashboard is implemented in `Adminpanel.jsx`. It imports `eventsApi`, `adminApi`, `analyticsApi`, and `recordsApi`. The route `/adminpanel` is protected for authenticated users in `App.jsx`; unlike student/business panels, it does not currently pass an `allowedRoles` list in the frontend route guard.

Implemented admin features include:

- Dashboard view with event tables and management sections.
- Event listing from `eventsApi.list({ page_size: 200 })`.
- Pending event loading through `adminApi.pendingEvents()`.
- Local event editor modal for adding/editing event entries.
- Delete confirmation modal for event rows.
- Records view with seven-day filtering.
- Post management interface with editable post drafts and saved social accounts.
- Client analytics view based on promotion client data.
- Calendar panel with month/year state.
- Dashboard range state for attendee/review windows.
- Logout that clears stored auth keys and returns to home.

## Routing Structure

Routing is defined in `src/App.jsx` with `BrowserRouter`, `Routes`, `Route`, `Navigate`, and a local `ProtectedRoute` component.

| Route | Protection | Purpose |
| --- | --- | --- |
| `/` | Public | Home page. |
| `/login` | Public | Login page and demo forgot-password modal. |
| `/signup` | Public | Registration page with auto-login after signup. |
| `/events` | Authenticated | Event category overview page. |
| `/jobfair` | Authenticated | Approved job fair event listings and application flow. |
| `/foodevents` | Authenticated | Approved food event listings, registration, and payment confirmation. |
| `/educationalexpo` | Authenticated | Approved educational event listings, registration, and payment confirmation. |
| `/about` | Authenticated | About page. |
| `/contact` | Authenticated | Contact page. |
| `/privacy-policy` | Public | Privacy policy page. |
| `/terms-of-services` | Public | Terms page. |
| `/adminpanel` | Authenticated | Admin panel UI. |
| `/studentpanel` | Authenticated + `student` role | Student dashboard. |
| `/businesspanel` | Authenticated + `business` role | Business dashboard. |
| `*` | Redirect | Sends authenticated users home and unauthenticated users to login. |

`ProtectedRoute` redirects unauthenticated users to `/login` and preserves the attempted location. If `allowedRoles` is supplied and the current role is not allowed, it redirects to that role's dashboard path.

## Component Architecture

This frontend uses page-level components for most feature modules. Shared layout is handled by:

- `Header.jsx`: sticky navigation, public links, auth buttons, notification dropdown, profile menu, dashboard links, logout, and mobile menu.
- `Footer.jsx`: brand footer, quick links, legal links, and social icon buttons.
- `FloatingFAQ.jsx`: fixed Help button and FAQ modal with internal active-question state.

Reusable patterns are implemented inside page files as local subcomponents. For example, `Studentpanel.jsx` defines dashboard, joined-events, records, and social-promotion sections inside the same file. `Businesspanel.jsx` defines available events, add/edit event panel, records, and social promotion sections. `Adminpanel.jsx` defines post management, client analytics, calendar, event editor, and table helpers internally.

## Authentication Flow

Login is implemented in `Login.jsx`. The form sends email and password to `api.auth.login`, checks the returned user role against the selected account type, stores auth data in `localStorage`, calls `onAuth(role)`, and navigates to `/studentpanel`, `/businesspanel`, or `/adminpanel`.

Registration is implemented in `Signup.jsx`. The form sends email, password, username, and account type to `api.auth.register`, then immediately logs the user in with `api.auth.login`. It stores the same auth keys as login and redirects based on role.

Session state is initialized in `App.jsx` from:

- `viventAuth`
- `viventToken`
- `viventAuthRole`
- `viventUser`

Logout removes these keys. The API client also removes them automatically when a backend response returns `401`.

## Backend Integration

All backend communication goes through `src/utils/api.js`. The current base URL is hardcoded:

```js
const BASE_URL = "http://127.0.0.1:8000";
```

The API layer wraps `fetch`, attaches `Content-Type: application/json`, injects `Authorization: Bearer <token>` when `viventToken` exists, serializes request bodies, builds query strings for GET requests, and throws readable errors from backend `detail` or `message` fields.

Exported service groups include `authApi`, `eventsApi`, `registrationsApi`, `paymentsApi`, `analyticsApi`, `recordsApi`, `plansApi`, `socialApi`, `adsApi`, `adminApi`, `aiApi`, and `subscriptionsApi`. Current pages actively use auth, events, registrations, payments, analytics, records, plans, admin, and subscriptions APIs.

## Environment Variables

No frontend `.env` or `import.meta.env` usage is present in the current source. The backend URL is hardcoded in `src/utils/api.js`.

| Variable | Description |
| --- | --- |
| Not configured | No Vite environment variables are currently read by the frontend. |

## Installation

```bash
cd Vivent-frontend
npm install
```

## Running Frontend

```bash
npm run dev
```

Vite is configured in `vite.config.js` to run on port `5173`. The config enables `@vitejs/plugin-react` and `@tailwindcss/vite`, and includes `pacific-catlike-fog.ngrok-free.dev` in `server.allowedHosts`.

## Build for Production

```bash
npm run build
npm run preview
```

`npm run build` executes `vite build`. `npm run preview` executes `vite preview`.

## UI/UX Design Overview

The UI uses a consistent blue-and-white visual style with Tailwind utility classes. Public pages use large hero sections, event category cards, pricing cards, and informational sections. The dashboard pages use side navigation, card-like panels, tables, modals, and state-based views.

Navigation starts with `Header.jsx`, which links to Home, Events, Job Fair, Food Events, Educational Expo, About, and Contact. Authenticated users can open a profile menu with panel links. The layout also includes `Footer.jsx` and a persistent FAQ help button from `FloatingFAQ.jsx`.

The experience is responsive through Tailwind breakpoint classes such as `md:`, `sm:`, and grid/flex layouts. Header navigation switches to a mobile menu on small screens. Dashboards use scrollable table containers and responsive spacing.

## Frontend Workflow

```text
User -> React route/page -> local state update -> API service call -> FastAPI backend -> JSON response -> UI re-render
```

Examples:

- A student opens `/jobfair`; the page calls `eventsApi.list({ category: "job_fair", status: "approved" })`, stores results in component state, and renders event cards.
- A business submits an event; `Businesspanel.jsx` builds an event payload, calls `eventsApi.create`, then prepends the returned event to managed event state.
- A user logs in; `Login.jsx` calls `api.auth.login`, stores the token and role, updates auth state in `App.jsx`, and navigates to the correct dashboard.

## Code Quality

ESLint is configured in `eslint.config.js` with:

- `@eslint/js` recommended rules.
- `eslint-plugin-react-hooks` recommended flat config.
- `eslint-plugin-react-refresh` Vite config.
- Browser globals from `globals`.
- JSX parser options.
- `dist` ignored globally.
- `no-unused-vars` enabled with uppercase variable ignore pattern.

Folder organization is simple and evaluator-friendly: route screens in `Pages`, shared shell components in `layout`, integration/helpers in `utils`, and static catalog data in `data`.

## Troubleshooting

| Issue | Fix |
| --- | --- |
| Frontend cannot reach backend | Ensure FastAPI is running at `http://127.0.0.1:8000`, or update `BASE_URL` in `src/utils/api.js`. |
| User is redirected to login | Confirm `viventToken` exists and the backend token has not expired. |
| Role dashboard redirects unexpectedly | Check `viventAuthRole` in localStorage and the `allowedRoles` passed in `App.jsx`. |
| `npm run dev` uses the wrong port | Vite is configured for port `5173`; check for another process using that port. |
| API returns `401` | The API client clears auth storage and redirects to `/login`; log in again. |
| Build fails on lint-style issues | Run `npm run lint` and address ESLint errors. |

## Future Frontend Improvements

- Move the backend URL into a Vite environment variable.
- Align all exported API helper paths with the current FastAPI backend routes.
- Add role restriction to `/adminpanel` in the frontend route guard.
- Split large dashboard files into smaller reusable components.
- Add automated frontend tests for routing, auth, dashboards, and API error states.
- Add real profile/settings screens for the profile menu.
- Add loading skeletons and empty-state components shared across pages.
- Add stronger form validation for event creation, applications, and payments.
