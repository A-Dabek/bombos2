# task-1-predefined-payments-crud

## Goal
Admin can manage predefined payment names (name + slug only) via UI.

## Steps

### 1. Migration
Create `src/db/migrations/019_add_predefined_payments.sql`:
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

### 2. DB Functions (`src/db/bills.ts`)
Add new types and functions:

```typescript
export interface BillsPredefinedPayment {
  id: number;
  name: string;
  slug: string;
  created_at: number;
}

export function getBillsPredefinedPayments(
  db?: Database.Database,
): BillsPredefinedPayment[] {
  const dbConn = db ?? getDb();
  return dbConn.prepare(
    "SELECT id, name, slug, created_at FROM bills_predefined_payments ORDER BY name ASC"
  ).all() as BillsPredefinedPayment[];
}

export function addBillsPredefinedPayment(
  input: { name: string; slug: string },
  db?: Database.Database,
): number {
  const dbConn = db ?? getDb();
  
  if (!/^[a-zA-Z0-9_]+$/.test(input.slug)) {
    throw new Error("Slug must be a single word (alphanumeric + underscores only)");
  }
  
  const result = dbConn.prepare(
    "INSERT INTO bills_predefined_payments (name, slug) VALUES (?, ?)"
  ).run(input.name, input.slug);
  
  return Number(result.lastInsertRowid);
}

export function deleteBillsPredefinedPayment(
  id: number,
  db?: Database.Database,
): void {
  const dbConn = db ?? getDb();
  dbConn.prepare(
    "DELETE FROM bills_predefined_payments WHERE id = ?"
  ).run(id);
}
```

### 3. API Routes

**`src/routes/api/bills/predefined-payments/index.ts`**:
```typescript
import { RequestHandler } from "@builder.io/qwik-city";
import { getBillsPredefinedPayments, addBillsPredefinedPayment } from "~/db/bills";

export const onGet: RequestHandler = async ({ json }) => {
  const payments = getBillsPredefinedPayments();
  json(200, { payments });
};

export const onPost: RequestHandler = async ({ parseBody, json, error }) => {
  const body = await parseBody();
  const name = (body as any)?.name as string;
  const slug = (body as any)?.slug as string;

  if (!name || !slug) {
    throw error(400, "Valid name and slug required");
  }

  try {
    const id = addBillsPredefinedPayment({ name, slug });
    json(201, { id, name, slug });
  } catch (err: any) {
    if (err.message.includes("UNIQUE")) {
      throw error(409, "Slug already exists");
    }
    throw error(400, err.message);
  }
};
```

**`src/routes/api/bills/predefined-payments/[id]/index.ts`**:
```typescript
import { RequestHandler } from "@builder.io/qwik-city";
import { deleteBillsPredefinedPayment } from "~/db/bills";

export const onDelete: RequestHandler = async ({ params, json, error }) => {
  const id = Number(params.id);
  if (isNaN(id)) {
    throw error(400, "Invalid ID");
  }

  try {
    deleteBillsPredefinedPayment(id);
    json(200, { success: true });
  } catch (err: any) {
    throw error(500, err.message);
  }
};
```

### 4. UI: Add Section to BillsAdmin (`src/components/bills/BillsAdmin.tsx`)

Add below `<AutomaticPaymentsAdmin />`:

```tsx
// Predefined Payments State
const predefinedPayments = useSignal<BillsPredefinedPayment[]>([]);
const newPredefinedName = useSignal("");
const newPredefinedSlug = useSignal("");
const predefinedLoading = useSignal(false);
const predefinedError = useSignal<string | null>(null);
const predefinedDeleteConfirmations = useSignal<Set<number>>(new Set());

const loadPredefinedPayments = $(async () => {
  predefinedLoading.value = true;
  predefinedError.value = null;
  try {
    const res = await fetch("/api/bills/predefined-payments");
    if (!res.ok) throw new Error("Failed to load predefined payments");
    const data = await res.json();
    predefinedPayments.value = data.payments;
  } catch (e: any) {
    predefinedError.value = e.message;
  } finally {
    predefinedLoading.value = false;
  }
});

// Load on mount (add to existing useVisibleTask$)

const handleAddPredefined = $(async () => {
  // Validate and add
  const slugVal = newPredefinedSlug.value.trim();
  if (!newPredefinedName.value.trim() || !slugVal) {
    predefinedError.value = "Valid name and slug required";
    return;
  }
  if (!/^[a-zA-Z0-9_]+$/.test(slugVal)) {
    predefinedError.value = "Slug must be a single word (alphanumeric + underscores only)";
    return;
  }
  // POST to API, reload on success
});

const handleDeletePredefined = $(async (paymentId: number) => {
  // Toggle confirmation, then DELETE on confirm
});
```

Render section with:
- Heading: "Predefined Payment Names"
- List with `data-testid="predefined-item"` showing name + slug
- Delete button with 2-second confirmation (same pattern as `AutomaticPaymentItem`)
- Form: name input (`data-testid="predefined-name-input"`), slug input (`data-testid="predefined-slug-input"`), Add button (`data-testid="predefined-add-button"`)

### 5. E2E Test (extend `e2e/bills.spec.ts`)

Add to existing journey or create new test:

```typescript
test("Bills: Predefined payments journey", async ({page}) => {
    // 1. Admin: Add predefined payments
    await page.goto("/money/bills/admin");
    await page.getByTestId("loader").waitFor({state: "hidden"});
    
    // Add "Electricity"
    await page.getByTestId("predefined-name-input").fill("Electricity");
    await page.getByTestId("predefined-slug-input").fill("electricity");
    await page.getByTestId("predefined-add-button").click();
    await expect(page.getByTestId("predefined-item")).toContainText("Electricity");
    
    // Add "Water"
    await page.getByTestId("predefined-name-input").fill("Water");
    await page.getByTestId("predefined-slug-input").fill("water");
    await page.getByTestId("predefined-add-button").click();
    await expect(page.getByTestId("predefined-item").last()).toContainText("Water");
    
    // 2. Delete "Water"
    await page.getByTestId("predefined-delete-water").click(); // Use payment id in testid
    // Wait 2 seconds, click confirm
    await page.waitForTimeout(2100);
    await page.getByTestId("predefined-delete-water").click(); // Now says "Confirm?"
    await expect(page.getByTestId("predefined-item")).not.toContainText("Water");
});
```

## Acceptance Criteria
1. Migration `019` runs successfully (table created)
2. GET `/api/bills/predefined-payments` returns list
3. POST creates new predefined payment (name + slug)
4. DELETE removes predefined payment
5. Admin UI shows list, add form, delete with confirmation
6. E2E test passes
