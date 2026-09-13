# OpenCode Project Instruction Addendum (bombos2)

## DB Semantics Ground Truth

- `knowledge/` docs are claims, not ground truth. Any plan decision depending on a column's or flag's semantics MUST be verified against actual write/read sites in `src/db` before the plan is presented.
- Before reusing or flipping an existing column/flag, MUST enumerate every consumer (`src/db`, `src/routes`, `src/server`, `src/components`) and verify each consumer's behavior.
- Example ground truth: `is_automatic` is reserved for period markers; auto payment transactions are stored with `is_automatic = 0` and are identified by `predefined_slug` membership in `bills_automatic_payments.slug`.