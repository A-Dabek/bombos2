# ADR-024: Predefined Payment Names for Bills

## Status
Proposed

## Context
Bills module currently supports:
- **Automatic payments** (fixed amount, periodic) — stored in `bills_automatic_payments` with `name`, `slug`, `amount`
- **Manual transactions** — free-text description + amount, no linkage to payment types

User needs to track variable-amount periodic bills (water, electricity) using slugs for future aggregation queries (e.g., "sum all electricity bills over last 6 months"). These bills share a payment type but vary in amount each period.

## Decision

### 1. New DB Table: `bills_predefined_payments`
Migration `019_add_predefined_payments.sql`:
```sql
CREATE TABLE IF NOT EXISTS bills_predefined_payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_bills_predefined_payments_slug 
  ON bills_predefined_payments(slug);
```

### 2. Extend `bills_transactions` Table
Migration `020_add_predefined_slug_to_transactions.sql`:
```sql
ALTER TABLE bills_transactions ADD COLUMN predefined_slug TEXT;
CREATE INDEX IF NOT EXISTS idx_bills_transactions_predefined_slug 
  ON bills_transactions(predefined_slug);
```

### 3. Extend `bills_automatic_payments` Table
Migration `021_add_predefined_slug_to_automatic_payments.sql`:
```sql
ALTER TABLE bills_automatic_payments ADD COLUMN predefined_slug TEXT;
CREATE INDEX IF NOT EXISTS idx_bills_automatic_payments_predefined_slug 
  ON bills_automatic_payments(predefined_slug);
```
- New automatic payments **must** link to predefined payment (mandatory `predefined_slug`)
- Existing automatic payments will have `NULL` (no backfill)
- No foreign key constraints; dangling references acceptable

### 4. DB Functions (`src/db/bills.ts`)

**New types:**
```typescript
export interface BillsPredefinedPayment {
  id: number;
  name: string;
  slug: string;
  created_at: number;
}
```

**New functions:**
- `getBillsPredefinedPayments(db?): BillsPredefinedPayment[]`
- `addBillsPredefinedPayment(input: {name, slug}, db?): number`
- `deleteBillsPredefinedPayment(id: number, db?): void`

**Updated functions:**
- `addBillTransaction(description, amount, is_automatic?, predefined_slug?, db?)` — optional slug
- `createAutomaticPaymentTransactions(db?)` — also store `predefined_slug`
- `addBillsAutomaticPayment(input, db?)` — add required `predefined_slug` to `BillsAutomaticPaymentInput`

### 5. API Endpoints

**New routes:**
- `src/routes/api/bills/predefined-payments/index.ts` — GET (list), POST (add with name+slug)
- `src/routes/api/bills/predefined-payments/[id]/index.ts` — DELETE

**Updated routes:**
- `src/routes/api/bills/transactions/index.ts` POST — accept optional `predefined_slug` in body
- `src/routes/api/bills/automatic-payments/index.ts` POST — accept **required** `predefined_slug`

### 6. Admin UI (`src/components/bills/BillsAdmin.tsx`)

Add new section **"Predefined Payment Names"** below `<AutomaticPaymentsAdmin />`:
- List existing predefined payments (name + slug, no amount shown)
- Form: name + slug inputs, "Add" button
- Delete with 2-second confirmation (same pattern as `AutomaticPaymentItem`)
- Loads from `GET /api/bills/predefined-payments`

Update **AutomaticPaymentsAdmin** to:
- Fetch predefined payments for dropdown
- Add dropdown to select predefined payment (mandatory)
- Send `predefined_slug` when creating automatic payment

### 7. New Component: `BillsTransactionForm`

Create `src/components/bills/BillsTransactionForm.tsx` (wrapper around shared `TransactionForm`):
- Fetches predefined payments from API on mount
- Dropdown: "Select predefined payment (optional)" above description input
- On select: **pre-fill** description with payment name (user can still edit)
- Stores selected `predefined_slug` for API call
- Passes `description`, `amount`, `loading` to underlying `TransactionForm`
- On submit: calls parent's `onSubmit$` with `(description, amount, predefined_slug?)`

Update `BillsPage.tsx` to use `BillsTransactionForm` instead of `TransactionForm`.

### 8. Update `BillsPage.tsx`

Modify `handleAdd` to accept `predefined_slug`:
```typescript
const handleAdd = $(async (desc: string, amt: number, predefinedSlug?: string) => {
  // ...
  body: JSON.stringify({ description: desc, amount: amt, predefined_slug: predefinedSlug }),
  // ...
});
```

## Consequences

### Positive
- Enables tracking variable-amount periodic bills with slug-based aggregation
- Reuses existing slug pattern from automatic payments
- Clean separation: predefined (name+slug) vs automatic (name+slug+amount)
- Manual bills can optionally reference predefined payments
- Future queries can aggregate by `predefined_slug` (e.g., sum all electricity bills)

### Negative
- 3 new migrations add schema complexity
- `bills_transactions` and `bills_automatic_payments` have optional `predefined_slug` (can be NULL)
- No referential integrity enforcement (dangling references possible if predefined payment deleted)

### Neutral
- E2E tests written as user journeys, not atomic feature tests
- Slug collisions between predefined payments and automatic payments allowed (separate namespaces)

## Test IDs Required
- `predefined-name-input` — predefined payment name input in admin
- `predefined-slug-input` — predefined payment slug input in admin
- `predefined-add-button` — add predefined payment button
- `predefined-item` — predefined payment list item
- `automatic-predefined-select` — dropdown to select predefined payment in automatic payments form
- `bills-predefined-select` — dropdown on bills page to select predefined payment

## E2E Test Journey

Single journey test in `e2e/bills.spec.ts`:

```typescript
test("Bills: Predefined payments journey", async ({page}) => {
    // 1. Admin: Add predefined payments
    await page.goto("/money/bills/admin");
    await page.getByTestId("loader").waitFor({state: "hidden"});
    
    // Add "Electricity" predefined payment
    await page.getByTestId("predefined-name-input").fill("Electricity");
    await page.getByTestId("predefined-slug-input").fill("electricity");
    await page.getByTestId("predefined-add-button").click();
    await expect(page.getByTestId("predefined-item")).toContainText("Electricity");
    
    // Add "Water" predefined payment
    await page.getByTestId("predefined-name-input").fill("Water");
    await page.getByTestId("predefined-slug-input").fill("water");
    await page.getByTestId("predefined-add-button").click();
    await expect(page.getByTestId("predefined-item").last()).toContainText("Water");
    
    // 2. Admin: Add automatic payment linked to predefined
    await page.getByTestId("automatic-name-input").fill("Rent");
    await page.getByTestId("automatic-slug-input").fill("rent");
    await page.getByTestId("automatic-amount-input").fill("1200");
    await page.getByTestId("automatic-predefined-select").selectOption("rent");
    await page.getByTestId("automatic-add-button").click();
    await expect(page.getByTestId("payment-item")).toContainText("Rent");
    
    // 3. User: Go to bills page and add manual bill using predefined
    await page.goto("/money/bills");
    await page.getByTestId("loader").waitFor({state: "hidden"});
    await page.waitForTimeout(500);
    
    // Select predefined payment from dropdown
    await page.getByTestId("bills-predefined-select").selectOption("electricity");
    // Description pre-filled with "Electricity"
    await expect(page.getByTestId("transaction-desc-input")).toHaveValue("Electricity");
    // Edit description
    await page.getByTestId("transaction-desc-input").fill("Electricity - June");
    await page.getByTestId("transaction-amount-input").fill("-150");
    await Promise.all([
        page.waitForResponse(r => r.url().endsWith("/api/bills/transactions") && r.request().method() === "POST"),
        page.getByTestId("transaction-add-button").click(),
    ]);
    await expect(page.getByText("Electricity - June")).toBeVisible();
    await expect(page.getByText("-150")).toBeVisible();
    
    // 4. User: Add manual bill with free text (no predefined)
    await page.getByTestId("bills-predefined-select").selectOption("");
    await page.getByTestId("transaction-desc-input").fill("Internet");
    await page.getByTestId("transaction-amount-input").fill("-80");
    await Promise.all([
        page.waitForResponse(r => r.url().endsWith("/api/bills/transactions") && r.request().method() === "POST"),
        page.getByTestId("transaction-add-button").click(),
    ]);
    await expect(page.getByText("Internet")).toBeVisible();
    await expect(page.getByText("-80")).toBeVisible();
});
```

## Acceptance Criteria

1. Migrations `019`, `020`, `021` run successfully
2. Admin can CRUD predefined payments (name + slug only, no amount)
3. Adding automatic payment requires selecting predefined payment
4. Manual bill entry has optional dropdown; pre-fills description; saves `predefined_slug`
5. All new API endpoints work; updated endpoints accept `predefined_slug`
6. `BillsTransactionForm` component created and used in `BillsPage`
7. E2E journey test passes
