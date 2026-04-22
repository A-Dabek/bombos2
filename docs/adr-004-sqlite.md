# ADR-004: SQLite Data Layer

## Status
Accepted

## Context
The bombos2 app currently serves only static placeholder pages for its four modules (Parcels, Meals, Money, Shopping). There is no persistent storage or backend data layer. Before implementing business logic for any module, we need a reusable database infrastructure that can be wired up incrementally.

## Decision
We will integrate SQLite as the primary data store via the Deno-native https://deno.land/x/sqlite module.

- **Driver**: https://deno.land/x/sqlite — pure TypeScript/Deno implementation with zero native bindings. Works out of the box with Deno without Node compatibility layers.
- **File location**: ./data/app.db in the project root. The data/ directory is gitignored.
- **Connection management**: A singleton-style getDb() utility in src/db/connection.ts that lazily opens the DB file.
- **Migrations**: A lightweight runner in src/db/migrations.ts that reads ordered .sql files from src/db/migrations/. Applied migrations are tracked in a _migrations metadata table.
- **Auto-initialization**: getDb() automatically creates the DB file and runs pending migrations on first invocation. No separate dev-server plugin required.
- **API pattern**: Explicit Qwik City endpoint handlers (onGet, onPost, etc.) in route index.ts files. This keeps UI components decoupled from data access and makes the API surface explicit.
- **No business schema in this iteration**: Only the infrastructure and _migrations table are established. Module tables will be added in follow-up iterations.

## Alternatives Considered
- **etter-sqlite3**: Popular and synchronous, but requires native Node addons. Deno's npm compatibility can struggle with native modules, and the existing ite.config.ts already hints at this complexity.
- **@libsql/client**: Edge-ready but introduces a network dependency (even for local files via ile: URLs) and an npm specifier that may require additional Vite bundling configuration.

## Consequences
- Zero native dependency headaches; the chosen module is pure TS.
- Migrations are version-controlled .sql files, easy to review.
- The DB lifecycle is tied to runtime requests, not build steps, which keeps dev and preview workflows identical.
- All endpoint handlers must use parameterized queries to prevent SQL injection.
