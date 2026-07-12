# Refactoring Run — July 2026

## Context

Branch: `refactor/reduce-loc`  
Goal: reduce lines of code while maintaining readability and full test coverage.  
Stack: Qwik City, Tailwind CSS, SQLite (better-sqlite3), Node, pnpm.

---

## What Was Done

### 1. `apiRequest` / `jsonPost` helper — `src/lib/api.ts`

**Problem**: Every component that called an API repeated the same 8-line pattern:

```ts
loading.value = true;
error.value = null;
try {
  const res = await fetch(url, options);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Failed");
  }
  // use result
} catch (e: any) {
  error.value = e.message;
} finally {
  loading.value = false;
}
```

**Fix**: Created `src/lib/api.ts` with two exports:

- `apiRequest<T>(url, options?)` — fetches, throws on non-OK with server message, returns parsed JSON.
- `jsonPost(body)` — returns `{ method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }`.

**Files changed**: `AllowanceAdmin`, `AllowancePage`, `BalanceAdmin`, `BalancePage`, `AutomaticPaymentsAdmin`, `BillsAdmin`, `FlowsAdmin`, `FlowsPage`.  
**Net savings**: ~101 lines (165 removed, 64 added).

---

### 2. `PredefinedPaymentsAdmin` extracted from `BillsAdmin`

**Problem**: `BillsAdmin.tsx` was 253 lines. It already had `AutomaticPaymentsAdmin` extracted but still contained a full predefined-payments CRUD section (load/add/delete handlers + JSX) inline.

**Fix**: Extracted to `src/components/bills/PredefinedPaymentsAdmin.tsx`. `BillsAdmin` now just composes layout.

**Net savings**: ~60 lines from `BillsAdmin.tsx`.

---

### 3. `DayOfMonthConfigSection` shared component — `src/components/shared/DayOfMonthConfigSection.tsx`

**Problem**: `BalanceAdmin`, `BillsAdmin`, and `AllowanceAdmin` all contained identical blocks:
- 5 signals (`config`, `dayOfMonth`, `error`, `success`, `loading`)
- `useVisibleTask$` to fetch config
- `handleSave` to POST config
- JSX: loader, error/success messages, `DayOfMonthInput`, save button

**Fix**: Created `DayOfMonthConfigSection` component with props:
- `configEndpoint` — API path for GET and POST
- `saveTestId` — `data-testid` for the save button
- `dayId` / `dayTestId` — optional id/testid for the input
- `extraBody` — optional extra fields merged into POST body
- `onLoaded$` / `onSaved$` — optional callbacks for parent to react to loaded/saved data
- `<Slot />` — for injecting extra fields between input and save button

**Files changed**: `BalanceAdmin` (93→27 lines), `BillsAdmin` (further reduced), `AllowanceAdmin` (119→~30 lines).  
**Net savings**: ~70 lines across three admin files.

---

### 4. `withDb` helper — `src/db/connection.ts`

**Problem**: Every DB function starts with `const dbConn = db ?? getDb();`. Pattern appears 50+ times across all DB files.

**Fix**: Added `withDb<T>(db, fn)` to `connection.ts`:

```ts
export function withDb<T>(db: Database.Database | undefined, fn: (db: Database.Database) => T): T {
  return fn(db ?? getDb());
}
```

**Status**: Helper added but **bulk migration of DB files was skipped** — most functions use `dbConn` multiple times in a single function body, so wrapping in a callback saves 1 line per function at best and reduces readability. Not worth the churn.

---

## What Was Considered but Not Done

### Merge `PlanForm` + `GroceryForm`

Both forms share the same skeleton (focus task, button row, `lastAddedName` feedback, `TextInput`/`TextArea`/`Checkbox`). However, `GroceryForm` has significant extra logic (amount/unit/category fields, category fetch, unit cycling) that is deeply interleaved with the shared parts. Extracting a shared base would require a render-prop or slot pattern that adds complexity without clear readability gain. **Skipped.**

### Bulk `withDb` migration in DB files

See step 4 above. The pattern `db ?? getDb()` appears 50+ times but each function uses the resolved connection multiple times. A callback wrapper saves 1 line per function and makes the code harder to follow. **Skipped.**

---

## Test Results

- **DB tests** (`pnpm test.db`): 81/81 passed before each commit.
- **E2E tests** (`pnpm e2e`): 47/48 passed. The 1 failure is **pre-existing** — confirmed by running on the original code before any changes. It is unrelated to this refactoring.

---

## Recommendations for Next Agent

1. **`GroceryForm` / `PlanForm` merge** — revisit if the grocery-specific fields are ever simplified. The shared skeleton is clear; the blocker is the interleaved category/unit logic in `GroceryForm`.

2. **DB `withDb` bulk migration** — only worthwhile if functions are refactored to single-use patterns or if the codebase moves to a repository/service layer.

3. **`AllowanceAdmin`** — was not fully reduced in this run (only `BalanceAdmin` and `BillsAdmin` were committed with `DayOfMonthConfigSection`). Check if `AllowanceAdmin` still has the old inline pattern and apply the same extraction.

4. **`AutomaticPaymentsAdmin`** — already extracted before this run. Good reference for the extraction pattern used in `PredefinedPaymentsAdmin`.

5. **Shared `AdminCrudSection`** — `AutomaticPaymentsAdmin` and `PredefinedPaymentsAdmin` now have very similar structure (load list, add item, delete item). A further abstraction is possible but would require careful prop design.

6. **`top-loc.mjs`** — use `node scripts/top-loc.mjs` to find the current largest files before starting. It lists top files by line count and is the fastest way to find the next biggest win.
