/**
 * POST /auth/google
 *
 * Called by the login page after Google Identity Services returns an ID token
 * via the `credential` field. Verifies the token, checks the allowlist, and
 * issues a long-lived signed session cookie.
 *
 * Body: { credential: string, next?: string }
 * Response: 302 to `next` (or `/`) on success; 401 JSON on failure.
 */
import type { RequestHandler } from "@builder.io/qwik-city";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  createSessionCookieValue,
  isEmailAllowed,
  verifyGoogleIdToken,
} from "~/utils/auth";

export const onPost: RequestHandler = async ({ parseBody, cookie, redirect, json, url }) => {
  const body = (await parseBody()) as { credential?: string; next?: string } | null;
  const credential = body?.credential;
  if (!credential) {
    json(400, { error: "Missing credential" });
    return;
  }

  let claims;
  try {
    claims = await verifyGoogleIdToken(credential);
  } catch (err) {
    json(401, { error: "Invalid Google token", detail: (err as Error).message });
    return;
  }

  const email = claims.email?.toLowerCase();
  if (!email || claims.email_verified !== true) {
    json(401, { error: "Google account has no verified email" });
    return;
  }
  if (!isEmailAllowed(email)) {
    json(403, { error: "This email is not allowed" });
    return;
  }

  const value = createSessionCookieValue(email);
  cookie.set(SESSION_COOKIE, value, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: url.protocol === "https:",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  const next = typeof body?.next === "string" && body.next.startsWith("/") ? body.next : "/";
  throw redirect(302, next);
};
