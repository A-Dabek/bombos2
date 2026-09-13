---
name: db-semantics-audit
description: Use when planning any change to a DB column, flag, or table semantics — migration, flag reuse, bills_transactions, schema. Treats code as ground truth over knowledge/ docs.
---

# DB Semantics Audit

Use when planning any change to a DB column, flag, or table semantics — a migration, flag reuse, schema change, or transaction-grouping rule. If the change touches how a stored value is interpreted, this skill applies.

Purpose: treat code as ground truth. `knowledge/` docs drift; a plan built on doc claims was refuted by code this session (`is_automatic` was described as marking auto payments, but auto payments are stored `is_automatic = 0`; only period markers carry `1`).

Workflow:

1. WRITE sites: grep INSERT/UPDATE statements for the column in `src/db`; state the values actually written and by which function.
2. READ sites: grep SELECT/WHERE/ORDER/GROUP for the column; note every query whose behavior depends on a current value.
3. CONSUMERS: enumerate routes, scheduler, components, and other db modules that read the column.
4. Impact: for each consumer, its dependency on current semantics and breakage risk under the proposed change.
5. GATE: MUST NOT present a plan that reuses or flips a flag's semantics until every consumer is listed and each is verified safe or adjusted.

Report the audit as part of the plan.