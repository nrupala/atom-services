# Database design review — `database-design-review`

**Display name:** Database design review · **Slug:** `database-design-review` · **Deliverable type:** REVIEW · **Atom version:** 0.1.0 · **Status:** live — release candidate (one-week RC soak to 2026-11-22)

**Quick start:** [USER-GUIDE.md](USER-GUIDE.md) · **Verification evidence:** [TEST-REPORT.md](TEST-REPORT.md)

## Tutorial

A first call, walked through end to end. This tutorial narrates the recorded full-pass trial run for this atom; the exact request and response are reproduced verbatim under [Worked examples](#worked-examples), example 1.

1. **Get a key.** Sign up and issue a gateway key scoped to `database-design-review` (the full flow is in the first how-to guide below). Every call sends it as `Authorization: Bearer <key>`.
2. **Assemble the manifest.** Build one JSON object declaring the evidence the atom checks. In the recorded run the design is `User profile system`. Fill every group the Input reference lists — an absent field is not a neutral omission: it is recorded as missing evidence and caps the verdict at `INSUFFICIENT_EVIDENCE`.
3. **Send it.** `POST https://atoms.pipavia.com/v1/database-design-review` with the manifest as the body (or call the MCP tool `database_design_review` with the same object as its arguments).
4. **Read the verdict first.** The recorded response returns HTTP 200 with verdict `DATABASE_DESIGN_SOUND` — the strongest verdict this atom gives. Its `summary` reads: "42 pass, 0 fail, 0 missing of 42 checks across four sections."
5. **Read the sections, then the checks.** All 4 sections report `pass` (`schema_and_normalization`, `indexing_and_performance`, `integrity_transactions_and_security`, `migrations_and_backups`), and all 42 entries in `checks` report `status: pass`, each carrying the `evidence` string that states the requirement it checked.
6. **Read the computed fields.** The record declares one table naming a primary key and its constraints, one query pattern, and one index that matches that pattern on the same table — so primary-key coverage and query-pattern index coverage both compute to `1.0000`, and the two conditional checks pass as not applicable on the declared gates (no denormalization declared; no distributed store declared in use). The response's `computed_status` is `within_stated_limits_on_declared_evidence`, and its `stamp` field carries a plain-text rendering of the same verdict for logs and tickets.
7. **Keep the response.** It is the deliverable: one bounded judgment artifact for that one manifest. Same manifest in → same response out (the verification battery confirmed byte-identical repeat REST responses and MCP/REST parity for the full-pass manifest).

## How-to guides

### Get a key and call via REST

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "database-design-review"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call:

```bash
curl -X POST https://atoms.pipavia.com/v1/database-design-review \
  -H "Authorization: Bearer <key>" \
  -H "Content-Type: application/json" \
  -d @manifest.json
```

A well-formed manifest returns HTTP 200 and a verdict body (see Reference — Output format). Authentication and shape failures return the error shapes listed under Reference — Errors, never a verdict.

### Call via MCP

POST to `https://atoms.pipavia.com/mcp/database-design-review` with the same `Authorization: Bearer <key>` header and call the tool named `database_design_review`. The `tools/call` arguments are the manifest object itself — the same JSON you would send as the REST body. The MCP result's structured content is the same report core as the REST response (parity was verified in the recorded battery: the full-pass manifest's MCP `structuredContent` was deep-equal to the REST artifact).

### Read a failing verdict and fix the manifest

A failing verdict is still HTTP 200 — it is a result, not a transport error. Work it in this order:

1. **Read `verdict`.** `DATABASE_DESIGN_NOT_SOUND` means at least one check failed. `INSUFFICIENT_EVIDENCE` means nothing failed but evidence is missing. The passing verdict here is `DATABASE_DESIGN_SOUND`.
2. **Read `sections`.** A section reports `fail` if any of its checks failed, `insufficient_evidence` if none failed but at least one is missing, and `pass` only when all of its checks pass. Start with the failing sections.
3. **Read `checks`.** Filter to `status: fail` for breaches and `status: missing` for gaps. Each entry names its `section`, its `check`, and an `evidence` string stating the requirement. `fail` means the field was present but false, invalid, or arithmetically inconsistent; `missing` means the field (or a value a computation needs) was absent.
4. **Fix the underlying facts, then resubmit.** In the recorded violations run the failing checks were exactly: `every_table_has_primary_key_named`, `every_table_declares_constraints`, `no_offset_pagination_at_scale`, `money_not_stored_as_float`, `no_string_concatenated_sql`, `no_shared_superuser`, `no_past_migrations_edited`, `untested_backup_not_trusted` (34 pass, 8 fail, 0 missing of 42 checks across four sections.) In the recorded violations run the single declared table named no primary key and declared no constraints, OFFSET pagination at scale and money-as-float and string-concatenated SQL and a shared superuser were all declared present, past migrations were declared edited, and an untested backup was declared trusted. Fixing the verdict means fixing the design record's facts on each point — name the key, declare the constraints, and remove each declared anti-pattern — then resubmit.
5. **Do not confuse a verdict with a 422.** A failing verdict means the manifest was well-typed and was judged. A 422 means the manifest was not well-typed and was never judged — see the next guide.

### Handle a 422 invalid_input

A type violation returns HTTP 422 with a body naming the offending field — it never returns a verdict. The recorded malformed run for this atom sent a value of the wrong type and received:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "normalization.normalized_to_3nf",
  "detail": "normalization.normalized_to_3nf must be a boolean"
}
```

To handle it: read `field` (`normalization.normalized_to_3nf`) and `detail` ("normalization.normalized_to_3nf must be a boolean"), correct the value's type in your manifest at exactly that path, and resubmit the whole manifest. Do not drop the field to silence the error — an absent field is missing evidence and caps the verdict at `INSUFFICIENT_EVIDENCE`. One 422 reports one field; if several fields are mistyped, fix and resubmit iteratively.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/database-design-review` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/database-design-review` — tool name `database_design_review`; `tools/call` arguments = the manifest object.
- **Key issuance:** `POST /v1/signup` (email; sign-in link emailed), then `POST /v1/keys` with `{"atom": "database-design-review"}` after opening the link. A key for one atom never verifies for another: scope is per atom.

### Input reference

One JSON manifest per call. Types are as stated in SERVICE.md's field table (which states: all fields are booleans unless noted) and corroborated by `contract.yaml` and the recorded MCP `inputSchema`. Fields are grouped below exactly as SERVICE.md groups them (by the section that reads them). An absent field = missing evidence; a present-but-false/invalid field = a failed check, except where a note says otherwise.

#### Carried into the output (not itself checked)

| Field | Type | Notes |
|---|---|---|
| `design` | string | (string; carried into the verdict output, not itself checked) |

#### Read by: schema_and_normalization

| Field | Type | Notes |
|---|---|---|
| `store_selection.access_patterns_mapped` | boolean | — |
| `store_selection.store_chosen_from_access_patterns` | boolean | — |
| `store_selection.relational_default_or_fit_justified` | boolean | — |
| `tables` | array | (list of table-row objects, each `{name, primary_key, constraints_declared}` — see the three entry fields below; computed, see below) |
| `tables[].name` | string | (string; names the row in the computed `tables_without_*` outputs) |
| `tables[].primary_key` | string | (string; must be a non-empty string for the row to pass the computed primary-key check — an absent field is missing evidence, an empty string fails) |
| `tables[].constraints_declared` | boolean | — |
| `normalization.normalized_to_3nf` | boolean | — |
| `normalization.denormalized` | boolean | (gates the denormalization-reason check below) |
| `normalization.denormalization_reasons_documented` | boolean | (required when denormalization is declared; otherwise the check passes as not applicable) |

#### Read by: indexing_and_performance

| Field | Type | Notes |
|---|---|---|
| `query_patterns` | array | (list of query-pattern objects, each `{name, table, supporting_index}` — see the three entry fields below; computed, see below) |
| `query_patterns[].name` | string | (string; names the pattern in the computed `uncovered_query_patterns` output) |
| `query_patterns[].table` | string | (string; a supporting index matches only on the same declared table) |
| `query_patterns[].supporting_index` | string | (string; must name a declared index on the same table for the pattern to pass the computed matching check — an absent field is missing evidence) |
| `indexes` | array | (list of index objects, each `{name, table, columns}` — see the three entry fields below; computed, see below) |
| `indexes[].name` | string | (string; the name a query pattern's `supporting_index` must equal to match) |
| `indexes[].table` | string | (string; must equal the query pattern's declared table to match) |
| `indexes[].columns` | array | (list of strings; must be present and non-empty for the index row to pass the computed columns check) |
| `indexing.composite_column_order_equality_then_range` | boolean | — |
| `indexing.covering_indexes_for_hot_queries` | boolean | — |
| `indexing.write_cost_considered` | boolean | — |
| `indexing.explain_analyze_before_and_after` | boolean | — |
| `performance.measured_first` | boolean | — |
| `performance.n_plus_one_queries_addressed` | boolean | — |
| `performance.keyset_pagination_for_large_sets` | boolean | — |
| `performance.offset_pagination_at_scale_present` | boolean | (must be `false` to pass — skill anti-pattern) |
| `performance.connection_pooling_declared` | boolean | — |
| `performance.bounded_result_sets` | boolean | — |
| `performance.cache_deliberate_with_honest_invalidation` | boolean | — |

#### Read by: integrity_transactions_and_security

| Field | Type | Notes |
|---|---|---|
| `integrity.constraints_enforce_invariants` | boolean | — |
| `integrity.appropriate_types_used` | boolean | — |
| `integrity.money_stored_as_float` | boolean | (must be `false` to pass — skill anti-pattern) |
| `transactions.isolation_level_and_anomalies_known` | boolean | — |
| `transactions.transactions_kept_short` | boolean | — |
| `transactions.writes_idempotent_where_retries_possible` | boolean | — |
| `transactions.distributed_store_used` | boolean | (gates the trade-off check below) |
| `transactions.consistency_availability_tradeoff_explicit` | boolean | (required when a distributed store is declared in use; otherwise the check passes as not applicable) |
| `security.parametrized_queries_only` | boolean | — |
| `security.string_concatenated_sql_present` | boolean | (must be `false` to pass — skill anti-pattern) |
| `security.least_privilege_users_per_service` | boolean | — |
| `security.shared_superuser_present` | boolean | (must be `false` to pass) |
| `security.encryption_at_rest` | boolean | — |

#### Read by: migrations_and_backups

| Field | Type | Notes |
|---|---|---|
| `migrations.forward_only` | boolean | — |
| `migrations.past_migrations_edited` | boolean | (must be `false` to pass — skill anti-pattern) |
| `migrations.expand_contract_pattern_used` | boolean | — |
| `migrations.big_bang_schema_swap_present` | boolean | (must be `false` to pass) |
| `backups.backups_scheduled` | boolean | — |
| `backups.restores_tested_on_schedule` | boolean | — |
| `backups.untested_backup_trusted` | boolean | (must be `false` to pass — skill anti-pattern) |

Total typed input fields documented: 50 (each SERVICE.md field-table row; nested row-entry fields are listed individually where SERVICE.md lists them).

### Checks

All 42 checks, named exactly as in the recorded full-pass REST response's `checks` array (cross-checked against SERVICE.md; the counts agree). For each check, the Requirement column is the recorded `evidence` string, which states what must hold to pass.

**Per-check status semantics (all checks):** `pass` = the requirement held on the declared evidence; `fail` = the field was present but false/invalid, or a computed comparison did not hold; `missing` = the field, list, or a value a computation needs was absent, so the check could not be evaluated. There is no separate not-applicable status in the recorded responses: where a check is conditional and its gate is not declared, it is recorded as `pass` with evidence stating that no such case was declared (see the notes on the individual conditional checks, where this atom has them).

#### Section: schema_and_normalization

| Check | Requirement to pass (recorded evidence) | Notes |
|---|---|---|
| `access_patterns_mapped_before_store_choice` | choosing a store: the access patterns — reads vs writes, query shapes, consistency needs — are mapped before a store is chosen | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `store_chosen_from_access_patterns` | choosing a store: the store is picked for how the data is actually used — the declared access patterns, not the hype | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `relational_default_or_fit_justified` | choosing a store: relational is the default for anything with relationships and integrity needs, and any document/KV/graph choice is justified by the access pattern genuinely fitting | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `tables_declared` | relational design: the declared design record names its tables — the tables list is present and non-empty | Computed. Pass requires the declared `tables` list to be present and non-empty. Absent list is `missing`; an empty list fails. |
| `every_table_has_primary_key_named` | relational design: every declared table row names a primary key | Computed. Pass requires every declared table row to name a non-empty `primary_key` string. A row with the field absent is `missing`; a row naming an empty string fails. |
| `every_table_declares_constraints` | relational design: every declared table row declares its constraints — NOT NULL, UNIQUE, FK, CHECK — so the database enforces invariants | Computed. Pass requires every declared table row to declare `constraints_declared: true`. A row with the field absent is `missing`. |
| `normalized_to_3nf_declared` | relational design: the design is normalized to 3NF first | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `denormalization_reasons_documented_when_denormalized` | no denormalization declared | Conditional. Required only when `normalization.denormalized` is declared `true`. When no denormalization is declared, the check passes as not applicable (status `pass`). |
#### Section: indexing_and_performance

| Check | Requirement to pass (recorded evidence) | Notes |
|---|---|---|
| `query_patterns_declared` | indexing: the declared design record names its query patterns — the query patterns list is present and non-empty | Computed. Pass requires the declared `query_patterns` list to be present and non-empty. Absent is `missing`; empty fails. |
| `indexes_declared` | indexing: the declared design record names its indexes — the indexes list is present and non-empty | Computed. Pass requires the declared `indexes` list to be present and non-empty. Absent is `missing`; empty fails. |
| `every_index_declares_columns` | indexing: every declared index row declares its columns | Computed. Pass requires every declared index row to declare a present, non-empty `columns` list of strings. A row with the field absent is `missing`. |
| `every_query_pattern_has_matching_index` | indexing: every declared query pattern names a supporting index that is declared, on the same table — indexes are for the actual query patterns | Computed. Pass requires every declared query pattern to name a supporting index actually declared with the same `name` and the same declared `table`. A pattern with `supporting_index` or `table` absent is `missing` and does not appear in `uncovered_query_patterns`. |
| `composite_index_column_order_equality_then_range` | indexing: composite index column order matters — equality columns first, then range | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `covering_indexes_for_hot_queries` | indexing: covering indexes are aimed for on hot queries | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `index_write_cost_considered` | indexing: the write cost is considered — every index taxes writes | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `explain_analyze_before_and_after` | indexing: EXPLAIN / ANALYZE is run before and after — measure, don't guess | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `performance_measured_first` | performance: measure first | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `n_plus_one_queries_addressed` | performance: N+1 queries are killed | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `keyset_pagination_for_large_sets` | performance: keyset (cursor) pagination is preferred for large sets | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `no_offset_pagination_at_scale` | anti-pattern: no OFFSET pagination at scale | Pass requires `performance.offset_pagination_at_scale_present` to be declared `false` (skill anti-pattern). Declared `true` fails; absent is `missing`. |
| `connection_pooling_declared` | performance: connection pooling is declared | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `bounded_result_sets` | performance: result sets are bounded | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `cache_deliberate_and_invalidation_honest` | performance: caching is deliberate and invalidation is honest | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
#### Section: integrity_transactions_and_security

| Check | Requirement to pass (recorded evidence) | Notes |
|---|---|---|
| `constraints_enforce_invariants` | relational design: constraints are data integrity — NOT NULL, UNIQUE, FK, CHECK — and the database enforces invariants | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `appropriate_types_used` | relational design: the right types are used — timestamps with time zone, numeric for money, enums/lookup tables for categories | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `money_not_stored_as_float` | anti-pattern: money is not stored as float | Pass requires `integrity.money_stored_as_float` to be declared `false` (skill anti-pattern). Declared `true` fails; absent is `missing`. |
| `isolation_level_and_anomalies_known` | transactions & consistency: the isolation level and what anomalies it permits are known | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `transactions_kept_short` | transactions & consistency: transactions are kept short | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `writes_idempotent_where_retries_possible` | transactions & consistency: writes are designed to be idempotent where retries are possible | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `consistency_availability_tradeoff_explicit_when_distributed` | no distributed store declared in use | Conditional. Required only when `transactions.distributed_store_used` is declared `true`. When no distributed store is declared, the check passes as not applicable (status `pass`). |
| `parametrized_queries_only` | security: parametrized queries only — user input is never concatenated | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `no_string_concatenated_sql` | anti-pattern: no string-concatenated SQL | Pass requires `security.string_concatenated_sql_present` to be declared `false` (skill anti-pattern). Declared `true` fails; absent is `missing`. |
| `least_privilege_users_per_service` | security: least-privilege database users per service | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `no_shared_superuser` | security: no shared superuser | Pass requires `security.shared_superuser_present` to be declared `false`. Declared `true` fails; absent is `missing`. |
| `encryption_at_rest_declared` | security: encryption at rest is declared | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
#### Section: migrations_and_backups

| Check | Requirement to pass (recorded evidence) | Notes |
|---|---|---|
| `migrations_forward_only` | migrations: migrations are forward-only | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `no_past_migrations_edited` | migrations / anti-pattern: past migrations are never edited — reversal is a new migration | Pass requires `migrations.past_migrations_edited` to be declared `false` (skill anti-pattern). Declared `true` fails; absent is `missing`. |
| `expand_contract_pattern_used` | migrations: backward-compatible deploys use expand/contract — add new, backfill, switch reads, stop writes to old, drop old | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `no_big_bang_schema_swap` | migrations: no big-bang schema swaps against live traffic | Pass requires `migrations.big_bang_schema_swap_present` to be declared `false`. Declared `true` fails; absent is `missing`. |
| `backups_scheduled` | backups: backups are scheduled | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `restores_tested_on_schedule` | backups: restores are tested on a schedule — a backup you haven't restored is a hope, not a backup | Pass requires the recorded requirement to hold on the declared evidence; declared false/invalid fails, absent is `missing`. |
| `untested_backup_not_trusted` | anti-pattern: an untested backup is not trusted | Pass requires `backups.untested_backup_trusted` to be declared `false` (skill anti-pattern). Declared `true` fails; absent is `missing`. |

### Output format

HTTP 200 returns one JSON object. Fields observed in the recorded full-pass response, in recorded order:

| Field | Type (as recorded) | Meaning |
|---|---|---|
| `service` | string | Atom slug. |
| `atom_version` | string | Atom version that produced the verdict. |
| `design` | string | Computed/reported value defined with its check in SERVICE.md and the Checks section above; null when it cannot be computed from the declared evidence. |
| `verdict` | string | The verdict (see Verdict vocabulary). |
| `sections` | object | Per-section statuses keyed by section name. |
| `checks` | array | Array of `{section, check, status, evidence}` objects — one per check. |
| `computed_status` | string | `within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null when a computed check cannot be completed. |
| `tables_count` | number | Computed/reported value defined with its check in SERVICE.md and the Checks section above; null when it cannot be computed from the declared evidence. |
| `tables_without_primary_key` | array | Computed/reported value defined with its check in SERVICE.md and the Checks section above; null when it cannot be computed from the declared evidence. |
| `tables_without_constraints_declared` | array | Computed/reported value defined with its check in SERVICE.md and the Checks section above; null when it cannot be computed from the declared evidence. |
| `primary_key_coverage` | string | Computed/reported value defined with its check in SERVICE.md and the Checks section above; null when it cannot be computed from the declared evidence. |
| `query_patterns_count` | number | Computed/reported value defined with its check in SERVICE.md and the Checks section above; null when it cannot be computed from the declared evidence. |
| `indexes_count` | number | Computed/reported value defined with its check in SERVICE.md and the Checks section above; null when it cannot be computed from the declared evidence. |
| `uncovered_query_patterns` | array | Computed/reported value defined with its check in SERVICE.md and the Checks section above; null when it cannot be computed from the declared evidence. |
| `query_pattern_index_coverage` | string | Computed/reported value defined with its check in SERVICE.md and the Checks section above; null when it cannot be computed from the declared evidence. |
| `summary` | string | One-line pass/fail/missing count summary. |
| `stamp` | string | Plain-text rendering of the verdict, sections and summary. |

Computed numeric fields follow the fixed serialization rule stated in SERVICE.md (fixed-decimal strings where SERVICE.md specifies them), shared by both implementations so repeat calls are byte-identical.

### Verdict vocabulary

- **`DATABASE_DESIGN_SOUND`** — Every check passes (42 pass, 0 fail, 0 missing of 42 checks across four sections.) The declared evidence is complete and consistent with the bound skill's method, quality gates and red lines.
- **`DATABASE_DESIGN_NOT_SOUND`** — At least one check fails. The failing checks name the breached requirement and the evidence against it.
- **`INSUFFICIENT_EVIDENCE`** — Nothing failed, but at least one check is `missing`. The missing checks say exactly what to supply.

- **Section statuses:** `pass` (all checks in the section pass) · `fail` (at least one check in the section fails) · `insufficient_evidence` (no check fails but at least one is missing).
- **Per-check statuses:** `pass` · `fail` · `missing` (see Checks). No other per-check status occurs in the recorded responses; conditional checks that do not apply are recorded as `pass`, as documented above.
- **`computed_status` values:** `within_stated_limits_on_declared_evidence` (every computed check that could be completed held) · `outside_stated_limits_on_declared_evidence` (at least one computed check failed) · `null` (at least one computed check could not be completed).

### Errors

Only the shapes evidenced in the repo/gateway docs are listed; no other error payload is documented, and none should be assumed.

- **401 — unauthenticated:** missing or invalid key (USER-GUIDE.md error line). No error body shape is evidenced in the repo for 401; do not assume one. Fix: send a valid key as `Authorization: Bearer <key>`.
- **403 — scope:** the key lacks this atom's scope (USER-GUIDE.md error line). No error body shape is evidenced in the repo for 403; do not assume one. Fix: issue this atom's scope on your key via `POST /v1/keys`.
- **422 — `invalid_input`:** a field has the wrong type. Recorded body shape (verbatim from the recorded malformed run):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "normalization.normalized_to_3nf",
  "detail": "normalization.normalized_to_3nf must be a boolean"
}
```

  Here `field` is `normalization.normalized_to_3nf` and `detail` is "normalization.normalized_to_3nf must be a boolean". A 422 never carries a verdict.
- **429 — rate limit:** the per-key rate limit was exceeded (60/min, 10,000/day per key; USER-GUIDE.md and `contract.yaml`). No error body shape is evidenced in the repo for 429; do not assume one. Fix: slow down and retry within the limits.

### Rate limits + pricing status

- **Rate limits (from `contract.yaml`):** 60 requests per key per minute; 10,000 requests per key per day. Status note in the contract: SPEC default — the per-key rate limit is the capacity guard for open public usage; tuned per atom at build-out from measured production cost.
- **Pricing:** unit = deliverable; `pricing.rate` is null (rate_status: pending). **Free during trial — rate pending.** No price is set; per SERVICE.md, prices are set only from measured production cost per unit.

## Explanation

This atom is a deterministic completeness-and-consistency review of a **declared** database design record for one system — it designs no schema, chooses no store, runs no database, and reads no migration files or query plans. Its 42 checks across four sections cover schema and normalization, indexing and performance, integrity/transactions/security, and migrations and backups. Six checks are computed from the declared rows: the tables, query-pattern and index lists must be present and non-empty; every declared table must name a primary key and declare its constraints; every declared index must declare its columns; and every declared query pattern must name a supporting index that is actually declared on the same table. Two further checks are conditional on the record's own gate fields, following the skill's own scoping: denormalization reasons are required only when denormalization is declared, and an explicit consistency/availability trade-off is required only when a distributed store is declared in use; when the gate is not declared, the check passes as not applicable (recorded status `pass`, with evidence stating no such case was declared).

The verdict is decided mechanically. Each check ends `pass`, `fail`, or `missing` — there is no separate not-applicable status; a conditional check whose gate is absent passes as not applicable, as above. Any `fail` makes the verdict `DATABASE_DESIGN_NOT_SOUND`. Otherwise any `missing` makes it `INSUFFICIENT_EVIDENCE`. Only when all 42 checks pass is the verdict `DATABASE_DESIGN_SOUND`. The two coverage ratios are serialized as strings with exactly four decimal places by a fixed round-half-up rule shared by both implementations; counts are plain integers. The skill states no numeric threshold — no table or index count, no coverage percentage below completeness, no transaction duration, no backup frequency, no large-set size — so none is invented; quantities are computed and reported, and the only bar on computed rows is completeness over the caller's own declared rows.

A sound verdict means the declared record is complete and internally consistent — it does **not** mean the real schema is well designed or will perform. The atom does not verify that any declared control actually works: it never judges whether the chosen store is actually right, whether normalization is truly 3NF beyond the declaration, whether an index will actually be used by the planner, or whether declared types match real DDL. It inspects no EXPLAIN/ANALYZE plan — only that running it before and after is declared — and imposes no store-type or isolation-level vocabulary, because the skill names none as allowed values.

**Buyer / use context.** Buyers are teams and agents doing product schema design work who need the same bounded design review applied to every schema record on demand, per use, because schema mistakes are the most expensive to undo. The house's own product schema design work is an internal caller. What is sold is the review artifact — the verdict, its sections, checks and coverage ratios — never the underlying database knowledge itself.

## Role views

### For integrators (Users)

Integrate against the two endpoints above with one scoped key per atom. Treat HTTP 200 as a judged result (read `verdict`, then `sections`, then `checks`), HTTP 422 as a client-side type bug (read `field`/`detail`, fix, resubmit), and 401/403/429 as auth/scope/rate problems respectively. Cache nothing about a verdict across manifests: the verdict is a pure function of the manifest you sent, so re-send after any manifest change. The worked examples below are real recorded request/response pairs — use example 1 as your golden-path fixture and example 3 as your 422-handling fixture.

### For developers

Manifest authoring: declare facts, do not target the verdict — computed checks re-derive totals, coverage and vocabulary membership from the declared values themselves, so inconsistent declarations fail on their own arithmetic. Determinism: the core is deterministic (Python oracle and TypeScript port, parity-proven locally per SERVICE.md); the same manifest returns a byte-identical REST response, and MCP structured content equals the REST report core. Implementation pointers: `src/` holds the atom's core, `tests/` its test suite, `SERVICE.md` is the normative field/check specification, and `contract.yaml` the machine-readable contract (key namespace/prefix, rate limits, pricing status). Fixes land in the bound skill first and the atom re-deploys from the refined skill (contract binding rule R1).

### For ops

Endpoints: REST `POST /v1/database-design-review` and MCP `POST /mcp/database-design-review` on `https://atoms.pipavia.com` (gateway v1.1.0 in the recorded battery). Key scope is per atom — a 403 spike means clients are calling with keys that lack this atom's scope, not an outage. Rate limits: 60/min and 10,000/day per key; watch 429s per key before raising limits. Error monitoring: alert on 5xx (none are part of this atom's documented behavior) and on 422 rate by `field` (a rising 422 rate on one field usually means a client manifest generator changed shape). Status: live — release candidate, one-week RC soak to 2026-11-22; pricing is still pending (free during trial), so metering is for the cost ledger, not billing.

## Worked examples

Provenance: recorded 2026-11-16T02:43:55.180625+00:00 against gateway v1.1.0, external verification lane, source `verification/work/database-design-review/evidence.json`. Inputs and REST responses below are reproduced verbatim (pretty-printed with indent 2 only) and were verified mechanically against that evidence file after writing: each fenced block parses to a JSON value identical to the recorded value.

### Example 1 — Full-pass

Recorded expectation: HTTP 200, verdict `DATABASE_DESIGN_SOUND`.

Input (recorded `input`):

```json
{
  "design": "User profile system",
  "store_selection": {
    "access_patterns_mapped": true,
    "store_chosen_from_access_patterns": true,
    "relational_default_or_fit_justified": true
  },
  "tables": [
    {
      "name": "users",
      "primary_key": "id",
      "constraints_declared": true
    }
  ],
  "normalization": {
    "normalized_to_3nf": true,
    "denormalized": false,
    "denormalization_reasons_documented": false
  },
  "query_patterns": [
    {
      "name": "get_user",
      "table": "users",
      "supporting_index": "idx_users_id"
    }
  ],
  "indexes": [
    {
      "name": "idx_users_id",
      "table": "users",
      "columns": [
        "id"
      ]
    }
  ],
  "indexing": {
    "composite_column_order_equality_then_range": true,
    "covering_indexes_for_hot_queries": true,
    "write_cost_considered": true,
    "explain_analyze_before_and_after": true
  },
  "performance": {
    "measured_first": true,
    "n_plus_one_queries_addressed": true,
    "keyset_pagination_for_large_sets": true,
    "offset_pagination_at_scale_present": false,
    "connection_pooling_declared": true,
    "bounded_result_sets": true,
    "cache_deliberate_with_honest_invalidation": true
  },
  "integrity": {
    "constraints_enforce_invariants": true,
    "appropriate_types_used": true,
    "money_stored_as_float": false
  },
  "transactions": {
    "isolation_level_and_anomalies_known": true,
    "transactions_kept_short": true,
    "writes_idempotent_where_retries_possible": true,
    "distributed_store_used": false,
    "consistency_availability_tradeoff_explicit": false
  },
  "security": {
    "parametrized_queries_only": true,
    "string_concatenated_sql_present": false,
    "least_privilege_users_per_service": true,
    "shared_superuser_present": false,
    "encryption_at_rest": true
  },
  "migrations": {
    "forward_only": true,
    "past_migrations_edited": false,
    "expand_contract_pattern_used": true,
    "big_bang_schema_swap_present": false
  },
  "backups": {
    "backups_scheduled": true,
    "restores_tested_on_schedule": true,
    "untested_backup_trusted": false
  }
}
```

REST response (recorded `response_text`):

```json
{
  "service": "database-design-review",
  "atom_version": "0.1.0",
  "design": "User profile system",
  "verdict": "DATABASE_DESIGN_SOUND",
  "sections": {
    "schema_and_normalization": "pass",
    "indexing_and_performance": "pass",
    "integrity_transactions_and_security": "pass",
    "migrations_and_backups": "pass"
  },
  "checks": [
    {
      "section": "schema_and_normalization",
      "check": "access_patterns_mapped_before_store_choice",
      "status": "pass",
      "evidence": "choosing a store: the access patterns — reads vs writes, query shapes, consistency needs — are mapped before a store is chosen"
    },
    {
      "section": "schema_and_normalization",
      "check": "store_chosen_from_access_patterns",
      "status": "pass",
      "evidence": "choosing a store: the store is picked for how the data is actually used — the declared access patterns, not the hype"
    },
    {
      "section": "schema_and_normalization",
      "check": "relational_default_or_fit_justified",
      "status": "pass",
      "evidence": "choosing a store: relational is the default for anything with relationships and integrity needs, and any document/KV/graph choice is justified by the access pattern genuinely fitting"
    },
    {
      "section": "schema_and_normalization",
      "check": "tables_declared",
      "status": "pass",
      "evidence": "relational design: the declared design record names its tables — the tables list is present and non-empty"
    },
    {
      "section": "schema_and_normalization",
      "check": "every_table_has_primary_key_named",
      "status": "pass",
      "evidence": "relational design: every declared table row names a primary key"
    },
    {
      "section": "schema_and_normalization",
      "check": "every_table_declares_constraints",
      "status": "pass",
      "evidence": "relational design: every declared table row declares its constraints — NOT NULL, UNIQUE, FK, CHECK — so the database enforces invariants"
    },
    {
      "section": "schema_and_normalization",
      "check": "normalized_to_3nf_declared",
      "status": "pass",
      "evidence": "relational design: the design is normalized to 3NF first"
    },
    {
      "section": "schema_and_normalization",
      "check": "denormalization_reasons_documented_when_denormalized",
      "status": "pass",
      "evidence": "no denormalization declared"
    },
    {
      "section": "indexing_and_performance",
      "check": "query_patterns_declared",
      "status": "pass",
      "evidence": "indexing: the declared design record names its query patterns — the query patterns list is present and non-empty"
    },
    {
      "section": "indexing_and_performance",
      "check": "indexes_declared",
      "status": "pass",
      "evidence": "indexing: the declared design record names its indexes — the indexes list is present and non-empty"
    },
    {
      "section": "indexing_and_performance",
      "check": "every_index_declares_columns",
      "status": "pass",
      "evidence": "indexing: every declared index row declares its columns"
    },
    {
      "section": "indexing_and_performance",
      "check": "every_query_pattern_has_matching_index",
      "status": "pass",
      "evidence": "indexing: every declared query pattern names a supporting index that is declared, on the same table — indexes are for the actual query patterns"
    },
    {
      "section": "indexing_and_performance",
      "check": "composite_index_column_order_equality_then_range",
      "status": "pass",
      "evidence": "indexing: composite index column order matters — equality columns first, then range"
    },
    {
      "section": "indexing_and_performance",
      "check": "covering_indexes_for_hot_queries",
      "status": "pass",
      "evidence": "indexing: covering indexes are aimed for on hot queries"
    },
    {
      "section": "indexing_and_performance",
      "check": "index_write_cost_considered",
      "status": "pass",
      "evidence": "indexing: the write cost is considered — every index taxes writes"
    },
    {
      "section": "indexing_and_performance",
      "check": "explain_analyze_before_and_after",
      "status": "pass",
      "evidence": "indexing: EXPLAIN / ANALYZE is run before and after — measure, don't guess"
    },
    {
      "section": "indexing_and_performance",
      "check": "performance_measured_first",
      "status": "pass",
      "evidence": "performance: measure first"
    },
    {
      "section": "indexing_and_performance",
      "check": "n_plus_one_queries_addressed",
      "status": "pass",
      "evidence": "performance: N+1 queries are killed"
    },
    {
      "section": "indexing_and_performance",
      "check": "keyset_pagination_for_large_sets",
      "status": "pass",
      "evidence": "performance: keyset (cursor) pagination is preferred for large sets"
    },
    {
      "section": "indexing_and_performance",
      "check": "no_offset_pagination_at_scale",
      "status": "pass",
      "evidence": "anti-pattern: no OFFSET pagination at scale"
    },
    {
      "section": "indexing_and_performance",
      "check": "connection_pooling_declared",
      "status": "pass",
      "evidence": "performance: connection pooling is declared"
    },
    {
      "section": "indexing_and_performance",
      "check": "bounded_result_sets",
      "status": "pass",
      "evidence": "performance: result sets are bounded"
    },
    {
      "section": "indexing_and_performance",
      "check": "cache_deliberate_and_invalidation_honest",
      "status": "pass",
      "evidence": "performance: caching is deliberate and invalidation is honest"
    },
    {
      "section": "integrity_transactions_and_security",
      "check": "constraints_enforce_invariants",
      "status": "pass",
      "evidence": "relational design: constraints are data integrity — NOT NULL, UNIQUE, FK, CHECK — and the database enforces invariants"
    },
    {
      "section": "integrity_transactions_and_security",
      "check": "appropriate_types_used",
      "status": "pass",
      "evidence": "relational design: the right types are used — timestamps with time zone, numeric for money, enums/lookup tables for categories"
    },
    {
      "section": "integrity_transactions_and_security",
      "check": "money_not_stored_as_float",
      "status": "pass",
      "evidence": "anti-pattern: money is not stored as float"
    },
    {
      "section": "integrity_transactions_and_security",
      "check": "isolation_level_and_anomalies_known",
      "status": "pass",
      "evidence": "transactions & consistency: the isolation level and what anomalies it permits are known"
    },
    {
      "section": "integrity_transactions_and_security",
      "check": "transactions_kept_short",
      "status": "pass",
      "evidence": "transactions & consistency: transactions are kept short"
    },
    {
      "section": "integrity_transactions_and_security",
      "check": "writes_idempotent_where_retries_possible",
      "status": "pass",
      "evidence": "transactions & consistency: writes are designed to be idempotent where retries are possible"
    },
    {
      "section": "integrity_transactions_and_security",
      "check": "consistency_availability_tradeoff_explicit_when_distributed",
      "status": "pass",
      "evidence": "no distributed store declared in use"
    },
    {
      "section": "integrity_transactions_and_security",
      "check": "parametrized_queries_only",
      "status": "pass",
      "evidence": "security: parametrized queries only — user input is never concatenated"
    },
    {
      "section": "integrity_transactions_and_security",
      "check": "no_string_concatenated_sql",
      "status": "pass",
      "evidence": "anti-pattern: no string-concatenated SQL"
    },
    {
      "section": "integrity_transactions_and_security",
      "check": "least_privilege_users_per_service",
      "status": "pass",
      "evidence": "security: least-privilege database users per service"
    },
    {
      "section": "integrity_transactions_and_security",
      "check": "no_shared_superuser",
      "status": "pass",
      "evidence": "security: no shared superuser"
    },
    {
      "section": "integrity_transactions_and_security",
      "check": "encryption_at_rest_declared",
      "status": "pass",
      "evidence": "security: encryption at rest is declared"
    },
    {
      "section": "migrations_and_backups",
      "check": "migrations_forward_only",
      "status": "pass",
      "evidence": "migrations: migrations are forward-only"
    },
    {
      "section": "migrations_and_backups",
      "check": "no_past_migrations_edited",
      "status": "pass",
      "evidence": "migrations / anti-pattern: past migrations are never edited — reversal is a new migration"
    },
    {
      "section": "migrations_and_backups",
      "check": "expand_contract_pattern_used",
      "status": "pass",
      "evidence": "migrations: backward-compatible deploys use expand/contract — add new, backfill, switch reads, stop writes to old, drop old"
    },
    {
      "section": "migrations_and_backups",
      "check": "no_big_bang_schema_swap",
      "status": "pass",
      "evidence": "migrations: no big-bang schema swaps against live traffic"
    },
    {
      "section": "migrations_and_backups",
      "check": "backups_scheduled",
      "status": "pass",
      "evidence": "backups: backups are scheduled"
    },
    {
      "section": "migrations_and_backups",
      "check": "restores_tested_on_schedule",
      "status": "pass",
      "evidence": "backups: restores are tested on a schedule — a backup you haven't restored is a hope, not a backup"
    },
    {
      "section": "migrations_and_backups",
      "check": "untested_backup_not_trusted",
      "status": "pass",
      "evidence": "anti-pattern: an untested backup is not trusted"
    }
  ],
  "computed_status": "within_stated_limits_on_declared_evidence",
  "tables_count": 1,
  "tables_without_primary_key": [],
  "tables_without_constraints_declared": [],
  "primary_key_coverage": "1.0000",
  "query_patterns_count": 1,
  "indexes_count": 1,
  "uncovered_query_patterns": [],
  "query_pattern_index_coverage": "1.0000",
  "summary": "42 pass, 0 fail, 0 missing of 42 checks across four sections.",
  "stamp": "DATABASE DESIGN REVIEW\ndesign: User profile system\nVERDICT: DATABASE_DESIGN_SOUND\n  schema_and_normalization             pass\n  indexing_and_performance             pass\n  integrity_transactions_and_security  pass\n  migrations_and_backups               pass\n42 pass, 0 fail, 0 missing of 42 checks across four sections."
}
```

### Example 2 — Violations

Recorded expectation: HTTP 200, verdict `DATABASE_DESIGN_NOT_SOUND`.

Input (recorded `input`):

```json
{
  "design": "User profile system",
  "store_selection": {
    "access_patterns_mapped": true,
    "store_chosen_from_access_patterns": true,
    "relational_default_or_fit_justified": true
  },
  "tables": [
    {
      "name": "users",
      "primary_key": "",
      "constraints_declared": false
    }
  ],
  "normalization": {
    "normalized_to_3nf": true,
    "denormalized": false,
    "denormalization_reasons_documented": false
  },
  "query_patterns": [
    {
      "name": "get_user",
      "table": "users",
      "supporting_index": "idx_users_id"
    }
  ],
  "indexes": [
    {
      "name": "idx_users_id",
      "table": "users",
      "columns": [
        "id"
      ]
    }
  ],
  "indexing": {
    "composite_column_order_equality_then_range": true,
    "covering_indexes_for_hot_queries": true,
    "write_cost_considered": true,
    "explain_analyze_before_and_after": true
  },
  "performance": {
    "measured_first": true,
    "n_plus_one_queries_addressed": true,
    "keyset_pagination_for_large_sets": true,
    "offset_pagination_at_scale_present": true,
    "connection_pooling_declared": true,
    "bounded_result_sets": true,
    "cache_deliberate_with_honest_invalidation": true
  },
  "integrity": {
    "constraints_enforce_invariants": true,
    "appropriate_types_used": true,
    "money_stored_as_float": true
  },
  "transactions": {
    "isolation_level_and_anomalies_known": true,
    "transactions_kept_short": true,
    "writes_idempotent_where_retries_possible": true,
    "distributed_store_used": false,
    "consistency_availability_tradeoff_explicit": false
  },
  "security": {
    "parametrized_queries_only": true,
    "string_concatenated_sql_present": true,
    "least_privilege_users_per_service": true,
    "shared_superuser_present": true,
    "encryption_at_rest": true
  },
  "migrations": {
    "forward_only": true,
    "past_migrations_edited": true,
    "expand_contract_pattern_used": true,
    "big_bang_schema_swap_present": false
  },
  "backups": {
    "backups_scheduled": true,
    "restores_tested_on_schedule": true,
    "untested_backup_trusted": true
  }
}
```

REST response (recorded `response_text`):

```json
{
  "service": "database-design-review",
  "atom_version": "0.1.0",
  "design": "User profile system",
  "verdict": "DATABASE_DESIGN_NOT_SOUND",
  "sections": {
    "schema_and_normalization": "fail",
    "indexing_and_performance": "fail",
    "integrity_transactions_and_security": "fail",
    "migrations_and_backups": "fail"
  },
  "checks": [
    {
      "section": "schema_and_normalization",
      "check": "access_patterns_mapped_before_store_choice",
      "status": "pass",
      "evidence": "choosing a store: the access patterns — reads vs writes, query shapes, consistency needs — are mapped before a store is chosen"
    },
    {
      "section": "schema_and_normalization",
      "check": "store_chosen_from_access_patterns",
      "status": "pass",
      "evidence": "choosing a store: the store is picked for how the data is actually used — the declared access patterns, not the hype"
    },
    {
      "section": "schema_and_normalization",
      "check": "relational_default_or_fit_justified",
      "status": "pass",
      "evidence": "choosing a store: relational is the default for anything with relationships and integrity needs, and any document/KV/graph choice is justified by the access pattern genuinely fitting"
    },
    {
      "section": "schema_and_normalization",
      "check": "tables_declared",
      "status": "pass",
      "evidence": "relational design: the declared design record names its tables — the tables list is present and non-empty"
    },
    {
      "section": "schema_and_normalization",
      "check": "every_table_has_primary_key_named",
      "status": "fail",
      "evidence": "relational design: every declared table row names a primary key"
    },
    {
      "section": "schema_and_normalization",
      "check": "every_table_declares_constraints",
      "status": "fail",
      "evidence": "relational design: every declared table row declares its constraints — NOT NULL, UNIQUE, FK, CHECK — so the database enforces invariants"
    },
    {
      "section": "schema_and_normalization",
      "check": "normalized_to_3nf_declared",
      "status": "pass",
      "evidence": "relational design: the design is normalized to 3NF first"
    },
    {
      "section": "schema_and_normalization",
      "check": "denormalization_reasons_documented_when_denormalized",
      "status": "pass",
      "evidence": "no denormalization declared"
    },
    {
      "section": "indexing_and_performance",
      "check": "query_patterns_declared",
      "status": "pass",
      "evidence": "indexing: the declared design record names its query patterns — the query patterns list is present and non-empty"
    },
    {
      "section": "indexing_and_performance",
      "check": "indexes_declared",
      "status": "pass",
      "evidence": "indexing: the declared design record names its indexes — the indexes list is present and non-empty"
    },
    {
      "section": "indexing_and_performance",
      "check": "every_index_declares_columns",
      "status": "pass",
      "evidence": "indexing: every declared index row declares its columns"
    },
    {
      "section": "indexing_and_performance",
      "check": "every_query_pattern_has_matching_index",
      "status": "pass",
      "evidence": "indexing: every declared query pattern names a supporting index that is declared, on the same table — indexes are for the actual query patterns"
    },
    {
      "section": "indexing_and_performance",
      "check": "composite_index_column_order_equality_then_range",
      "status": "pass",
      "evidence": "indexing: composite index column order matters — equality columns first, then range"
    },
    {
      "section": "indexing_and_performance",
      "check": "covering_indexes_for_hot_queries",
      "status": "pass",
      "evidence": "indexing: covering indexes are aimed for on hot queries"
    },
    {
      "section": "indexing_and_performance",
      "check": "index_write_cost_considered",
      "status": "pass",
      "evidence": "indexing: the write cost is considered — every index taxes writes"
    },
    {
      "section": "indexing_and_performance",
      "check": "explain_analyze_before_and_after",
      "status": "pass",
      "evidence": "indexing: EXPLAIN / ANALYZE is run before and after — measure, don't guess"
    },
    {
      "section": "indexing_and_performance",
      "check": "performance_measured_first",
      "status": "pass",
      "evidence": "performance: measure first"
    },
    {
      "section": "indexing_and_performance",
      "check": "n_plus_one_queries_addressed",
      "status": "pass",
      "evidence": "performance: N+1 queries are killed"
    },
    {
      "section": "indexing_and_performance",
      "check": "keyset_pagination_for_large_sets",
      "status": "pass",
      "evidence": "performance: keyset (cursor) pagination is preferred for large sets"
    },
    {
      "section": "indexing_and_performance",
      "check": "no_offset_pagination_at_scale",
      "status": "fail",
      "evidence": "anti-pattern: no OFFSET pagination at scale"
    },
    {
      "section": "indexing_and_performance",
      "check": "connection_pooling_declared",
      "status": "pass",
      "evidence": "performance: connection pooling is declared"
    },
    {
      "section": "indexing_and_performance",
      "check": "bounded_result_sets",
      "status": "pass",
      "evidence": "performance: result sets are bounded"
    },
    {
      "section": "indexing_and_performance",
      "check": "cache_deliberate_and_invalidation_honest",
      "status": "pass",
      "evidence": "performance: caching is deliberate and invalidation is honest"
    },
    {
      "section": "integrity_transactions_and_security",
      "check": "constraints_enforce_invariants",
      "status": "pass",
      "evidence": "relational design: constraints are data integrity — NOT NULL, UNIQUE, FK, CHECK — and the database enforces invariants"
    },
    {
      "section": "integrity_transactions_and_security",
      "check": "appropriate_types_used",
      "status": "pass",
      "evidence": "relational design: the right types are used — timestamps with time zone, numeric for money, enums/lookup tables for categories"
    },
    {
      "section": "integrity_transactions_and_security",
      "check": "money_not_stored_as_float",
      "status": "fail",
      "evidence": "anti-pattern: money is not stored as float"
    },
    {
      "section": "integrity_transactions_and_security",
      "check": "isolation_level_and_anomalies_known",
      "status": "pass",
      "evidence": "transactions & consistency: the isolation level and what anomalies it permits are known"
    },
    {
      "section": "integrity_transactions_and_security",
      "check": "transactions_kept_short",
      "status": "pass",
      "evidence": "transactions & consistency: transactions are kept short"
    },
    {
      "section": "integrity_transactions_and_security",
      "check": "writes_idempotent_where_retries_possible",
      "status": "pass",
      "evidence": "transactions & consistency: writes are designed to be idempotent where retries are possible"
    },
    {
      "section": "integrity_transactions_and_security",
      "check": "consistency_availability_tradeoff_explicit_when_distributed",
      "status": "pass",
      "evidence": "no distributed store declared in use"
    },
    {
      "section": "integrity_transactions_and_security",
      "check": "parametrized_queries_only",
      "status": "pass",
      "evidence": "security: parametrized queries only — user input is never concatenated"
    },
    {
      "section": "integrity_transactions_and_security",
      "check": "no_string_concatenated_sql",
      "status": "fail",
      "evidence": "anti-pattern: no string-concatenated SQL"
    },
    {
      "section": "integrity_transactions_and_security",
      "check": "least_privilege_users_per_service",
      "status": "pass",
      "evidence": "security: least-privilege database users per service"
    },
    {
      "section": "integrity_transactions_and_security",
      "check": "no_shared_superuser",
      "status": "fail",
      "evidence": "security: no shared superuser"
    },
    {
      "section": "integrity_transactions_and_security",
      "check": "encryption_at_rest_declared",
      "status": "pass",
      "evidence": "security: encryption at rest is declared"
    },
    {
      "section": "migrations_and_backups",
      "check": "migrations_forward_only",
      "status": "pass",
      "evidence": "migrations: migrations are forward-only"
    },
    {
      "section": "migrations_and_backups",
      "check": "no_past_migrations_edited",
      "status": "fail",
      "evidence": "migrations / anti-pattern: past migrations are never edited — reversal is a new migration"
    },
    {
      "section": "migrations_and_backups",
      "check": "expand_contract_pattern_used",
      "status": "pass",
      "evidence": "migrations: backward-compatible deploys use expand/contract — add new, backfill, switch reads, stop writes to old, drop old"
    },
    {
      "section": "migrations_and_backups",
      "check": "no_big_bang_schema_swap",
      "status": "pass",
      "evidence": "migrations: no big-bang schema swaps against live traffic"
    },
    {
      "section": "migrations_and_backups",
      "check": "backups_scheduled",
      "status": "pass",
      "evidence": "backups: backups are scheduled"
    },
    {
      "section": "migrations_and_backups",
      "check": "restores_tested_on_schedule",
      "status": "pass",
      "evidence": "backups: restores are tested on a schedule — a backup you haven't restored is a hope, not a backup"
    },
    {
      "section": "migrations_and_backups",
      "check": "untested_backup_not_trusted",
      "status": "fail",
      "evidence": "anti-pattern: an untested backup is not trusted"
    }
  ],
  "computed_status": "outside_stated_limits_on_declared_evidence",
  "tables_count": 1,
  "tables_without_primary_key": [
    "users"
  ],
  "tables_without_constraints_declared": [
    "users"
  ],
  "primary_key_coverage": "0.0000",
  "query_patterns_count": 1,
  "indexes_count": 1,
  "uncovered_query_patterns": [],
  "query_pattern_index_coverage": "1.0000",
  "summary": "34 pass, 8 fail, 0 missing of 42 checks across four sections.",
  "stamp": "DATABASE DESIGN REVIEW\ndesign: User profile system\nVERDICT: DATABASE_DESIGN_NOT_SOUND\n  schema_and_normalization             fail\n  indexing_and_performance             fail\n  integrity_transactions_and_security  fail\n  migrations_and_backups               fail\n34 pass, 8 fail, 0 missing of 42 checks across four sections."
}
```

### Example 3 — Malformed

Recorded expectation: HTTP 422, error `invalid_input` — never a verdict.

Input (recorded `input`):

```json
{
  "normalization": {
    "normalized_to_3nf": "should_be_boolean"
  }
}
```

REST response (recorded `response_text`):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "normalization.normalized_to_3nf",
  "detail": "normalization.normalized_to_3nf must be a boolean"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present | Yes — Tutorial, How-to guides, Reference, Explanation all present |
| Output format | CommonMark markdown |
| Role views present | Integrators (Users): Yes · Developers: Yes · Ops: Yes · Regulators: N/A — although the record carries security declarations (parametrized queries, least privilege, encryption at rest), the verdict is a design-record completeness review, not a security-compliance determination; SERVICE.md names no regulation and claims no audit-evidence status. |
| Checks named: documented / recorded | 42 / 42 |
| Verdict vocabulary complete | Yes — all 3 verdict values (DATABASE_DESIGN_NOT_SOUND, DATABASE_DESIGN_SOUND, INSUFFICIENT_EVIDENCE), section statuses, per-check statuses and `computed_status` values listed |
| Input reference typed | Yes — 50 fields, each with a type, grouped as SERVICE.md groups them |
| Worked examples verbatim-verified | Yes — full-pass / violations / malformed inputs and REST responses parsed and compared as JSON values against `verification/work/database-design-review/evidence.json` after writing |
