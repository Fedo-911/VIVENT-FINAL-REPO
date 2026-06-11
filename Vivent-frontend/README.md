# VIVENT - Event Management Platform

VIVENT is a React-based event management frontend built with Vite. The app presents a modern event platform for job fairs, educational expos, food festivals, social media promotion plans, and user account flows.

## Features

- Responsive homepage with hero section, event categories, benefits, promotion plans, and CTA
- Events page with event cards for Job Fair 2026, Food Festival, and Educational Expo
- Login and signup pages with form state handling
- Shared header and footer layout
- Mobile-friendly navigation menu
- React Router based page routing
- Tailwind CSS utility styling
- React Icons integration

## Tech Stack

- React 19
- Vite 8
- React Router DOM
- Tailwind CSS
- React Icons
- ESLint

## Project Structure

```text
Frontend/
|-- public/
|   |-- favicon.svg
|   `-- icons.svg
|-- src/
|   |-- Pages/
|   |   |-- Eventpage.jsx
|   |   |-- Home.jsx
|   |   |-- Login.jsx
|   |   |-- Signup.jsx
|   |   `-- jobfair.jsx
|   |-- layout/
|   |   |-- Footer.jsx
|   |   `-- Header.jsx
|   |-- App.jsx
|   |-- App.css
|   |-- index.css
|   `-- main.jsx
|-- index.html
|-- package.json
`-- vite.config.js
```

## Routes

| Route | Page |
| --- | --- |
| `/` | Home page |
| `/events` | Events listing page |
| `/login` | Login page |
| `/signup` | Signup page |

## Getting Started

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

Run linting:

```bash
npm run lint
```

## Notes

- This is currently a frontend-only project.
- Login and signup forms store data in local React state and log/redirect on submit.
- Some navigation links such as About and Contact are present in the header/footer but their pages are not implemented yet.
