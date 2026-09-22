# Task Manager Frontend

A React + Vite frontend for the Task Manager API — register, log in, and
manage your tasks. Admins additionally see and manage all users and all
tasks.

## Tech stack

| Concern     | Choice                                    |
|-------------|--------------------------------------------|
| Framework   | React 19 + Vite                             |
| Routing     | react-router-dom                            |
| HTTP client | axios (with JWT + error-handling interceptors) |
| Styling     | Tailwind CSS v4                             |
| Testing     | Jest + React Testing Library + axios-mock-adapter |

This project is a **pure frontend**. It does not run or embed the backend —
it talks to it over HTTP using the URL in `VITE_API_URL`. Pair it with the
companion `task-manager-api` backend (or any API implementing the same
contract).

## Project structure

```
task-manager-frontend/
├── src/
│   ├── api/                # HTTP calls (auth, users, tasks) + axios client
│   │   ├── client.js        # axios instance: attaches JWT, normalizes errors
│   │   ├── auth.js
│   │   ├── users.js
│   │   └── tasks.js
│   ├── context/
│   │   └── AuthContext.jsx  # token/user state, login/register/logout
│   ├── components/
│   │   ├── NavBar.jsx
│   │   ├── ProtectedRoute.jsx
│   │   ├── TaskForm.jsx      # create + edit, client-side validation
│   │   ├── TaskItem.jsx
│   │   ├── TaskList.jsx
│   │   ├── UserList.jsx      # admin-only user table
│   │   ├── StatusBadge.jsx
│   │   ├── ErrorBanner.jsx
│   │   ├── EmptyState.jsx
│   │   └── LoadingSpinner.jsx
│   ├── pages/
│   │   ├── LoginPage.jsx
│   │   ├── RegisterPage.jsx
│   │   └── DashboardPage.jsx
│   ├── config.js             # reads VITE_API_URL — no hardcoded URLs
│   ├── App.jsx                # routes
│   ├── main.jsx
│   └── index.css
├── tests/
│   ├── setupTests.js
│   ├── test-utils.jsx
│   ├── TaskForm.test.jsx          # component test
│   ├── LoginPage.test.jsx         # component test
│   ├── DashboardPage.test.jsx     # component test (role-based rendering)
│   └── api.integration.test.js    # integration/API test (real axios + interceptors)
├── .env.example
├── .gitignore
├── jest.config.cjs
├── babel.config.cjs           # used only by Jest; Vite uses esbuild and ignores this
├── vite.config.js
├── package.json
└── README.md
```

## Security notes

- The JWT is stored in `localStorage` under a single namespaced key
  (`task_manager_token`) and attached automatically to every request via an
  axios request interceptor — components never touch the token directly.
  (Note: `localStorage` is readable by any JS on the page, so it's vulnerable
  to XSS; an httpOnly cookie issued by the backend would be more defense in
  depth, but requires backend cookie support which this API doesn't provide.)
- A response interceptor watches for `401 Unauthorized`; on any such response
  the app clears the stored token and state, and `ProtectedRoute` sends the
  user back to `/login`.
- `/dashboard` is wrapped in `ProtectedRoute`: unauthenticated users are
  redirected to `/login`, and the original destination is preserved so they
  land back where they wanted to go after logging in.
- The backend's base URL is **only** read from `VITE_API_URL` (an environment
  variable) — never hardcoded in source. `.env` is git-ignored; only
  `.env.example` (with a placeholder) is committed.
- No API keys or secrets live in the frontend at all — the JWT is a
  short-lived, user-scoped token issued by the backend after login, not a
  static secret.

## 1. Setup

Requires Node.js 18+.

```bash
git clone <your-repo-url>
cd task-manager/frontend
npm install
cp .env.example .env
```

Open `.env` and point `VITE_API_URL` at your running backend, e.g.:

```
VITE_API_URL=http://localhost:8000
```

## 2. Run the app

Start the backend first (see its own README), then:

```bash
npm run dev
```

The app runs at `http://localhost:5173` by default.

To build a production bundle:

```bash
npm run build
npm run preview   # serve the built bundle locally
```

## 3. Run the tests

```bash
npm test
```

This runs all Jest suites (jsdom environment). There are:

- **Component tests**
  - `tests/TaskForm.test.jsx` — required-field validation, trimmed submit
    payload, and API-error surfacing.
  - `tests/LoginPage.test.jsx` — required-field validation, malformed-email
    validation, successful login + redirect, and API error display.
  - `tests/DashboardPage.test.jsx` — confirms normal users never see the
    admin user panel and admins do, exercising the role-based-access
    requirement.
- **Integration/API test**
  - `tests/api.integration.test.js` — exercises the *real* axios instance and
    its interceptors (not mocked API functions) against a mocked HTTP layer
    (`axios-mock-adapter`): correct endpoints/payloads, automatic JWT
    attachment, and normalization of both validation errors and network
    failures into readable messages.

`npm run test:watch` re-runs tests on file changes.

## How the pages work

### Register (`/register`)
- Client-side validation: valid email format, password ≥ 8 characters,
  confirm-password match, all with inline error messages.
- On success, calls `POST /auth/register`, shows a success message, and
  redirects to `/login`.
- Registration never lets you pick a role — the backend always creates a
  normal `user`; promoting someone to `admin` is an intentional, out-of-band
  backend operation (see the backend README).

### Login (`/login`)
- Client-side validation: required email/password, valid email format.
- On success, calls `POST /auth/login`, stores the JWT, fetches `/users/me`,
  and redirects to `/dashboard` (or back to whatever protected page the user
  originally tried to visit).
- Invalid credentials show the backend's error message inline.

### Dashboard (`/dashboard`, protected)
- Profile card with the logged-in user's email, role, and join date.
- **Admins** additionally see an "All users" table (email, role, joined date,
  delete button — admins can't delete their own account from this screen).
- Task list: normal users see only their own tasks; admins see every task
  (with an "Owner ID" annotation) — this mirrors the backend's own
  authorization rules, which are the real enforcement point.
- Create/Edit/Delete tasks inline, with loading states while fetching and a
  friendly empty state ("No tasks yet") when the list is empty.
- Logout button clears the session and returns to `/login`.

## Environment variables

| Variable        | Description                          | Example                 |
|------------------|----------------------------------------|--------------------------|
| `VITE_API_URL`   | Base URL of the Task Manager backend  | `http://localhost:8000` |
