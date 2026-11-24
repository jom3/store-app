# SPEC — Overview: sistema de ventas

> **Status:** Draft
> **Date:** 2026-11-24
> **Source:** `idea.md`

## Modules

| # | Spec | Objective | Depends on |
| --- | --- | --- | --- |
| 01 | `project-scaffold` | Stand up the monorepo, PostgreSQL migrations, seed data and test harness. | None |
| 02 | `auth-and-access` | Let users log in, enforce active status, forced first password change and server-side role guards. | 01 |
| 03 | `frontend-shell` | Provide the Angular shell with login, session guards and role-based navigation. | 02 |
| 04 | `users-management` | Let admin create users and admin/owner disable them without deleting history. | 02, 03 |
| 05 | `products` | Manage the product catalog and its stock entries with price history preserved. | 03 |
| 06 | `stock-entries` | Let warehouse staff register and correct stock entries with a written reason. | 05 |
| 07 | `sales-registration` | Register cash sales atomically, deduct stock and assign a correlative number. | 05 |
| 08 | `receipts` | Show, print and reprint the sale receipt marked as copy. | 07 |
| 09 | `sales-cancellation` | Cancel sales with a reason, restore stock and keep the record. | 07 |
| 10 | `reports-and-history` | Report sales by seller, day, week and month, and let each seller see their own history. | 07, 09 |

## Global decisions

- **Stack:** Angular frontend, Express backend in plain JavaScript (no TypeScript), PostgreSQL 16.
- **Repo layout:** `backend/`, `frontend/`, `database/` as in `idea.md` §9.
- **Data access:** `pg` driver and raw SQL. No ORM.
- **Migrations:** numbered `.sql` files in `database/migrations/`, applied by `backend/src/db/migrate.js` with a `schema_migrations` table.
- **Auth:** bcrypt hashes, JWT (HS256, 8 h) in the `session` cookie (`httpOnly`, `SameSite=Lax`). Role checks in server middleware.
- **Roles:** `admin`, `owner`, `warehouse_manager`, `seller` (English identifiers; Spanish labels in the UI).
- **Money:** `numeric(12,2)` in PostgreSQL; arithmetic in integer cents in JavaScript; formatting with `Intl.NumberFormat(locale, { style: 'currency', currency })`.
- **Sale number:** locked `counters` row, gap-free, displayed zero-padded to 6 digits, never reset.
- **Dates:** stored as `timestamptz`; "same day" and report grouping use `settings.timezone`.
- **Reports:** ISO weeks, Monday to Sunday.
- **Printing:** browser print of the receipt view with `@media print`. No thermal printer integration.
- **Tests:** Jest + Supertest against a real PostgreSQL test database (backend); Karma headless for guards and services (frontend).
- **No hard deletes:** users disabled, products inactive, sales cancelled.
- **Language:** code identifiers and routes in English; UI text and messages in Spanish.
- **API errors:** `{ "error": { "code": "UPPER_SNAKE", "message": "texto para el usuario" } }`.
- **HTTP status:** 400 validation, 401 unauthenticated, 403 forbidden, 404 not found, 409 conflict.

## Pending decisions

| Decision | Current assumption | Reason |
| --- | --- | --- |
| Currency and locale seed values | `CURRENCY_CODE` and `LOCALE` env vars, copied to `settings` | `idea.md` §12 leaves currency undefined; keeping it configurable avoids hardcoding. |
| Re-enabling disabled users | Only `admin` can re-enable; `owner` can only disable | Open question in `idea.md` §12; this keeps owner privileges strictly below admin. |
| Password reset | Out of the MVP; recorded in SPEC 04 as future work | `idea.md` §12 leaves it undefined; adding it would invent a feature. |
| Hosting | Not covered by any spec | Deployment target still undefined. |
| Thermal printer | Out of scope | Browser printing covers the MVP. |
