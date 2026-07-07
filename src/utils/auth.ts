/**
 * Authentication utilities.
 *
 * Strategy (see docs/adr-031-google-auth.md):
 *  1. Client uses Google Identity Services (GIS) "Sign in with Google" button
 *     which returns an ID token (a JWT) to our /auth/google endpoint.
 *  2. We verify the ID token's signature against Google's public JWKs, check
 *     issuer / audience / expiry, then check email is in ALLOWED_EMAILS env.
 *  3. We then issue OUR OWN long-lived signed cookie (HMAC over
 *     `email|expiresAt` using SESSION_SECRET). Default lifetime: 10 years, so
 *     the user effectively stays logged in forever on their device.
 *  4. On every request the middleware verifies the HMAC + re-checks the email
 *     against the current allowlist (so removing an email revokes access on
 *     the next request).
 *
 * No external libraries required — uses Node's built-in `crypto` and `fetch`.
 */
import { createHmac, createPublicKey, createVerify, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "bombos_session";
/** 10 years in seconds. Practically "forever" on a personal device. */
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 365 * 10;

const GOOGLE_ISSUERS = new Set(["accounts.google.com", "https://accounts.google.com"]);
const GOOGLE_JWKS_URL = "https://www.googleapis.com/oauth2/v3/certs";

export interface SessionPayload {
  email: string;
  /** Unix seconds. */
  exp: number;
}

/* --------------------------------- env helpers -------------------------------- */

export function getAllowedEmails(): string[] {
  const raw = process.env.ALLOWED_EMAILS ?? "";
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function isEmailAllowed(email: string | undefined | null): boolean {
  if (!email) return false;
  return getAllowedEmails().includes(email.toLowerCase());
}

export function getGoogleClientId(): string {
  const id = process.env.GOOGLE_CLIENT_ID;
  if (!id) throw new Error("GOOGLE_CLIENT_ID env var is not set");
  return id;
}

function getSessionSecret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 16) {
    throw new Error("SESSION_SECRET env var must be set (>= 16 chars)");
  }
  return s;
}

/** Test / dev escape hatch: `AUTH_DISABLED=true` bypasses the guard. */
export function isAuthDisabled(): boolean {
  return process.env.AUTH_DISABLED === "true";
}

/* ---------------------------- our session cookie ---------------------------- */

function b64url(input: Buffer | string): string {
  const buf = typeof input === "string" ? Buffer.from(input) : input;
  return buf.toString("base64").replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function b64urlDecode(input: string): Buffer {
  const pad = input.length % 4 === 0 ? "" : "=".repeat(4 - (input.length % 4));
  return Buffer.from(input.replace(/-/g, "+").replace(/_/g, "/") + pad, "base64");
}

function signPayload(payloadB64: string): string {
  const mac = createHmac("sha256", getSessionSecret()).update(payloadB64).digest();
  return b64url(mac);
}

export function createSessionCookieValue(email: string, maxAgeSeconds = SESSION_MAX_AGE_SECONDS): string {
  const payload: SessionPayload = {
    email: email.toLowerCase(),
    exp: Math.floor(Date.now() / 1000) + maxAgeSeconds,
  };
  const payloadB64 = b64url(JSON.stringify(payload));
  const sig = signPayload(payloadB64);
  return `${payloadB64}.${sig}`;
}

export function verifySessionCookie(cookieValue: string | undefined | null): SessionPayload | null {
  if (!cookieValue) return null;
  const parts = cookieValue.split(".");
  if (parts.length !== 2) return null;
  const [payloadB64, sig] = parts;
  let expectedSig: string;
  try {
    expectedSig = signPayload(payloadB64);
  } catch {
    return null;
  }
  const a = Buffer.from(sig);
  const b = Buffer.from(expectedSig);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  let payload: SessionPayload;
  try {
    payload = JSON.parse(b64urlDecode(payloadB64).toString("utf8"));
  } catch {
    return null;
  }
  if (typeof payload.email !== "string" || typeof payload.exp !== "number") return null;
  if (payload.exp < Math.floor(Date.now() / 1000)) return null;
  return payload;
}

/* --------------------------- Google ID token verify -------------------------- */

interface Jwk {
  kid: string;
  kty: string;
  n: string;
  e: string;
  alg?: string;
  use?: string;
}

interface JwksCache {
  keys: Jwk[];
  fetchedAt: number;
}

let jwksCache: JwksCache | null = null;
const JWKS_TTL_MS = 60 * 60 * 1000; // 1 hour

async function getJwks(): Promise<Jwk[]> {
  if (jwksCache && Date.now() - jwksCache.fetchedAt < JWKS_TTL_MS) {
    return jwksCache.keys;
  }
  const res = await fetch(GOOGLE_JWKS_URL);
  if (!res.ok) throw new Error(`Failed to fetch Google JWKs: ${res.status}`);
  const data = (await res.json()) as { keys: Jwk[] };
  jwksCache = { keys: data.keys, fetchedAt: Date.now() };
  return data.keys;
}

export interface GoogleIdTokenClaims {
  iss: string;
  aud: string;
  sub: string;
  email?: string;
  email_verified?: boolean;
  exp: number;
  iat: number;
  name?: string;
  picture?: string;
}

/**
 * Verifies a Google ID token: RS256 signature via JWKs, issuer, audience, expiry.
 * Throws on failure. Returns the claims on success.
 */
export async function verifyGoogleIdToken(idToken: string): Promise<GoogleIdTokenClaims> {
  const parts = idToken.split(".");
  if (parts.length !== 3) throw new Error("Malformed ID token");
  const [headerB64, payloadB64, sigB64] = parts;

  const header = JSON.parse(b64urlDecode(headerB64).toString("utf8")) as { alg: string; kid: string };
  if (header.alg !== "RS256") throw new Error(`Unsupported alg: ${header.alg}`);

  const keys = await getJwks();
  const jwk = keys.find((k) => k.kid === header.kid);
  if (!jwk) throw new Error(`Unknown kid: ${header.kid}`);

  const pubKey = createPublicKey({ key: jwk as any, format: "jwk" });
  const verifier = createVerify("RSA-SHA256");
  verifier.update(`${headerB64}.${payloadB64}`);
  const ok = verifier.verify(pubKey, b64urlDecode(sigB64));
  if (!ok) throw new Error("Invalid signature");

  const claims = JSON.parse(b64urlDecode(payloadB64).toString("utf8")) as GoogleIdTokenClaims;
  const now = Math.floor(Date.now() / 1000);
  if (claims.exp < now) throw new Error("ID token expired");
  if (!GOOGLE_ISSUERS.has(claims.iss)) throw new Error(`Bad issuer: ${claims.iss}`);
  if (claims.aud !== getGoogleClientId()) throw new Error(`Bad audience: ${claims.aud}`);

  return claims;
}

/* --------------------------------- cookie parsing --------------------------------- */

export function parseCookieHeader(header: string | null | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const pair of header.split(";")) {
    const idx = pair.indexOf("=");
    if (idx < 0) continue;
    const k = pair.slice(0, idx).trim();
    const v = pair.slice(idx + 1).trim();
    if (k) out[k] = decodeURIComponent(v);
  }
  return out;
}
