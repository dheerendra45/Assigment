# TaskFlow — Team Task Tracker

A production-quality, organization-scoped task tracker. Node.js + Express +
Prisma + PostgreSQL + Redis on the back, React (Vite) on the front, all wired
together with Docker Compose.

---

## Quick start (one command)

```bash
docker compose up --build
```

That's it — no manual setup. Compose will:

1. start **Postgres** (healthcheck) and **Redis** (healthcheck);
2. build the **backend**, wait for a healthy DB, run `prisma migrate deploy`,
   seed demo data on first boot, then start the API;
3. build the **frontend** and serve it via nginx once the API is healthy.

| Service   | URL                                            |
| --------- | ---------------------------------------------- |
| Frontend  | http://localhost:8080                          |
| API       | http://localhost:3001  (health: `/health`)     |
| Postgres  | localhost:5433 (user/pass/db: `tasktracker`)   |
| Redis     | localhost:6379                                 |

### Demo accounts (seeded automatically, password `Password123`)

| Role    | Email               | Can do                                            |
| ------- | ------------------- | ------------------------------------------------- |
| ADMIN   | admin@acme.test     | manage users, tasks, analytics                    |
| MANAGER | manager@acme.test   | manage tasks, assign members, analytics           |
| MEMBER  | member@acme.test    | view/update only tasks assigned to them           |

---

## Local development (without Docker for the app)

You still need Postgres + Redis; the easiest way is to run just those via Compose:

```bash
docker compose up -d postgres redis

# Backend
cd backend
npm install
npx prisma migrate deploy   # or: npm run prisma:migrate:dev
npm run seed                # optional demo data
npm run dev                 # http://localhost:3001

# Frontend (new terminal)
cd frontend
npm install
npm run dev                 # http://localhost:5173
```

The backend reads `backend/.env` (already provided for local dev — DB on port
**5433** to avoid clashing with a local Postgres).

---

## Tech stack

- **Backend:** Node.js 22, Express 4, Prisma 6 (ES modules)
- **DB:** PostgreSQL 16, real `prisma migrate` migrations (incremental history)
- **Cache:** Redis 7 (ioredis)
- **Auth:** JWT access (~15m) + rotating refresh tokens (~7d), bcrypt password hashing
- **Validation:** zod, with field-level error messages
- **Frontend:** React 18 + Vite + Tailwind + Framer Motion
- **Tests:** Jest + supertest

---

## Architecture

```
backend/src
├── config/        env, prisma client, redis client
├── middlewares/   authenticate, requireRole, taskAccess (ownership), validate, errorHandler
├── validators/    zod schemas per resource
├── controllers/   thin HTTP handlers — ZERO role logic
├── services/      domain logic: auth, task, user, analytics, cache, stateMachine
└── routes/        wiring: middleware chains -> controller
```

### RBAC — enforced entirely in middleware (hard spec requirement)

Controllers contain **no role checks**. Authorization is composed from middleware
that runs *before* the controller:

- `authenticate` — verifies the Bearer access token, attaches `req.user`.
- `requireRole([...])` — pure role gate (e.g. create/delete tasks need ADMIN/MANAGER;
  user management needs ADMIN).
- `taskAccess.loadTask` — loads the task **scoped to the caller's organization**
  (cross-org access returns 404, never leaking existence).
- `taskAccess.authorizeTaskMutation` — resource-level rule: ADMIN/MANAGER may
  mutate any task in the org; a MEMBER only a task assigned to them, else **403**.
- `taskAccess.scopeTaskList` — forces a MEMBER's task list to their own tasks.

Roles, scoped to the organization:

| Action                         | ADMIN | MANAGER | MEMBER (own task) |
| ------------------------------ | :---: | :-----: | :---------------: |
| Register/login                 |   ✓   |    ✓    |         ✓         |
| List/read tasks                |   ✓   |    ✓    |    ✓ (own only)   |
| Create / delete task           |   ✓   |    ✓    |         ✗         |
| Update task fields             |   ✓   |    ✓    |         ✓         |
| Advance task status            |   ✓   |    ✓    |         ✓         |
| Manage users (create/role/del) |   ✓   |    ✗    |         ✗         |
| List org members               |   ✓   |    ✓    |         ✗         |
| Analytics                      |   ✓   |    ✓    |         ✗         |

### Status state machine (enforced server-side)

```
TODO ──▶ IN_PROGRESS ──▶ IN_REVIEW ──▶ DONE
  ▲           │              │
  │           ▼              ▼
  └──────── BLOCKED ◀────────┘     (BLOCKED reachable from any active state)
```

- `DONE` is terminal.
- From `BLOCKED` you resume into `IN_PROGRESS` (or back to `TODO`).
- Any disallowed transition → `400 VALIDATION_ERROR` with the allowed set listed.
- Only the **assignee or a MANAGER/ADMIN** may advance status (else `403`).

---

## Caching strategy (Redis) & invalidation

The hot path is "a user's task list". We cache the **per-assignee task
list** using a **cache-aside + write-through-invalidation** pattern.

- **Key shape:** `tasks:assignee:{userId}:page:{n}:limit:{m}`
- **Read (GET /tasks scoped to a single assignee):**
  1. Look up the key. **Hit** → return cached JSON (`cached: true`).
  2. **Miss** → query Postgres, then `SETEX` the page with a 60s TTL.
  - Only assignee-scoped queries (no status/priority filter) are cached — that is
    exactly the per-assignee task list we want to cache. A MEMBER's board is
    always assignee-scoped, so it is served from cache.
- **Write (create / update / delete / status change):** we cannot know which
  `page:limit` combinations are cached, so we **delete every key under the affected
  assignee's namespace** via `SCAN tasks:assignee:{userId}:*` + `DEL`. If a task is
  **reassigned**, both the old and new assignee namespaces are purged.
- **Resilience:** Redis is best-effort. Every cache call is wrapped so a Redis
  outage degrades to "always read from Postgres" — the API never fails because the
  cache is down.

See `backend/src/services/cache.service.js` and `task.service.js`.

---

## Error handling & validation

Every error response uses a single envelope:

```json
{ "status": 400, "code": "VALIDATION_ERROR", "message": "Validation failed",
  "details": [{ "field": "email", "message": "email must be a valid email address" }] }
```

- One centralized Express error middleware (`middlewares/errorHandler.js`).
- `AppError` carries `status` + stable `UPPER_SNAKE_CASE` code.
- All inputs validated with **zod**; validation failures include a `details`
  array of field-level messages. Prisma errors (unique/foreign-key/not-found) are
  mapped to friendly codes.

Codes: `VALIDATION_ERROR`, `UNAUTHORIZED`, `INVALID_CREDENTIALS`, `FORBIDDEN`,
`NOT_FOUND`, `CONFLICT`, `INTERNAL_ERROR`.

---

## API overview

Base URL: `http://localhost:3001/api`. Full spec in [`openapi.yaml`](./openapi.yaml)
— import it straight into Postman (Import → OpenAPI), Insomnia, or any Swagger UI.

| Method | Path                  | Auth        | Notes                               |
| ------ | --------------------- | ----------- | ----------------------------------- |
| POST   | `/auth/register`      | public      | creates org; registrant = ADMIN     |
| POST   | `/auth/login`         | public      |                                     |
| POST   | `/auth/refresh`       | refresh tok | **rotates** the refresh token       |
| POST   | `/auth/logout`        | refresh tok | revokes the refresh token           |
| GET    | `/auth/me`            | access      |                                     |
| GET    | `/tasks`              | access      | pagination + status/priority/assignee filters |
| POST   | `/tasks`              | ADMIN/MGR   |                                     |
| GET    | `/tasks/:id`          | access      | org-scoped                          |
| PUT    | `/tasks/:id`          | owner/MGR/ADMIN |                                 |
| PATCH  | `/tasks/:id/status`   | assignee/MGR/ADMIN | state machine enforced       |
| DELETE | `/tasks/:id`          | ADMIN/MGR   |                                     |
| GET    | `/users`              | ADMIN/MGR   | list org members                    |
| POST   | `/users`              | ADMIN       |                                     |
| PATCH  | `/users/:id/role`     | ADMIN       |                                     |
| DELETE | `/users/:id`          | ADMIN       |                                     |
| GET    | `/analytics`          | ADMIN/MGR   | overdue per user + avg completion   |

`GET /tasks` response:

```json
{
  "data": [ /* tasks with assignee */ ],
  "pagination": { "page": 1, "limit": 20, "total": 42, "totalPages": 3,
                  "hasNextPage": true, "hasPrevPage": false },
  "cached": false
}
```

---

## Tests

```bash
cd backend
docker compose up -d postgres redis   # tests need DB + Redis
npm test
```

Covers the two required critical flows plus extras:

- ✅ invalid status transition is rejected (`400 VALIDATION_ERROR`)
- ✅ a MEMBER cannot advance another member's task (`403`)
- ✅ a MEMBER cannot create tasks (`403`)
- ✅ the assignee can advance their own task (`200`)

---

## DB design decision (why these indexes / relationships)

**Indexes.** `GET /tasks` filters and sorts on a small, predictable set of
columns, so `Task` carries single-column indexes on `status`, `assigneeId`,
`dueDate`, and `organizationId`. I deliberately chose **independent single-column
indexes over a composite** because the filters are each *optional and
independent* — a composite like `(status, assigneeId)` only helps when the leading
column is present, whereas Postgres can bitmap-AND several single-column indexes
for arbitrary filter combinations. `organizationId` is indexed because **every**
query is org-scoped (multi-tenancy), making it the most common predicate.

**Relationships.** Multi-tenancy is modeled by scoping `User` and `Task` to an
`Organization` (`onDelete: Cascade`), giving data isolation without separate
databases. `Task.assignee` is **nullable** with `onDelete: SetNull` so deleting a
user doesn't destroy their tasks' history — the task simply becomes unassigned.
Refresh tokens are stored **hashed** (SHA-256) with a `revoked` flag rather than
hard-deleted, enabling rotation, server-side revocation, and reuse detection.

---

## What I'd improve with more time

- **Dedicated `completed_at` column** so "avg completion time" is exact rather than
  approximated by `updated_at - created_at` on DONE tasks.
- **Refresh-token reuse detection → family revocation:** if a already-rotated token
  is replayed, revoke the whole token family (current code revokes per-token).
- **Drag-and-drop board** with optimistic updates (currently status advances via
  buttons constrained to valid transitions).
- **Background cleanup** of expired refresh tokens (a cron/worker), and rate
  limiting on auth endpoints.
- **Cursor-based pagination** for very large task lists, and an "audit log" table.
- **More test coverage:** refresh rotation, cache hit/invalidation, pagination
  edges; plus a separate disposable test database in CI.
- **Observability:** structured logging (pino), request IDs, and metrics.

---

## Intentional simplifications / tradeoffs

- The first registered user becomes the org ADMIN (no separate org-provisioning flow).
- "Projects" are represented implicitly — tasks live directly under an
  organization rather than under a separate Project entity, to keep the surface
  focused on the Task workflow / RBAC / caching mechanics.
- Avg completion time approximated via timestamps (see "what I'd improve").
- JWT secrets in `docker-compose.yml` are demo values — rotate for any real deploy.
