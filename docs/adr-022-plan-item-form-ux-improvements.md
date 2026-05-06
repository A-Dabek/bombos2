# ADR-016: Plan Module Item Form UX Improvements

## Status
Proposed

## Context
The Plan module's item form has several UX friction points:
1. Users must manually click the name input when adding items (no autofocus)
2. The amount field and controls (+, -, x{amount} badge) add visual clutter without clear value
3. No way to mark items as urgent/priority
4. Adding multiple items requires reopening the form each time after saving

## Decision

### 1. Autofocus on Name Input
Add `autofocus` attribute to the name input field in `PlanForm.tsx`. This will work in both add and edit modes (simplest approach per user approval).

### 2. Remove Amount Field Completely
Remove all amount-related functionality from the Plan module:
- **Database**: Create migration `010_add_urgent_remove_amount.sql` to:
  - Add `urgent INTEGER NOT NULL DEFAULT 0` column to `plan_items` table
  - Drop `amount` column from `plan_items` table
- **UI Form**: Remove amount input from `PlanForm.tsx`
- **UI Items**: Remove +/- buttons from `PlanItemRow.tsx`, remove `x{amount}` badge
- **Types**: Update `PlanItem` interface to remove `amount: number` and add `urgent: boolean`
- **API**: Remove amount validation from POST/PATCH endpoints

### 3. Add "Urgent" Property
Add urgent checkbox to items:
- **UI Form**: Add checkbox labeled "Urgent" below the name input, right-aligned in `PlanForm.tsx`
- **UI Display**: Urgent items display with red bold text (`text-red-600 font-bold`) in `PlanItemRow.tsx`
- **Database**: Boolean column as `INTEGER DEFAULT 0` (SQLite convention)

### 4. Button Layout Changes
Restructure form buttons in `PlanForm.tsx`:
- **Button Order**: Cancel (left), Save (middle), Next (right)
- **"Next" Button Behavior** (only visible in add mode):
  - Saves the current item via API
  - Clears all form fields (name, description, urgent checkbox) to original state
  - Refocuses name input for immediate next entry
  - Does NOT close the form
- **"Save" Button**: Saves and closes form (existing behavior, order changed)
- **"Cancel" Button**: Closes form (existing behavior, order changed)

### 5. Implementation Details

#### Files to Modify:
1. **`src/db/migrations/010_add_urgent_remove_amount.sql`** (new file)
   - Add urgent column, drop amount column
   - Note: SQLite doesn't support DROP COLUMN in older versions; may need to recreate table

2. **`src/db/plan.ts`**
   - Update `PlanItem` interface: remove `amount`, add `urgent: boolean`
   - Update `createPlanItem()` to accept `urgent` parameter
   - Update `updatePlanItem()` to accept `urgent` parameter
   - Update SQL queries to use `urgent` instead of `amount`

3. **`src/db/plan.test.ts`**
   - Remove all amount-related test assertions
   - Add tests for `urgent` field in create/update operations
   - Update existing tests to match new schema

4. **`src/components/plan/PlanForm.tsx`**
   - Remove amount input field (lines 55-66)
   - Add urgent checkbox below name input (right-aligned)
   - Change button layout to Cancel, Save, Next
   - Add "Next" button logic (save + clear form + refocus)
   - Add `autofocus` to name input
   - Update `onSave$` callback signature to remove amount parameter

5. **`src/components/plan/PlanItemRow.tsx`**
   - Remove +/- amount buttons (lines 46-62)
   - Remove `x{amount}` badge (lines 36-38)
   - Add conditional red bold styling for urgent items
   - Remove `onAmountChange$` prop

6. **`src/components/plan/PlanAccordionList.tsx`**
   - Remove `onAmountChange$` prop
   - Remove `initialAmount` prop passed to `PlanForm`
   - Update `onSave$` callback signature

7. **`src/components/plan/PlanLists.tsx`**
   - Remove `handleAmountChange` function
   - Remove `onAmountChange$` from `PlanAccordionList` props
   - Update `handleSave` to remove amount parameter
   - Add `handleNext` function for Next button behavior (save + refresh + clear form)

8. **`src/routes/api/plan/lists/[listId]/index.ts`**
   - Remove amount from POST body parsing and validation
   - Pass `urgent` to `createPlanItem()`

9. **`src/routes/api/plan/items/[id]/index.ts`**
   - Remove amount from PATCH body parsing and validation
   - Pass `urgent` to `updatePlanItem()`

10. **`e2e/plan.spec.ts`**
    - Remove all amount-related assertions (x2, x3, amount input, +/- buttons)
    - Add test for autofocus on name input
    - Add test for urgent checkbox in form
    - Add test for red bold urgent items in list
    - Add test for "Next" button behavior (save + clear + refocus)
    - Add test for button order (Cancel, Save, Next)

## Consequences

### Positive:
- Cleaner, simpler item form with fewer fields
- Ability to prioritize urgent items with visual distinction
- Faster workflow for adding multiple items (Next button)
- Reduced cognitive load (no amount tracking)

### Negative:
- Breaking change: Existing items lose amount data (user approved removal)
- Migration complexity: SQLite may require table recreation to drop column
- Form state management: Need to handle Next button's save + clear + refocus

### Neutral:
- Database schema change requires migration
- All existing tests need updates to remove amount references

## Acceptance Criteria
- [ ] Name input is autofocused when `PlanForm` opens (add/edit modes)
- [ ] Amount input removed from `PlanForm`
- [ ] +/- amount buttons removed from `PlanItemRow`
- [ ] `x{amount}` badge removed from `PlanItemRow`
- [ ] Urgent checkbox present in `PlanForm` below name input, right-aligned
- [ ] `urgent` column added to `plan_items`, `amount` column removed (migration 010)
- [ ] Urgent items display with red bold text (`text-red-600 font-bold`) in `PlanItemRow`
- [ ] `PlanForm` buttons ordered: Cancel, Save, Next (Next only visible in add mode)
- [ ] "Next" saves item, clears all form fields, refocuses name input
- [ ] "Next" button only visible when `mode === "add"`
- [ ] All existing tests updated to remove amount references
- [ ] New DB tests for `urgent` field (create, update, default value)
- [ ] New E2E tests for autofocus, urgent display, Next button behavior
- [ ] TypeScript check passes (`pnpm build.types`)
- [ ] Production build passes (`pnpm build`)
- [ ] All E2E tests pass (`pnpm e2e`)
- [ ] All DB tests pass (`pnpm test.db`)

## Tests to Add

### DB Unit Tests (`src/db/plan.test.ts`):
```typescript
test("createPlanItem accepts urgent parameter", () => {
  // Test creating item with urgent: true
  // Verify urgent field is saved correctly
});

test("updatePlanItem can update urgent status", () => {
  // Test updating item to urgent: true
  // Test updating item back to urgent: false
});

test("getPlanItems returns urgent field", () => {
  // Verify urgent field is included in returned items
});

test("migration adds urgent column and removes amount", () => {
  // Test that plan_items table has urgent column
  // Test that plan_items table does NOT have amount column
});
```

### E2E Tests (`e2e/plan.spec.ts`):
```typescript
test("Name input is autofocused when add form opens", () => {
  // Open add form
  // Verify name input has focus
});

test("Urgent checkbox is present in add/edit form", () => {
  // Open add form, verify checkbox exists
  // Open edit form, verify checkbox exists and reflects item state
});

test("Urgent items display with red bold text", () => {
  // Create urgent item
  // Verify item name has text-red-600 and font-bold classes
});

test("Next button saves item, clears form, and refocuses name", () => {
  // Click Next after entering item
  // Verify item appears in list
  // Verify form is cleared
  // Verify name input has focus
});

test("Amount elements are removed from UI", () => {
  // Verify no amount input in form
  // Verify no +/- buttons on items
  // Verify no x{amount} badges
});
```

## Questions Resolved
1. **Urgent display**: Red bold text (`text-red-600 font-bold`) - user confirmed
2. **Next button form reset**: Clear ALL fields, refocus name - user confirmed
3. **Database changes**: Remove amount, add urgent - user confirmed
4. **Amount removal scope**: Remove from form, item row, database - user confirmed all
5. **Autofocus scope**: Both add and edit modes (simplest approach) - user approved

## Discussion Points (Resolved per recommendations)
1. **"Next" in edit mode**: Hidden in edit mode (only for adding new items) - recommended and implied by user's "add list items" context
2. **Urgent checkbox label**: Simple "Urgent" label - proposed and no objection
3. **Sorting urgent items**: No sorting (not requested by user) - proposed and no objection
