# Requirements

### Overview & Goals
Extend the groceries module to support `amount` and `unit` for each item. This allows users to track how much of each item they need to buy.

### Scope
- **In Scope**:
    - Database schema changes to add `amount` and `unit`.
    - UI updates in Planning and Shopping lists.
    - +/- buttons for quick amount adjustment in the Planning list.
    - Enhanced form for adding/editing items.
- **Out of Scope**:
    - Automatic unit conversion.
    - Shopping history based on amounts.

### User Stories
- As a user, I want to specify the amount and unit for a grocery item so that I know exactly how much to buy.
- As a user, I want to quickly increase or decrease the amount of an item without opening the edit form.
- As a user, I want to see the amount and unit on both my planning and shopping lists.

### Functional Requirements
- `amount`:
    - Numeric value with 2 decimal places precision.
    - Default: 1.00.
    - Input in form should show 1 as a placeholder if not set.
- `unit`:
    - Options: 'x', 'g', 'kg', 'l'.
    - Default: 'x'.
- UI:
    - Planning list: Item shows amount and unit. When active (expanded), "+" and "-" buttons are available.
    - Shopping list: Item shows amount and unit.
    - Form: New fields for amount and unit. Amount field defaults to placeholder "1".


# Technical Design

### Current Implementation
- `groceries_items` table has `id`, `name`, `description`, `urgent`, `bought`, `created_at`.
- `GroceryItem` interface reflects this.
- `PlanningList` uses `GroceryItemRow` for display and actions.
- `ShoppingList` handles its own rendering and toggling `bought` status.

### Key Decisions
- **Data Type for Amount**: Use `REAL` in SQLite to support decimal values.
- **Placeholder Behavior**: In `GroceryForm`, the amount signal will be null by default. The input will have `placeholder="1"`. On save, if null, it defaults to 1.0.
- **Button Placement**: "+" and "-" buttons will be added to the active state actions in `GroceryItemRow` (Planning list only, only when expanded).
- **Update Logic**: "+" and "-" buttons will call `PATCH /api/groceries/[id]` with the updated amount.
- **Increment Step**: Buttons will increment/decrement by exactly 1.00.
- **Shopping list buttons**: No, only add them to the Planning list.

### Proposed Changes
#### Database
New migration `023_add_groceries_amount_unit.sql`:
```sql
ALTER TABLE groceries_items ADD COLUMN amount REAL NOT NULL DEFAULT 1.0;
ALTER TABLE groceries_items ADD COLUMN unit TEXT NOT NULL DEFAULT 'x';
```

#### Models
Update `GroceryItem` in `src/db/groceries.ts`:
```typescript
export interface GroceryItem {
  // ...
  amount: number;
  unit: string;
}
```

#### API
- `POST /api/groceries`: Accept `amount` and `unit`.
- `PATCH /api/groceries/[id]`: Accept `amount` and `unit`.

#### Components
- **GroceryForm**:
    - Add `amount` (type="number", step="0.01", placeholder="1").
    - Add `unit` (select dropdown with options: x, g, kg, l).
- **GroceryItemRow**:
    - Display `{amount} {unit}` next to name.
    - Add "+" and "-" buttons in the `isActive` section.
- **ShoppingList**:
    - Display `{amount} {unit}` next to name.

### File Structure
- `docs/adr-029-groceries-amount-unit.md` (New)
- `src/db/migrations/023_add_groceries_amount_unit.sql` (New)
- `src/db/groceries.ts` (Modified)
- `src/routes/api/groceries/index.ts` (Modified)
- `src/routes/api/groceries/[id]/index.ts` (Modified)
- `src/components/groceries/GroceryForm.tsx` (Modified)
- `src/components/groceries/GroceryItemRow.tsx` (Modified)
- `src/components/groceries/ShoppingList.tsx` (Modified)


# Testing

### Validation Approach
- Verify database migration applies correctly.
- Verify amount and unit are saved and retrieved correctly via API.
- Verify placeholder behavior in `GroceryForm`.
- Verify "+" and "-" buttons update the amount correctly in the Planning list.
- Verify display in both lists.

### Key Scenarios
1. **Add item with default amount**:
    - Open "Add item" form.
    - Enter name "Milk".
    - Leave amount empty (placeholder 1 visible).
    - Save.
    - Item should show "1 x Milk".
2. **Add item with decimal amount and unit**:
    - Open "Add item" form.
    - Enter "Apples", amount "1.5", unit "kg".
    - Save.
    - Item should show "1.5 kg Apples".
3. **Use +/- buttons**:
    - Click on an item to expand it.
    - Click "+". Amount should increase by 1.
    - Click "-". Amount should decrease by 1.
4. **Check Shopping list**:
    - Go to Shopping list.
    - Verify items show their respective amounts and units.


# Delivery Steps

###   Step 1: Create ADR-029 for groceries amount and unit
ADR-029 documents the architecture and design for the groceries extension.
- Create `docs/adr-029-groceries-amount-unit.md`.
- Detail the new schema, UI changes, and functional requirements.

###   Step 2: Add database migration
The database schema is updated with `amount` and `unit` columns.
- Create `src/db/migrations/023_add_groceries_amount_unit.sql`.
- Add `amount` (REAL, default 1.0) and `unit` (TEXT, default 'x') to `groceries_items`.

###   Step 3: Update database functions and interface
The database access layer supports the new amount and unit fields.
- Update `GroceryItem` interface in `src/db/groceries.ts`.
- Update CRUD functions in `src/db/groceries.ts` to handle `amount` and `unit`.
- Implement `updateGroceryItemAmount` helper for +/- adjustments.

###   Step 4: Update API handlers
API endpoints correctly process and return amount and unit data.
- Modify `onPost` in `src/routes/api/groceries/index.ts` to accept new fields.
- Modify `onPatch` in `src/routes/api/groceries/[id]/index.ts` to support updates to amount and unit.

###   Step 5: Enhance GroceryForm with amount and unit
The grocery form allows users to specify amount and unit with appropriate defaults and placeholders.
- Add input fields for `amount` and `unit` to `GroceryForm.tsx`.
- Implement placeholder logic for `amount` so "1" is used if left empty.

###   Step 6: Update UI components for lists
Both planning and shopping lists display the amount/unit, and the planning list enables quick amount adjustments.
- Update `GroceryItemRow.tsx` to display amount and unit, and add +/- buttons.
- Update `ShoppingList.tsx` to display amount and unit next to the item name.
- Connect UI buttons to API calls for immediate amount updates.
