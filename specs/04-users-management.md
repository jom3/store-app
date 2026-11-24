# SPEC 04 — User management

> **Status:** Draft
> **Depends on:** SPEC 02, SPEC 03
> **Date:** 2026-11-24
> **Objective:** Let admin create users and admin/owner disable or re-enable them without deleting history.

## Scope

**In:**

- `GET /api/users`, `POST /api/users`, `PATCH /api/users/:id/status`.
- Username uniqueness (case-insensitive), fixed roles, password minimum 8 characters.
- Admin creates users; admin and owner disable; admin re-enables.
- `/usuarios` page with list, create form and status toggle.

**Out of scope (future specs):**

- Deleting users: never allowed.
- Editing a user's role or username after creation.
- Admin password reset (`idea.md` §12, undefined).
- Custom roles or permissions.

## Data model

No new tables. Uses `users` from SPEC 01.

Rules:

- `role` ∈ `admin | owner | warehouse_manager | seller`.
- `is_active = false` blocks login (SPEC 02).
- `must_change_password` is set only by the seed (SPEC 01).

## Implementation plan

1. Add `backend/src/users/users.routes.js` and `users.service.js`: `GET /api/users` for `admin` and `owner`, returning `{ id, username, role, isActive, createdAt }` and never `password_hash`. Commit.
2. Implement `POST /api/users` for `admin`: validate role and password, hash it, return 201. Duplicate username (case-insensitive) returns 409 `USERNAME_TAKEN`. Commit.
3. Implement `PATCH /api/users/:id/status`: `owner` may only set `isActive: false`; `admin` may set either value. Reject an admin disabling their own account with 409 `CANNOT_DISABLE_SELF`. Reject `owner` changing an `admin` account with 403. Commit.
4. Add integration tests for create, duplicate username, disabled login, owner limits and self-disable. Commit.
5. Build the `/usuarios` page: table with role and state, create dialog, enable/disable buttons shown per permission. Commit.

## Acceptance criteria

- [ ] Admin can create one user of each of the four roles.
- [ ] Creating a user with an existing username in different case returns 409.
- [ ] Owner sees the user list and can disable a non-admin user, but `POST /api/users` returns 403.
- [ ] Owner cannot change the status of an `admin` account.
- [ ] Admin cannot disable their own account.
- [ ] A disabled user's row remains in the database and that user can no longer log in.
- [ ] Re-enabling a user restores login access.
- [ ] No endpoint accepts `DELETE`, and no response contains `password_hash`.
- [ ] `seller` and `warehouse_manager` receive 403 on every `/api/users` route.

## Decisions

- **Yes:** admin-only re-enable. Closes the open question in `idea.md` §12 by keeping `owner` strictly below `admin`.
- **No:** owner re-enabling. Would weaken the owner/admin distinction.
- **Yes:** role immutable after creation. Changing roles silently rewrites permission history; not in `idea.md`.
- **Yes:** case-insensitive username uniqueness. Prevents look-alike accounts.
- **No:** self-disable. Prevents locking the only admin out.

## Risks

| Risk | Mitigation |
| --- | --- |
| Removing the last active admin leaves the system unmanageable | Reject disabling the last active `admin` with 409 `LAST_ADMIN`. |

## What is not in this spec

- Password reset by admin.
- Editing roles or usernames.
- Auditing login attempts.
