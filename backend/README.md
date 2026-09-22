# Task Manager API

A simple backend built with **FastAPI**, **SQLAlchemy**, and **JWT authentication**
that lets users register, log in, and manage their own tasks — with an admin
role that can view/manage all users and all tasks.

## Tech stack

| Concern        | Choice                          |
|-----------------|----------------------------------|
| Framework       | Python 3 + FastAPI              |
| ORM             | SQLAlchemy                      |
| Database        | SQLite (default) or PostgreSQL  |
| Auth            | JWT (python-jose) + bcrypt (passlib) |
| Testing         | pytest + FastAPI TestClient      |

## Project structure

```
task-manager-api/
├── src/
│   ├── main.py          # FastAPI app, startup, error handlers
│   ├── config.py        # env-based settings
│   ├── database.py      # SQLAlchemy engine/session
│   ├── models.py         # User, Task ORM models
│   ├── schemas.py        # Pydantic request/response models
│   ├── security.py       # password hashing + JWT helpers
│   ├── deps.py            # auth dependencies (get_current_user, require_admin)
│   └── routers/
│       ├── auth.py       # /auth/register, /auth/login
│       ├── users.py      # /users/me, /users (admin), /users/{id} (admin)
│       └── tasks.py      # /tasks CRUD
├── scripts/
│   └── create_admin.py   # promote a user to admin (see below)
├── tests/
│   ├── conftest.py
│   ├── test_security_unit.py   # unit tests
│   ├── test_auth_api.py        # API tests
│   ├── test_users_api.py       # API tests
│   └── test_tasks_api.py       # API tests
├── .env.example
├── .gitignore
├── requirements.txt
└── README.md
```

## Security notes

- Passwords are **never** stored in plain text — they're hashed with bcrypt (`passlib`).
- Auth uses **JWT** bearer tokens (`python-jose`), signed with a secret loaded from
  the environment (never hardcoded).
- All secrets/config live in environment variables (`.env`, which is git-ignored).
  Only `.env.example` — with placeholder values — is committed.
- `/auth/register` **cannot** be used to create an admin account. Every public
  registration creates a normal `user`. This prevents privilege escalation via
  the public API. See "Creating an admin" below.
- Role checks are enforced server-side on every protected route (not just hidden
  in the UI): normal users can only see/modify their own profile and tasks;
  admins can see/manage everything.

## 1. Setup

Requires Python 3.10+.

```bash
git clone <your-repo-url>
cd task-manager/backend

python3 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate

pip install -r requirements.txt

cp .env.example .env
```

Open `.env` and set a real `SECRET_KEY`. You can generate one with:

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

By default `.env` uses SQLite (`sqlite:///./app.db`) — zero extra setup needed.
To use PostgreSQL instead, set `DATABASE_URL` to something like:

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/task_manager
```

(and `pip install psycopg2-binary` if it isn't already installed for your platform).

## 2. Run the server

```bash
uvicorn src.main:app --reload
```

The API is now available at `http://127.0.0.1:8000`.
Interactive docs (Swagger UI): `http://127.0.0.1:8000/docs`.

Tables are created automatically on startup (via `Base.metadata.create_all`).

### Creating an admin account

1. Register normally through `/auth/register`.
2. Promote that account to admin from the project root:

   ```bash
   python -m scripts.create_admin you@example.com
   ```

3. Log in again — the new token will include the `admin` role.

## 3. Run the tests

```bash
pytest -v
```

Tests use their own isolated SQLite database (`test.db`, created/dropped per
test) and never touch your real `app.db`. There are:

- **Unit tests** (`tests/test_security_unit.py`) — password hashing and JWT
  encode/decode/tamper-detection logic, in isolation from the API.
- **API tests** (`tests/test_auth_api.py`, `test_users_api.py`, `test_tasks_api.py`)
  — full request/response flows: registration, login, role-based access
  control, and task ownership rules.

## API reference

All request/response bodies are JSON. Protected routes require:
`Authorization: Bearer <token>`.

### Auth

| Method | Path            | Auth | Description                     |
|--------|-----------------|------|----------------------------------|
| POST   | `/auth/register`| none | Create a new (non-admin) user   |
| POST   | `/auth/login`   | none | Get a JWT access token          |

### Users

| Method | Path          | Auth        | Description                         |
|--------|---------------|-------------|--------------------------------------|
| GET    | `/users/me`   | any user    | View your own profile                |
| GET    | `/users`      | admin only  | View all users                       |
| DELETE | `/users/{id}` | admin only  | Delete a user (cascades their tasks) |

### Tasks

| Method | Path          | Auth        | Description                                   |
|--------|---------------|-------------|------------------------------------------------|
| POST   | `/tasks`      | any user    | Create a task (owned by the caller)            |
| GET    | `/tasks`      | any user    | List your own tasks (admin: all tasks)         |
| GET    | `/tasks/{id}` | owner/admin | Get one task                                   |
| PUT    | `/tasks/{id}` | owner/admin | Update a task (partial update supported)       |
| DELETE | `/tasks/{id}` | owner/admin | Delete a task                                  |

Task `status` is one of `pending` / `completed`. `title` is required;
`description` is optional.

## Sample requests

### Register

```bash
curl -X POST http://127.0.0.1:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "alice@example.com", "password": "password123"}'
```

Response (`201 Created`):
```json
{"id": 1, "email": "alice@example.com", "role": "user", "created_at": "2026-09-22T05:00:00"}
```

### Login

```bash
curl -X POST http://127.0.0.1:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "alice@example.com", "password": "password123"}'
```

Response (`200 OK`):
```json
{"access_token": "eyJhbGciOi...", "token_type": "bearer"}
```

### Create a task

```bash
curl -X POST http://127.0.0.1:8000/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"title": "Write report", "description": "Q3 summary"}'
```

### List my tasks

```bash
curl http://127.0.0.1:8000/tasks -H "Authorization: Bearer <TOKEN>"
```

### Update a task

```bash
curl -X PUT http://127.0.0.1:8000/tasks/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"status": "completed"}'
```

### Delete a task

```bash
curl -X DELETE http://127.0.0.1:8000/tasks/1 -H "Authorization: Bearer <TOKEN>"
```

### Admin: list all users

```bash
curl http://127.0.0.1:8000/users -H "Authorization: Bearer <ADMIN_TOKEN>"
```

### Admin: delete a user

```bash
curl -X DELETE http://127.0.0.1:8000/users/3 -H "Authorization: Bearer <ADMIN_TOKEN>"
```

## Error handling

The API returns standard HTTP status codes with a clear `detail` message:

- `400 Bad Request` — invalid operation (e.g. admin trying to delete themselves)
- `401 Unauthorized` — missing/invalid/expired token, or bad login credentials
- `403 Forbidden` — authenticated but not allowed (wrong role or not the owner)
- `404 Not Found` — resource doesn't exist
- `409 Conflict` — duplicate email on registration
- `422 Unprocessable Entity` — request body failed validation (with per-field errors)
