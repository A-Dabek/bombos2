# ADR-014: Plan Module UI Improvements

## Status
Ready

## Summary
Improve Plan module UX with slide-in form animations, double-click confirmation for destructive actions, reusable Admin button component, and fade-in animations for list views.

## Problem Description
1. **Form transition is abrupt**: The item add/edit form currently replaces the list view instantly without animation, creating a jarring UX.
2. **Accidental deletions**: Single-click delete buttons for list items ("Remove All", trash icons) can cause accidental data loss.
3. **Inconsistent Admin button**: The floating Admin button is duplicated across Plan and Meals modules with identical styling but no shared component.
4. **Missing animations**: List views lack the fade-in animations present in other modules (Parcels, Meals).

## Proposed Solution

### 1. Slide-in Animation for Form (Option A)
- **Approach**: Keep both list view and form in DOM simultaneously, side-by-side
- **Implementation**:
  - Wrap both views in a container with `overflow-hidden` and CSS transitions
  - Use CSS `transform: translateX()` for sliding
  - List view: `translateX(0)` when visible, `translateX(-100%)` when hidden (completely off-screen)
  - Form: `translateX(100%)` when hidden (off-screen right), `translateX(0)` when visible
  - When form activates: list moves to `translateX(-100%)`, form moves to `translateX(0)`
  - When form closes (save/cancel): list moves to `translateX(0)`, form moves to `translateX(100%)`
  - Use `transition-transform duration-300 ease-in-out` for smooth animation
  - Track form mode with `useSignal<"none" | "add" | "edit">` (keep existing state)
  - Track animation state with `useSignal<boolean>` for triggering CSS classes
  - On save/cancel: set animating out state, wait 300ms for animation, then set formMode to "none"

**Key constraint**: Elements must remain in DOM during transition (cannot use conditional rendering)

**Data-testid**: Add `data-testid="edit-form-add"` and `data-testid="edit-form-edit"` to distinguish form modes for E2E tests

### 2. Double-Click Confirmation for Destructive Actions
- **Buttons affected**:
  - "Remove All" button in `PlanListItems.tsx`
  - Trash icon for individual items in `PlanListItems.tsx`
  - Trash icon for individual lists in `PlanAdmin.tsx`
- **Behavior**:
  - First click: Replace trash icon with `HiCheckCircleSolid` + `animate-pulse` class
  - Set 2-second timeout to revert to trash icon
  - If checkmark clicked within 2 seconds: Execute destructive action immediately
  - If timeout expires: Revert to trash icon (clear timeout on action)
- **State management**: Use `useSignal<boolean>` for confirmation state per button
- **Note**: No shake animation on first click (per user requirement)

### 3. Reusable Admin Button Component
- **Location**: `src/components/shared/AdminButton.tsx`
- **Props**: `{ href: string }` (minimal - only the differing prop)
- **Styling** (unified):
  ```tsx
  class="fixed bottom-4 right-4 flex items-center justify-center w-14 h-14 bg-red-500 rounded-full shadow-lg"
  ```
- **Icon**: `HiCog6ToothSolid` with `class="w-7 h-7 text-white"`
- **Usage**:
  - `PlanLists.tsx`: `<AdminButton href="/plan/admin" />`
  - `MealPage.tsx`: `<AdminButton href={`/meals/${props.category}/admin`} />`

### 4. Fade-In Animations
- **Pattern**: Use Qwik's `starting:opacity-0` with Tailwind transition classes
- **PlanLists.tsx** (list of lists):
  - Wrap `<ul>` in `<div class="starting:opacity-0 opacity-100 transition-opacity duration-300">`
  - Apply when `isLoaded.value && lists.value.length > 0`
- **PlanListItems.tsx** (list items):
  - Wrap `<ul>` of items in fade-in div
  - Apply when `isLoaded.value && items.value.length > 0`
- **Both views**: Animate all items at once (not staggered per user requirement)

## Decision Log

1. **Rapid form clicks**: No need to disable buttons during transition - users can click rapidly without issue.
2. **Double-click feedback**: Pulsing checkmark only - no text or countdown. Users will learn the pattern.
3. **Admin button positioning**: Button remains `fixed` during form slide animation (does not slide with list).
4. **Mobile-first approach**: Slide animation stays enabled on all screen sizes. Mobile-only app, no "cramped" concern.
5. **Form dirty state**: No confirmation on Cancel even if form has unsaved changes. Immediate cancel.

## Acceptance Criteria

### Feature 1: Slide-in Form
- [ ] List view and form are both rendered in DOM (no conditional rendering)
- [ ] Clicking "Add new" slides form in from right, list slides out to left
- [ ] Clicking "Edit" on an item slides form in with item data pre-filled
- [ ] Clicking "Save" slides form out right, list slides in from left
- [ ] Clicking "Cancel" slides form out right, list slides in from left
- [ ] Animation duration is 300ms with ease-in-out timing
- [ ] No visual flicker or abrupt changes during transition

### Feature 2: Double-Click Confirmation
- [ ] "Remove All" button shows pulsing checkmark on first click
- [ ] Trash icon for individual items shows pulsing checkmark on first click
- [ ] Trash icon for individual lists (admin) shows pulsing checkmark on first click
- [ ] Clicking checkmark within 2 seconds executes the destructive action
- [ ] Waiting 2+ seconds without clicking reverts icon to trash
- [ ] Action is NOT executed on first click (only icon change)
- [ ] Timeout is cleared if action is confirmed (no double execution)

### Feature 3: Admin Button Component
- [ ] `AdminButton` component created at `src/components/shared/AdminButton.tsx`
- [ ] Component accepts only `href` prop
- [ ] Styling matches existing floating button exactly
- [ ] `PlanLists.tsx` uses `AdminButton href="/plan/admin"`
- [ ] `MealPage.tsx` uses `AdminButton` (update path as needed)
- [ ] No regression in navigation behavior

### Feature 4: Fade-In Animations
- [ ] PlanLists main view fades in on load (all items at once)
- [ ] PlanListItems detail view fades in on load (all items at once)
- [ ] Animation uses `starting:opacity-0 opacity-100 transition-opacity duration-300`
- [ ] No flash of content before animation starts
- [ ] Animation triggers after data is loaded (not before)

## Tests to be Added

### E2E Tests (Playwright - `e2e/plan.spec.ts`)

**Double-Click Confirmation Tests:**
```typescript
test("remove all button requires double-click confirmation", async ({ page }) => {
  const list = await createTestList("Test List");
  await createTestItem(list.id, { name: "Item 1" });
  await createTestItem(list.id, { name: "Item 2" });

  await page.goto(`/plan/${list.id}`);
  await page.waitForSelector('[data-testid="plan-items"]');

  // First click - should show checkmark
  await page.getByRole("button", { name: "Remove all" }).click();
  await expect(page.getByRole("button", { name: "Remove all" }).locator("svg")).toHaveClass(/animate-pulse/);

  // Wait for timeout - should revert to trash
  await page.waitForSelector('[data-testid="plan-items"] button[aria-label="Remove all"] svg:not(.animate-pulse)', { timeout: 3000 });

  // Click again within timeout - should execute
  await page.getByRole("button", { name: "Remove all" }).click();
  // Wait for checkmark to appear
  await page.waitForSelector('[data-testid="plan-items"] button[aria-label="Remove all"] svg.animate-pulse');
  // Click checkmark to confirm
  await page.getByRole("button", { name: "Remove all" }).click();
  // Wait for items to be removed
  await page.waitForSelector('text="No items yet"');
});

test("single item trash requires double-click confirmation", async ({ page }) => {
  const list = await createTestList("Test List");
  await createTestItem(list.id, { name: "Item to Delete" });

  await page.goto(`/plan/${list.id}`);
  await page.waitForSelector('[data-testid="plan-items"]');

  // Click item to show buttons
  await page.getByText("Item to Delete").click();
  const trashButton = page.getByLabel("Remove");

  // First click - should show checkmark
  await trashButton.click();
  await expect(trashButton.locator("svg")).toHaveClass(/animate-pulse/);

  // Click checkmark to confirm
  await trashButton.click();
  // Wait for item to disappear
  await page.waitForSelector('text="Item to Delete"', { state: 'detached' });
});

test("admin list trash requires double-click confirmation", async ({ page }) => {
  await page.goto("/plan/admin");
  await page.waitForSelector('[data-testid="plan-admin"]');

  const listName = `__E2E_LIST_${Date.now()}`;
  await page.getByPlaceholder("New list title...").fill(listName);
  await page.getByRole("button", { name: "Add List" }).click();
  await expect(page.getByText(listName)).toBeVisible();

  const trashButton = page.locator("li").filter({ hasText: listName }).locator('button[aria-label="Delete"]');

  // First click - should show checkmark
  await trashButton.click();
  await expect(trashButton.locator("svg")).toHaveClass(/animate-pulse/);

  // Click checkmark to confirm
  await trashButton.click();
  // Wait for list to disappear
  await page.waitForSelector(`text="${listName}"`, { state: 'detached' });
});
```

**Animation Tests:**
```typescript
test("list items view fades in on load", async ({ page }) => {
  const list = await createTestList("Test List");
  await createTestItem(list.id, { name: "Test Item" });

  await page.goto(`/plan/${list.id}`);
  // Check for fade-in class on items container
  const itemsContainer = page.locator('[data-testid="plan-items"] > div');
  await page.waitForSelector('[data-testid="plan-items"] > div.transition-opacity');
  await expect(itemsContainer).toHaveClass(/transition-opacity/);
});

test("plan lists view fades in on load", async ({ page }) => {
  await createTestList("Test List");

  await page.goto("/plan/lists");
  // Check for fade-in class on lists container
  const listsContainer = page.locator('[data-testid="plan-lists"] > div');
  await page.waitForSelector('[data-testid="plan-lists"] > div.transition-opacity');
  await expect(listsContainer).toHaveClass(/transition-opacity/);
});
```

**Slide Animation Tests:**
```typescript
test("add item slides form in from right", async ({ page }) => {
  const list = await createTestList("Test List");

  await page.goto(`/plan/${list.id}`);
  await page.waitForSelector('[data-testid="plan-items"]');

  // Click Add new
  await page.getByRole("button", { name: "Add new" }).click();

  // Both list and form should be in DOM
  await page.waitForSelector('[data-testid="plan-items"]');
  await page.waitForSelector('[data-testid="edit-form-add"]');

  // Form should have slide-in class (translateX(0))
  const form = page.locator('[data-testid="edit-form-add"]');
  await expect(form).toHaveClass(/translate-x-0/);
});

test("edit item slides form in from right", async ({ page }) => {
  const list = await createTestList("Test List");
  await createTestItem(list.id, { name: "Edit Me" });

  await page.goto(`/plan/${list.id}`);
  await page.waitForSelector('[data-testid="plan-items"]');

  // Click item to show buttons, then edit
  await page.getByText("Edit Me").click();
  await page.getByLabel("Edit").click();

  // Form should be visible with edit testid
  await page.waitForSelector('[data-testid="edit-form-edit"]');
  const form = page.locator('[data-testid="edit-form-edit"]');
  await expect(form).toHaveClass(/translate-x-0/);
});

test("cancel form slides out to right", async ({ page }) => {
  const list = await createTestList("Test List");

  await page.goto(`/plan/${list.id}`);
  await page.waitForSelector('[data-testid="plan-items"]');

  // Click Add new
  await page.getByRole("button", { name: "Add new" }).click();
  await page.waitForSelector('[data-testid="edit-form-add"]');

  // Click Cancel
  await page.getByRole("button", { name: "Cancel" }).click();

  // Wait for animation to complete and form to disappear
  await page.waitForSelector('[data-testid="edit-form-add"]', { state: 'detached', timeout: 1000 });
  // List should be visible again
  await expect(page.locator('[data-testid="plan-items"]')).toBeVisible();
});
```

### DB Tests
No DB tests needed (UI-only changes).

## Affected Files

### New Files
- `src/components/shared/AdminButton.tsx` - Reusable Admin button component

### Modified Files
- `src/components/plan/PlanListItems.tsx` - Slide animation, double-click confirmation
- `src/components/plan/PlanLists.tsx` - Fade-in animation, use AdminButton
- `src/components/plan/PlanAdmin.tsx` - Double-click confirmation
- `src/components/meals/MealPage.tsx` - Use AdminButton (verify path)
- `e2e/plan.spec.ts` - New tests for all features
- `e2e/helpers/plan-helpers.ts` - May need updates for new testid selectors

## Dependencies
- No new npm packages required
- Uses existing: `@qwikest/icons/heroicons` (HiCheckCircleSolid for confirmation)

## Risks & Mitigations
- **Risk**: Slide animation with dual-DOM approach increases memory usage slightly
  - **Mitigation**: Minimal impact, both views would be in memory briefly anyway
- **Risk**: Timeout race conditions in double-click confirmation
  - **Mitigation**: Use `clearTimeout` on component cleanup and before setting new timeout
- **Risk**: Breaking existing functionality during refactor
  - **Mitigation**: Comprehensive E2E tests, run full suite before/after

## Timeline Estimate
- Feature 1 (Slide animation): 2-3 hours
- Feature 2 (Double-click): 2-3 hours
- Feature 3 (Admin button): 1 hour
- Feature 4 (Fade-in): 1 hour
- Testing: 2-3 hours
- **Total**: 8-10 hours
