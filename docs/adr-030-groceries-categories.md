# ADR-030: Groceries Categories

## Context
The groceries module currently allows adding items with name, description, amount, and unit. Users want to organize these items into categories (e.g., "Fruits", "Dairy", "Meat") to make shopping easier by grouping items by shop aisles.

## Proposed Changes

### Database
- Add a `category` column (TEXT, nullable) to the `groceries_items` table.
- Create a `groceries_product_categories` table to store the association between product names and categories for auto-filling.
  - `id`: INTEGER PRIMARY KEY AUTOINCREMENT
  - `normalized_name`: TEXT UNIQUE (normalized product name)
  - `category`: TEXT (the category name)

### Backend
- Update `GroceryItem` interface to include `category`.
- Update database functions to handle the `category` field.
- Implement a normalization function for product names (lowercase, trim).
- Automatically save/update the `groceries_product_categories` mapping when a grocery item with a category is saved.
- Provide a way to fetch the suggested category for a product name.

### API
- `GET /api/groceries`: Include category in items.
- `POST /api/groceries`: Accept category, update mapping.
- `PATCH /api/groceries/:id`: Accept category, update mapping.
- `GET /api/groceries/categories`: Get list of unique categories used in the mapping.
- `GET /api/groceries/suggest-category?name=...`: Get suggested category for a name.

### Frontend
- **Planning**:
  - `GroceryForm`: Add category input. Use a `datalist` or a searchable dropdown for existing categories.
  - Automatically fetch and fill category when product name is typed.
  - `PlanningItemsView`: Group items by category.
- **Shopping**:
  - `ShoppingList`: Group items by category.
  - Add a category filter (Tabs/Dropdown) with an "All" option.
  - Show only relevant (unbought) items in specific category views, but all in the "All" view?
    - Actually, the requirement says: "When doing groceries, items should be grouped by categories but only the ones that are relevant should be displayed." 
    - "Relevant" usually means "to be bought".

## Alternatives Considered
- Using a separate `categories` table with foreign keys: Might be over-engineering for this simple use case. Storing category names as strings is flexible and sufficient.

## Consequences
- Better organization of the shopping list.
- Improved user experience with auto-fill for categories.
