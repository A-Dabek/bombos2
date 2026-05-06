# E2E Test Transition: From Atomic to User Journeys

## Overview
We are refactoring the E2E testing strategy for **bombos2**. Instead of testing isolated components or single routes, we are shifting towards **User Journeys**. These tests simulate real-world usage patterns, covering multiple interactions and navigation steps in a single flow.

## Recent Progress: Meals Module
The `meals.spec.ts` has been refactored to follow this approach. Key improvements include:
- **Comprehensive Flow**: Tests now cover viewing meals, rolling the randomizer, navigating to admin pages, adding/deleting data, and returning to verify the impact on the randomizer.
- **Async Handling**: Added a loading spinner (`data-testid="loader"`) in `MealRandomizer` to handle async data fetching gracefully in tests.
- **Logic Fixes**: Corrected the `MealRandomizer` logic to ensure all meals are shown exactly once before the "picky eater" (exhausted) state is reached, matching the test journey expectations.

## Recent Progress: Parcels Module
Refactored the Parcels module from atomic tests to two distinct journeys (`Incoming` and `Outgoing`) plus a global notification verification flow.
- **Global Indicator Journey**: Added a test case that seeds data directly into the DB to verify that the blue notification dot appears and disappears correctly when navigating across different modules (Meals, Money, etc.).
- **Reliable Uploads**: Resolved flakiness in file upload tests by using `page.waitForResponse()` to synchronize with the API and waiting for the `parcel-uploading` indicator to disappear.
- **Note Persistence**: Verified that notes are correctly debounced and persisted to the DB by awaiting the network response before reloading the page.

## Guidelines for Future Sessions

### 1. Production Code Enhancements
- **Loaders**: Always provide a visual loading state for async operations. Use `data-testid="loader"` for consistency.
- **Test IDs**: Add `data-testid` attributes to interactive elements (buttons, inputs), key data displays, main navigation links, and global notification indicators.
- **Non-Functional**: You are encouraged to add attributes or small UI hints that aid testing, provided they do not change the application's core behavior.

### 2. E2E Test Design
- **Reset State**: Use `test.beforeEach` to reset the SQLite database to a consistent state using direct DB calls (see `e2e/meals.spec.ts` for patterns).
- **Sequential Steps**: Structure tests to follow a logical path:
  1. **Land**: Go to the initial page.
  2. **Interact**: Perform the primary action (e.g., Roll a meal).
  3. **Modify**: Navigate to an admin or settings page to change data.
  4. **Verify**: Return to the main page and ensure the changes are reflected.
- **Network Synchronization**: Use `page.waitForResponse()` to synchronize with API calls, especially for debounced actions (like updating notes) or multi-step operations (like uploads).
- **Avoid Brittle Waits**: Prefer `locator.waitFor()` or expecting visibility over `page.waitForTimeout()`.

### 3. Qwik-Specific Considerations
- **Hydration**: Remember that `useVisibleTask$` runs on the client. Tests should wait for the `loader` to appear and then disappear to ensure data is ready.
- **Stability**: Ensure child components render a stable JSX tree. If a component shouldn't be visible, handle that via the parent's rendering logic or CSS, rather than returning `null` early if it needs to maintain state or listeners.
