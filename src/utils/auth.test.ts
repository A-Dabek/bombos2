import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  createSessionCookieValue,
  getAllowedEmails,
  isEmailAllowed,
  parseCookieHeader,
  verifySessionCookie,
} from "./auth";

const SECRET = "test-secret-that-is-long-enough-1234567890";

function withEnv<T>(env: Record<string, string | undefined>, fn: () => T): T {
  const prev: Record<string, string | undefined> = {};
  for (const k of Object.keys(env)) {
    prev[k] = process.env[k];
    if (env[k] === undefined) delete process.env[k];
    else process.env[k] = env[k]!;
  }
  try {
    return fn();
  } finally {
    for (const k of Object.keys(prev)) {
      if (prev[k] === undefined) delete process.env[k];
      else process.env[k] = prev[k];
    }
  }
}

describe("session cookie", () => {
  beforeEach(() => {
    process.env.SESSION_SECRET = SECRET;
  });
  afterEach(() => {
    delete process.env.SESSION_SECRET;
  });

  it("round-trips a valid session", () => {
    const value = createSessionCookieValue("user@example.com");
    const parsed = verifySessionCookie(value);
    expect(parsed?.email).toBe("user@example.com");
    expect(parsed?.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
  });

  it("lowercases the email", () => {
    const value = createSessionCookieValue("USER@Example.COM");
    expect(verifySessionCookie(value)?.email).toBe("user@example.com");
  });

  it("rejects a tampered payload", () => {
    const value = createSessionCookieValue("user@example.com");
    const [payload, sig] = value.split(".");
    // Flip a bit in the payload (change last char)
    const tampered = payload.slice(0, -1) + (payload.slice(-1) === "A" ? "B" : "A") + "." + sig;
    expect(verifySessionCookie(tampered)).toBeNull();
  });

  it("rejects a bad signature", () => {
    const value = createSessionCookieValue("user@example.com");
    const [payload] = value.split(".");
    expect(verifySessionCookie(payload + ".AAAA")).toBeNull();
  });

  it("rejects with a different secret", () => {
    const value = createSessionCookieValue("user@example.com");
    process.env.SESSION_SECRET = "another-secret-that-is-also-long-1234";
    expect(verifySessionCookie(value)).toBeNull();
  });

  it("rejects an expired cookie", () => {
    // Negative max age produces exp in the past.
    const value = createSessionCookieValue("user@example.com", -10);
    expect(verifySessionCookie(value)).toBeNull();
  });

  it("rejects null/empty/malformed", () => {
    expect(verifySessionCookie(null)).toBeNull();
    expect(verifySessionCookie("")).toBeNull();
    expect(verifySessionCookie("only-one-part")).toBeNull();
    expect(verifySessionCookie("a.b.c")).toBeNull();
  });
});

describe("allowlist", () => {
  it("parses comma-separated ALLOWED_EMAILS, trims, lowercases", () => {
    withEnv({ ALLOWED_EMAILS: "  A@x.com , b@Y.com ,,c@z.com  " }, () => {
      expect(getAllowedEmails()).toEqual(["a@x.com", "b@y.com", "c@z.com"]);
    });
  });

  it("isEmailAllowed is case-insensitive", () => {
    withEnv({ ALLOWED_EMAILS: "you@gmail.com,wife@gmail.com" }, () => {
      expect(isEmailAllowed("YOU@Gmail.com")).toBe(true);
      expect(isEmailAllowed("stranger@gmail.com")).toBe(false);
      expect(isEmailAllowed(undefined)).toBe(false);
      expect(isEmailAllowed(null)).toBe(false);
    });
  });

  it("empty ALLOWED_EMAILS disallows everyone", () => {
    withEnv({ ALLOWED_EMAILS: undefined }, () => {
      expect(getAllowedEmails()).toEqual([]);
      expect(isEmailAllowed("anyone@x.com")).toBe(false);
    });
  });
});

describe("parseCookieHeader", () => {
  it("parses multiple cookies", () => {
    expect(parseCookieHeader("a=1; b=2 ; c=hello%20world")).toEqual({
      a: "1",
      b: "2",
      c: "hello world",
    });
  });

  it("handles empty / null", () => {
    expect(parseCookieHeader(null)).toEqual({});
    expect(parseCookieHeader("")).toEqual({});
  });

  it("ignores malformed pairs", () => {
    expect(parseCookieHeader("foo; a=1")).toEqual({ a: "1" });
  });
});
