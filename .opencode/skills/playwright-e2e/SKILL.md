---
name: playwright-e2e
description: Use when running or debugging the Playwright e2e suite.
---

# Playwright E2E

Use when building for, serving, running, or triaging the Playwright suite (`pnpm e2e`, `pnpm exec playwright test`, `e2e/**`).

## Serve the current build

- E2E results MUST NOT be trusted unless the preview server was (re)started after the last build.
- MUST stop the old server by PID: `ss -ltnp` to find the `:4173` PID, then `kill <pid>`; confirm the port is free. MUST NOT rely on `pkill -x <name>`; MUST verify the process actually exited.
- Cold start is slow (WSL); consecutive runs are fast. Worker count does NOT cause hangs — MUST NOT attribute slowness or hangs to `--workers`.
- MUST pass an explicit bash `timeout` of at least 300000 ms for `pnpm build`, `pnpm build.preview`, and Playwright runs; the 120000 ms default MAY be exceeded on a cold build.
- E2E needs `AUTH_DISABLED=true` on the preview server. `playwright.config.ts` uses `webServer.reuseExistingServer`, so it reuses `:4173` unless the PID is stopped.

## Timing / config knobs

- When a fix needs a shorter poll/interval in tests, MUST make it env-overridable (e.g. `BILLS_URGENT_INTERVAL_MS`) and preserve the production default. MUST NOT change the production default.

## Failure triage

- Run with trace (`--trace on`) and inspect via `playwright show-trace` or the `playwright-report/` / `html-results/` output.
- Trace forensics without the viewer: unzip `trace.zip`, parse `0-trace.network` (JSON-lines) for requests/responses/cookies; response bodies are `_sha1` references — resolve them against files in the archive.
- Classify branch-introduced vs pre-existing: MUST use a `git worktree` of the base ref, run the same spec there, and compare failing `spec:test` pairs. MUST run state-mutating git commands sequentially.
- Hydration/interaction readiness is Qwik-specific: see skill `qwik-quirks`.
