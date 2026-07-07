# ADR-031: Google Sign-In Authentication with Email Allowlist

## Status
Accepted (branch `feat/google-auth`).

## Context
Bombos is a personal household app intended for exactly two users (me and my
wife). It is exposed to the public internet, but has no authentication —
anyone with the URL can read and write all data.

Requirements:
- Restrict access to a small, hard-coded set of Gmail accounts.
- No password to remember; sign in with Google.
- On personal mobile devices, "log in once and stay logged in forever".
- No new dependencies beyond what is already in `package.json` if possible.
- Simple to operate (single-user maintainer).

## Decision

### Auth flow
Use Google Identity Services (GIS) "Sign in with Google" button on the
client. The button returns an ID token (JWT) to a client-side callback,
which POSTs it to `/auth/google`.

The server verifies the ID token itself (no library):
1. Fetch Google's public JWKs from
   `https://www.googleapis.com/oauth2/v3/certs` (cached 1h in memory).
2. Verify the token's RS256 signature with Node's built-in `crypto`.
3. Verify `iss` ∈ {`accounts.google.com`, `https://accounts.google.com`},
   `aud` == `GOOGLE_CLIENT_ID`, `exp` in the future, and
   `email_verified === true`.
4. Check `email` (lowercased) against the `ALLOWED_EMAILS` env var.

### Session
On success we issue **our own** signed cookie, independent of Google's short
ID token lifetime. Format:

```
bombos_session=<base64url(JSON({email, exp}))>.<base64url(HMAC-SHA256(payload, SESSION_SECRET))>
```

Cookie attributes: `HttpOnly`, `SameSite=Lax`, `Secure` (when served over
HTTPS), `Max-Age = 10 years`. On personal devices this effectively means
"forever". On every request we recompute the HMAC (constant-time compare)
and re-check the email against the current `ALLOWED_EMAILS` allowlist —
removing an email from the env var revokes access on the next request.

Because we don't store sessions in the DB, there is no server-side "logout".
This is acceptable: removing an email from `ALLOWED_EMAILS` (and restarting
the server so dotenv reloads) revokes access, and rotating `SESSION_SECRET`
invalidates all existing cookies.

### Allowlist storage
Env var `ALLOWED_EMAILS=a@gmail.com,b@gmail.com` (comma-separated,
case-insensitive). Simpler than a DB table for two users; the user
explicitly chose this option.

### Guard
A global `src/routes/plugin@auth.ts` runs `onRequest` on every route.
Public paths: `/login`, `/auth/*`, static build assets. All other paths
(pages and `/api/*`) require a valid session. Unauthenticated browser
navigation is redirected to `/login?next=<original>`; `/api/*` returns
`401 { error: "Unauthorized" }`.

### Test bypass
`AUTH_DISABLED=true` skips the guard entirely. Set by
`playwright.config.ts` for e2e tests so the existing suites need no
changes.

## Alternatives considered

- **Full OAuth 2.0 authorization-code flow** with refresh tokens. Correct
  "stay-signed-in-forever" solution when trust boundaries are wider, but
  requires a client secret, a callback route, a token store, and refresh
  logic. Overkill for a two-user personal app.
- **Just store the Google ID token in a cookie.** Expires in ~1h — user
  would have to re-login constantly. Rejected by the user.
- **Auth library (`lucia`, `arctic`, `openid-client`).** Adds a
  dependency; our needs are covered in ~200 lines of stdlib code.
- **DB table for allowlist.** Overkill for two static emails; env var
  suffices. Can be introduced later without touching the auth flow.
- **Cloudflare Access / oauth2-proxy in front of Fastify.** Ops-heavy for
  a self-hosted personal app.

## Consequences

Positive:
- No new npm dependencies.
- User signs in once per device, effectively forever.
- Access is revocable by editing an env var and restarting.
- Existing e2e tests continue to work via `AUTH_DISABLED=true`.

Negative / trade-offs:
- No true server-side session revocation without rotating
  `SESSION_SECRET` (which logs out every device).
- A stolen device cookie is valid until either the secret is rotated or
  the email is removed from the allowlist. This is acceptable for the
  threat model (personal phones, personal use).
- The user must not commit `.env`.

## Setup instructions

1. Google Cloud Console:
   1. Create/select a project at https://console.cloud.google.com/.
   2. APIs & Services → OAuth consent screen → configure as "External",
      publish, add your two Gmail addresses as test users if the app is
      still in "Testing".
   3. APIs & Services → Credentials → "Create credentials" →
      "OAuth client ID" → type "Web application".
   4. Authorized JavaScript origins:
      - `http://localhost:5173` (dev)
      - `http://localhost:4173` (preview)
      - `https://your-production-domain.tld`
   5. No redirect URI needed (we use GIS in "popup" mode, not the code
      flow). Save the Client ID.

2. Local `.env` (copy from `.env.example`):
   ```
   GOOGLE_CLIENT_ID=1234567890-xxxxxx.apps.googleusercontent.com
   SESSION_SECRET=<`openssl rand -hex 32`>
   ALLOWED_EMAILS=you@gmail.com,wife@gmail.com
   ```

3. Restart the server. Visit `/` — you'll be redirected to `/login`,
   sign in with a whitelisted Google account, and land back on the app.

## Files added / changed
- `src/utils/auth.ts` — JWT verification, HMAC session cookie helpers.
- `src/routes/plugin@auth.ts` — global request guard.
- `src/routes/login/index.tsx` — Google Sign-In page.
- `src/routes/auth/google/index.ts` — `POST /auth/google`.
- `src/routes/layout.tsx` — hide top nav + skip background streams on `/login`.
- `playwright.config.ts` — `AUTH_DISABLED=true` for e2e web server.
- `.env.example` — documents required env vars.
- `src/utils/auth.test.ts` — vitest coverage for HMAC session round-trip.
