# SPEC 03 — Frontend shell and route guards

> **Status:** Draft
> **Depends on:** SPEC 02
> **Date:** 2026-11-24
> **Objective:** Provide the Angular shell with login, session guards, role-based navigation and centralized API error handling.

## Scope

**In:**

- Standalone Angular app with routing and the `core/` layer.
- `AuthService` (signals), `authInterceptor`, `authGuard`, `roleGuard`.
- Login page and mandatory password change page.
- Shell layout with role-filtered navigation.
- Placeholder pages for later specs.
- Spanish UI labels.

**Out of scope (future specs):**

- Feature screens (SPEC 04–10).
- The `frontend-design` visual polish pass.
- Internationalization; Spanish only.

## Data model

No new data structures. Auth state lives in memory in `AuthService` and is restored from `GET /api/auth/me` on boot.

Route access table:

| Route | Allowed roles |
| --- | --- |
| `/login`, `/403` | Public |
| `/cambiar-password` | Any authenticated user |
| `/ventas` | `seller`, `admin` |
| `/historial` | `seller` |
| `/productos`, `/stock` | `admin`, `owner`, `warehouse_manager` |
| `/reportes` | `admin`, `owner` |
| `/usuarios` | `admin`, `owner` |

## Implementation plan

1. Create `frontend/src/app/core/auth/auth.service.ts` with signals `user`, `mustChangePassword` and methods `login`, `logout`, `loadSession`, `changePassword`. Commit.
2. Add `auth.interceptor.ts` (`withCredentials: true`, 401 → logout + `/login`, `PASSWORD_CHANGE_REQUIRED` → `/cambiar-password`) and `error.interceptor.ts` mapping the API error shape to a user message. Commit.
3. Add `auth.guard.ts` and `role.guard.ts` reading route `data.roles`; unauthenticated users go to `/login`, unauthorized users go to `/403`. Commit.
4. Build reusable `login-page` and `change-password-page` components with Spanish validation messages. Commit.
5. Build `shell.component` with a sidebar filtered by role, the logged-in username, a logout button and a router outlet. Commit.
6. Register placeholder components for `/ventas`, `/historial`, `/productos`, `/stock`, `/reportes`, `/usuarios` and the `/403` page. Commit.
7. Add tests for `authGuard`, `roleGuard` and the interceptor redirect behaviour.

## Acceptance criteria

- [ ] Opening `/reportes` without a session redirects to `/login`.
- [ ] Opening `/reportes` as `seller` shows `/403`.
- [ ] The sidebar hides entries the current role cannot access.
- [ ] Reloading the page keeps the session by calling `GET /api/auth/me`.
- [ ] A user with `mustChangePassword` is routed to `/cambiar-password` and cannot navigate elsewhere.
- [ ] Any 401 response logs the user out and redirects to `/login`.
- [ ] Logging out clears the session and returns to `/login`.
- [ ] All visible labels and messages are in Spanish.

## Decisions

- **Yes:** dedicated `/403` page. Redirecting home would hide authorization mistakes during development.
- **Yes:** role list declared in route `data`. Keeps guards generic and the matrix in one place.
- **No:** storing the JWT in the app. The cookie is `httpOnly`; the frontend only keeps the user profile.

## What is not in this spec

- Visual design system and `frontend-design` polish.
- Feature page contents (SPEC 04–10).

## Risks

| Risk | Mitigation |
| --- | --- |
| Guards duplicated per feature route and drifting from the server | Single `ROUTE_ROLES` constant plus server-side enforcement from SPEC 02. |
