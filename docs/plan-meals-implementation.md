# Meals Module — Atomic Implementation Plan

This document breaks the Meals module implementation into 5 atomic, sequentially dependent tasks. Each task can be developed, reviewed, and merged independently.

---

## Task 1: Database Schema, Seed Data, and DAL

**Goal:** Establish the data layer so the rest of the module has a source of truth.

**Files to create:**
- `src/db/migrations/005_meals.sql`
- `src/db/meals.ts`
- `src/db/meals.test.ts`

**Files to modify:**
- `src/db/migrations.test.ts` — update expected migration count from `4` to `5`

**Details:**
- Migration `005_meals.sql` must create the `meals` table and insert 9 seed rows (3 per category).
- `src/db/meals.ts` exports:
  - `MealRow` interface (`id`, `category`, `name`)
  - `getMealsByCategory(category, db?)` returning `MealRow[]`
  - Optional `db` parameter for test injection (same pattern as `parcels.ts`)
- `src/db/meals.test.ts` verifies:
  - `getMealsByCategory('breakfast')` returns exactly 3 rows
  - Same for `'dinner'` and `'supper'`

**Verification:**
```bash
pnpm test.db
```

**Dependencies:** None.

---

## Task 2: API Endpoint

**Goal:** Expose the meal list so the frontend can fetch it.

**Files to create:**
- `src/routes/api/meals/[category]/index.ts`

**Details:**
- Implement `onGet` request handler.
- Read `category` from `params` (validated to be `'breakfast' | 'dinner' | 'supper'`).
- Call `getMealsByCategory(category)`.
- Return JSON array of `MealRow`.
- Return `400` if category is invalid.

**Verification:**
```bash
pnpm dev
# Then visit in browser or curl:
# curl http://localhost:5173/api/meals/breakfast
```

**Dependencies:** Task 1.

---

## Task 3: Routing Shell — Sub-Navigation, Layout, and Redirect

**Goal:** Make the `/meals/*` routes navigable with consistent sub-navigation, matching the Parcels module pattern.

**Files to create:**
- `src/components/meals/MealSubNav.tsx`
- `src/routes/meals/layout.tsx`
- `src/routes/meals/index.tsx` (server-side redirect to `/meals/breakfast`)
- `src/routes/meals/breakfast/index.tsx`
- `src/routes/meals/dinner/index.tsx`
- `src/routes/meals/supper/index.tsx`

**Files to modify:**
- `e2e/nav.spec.ts` — update the "clicking each tab navigates to correct URL" test so `/meals` expects `/meals/breakfast` (mirroring the existing `/parcels` → `/parcels/incoming` logic)

**Details:**
- `MealSubNav.tsx` is a flex tab bar with tabs: Breakfast, Dinner, Supper.
- Active tab uses `border-b-2 border-blue-500 text-blue-600` (exactly like `ParcelSubNav.tsx`).
- `layout.tsx` renders `<MealSubNav />` then `<Slot />`.
- The three category pages are minimal for now — just render a heading with the category name (e.g., `<h1>Breakfast</h1>`).

**Verification:**
```bash
pnpm dev
# /meals redirects to /meals/breakfast
# Sub-nav tabs switch between /meals/breakfast, /meals/dinner, /meals/supper
# Active tab is visually highlighted
```

**Dependencies:** None (pure UI shell; does not need API yet).

---

## Task 4: Meal Randomizer UI

**Goal:** Add the core feature — the sparkles button, shuffle logic, and meal display.

**Files to create:**
- `src/components/meals/MealRandomizer.tsx`

**Files to modify:**
- `src/routes/meals/breakfast/index.tsx`
- `src/routes/meals/dinner/index.tsx`
- `src/routes/meals/supper/index.tsx`

**Details:**
- `MealRandomizer` accepts a `category` prop.
- On mount (`useVisibleTask$`), fetch all meals from `/api/meals/${category}`.
- Store meals in a signal. Keep a shuffled copy and a pointer/index in separate signals.
- On first click of the `HiSparklesSolid` button, shuffle the meals client-side (Fisher-Yates) and show the first meal.
- Each subsequent click advances the pointer and shows the next meal.
- When the pointer reaches the end of the shuffled array, show the message: **"You're a picky eater"**.
- Clicking again resets: re-shuffle and show the first meal of the new cycle.
- Style: centered layout, large sparkles icon button, prominent meal name text, consistent Tailwind spacing.
- Update the three route pages to render `<MealRandomizer category="breakfast" />` (etc.) instead of the placeholder heading.

**Verification:**
```bash
pnpm dev
# Navigate to /meals/breakfast
# Click sparkles button → shows one of the 3 breakfast meals
# Click again → shows a different meal
# Click again → shows the third meal
# Click again → "You're a picky eater"
# Click again → new shuffle cycle begins
```

**Dependencies:** Task 2 (API must exist) and Task 3 (routes must exist).

---

## Task 5: E2E Tests

**Goal:** Cover the full Meals module behaviour with Playwright.

**Files to create:**
- `e2e/meals.spec.ts`

**Details:**
- `/meals` redirects to `/meals/breakfast`
- Sub-navigation tabs (Breakfast, Dinner, Supper) are visible
- Tab switching navigates to correct URL and highlights active tab
- Clicking the sparkles button reveals a meal name
- After 3 clicks (all breakfast meals shown), "You're a picky eater" appears
- Clicking again restarts the cycle (a meal name appears again)

**Verification:**
```bash
pnpm e2e
```

**Dependencies:** Task 3 and Task 4.

---

## Summary Order of Execution

| Order | Task | Key Deliverable |
|---|---|---|
| 1 | Database & DAL | `meals` table, seed data, `getMealsByCategory`, DB tests green |
| 2 | API endpoint | `GET /api/meals/[category]` returns JSON array |
| 3 | Routing shell | `/meals/*` routes, sub-nav, redirect, nav e2e updated |
| 4 | Randomizer UI | Sparkles button, shuffle logic, meal display, picky-eater message |
| 5 | E2E tests | `e2e/meals.spec.ts` covers full user flow |

Each task builds on the previous one but is independently reviewable.
