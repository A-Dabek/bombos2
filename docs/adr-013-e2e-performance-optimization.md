# ADR-013: E2E Test Performance Optimization

## Status
Draft

## Context
The e2e test suite currently has performance issues:
1. **29 `waitForTimeout` calls** adding ~13+ seconds of idle waiting
2. **~40 tests with significant redundancy** - many tests verify elements that are already checked in other tests
3. Test execution time is ~80-100 seconds

The project follows patterns where:
- Navigation tests check tab visibility separately from navigation tests
- Button visibility tests exist even when those buttons are clicked in other tests
- Plan module tests recreate API data 10+ times with identical code blocks
- Timeouts are used where `waitForSelector` or `waitForResponse` would be more reliable and faster

Flaky tests are a concern - e2e tests must be verified frequently during implementation.

## Decision

### Phase 1: Replace Timeouts with Proper Wait Strategies

Replace all 29 `waitForTimeout` calls with appropriate Playwright waiting mechanisms.

#### 1.1 Parcels Module (1 timeout)

**File**: `e2e/parcels.spec.ts`

| Line | Current Code | Replace With |
|------|-------------|--------------|
| 124 | `await page.waitForTimeout(500)` | `await page.waitForResponse(res => res.url().includes('/api/parcels') && res.request().method() === 'POST')` |

**Rationale**: After filling a note, the app saves via debounced API call. Wait for that specific API response instead of arbitrary delay.

#### 1.2 Meals Module (3 timeouts)

**File**: `e2e/meals.spec.ts`

| Line | Current Code | Replace With |
|------|-------------|--------------|
| 32 | `await page.waitForTimeout(500)` | `await page.waitForSelector("button:has-text('Roll')").then(() => page.waitForLoadState('networkidle'))` |
| 63 | `await page.waitForTimeout(500)` | `await page.waitForSelector(\`li:has-text("${testDishName}")\`)` |
| 74 | `await page.waitForTimeout(500)` | `await page.waitForSelector(\`li:has-text("${testDishName}")\`)` |

**Rationale**: 
- Line 32: Wait for the roll button to appear (page ready) then wait for network idle
- Lines 63, 74: Wait for the specific dish to appear in the list after adding

#### 1.3 Plan Module (25 timeouts!)

**File**: `e2e/plan.spec.ts`

| Line(s) | Current Code | Replace With |
|---------|-------------|--------------|
| 28, 47, 57, 94, 110, 141, 170, 198, 226, 260, 290, 323, 351, 373, 403, 435, 468, 489, 500 | `await page.waitForTimeout(500)` | `await page.waitForLoadState('networkidle')` or `await page.waitForSelector('[data-testid="..."]')` |
| 74, 80, 86, 114, 299, 332, 383, 411, 440, 472 | `await page.waitForTimeout(300)` | `await page.waitForSelector('[data-testid="..."]')` |

**Detailed Replacement Strategy for Plan Tests**:

1. **After `page.goto()`**: Replace `waitForTimeout(500)` with:
   ```typescript
   await page.waitForLoadState('networkidle');
   ```
   Or better, wait for a specific element:
   ```typescript
   await page.waitForSelector('[data-testid="plan-lists"]'); // for /plan/lists
   await page.waitForSelector('[data-testid="plan-admin"]'); // for /plan/admin
   await page.waitForSelector('[data-testid="plan-items"]'); // for /plan/[id]
   ```

2. **After adding list/item**: Replace `waitForTimeout(500)` with:
   ```typescript
   await page.waitForSelector(`li:has-text("${testListName}")`);
   ```

3. **After button clicks (edit, save, cancel, delete)**: Replace `waitForTimeout(300)` with:
   ```typescript
   await page.waitForSelector('[data-testid="edit-form"]'); // for edit
   await page.waitForSelector('[data-testid="plan-items"]'); // for save/cancel
   ```

#### 1.4 Production Code Changes for Better Waiting

Add `data-testid` attributes to key elements:

**Plan Module** (`src/components/plan/`):
- `PlanLists.tsx`: Add `data-testid="plan-lists"` to the main container
- `PlanAdmin.tsx`: Add `data-testid="plan-admin"` to the main container  
- `PlanListItems.tsx`: Add `data-testid="plan-items"` to the items container
- `PlanListItems.tsx`: Add `data-testid="edit-form"` to the edit form container
- `PlanListItems.tsx`: Add `data-testid="add-form"` to the add form container

**Parcels Module** (`src/components/parcels/`):
- Add `data-testid="parcel-note-input"` to note inputs
- Add `data-testid="parcel-image"` to parcel images

**Meals Module** (`src/components/meals/`):
- Add `data-testid="meal-roll-button"` to the sparkles/roll button

### Phase 2: Consolidate Redundant Tests

Reduce test count from ~40 to ~25 (38% reduction) by merging tests that verify the same user flows.

#### 2.1 Navigation Tests (`e2e/nav.spec.ts`)

**Current** (4 tests):
1. "home redirects to /parcels/incoming"
2. "all four nav tabs are visible"
3. "clicking each tab navigates to correct URL"
4. "active tab has correct visual state"

**Consolidated** (2 tests):

```typescript
test("navigation works correctly", async ({ page }) => {
  await page.goto("/");
  // Home redirect
  await expect(page).toHaveURL(/\/parcels\/incoming\/?$/);
  
  // All tabs visible
  for (const tab of TABS) {
    await expect(page.getByRole("link", { name: tab.label })).toBeVisible();
  }
  
  // Navigation and active state
  for (const tab of TABS) {
    await page.getByRole("link", { name: tab.label }).click();
    const expectedPath = /* ... */;
    await expect(page).toHaveURL(new RegExp(`\\${expectedPath}/?$`));
    const link = page.getByRole("link", { name: tab.label });
    await expect(link).toHaveAttribute("class", /border-blue-500/);
    await expect(link).toHaveAttribute("class", /text-blue-600/);
  }
});

test("meals tab redirects to dinner", async ({ page }) => {
  await page.goto("/meals");
  await expect(page).toHaveURL(/\/meals\/dinner\/?$/);
});
```

**Rationale**: Tab visibility is verified during navigation loop. Checking visibility separately is redundant.

#### 2.2 Parcels Tests (`e2e/parcels.spec.ts`)

**Current** (15 tests):
1. "redirects /parcels to /parcels/incoming"
2. "sub-navigation is visible" ← **REMOVE**
3. "tab switching navigates and highlights"
4. "empty state is visible on fresh state"
5. "upload incoming image and see miniature"
6. "upload outgoing image and see miniature"
7. "fullscreen open and close"
8. "persistence after reload"
9. "mark parcel as completed"
10. "add note to incoming parcel"
11. "note persists after reload"
12. "add note to outgoing parcel" ← **MERGE**
13. "note input enforces max length"
14. "loading spinner shown while parcels load" ← **REMOVE** (duplicate of test 4)
15. "mark as completed shows loading state"

**Consolidated** (10 tests):

| # | Test Name | Covers |
|---|-----------|--------|
| 1 | "redirects /parcels to /parcels/incoming" | Keep as-is |
| 2 | "tab navigation works correctly" | Merges: "sub-navigation is visible" + "tab switching navigates and highlights" |
| 3 | "empty state and loading spinner" | Merges: "empty state is visible" + "loading spinner shown" |
| 4 | "upload incoming image and see miniature" | Keep as-is |
| 5 | "upload outgoing image and see miniature" | Keep as-is |
| 6 | "fullscreen open and close" | Keep as-is |
| 7 | "image persistence after reload" | Renamed from "persistence after reload" |
| 8 | "mark parcel as completed" | Keep as-is (already comprehensive) |
| 9 | "note CRUD: add, persist, enforce max length" | Merges: "add note to incoming" + "note persists" + "note input enforces max length" + "add note to outgoing" (add as outgoing step) |
| 10 | "mark as completed shows loading state" | Keep as-is |

**Example Merged Test for Notes**:

```typescript
test("note CRUD: add, persist, enforce max length", async ({ page }) => {
  // Incoming note
  await page.goto("/parcels/incoming");
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles("e2e/fixtures/test-parcel.png");
  await expect(page.locator("img[alt='Parcel']").first()).toBeVisible();

  const noteInput = page.locator('input[type="text"]').first();
  await noteInput.fill("the big one");
  await expect(noteInput).toHaveValue("the big one");

  // Check max length
  await expect(noteInput).toHaveAttribute("maxLength", "100");

  // Persistence
  await page.waitForResponse(res => res.url().includes('/api/parcels') && res.request().method() === 'POST');
  await page.reload();
  await expect(page.locator('input[type="text"]').first()).toHaveValue("the big one");

  // Outgoing note
  await page.goto("/parcels/outgoing");
  await fileInput.setInputFiles("e2e/fixtures/test-parcel.png");
  await expect(page.locator("img[alt='Parcel']").first()).toBeVisible();
  const outgoingNoteInput = page.locator('input[type="text"]').first();
  await outgoingNoteInput.fill("urgent delivery");
  await expect(outgoingNoteInput).toHaveValue("urgent delivery");
});
```

#### 2.3 Meals Tests (`e2e/meals.spec.ts`)

**Current** (8 tests):
1. "redirects /meals to /meals/dinner"
2. "sub-navigation shows Dinner and Supper only"
3. "tab switching navigates and highlights"
4. "clicking sparkles button reveals a dinner meal"
5. "admin toggle button is visible" ← **REMOVE**
6. "admin page navigation works"
7. "admin can add a dish"
8. "admin can delete a dish"

**Consolidated** (5 tests):

| # | Test Name | Covers |
|---|-----------|--------|
| 1 | "redirects /meals to /meals/dinner" | Keep as-is |
| 2 | "sub-navigation and tab switching" | Merges: "sub-navigation shows..." + "tab switching navigates and highlights" |
| 3 | "clicking sparkles button reveals a dinner meal" | Keep as-is |
| 4 | "admin navigation and toggle button" | Merges: "admin toggle button is visible" + "admin page navigation works" |
| 5 | "admin CRUD: add and delete dish" | Merges: "admin can add" + "admin can delete" |

**Example Merged Admin Test**:

```typescript
test("admin navigation and toggle button", async ({ page }) => {
  await page.goto("/meals/dinner");
  
  // Admin button visible
  const adminLink = page.getByRole("link", { name: "Admin" });
  await expect(adminLink).toBeVisible();
  
  // Navigate to admin
  await adminLink.click();
  await expect(page).toHaveURL(/\/meals\/dinner\/admin\/?$/);
  
  // Back button exists
  await expect(page.getByRole("link", { name: "Back" })).toBeVisible();
});
```

#### 2.4 Plan Tests (`e2e/plan.spec.ts`)

**Current** (24 tests):
1. "redirects /plan to /plan/lists"
2. "main lists view displays all lists"
3. "shows no lists yet when empty"
4. "admin button is visible on main view" ← **REMOVE**
5. "admin page navigation works"
6. "admin can add a new list"
7. "admin can reorder lists with up/down buttons"
8. "admin can delete a list"
9. "clicking a list navigates to list items view"
10. "list items view shows items correctly"
11. "clicking an item shows edit/remove/amount buttons" ← **MERGE**
12. "clicking the same item again hides the buttons" ← **MERGE**
13. "plus/minus buttons change item amount" ← **MERGE**
14. "edit button shows form with item data" ← **MERGE**
15. "save in edit form updates the item and returns to list" ← **MERGE**
16. "cancel in edit form returns to list without saving" ← **MERGE**
17. "add new button shows empty form" ← **MERGE**
18. "save in add form creates item and returns to list" ← **MERGE**
19. "cancel in add form returns to list" ← **MERGE**
20. "remove button deletes item immediately"
21. "remove all button deletes all items immediately"
22. "back button returns to lists view from list items"
23. "back button returns to lists view from admin"

**Consolidated** (14 tests):

| # | Test Name | Covers |
|---|-----------|--------|
| 1 | "redirects /plan to /plan/lists" | Keep as-is |
| 2 | "main lists view displays all lists or empty state" | Merges: "main lists view..." + "shows no lists yet..." |
| 3 | "admin navigation and button visibility" | Merges: "admin button is visible" + "admin page navigation works" |
| 4 | "admin CRUD: add, reorder, delete lists" | Merges: "admin can add" + "admin can reorder" + "admin can delete" |
| 5 | "clicking a list navigates to list items view" | Keep as-is |
| 6 | "list items view shows items correctly" | Keep as-is |
| 7 | "item interaction: select, show buttons, toggle, change amount" | Merges: tests 11, 12, 13 |
| 8 | "item edit flow: show form, edit, save, cancel" | Merges: tests 14, 15, 16 |
| 9 | "item add flow: show form, add, cancel" | Merges: tests 17, 18, 19 |
| 10 | "remove button deletes item immediately" | Keep as-is |
| 11 | "remove all button deletes all items immediately" | Keep as-is |
| 12 | "back button returns to lists view from list items" | Keep as-is |
| 13 | "back button returns to lists view from admin" | Keep as-is |
| 14 | "add new list and verify persistence" | NEW: Creates list, verifies in lists view |

**Example Merged Item Interaction Test**:

```typescript
test("item interaction: select, show buttons, toggle, change amount", async ({ page }) => {
  // Create list and item via API helper
  const list = await createTestList("Test List");
  await createTestItem(list.id, "Test Item", { amount: 1 });

  await page.goto(`/plan/${list.id}`);
  await page.waitForSelector('[data-testid="plan-items"]');

  // Click item to show buttons
  await page.getByText("Test Item").click();
  await expect(page.getByLabel("Decrease amount")).toBeVisible();
  await expect(page.getByLabel("Increase amount")).toBeVisible();
  await expect(page.getByLabel("Edit")).toBeVisible();
  await expect(page.getByLabel("Remove")).toBeVisible();

  // Click again to hide
  await page.getByText("Test Item").click();
  await expect(page.getByLabel("Edit")).not.toBeVisible();

  // Show again and test amount
  await page.getByText("Test Item").click();
  await expect(page.getByText("x1")).toBeVisible();

  // Increase
  await page.getByLabel("Increase amount").click();
  await page.waitForSelector('text=x2');
  await expect(page.getByText("x2")).toBeVisible();

  // Decrease
  await page.getByLabel("Decrease amount").click();
  await page.waitForSelector('text=x1');
  await expect(page.getByText("x1")).toBeVisible();
});
```

#### 2.5 Create Test Helpers for Plan Module

**New File**: `e2e/helpers/plan-helpers.ts`

```typescript
import { Page } from "@playwright/test";

export interface TestList {
  id: number;
  title: string;
  display_order: number;
}

export interface TestItem {
  id?: number;
  name: string;
  description?: string;
  amount?: number;
}

export async function createTestList(title: string, displayOrder = 0): Promise<TestList> {
  const res = await fetch("http://localhost:5173/api/plan/lists", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, display_order: displayOrder }),
  });
  return await res.json();
}

export async function createTestItem(listId: number, item: TestItem) {
  await fetch(`http://localhost:5173/api/plan/lists/${listId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(item),
  });
}

export async function waitForListInUI(page: Page, listName: string) {
  await page.waitForSelector(`li:has-text("${listName}")`);
}

export async function waitForItemInUI(page: Page, itemName: string) {
  await page.waitForSelector(`text=${itemName}`);
}
```

**Update `e2e/plan.spec.ts`** to import helpers:
```typescript
import { createTestList, createTestItem } from "./helpers/plan-helpers";
```

## Acceptance Criteria

### Phase 1 (Replace Timeouts):
- [ ] All 29 `waitForTimeout` calls removed from e2e tests
- [ ] Each removed timeout replaced with appropriate `waitForSelector`, `waitForResponse`, or `waitForLoadState`
- [ ] `data-testid` attributes added to key elements in production code:
  - [ ] Plan: `plan-lists`, `plan-admin`, `plan-items`, `edit-form`, `add-form`
  - [ ] Parcels: `parcel-note-input`, `parcel-image`
  - [ ] Meals: `meal-roll-button`
- [ ] Run `pnpm e2e` after each file modification to verify no flakiness
- [ ] Total timeout reduction: ~13 seconds

### Phase 2 (Consolidate Tests):
- [ ] Test count reduced from ~40 to ~25 (30%+ reduction)
- [ ] **nav.spec.ts**: 4 tests → 2 tests
- [ ] **parcels.spec.ts**: 15 tests → 10 tests
- [ ] **meals.spec.ts**: 8 tests → 5 tests
- [ ] **plan.spec.ts**: 24 tests → 14 tests
- [ ] New file `e2e/helpers/plan-helpers.ts` created with reusable helpers
- [ ] Run `pnpm e2e` after each test file consolidation to verify no regressions
- [ ] All merged tests maintain original coverage (no functionality untested)

### Verification Process (Critical for Flaky Tests):
1. **After each individual change** (timeout replacement or test merge):
   - Run `pnpm e2e` 
   - If any test fails, investigate immediately before proceeding
   
2. **After completing Phase 1**:
   - Run `pnpm e2e` 3 times in a row
   - All 3 runs must pass consistently (no flakiness)
   
3. **After completing Phase 2**:
   - Run `pnpm e2e` 3 times in a row
   - All 3 runs must pass consistently
   - Compare test count: `pnpm e2e | Select-String "passed"`

4. **Final verification**:
   - Run `pnpm e2e --reporter=list` and capture total time
   - Compare with baseline (~80-100s)
   - Expected improvement: ~50% reduction (target: <50s)

## Consequences

### Positive:
- **Faster test execution**: Estimated 50%+ reduction in e2e test time
- **More reliable tests**: Replacing arbitrary timeouts with explicit waits reduces flakiness
- **Cleaner test code**: Consolidated tests better represent user flows
- **Reusable helpers**: Plan test helpers reduce code duplication
- **Better element selection**: `data-testid` attributes are more stable than CSS selectors

### Negative:
- **More complex test files**: Merged tests are longer (but fewer in number)
- **Production code changes**: Adding `data-testid` requires touching multiple components
- **Risk of over-consolidation**: Merged tests may be harder to debug if they fail

### Risks:
- **Flaky tests**: Replacing timeouts with wrong wait strategy could cause flakiness
  - **Mitigation**: Run tests multiple times after each change
- **Lost test isolation**: Merged tests cover more functionality but may be less focused
  - **Mitigation**: Keep merged tests focused on a single user flow

## Points of Discussion

1. **`data-testid` vs semantic selectors**: Using `data-testid` is more stable but couples tests to test-specific attributes. Current approach uses semantic selectors (role, text). Decision: Use `data-testid` for dynamic content (plan items, parcels after upload), keep semantic selectors for static nav elements.

2. **How much consolidation?** Some may argue 25 tests is still too many. However, over-consolidation makes tests hard to debug. Decision: Prioritize test clarity over pure count reduction.

3. **Test helpers location**: Should helpers be in `e2e/helpers/` or co-located with specs? Decision: `e2e/helpers/` for better organization.

4. **Waiting strategy for API calls**: Plan tests create data via API. Should we wait for API response or UI update? Decision: Wait for UI update (`waitForSelector`) as it's the ultimate proof the operation succeeded.

5. **Skipping Phase 3 (parallelism)**: User explicitly requested NOT to implement parallelism. Current plan is sequential test execution with `fullyParallel: false` (default). If parallelism is needed later, it can be added with `fullyParallel: true` in playwright.config.ts.

## Implementation Order

To minimize risk and catch flakiness early:

1. **Phase 1a**: Replace timeouts in `parcels.spec.ts` (1 timeout) → test
2. **Phase 1b**: Replace timeouts in `meals.spec.ts` (3 timeouts) → test
3. **Phase 1c**: Add `data-testid` to production code
4. **Phase 1d**: Replace timeouts in `plan.spec.ts` (25 timeouts) → test 3x
5. **Phase 2a**: Consolidate `nav.spec.ts` → test
6. **Phase 2b**: Consolidate `parcels.spec.ts` → test
7. **Phase 2c**: Consolidate `meals.spec.ts` → test
8. **Phase 2d**: Create `e2e/helpers/plan-helpers.ts`
9. **Phase 2e**: Consolidate `plan.spec.ts` → test 3x
10. **Final verification**: Run full suite 3x, compare times

Each step should be committed separately with clear commit messages.
