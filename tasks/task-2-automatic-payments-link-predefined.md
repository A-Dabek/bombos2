# task-2-automatic-payments-link-predefined

## Goal
Automatic payments must link to predefined payments; admin can create them with mandatory predefined selection.

## Steps

### 1. Migration
Create `src/db/migrations/021_add_predefined_slug_to_automatic_payments.sql`:
```sql
ALTER TABLE bills_automatic_payments ADD COLUMN predefined_slug TEXT;
CREATE INDEX IF NOT EXISTS idx_bills_automatic_payments_predefined_slug 
  ON bills_automatic_payments(predefined_slug);
```

### 2. DB Functions (`src/db/bills.ts`)

Update `BillsAutomaticPaymentInput` interface:
```typescript
export interface BillsAutomaticPaymentInput {
  name: string;
  slug: string;
  amount: number;
  predefined_slug: string;  // NEW - mandatory
}
```

Update `BillsAutomaticPayment` interface:
```typescript
export interface BillsAutomaticPayment {
  id: number;
  name: string;
  slug: string;
  amount: number;
  predefined_slug: string;  // NEW
  created_at: number;
}
```

Update `addBillsAutomaticPayment` to accept and store `predefined_slug`:
```typescript
export function addBillsAutomaticPayment(
  input: BillsAutomaticPaymentInput,
  db?: Database.Database,
): number {
  const dbConn = db ?? getDb();
  
  // Validate slug format
  if (!/^[a-zA-Z0-9_]+$/.test(input.slug)) {
    throw new Error("Slug must be a single word (alphanumeric + underscores only)");
  }
  
  // Validate predefined_slug format
  if (!/^[a-zA-Z0-9_]+$/.test(input.predefined_slug)) {
    throw new Error("Predefined slug must be a single word (alphanumeric + underscores only)");
  }
  
  // Validate amount is positive
  if (input.amount <= 0) {
    throw new Error("Amount must be a positive number");
  }
  
  const result = dbConn.prepare(
    "INSERT INTO bills_automatic_payments (name, slug, amount, predefined_slug) VALUES (?, ?, ?, ?)"
  ).run(input.name, input.slug, input.amount, input.predefined_slug);
  
  return Number(result.lastInsertRowid);
}
```

Update `getBillsAutomaticPayments` to return `predefined_slug`:
```typescript
export function getBillsAutomaticPayments(
  db?: Database.Database,
): BillsAutomaticPayment[] {
  const dbConn = db ?? getDb();
  return dbConn.prepare(
    "SELECT id, name, slug, amount, predefined_slug, created_at FROM bills_automatic_payments ORDER BY amount DESC"
  ).all() as BillsAutomaticPayment[];
}
```

Update `createAutomaticPaymentTransactions` to store `predefined_slug`:
```typescript
export function createAutomaticPaymentTransactions(
  db?: Database.Database,
): number {
  const dbConn = db ?? getDb();
  
  const payments = dbConn.prepare(
    "SELECT name, amount, predefined_slug FROM bills_automatic_payments ORDER BY amount DESC"
  ).all() as (BillsAutomaticPayment & { predefined_slug: string })[];
  
  let createdCount = 0;
  
  for (const payment of payments) {
    dbConn.prepare(
      "INSERT INTO bills_transactions (description, amount, is_automatic, predefined_slug) VALUES (?, ?, 1, ?)"
    ).run(payment.name, -payment.amount, payment.predefined_slug);
    createdCount++;
  }
  
  return createdCount;
}
```

### 3. API: Update Automatic Payments Route

Update `src/routes/api/bills/automatic-payments/index.ts`:
```typescript
export const onPost: RequestHandler = async ({ json, error, parseBody }) => {
  const body = await parseBody();
  const name = (body as any)?.name as string;
  const slug = (body as any)?.slug as string;
  const amount = Number((body as any)?.amount);
  const predefined_slug = (body as any)?.predefined_slug as string;  // NEW - required

  if (!name || !slug || isNaN(amount) || amount <= 0 || !predefined_slug) {
    throw error(400, "Valid name, slug, positive amount, and predefined_slug required");
  }

  try {
    const id = addBillsAutomaticPayment({ name, slug, amount, predefined_slug });
    json(201, { id, name, slug, amount, predefined_slug });
  } catch (err: any) {
    if (err.message.includes("UNIQUE")) {
      throw error(409, "Slug already exists");
    }
    throw error(400, err.message);
  }
};
```

### 4. UI: Update AutomaticPaymentsAdmin (`src/components/bills/AutomaticPaymentsAdmin.tsx`)

Add predefined payment dropdown:

```tsx
// Add new state for predefined payments
const predefinedPayments = useSignal<BillsPredefinedPayment[]>([]);
const selectedPredefinedSlug = useSignal("");

// Load predefined payments on mount
const loadPredefinedPayments = $(async () => {
  const res = await fetch("/api/bills/predefined-payments");
  if (res.ok) {
    const data = await res.json();
    predefinedPayments.value = data.payments;
  }
});

// Update handleAddPayment to include predefined_slug
const handleAddPayment = $(async () => {
  // ... existing validation ...
  
  if (!selectedPredefinedSlug.value) {
    paymentsError.value = "Must select a predefined payment";
    return;
  }
  
  const res = await fetch("/api/bills/automatic-payments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: newPaymentName.value.trim(),
      slug: slugVal,
      amount: amount,
      predefined_slug: selectedPredefinedSlug.value,  // NEW
    }),
  });
  // ... rest of handler ...
});
```

Add dropdown to form:
```tsx
<select
  data-testid="automatic-predefined-select"
  value={selectedPredefinedSlug.value}
  onChange$={(e) => selectedPredefinedSlug.value = (e.target as HTMLSelectElement).value}
  class="px-2 py-1 text-sm border rounded"
>
  <option value="">Select predefined payment</option>
  {predefinedPayments.value.map(p => (
    <option key={p.id} value={p.slug}>{p.name} ({p.slug})</option>
  ))}
</select>
```

Update `AutomaticPaymentItem` to display `predefined_slug`:
```tsx
<span class="ml-2 text-xs text-gray-400">[{payment.predefined_slug}]</span>
```

### 5. E2E Test (extend journey in `e2e/bills.spec.ts`)

```typescript
test("Bills: Predefined payments journey", async ({page}) => {
    // ... previous steps (add predefined payments) ...
    
    // 2. Admin: Add automatic payment linked to predefined
    await page.getByTestId("automatic-name-input").fill("Rent");
    await page.getByTestId("automatic-slug-input").fill("rent");
    await page.getByTestId("automatic-amount-input").fill("1200");
    
    // Select predefined payment from dropdown (mandatory)
    await page.getByTestId("automatic-predefined-select").selectOption("rent");
    
    await page.getByTestId("automatic-add-button").click();
    await expect(page.getByTestId("payment-item")).toContainText("Rent");
    await expect(page.getByTestId("payment-item")).toContainText("rent"); // predefined_slug visible
    
    // 3. Try to add automatic payment without predefined (should fail)
    await page.getByTestId("automatic-name-input").fill("Internet");
    await page.getByTestId("automatic-slug-input").fill("internet");
    await page.getByTestId("automatic-amount-input").fill("80");
    // Don't select predefined
    await page.getByTestId("automatic-add-button").click();
    await expect(page.getByTestId("automatic-error")).toContainText("Must select a predefined payment");
});
```

## Acceptance Criteria
1. Migration `021` runs successfully (`predefined_slug` column added)
2. `addBillsAutomaticPayment` requires `predefined_slug`
3. `createAutomaticPaymentTransactions` stores `predefined_slug` in `bills_transactions`
4. POST `/api/bills/automatic-payments` requires `predefined_slug` in body
5. AutomaticPaymentsAdmin shows mandatory predefined payment dropdown
6. E2E test passes (including validation error when predefined not selected)
