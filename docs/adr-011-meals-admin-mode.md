# ADR-011: Meals Admin Mode & Breakfast Removal

## Status
Accepted

## Context
The Meals module currently supports three categories: breakfast, dinner, and supper. The breakfast category only contains placeholder seed data and does not align with the app's actual use case. Additionally, users need the ability to manage dishes directly in the app—adding new dishes and removing unwanted ones—without editing the database manually.

## Decision

### 1. Remove Breakfast Category
- Delete the `src/routes/meals/breakfast/` route directory.
- Update `src/routes/meals/index.tsx` to redirect to `/meals/dinner`.
- Remove "Breakfast" from `MealSubNav.tsx`.
- Update `MealRandomizerProps`, `getMealsByCategory`, and the API validation to accept only `"dinner" | "supper"`.
- Create migration `007_remove_breakfast.sql` that:
  1. Deletes all rows where `category = 'breakfast'`.
  2. Recreates the `meals` table with `CHECK(category IN ('dinner', 'supper'))`.
  3. Copies remaining data into the new table.
- Update existing DB unit tests to remove breakfast assertions.

### 2. Admin Mode Routing & UI
- Add admin sub-routes: `/meals/dinner/admin` and `/meals/supper/admin`.
- Add an admin toggle button (**red cog icon**) to the **bottom-right** of the randomizer page for each category.
- Create `MealPage.tsx` component that renders the category header with the admin button and the `MealRandomizer` below.
- Create `MealAdmin.tsx` component that:
  - Fetches all meals for the category.
  - Displays them as a vertical list, with **newly created items at the top**.
  - Provides an input field and a plus-icon "Add" button **at the top** of the list.
  - Each row shows the dish name and a trash-icon delete button (immediate deletion).
  - Includes a back button (arrow-left icon) linking back to `/meals/[category]`.
- Update `MealSubNav.tsx` active-state logic to use `startsWith` so that `/meals/dinner/admin` still highlights the "Dinner" tab.

### 3. Data Access Layer
- Add `createMeal(category: 'dinner' | 'supper', name: string, db?)` to `src/db/meals.ts`.
- Add `deleteMeal(id: number, db?)` to `src/db/meals.ts`.
- Both functions follow the optional `db` parameter pattern for test injection.

### 4. API Endpoints
- `GET /api/meals/[category]` — unchanged (returns list).
- `POST /api/meals/[category]` — new. Validates category and non-empty name, inserts row, returns `201 { id }`.
- `DELETE /api/meals/[id]` — new. Deletes row by id, returns `200 { success: true }` or `404` if not found.

### 5. Empty States
- `MealRandomizer` should display "No meals yet" when the fetched array is empty.
- `MealAdmin` should display "No meals yet" when the list is empty.

### 6. Styling
- Admin list uses Tailwind utility classes consistent with the app.
- Delete button uses `text-red-500` hover state.
- Add button uses `bg-blue-500 text-white`.
- Back button and admin toggle use `text-gray-500` / `text-gray-700`.

## Acceptance Criteria
- [ ] `/meals` redirects to `/meals/dinner`.
- [ ] Sub-navigation shows only "Dinner" and "Supper" tabs.
- [ ] Active tab highlighting works on admin sub-routes.
- [ ] Randomizer fetches and shuffles only dinner/supper meals.
- [ ] Admin button navigates to `/meals/[category]/admin`.
- [ ] Admin page lists all meals for the category.
- [ ] Clicking trash icon immediately removes the meal from the list and database.
- [ ] Typing a name and clicking "Add" inserts the meal and updates the list.
- [ ] Empty categories show "No meals yet" in both randomizer and admin views.
- [ ] DB migration applies cleanly.
- [ ] DB tests pass (`pnpm test.db`).
- [ ] E2E tests pass (`pnpm e2e`).

## Consequences
- The breakfast category is permanently removed; any future need for it will require a new migration.
- Admin mode has no authentication; it is a convenience UI for the app owner.
- The API endpoint paths remain backward-compatible for dinner/supper lists.
