# ADR-015: Plan Module Accordion UX

## Status
Ready

## Summary
Transform Plan module from multi-page navigation (lists → list items) to a single-page accordion UX where clicking a list expands it inline with smooth height animations. Form slide-in behavior is preserved for adding/editing items within the expanded list view.

## Problem Description
1. **Navigation friction**: Users must navigate to a new page to view list items (`/plan/lists` → `/plan/[listId]`), then use back button to return.
2. **Context switching**: Moving between lists requires multiple page transitions, breaking the fluid workflow.
3. **No visual continuity**: Users lose sight of all lists when viewing a specific list's items.
4. **Routing overhead**: Each list view requires a full page load and API call, even if the user just wants to quickly check or add an item.

## Proposed Solution

### Overview
Convert the Plan module to a single-view accordion interface:
- **PlanLists.tsx** becomes the single view containing all lists
- Each list can be expanded/collapsed with smooth height animation
- Only one list expanded at a time (accordion behavior)
- Items are lazy-loaded when a list expands and cached until the user navigates away
- The slide-in form animation (already implemented) is preserved for add/edit, but only replaces the items section (not the list header)

### 1. Accordion State Management

**State signals in PlanLists.tsx:**
```typescript
const lists = useSignal<PlanList[]>([]);
const expandedListId = useSignal<number | null>(null);
const listItemsCache = useSignal<Map<number, { list: PlanList; items: PlanItem[] }>>(new Map());
const loadingListId = useSignal<number | null>(null);
```

**Behavior:**
- Click a collapsed list → set `expandedListId` to that list's ID, lazy load items
- Click an expanded list → set `expandedListId` to `null` (collapse)
- Click a different list → collapse current, expand new (single accordion)
- Cache loaded items in `listItemsCache` (Map<listId, {list, items}>)
- Clear cache on component cleanup (when user navigates away from /plan/lists)

### 2. Expand/Collapse Animation

**CSS approach using max-height transition (implementer may use grid approach if preferred):**
- Use `max-height` with CSS transition for smooth height animation
- Collapsed: `max-height: 0; overflow: hidden;`
- Expanded: `max-height: 1000px;` (or a sufficiently large value) with transition
- Duration: 300ms to match existing form slide animation

**Implementation:**
```tsx
<div
  class={`overflow-hidden transition-[max-height] duration-300 ease-in-out ${
    expandedListId.value === list.id ? "max-h-[1000px]" : "max-h-0"
  }`}
>
  <div class="p-4">
    {/* Items list and Add button */}
  </div>
</div>
```

### 3. Items Section Structure (When List is Expanded)

**Layout when list is expanded:**
```
┌─────────────────────────────────┐
│ List Title (clickable header)   │  ← Always visible, clickable to collapse
├─────────────────────────────────┤
│ [Items Section]                 │  ← Animated expand/collapse
│ - Item 1                        │
│ - Item 2                        │
│ ...                             │
│ [Add new] button                │  ← Inside items section
├─────────────────────────────────┤
│ [Form - slides in from right]   │  ← Replaces items section when active
└─────────────────────────────────┘
```

**Form behavior:**
- "Add new" or "Edit" clicked → form slides in from right
- Form replaces ONLY the items section (list header remains visible)
- "Save" or "Cancel" → form slides out, items section returns
- This reuses the existing slide-in pattern from ADR-014

**Key adjustment to existing form logic:**
- Form container should be inside the expanded list, not at the root level
- `formMode` and related signals managed within PlanLists.tsx (no component extraction for simplicity)

### 4. Lazy Loading with Cache

**Load function:**
```typescript
const loadListItems = $(async (listId: number) => {
  // Check cache first
  if (listItemsCache.value.has(listId)) {
    return listItemsCache.value.get(listId)!;
  }

  loadingListId.value = listId;
  try {
    const response = await fetch(`/api/plan/lists/${listId}`);
    if (response.ok) {
      const data = await response.json();
      const newCache = new Map(listItemsCache.value);
      newCache.set(listId, { list: data.list, items: data.items });
      listItemsCache.value = newCache;
    }
  } catch (e) {
    console.error("Failed to load list items:", e);
  } finally {
    loadingListId.value = null;
  }
});
```

**Cache invalidation:**
- Clear cache when item is added/edited/deleted (refresh that list's items)
- Clear all cache on component cleanup (user navigates away)

### 5. Component Structure

**New/Modified files:**

**PlanLists.tsx (major refactor):**
- Contains all state (lists, expandedListId, cache, form state)
- Renders list of lists with clickable headers
- Each list header click toggles expansion
- Expanded list renders items + add button (or form if active) inline (no component extraction for simplicity)
- Loading state per list (show spinner in items section while loading)
- All expanded list logic kept in PlanLists.tsx for simplicity

**Remove:**
- `/src/routes/plan/[listId]/` directory (route no longer needed)
- `/src/components/plan/PlanListItems.tsx` (functionality moved into PlanLists.tsx)

### 6. Route Changes

**Keep:**
- `/plan/lists` (or just `/plan` - check redirect) - Main accordion view

**Remove:**
- `/plan/[listId]` route and component

**Redirect:**
- If `/plan/[listId]` is accessed directly, redirect to `/plan/lists` (or show a message that the list should be accessed from the lists page)

## Decision Log

1. **Single vs multiple expanded**: Single accordion (only one list expanded at a time) per user requirement.
2. **Form animation scope**: Form replaces only items section, not list header - preserves context.
3. **Cache strategy**: Cache until navigate away (not persisted across sessions). Simple Map in signal.
4. **Animation technique**: `max-height` transition (simpler than grid approach, widely supported).
5. **Component extraction**: Keep all expanded list logic in PlanLists.tsx (no extraction) for simplicity.
6. **"Add new" button placement**: Inside items section (not header) per user requirement.
7. **Loading spinner**: Show spinner in items section while lazy-loading items for a list.
8. **Direct URL access**: Not needed - old `/plan/[listId]` URLs won't be bookmarked; just redirect to `/plan/lists`.

## Acceptance Criteria

### Feature 1: Accordion Expansion
- [ ] Clicking a list header expands it with smooth height animation (300ms)
- [ ] Clicking an expanded list header collapses it with smooth height animation
- [ ] Only one list can be expanded at a time (clicking another collapses the current)
- [ ] Animation uses `max-height` or `grid-template-rows` CSS transition
- [ ] List header remains visible and clickable when expanded

### Feature 2: Lazy Loading with Cache
- [ ] Items are loaded via API only when a list is expanded (not on page load)
- [ ] Loaded items are cached in a Map keyed by list ID
- [ ] Clicking an already-expanded list (with cached data) shows instantly (no reload)
- [ ] Cache is cleared when user navigates away from /plan/lists
- [ ] Loading spinner shows in items section while fetching

### Feature 3: Items Display
- [ ] Expanded list shows items in a list (reuse existing item rendering)
- [ ] Clicking an item shows action buttons (amount +/-, edit, delete)
- [ ] Double-click confirmation for delete works (from ADR-014)
- [ ] "Remove all" button with double-click confirmation works (from ADR-014)
- [ ] Empty state shows "No items yet" when list has no items
- [ ] Loading spinner shows in items section while fetching items

### Feature 4: Form Slide-in (Add/Edit)
- [ ] "Add new" button is inside the items section (below items list)
- [ ] Clicking "Add new" slides form in from right, replacing items section only
- [ ] Clicking "Edit" on an item slides form in with pre-filled data
- [ ] List header remains visible during form slide-in
- [ ] "Save" slides form out, returns to items section
- [ ] "Cancel" slides form out, returns to items section
- [ ] Form animation reuses existing translateX pattern from ADR-014

### Feature 5: Routing Removal
- [ ] `/plan/[listId]` route is removed
- [ ] Attempting to access `/plan/[listId]` redirects to `/plan/lists`
- [ ] All navigation happens on `/plan/lists` (or `/plan`)
- [ ] No back button needed (removed from UI)

### Feature 6: Fade-in Animation
- [ ] List of lists fades in on page load (existing behavior from ADR-014)
- [ ] Each expanded list's items fade in on load (using `starting:opacity-0`)

## Tests to be Added

### E2E Tests (Playwright - `e2e/plan.spec.ts`)

**Accordion Behavior:**
```typescript
test("clicking a list expands it with animation", async ({ page }) => {
  const list = await createTestList("Test List");
  await createTestItem(list.id, { name: "Test Item" });

  await page.goto("/plan/lists");
  await page.waitForSelector('[data-testid="plan-lists"]');

  // Click list to expand
  await page.getByText("Test List").click();

  // Items section should become visible with animation
  await expect(page.getByText("Test Item")).toBeVisible();
  await expect(page.getByText("No items yet")).not.toBeVisible();
});

test("clicking expanded list collapses it", async ({ page }) => {
  const list = await createTestList("Test List");
  await createTestItem(list.id, { name: "Test Item" });

  await page.goto("/plan/lists");
  await page.waitForSelector('[data-testid="plan-lists"]');

  // Expand
  await page.getByText("Test List").click();
  await expect(page.getByText("Test Item")).toBeVisible();

  // Collapse
  await page.getByText("Test List").click();
  // Items should be hidden (wait for animation)
  await page.waitForTimeout(350); // Wait for 300ms animation + buffer
  await expect(page.getByText("Test Item")).not.toBeVisible();
});

test("only one list expanded at a time", async ({ page }) => {
  const list1 = await createTestList("List 1");
  const list2 = await createTestList("List 2");
  await createTestItem(list1.id, { name: "Item 1" });
  await createTestItem(list2.id, { name: "Item 2" });

  await page.goto("/plan/lists");
  await page.waitForSelector('[data-testid="plan-lists"]');

  // Expand list 1
  await page.getByText("List 1").click();
  await expect(page.getByText("Item 1")).toBeVisible();

  // Expand list 2
  await page.getByText("List 2").click();
  // List 1 should collapse, List 2 should expand
  await page.waitForTimeout(350);
  await expect(page.getByText("Item 1")).not.toBeVisible();
  await expect(page.getByText("Item 2")).toBeVisible();
});

test("items are lazy loaded on expand", async ({ page }) => {
  const list = await createTestList("Test List");
  await createTestItem(list.id, { name: "Lazy Item" });

  await page.goto("/plan/lists");
  await page.waitForSelector('[data-testid="plan-lists"]');

  // Items should not be loaded yet (check no API call for items)
  // This is tricky to test in E2E without mocking - could check for loading state

  // Expand list
  await page.getByText("Test List").click();

  // Should show loading or items
  await expect(page.getByText("Lazy Item")).toBeVisible({ timeout: 5000 });
});

test("cached items show instantly on re-expand", async ({ page }) => {
  const list = await createTestList("Test List");
  await createTestItem(list.id, { name: "Cached Item" });

  await page.goto("/plan/lists");
  await page.waitForSelector('[data-testid="plan-lists"]');

  // Expand list (loads items)
  await page.getByText("Test List").click();
  await expect(page.getByText("Cached Item")).toBeVisible();

  // Collapse
  await page.getByText("Test List").click();
  await page.waitForTimeout(350);

  // Re-expand (should use cache, no loading)
  await page.getByText("Test List").click();
  // Items should appear immediately (no loading state)
  await expect(page.getByText("Cached Item")).toBeVisible();
});

test("add item button is inside items section", async ({ page }) => {
  const list = await createTestList("Test List");

  await page.goto("/plan/lists");
  await page.waitForSelector('[data-testid="plan-lists"]');

  // Expand list
  await page.getByText("Test List").click();

  // "Add new" button should be visible in items section
  await expect(page.getByRole("button", { name: "Add new" })).toBeVisible();
});

test("form slides in replacing only items section", async ({ page }) => {
  const list = await createTestList("Test List");

  await page.goto("/plan/lists");
  await page.waitForSelector('[data-testid="plan-lists"]');

  // Expand list
  await page.getByText("Test List").click();

  // Click Add new
  await page.getByRole("button", { name: "Add new" }).click();

  // Form should be visible
  await page.waitForSelector('[data-testid="edit-form-add"]');

  // List header should still be visible (not replaced by form)
  await expect(page.getByRole("heading", { name: "Test List" })).toBeVisible();
});

test("form cancel returns to items section", async ({ page }) => {
  const list = await createTestList("Test List");

  await page.goto("/plan/lists");
  await page.waitForSelector('[data-testid="plan-lists"]');

  // Expand list
  await page.getByText("Test List").click();

  // Click Add new, then Cancel
  await page.getByRole("button", { name: "Add new" }).click();
  await page.waitForSelector('[data-testid="edit-form-add"]');
  await page.getByRole("button", { name: "Cancel" }).click();

  // Items section should return
  await page.waitForSelector('[data-testid="plan-items-container"] > div.translate-x-0');
  await expect(page.getByRole("button", { name: "Add new" })).toBeVisible();
});

test("removed route redirects to lists", async ({ page }) => {
  const list = await createTestList("Test List");

  // Try to access old route
  await page.goto(`/plan/${list.id}`);

  // Should redirect to /plan/lists
  await expect(page).toHaveURL(/\/plan\/lists\/?$/);
});
```

**Update existing tests:**
- Remove tests that check navigation to `/plan/[listId]`
- Update "item interaction" tests to work within accordion (expand list first)
- Update form tests to work within expanded list

### DB Tests
No DB tests needed (UI-only changes).

## Affected Files

### Deleted Files
- `src/routes/plan/[listId]/index.tsx` - Route removed
- `src/routes/plan/[listId]/` directory - Entire directory removed

### Modified Files
- `src/components/plan/PlanLists.tsx` - Major refactor: add accordion logic, lazy loading, form integration
- `src/routes/plan/lists/index.tsx` - May need updates if it passes props
- `e2e/plan.spec.ts` - Major update: remove navigation tests, add accordion tests
- `e2e/helpers/plan-helpers.ts` - May need updates for new selectors

### New Files
- None (all logic kept in PlanLists.tsx for simplicity)

## Dependencies
- No new npm packages required
- Uses existing: `@qwikest/icons/heroicons` for icons
- Uses existing: Qwik signals and visible tasks

## Risks & Mitigations

- **Risk**: Accordion animation with dynamic content height
  - **Mitigation**: Use `max-height: 1000px` (or larger) for expanded state; content won't exceed this in practice. Alternative: measure content height with JS (more complex).

- **Risk**: Cache invalidation complexity
  - **Mitigation**: Simple approach - clear cache for a list when items are modified (add/edit/delete). Clear all on navigate away.

- **Risk**: Form state management with multiple lists
  - **Mitigation**: Keep form state local to each expanded list (or reset on collapse). Don't share form state across lists.

- **Risk**: Breaking existing double-click confirmation
  - **Mitigation**: Reuse existing logic from ADR-014; ensure timers are cleaned up on collapse.

- **Risk**: E2E test fragility with animations
  - **Mitigation**: Use `waitForTimeout` with buffer after animations; use `data-testid` selectors consistently.

## Timeline Estimate
- Accordion expansion with animation: 3-4 hours
- Lazy loading with cache: 2-3 hours
- Form integration (slide-in within expanded list): 2-3 hours
- Route removal + redirect: 1 hour
- Update E2E tests: 3-4 hours
- **Total**: 11-15 hours
