# Meals Admin Mode & Breakfast Removal — Implementation Plan

## Problem Description
1. The **breakfast** category in the Meals module contains only placeholder seed data and does not serve a real use case. It must be completely removed from the UI, database, API, and tests.
2. Users need an in-app way to **manage dishes** (add and remove) for dinner and supper. This requires a new admin view per category with immediate add/remove actions.

## Proposed Solution

### Part A: Remove Breakfast Entirely
1. **Delete route**: Remove `src/routes/meals/breakfast/` directory.
2. **Update redirect**: Change `src/routes/meals/index.tsx` to redirect to `/meals/dinner`.
3. **Update sub-nav**: Remove "Breakfast" from `MealSubNav.tsx`.
4. **Update types**: Narrow `MealRandomizerProps.category` and `getMealsByCategory` parameter to `"dinner" | "supper"`.
5. **Update API guard**: Change `src/routes/api/meals/[category]/index.ts` validation to only accept `dinner` and `supper`.
6. **Database migration**: Create `src/db/migrations/007_remove_breakfast.sql` that:
   - Deletes all rows where `category = 'breakfast'`.
   - Recreates the `meals` table with `CHECK(category IN ('dinner', 'supper'))`.
   - Copies remaining dinner/supper rows into the new table.
7. **Update E2E tests**: Remove all breakfast assertions and update redirect/tab tests.
8. **Update DB unit tests**: Remove breakfast test case and update expected row counts (dinner 33, supper 20 remain unchanged).

### Part B: Admin Mode
1. **New shared component `MealPage.tsx`**:
   - Wraps each category page (`/meals/dinner` and `/meals/supper`).
   - Renders a top bar with the category title and a **red cog icon** button (**bottom-right**) linking to `/meals/[category]/admin`.
   - Renders `MealRandomizer` below the bar.
   - When the category has no meals, shows "No meals yet" instead of the randomizer.

2. **New shared component `MealAdmin.tsx`**:
   - Uses `useVisibleTask$` to fetch all meals for the current category.
   - Top bar with an **arrow-left icon** back button linking to `/meals/[category]`.
   - Displays "Add dish" input + **plus icon** button at the **top** of the list.
   - On submit, calls `POST /api/meals/[category]` with `{ name }` and **prepends** the new meal to the top of the local list without a full page reload.
   - Displays a vertical list of dishes; each row has the dish name on the left and a **trash icon** delete button on the right.
   - Clicking the trash icon immediately calls `DELETE /api/meals/[id]` and removes the row.
   - Shows "No meals yet" when the list is empty.

3. **New routes**:
   - `src/routes/meals/dinner/admin/index.tsx` renders `MealAdmin` with `category="dinner"`.
   - `src/routes/meals/supper/admin/index.tsx` renders `MealAdmin` with `category="supper"`.
   - Update `src/routes/meals/dinner/index.tsx` to render `MealPage` with `category="dinner"`.
   - Update `src/routes/meals/supper/index.tsx` to render `MealPage` with `category="supper"`.

4. **Update `MealSubNav.tsx`**:
   - Use path-prefix matching so that `/meals/dinner/admin` still highlights "Dinner".

5. **DAL additions (`src/db/meals.ts`)**:
   - `createMeal(category, name, db?)` → runs `INSERT INTO meals (category, name) VALUES (?, ?)` and returns the inserted `id`.
   - `deleteMeal(id, db?)` → runs `DELETE FROM meals WHERE id = ?`.

6. **API additions**:
   - `POST /api/meals/[category]` (`src/routes/api/meals/[category]/index.ts`):
     - Validates category is `dinner` or `supper`.
     - Reads `{ name }` from JSON body.
     - Rejects empty or missing names with `400`.
     - Inserts via `createMeal` and returns `201 { id }`.
   - `DELETE /api/meals/[id]` (`src/routes/api/meals/[id]/index.ts`):
     - Deletes the meal by `id`.
     - Returns `200 { success: true }`.
     - Returns `404` if no rows were deleted.

7. **Empty state in `MealRandomizer`**:
   - If `meals.value.length === 0`, render "No meals yet" instead of the roll button and meal text.

## Acceptance Criteria
- [ ] `/meals` redirects to `/meals/dinner`.
- [ ] Sub-navigation shows exactly **Dinner** and **Supper** tabs.
- [ ] Active tab highlighting works on both `/meals/dinner` and `/meals/dinner/admin`.
- [ ] The red cog icon button is visible on both category pages (**bottom-right**) and links to the respective admin route.
- [ ] Admin page shows a back button that returns to the category randomizer.
- [ ] Admin page lists all dishes for the category, newest at the top.
- [ ] Typing a name and clicking the plus button adds the dish to the top of the list and persists it.
- [ ] Clicking the trash icon immediately removes the dish from the list and the database.
- [ ] An empty category shows "No meals yet" in the randomizer view.
- [ ] An empty category shows "No meals yet" in the admin view.
- [ ] Migration `007_remove_breakfast.sql` applies cleanly on fresh and existing databases.
- [ ] `pnpm test.db` passes.
- [ ] `pnpm e2e` passes.

## Tests to Add

### DB Unit Tests (`src/db/meals.test.ts`)
- Remove the breakfast test case.
- Add `createMeal` test: insert a dinner meal and assert it appears in `getMealsByCategory("dinner")`.
- Add `deleteMeal` test: insert a meal, delete it by id, assert `getMealsByCategory` no longer contains it.

### E2E Tests (`e2e/meals.spec.ts`)
- Update `/meals` redirect test to expect `/meals/dinner`.
- Update sub-navigation visibility test to assert Breakfast link is absent and Dinner/Supper are present.
- Update tab switching test to start at `/meals/dinner` and switch to Supper.
- Add admin navigation test:
  - Go to `/meals/dinner`.
  - Click the red cog button.
  - Expect URL `/meals/dinner/admin`.
  - Click the back button.
  - Expect URL `/meals/dinner`.
- Add admin CRUD test:
  - Go to `/meals/dinner/admin`.
  - Type a unique test name (e.g., `__E2E_TEST_DISH__`) into the input.
  - Click the Add button.
  - Assert the new dish appears at the top of the list.
  - Click its trash icon (calls `DELETE /api/meals/[id]`).
  - Assert the dish is removed from the list.
