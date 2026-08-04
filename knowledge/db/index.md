# Database Layer Knowledge Base

# Architecture & System

* [Database Architecture](architecture.md) - SQLite database setup, connection management, singleton instance, and test injection pattern.
* [Migration Runner](migrations.md) - Dynamic SQL migration runner and `_migrations` tracking table.

# Database Schemas (Tables)

* [Allowance Schemas](schemas/allowance.md) - `allowance_config` and `allowance_transactions` table structures.
* [Balance Schemas](schemas/balance.md) - `balance_config` and `balance_transactions` table structures.
* [Bills Schemas](schemas/bills.md) - `bills_config`, `bills_transactions`, `bills_automatic_payments`, and `bills_predefined_payments` table structures.
* [Groceries Schemas](schemas/groceries.md) - `groceries_items`, `groceries_product_categories`, `groceries_product_counts`, and `groceries_completed_categories` table structures.
* [Meals Schema](schemas/meals.md) - `meals` table structure.
* [Money Flows Schema](schemas/money_flows.md) - `money_flows` table structure.
* [Parcels Schema](schemas/parcels.md) - `parcels` table structure with BLOB storage.
* [Plan Schemas](schemas/plan.md) - `plan_lists` and `plan_items` table structures with foreign key cascades.
* [Settings Schema](schemas/settings.md) - `settings` key-value table structure.

# Data Access Modules

* [Allowance DB Module](modules/allowance.md) - Functions for managing monthly allowance configuration, transactions, and period calculations.
* [Balance DB Module](modules/balance.md) - Functions for managing account balance configuration, manual/automatic transactions, and period starts.
* [Bills DB Module](modules/bills.md) - Functions for managing bills configuration, transactions, predefined templates, and automatic payments.
* [Flows DB Module](modules/flows.md) - Functions for managing recurring money flows.
* [Groceries DB Module](modules/groceries.md) - Functions for managing grocery list items, auto-suggestions, product category matching, and buy count statistics.
* [Meals DB Module](modules/meals.md) - Functions for managing meal suggestions (dinner, supper).
* [Parcels DB Module](modules/parcels.md) - Functions for parcel image upload, status updates, auto-cleanup, and notes.
* [Plan DB Module](modules/plan.md) - Functions for managing task lists and plan items.
* [Settings DB Module](modules/settings.md) - Functions for reading and writing global key-value application settings.
