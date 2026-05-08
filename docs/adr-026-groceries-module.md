# ADR-026: Groceries Module (First Iteration)

## Status
Draft

## Context
The app needs a Groceries module to replace the existing placeholder Shopping module. It must support two workflows: (1) planning what to buy (a single CRUD list of items), and (2) shopping with the ability to mark items as bought. The module should appear in the main navigation under "Groceries" (renamed from the current "Shopping" label) and have a sub-navigation with "Planning" and "Shopping" tabs.

## Decision

### 1. Rename & Route Restructure
- Rename top nav tab from "Shopping" to "Groceries"
- Move route from `/shopping` to `/groceries`
- Route structure:
  - `/groceries` → server-side redirect to `/groceries/planning`
  - `/groceries/planning` → Planning page (item CRUD)
  - `/groceries/shopping` → Shopping page (bought toggle)
  - No admin page in this iteration

### 2. Sub-Navigation
A `GroceriesSubNav` component using the existing `SubNav` shared component with two tabs:
- "Planning" → `/groceries/planning`
- "Shopping" → `/groceries/shopping`

Rendered in `/groceries/layout.tsx` (parallel to Parcels layout pattern).

### 3. Database Schema
New migration `021_groceries.sql`:

```sql
CREATE TABLE IF NOT EXISTS groceries_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  urgent INTEGER NOT NULL DEFAULT 0,
  bought INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
```

No seed data.

### 4. Data Access Layer
File: `src/db/groceries.ts`

Interfaces:
```typescript
export interface GroceryItem {
  id: number;
  name: string;
  description: string | null;
  urgent: boolean;
  bought: boolean;
  created_at: number;
}
```

Functions (all accept optional `db` parameter for test injection):
- `getGroceryItems(db?)`: returns `GroceryItem[]` ordered by `id`
- `getGroceryItemById(id: number, db?)`: returns `GroceryItem | undefined`
- `createGroceryItem(name: string, description: string | null, urgent: boolean, db?)`: returns new item ID
- `updateGroceryItem(id: number, name: string, description: string | null, urgent: boolean, db?)`: returns boolean
- `setGroceryItemBought(id: number, bought: boolean, db?)`: returns boolean
- `deleteGroceryItem(id: number, db?)`: returns boolean
- `deleteAllGroceryItems(db?)`: returns number of deleted items

### 5. API Endpoints
- `GET /api/groceries` → returns `GroceryItem[]` JSON
- `POST /api/groceries` → creates item (body: `{ name, description?, urgent? }`)
- `PATCH /api/groceries/:id` → updates item fields (body: `{ name?, description?, urgent?, bought? }`)
- `DELETE /api/groceries/:id` → deletes item
- `DELETE /api/groceries` → deletes all items

### 6. UI Components

#### GroceriesSubNav (`src/components/groceries/GroceriesSubNav.tsx`)
Renders `SubNav` with `[{ label: "Planning", path: "/groceries/planning" }, { label: "Shopping", path: "/groceries/shopping" }]`.

#### Planning Page (`/groceries/planning`)
Component: `PlanningList` in `src/components/groceries/PlanningList.tsx`
- Fetches all items via `GET /api/groceries`
- Displays items in a simple list
- Clicking an item shows Edit/Delete buttons (single active item at a time, matching Plan module behavior)
- "Add new" button opens a form (slides in, replacing the list view, matching PlanAccordionList pattern)
- Form has fields: Name (required), Description (optional), Urgent (checkbox)
- Form buttons: Cancel, Save (when adding: also Next)
- Edit button on selected item opens the same form pre-filled
- "Remove all" double-confirm button to delete all items
- Delete (single item) uses double-confirm pattern

#### Shopping Page (`/groceries/shopping`)
Component: `ShoppingList` in `src/components/groceries/ShoppingList.tsx`
- Fetches all items via `GET /api/groceries`
- Displays items in a simple list
- Clicking an item toggles `bought` status via `PATCH /api/groceries/:id`
- Bought items display with `line-through` text decoration
- Clicking a bought item removes the bought status (untoggle)
- No edit/delete/add functionality (read-only except for toggling)

#### GroceryItemRow (`src/components/groceries/GroceryItemRow.tsx`)
Reused from PlanItemRow pattern. Shows name, description (if present), urgent styling (red bold). Used in Planning page.

#### GroceryForm (`src/components/groceries/GroceryForm.tsx`)
Reused from PlanForm pattern. Fields: Name, Description, Urgent checkbox. Buttons: Cancel, Save, (Next in add mode). Used in Planning page.

### 7. Testing

#### DB Unit Tests (`src/db/groceries.test.ts`)
- `getGroceryItems` returns all items ordered by id
- `createGroceryItem` inserts a new item
- `getGroceryItemById` returns item by id
- `updateGroceryItem` updates item fields
- `setGroceryItemBought` toggles bought status
- `deleteGroceryItem` removes an item
- `deleteAllGroceryItems` removes all items

#### E2E Tests (`e2e/groceries.spec.ts`)
- Top nav shows "Groceries" tab (not "Shopping")
- `/groceries` redirects to `/groceries/planning`
- Planning page shows empty state ("No items yet")
- Adding an item via form works and displays it
- Clicking an item shows edit/delete buttons
- Editing an item updates its name/description/urgent
- Deleting an item removes it
- "Remove all" deletes all items
- Shopping tab shows all items from planning
- Clicking an item in shopping toggles bought (strikethrough)
- Clicking a bought item removes strikethrough
- Bought status persists on page refresh
- Sub-navigation tabs are visible and switch views

## Acceptance Criteria
- [ ] Top nav "Shopping" tab renamed to "Groceries" pointing to `/groceries`
- [ ] `/groceries` redirects to `/groceries/planning`
- [ ] Sub-navigation with Planning and Shopping tabs visible on all Groceries pages
- [ ] Planning page shows all items in a flat list
- [ ] Planning page allows adding items with name, description, urgent
- [ ] Planning page allows editing items
- [ ] Planning page allows deleting items individually and all at once
- [ ] Planning page shows "No items yet" when empty
- [ ] Shopping page shows all items (same as planning)
- [ ] Clicking an item in Shopping toggles bought status
- [ ] Bought items show with strikethrough
- [ ] Bought status persists across page refresh
- [ ] DB migration 021_groceries.sql creates `groceries_items` table
- [ ] DB unit tests pass (`pnpm test.db`)
- [ ] E2E tests pass (`pnpm e2e`)

## Consequences
- New module "Groceries" replaces the placeholder "Shopping" in navigation
- No coupling to Plan module (independent data store)
- Shopping page is read-only except for bought toggling — intentional constraint for first iteration
- No auto-cleanup of bought items (deferred to future iteration)
- Follows same subnav + layout pattern as Parcels module
- Form slide-in pattern matches Plan module's accordion UX
