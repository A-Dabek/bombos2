# ADR-023: Bills Module — Automatic Payments

## Status
Proposed (2026-05-06)

## Context
The Bills module currently supports manual transaction entry and automatic period-start markers (ADR-020). Users want to define recurring payments (rent, mortgage, utilities) that are automatically added to the transaction list when a new period starts.

**Current State:**
- `bills_config` table with `day_of_month` setting
- `bills_transactions` table: id, description, amount, is_automatic, created_at
- Scheduler runs daily at 04:00 UTC, calls `checkAndAddBillsPeriodStart()` to insert period-start markers
- Admin page (`BillsAdmin.tsx`) only manages `day_of_month` config

**Goal:**
Allow users to define automatic payment templates (name, slug, amount) via the admin page. When a new period starts, the scheduler should automatically create transactions from these templates immediately after the period-start marker.

## Decision

### 1. Database Changes — New Table for Automatic Payment Definitions

**Migration `018_add_bills_automatic_payments.sql` (new file):**
```sql
-- ADR-023: Automatic Payments for Bills
CREATE TABLE IF NOT EXISTS bills_automatic_payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  amount INTEGER NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Index for slug lookups (used in future aggregation queries)
CREATE INDEX IF NOT EXISTS idx_bills_automatic_payments_slug 
  ON bills_automatic_payments(slug);
```

**Why a separate table?**
- Clean separation between "payment definition" and "transaction history"
- Allows CRUD operations on definitions without affecting past transactions
- `slug` is stored here and copied to `description` field in `bills_transactions` when auto-creating

**Updates to `bills_transactions` table:**
No schema changes needed. The `description` field will store the `name` from the automatic payment definition when transactions are auto-created.

---

### 2. Update DB Layer (`src/db/bills.ts`)

**New Interfaces:**
```ts
export interface BillsAutomaticPayment {
  id: number;
  name: string;
  slug: string;
  amount: number;  // Absolute value (positive), stored as defined by user
  created_at: number;
}

export interface BillsAutomaticPaymentInput {
  name: string;
  slug: string;
  amount: number;  // Absolute value (positive)
}
```

**New Functions:**

| Function | Purpose |
|----------|---------|
| `getBillsAutomaticPayments(db?)` | Fetch all automatic payment definitions ordered by amount DESC |
| `addBillsAutomaticPayment(input, db?)` | Insert new automatic payment definition (amount is absolute/positive) |
| `deleteBillsAutomaticPayment(id, db?)` | Delete automatic payment definition by ID |
| `createAutomaticPaymentTransactions(db?)` | Called by scheduler: create transactions from all active definitions for the new period (amounts negated, ordered by amount DESC) |

**Implementation Details:**

```ts
export function getBillsAutomaticPayments(
  db?: Database.Database,
): BillsAutomaticPayment[] {
  const dbConn = db ?? getDb();
  // Order by amount DESC (highest to lowest) for admin UI and scheduler
  return dbConn.prepare(
    "SELECT id, name, slug, amount, created_at FROM bills_automatic_payments ORDER BY amount DESC"
  ).all() as BillsAutomaticPayment[];
}

export function addBillsAutomaticPayment(
  input: BillsAutomaticPaymentInput,
  db?: Database.Database,
): number {
  const dbConn = db ?? getDb();
  
  // Validate slug format (single word, alphanumeric + underscores)
  if (!/^[a-zA-Z0-9_]+$/.test(input.slug)) {
    throw new Error("Slug must be a single word (alphanumeric + underscores only)");
  }
  
  // Validate amount is positive (absolute value)
  if (input.amount <= 0) {
    throw new Error("Amount must be a positive number");
  }
  
  const result = dbConn.prepare(
    "INSERT INTO bills_automatic_payments (name, slug, amount) VALUES (?, ?, ?)"
  ).run(input.name, input.slug, input.amount);
  
  return Number(result.lastInsertRowid);
}

export function deleteBillsAutomaticPayment(
  id: number,
  db?: Database.Database,
): void {
  const dbConn = db ?? getDb();
  dbConn.prepare(
    "DELETE FROM bills_automatic_payments WHERE id = ?"
  ).run(id);
}

export function createAutomaticPaymentTransactions(
  db?: Database.Database,
): number {
  const dbConn = db ?? getDb();
  
  // Get all active automatic payments ordered by amount DESC (highest to lowest)
  const payments = dbConn.prepare(
    "SELECT name, amount FROM bills_automatic_payments ORDER BY amount DESC"
  ).all() as BillsAutomaticPayment[];
  
  let createdCount = 0;
  
  for (const payment of payments) {
    // Create transaction with is_automatic=1
    // Description stores the "name" for UI display
    // Amount is NEGATED because automatic payments are expenses
    dbConn.prepare(
      "INSERT INTO bills_transactions (description, amount, is_automatic) VALUES (?, ?, 1)"
    ).run(payment.name, -payment.amount);
    createdCount++;
  }
  
  return createdCount;
}
```

**Update `checkAndAddBillsPeriodStart()` function:**

The scheduler currently calls `checkAndAddBillsPeriodStart()` which only adds the period-start marker. We need to update the scheduler logic to also call `createAutomaticPaymentTransactions()` after adding the marker.

---

### 3. API Routes — New Endpoints for Automatic Payments

**New file: `src/routes/api/bills/automatic-payments/index.ts`**

```ts
import { RequestHandler } from "@builder.io/qwik-city";
import { 
  getBillsAutomaticPayments, 
  addBillsAutomaticPayment, 
  deleteBillsAutomaticPayment 
} from "~/db/bills";

export const onGet: RequestHandler = async ({ json }) => {
  const payments = getBillsAutomaticPayments();
  json(200, { payments });
};

export const onPost: RequestHandler = async ({ json, error, parseBody }) => {
  const body = await parseBody();
  const name = (body as any)?.name as string;
  const slug = (body as any)?.slug as string;
  const amount = Number((body as any)?.amount);

  if (!name || !slug || isNaN(amount) || amount <= 0) {
    throw error(400, "Valid name, slug, and positive amount required");
  }

  try {
    const id = addBillsAutomaticPayment({ name, slug, amount });
    json(201, { id, name, slug, amount });
  } catch (err: any) {
    if (err.message.includes("UNIQUE")) {
      throw error(409, "Slug already exists");
    }
    throw error(400, err.message);
  }
};

export const onDelete: RequestHandler = async ({ json, error, params }) => {
  const id = Number(params?.id);
  
  if (isNaN(id)) {
    throw error(400, "Valid payment ID required");
  }

  deleteBillsAutomaticPayment(id);
  json(200, { success: true });
};
```

**Note:** Qwik City uses file-based routing. For DELETE with ID, create:
- `src/routes/api/bills/automatic-payments/[id]/index.ts` with `onDelete` handler

---

### 4. Admin Page Component Updates (`src/components/bills/BillsAdmin.tsx`)

**Add State Signals:**
```ts
const payments = useSignal<BillsAutomaticPayment[]>([]);
const newPaymentName = useSignal("");
const newPaymentSlug = useSignal("");
const newPaymentAmount = useSignal("");
const paymentsLoading = useSignal(false);
const paymentsError = useSignal<string | null>(null);
```

**Add Functions:**
- `loadPayments()` — fetch from `/api/bills/automatic-payments`
- `handleAddPayment()` — POST to `/api/bills/automatic-payments`
- `handleDeletePayment(id)` — Double-click delete pattern (see below)

**UI Additions (below existing day-of-month config):**

1. **Section Header:** "Automatic Payments"
2. **List of existing payments (ordered by amount DESC):**
   - Show name, slug, amount for each
   - Delete button with double-click pattern:
     - First click: Button text changes to "Confirm?" for 2 seconds
     - Second click (within 2 seconds): Actually delete
     - If no second click within 2 seconds, button reverts to "Delete"
   - Use `data-testid="payment-item"` for E2E tests
   - Display amount as positive number (stored as absolute value)
3. **Add Payment Form:**
   - Name input (`data-testid="payment-name-input"`)
   - Slug input (`data-testid="payment-slug-input"`) with pattern hint: "Single word, letters/numbers/underscores only"
   - Amount input (`data-testid="payment-amount-input"`, type="number", min="1") — positive value only
   - Add button (`data-testid="payment-add-button"`)

**Double-Click Delete Pattern Implementation:**

```tsx
// In BillsAdmin.tsx
const deleteConfirmations = useSignal<Set<number>>(new Set());

const handleDeleteClick = $((paymentId: number) => {
  if (deleteConfirmations.value.has(paymentId)) {
    // Second click - actually delete
    handleDeletePayment(paymentId);
    const newSet = new Set(deleteConfirmations.value);
    newSet.delete(paymentId);
    deleteConfirmations.value = newSet;
  } else {
    // First click - show confirmation
    const newSet = new Set(deleteConfirmations.value);
    newSet.add(paymentId);
    deleteConfirmations.value = newSet;
    
    // Revert after 2 seconds
    setTimeout(() => {
      const revertSet = new Set(deleteConfirmations.value);
      revertSet.delete(paymentId);
      deleteConfirmations.value = revertSet;
    }, 2000);
  }
});
```

**Slug Input Validation (client-side):**
- Show hint: "Single word, letters/numbers/underscores only"
- Validate on submit: prevent submission if invalid

**Amount Input:**
- Use `min="1"` to ensure positive values
- Display amounts as positive in the list (they are stored as absolute values)

---

### 5. Scheduler Updates (`src/server/scheduler.ts`)

**Update `runPeriodStartChecks()` function:**

```ts
import { checkAndAddBillsPeriodStart, createAutomaticPaymentTransactions } from "../db/bills";

function runPeriodStartChecks(): void {
  log("period-start", "Checking if period-start transactions should be added");

  try {
    const billsResult = checkAndAddBillsPeriodStart();
    if (billsResult.added) {
      log("period-start", `Added Bills period-start.`);
      
      // After adding period marker, create automatic payment transactions
      try {
        const createdCount = createAutomaticPaymentTransactions();
        log("period-start", `Created ${createdCount} automatic payment transactions for Bills.`);
      } catch (err) {
        log("error", `Failed to create automatic payment transactions: ${err}`);
      }
    }
  } catch (err) {
    log("error", `Failed to check/add Bills period-start: ${err}`);
  }

  // ... Balance period-start check remains unchanged
}
```

**Logic Flow:**
1. Scheduler runs daily at 04:00
2. `checkAndAddBillsPeriodStart()` checks if today = `day_of_month`
3. If yes, inserts period-start marker (if not already present)
4. Then `createAutomaticPaymentTransactions()` creates transactions for all defined automatic payments
5. Transactions have `is_automatic=1` and `description = payment.name`

---

### 6. Route Pages

**No new route pages needed** — automatic payments UI is integrated into existing admin page at `/money/bills/admin`

---

## Consequences

### Positive
- **Automation**: Recurring payments (rent, mortgage, utilities) are automatically added each period
- **Slug-based identification**: Future features can aggregate by slug (e.g., "sum of all electricity bills")
- **Admin control**: Users can define, view, and delete automatic payments via admin UI
- **No edit complexity**: Simplicity — if user wants to change, delete + re-add (as requested)
- **Clean separation**: Payment definitions separate from transaction history
- **Consistent with existing patterns**: Uses same scheduler, DB layer patterns as period-start markers

### Negative
- **No edit functionality**: Users must delete and re-create to modify (acceptable per requirements)
- **No duplicate prevention (yet)**: Per user request, "don't worry about duplicates for now"
- **Slug validation**: Client-side + server-side validation needed to ensure slug format

### Risks
- **Slug collisions**: Unique constraint in DB prevents duplicates; API returns 409 error
- **Scheduler timing**: If server is down at period start, automatic payments won't be added (same risk as period-start markers)
- **Amount handling**: Automatic payments are always expenses (negative in transactions), but users enter positive values in the UI (converted by scheduler)

---

## Implementation Notes — Files

### New Files (3)
1. `src/db/migrations/018_add_bills_automatic_payments.sql`
2. `src/routes/api/bills/automatic-payments/index.ts`
3. `src/routes/api/bills/automatic-payments/[id]/index.ts`

### Modified Files (4)
1. `src/db/bills.ts` — add automatic payment functions + update `checkAndAddBillsPeriodStart` export
2. `src/server/scheduler.ts` — update `runPeriodStartChecks()` to create automatic transactions
3. `src/components/bills/BillsAdmin.tsx` — add automatic payments UI (form + list + delete)
4. `e2e/setup.ts` — add helper functions for automatic payments

### Test Files

#### DB Unit Tests (vitest) — New/Updated
**`src/db/bills.test.ts`** (create new file):
- `getBillsAutomaticPayments()` returns empty array when no payments defined
- `getBillsAutomaticPayments()` returns payments ordered by amount DESC
- `addBillsAutomaticPayment()` inserts correctly with valid input
- `addBillsAutomaticPayment()` throws on invalid slug format (spaces, special chars)
- `addBillsAutomaticPayment()` throws on duplicate slug (UNIQUE constraint)
- `addBillsAutomaticPayment()` throws on zero or negative amount
- `deleteBillsAutomaticPayment()` removes payment by ID
- `deleteBillsAutomaticPayment()` silently succeeds if ID doesn't exist
- `createAutomaticPaymentTransactions()` creates correct number of transactions
- `createAutomaticPaymentTransactions()` sets `is_automatic=1` on created transactions
- `createAutomaticPaymentTransactions()` copies `name` to `description` field
- `createAutomaticPaymentTransactions()` NEGATES amounts (expenses are negative)
- `createAutomaticPaymentTransactions()` creates transactions ordered by amount DESC
- Integration: `checkAndAddBillsPeriodStart()` + `createAutomaticPaymentTransactions()` work together

#### E2E Tests (Playwright) — New/Updated
**`e2e/bills.spec.ts`** — update existing:
- Add setup/teardown for automatic payments table

**`e2e/bills-automatic-payments.spec.ts`** (new):
- Navigate to `/money/bills/admin`
- Verify "Automatic Payments" section visible
- Add new payment: fill name ("Rent"), slug ("rent"), amount ("1200") → click Add
- Verify payment appears in list (check name, slug, amount shown as positive 1200)
- Add another payment with smaller amount ("Internet", "internet", "100")
- Verify list is ordered by amount DESC (Rent 1200 before Internet 100)
- Delete payment using double-click pattern:
  - First click: button text changes to "Confirm?"
  - Second click (within 2 seconds): payment removed from list
- Verify past transactions NOT deleted when payment is deleted
- Verify slug validation: try invalid slug ("electricity bill" with space) → see error
- Verify duplicate slug → see error message
- Verify amount validation: try zero or negative amount → see error

**`e2e/setup.ts`** — add helpers:
```ts
export function clearBillsAutomaticPayments() {
  const db = new Database(DB_PATH);
  db.prepare("DELETE FROM bills_automatic_payments").run();
  db.close();
}

export function addBillsAutomaticPaymentSql(name: string, slug: string, amount: number) {
  const db = new Database(DB_PATH);
  db.prepare("INSERT INTO bills_automatic_payments (name, slug, amount) VALUES (?, ?, ?)").run(name, slug, amount);
  db.close();
}
```

---

## Summary
This feature adds automatic recurring payment definitions to the Bills module. Users define payments (name, slug, amount where amount is a positive/absolute value) via the admin page. When a new period starts, the scheduler automatically creates transactions from these definitions with amounts negated (expenses). The slug provides a stable identifier for future aggregation features, while the name provides human-readable display. Deletion uses a double-click confirmation pattern (no edit) to keep the UI simple. Payments are ordered by amount (highest to lowest) both in the admin list and when inserted by the scheduler. Past transactions remain untouched when definitions are deleted.

**Key Design Decisions:**
1. Separate table (`bills_automatic_payments`) for definitions
2. `slug` stored only in definitions table; `name` copied to transaction `description`
3. Scheduler creates transactions after period-start marker with NEGATED amounts (all are expenses)
4. No duplicate prevention (per user request)
5. No edit — delete + re-add pattern
6. Double-click delete confirmation (button changes to "Confirm?" for 2 seconds)
7. Payments ordered by amount DESC (highest to lowest) in admin list and scheduler insertion
