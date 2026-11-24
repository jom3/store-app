# SPEC 01 — Project scaffold

> **Status:** Approved
> **Depends on:** None
> **Date:** 2026-11-24
> **Objective:** Stand up the monorepo, PostgreSQL migrations, seed data and test harness so every later spec can be built and verified.

## Scope

**In:**

- `backend/`, `frontend/`, `database/` layout.
- Docker Compose PostgreSQL 16 for development and tests.
- Environment configuration and `.env.example`.
- Migration runner with `schema_migrations`.
- Initial schema: `users` and `settings`.
- Idempotent seed: default admin and single settings row.
- Jest + Supertest harness against a real test database.
- `README.md` with setup, run, migrate, seed and test commands.

**Out of scope (future specs):**

- Business endpoints beyond `GET /api/health`.
- Auth logic (SPEC 02).
- Angular pages (SPEC 03).
- CI pipeline.

## Data model

`database/migrations/001_init.sql`:

```sql
CREATE TABLE settings (
  id integer PRIMARY KEY CHECK (id = 1),
  business_name text NOT NULL,
  currency_code text NOT NULL,
  locale text NOT NULL,
  timezone text NOT NULL
);

CREATE TABLE users (
  id serial PRIMARY KEY,
  username text NOT NULL,
  password_hash text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'owner', 'warehouse_manager', 'seller')),
  is_active boolean NOT NULL DEFAULT true,
  must_change_password boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX users_username_lower_idx ON users (lower(username));

CREATE TABLE schema_migrations (
  version text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
);
```

Forbidden values: no `deleted_at`, no role/permission tables.

## Implementation plan

1. Create root `README.md`, `.gitignore`, `.env.example` and empty `backend/`, `frontend/`, `database/migrations/`. Commit.
2. Add `docker-compose.yml` with `postgres:16` (database `sistema_ventas`, user `postgres`, password from `.env`, port 5432) and a `sistema_ventas_test` database created on first run.
3. Add `backend/package.json` (type `module`), `backend/src/app.js`, `backend/src/server.js` and `GET /api/health` returning `{ "status": "ok" }`. `npm run dev` uses `node --watch`.
4. Add `backend/src/db/pool.js` reading `DATABASE_URL`; the server exits with a clear message when the database is unreachable at boot.
5. Add `backend/src/db/migrate.js`: creates `schema_migrations`, applies `database/migrations/*.sql` in filename order inside a transaction, skips applied versions, and exposes `npm run migrate`.
6. Add `001_init.sql` and `backend/src/db/seed.js` (`npm run seed`): upsert the admin from `DEFAULT_ADMIN_PASSWORD` with `must_change_password = true`, and upsert `settings` from `BUSINESS_NAME`, `CURRENCY_CODE`, `LOCALE` and `TZ`. Running it twice must not duplicate rows.
7. Add Jest + Supertest config: `TEST_DATABASE_URL`, an `npm test` global setup that drops the test schema, runs migrations and truncates tables between tests. Include the health test.
8. Add Angular workspace under `frontend/` (`npm create @angular`, standalone components, SCSS) with a placeholder route and `proxy.conf.json` forwarding `/api` to `http://localhost:3000`. Commit after `npm test` passes.
9. Fill `README.md`: prerequisites, `docker compose up -d`, migrate, seed, dev servers, test commands and default admin credentials.

## Acceptance criteria

- [ ] `docker compose up -d` starts PostgreSQL with both `sistema_ventas` and `sistema_ventas_test`.
- [ ] `npm run migrate` creates `settings`, `users` and `schema_migrations`.
- [ ] Running `npm run seed` twice leaves exactly one admin and one settings row.
- [ ] `GET /api/health` returns 200 with `{ "status": "ok" }`.
- [ ] `npm test` passes on a clean checkout after setup.
- [ ] `README.md` documents every command listed above.
- [ ] No `.ts` files exist in `backend/`.

## Decisions

- **Yes:** `pg` + raw SQL migrations. No ORM keeps transactions and row locks explicit, which SPEC 07 needs.
- **No:** Prisma or Knex. Extra dependency and abstraction without payoff for this schema size.
- **Yes:** seed admin from `DEFAULT_ADMIN_PASSWORD`, not a hardcoded password. Avoids a committed credential.
- **No:** committing a default password. `idea.md` asks for a default admin, not a published one.

## Risks

| Risk | Mitigation |
| --- | --- |
| Test DB shared with dev DB reset by mistake | Separate `TEST_DATABASE_URL`; setup refuses to run when both URLs match. |
| Node 22 and Angular CLI version mismatch | Pin Node 22 in `README.md` and `engines`. |

## What is not in this spec

- Login endpoints (SPEC 02).
- Angular routing and layout (SPEC 03).
- Deployment or hosting.
