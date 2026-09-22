# Task Manager

A full-stack User Management + Task Tracker: a FastAPI + SQLAlchemy + JWT
backend, and a React + Vite + Tailwind frontend that consumes it.

```
task-manager/
├── backend/     # FastAPI API — auth, roles, task CRUD (see backend/README.md)
└── frontend/    # React app that consumes the API (see frontend/README.md)
```

Each half has its own README with full setup/run/test details. This file is
just the fastest path to running both together locally.

## Quickstart (run both together)

You'll need two terminals — the backend and frontend run as separate
processes and talk to each other over HTTP.

**Terminal 1 — backend** (Python 3.10+)

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# open .env and set a real SECRET_KEY, e.g.:
# python -c "import secrets; print(secrets.token_hex(32))"
uvicorn src.main:app --reload
```

The API is now at `http://localhost:8000` (interactive docs at `/docs`).

**Terminal 2 — frontend** (Node.js 18+)

```bash
cd frontend
npm install
cp .env.example .env
# .env already defaults VITE_API_URL to http://localhost:8000 — adjust if needed
npm run dev
```

The app is now at `http://localhost:5173`. Register an account, log in, and
manage tasks.

### Creating an admin account

Public registration only ever creates a normal `user` (by design — see the
backend README for why). To try the admin views:

1. Register an account through the UI as usual.
2. From `backend/`, with your virtualenv active: `python -m scripts.create_admin you@example.com`
3. Log out and back in — you'll now see the admin dashboard (all users, all tasks).

## Running the tests

```bash
# backend
cd backend && pytest -v

# frontend
cd frontend && npm test
```

## Notes

- CORS: the backend's `CORS_ORIGINS` env var (see `backend/.env.example`)
  already allows `http://localhost:5173` / `http://127.0.0.1:5173` by
  default, matching the frontend's default dev port.
- No secrets are committed anywhere — both `.env` files are git-ignored;
  only `.env.example` placeholders are tracked.
