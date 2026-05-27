# ADR-028: Plan List Item UI Improvements

## Status
Ready

## Summary
Tighten list item padding, remove borders, and add underline to urgent items in PlanItemRow.

## Problem Description
1. **Excessive whitespace**: List items have `p-3` (12px) padding and a border, making the list feel loose and cluttered.
2. **Urgent items lack distinction**: Urgent items are red bold but lack the underline convention commonly associated with emphasis.
3. **Active state redundancy**: The `border-blue-300` on active items is unnecessary when the `bg-blue-50` background already provides clear visual distinction.

## Proposed Solution

### 1. Default item sizing
- Remove `border rounded` classes entirely
- Change `p-3` to `py-1 px-2` (4px vertical, 8px horizontal)
- Keep `bg-white` for default background

### 2. Active item styling
- Keep `p-3` padding (room for edit/remove icons)
- Keep `bg-blue-50` background
- Remove `border-blue-300` (no border at all)

### 3. Urgent item emphasis
- Add `underline` to the existing `text-red-600 font-bold` classes

### File affected
`src/components/plan/PlanItemRow.tsx` — class string on the `<li>` element and the `<span>` element.

### Before/After

**Default `<li>` class:**
```
Before: "p-3 border rounded cursor-pointer bg-white"
After:  "py-1 px-2 cursor-pointer bg-white"
```

**Active `<li>` class:**
```
Before: "p-3 border rounded cursor-pointer bg-blue-50 border-blue-300"
After:  "p-3 cursor-pointer bg-blue-50"
```

**Urgent `<span>` class:**
```
Before: "text-red-600 font-bold"
After:  "text-red-600 font-bold underline"
```

## Acceptance Criteria
1. Default list items have no border and compact padding (`py-1 px-2`).
2. Active (clicked) list items have `p-3` padding and `bg-blue-50` background, no border.
3. Urgent items display red bold with underline.
4. Edit/remove icons still appear on active items.
5. E2E tests pass — existing `.text-red-600` assertions remain valid.

## Tests
No new tests. Existing E2E tests cover:
- Urgent item display (checks `.text-red-600`) — still passes
- Item selection flow (clicks `li.cursor-pointer`) — still passes
- Edit/delete flows — unaffected
