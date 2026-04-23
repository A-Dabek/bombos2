# ADR-006: Parcels Completion & Cleanup

## Status
Accepted

## Context
ADR-005 implemented the basic Parcels module with create and read operations. The next iteration requires a way for users to mark parcels as "completed" (delivered or obtained), visual feedback for completed state, and automatic cleanup of completed records to prevent unbounded database growth.

## Decision

### 1. Completion State
A `completed_at INTEGER` column is added to the `parcels` table. When `NULL`, the parcel is active. When set to a Unix timestamp, the parcel is considered completed.

### 2. Completion API
A single generic endpoint `POST /api/parcels/[id]/complete` sets `completed_at = Date.now()` for the given parcel ID. The endpoint is type-agnostic because parcel IDs are globally unique.

### 3. Completion UI Flow
- When a parcel is maximized (fullscreen overlay), a "Mark as Completed" button is visible.
- Clicking the button sends a `POST` to the completion API, then closes the overlay and refreshes the parcel list.
- Completed parcels remain visible in the grid but are rendered with reduced opacity (`opacity-50` or similar) and a centered checkmark icon overlay (`HiCheckCircleSolid` from `@qwikest/icons/heroicons`).
- Parcel sort order remains strictly by `created_at DESC`, regardless of completion status.

### 4. Automated Cleanup
Completed parcels are deleted from the database by a scheduled job running daily at 04:00.
- **Library**: `node-cron` is used for scheduling. It is the most common and robust Node.js cron library.
- **Location**: The scheduler logic lives in `src/server/scheduler.ts`. It is bootstrapped from the server entry points (`entry.preview.tsx` for production/preview, and `entry.ssr.tsx` with a global singleton guard for development SSR).
- **Cleanup function**: `deleteCompletedParcels()` in `src/db/parcels.ts` executes `DELETE FROM parcels WHERE completed_at IS NOT NULL`.

## Alternatives Considered
- **Client-side only state (no DB column)**: Rejected because completed state must persist across reloads and devices.
- **Boolean `is_completed` column**: Rejected in favor of `completed_at` timestamp because the timestamp is useful for the cleanup job to know record age if retention policies change later, and it costs no extra storage in SQLite.
- **System-level cron / separate script**: Rejected because the user requested an in-app cron job. A standalone script would require external process management.
- **setInterval-based scheduler**: Rejected as too basic and unreliable for a daily job. The user explicitly requested a solid, trustworthy solution.

## Consequences
- `node-cron` becomes a production dependency.
- The server process must be long-lived for the scheduler to fire (true for the current Node/Vite preview setup).
- Completed parcels remain visible until the next 04:00 cleanup, giving users a visual confirmation window.
- Sorting does not change; completed parcels intermix with active ones by creation date.
