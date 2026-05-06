# task-3-manual-bills-predefined-dropdown

## Goal
User can select predefined payment when adding manual bill; description pre-fills; `predefined_slug` saved to DB.

## Steps

### 1. Migration
Create `src/db/migrations/020_add_predefined_slug_to_transactions.sql`:
```sql
ALTER TABLE bills_transactions ADD COLUMN predefined_slug TEXT;
CREATE INDEX IF NOT EXISTS idx_bills_transactions_predefined_slug 
  ON bills_transactions(predefined_slug);
```

### 2. DB Functions (`src/db/bills.ts`)

Update `BillsTransaction` interface:
```typescript
export interface BillsTransaction {
  id: number;
  description: string;
  amount: number;
  is_automatic: boolean;
  predefined_slug?: string;  // NEW - optional
  created_at: number;
}
```

Update `addBillTransaction` to accept optional `predefined_slug`:
```typescript
export function addBillTransaction(
  description: string,
  amount: number,
  is_automatic = false,
  predefined_slug?: string,  // NEW
  db?: Database.Database,
): number {
  const dbConn = db ?? getDb();
  
  if (predefined_slug) {
    const result = dbConn.prepare(
      "INSERT INTO bills_transactions (description, amount, is_automatic, predefined_slug) VALUES (?, ?, ?, ?)"
    ).run(description, amount, is_automatic ? 1 : 0, predefined_slug);
    return Number(result.lastInsertRowid);
  } else {
    const result = dbConn.prepare(
      "INSERT INTO bills_transactions (description, amount, is_automatic) VALUES (?, ?, ?)"
    ).run(description, amount, is_automatic ? 1 : 0);
    return Number(result.lastInsertRowid);
  }
}
```

Update `getBillTransactions` to return `predefined_slug`:
```typescript
export function getBillTransactions(
  db?: Database.Database,
  include_automatic = false,
): BillsTransaction[] {
  const dbConn = db ?? getDb();
  const sql = include_automatic 
    ? "SELECT id, description, amount, is_automatic, predefined_slug, created_at FROM bills_transactions ORDER BY id DESC"
    : "SELECT id, description, amount, is_automatic, predefined_slug, created_at FROM bills_transactions WHERE is_automatic = 0 ORDER BY id DESC";
  return dbConn.prepare(sql).all() as BillsTransaction[];
}
```

### 3. API: Update Transactions Route

Update `src/routes/api/bills/transactions/index.ts`:
```typescript
export const onPost: RequestHandler = async ({ parseBody, json, error }) => {
  const body = await parseBody();
  const description = (body as any)?.description as string;
  const amount = Number((body as any)?.amount);
  const predefined_slug = (body as any)?.predefined_slug as string | undefined;  // NEW - optional

  if (!description || isNaN(amount) || amount === 0) {
    throw error(400, "Valid description and non-zero amount required");
  }

  const id = addBillTransaction(description, amount, false, predefined_slug || undefined);
  json(201, { id, description, amount, predefined_slug: predefined_slug || null });
};
```

### 4. New Component: `BillsTransactionForm`

Create `src/components/bills/BillsTransactionForm.tsx`:

```tsx
import { component$, useVisibleTask$, useSignal, $ } from "@builder.io/qwik";
import type { BillsPredefinedPayment } from "~/db/bills";
import TransactionForm from "~/components/transactions/TransactionForm";
import Loader from "~/components/shared/Loader";

interface BillsTransactionFormProps {
  loading: boolean;
  onSubmit$: (description: string, amount: number, predefinedSlug?: string) => void;
}

export default component$<BillsTransactionFormProps>(({ loading, onSubmit$ }) => {
  const predefinedPayments = useSignal<BillsPredefinedPayment[]>([]);
  const selectedPredefinedSlug = useSignal("");
  const description = useSignal("");
  const amount = useSignal("");

  useVisibleTask$(async () => {
    try {
      const res = await fetch("/api/bills/predefined-payments");
      if (res.ok) {
        const data = await res.json();
        predefinedPayments.value = data.payments;
      }
    } catch (e) {
      // Ignore - dropdown just won't show
    }
  });

  const handlePredefinedSelect = $((slug: string, name: string) => {
    selectedPredefinedSlug.value = slug;
    description.value = name;  // Pre-fill description
  });

  const handleSubmit = $((desc: string, amt: number) => {
    onSubmit$(desc, amt, selectedPredefinedSlug.value || undefined);
    // Clear form
    description.value = "";
    amount.value = "";
    selectedPredefinedSlug.value = "";
  });

  return (
    <div>
      {/* Predefined payment dropdown */}
      {predefinedPayments.value.length > 0 && (
        <div class="mb-2">
          <select
            data-testid="bills-predefined-select"
            value={selectedPredefinedSlug.value}
            onChange$={(e) => {
              const slug = (e.target as HTMLSelectElement).value;
              if (slug) {
                const payment = predefinedPayments.value.find(p => p.slug === slug);
                if (payment) handlePredefinedSelect(slug, payment.name);
              } else {
                selectedPredefinedSlug.value = "";
                description.value = "";
              }
            }}
            class="w-full px-2 py-1 text-sm border rounded"
          >
            <option value="">Select predefined payment (optional)</option>
            {predefinedPayments.value.map(p => (
              <option key={p.id} value={p.slug}>{p.name} ({p.slug})</option>
            ))}
          </select>
        </div>
      )}
      
      {/* Wrap TransactionForm */}
      <TransactionForm
        description={description.value}
        amount={amount.value}
        loading={loading}
        onSubmit$={handleSubmit}
      />
    </div>
  );
});
```

### 5. Update BillsPage (`src/components/bills/BillsPage.tsx`)

Replace `TransactionForm` usage with `BillsTransactionForm`:

```tsx
import BillsTransactionForm from "~/components/bills/BillsTransactionForm";

// Update handleAdd to accept predefined_slug
const handleAdd = $(async (desc: string, amt: number, predefinedSlug?: string) => {
  if (!desc || isNaN(amt) || amt === 0 || loading.value) return;
  loading.value = true;
  error.value = null;
  try {
    const body: any = { description: desc, amount: amt };
    if (predefinedSlug) body.predefined_slug = predefinedSlug;
    
    const res = await fetch("/api/bills/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Failed to add transaction");
    }
    await loadData();
  } catch (e: any) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
});

// In JSX, replace TransactionForm with:
<BillsTransactionForm
  loading={loading.value}
  onSubmit$={handleAdd}
/>
```

### 6. E2E Test (final journey in `e2e/bills.spec.ts`)

```typescript
test("Bills: Predefined payments journey", async ({page}) => {
    // ... previous steps ...
    
    // 4. User: Go to bills page and add manual bill using predefined
    await page.goto("/money/bills");
    await page.getByTestId("loader").waitFor({state: "hidden"});
    await page.waitForTimeout(500);
    
    // Select predefined payment from dropdown
    await page.getByTestId("bills-predefined-select").selectOption("electricity");
    
    // Description pre-filled with "Electricity"
    await expect(page.getByTestId("transaction-desc-input")).toHaveValue("Electricity");
    
    // Edit description (user can still edit)
    await page.getByTestId("transaction-desc-input").fill("Electricity - June");
    await page.getByTestId("transaction-amount-input").fill("-150");
    
    await Promise.all([
        page.waitForResponse(r => r.url().endsWith("/api/bills/transactions") && r.request().method() === "POST"),
        page.getByTestId("transaction-add-button").click(),
    ]);
    
    await expect(page.getByText("Electricity - June")).toBeVisible();
    await expect(page.getByText("-150")).toBeVisible();
    
    // 5. User: Add manual bill with free text (no predefined)
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
1. Migration `020` runs successfully (`predefined_slug` column added to `bills_transactions`)
2. `addBillTransaction` accepts optional `predefined_slug`
3. POST `/api/bills/transactions` accepts optional `predefined_slug`
4. `BillsTransactionForm` component created with dropdown that pre-fills description
5. `BillsPage` uses `BillsTransactionForm` instead of `TransactionForm`
6. E2E journey test passes (predefined select, pre-fill, free text fallback)
