# ADR-010: Meals Module

## Status
Accepted

## Context
The bombos2 app needs a functional Meals module to help users decide what to eat throughout the day. The existing `/meals` route is a placeholder. The module should provide random meal suggestions per time-of-day category with a simple, delightful UX consistent with the Parcels module.

## Decision

### 1. Routing & Navigation
- `/meals` redirects server-side to `/meals/breakfast` via `src/routes/meals/index.tsx`.
- Sub-routes: `/meals/breakfast`, `/meals/dinner`, `/meals/supper`.
- A shared `MealSubNav.tsx` component, styled identically to `ParcelSubNav.tsx` (flex border-bottom tabs with `border-blue-500` / `text-blue-600` active state), is rendered in `src/routes/meals/layout.tsx` above `<Slot />`.

### 2. Database
- Migration `005_meals.sql` creates:
  ```sql
  CREATE TABLE IF NOT EXISTS meals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL CHECK(category IN ('breakfast', 'dinner', 'supper')),
    name TEXT NOT NULL
  );
  ```
- The migration also seeds 9 example meals (3 per category):
  - **Breakfast**: "Scrambled Eggs", "Oatmeal with Berries", "Avocado Toast"
  - **Dinner**: "Grilled Chicken Salad", "Pasta Carbonara", "Vegetable Stir-Fry"
  - **Supper**: "Greek Yogurt", "Tomato Soup", "Cheese Sandwich"

### 3. Data Access Layer
- File: `src/db/meals.ts`
- `getMealsByCategory(category: 'breakfast'|'dinner'|'supper', db?)`: returns `MealRow[]`.
- Follows the existing optional `db` parameter pattern for test injection.

### 4. API Endpoints
- `GET /api/meals/[category]` → returns `MealRow[]` JSON.
- Implemented as explicit `onGet` request handlers, matching the Parcels API pattern.

### 5. UI / Components
- **MealSubNav.tsx**: tab bar with Breakfast, Dinner, Supper. Active tab uses `border-b-2 border-blue-500 text-blue-600`.
- **MealPage.tsx** (shared component for all three routes):
  - On mount, fetches all meals for the current category via `useVisibleTask$` and stores them in a signal.
  - Displays a large `HiSparklesSolid` icon button (styled as a centered, tappable card) labelled "Roll a meal" or similar.
  - On click, the component **shuffles** the loaded meals client-side and presents them one-by-one in a shuffled sequence (no repetition within a shuffle cycle).
  - When all meals in the cycle have been shown, display the message: **"You're a picky eater"**.
  - Clicking the button again starts a fresh shuffle cycle.
  - The current meal name is displayed prominently below the button.

### 6. Randomization Behaviour
- Client-side shuffle using the Fisher-Yates algorithm on the array loaded into memory.
- A pointer/index tracks how many meals from the current shuffle have been revealed.
- No server-side state is required for the shuffle; it is purely a client-side presentation concern.
- Given the expected max of ~50 meals per category, loading all meals into memory is acceptable.

### 7. Testing
- **DB unit tests** (`src/db/meals.test.ts`):
  - Verify `getMealsByCategory` returns exactly 3 rows per seeded category.
- **E2E tests** (`e2e/meals.spec.ts`):
  - `/meals` redirects to `/meals/breakfast`.
  - Sub-navigation tabs (Breakfast, Dinner, Supper) are visible.
  - Tab switching navigates to the correct URL and highlights the active tab.
  - Clicking the randomizer button reveals a meal name.
  - After 3 clicks (breakfast has 3 seeded meals), the "You're a picky eater" message is shown.
  - Reloading the page resets the shuffle state (fresh client-side cycle).

## Acceptance Criteria
- [ ] `/meals` redirects to `/meals/breakfast`.
- [ ] Sub-navigation is visible on all `/meals/*` routes and matches Parcels sub-nav styling.
- [ ] Clicking the dice/sparkles button reveals a random meal name from the correct category.
- [ ] Meals are shown without repetition until the category's list is exhausted.
- [ ] After exhausting the list, the message "You're a picky eater" is displayed.
- [ ] A new click restarts the shuffle cycle.
- [ ] DB migration applies cleanly and seeds 9 meals.
- [ ] DB tests pass (`pnpm test.db`).
- [ ] E2E tests pass (`pnpm e2e`).

## Consequences
- The module is read-only for now; meal CRUD will be addressed in a future iteration.
- Shuffle state is ephemeral (client-side only); a page reload resets the cycle. This is intentional and keeps the implementation simple.
- The meals table is separate from all existing tables; no impact on Parcels or other modules.
