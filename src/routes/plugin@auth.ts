/**
 * Global auth guard.
 *
 * Runs on every request (Qwik City loads `plugin@*.ts` for all routes).
 * Verifies the session cookie and, if invalid, redirects browser requests to
 * `/login` and returns 401 for API requests.
 *
 * Public paths: `/login`, `/auth/*`, static build assets. Everything else
 * requires a valid session whose email is still in `ALLOWED_EMAILS`.
 *
 * Bypass: set `AUTH_DISABLED=true` (used by e2e tests / local dev without
 * Google credentials).
 */
import type { RequestHandler } from "@builder.io/qwik-city";
import {
  SESSION_COOKIE,
  isAuthDisabled,
  isEmailAllowed,
  verifySessionCookie,
} from "~/utils/auth";

function isPublicPath(pathname: string): boolean {
  if (pathname === "/login" || pathname.startsWith("/login/")) return true;
  if (pathname.startsWith("/auth/")) return true;
  // Qwik build assets — Qwik City serves these outside route handlers in prod,
  // but be defensive for dev / SSR.
  if (pathname.startsWith("/build/") || pathname.startsWith("/assets/")) return true;
  if (pathname === "/favicon.ico" || pathname === "/manifest.json") return true;
  return false;
}

export const onRequest: RequestHandler = async ({ url, cookie, redirect, json, sharedMap, headers }) => {
  if (isAuthDisabled()) return;
  if (isPublicPath(url.pathname)) return;

  const raw = cookie.get(SESSION_COOKIE)?.value;
  const session = verifySessionCookie(raw);
  if (!session || !isEmailAllowed(session.email)) {
    // Clear any stale cookie.
    if (raw) cookie.delete(SESSION_COOKIE, { path: "/" });

    const isApi = url.pathname.startsWith("/api/");
    const accept = headers.get("accept") ?? "";
    if (isApi || accept.includes("application/json")) {
      json(401, { error: "Unauthorized" });
      return;
    }
    throw redirect(302, `/login?next=${encodeURIComponent(url.pathname + url.search)}`);
  }

  sharedMap.set("userEmail", session.email);
};
