# ADR-012: Plan Module

## Status
Draft

## Context
The bombos2 app needs a new "Plan" module to allow users to define lists of items for planning groceries and other activities. The module should appear in the main navigation between "Meals" and "Money". It needs to support multiple lists (each with a title and display order) containing items (each with name, description, and amount). The module requires an admin mode for managing lists and a user-friendly interface for managing items within lists.

## Decision

### 1. Navigation & Routing
- Add "Plan" tab to main navigation in `src/routes/layout.tsx` between Meals and Money using `HiListBulletOutline` icon
- Route structure:
  - `/plan` → redirects to `/plan/lists` (via server-side redirect in `src/routes/plan/index.tsx`)
  - `/plan/lists` → main view showing all lists (rendered by `src/routes/plan/lists/index.tsx`)
  - `/plan/[listId]` → view items in a specific list (rendered by `src/routes/plan/[listId]/index.tsx`)
  - `/plan/admin` → admin mode for managing lists (rendered by `src/routes/plan/admin/index.tsx`)
- No sub-navigation needed (unlike Meals module which has categories)
- Layout file `src/routes/plan/layout.tsx` will render `<Slot />` (no sub-nav)

### 2. Database Schema
Migration `008_plan.sql` creates two tables:

```sql
CREATE TABLE IF NOT EXISTS plan_lists (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS plan_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  list_id INTEGER NOT NULL REFERENCES plan_lists(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  amount INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
```

No seed data (lists are user-created).

### 3. Data Access Layer
File: `src/db/plan.ts`

Functions (all accept optional `db` parameter for test injection):
- `getPlanLists(db?)`: returns `PlanList[]` ordered by `display_order`
- `getPlanListById(id: number, db?)`: returns `PlanList | undefined`
- `createPlanList(title: string, display_order: number, db?)`: returns new list ID
- `updatePlanListOrder(id: number, new_order: number, db?)`: returns boolean
- `deletePlanList(id: number, db?)`: returns boolean (cascade deletes items)
- `getPlanItems(listId: number, db?)`: returns `PlanItem[]`
- `getPlanItemById(id: number, db?)`: returns `PlanItem | undefined`
- `createPlanItem(listId: number, name: string, description: string | null, amount: number, db?)`: returns new item ID
- `updatePlanItem(id: number, name: string, description: string | null, amount: number, db?)`: returns boolean
- `deletePlanItem(id: number, db?)`: returns boolean
- `deleteAllPlanItems(listId: number, db?)`: returns number of deleted items

Interfaces:
```typescript
export interface PlanList {
  id: number;
  title: string;
  display_order: number;
  created_at: number;
}

export interface PlanItem {
  id: number;
  list_id: number;
  name: string;
  description: string | null;
  amount: number;
  created_at: number;
}
```

### 4. API Endpoints
- `GET /api/plan/lists` → returns `PlanList[]` JSON (ordered by display_order)
- `POST /api/plan/lists` → creates new list (body: `{ title: string, display_order: number }`)
- `PATCH /api/plan/lists/[id]/order` → updates list order (body: `{ direction: "up" | "down" }`)
- `DELETE /api/plan/lists/[id]` → deletes list and its items
- `GET /api/plan/lists/[listId]` → returns `{ list: PlanList, items: PlanItem[] }`
- `POST /api/plan/lists/[listId]/items` → creates new item (body: `{ name: string, description?: string, amount?: number }`)
- `PATCH /api/plan/items/[id]` → updates item (body: `{ name?: string, description?: string, amount?: number }`)
- `DELETE /api/plan/items/[id]` → deletes item
- `DELETE /api/plan/lists/[listId]/items` → deletes all items in a list

### 5. UI Components

#### Admin Mode (`/plan/admin`)
Component: `src/components/plan/PlanAdmin.tsx`
- Input field for new list title
- Up/Down buttons for each list to change display_order
- Delete button for each list
- Lists displayed in order of display_order
- "Add List" button to create new list
- Back button to return to `/plan/lists`
- Up button on the first list and down button on the last list still clickable but don't change order (no visual feedback change needed)

#### Main Lists View (`/plan/lists`)
Component: `src/components/plan/PlanLists.tsx`
- Displays all lists ordered by display_order
- Each list is clickable, navigates to `/plan/[listId]`
- Admin toggle button (cog icon) fixed at bottom-right, links to `/plan/admin`
- Shows "No lists yet" message if empty

#### List Items View (`/plan/[listId]`)
Component: `src/components/plan/PlanListItems.tsx`
- Shows list title at top
- Back button to return to `/plan/lists`
- "Add new" button and "Remove all" button below title
- List of items, each showing: name, description (if exists), amount
- **Click behavior**: Clicking an item shows edit/remove/amount buttons next to it (inline). Only one item can have active buttons at a time. Clicking the same item again hides the buttons.
- **Amount buttons**: "+" and "-" buttons to increase/decrease amount by 1 (min 1)
- **Edit button**: Replaces the entire list view with an edit form (visually only, no route change)
- **Remove button**: Immediately deletes the item
- **Add new button**: Replaces the entire list view with an empty form (visually only, no route change)
- **Form fields**: 
  - Name: text input, required, max 100 chars
  - Description: textarea, optional, max 300 chars  
  - Amount: number input, default 1, min 1
- **Form buttons**: "Save" and "Cancel"
- **Remove all button**: Immediately deletes all items in the list

### 6. Testing

#### DB Unit Tests (`src/db/plan.test.ts`)
- `getPlanLists` returns lists in display_order
- `createPlanList` inserts a new list
- `updatePlanListOrder` updates order correctly
- `deletePlanList` removes list and cascades to items
- `getPlanItems` returns items for a list
- `createPlanItem` inserts a new item
- `updatePlanItem` updates item fields
- `deletePlanItem` removes an item
- `deleteAllPlanItems` removes all items from a list

#### E2E Tests (`e2e/plan.spec.ts`)
- `/plan` redirects to `/plan/lists`
- Main lists view displays all lists
- Clicking a list navigates to `/plan/[listId]`
- Admin button is visible on main view
- Admin page navigation works (`/plan/admin`)
- Admin can add a new list
- Admin can reorder lists with up/down buttons
- Admin can delete a list
- List items view shows items correctly
- Clicking an item shows edit/remove/amount buttons
- Clicking the same item again hides the buttons
- Plus/minus buttons change item amount
- Edit button shows form with item data
- Save in edit form updates the item and returns to list
- Cancel in edit form returns to list without saving
- "Add new" button shows empty form
- Save in add form creates item and returns to list
- Cancel in add form returns to list
- Remove button deletes item immediately
- "Remove all" button deletes all items immediately
- Back button returns to lists view

## Acceptance Criteria
- [ ] "Plan" tab appears in main navigation between Meals and Money with `HiListBulletOutline` icon
- [ ] `/plan` redirects to `/plan/lists`
- [ ] Main lists view (`/plan/lists`) shows all lists ordered by display_order
- [ ] Clicking a list navigates to `/plan/[listId]`
- [ ] List items view shows list title, items with name/description/amount
- [ ] Clicking an item shows edit/remove/amount buttons inline
- [ ] Only one item has active buttons at a time
- [ ] Clicking item again hides the buttons
- [ ] Plus/minus buttons adjust amount by 1 (min 1)
- [ ] Edit button shows form pre-filled with item data
- [ ] Save in edit form updates item and returns to list view
- [ ] Cancel in edit form returns to list without saving
- [ ] "Add new" button shows empty form
- [ ] Save in add form creates item and returns to list
- [ ] Cancel in add form returns to list
- [ ] Remove button deletes item immediately
- [ ] "Remove all" deletes all items immediately
- [ ] Admin mode (`/plan/admin`) allows adding new lists with title
- [ ] Admin mode shows up/down buttons for reordering lists
- [ ] Admin mode allows deleting lists
- [ ] Back button in admin returns to `/plan/lists`
- [ ] Back button in list items returns to `/plan/lists`
- [ ] DB migration applies cleanly creating plan_lists and plan_items tables
- [ ] DB unit tests pass (`pnpm test.db`)
- [ ] E2E tests pass (`pnpm e2e`)

## Consequences
- New module added to navigation; no impact on existing Parcels, Meals, Money, or Shopping modules
- Database tables use CASCADE DELETE for referential integrity
- Admin mode is separate from user mode, following Meals module pattern
- Form appears visually without route change, keeping URL structure clean
- No confirmation dialogs for destructive actions (to be improved later)
- Up/down buttons remain clickable at boundaries but don't change order (no error handling needed)
- Mobile-first design; no hover states used

## Points of Discussion
1. **Form replacement approach**: The form replaces the list view visually without a route change. This keeps the URL clean but means the browser back button won't navigate from form to list. User must use Cancel/Save buttons.
2. **No order numbers displayed**: The display_order is internal only, not shown to users. Users interact via up/down buttons only.
3. **Immediate destructive actions**: Both item delete and "remove all" happen immediately without confirmation. This matches the Meals module pattern but may need improvement later.
4. **Single active item**: Only one item can have active edit/remove/amount buttons at a time. This prevents UI clutter on mobile.
5. **No item ordering**: Items within a list don't have a display order field. They're displayed in creation order (by id).
