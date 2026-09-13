# OpenCode Project Instruction Addendum (bombos2)

## DB Semantics Ground Truth

- `knowledge/` docs are claims, not ground truth. Any plan decision depending on a column's or flag's semantics MUST be verified against actual write/read sites in `src/db` before the plan is presented.
- Before reusing or flipping an existing column/flag, MUST enumerate every consumer (`src/db`, `src/routes`, `src/server`, `src/components`) and verify each consumer's behavior.
- Example ground truth: `is_automatic` is reserved for period markers; auto payment transactions are stored with `is_automatic = 0` and are identified by `predefined_slug` membership in `bills_automatic_payments.slug`.

## Testing

- Migrations SHALL be treated as possibly-seeding data: `runMigrations(":memory:")` MAY insert history rows (e.g. `022_import_historical_bills_transactions.sql` seeds 84 rows / 22 period starts). Unit tests MUST account for or explicitly clear seeded rows (`DELETE FROM bills_transactions`) before asserting exact counts.
- Repo has NO ESLint script or dependency. MUST NOT run `npx eslint` (auto-installs eslint@10, crashes with `ERR_MODULE_NOT_FOUND '@eslint/js'`). Static checks are `pnpm build.types` (tsc) and `pnpm exec qwik check-client src dist`.
- If E2E runs take too long, limit the number of workers: `pnpm exec playwright test --workers=N` (e.g. `--workers=2`).

## Naming

- Before creating a new component, MUST grep `src/` for existing identifiers with the same name (type–component collisions raise TS2300 duplicate identifiers). Prefer distinct names or alias type imports from the start.

## Version A/B

- To compare feature vs base behavior, MUST use `git worktree` for a clean base checkout. MUST NOT move untracked files in/out of the worktree by hand.
- MUST run state-mutating git commands sequentially (one bash call each, awaiting output) — never batched in parallel.