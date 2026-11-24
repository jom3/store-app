# SPEC 02 — Authentication and access control

> **Status:** Draft
> **Depends on:** SPEC 01
> **Date:** 2026-11-24
> **Objective:** Let users log in, enforce active status and the mandatory first password change, and expose server-side role guards.

## Scope

**In:**

- `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`, `POST /api/auth/change-password`.
- bcrypt hashing, JWT cookie, expired/invalid token handling.
- `requireAuth` and `requireRole(...roles)` middleware.
- Blocking every endpoint except `me`, `logout` and `change-password` while `must_change_password` is true.

**Out of scope (future specs):**

- User management endpoints (SPEC 04).
- Password reset by an admin (`idea.md` §12, undefined).
- Refresh tokens, remember-me, rate limiting beyond a basic login throttle.

## Data model

No new tables. Uses `users` from SPEC 01.

JWT claims:

```js
{ sub: 12, role: 'seller', iat: 1764000000, exp: 1764028800 }
```

Cookie: name `session`, `httpOnly`, `SameSite=Lax`, `Secure` when `NODE_ENV=production`, path `/`, max age 8 h.

## Implementation plan

1. Add `backend/src/auth/password.js` (bcrypt hash/compare) and `backend/src/auth/token.js` (sign/verify with `JWT_SECRET`). Commit.
2. Implement `POST /api/auth/login`: validate body, compare hash, reject inactive users, set the cookie and return `{ user: { id, username, role }, mustChangePassword }`.
3. Implement `requireAuth`: read the cookie, verify the token, load the user, reject inactive users, attach `req.user`, and return 403 `PASSWORD_CHANGE_REQUIRED` when the flag is set and the route is not allowlisted.
4. Add `requireRole` middleware and wire it into a placeholder admin-only route used by the tests.
5. Implement `GET /api/auth/me` and `POST /api/auth/logout` (clears the cookie).
6. Implement `POST /api/auth/change-password`: verify `currentPassword`, require `newPassword` of at least 8 characters, hash it, clear `must_change_password` and reissue the cookie.
7. Add integration tests for login, disabled user, wrong password, forced change and role rejection. Commit.

## Acceptance criteria

- [ ] Valid credentials return 200, a `session` cookie and the user's role.
- [ ] `GET /api/auth/me` with the cookie returns the same user; without it returns 401.
- [ ] Wrong password, unknown username and disabled user all return 401 `INVALID_CREDENTIALS` with the same message.
- [ ] Default admin logs in with `mustChangePassword: true`; any other endpoint returns 403 `PASSWORD_CHANGE_REQUIRED`.
- [ ] After changing the password, the flag is false and the rest of the API is reachable.
- [ ] A `seller` calling an admin-only route receives 403 `FORBIDDEN`.
- [ ] The database stores only bcrypt hashes; no plaintext password appears in any response or log.
- [ ] Logout clears the cookie and `me` returns 401 afterwards.

## Decisions

- **Yes:** single generic 401 message. Prevents username enumeration while still rejecting disabled users.
- **No:** distinct "usuario deshabilitado" message. `idea.md` asks for a message, not a differentiated one.
- **Yes:** JWT in `httpOnly` cookie. Not readable by XSS and automatic with Angular `withCredentials`.
- **No:** bearer token in `localStorage`. Exposes the token to any injected script.
- **Yes:** password minimum 8 characters. Cheap guardrail consistent with `idea.md` §10.
- **Yes:** block the whole API while `must_change_password` is true. Required by F-01.

## Risks

| Risk | Mitigation |
| --- | --- |
| Cookie blocked by cross-site dev setup | Use `proxy.conf.json` so the frontend calls `/api` same-origin. |

## What is not in this spec

- Creating or disabling users (SPEC 04).
- Angular login page (SPEC 03).
- Admin-initiated password reset.
