# SQL schema & query engineering pack — documentation

**SQL schema & query engineering pack** · slug `sql-schema-query-engineering-pack` · deliverable type DELIVERABLE · atom version 0.1.0 · status: live (atoms-gateway v1.1.0, deployment ac6ddba696934ceb84596876507fc08c; RC soak to 2026-11-22).

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md) · Service definition: [SERVICE.md](SERVICE.md) · Machine contract: [contract.yaml](contract.yaml).

This atom audits a caller-declared SQL schema + query engineering record for completeness and consistency only. It surfaces two faces: REST `POST /v1/sql-schema-query-engineering-pack` and MCP `POST /mcp/sql-schema-query-engineering-pack`, tool name `sql_schema_query_engineering_pack`. It connects to no database, executes no SQL, runs no `EXPLAIN ANALYZE`, and inspects no repository, migration file or query plan — see Explanation.

This document follows the house documentation standard (AppDoc Studio standard, process line N-10): Diátaxis architecture (tutorial / how-to / reference / explanation), CommonMark markdown output, and role views per audience. Every worked example below is a real recorded trial run from the external verification battery — see the provenance line under Worked examples.

> **Status discrepancy named:** SERVICE.md still says status: **built-locally — NOT deployed** — “no endpoint is live”, and contract.yaml still says status: **scaffolded**. That is stale. TEST-REPORT.md and the recorded evidence in `verification/work/sql-schema-query-engineering-pack/evidence.json` show the atom live on atoms-gateway v1.1.0 (deployment ac6ddba696934ceb84596876507fc08c). This document follows the evidenced live state above. See Discrepancies.

## Tutorial

A first call, walked through step by step. The walkthrough follows the recorded full-pass trial run for this atom (the `project` "test-project"); the verbatim request and response are reproduced under [Worked examples](#worked-examples), example 1.

**Step 1 — Get a key.** Sign up at https://atoms.pipavia.com (`POST /v1/signup` with your email; a sign-in link is emailed to you), open the link to mint your session, then issue a gateway key for this atom: `POST /v1/keys` with `{"atom": "sql-schema-query-engineering-pack"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom. Send the key as `Authorization: Bearer <key>` on every call.

**Step 2 — Assemble the SQL schema + query engineering manifest.** You declare a SQL schema + query engineering record for one database and its application queries, made from the system's actual practice — the atom audits the declared record, it does not connect to any database (see Explanation). The recorded full-pass manifest declares the project `test-project`: all four `schema_design` flags `true` (precise column types, NOT NULL by default with nullable exceptions explicit, CHECK and foreign-key constraints in the database, and consistent snake_case naming); one table `users` declaring a primary key, schema constraints and the NOT NULL default all `true`; all three `index_design` flags `true` (indexes derived from real access patterns, composite column order following query order, and write cost measured before adding); one index `idx_users_email` on `users` with columns `["email"]`; one query `get_user_by_email` on `users` with `supporting_index_name` `idx_users_email` and all four per-query flags `true` (explicit column list, bounded or paginated, parameterized inputs, and N+1 avoidance); all five `query_practice` flags `true` (set-based queries, CTEs or window functions for complex reads, large results paginated, related data joined/batched/preloaded, and query-count tests verifying no N+1); all three `transactions` flags `true`; all three `sql_safety` flags `true`; all four `migrations` flags `true`; both `performance_evidence` flags `true`; and all four `sql_red_lines` flags `false` (no string-concatenated SQL with user input, no unreviewed migration on live data, no direct-to-production schema edit, and no unbounded write without WHERE).

**Step 3 — Send it.** `POST https://atoms.pipavia.com/v1/sql-schema-query-engineering-pack` with the manifest as the JSON body and the `Authorization` header. The same manifest in always produces the same verdict out: the core is deterministic, and the recorded battery proves determinism (byte-identical repeat responses) and REST/MCP parity — see TEST-REPORT.md.

**Step 4 — Read the verdict.** The recorded run returned HTTP 200 with verdict `SQL_SCHEMA_QUERY_ENGINEERING_PACK_READY`: "44 pass, 0 fail, 0 missing of 44 checks across eight sections." Every section reports `pass`, and the response carries the full per-check list plus the computed outputs described in the Reference. `computed_status` is `within_stated_limits_on_declared_evidence`, `tables_count`, `indexes_count` and `queries_count` are each 1, all thirteen row-name / duplicate lists are empty (`[]`), and all nine coverage ratios are each `"1.000000"`.

**Step 5 — Act on it.** A positive verdict means the declared record is complete and internally consistent — nothing more (see Explanation for what the atom does not certify). If the verdict had been `SQL_SCHEMA_QUERY_ENGINEERING_PACK_NOT_READY` or `INSUFFICIENT_EVIDENCE`, the failing or missing checks would name exactly what to fix or supply — see the how-to guide below.

## How-to guides

### Get a key and call via REST

1. Sign up: `POST https://atoms.pipavia.com/v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "sql-schema-query-engineering-pack"}`.
3. Call: `POST https://atoms.pipavia.com/v1/sql-schema-query-engineering-pack` — body = the manifest object (see Input reference); header `Authorization: Bearer <key>`.
4. Read the JSON response: `verdict`, `sections`, `checks`, the computed outputs, `summary` and `stamp` (see Output format). A failed call is not metered; a delivered artifact is.

### Call via MCP

1. Use the same gateway key. Connect your MCP client to `POST https://atoms.pipavia.com/mcp/sql-schema-query-engineering-pack` with the `Authorization: Bearer <key>` header.
2. Call `tools/call` with tool name `sql_schema_query_engineering_pack`; `arguments` = the manifest object, exactly as in the REST body.
3. The tool result's `structuredContent` is the same artifact the REST face returns (parity is proven in the recorded battery); `content` carries the same JSON as text.

### Read a failing verdict and fix the manifest

A verdict of `SQL_SCHEMA_QUERY_ENGINEERING_PACK_NOT_READY` means at least one check has status `fail`: a field is present but false / invalid, or a declared row breaks a computed rule. A verdict of `INSUFFICIENT_EVIDENCE` means nothing failed but at least one check has status `missing`: the field or rows it reads are absent. Worked example 2 under Worked examples is the recorded violations run for this atom — 3 checks fail: `every_sql_table_declares_primary_key`, `every_sql_table_name_is_snake_case` and `every_declared_sql_query_has_matching_declared_index`, and the summary reads "41 pass, 3 fail, 0 missing of 44 checks across eight sections."

1. Find the checks with status `fail` (or `missing`) in the `checks` array; each names its section and states the requirement it enforces in its `evidence` text.
2. For a `fail`: correct the declared value or the offending row in your manifest — the computed outputs name the offending rows and quantities (in the recorded violations run, `tables[0].name` is declared `InvalidTableName` and `tables[0].primary_key_declared` is declared `false`, failing `every_sql_table_name_is_snake_case` and `every_sql_table_declares_primary_key`, with `tables_without_primary_key` naming `["InvalidTableName"]`, `tables_with_non_snake_case_names` naming `["InvalidTableName"]` and `table_primary_key_coverage` `"0.000000"`; and `queries[0].supporting_index_name` is declared `non_existent_index`, failing `every_declared_sql_query_has_matching_declared_index`, with `uncovered_sql_queries` naming `["get_user_by_email"]` and `query_index_support_coverage` `"0.000000"`; the other seven coverage ratios are `"1.000000"`, sections `schema_constraints_and_naming` and `index_design_from_access_patterns` report `fail`, the other six sections report `pass`, and `computed_status` is `outside_stated_limits_on_declared_evidence`). For a `missing`: supply the absent field or list; do not guess a value — an absent field is missing evidence, a present-but-false field is a fail, and the two verdicts are different.
3. Resubmit the corrected manifest. Because the core is deterministic, the same manifest always returns the same verdict, so a fix is proven by the changed verdict, not by retrying.

### Handle a 422 invalid_input

A 422 is not a verdict: the manifest failed type validation before evaluation (for example a number where a string is required) and no checks ran. The body names the field and the expected type:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "project",
  "detail": "project must be a string"
}
```

(This is the recorded malformed run for this atom — Worked examples, example 3.) Fix the type of the named `field` in your manifest — the Input reference below gives every field's type — and resubmit until the call returns 200.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/sql-schema-query-engineering-pack` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/sql-schema-query-engineering-pack` — tool name `sql_schema_query_engineering_pack`; `tools/call` arguments = the manifest object; same `Authorization` header.
- **Key scope:** `sql_schema_query_engineering_pack` (this atom only — a key for one atom never verifies for another; the scope is granted on your gateway key when you issue it for this atom).

### Input reference

One JSON manifest per call. Types are as stated in SERVICE.md's field table: **all fields are booleans unless a type is noted in the field's row**, and `project` and the row `name` / `table` / `supporting_index_name` fields are noted as strings, `tables`, `indexes` and `queries` as lists there, and `indexes[].columns` as a list of strings there. Where SERVICE.md states no type — the section container objects (`schema_design`, `index_design`, `query_practice`, `transactions`, `sql_safety`, `migrations`, `performance_evidence`, `sql_red_lines`) and the table-, index- and query-row objects (`tables[]`, `indexes[]`, `queries[]`) — the type below is grounded in the recorded evidence inputs (and, for the top-level containers and the `tables` / `indexes` / `queries` lists, in the MCP `inputSchema` recorded in evidence.json, which types the containers `object` and those lists as `array`); that grounding is said so in the Notes column. A field **absent** = evidence missing (the check that reads it reports `missing`, counting toward `INSUFFICIENT_EVIDENCE`); a field present but false / invalid = the check fails (counting toward `SQL_SCHEMA_QUERY_ENGINEERING_PACK_NOT_READY`). A present value of the wrong type is rejected before evaluation with a 422 (see Errors). Fields are grouped below by the section that reads them, exactly as SERVICE.md groups them.

#### Carried into the output (not itself checked)

| Field | Type | Notes |
|---|---|---|
| `project` | string | Carried into the verdict output, not itself checked (type stated in SERVICE.md) |

#### Read by: schema_constraints_and_naming

| Field | Type | Notes |
|---|---|---|
| `schema_design` | object | The schema-design section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `schema_design.precise_column_types_declared` | boolean | — |
| `schema_design.not_null_default_with_nullable_exceptions_explicit` | boolean | — |
| `schema_design.check_and_foreign_key_constraints_in_database` | boolean | — |
| `schema_design.snake_case_naming_consistent` | boolean | — |
| `tables` | list | list of table-row objects, each with the entry fields below; computed, see below (type stated in SERVICE.md; recorded MCP `inputSchema` types it `array`) |
| `tables[]` | object | One declared table row. SERVICE.md states no type for the row object itself; type grounded in the recorded evidence inputs |
| `tables[].name` | string | Names the row in the computed outputs; also computed for snake_case and duplication (type stated in SERVICE.md) |
| `tables[].primary_key_declared` | boolean | Must be `true` per row (type stated in SERVICE.md) |
| `tables[].schema_constraints_declared` | boolean | Must be `true` per row (type stated in SERVICE.md) |
| `tables[].not_null_default_declared` | boolean | Must be `true` per row (type stated in SERVICE.md) |

#### Read by: index_design_from_access_patterns

| Field | Type | Notes |
|---|---|---|
| `index_design` | object | The index-design section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `index_design.indexes_derived_from_real_access_patterns` | boolean | — |
| `index_design.composite_index_column_order_follows_query_order` | boolean | — |
| `index_design.index_write_cost_measured_before_adding` | boolean | — |
| `indexes` | list | list of index-row objects, each with the entry fields below; computed, see below (type stated in SERVICE.md; recorded MCP `inputSchema` types it `array`) |
| `indexes[]` | object | One declared index row. SERVICE.md states no type for the row object itself; type grounded in the recorded evidence inputs |
| `indexes[].name` | string | The name a query's `supporting_index_name` must equal to match (type stated in SERVICE.md) |
| `indexes[].table` | string | Must equal the query's declared table to match (type stated in SERVICE.md) |
| `indexes[].columns` | list of strings | Must be present and non-empty per row (type stated in SERVICE.md) |
| `queries[].table` | string | A supporting index matches only on the same declared table (type stated in SERVICE.md; the `queries` list and row object are introduced in full under query_construction_pagination_and_n_plus_one_prevention below) |
| `queries[].supporting_index_name` | string | Must name a declared index on the same table (type stated in SERVICE.md) |

#### Read by: query_construction_pagination_and_n_plus_one_prevention

| Field | Type | Notes |
|---|---|---|
| `queries` | list | list of query-row objects, each with the entry fields below and the fields grouped under index_design_from_access_patterns and sql_safety_and_bounded_writes; computed, see below (type stated in SERVICE.md; recorded MCP `inputSchema` types it `array`) |
| `queries[]` | object | One declared query row. SERVICE.md states no type for the row object itself; type grounded in the recorded evidence inputs |
| `queries[].name` | string | Names the row in the computed outputs (type stated in SERVICE.md) |
| `queries[].explicit_column_list_declared` | boolean | Must be `true` per row (type stated in SERVICE.md) |
| `queries[].bounded_or_paginated_declared` | boolean | Must be `true` per row (type stated in SERVICE.md) |
| `queries[].n_plus_one_avoidance_declared` | boolean | Must be `true` per row (type stated in SERVICE.md) |
| `query_practice` | object | The query-practice section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `query_practice.set_based_queries_preferred` | boolean | — |
| `query_practice.complex_reads_use_ctes_or_window_functions` | boolean | — |
| `query_practice.large_results_paginated` | boolean | — |
| `query_practice.related_data_joined_batched_or_preloaded` | boolean | — |
| `query_practice.query_count_tests_verify_no_n_plus_one` | boolean | — |

#### Read by: transactions_and_concurrency

| Field | Type | Notes |
|---|---|---|
| `transactions` | object | The transactions section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `transactions.transactions_kept_short` | boolean | — |
| `transactions.isolation_level_known` | boolean | — |
| `transactions.deadlock_retry_with_backoff_declared` | boolean | — |

#### Read by: sql_safety_and_bounded_writes

| Field | Type | Notes |
|---|---|---|
| `sql_safety` | object | The SQL-safety section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `sql_safety.all_external_input_bound_as_parameters` | boolean | — |
| `sql_safety.update_and_delete_statements_all_carry_where` | boolean | — |
| `sql_safety.bounded_writes_rehearsed_before_execution` | boolean | — |
| `queries[].parameterized_inputs_declared` | boolean | Must be `true` per row (type stated in SERVICE.md; read by this section, per SERVICE.md) |

#### Read by: migrations_and_migration_safety

| Field | Type | Notes |
|---|---|---|
| `migrations` | object | The migrations section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `migrations.forward_and_rollback_scripts_present` | boolean | — |
| `migrations.migrations_tested_on_a_copy` | boolean | — |
| `migrations.expand_migrate_contract_for_zero_downtime` | boolean | — |
| `migrations.one_logical_change_per_migration` | boolean | — |

#### Read by: performance_evidence_and_plan_regression

| Field | Type | Notes |
|---|---|---|
| `performance_evidence` | object | The performance-evidence section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `performance_evidence.explain_analyze_captured_before_and_after_heavy_changes` | boolean | — |
| `performance_evidence.query_plan_regressions_watched` | boolean | — |

#### Read by: sql_red_lines

| Field | Type | Notes |
|---|---|---|
| `sql_red_lines` | object | The SQL red-lines section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `sql_red_lines.string_concatenated_sql_with_user_input_present` | boolean | must be `false` to pass — skill red line |
| `sql_red_lines.unreviewed_migration_on_live_data_present` | boolean | must be `false` to pass — skill red line |
| `sql_red_lines.direct_to_production_schema_edit_present` | boolean | must be `false` to pass — skill red line |
| `sql_red_lines.unbounded_write_without_where_present` | boolean | must be `false` to pass — skill safety rule |

### Checks

All 44 checks, in the recorded order, grouped by section. "Requires" quotes the check's own recorded evidence text from the full-pass run — what the check states it enforces. Per-check statuses are `pass`, `fail` and `missing` only. Section and verdict aggregation are defined under Verdict vocabulary. Recorded check names are used verbatim, even where they differ from the input field names they read (see Discrepancies).

#### Section: schema_constraints_and_naming

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `precise_column_types_declared_for_sql_schema` | schema: precise column types are declared for the schema | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `sql_not_null_default_with_explicit_nullable_exceptions` | schema: NOT NULL is the default and nullable exceptions are explicit | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `sql_check_and_fk_constraints_enforced_in_database_not_app_only` | schema: CHECK and foreign-key constraints are enforced in the database, not only in app code | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `sql_snake_case_naming_declared_consistent` | schema: naming is consistent snake_case across the schema | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `sql_tables_declared` | schema: the declared record names its tables - the tables list is present and non-empty | Computed over the declared record. Pass: the `tables` list is present and non-empty. Fail: the list is present but empty. Missing: the list is absent. |
| `every_sql_table_declares_primary_key` | schema: every declared table row declares a primary key | Computed over the declared record. Pass: every declared table row declares `primary_key_declared` `true`. Fail: a row declares it `false` (offending tables are named in `tables_without_primary_key`). Missing: the list is absent, or a row has the field absent. |
| `every_sql_table_declares_schema_constraints` | schema: every declared table row declares its schema constraints | Computed over the declared record. Pass: every declared table row declares `schema_constraints_declared` `true`. Fail: a row declares it `false` (offending tables are named in `tables_without_schema_constraints`). Missing: the list is absent, or a row has the field absent. |
| `every_sql_table_declares_not_null_default` | schema: every declared table row declares the NOT NULL default | Computed over the declared record. Pass: every declared table row declares `not_null_default_declared` `true`. Fail: a row declares it `false` (offending tables are named in `tables_without_not_null_default`). Missing: the list is absent, or a row has the field absent. |
| `every_sql_table_name_is_snake_case` | schema: every declared table name matches snake_case [a-z][a-z0-9_]* in full | Computed over the declared record. Pass: every declared table `name` matches `[a-z][a-z0-9_]*` in full. Fail: a name does not match (offending names are named in `tables_with_non_snake_case_names`). Missing: the list is absent, or a row has `name` absent. |
| `no_sql_table_name_duplicated` | schema: no declared table name appears on more than one row | Computed over the declared record. Pass: no declared table `name` appears on more than one row. Fail: a `name` is declared on more than one row (duplicates are named in `duplicate_sql_table_names`). Missing: the list is absent, or a row has `name` absent. |

#### Section: index_design_from_access_patterns

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `sql_indexes_derived_from_real_access_patterns` | indexes: indexes are derived from real access patterns | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `sql_composite_index_column_order_follows_query_order` | indexes: composite index column order follows the query order that uses it | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `sql_index_write_cost_measured_before_adding_indexes` | indexes: over-indexing write cost is measured before indexes are added | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `sql_indexes_declared` | indexes: the declared record names its indexes - the indexes list is present and non-empty | Computed over the declared record. Pass: the `indexes` list is present and non-empty. Fail: the list is present but empty. Missing: the list is absent. |
| `every_sql_index_declares_nonempty_columns` | indexes: every declared index row declares a non-empty columns list | Computed over the declared record. Pass: every declared index row declares a present, non-empty `columns` list. Fail: a row declares an empty `columns` list (offending indexes are named in `indexes_without_columns`). Missing: the list is absent, or a row has `columns` absent. |
| `every_declared_sql_query_has_matching_declared_index` | indexes: every declared query names a supporting index that is declared on the same table | Computed over the declared record. Pass: every declared query names a supporting index whose `name` equals the query's `supporting_index_name` and whose declared `table` equals the query's declared `table`. Fail: a query is unmatched (unmatched queries are named in `uncovered_sql_queries`). Missing: the queries or indexes list is absent, or a query has `supporting_index_name` or `table` absent. |
| `no_sql_index_name_duplicated` | indexes: no declared index name appears on more than one row | Computed over the declared record. Pass: no declared index `name` appears on more than one row. Fail: a `name` is declared on more than one row (duplicates are named in `duplicate_sql_index_names`). Missing: the list is absent, or a row has `name` absent. |

#### Section: query_construction_pagination_and_n_plus_one_prevention

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `sql_set_based_queries_preferred_over_row_by_row` | queries: set-based queries are preferred over row-by-row processing | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `sql_complex_reads_use_ctes_or_window_functions_where_needed` | queries: complex reads use CTEs or window functions where needed | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `sql_large_results_paginated_in_query_practice` | queries: large results are paginated | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `sql_related_data_joined_batched_or_preloaded` | queries: related data is joined, batched or preloaded instead of fetched row by row | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `sql_query_count_tests_verify_no_n_plus_one` | queries: query-count tests verify no N+1 pattern is introduced | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `sql_queries_declared` | queries: the declared record names its queries - the queries list is present and non-empty | Computed over the declared record. Pass: the `queries` list is present and non-empty. Fail: the list is present but empty. Missing: the list is absent. |
| `every_sql_query_declares_explicit_column_list` | queries: every declared query row declares an explicit column list, no SELECT * in app code | Computed over the declared record. Pass: every declared query row declares `explicit_column_list_declared` `true`. Fail: a row declares it `false` (offending queries are named in `queries_without_explicit_column_list`). Missing: the list is absent, or a row has the field absent. |
| `every_sql_query_declares_bounded_or_paginated_access` | queries: every declared query row declares bounded or paginated access, no unbounded scan | Computed over the declared record. Pass: every declared query row declares `bounded_or_paginated_declared` `true`. Fail: a row declares it `false` (offending queries are named in `queries_without_bounded_or_paginated_access`). Missing: the list is absent, or a row has the field absent. |
| `every_sql_query_declares_n_plus_one_avoidance` | queries: every declared query row declares its N+1 avoidance | Computed over the declared record. Pass: every declared query row declares `n_plus_one_avoidance_declared` `true`. Fail: a row declares it `false` (offending queries are named in `queries_without_n_plus_one_avoidance`). Missing: the list is absent, or a row has the field absent. |
| `no_sql_query_name_duplicated` | queries: no declared query name appears on more than one row | Computed over the declared record. Pass: no declared query `name` appears on more than one row. Fail: a `name` is declared on more than one row (duplicates are named in `duplicate_sql_query_names`). Missing: the list is absent, or a row has `name` absent. |

#### Section: transactions_and_concurrency

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `sql_transactions_kept_short` | transactions: transactions are kept short | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `sql_isolation_level_known_for_transactions` | transactions: the isolation level in use is known and declared | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `sql_deadlock_retry_with_backoff_declared` | transactions: deadlocks are expected and handled with retry and backoff | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: sql_safety_and_bounded_writes

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `sql_all_external_input_bound_as_parameters` | safety: all external input is bound as parameters, never string-built into SQL | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `sql_update_and_delete_statements_all_carry_where` | safety: every UPDATE and DELETE carries a WHERE clause | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `sql_bounded_writes_rehearsed_before_execution` | safety: bounded UPDATE and DELETE statements are rehearsed before execution | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `every_sql_query_declares_parameterized_inputs` | safety: every declared query row declares parameterized inputs | Computed over the declared record. Pass: every declared query row declares `parameterized_inputs_declared` `true`. Fail: a row declares it `false` (offending queries are named in `queries_without_parameterized_inputs`). Missing: the list is absent, or a row has the field absent. |

#### Section: migrations_and_migration_safety

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `sql_migrations_carry_forward_and_rollback_scripts` | migrations: every migration carries forward and rollback scripts | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `sql_migrations_tested_on_a_copy_before_live` | migrations: migrations are tested on a copy before live data | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `sql_zero_downtime_migrations_use_expand_migrate_contract` | migrations: zero-downtime changes use expand, migrate, then contract | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `sql_one_logical_change_per_migration` | migrations: one logical change per migration | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: performance_evidence_and_plan_regression

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `sql_explain_analyze_captured_before_and_after_heavy_changes` | performance: EXPLAIN ANALYZE evidence is captured before and after heavy changes | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `sql_query_plan_regressions_watched_after_changes` | performance: query plan regressions are watched after changes | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: sql_red_lines

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `sql_no_string_concatenated_sql_with_user_input` | red line: no string-concatenated SQL with user input is present in the record | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `sql_no_unreviewed_migration_on_live_data` | red line: no unreviewed migration on live data is present in the record | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `sql_no_direct_to_production_schema_edit` | red line: no direct-to-production schema edit is present in the record | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `sql_no_unbounded_write_without_where` | red line: no unbounded UPDATE or DELETE without a WHERE clause is present in the record | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |

### Output format

HTTP 200 returns one JSON object:

- `service` (`"sql-schema-query-engineering-pack"`), `atom_version` (`"0.1.0"`), and `project` (the manifest's declared project value, carried through).
- `verdict` — one of the verdict values below.
- `sections` — an object mapping each section name to its section status (below).
- `checks` — the full per-check array: `{section, check, status, evidence}` for every check, in the order listed above.
- `computed_status` — see Verdict vocabulary.
- Computed outputs: `tables_count`, `indexes_count` and `queries_count` (the declared list lengths as integers, or null when the list is not declared); the row-name lists `tables_without_primary_key`, `tables_without_schema_constraints`, `tables_without_not_null_default`, `tables_with_non_snake_case_names`, `duplicate_sql_table_names`, `indexes_without_columns`, `duplicate_sql_index_names`, `queries_without_explicit_column_list`, `queries_without_bounded_or_paginated_access`, `queries_without_parameterized_inputs`, `queries_without_n_plus_one_avoidance`, `uncovered_sql_queries` and `duplicate_sql_query_names` (rows whose field is present but not true, or whose name / columns break the stated computed rule; a row with the field absent is missing evidence and does not appear in a `without_*` list; each null when its underlying list — or, for `uncovered_sql_queries`, either list — is not declared, as recorded in the sparse case); and the ratios `table_primary_key_coverage`, `table_schema_constraints_coverage`, `table_not_null_default_coverage`, `index_columns_coverage`, `query_explicit_column_list_coverage`, `query_bounded_or_paginated_coverage`, `query_parameterized_inputs_coverage`, `query_n_plus_one_avoidance_coverage` and `query_index_support_coverage` — strings with exactly six decimal places; a ratio is null when its denominator list is absent or empty (and, for query index support, when the indexes list is absent). Ratios use the fixed serialization rule — round half up to 6dp, `floor(v * 1000000 + 0.5) / 1000000`, formatted with exactly six decimals; comparisons use the unrounded values — which is what makes the Python and TypeScript outputs byte-identical.
- `summary` — a one-line count, e.g. "44 pass, 0 fail, 0 missing of 44 checks across eight sections."
- `stamp` — a plain-text rendering of the same verdict (title, declared project value, verdict and per-section statuses) for human-readable records.

### Verdict vocabulary

**Verdicts** (the top-level `verdict` field):

- `SQL_SCHEMA_QUERY_ENGINEERING_PACK_READY` — all 44 checks pass: the declared SQL schema + query engineering record is complete and consistent with the bound skill's checklist and red lines.
- `SQL_SCHEMA_QUERY_ENGINEERING_PACK_NOT_READY` — at least one check fails: a declared value or row contradicts a requirement. The failing checks and the computed outputs name what is wrong.
- `INSUFFICIENT_EVIDENCE` — nothing fails, but at least one check is `missing`: evidence the record requires was not declared. The missing checks name exactly what to supply.

**`computed_status`** (computed checks only): `within_stated_limits_on_declared_evidence` — every primary computed check passes; `outside_stated_limits_on_declared_evidence` — at least one primary computed check fails; `null` — at least one of the sixteen primary computed checks cannot be completed because the rows or fields it reads are absent.

**Section statuses** (each value in `sections`): `pass` — every check in the section passes; `fail` — at least one check in the section fails; `insufficient_evidence` — no check in the section fails, but at least one is missing.

**Per-check statuses** (each entry in `checks`): `pass` — the requirement is met on the declared evidence; `fail` — the declared evidence contradicts the requirement; `missing` — the field or rows the check reads are absent.

**Secondary computed fields:** `tables_count`, `indexes_count`, `queries_count`, the thirteen row-name / duplicate lists and the nine coverage ratios, and `computed_status` — each defined in Output format above, with the values and null rules recorded there.

### Errors

A failed call is not metered. The 422 body below is the recorded body from this atom's malformed run, verbatim. The 401, 403 and 429 rows have **no recorded bodies in the battery** — they are carried as HTTP status + meaning only, explicitly flagged as unrecorded; no payload shape is asserted for them.

| HTTP | Body | Meaning |
|---|---|---|
| 401 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Missing / invalid key. |
| 403 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Key lacks this atom's scope. |
| 422 | `{"ok":false,"error":"invalid_input","field":"project","detail":"project must be a string"}` (this atom's recorded malformed run) | The manifest failed type validation before evaluation; `field` and `detail` name the violation. No verdict is returned. |
| 429 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Rate limit (60/min, 10,000/day per key). |

### Rate limits and pricing

- **Rate limits (per key, per atom, from contract.yaml):** 60 calls/minute and 10,000 calls/day. Over-limit calls return 429 (above) and are not metered.
- **Pricing:** unit = deliverable (one delivered result = one unit of sale; deliverable type DELIVERABLE — this atom sells the deliverable it produces, never the underlying knowledge itself). `pricing.rate` is `null` in contract.yaml — **Free during trial — rate pending.** Rates are set only from measured production cost per unit under the billing protocol in `rails/billing.md`; no channel markup.

## Explanation

**What the atom does.** Design and write SQL that scales — schema constraints, indexes, transactions, safe migrations, no N+1 (the bound capability, from the skill). You submit one declared record — the SQL schema + query engineering manifest, made from the system's actual practice — and the atom audits that record for completeness and internal consistency against the bound skill's practice and red lines, returning one deterministic verdict across 8 sections (`schema_constraints_and_naming`, `index_design_from_access_patterns`, `query_construction_pagination_and_n_plus_one_prevention`, `transactions_and_concurrency`, `sql_safety_and_bounded_writes`, `migrations_and_migration_safety`, `performance_evidence_and_plan_regression`, `sql_red_lines`). The atom sells that deliverable — a bounded judgment artifact — never the underlying knowledge itself. This atom shares zero checks with its sibling atoms `database-design-review`, `production-python-engineering-pack` and `codebase-structural-query`, and with every other atom (SERVICE.md, Distinct ground); it audits the SQL engineering record of a schema and its queries as written, where `database-design-review` judges a design before it is built.

**How the verdict is decided.** The core is deterministic: the same manifest in always produces the same verdict out (proven byte-identical in the recorded battery, with REST/MCP parity). Two kinds of checks combine. *Attestation checks* read a single declared boolean: declared `true` passes (for red-line / anti-pattern fields, declared `false` passes); present-but-opposite fails; absent is `missing`. *Computed checks* are calculated from the declared table, index and query rows themselves — each declared list must be present and non-empty; every declared table row must declare `primary_key_declared`, `schema_constraints_declared` and `not_null_default_declared` all `true` and its `name` must match `[a-z][a-z0-9_]*` in full; every declared index row must declare a present, non-empty `columns` list; every declared query must name a supporting index that is actually declared on the same table and must declare an explicit column list, bounded or paginated access, parameterized inputs and N+1 avoidance all `true`; and no declared table, index or query `name` may appear on more than one row of its list — using only the skill's own stated rules plus the consistency of the declared record itself, with no outside threshold imported. Aggregation is strict: any `fail` anywhere produces `SQL_SCHEMA_QUERY_ENGINEERING_PACK_NOT_READY`; otherwise any `missing` produces `INSUFFICIENT_EVIDENCE`; only an all-`pass` record earns `SQL_SCHEMA_QUERY_ENGINEERING_PACK_READY`. The central semantic is the absent / false distinction: **an absent field is missing evidence, never a fail; a present-but-false or invalid field is a fail, never missing.** That is what makes the verdict actionable — `missing` tells you what to supply, `fail` tells you what to correct.

**Thresholds declined.** The skill states no numeric threshold at all — its demands are qualitative declarations the record makes, not bars the atom can set. Declined, named: a minimum or maximum table, index or query count; a coverage percentage below completeness over the declared rows; a numeric transaction-length limit for "short"; a numeric result-set size or page size that makes a result "large"; a deadlock retry count, backoff base or backoff cap; an isolation-level vocabulary (the skill requires the level be *known*, and names no allowed values, so only that attestation is checked); a query-plan cost, row-estimate or timing figure an `EXPLAIN ANALYZE` capture must show (only that the evidence is captured before and after is checked); a composite-index column-count limit; a snake_case rule beyond the fixed `[a-z][a-z0-9_]*` pattern the skill's "snake_case" naming itself defines (no length limit, no reserved-word list is invented). Quantities are computed and reported; the only bar on the computed rows is completeness over the caller's own declared rows.

**What it does NOT do.** The atom reviews a **declared** SQL schema + query engineering record: a verdict of `SQL_SCHEMA_QUERY_ENGINEERING_PACK_READY` means the record is complete and consistent *on the caller's declared evidence* — a record that declares every query parameterized and every migration rollback-tested passes those checks even if the real system does none of it. It is a completeness and consistency audit of the engineering record the skill requires, **not a database, a query optimizer, a migration runner, a security audit, or a guarantee that the schema is correct or the queries are fast**. Specifically: it connects to no database, executes no SQL against any live system, runs no `EXPLAIN ANALYZE`, inspects no repository, migration file or query plan, and does not verify that declared practice was ever carried out. It never judges whether a declared constraint is the right constraint, whether a declared index will actually be used by the planner, whether the declared isolation level is adequate, or whether a declared column type is correct in the real DDL — only that the record contains what the skill's practice demands, and that its declared table, index and query rows are internally consistent. Named exclusions: designing a schema for the caller, writing or rewriting SQL for the caller, choosing indexes for a real workload, and running or reviewing live migrations are all excluded by name — the skill's prescriptive moves are checked only as declared presence/consistency, never emitted as design advice; no live execution of any kind; no numeric thresholds at all (the skill states none — see the declined list above); no judgment of practice *quality* beyond the declared record's completeness and the computed row consistency stated above.

**Buyer and use context.** Teams and agents working in Engineering & code who need this deliverable on demand rather than building or staffing the capability themselves (first buyer hypothesis from the register; not yet market-tested). Internal self-use: Product database design and migrations (Wright is an internal caller, zero price, metered to the internal cost ledger). Call it when the work the skill describes has been done (or is being prepared) and you need a bounded, repeatable judgment on whether the record of that work is complete and consistent — for example as a gate before the work proceeds, or as a review artifact attached to it.

## Role views

### For regulators

This atom was deployed census-style under a U-13 regulatory screen classified **(b) screen-NO — flag-with-controls (census class)**, exactly as SERVICE.md's U-13 section records it. SERVICE.md records the basis: this atom's output could not read as regulated professional advice — it audits a declared SQL software-engineering record for completeness and consistency against a SQL practice skill; it offers no engineering-practice advice in the APEGA sense (no design, stamping, or safety judgment over physical systems), no financial or securities advice, and nothing psychology-adjacent. Its subject is software practice only, the same class as the software-engineering titles that stayed live at the census pending the owner's review. The named controls, exactly as SERVICE.md records them: (1) declared-record audit only — the atom audits the record the caller declares, never connects to a database, executes no SQL and never verifies practice; (2) advice-shaped skill steps are excluded as red lines / named exclusions — the skill's prescriptive moves (how to design a schema, how to write a query, how to sequence a migration) are never emitted as advice; the atom only checks declared presence/consistency and refuses the skill's anti-patterns as red-line declarations; (3) no numeric threshold is invented — every bar is the skill's own stated rule or completeness over the caller's declared rows. The flag stays open for the Director's review: the screen-NO classification and its controls stand as recorded, and the census flag is not closed by this document.

### For integrators (Users)

You need: a gateway key with the `sql_schema_query_engineering_pack` scope, the two endpoints (Reference), and the verdict vocabulary. Start with the Tutorial, keep the Input reference open while authoring your manifest, and treat `missing` vs `fail` as your fix list. Rate limits are 60/minute and 10,000/day per key; the atom is free during trial (rate pending). Support: info@pipavia.com (per USER-GUIDE.md).

### For developers

Manifest authoring: types are in the Input reference — all booleans unless noted; a wrong type is a 422 before evaluation, never a verdict. Determinism: the core is a deterministic function of the manifest; computed ratios are serialized as strings with exactly six decimal places under the fixed rule `floor(v * 1000000 + 0.5) / 1000000`, which is what makes the Python oracle and the TypeScript port byte-identical. Implementation: `src/sql_schema_query_engineering_pack.py` (Python oracle) with the TypeScript port in the gateway; tests: `tests/test_sql_schema_query_engineering_pack.py` in this atom's directory, plus the external battery recorded in TEST-REPORT.md. The binding rule (contract.yaml, R1): fixes land in the bound skill first; the atom re-deploys from the refined skill and must pass regression before its version bumps.

### For ops

Endpoints: `POST /v1/sql-schema-query-engineering-pack` (REST) and `POST /mcp/sql-schema-query-engineering-pack` (MCP, tool `sql_schema_query_engineering_pack`) on https://atoms.pipavia.com, gateway v1.1.0 at last verification (deployment ac6ddba696934ceb84596876507fc08c; RC soak to 2026-11-22). Key scope: `sql_schema_query_engineering_pack`. Rate limits: 60/minute, 10,000/day per key per atom (429, not metered — body unrecorded, see Errors). Error monitoring: watch 401 (key problems), 403 (scope not issued), 422 `invalid_input` (caller manifest type errors — the `field` value is the signal) and 429 volume. Status: live; a failed call is not metered and an unset rate meters at zero (free-trial posture).

## Discrepancies

Docs follow the recorded response wherever SERVICE.md / contract.yaml / TEST-REPORT.md / USER-GUIDE.md disagree with it; every discrepancy found is named here, never papered over.

1. **Status — SERVICE.md and contract.yaml stale (and differently worded):** SERVICE.md says Tier B · status: **built-locally — NOT deployed** — “no endpoint is live”, and contract.yaml says status: **scaffolded**. The recorded battery (TEST-REPORT.md; evidence.json, gateway v1.1.0, deployment ac6ddba696934ceb84596876507fc08c) shows the atom live. This document follows the evidenced live state: live.
2. **Check names differ from input field names:** all 44 recorded check names differ from the leaf name of the input field they read — most carry an added `sql_` prefix, a rewording, or both, and the computed checks name a rule over rows rather than any single field. Examples spanning every section: `precise_column_types_declared_for_sql_schema` (input `schema_design.precise_column_types_declared`), `sql_not_null_default_with_explicit_nullable_exceptions` (input `schema_design.not_null_default_with_nullable_exceptions_explicit`), `sql_check_and_fk_constraints_enforced_in_database_not_app_only` (input `schema_design.check_and_foreign_key_constraints_in_database`), `sql_tables_declared` (the `tables` list), `every_sql_table_declares_primary_key` (rows' `primary_key_declared`), `every_sql_table_name_is_snake_case` (rows' `name`, computed), `no_sql_table_name_duplicated` (rows' `name`), `sql_index_write_cost_measured_before_adding_indexes` (input `index_design.index_write_cost_measured_before_adding`), `every_sql_index_declares_nonempty_columns` (rows' `columns`), `every_declared_sql_query_has_matching_declared_index` (a query's `supporting_index_name` + `table` against the declared `indexes`), `sql_set_based_queries_preferred_over_row_by_row` (input `query_practice.set_based_queries_preferred`), `sql_queries_declared` (the `queries` list), `every_sql_query_declares_parameterized_inputs` (rows' `parameterized_inputs_declared`, read by the safety section), `sql_isolation_level_known_for_transactions` (input `transactions.isolation_level_known`), `sql_migrations_carry_forward_and_rollback_scripts` (input `migrations.forward_and_rollback_scripts_present`), `sql_zero_downtime_migrations_use_expand_migrate_contract` (input `migrations.expand_migrate_contract_for_zero_downtime`), `sql_explain_analyze_captured_before_and_after_heavy_changes` (input `performance_evidence.explain_analyze_captured_before_and_after_heavy_changes`, with the `sql_` prefix), and in `sql_red_lines` all four recorded names — `sql_no_string_concatenated_sql_with_user_input`, `sql_no_unreviewed_migration_on_live_data`, `sql_no_direct_to_production_schema_edit`, `sql_no_unbounded_write_without_where` — read the corresponding `*_present` anti-pattern fields. Recorded check names are used verbatim in the Checks section.
3. **Types unstated in SERVICE.md:** SERVICE.md states no type for the section container objects (`schema_design`, `index_design`, `query_practice`, `transactions`, `sql_safety`, `migrations`, `performance_evidence`, `sql_red_lines`) or for a row object (`tables[]`, `indexes[]`, `queries[]`). The types in the Input reference for those fields are grounded in the recorded evidence inputs and, for the top-level containers and the `tables` / `indexes` / `queries` lists, in the recorded MCP `inputSchema`, and are said so there.
4. **Trimmed responses in USER-GUIDE.md and TEST-REPORT.md:** both present the full-pass response as trimmed, omitting the `checks` array and the `stamp` field (TEST-REPORT.md also presents its raw outputs as excerpts). The recorded REST response carries all 44 checks and a `stamp`; Worked examples below reproduce the full recorded response, and the Checks and Output format sections follow the full recording.
5. **Section grouping vs input objects:** four recorded sections merge more than one input object — `schema_constraints_and_naming` reads both `schema_design` and `tables`; `index_design_from_access_patterns` reads `index_design`, `indexes`, and (for the matching check) `queries`; `query_construction_pagination_and_n_plus_one_prevention` reads both `query_practice` and `queries`; and `sql_safety_and_bounded_writes` reads both `sql_safety` and `queries` (the per-query parameterized-inputs check). The other four recorded sections map one-to-one onto their input objects (`transactions` → `transactions_and_concurrency`, `migrations` → `migrations_and_migration_safety`, `performance_evidence` → `performance_evidence_and_plan_regression`, `sql_red_lines` → `sql_red_lines`). SERVICE.md's own grouping also splits the `queries` row fields across three sections (index matching, query construction, and SQL safety). This document groups the Input reference and the Checks by the recorded section names, following SERVICE.md's Read-by assignments.
6. **Case-design prose diverging in corrections.json:** the pre-execution case design recorded in `corrections.json` diverged from the recorded executions and was corrected before execution (7 corrections, also listed as tester errors in TEST-REPORT.md): the designed violations `failing_checks` named three computed output lists as if they were checks — `tables_with_non_snake_case_names`, `tables_without_primary_key` and `uncovered_sql_queries` — instead of exact check names (R1 ×3); the full-pass and violations `expect` blocks carried their computed quantities only in prose notes, with no structured `computed_spot_checks` (R2 ×2); the designed violations input was not a full manifest — it was missing the many key paths listed in the R3 correction (a sparse violations input, reading as missing evidence rather than failure) (R3 ×1); and the designed malformed input carried 2 type violations (`project` and `tables`) instead of exactly one (R4 ×1). These are unscored design prose: the corrections were applied before execution, and where the corrected-away design prose differed, the recorded responses govern.
7. **Contract endpoint list vs recorded surfaces:** contract.yaml lists `endpoints` only as `agent`, while the recorded battery and USER-GUIDE.md show two live surfaces — REST and MCP — on the gateway. This document follows the recorded surfaces.

## Worked examples

Provenance: recorded 2026-11-16T12:26:50.690077+00:00 against gateway v1.1.0, external verification battery Wave 15, source `verification/work/sql-schema-query-engineering-pack/evidence.json`. The three examples below are that battery's full-pass, violations and malformed cases: each shows the case's recorded `input` and the REST execution's recorded response, verbatim (pretty-printed with indent 2 for readability; content identical to the recorded JSON values). The battery also recorded a sparse case (verdict `INSUFFICIENT_EVIDENCE` — see TEST-REPORT.md) plus determinism and MCP/REST parity proofs.

### Example 1 — Full-pass (case `full-pass`)

Provenance: recorded 2026-11-16T12:26:50.690077+00:00 · gateway v1.1.0 · external verification battery Wave 15 · source `verification/work/sql-schema-query-engineering-pack/evidence.json`.

Input:

```json
{
  "project": "test-project",
  "schema_design": {
    "precise_column_types_declared": true,
    "not_null_default_with_nullable_exceptions_explicit": true,
    "check_and_foreign_key_constraints_in_database": true,
    "snake_case_naming_consistent": true
  },
  "tables": [
    {
      "name": "users",
      "primary_key_declared": true,
      "schema_constraints_declared": true,
      "not_null_default_declared": true
    }
  ],
  "index_design": {
    "indexes_derived_from_real_access_patterns": true,
    "composite_index_column_order_follows_query_order": true,
    "index_write_cost_measured_before_adding": true
  },
  "indexes": [
    {
      "name": "idx_users_email",
      "table": "users",
      "columns": [
        "email"
      ]
    }
  ],
  "queries": [
    {
      "name": "get_user_by_email",
      "table": "users",
      "supporting_index_name": "idx_users_email",
      "explicit_column_list_declared": true,
      "bounded_or_paginated_declared": true,
      "parameterized_inputs_declared": true,
      "n_plus_one_avoidance_declared": true
    }
  ],
  "query_practice": {
    "set_based_queries_preferred": true,
    "complex_reads_use_ctes_or_window_functions": true,
    "large_results_paginated": true,
    "related_data_joined_batched_or_preloaded": true,
    "query_count_tests_verify_no_n_plus_one": true
  },
  "transactions": {
    "transactions_kept_short": true,
    "isolation_level_known": true,
    "deadlock_retry_with_backoff_declared": true
  },
  "sql_safety": {
    "all_external_input_bound_as_parameters": true,
    "update_and_delete_statements_all_carry_where": true,
    "bounded_writes_rehearsed_before_execution": true
  },
  "migrations": {
    "forward_and_rollback_scripts_present": true,
    "migrations_tested_on_a_copy": true,
    "expand_migrate_contract_for_zero_downtime": true,
    "one_logical_change_per_migration": true
  },
  "performance_evidence": {
    "explain_analyze_captured_before_and_after_heavy_changes": true,
    "query_plan_regressions_watched": true
  },
  "sql_red_lines": {
    "string_concatenated_sql_with_user_input_present": false,
    "unreviewed_migration_on_live_data_present": false,
    "direct_to_production_schema_edit_present": false,
    "unbounded_write_without_where_present": false
  }
}
```

Response (HTTP 200):

```json
{
  "service": "sql-schema-query-engineering-pack",
  "atom_version": "0.1.0",
  "project": "test-project",
  "verdict": "SQL_SCHEMA_QUERY_ENGINEERING_PACK_READY",
  "sections": {
    "schema_constraints_and_naming": "pass",
    "index_design_from_access_patterns": "pass",
    "query_construction_pagination_and_n_plus_one_prevention": "pass",
    "transactions_and_concurrency": "pass",
    "sql_safety_and_bounded_writes": "pass",
    "migrations_and_migration_safety": "pass",
    "performance_evidence_and_plan_regression": "pass",
    "sql_red_lines": "pass"
  },
  "checks": [
    {
      "section": "schema_constraints_and_naming",
      "check": "precise_column_types_declared_for_sql_schema",
      "status": "pass",
      "evidence": "schema: precise column types are declared for the schema"
    },
    {
      "section": "schema_constraints_and_naming",
      "check": "sql_not_null_default_with_explicit_nullable_exceptions",
      "status": "pass",
      "evidence": "schema: NOT NULL is the default and nullable exceptions are explicit"
    },
    {
      "section": "schema_constraints_and_naming",
      "check": "sql_check_and_fk_constraints_enforced_in_database_not_app_only",
      "status": "pass",
      "evidence": "schema: CHECK and foreign-key constraints are enforced in the database, not only in app code"
    },
    {
      "section": "schema_constraints_and_naming",
      "check": "sql_snake_case_naming_declared_consistent",
      "status": "pass",
      "evidence": "schema: naming is consistent snake_case across the schema"
    },
    {
      "section": "schema_constraints_and_naming",
      "check": "sql_tables_declared",
      "status": "pass",
      "evidence": "schema: the declared record names its tables - the tables list is present and non-empty"
    },
    {
      "section": "schema_constraints_and_naming",
      "check": "every_sql_table_declares_primary_key",
      "status": "pass",
      "evidence": "schema: every declared table row declares a primary key"
    },
    {
      "section": "schema_constraints_and_naming",
      "check": "every_sql_table_declares_schema_constraints",
      "status": "pass",
      "evidence": "schema: every declared table row declares its schema constraints"
    },
    {
      "section": "schema_constraints_and_naming",
      "check": "every_sql_table_declares_not_null_default",
      "status": "pass",
      "evidence": "schema: every declared table row declares the NOT NULL default"
    },
    {
      "section": "schema_constraints_and_naming",
      "check": "every_sql_table_name_is_snake_case",
      "status": "pass",
      "evidence": "schema: every declared table name matches snake_case [a-z][a-z0-9_]* in full"
    },
    {
      "section": "schema_constraints_and_naming",
      "check": "no_sql_table_name_duplicated",
      "status": "pass",
      "evidence": "schema: no declared table name appears on more than one row"
    },
    {
      "section": "index_design_from_access_patterns",
      "check": "sql_indexes_derived_from_real_access_patterns",
      "status": "pass",
      "evidence": "indexes: indexes are derived from real access patterns"
    },
    {
      "section": "index_design_from_access_patterns",
      "check": "sql_composite_index_column_order_follows_query_order",
      "status": "pass",
      "evidence": "indexes: composite index column order follows the query order that uses it"
    },
    {
      "section": "index_design_from_access_patterns",
      "check": "sql_index_write_cost_measured_before_adding_indexes",
      "status": "pass",
      "evidence": "indexes: over-indexing write cost is measured before indexes are added"
    },
    {
      "section": "index_design_from_access_patterns",
      "check": "sql_indexes_declared",
      "status": "pass",
      "evidence": "indexes: the declared record names its indexes - the indexes list is present and non-empty"
    },
    {
      "section": "index_design_from_access_patterns",
      "check": "every_sql_index_declares_nonempty_columns",
      "status": "pass",
      "evidence": "indexes: every declared index row declares a non-empty columns list"
    },
    {
      "section": "index_design_from_access_patterns",
      "check": "every_declared_sql_query_has_matching_declared_index",
      "status": "pass",
      "evidence": "indexes: every declared query names a supporting index that is declared on the same table"
    },
    {
      "section": "index_design_from_access_patterns",
      "check": "no_sql_index_name_duplicated",
      "status": "pass",
      "evidence": "indexes: no declared index name appears on more than one row"
    },
    {
      "section": "query_construction_pagination_and_n_plus_one_prevention",
      "check": "sql_set_based_queries_preferred_over_row_by_row",
      "status": "pass",
      "evidence": "queries: set-based queries are preferred over row-by-row processing"
    },
    {
      "section": "query_construction_pagination_and_n_plus_one_prevention",
      "check": "sql_complex_reads_use_ctes_or_window_functions_where_needed",
      "status": "pass",
      "evidence": "queries: complex reads use CTEs or window functions where needed"
    },
    {
      "section": "query_construction_pagination_and_n_plus_one_prevention",
      "check": "sql_large_results_paginated_in_query_practice",
      "status": "pass",
      "evidence": "queries: large results are paginated"
    },
    {
      "section": "query_construction_pagination_and_n_plus_one_prevention",
      "check": "sql_related_data_joined_batched_or_preloaded",
      "status": "pass",
      "evidence": "queries: related data is joined, batched or preloaded instead of fetched row by row"
    },
    {
      "section": "query_construction_pagination_and_n_plus_one_prevention",
      "check": "sql_query_count_tests_verify_no_n_plus_one",
      "status": "pass",
      "evidence": "queries: query-count tests verify no N+1 pattern is introduced"
    },
    {
      "section": "query_construction_pagination_and_n_plus_one_prevention",
      "check": "sql_queries_declared",
      "status": "pass",
      "evidence": "queries: the declared record names its queries - the queries list is present and non-empty"
    },
    {
      "section": "query_construction_pagination_and_n_plus_one_prevention",
      "check": "every_sql_query_declares_explicit_column_list",
      "status": "pass",
      "evidence": "queries: every declared query row declares an explicit column list, no SELECT * in app code"
    },
    {
      "section": "query_construction_pagination_and_n_plus_one_prevention",
      "check": "every_sql_query_declares_bounded_or_paginated_access",
      "status": "pass",
      "evidence": "queries: every declared query row declares bounded or paginated access, no unbounded scan"
    },
    {
      "section": "query_construction_pagination_and_n_plus_one_prevention",
      "check": "every_sql_query_declares_n_plus_one_avoidance",
      "status": "pass",
      "evidence": "queries: every declared query row declares its N+1 avoidance"
    },
    {
      "section": "query_construction_pagination_and_n_plus_one_prevention",
      "check": "no_sql_query_name_duplicated",
      "status": "pass",
      "evidence": "queries: no declared query name appears on more than one row"
    },
    {
      "section": "transactions_and_concurrency",
      "check": "sql_transactions_kept_short",
      "status": "pass",
      "evidence": "transactions: transactions are kept short"
    },
    {
      "section": "transactions_and_concurrency",
      "check": "sql_isolation_level_known_for_transactions",
      "status": "pass",
      "evidence": "transactions: the isolation level in use is known and declared"
    },
    {
      "section": "transactions_and_concurrency",
      "check": "sql_deadlock_retry_with_backoff_declared",
      "status": "pass",
      "evidence": "transactions: deadlocks are expected and handled with retry and backoff"
    },
    {
      "section": "sql_safety_and_bounded_writes",
      "check": "sql_all_external_input_bound_as_parameters",
      "status": "pass",
      "evidence": "safety: all external input is bound as parameters, never string-built into SQL"
    },
    {
      "section": "sql_safety_and_bounded_writes",
      "check": "sql_update_and_delete_statements_all_carry_where",
      "status": "pass",
      "evidence": "safety: every UPDATE and DELETE carries a WHERE clause"
    },
    {
      "section": "sql_safety_and_bounded_writes",
      "check": "sql_bounded_writes_rehearsed_before_execution",
      "status": "pass",
      "evidence": "safety: bounded UPDATE and DELETE statements are rehearsed before execution"
    },
    {
      "section": "sql_safety_and_bounded_writes",
      "check": "every_sql_query_declares_parameterized_inputs",
      "status": "pass",
      "evidence": "safety: every declared query row declares parameterized inputs"
    },
    {
      "section": "migrations_and_migration_safety",
      "check": "sql_migrations_carry_forward_and_rollback_scripts",
      "status": "pass",
      "evidence": "migrations: every migration carries forward and rollback scripts"
    },
    {
      "section": "migrations_and_migration_safety",
      "check": "sql_migrations_tested_on_a_copy_before_live",
      "status": "pass",
      "evidence": "migrations: migrations are tested on a copy before live data"
    },
    {
      "section": "migrations_and_migration_safety",
      "check": "sql_zero_downtime_migrations_use_expand_migrate_contract",
      "status": "pass",
      "evidence": "migrations: zero-downtime changes use expand, migrate, then contract"
    },
    {
      "section": "migrations_and_migration_safety",
      "check": "sql_one_logical_change_per_migration",
      "status": "pass",
      "evidence": "migrations: one logical change per migration"
    },
    {
      "section": "performance_evidence_and_plan_regression",
      "check": "sql_explain_analyze_captured_before_and_after_heavy_changes",
      "status": "pass",
      "evidence": "performance: EXPLAIN ANALYZE evidence is captured before and after heavy changes"
    },
    {
      "section": "performance_evidence_and_plan_regression",
      "check": "sql_query_plan_regressions_watched_after_changes",
      "status": "pass",
      "evidence": "performance: query plan regressions are watched after changes"
    },
    {
      "section": "sql_red_lines",
      "check": "sql_no_string_concatenated_sql_with_user_input",
      "status": "pass",
      "evidence": "red line: no string-concatenated SQL with user input is present in the record"
    },
    {
      "section": "sql_red_lines",
      "check": "sql_no_unreviewed_migration_on_live_data",
      "status": "pass",
      "evidence": "red line: no unreviewed migration on live data is present in the record"
    },
    {
      "section": "sql_red_lines",
      "check": "sql_no_direct_to_production_schema_edit",
      "status": "pass",
      "evidence": "red line: no direct-to-production schema edit is present in the record"
    },
    {
      "section": "sql_red_lines",
      "check": "sql_no_unbounded_write_without_where",
      "status": "pass",
      "evidence": "red line: no unbounded UPDATE or DELETE without a WHERE clause is present in the record"
    }
  ],
  "computed_status": "within_stated_limits_on_declared_evidence",
  "tables_count": 1,
  "indexes_count": 1,
  "queries_count": 1,
  "tables_without_primary_key": [],
  "tables_without_schema_constraints": [],
  "tables_without_not_null_default": [],
  "tables_with_non_snake_case_names": [],
  "duplicate_sql_table_names": [],
  "indexes_without_columns": [],
  "duplicate_sql_index_names": [],
  "queries_without_explicit_column_list": [],
  "queries_without_bounded_or_paginated_access": [],
  "queries_without_parameterized_inputs": [],
  "queries_without_n_plus_one_avoidance": [],
  "uncovered_sql_queries": [],
  "duplicate_sql_query_names": [],
  "table_primary_key_coverage": "1.000000",
  "table_schema_constraints_coverage": "1.000000",
  "table_not_null_default_coverage": "1.000000",
  "index_columns_coverage": "1.000000",
  "query_explicit_column_list_coverage": "1.000000",
  "query_bounded_or_paginated_coverage": "1.000000",
  "query_parameterized_inputs_coverage": "1.000000",
  "query_n_plus_one_avoidance_coverage": "1.000000",
  "query_index_support_coverage": "1.000000",
  "summary": "44 pass, 0 fail, 0 missing of 44 checks across eight sections.",
  "stamp": "SQL SCHEMA QUERY ENGINEERING PACK\nproject: test-project\nVERDICT: SQL_SCHEMA_QUERY_ENGINEERING_PACK_READY\n  schema_constraints_and_naming                pass\n  index_design_from_access_patterns            pass\n  query_construction_pagination_and_n_plus_one_prevention pass\n  transactions_and_concurrency                 pass\n  sql_safety_and_bounded_writes                pass\n  migrations_and_migration_safety              pass\n  performance_evidence_and_plan_regression     pass\n  sql_red_lines                                pass\n44 pass, 0 fail, 0 missing of 44 checks across eight sections."
}
```

### Example 2 — Violations (case `violations`)

Provenance: recorded 2026-11-16T12:26:50.690077+00:00 · gateway v1.1.0 · external verification battery Wave 15 · source `verification/work/sql-schema-query-engineering-pack/evidence.json`.

Input:

```json
{
  "project": "fail-project",
  "schema_design": {
    "precise_column_types_declared": true,
    "not_null_default_with_nullable_exceptions_explicit": true,
    "check_and_foreign_key_constraints_in_database": true,
    "snake_case_naming_consistent": true
  },
  "tables": [
    {
      "name": "InvalidTableName",
      "primary_key_declared": false,
      "schema_constraints_declared": true,
      "not_null_default_declared": true
    }
  ],
  "index_design": {
    "indexes_derived_from_real_access_patterns": true,
    "composite_index_column_order_follows_query_order": true,
    "index_write_cost_measured_before_adding": true
  },
  "indexes": [
    {
      "name": "idx_users_email",
      "table": "users",
      "columns": [
        "email"
      ]
    }
  ],
  "queries": [
    {
      "name": "get_user_by_email",
      "table": "users",
      "supporting_index_name": "non_existent_index",
      "explicit_column_list_declared": true,
      "bounded_or_paginated_declared": true,
      "parameterized_inputs_declared": true,
      "n_plus_one_avoidance_declared": true
    }
  ],
  "query_practice": {
    "set_based_queries_preferred": true,
    "complex_reads_use_ctes_or_window_functions": true,
    "large_results_paginated": true,
    "related_data_joined_batched_or_preloaded": true,
    "query_count_tests_verify_no_n_plus_one": true
  },
  "transactions": {
    "transactions_kept_short": true,
    "isolation_level_known": true,
    "deadlock_retry_with_backoff_declared": true
  },
  "sql_safety": {
    "all_external_input_bound_as_parameters": true,
    "update_and_delete_statements_all_carry_where": true,
    "bounded_writes_rehearsed_before_execution": true
  },
  "migrations": {
    "forward_and_rollback_scripts_present": true,
    "migrations_tested_on_a_copy": true,
    "expand_migrate_contract_for_zero_downtime": true,
    "one_logical_change_per_migration": true
  },
  "performance_evidence": {
    "explain_analyze_captured_before_and_after_heavy_changes": true,
    "query_plan_regressions_watched": true
  },
  "sql_red_lines": {
    "string_concatenated_sql_with_user_input_present": false,
    "unreviewed_migration_on_live_data_present": false,
    "direct_to_production_schema_edit_present": false,
    "unbounded_write_without_where_present": false
  }
}
```

Response (HTTP 200):

```json
{
  "service": "sql-schema-query-engineering-pack",
  "atom_version": "0.1.0",
  "project": "fail-project",
  "verdict": "SQL_SCHEMA_QUERY_ENGINEERING_PACK_NOT_READY",
  "sections": {
    "schema_constraints_and_naming": "fail",
    "index_design_from_access_patterns": "fail",
    "query_construction_pagination_and_n_plus_one_prevention": "pass",
    "transactions_and_concurrency": "pass",
    "sql_safety_and_bounded_writes": "pass",
    "migrations_and_migration_safety": "pass",
    "performance_evidence_and_plan_regression": "pass",
    "sql_red_lines": "pass"
  },
  "checks": [
    {
      "section": "schema_constraints_and_naming",
      "check": "precise_column_types_declared_for_sql_schema",
      "status": "pass",
      "evidence": "schema: precise column types are declared for the schema"
    },
    {
      "section": "schema_constraints_and_naming",
      "check": "sql_not_null_default_with_explicit_nullable_exceptions",
      "status": "pass",
      "evidence": "schema: NOT NULL is the default and nullable exceptions are explicit"
    },
    {
      "section": "schema_constraints_and_naming",
      "check": "sql_check_and_fk_constraints_enforced_in_database_not_app_only",
      "status": "pass",
      "evidence": "schema: CHECK and foreign-key constraints are enforced in the database, not only in app code"
    },
    {
      "section": "schema_constraints_and_naming",
      "check": "sql_snake_case_naming_declared_consistent",
      "status": "pass",
      "evidence": "schema: naming is consistent snake_case across the schema"
    },
    {
      "section": "schema_constraints_and_naming",
      "check": "sql_tables_declared",
      "status": "pass",
      "evidence": "schema: the declared record names its tables - the tables list is present and non-empty"
    },
    {
      "section": "schema_constraints_and_naming",
      "check": "every_sql_table_declares_primary_key",
      "status": "fail",
      "evidence": "schema: every declared table row declares a primary key"
    },
    {
      "section": "schema_constraints_and_naming",
      "check": "every_sql_table_declares_schema_constraints",
      "status": "pass",
      "evidence": "schema: every declared table row declares its schema constraints"
    },
    {
      "section": "schema_constraints_and_naming",
      "check": "every_sql_table_declares_not_null_default",
      "status": "pass",
      "evidence": "schema: every declared table row declares the NOT NULL default"
    },
    {
      "section": "schema_constraints_and_naming",
      "check": "every_sql_table_name_is_snake_case",
      "status": "fail",
      "evidence": "schema: every declared table name matches snake_case [a-z][a-z0-9_]* in full"
    },
    {
      "section": "schema_constraints_and_naming",
      "check": "no_sql_table_name_duplicated",
      "status": "pass",
      "evidence": "schema: no declared table name appears on more than one row"
    },
    {
      "section": "index_design_from_access_patterns",
      "check": "sql_indexes_derived_from_real_access_patterns",
      "status": "pass",
      "evidence": "indexes: indexes are derived from real access patterns"
    },
    {
      "section": "index_design_from_access_patterns",
      "check": "sql_composite_index_column_order_follows_query_order",
      "status": "pass",
      "evidence": "indexes: composite index column order follows the query order that uses it"
    },
    {
      "section": "index_design_from_access_patterns",
      "check": "sql_index_write_cost_measured_before_adding_indexes",
      "status": "pass",
      "evidence": "indexes: over-indexing write cost is measured before indexes are added"
    },
    {
      "section": "index_design_from_access_patterns",
      "check": "sql_indexes_declared",
      "status": "pass",
      "evidence": "indexes: the declared record names its indexes - the indexes list is present and non-empty"
    },
    {
      "section": "index_design_from_access_patterns",
      "check": "every_sql_index_declares_nonempty_columns",
      "status": "pass",
      "evidence": "indexes: every declared index row declares a non-empty columns list"
    },
    {
      "section": "index_design_from_access_patterns",
      "check": "every_declared_sql_query_has_matching_declared_index",
      "status": "fail",
      "evidence": "indexes: every declared query names a supporting index that is declared on the same table"
    },
    {
      "section": "index_design_from_access_patterns",
      "check": "no_sql_index_name_duplicated",
      "status": "pass",
      "evidence": "indexes: no declared index name appears on more than one row"
    },
    {
      "section": "query_construction_pagination_and_n_plus_one_prevention",
      "check": "sql_set_based_queries_preferred_over_row_by_row",
      "status": "pass",
      "evidence": "queries: set-based queries are preferred over row-by-row processing"
    },
    {
      "section": "query_construction_pagination_and_n_plus_one_prevention",
      "check": "sql_complex_reads_use_ctes_or_window_functions_where_needed",
      "status": "pass",
      "evidence": "queries: complex reads use CTEs or window functions where needed"
    },
    {
      "section": "query_construction_pagination_and_n_plus_one_prevention",
      "check": "sql_large_results_paginated_in_query_practice",
      "status": "pass",
      "evidence": "queries: large results are paginated"
    },
    {
      "section": "query_construction_pagination_and_n_plus_one_prevention",
      "check": "sql_related_data_joined_batched_or_preloaded",
      "status": "pass",
      "evidence": "queries: related data is joined, batched or preloaded instead of fetched row by row"
    },
    {
      "section": "query_construction_pagination_and_n_plus_one_prevention",
      "check": "sql_query_count_tests_verify_no_n_plus_one",
      "status": "pass",
      "evidence": "queries: query-count tests verify no N+1 pattern is introduced"
    },
    {
      "section": "query_construction_pagination_and_n_plus_one_prevention",
      "check": "sql_queries_declared",
      "status": "pass",
      "evidence": "queries: the declared record names its queries - the queries list is present and non-empty"
    },
    {
      "section": "query_construction_pagination_and_n_plus_one_prevention",
      "check": "every_sql_query_declares_explicit_column_list",
      "status": "pass",
      "evidence": "queries: every declared query row declares an explicit column list, no SELECT * in app code"
    },
    {
      "section": "query_construction_pagination_and_n_plus_one_prevention",
      "check": "every_sql_query_declares_bounded_or_paginated_access",
      "status": "pass",
      "evidence": "queries: every declared query row declares bounded or paginated access, no unbounded scan"
    },
    {
      "section": "query_construction_pagination_and_n_plus_one_prevention",
      "check": "every_sql_query_declares_n_plus_one_avoidance",
      "status": "pass",
      "evidence": "queries: every declared query row declares its N+1 avoidance"
    },
    {
      "section": "query_construction_pagination_and_n_plus_one_prevention",
      "check": "no_sql_query_name_duplicated",
      "status": "pass",
      "evidence": "queries: no declared query name appears on more than one row"
    },
    {
      "section": "transactions_and_concurrency",
      "check": "sql_transactions_kept_short",
      "status": "pass",
      "evidence": "transactions: transactions are kept short"
    },
    {
      "section": "transactions_and_concurrency",
      "check": "sql_isolation_level_known_for_transactions",
      "status": "pass",
      "evidence": "transactions: the isolation level in use is known and declared"
    },
    {
      "section": "transactions_and_concurrency",
      "check": "sql_deadlock_retry_with_backoff_declared",
      "status": "pass",
      "evidence": "transactions: deadlocks are expected and handled with retry and backoff"
    },
    {
      "section": "sql_safety_and_bounded_writes",
      "check": "sql_all_external_input_bound_as_parameters",
      "status": "pass",
      "evidence": "safety: all external input is bound as parameters, never string-built into SQL"
    },
    {
      "section": "sql_safety_and_bounded_writes",
      "check": "sql_update_and_delete_statements_all_carry_where",
      "status": "pass",
      "evidence": "safety: every UPDATE and DELETE carries a WHERE clause"
    },
    {
      "section": "sql_safety_and_bounded_writes",
      "check": "sql_bounded_writes_rehearsed_before_execution",
      "status": "pass",
      "evidence": "safety: bounded UPDATE and DELETE statements are rehearsed before execution"
    },
    {
      "section": "sql_safety_and_bounded_writes",
      "check": "every_sql_query_declares_parameterized_inputs",
      "status": "pass",
      "evidence": "safety: every declared query row declares parameterized inputs"
    },
    {
      "section": "migrations_and_migration_safety",
      "check": "sql_migrations_carry_forward_and_rollback_scripts",
      "status": "pass",
      "evidence": "migrations: every migration carries forward and rollback scripts"
    },
    {
      "section": "migrations_and_migration_safety",
      "check": "sql_migrations_tested_on_a_copy_before_live",
      "status": "pass",
      "evidence": "migrations: migrations are tested on a copy before live data"
    },
    {
      "section": "migrations_and_migration_safety",
      "check": "sql_zero_downtime_migrations_use_expand_migrate_contract",
      "status": "pass",
      "evidence": "migrations: zero-downtime changes use expand, migrate, then contract"
    },
    {
      "section": "migrations_and_migration_safety",
      "check": "sql_one_logical_change_per_migration",
      "status": "pass",
      "evidence": "migrations: one logical change per migration"
    },
    {
      "section": "performance_evidence_and_plan_regression",
      "check": "sql_explain_analyze_captured_before_and_after_heavy_changes",
      "status": "pass",
      "evidence": "performance: EXPLAIN ANALYZE evidence is captured before and after heavy changes"
    },
    {
      "section": "performance_evidence_and_plan_regression",
      "check": "sql_query_plan_regressions_watched_after_changes",
      "status": "pass",
      "evidence": "performance: query plan regressions are watched after changes"
    },
    {
      "section": "sql_red_lines",
      "check": "sql_no_string_concatenated_sql_with_user_input",
      "status": "pass",
      "evidence": "red line: no string-concatenated SQL with user input is present in the record"
    },
    {
      "section": "sql_red_lines",
      "check": "sql_no_unreviewed_migration_on_live_data",
      "status": "pass",
      "evidence": "red line: no unreviewed migration on live data is present in the record"
    },
    {
      "section": "sql_red_lines",
      "check": "sql_no_direct_to_production_schema_edit",
      "status": "pass",
      "evidence": "red line: no direct-to-production schema edit is present in the record"
    },
    {
      "section": "sql_red_lines",
      "check": "sql_no_unbounded_write_without_where",
      "status": "pass",
      "evidence": "red line: no unbounded UPDATE or DELETE without a WHERE clause is present in the record"
    }
  ],
  "computed_status": "outside_stated_limits_on_declared_evidence",
  "tables_count": 1,
  "indexes_count": 1,
  "queries_count": 1,
  "tables_without_primary_key": [
    "InvalidTableName"
  ],
  "tables_without_schema_constraints": [],
  "tables_without_not_null_default": [],
  "tables_with_non_snake_case_names": [
    "InvalidTableName"
  ],
  "duplicate_sql_table_names": [],
  "indexes_without_columns": [],
  "duplicate_sql_index_names": [],
  "queries_without_explicit_column_list": [],
  "queries_without_bounded_or_paginated_access": [],
  "queries_without_parameterized_inputs": [],
  "queries_without_n_plus_one_avoidance": [],
  "uncovered_sql_queries": [
    "get_user_by_email"
  ],
  "duplicate_sql_query_names": [],
  "table_primary_key_coverage": "0.000000",
  "table_schema_constraints_coverage": "1.000000",
  "table_not_null_default_coverage": "1.000000",
  "index_columns_coverage": "1.000000",
  "query_explicit_column_list_coverage": "1.000000",
  "query_bounded_or_paginated_coverage": "1.000000",
  "query_parameterized_inputs_coverage": "1.000000",
  "query_n_plus_one_avoidance_coverage": "1.000000",
  "query_index_support_coverage": "0.000000",
  "summary": "41 pass, 3 fail, 0 missing of 44 checks across eight sections.",
  "stamp": "SQL SCHEMA QUERY ENGINEERING PACK\nproject: fail-project\nVERDICT: SQL_SCHEMA_QUERY_ENGINEERING_PACK_NOT_READY\n  schema_constraints_and_naming                fail\n  index_design_from_access_patterns            fail\n  query_construction_pagination_and_n_plus_one_prevention pass\n  transactions_and_concurrency                 pass\n  sql_safety_and_bounded_writes                pass\n  migrations_and_migration_safety              pass\n  performance_evidence_and_plan_regression     pass\n  sql_red_lines                                pass\n41 pass, 3 fail, 0 missing of 44 checks across eight sections."
}
```

### Example 3 — Malformed (case `malformed`)

Provenance: recorded 2026-11-16T12:26:50.690077+00:00 · gateway v1.1.0 · external verification battery Wave 15 · source `verification/work/sql-schema-query-engineering-pack/evidence.json`.

Input:

```json
{
  "project": 12345,
  "schema_design": {
    "precise_column_types_declared": true,
    "not_null_default_with_nullable_exceptions_explicit": true,
    "check_and_foreign_key_constraints_in_database": true,
    "snake_case_naming_consistent": true
  },
  "tables": [
    {
      "name": "users",
      "primary_key_declared": true,
      "schema_constraints_declared": true,
      "not_null_default_declared": true
    }
  ],
  "index_design": {
    "indexes_derived_from_real_access_patterns": true,
    "composite_index_column_order_follows_query_order": true,
    "index_write_cost_measured_before_adding": true
  },
  "indexes": [
    {
      "name": "idx_users_email",
      "table": "users",
      "columns": [
        "email"
      ]
    }
  ],
  "queries": [
    {
      "name": "get_user_by_email",
      "table": "users",
      "supporting_index_name": "idx_users_email",
      "explicit_column_list_declared": true,
      "bounded_or_paginated_declared": true,
      "parameterized_inputs_declared": true,
      "n_plus_one_avoidance_declared": true
    }
  ],
  "query_practice": {
    "set_based_queries_preferred": true,
    "complex_reads_use_ctes_or_window_functions": true,
    "large_results_paginated": true,
    "related_data_joined_batched_or_preloaded": true,
    "query_count_tests_verify_no_n_plus_one": true
  },
  "transactions": {
    "transactions_kept_short": true,
    "isolation_level_known": true,
    "deadlock_retry_with_backoff_declared": true
  },
  "sql_safety": {
    "all_external_input_bound_as_parameters": true,
    "update_and_delete_statements_all_carry_where": true,
    "bounded_writes_rehearsed_before_execution": true
  },
  "migrations": {
    "forward_and_rollback_scripts_present": true,
    "migrations_tested_on_a_copy": true,
    "expand_migrate_contract_for_zero_downtime": true,
    "one_logical_change_per_migration": true
  },
  "performance_evidence": {
    "explain_analyze_captured_before_and_after_heavy_changes": true,
    "query_plan_regressions_watched": true
  },
  "sql_red_lines": {
    "string_concatenated_sql_with_user_input_present": false,
    "unreviewed_migration_on_live_data_present": false,
    "direct_to_production_schema_edit_present": false,
    "unbounded_write_without_where_present": false
  }
}
```

Response (HTTP 422):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "project",
  "detail": "project must be a string"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present | Yes — Tutorial, How-to guides, Reference, Explanation |
| Role views present | Integrators (Users) Yes · Developers Yes · Ops Yes · Regulators Yes — this atom was deployed census-style under a U-13 screen classified (b) screen-NO — flag-with-controls (census class), with the three named controls recorded in SERVICE.md's U-13 section; the flag stays open for the Director's review (see Role views, For regulators) |
| Checks named | 44 documented / 44 recorded in the full-pass response |
| Verdict vocabulary complete | Yes — 3 verdicts, `computed_status` (2 values + null), 3 section statuses, 3 per-check statuses, plus the secondary computed fields (`tables_count`, `indexes_count`, `queries_count`, the thirteen row-name / duplicate lists and the nine coverage ratios) |
| Input reference typed | Yes — 57 fields, each with its type from SERVICE.md, or, where SERVICE.md states no type, grounded in the recorded evidence inputs and the recorded MCP `inputSchema` and said so |
| Worked examples verbatim-verified | Yes — full-pass, violations and malformed inputs and REST responses parsed and compared as JSON values against `verification/work/sql-schema-query-engineering-pack/evidence.json` |
