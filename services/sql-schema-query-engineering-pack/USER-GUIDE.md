# SQL schema & query engineering pack — user guide

Full documentation: [DOCUMENTATION.md](DOCUMENTATION.md)

## What it does

You submit one declared SQL schema + query engineering record — a manifest for one database and its application queries, made from the system's actual practice — and this atom returns one deterministic verdict across eight sections (schema_constraints_and_naming, index_design_from_access_patterns, query_construction_pagination_and_n_plus_one_prevention, transactions_and_concurrency, sql_safety_and_bounded_writes, migrations_and_migration_safety, performance_evidence_and_plan_regression, sql_red_lines): **SQL_SCHEMA_QUERY_ENGINEERING_PACK_READY**, **SQL_SCHEMA_QUERY_ENGINEERING_PACK_NOT_READY**, or **INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing — the checks marked `missing` name exactly what). It runs 44 checks. It audits the declared record's completeness and internal consistency only — it connects to **no database**, executes **no SQL** against any live system, runs no `EXPLAIN ANALYZE`, reviews **no live codebase**, repository, migration file or query plan, and does not verify that declared practice was ever carried out. A record is ready *on your declared evidence*: a manifest that declares every query parameterized and every migration rollback-tested passes those checks even if the real system does none of it. It is not a database, a query optimizer, a migration runner, a security audit, or a guarantee that the schema is correct or the queries are fast: it never judges whether a declared constraint is the right constraint, whether a declared index will actually be used by the planner, whether the declared isolation level is adequate, or whether a declared column type is correct in the real DDL — only that the record contains what the skill's practice demands, and that its declared table, index and query rows are internally consistent. Designing a schema for you, writing or rewriting SQL for you, choosing indexes for a real workload, and running or reviewing live migrations are all excluded by name — the skill's prescriptive moves are checked only as declared presence/consistency, never emitted as design advice. The computed checks: each declared list (tables, indexes, queries) passes only when present and non-empty; every declared table row must declare a primary key, schema constraints and a NOT NULL default true; every declared table name must match the fixed snake_case pattern `[a-z][a-z0-9_]*` in full; no table, index or query name may be duplicated; every declared index row must declare a present, non-empty `columns` list; every declared query must name a supporting index that is actually declared with its `name` equal to the query's `supporting_index_name` and its declared `table` equal to the query's declared `table`; and every declared query row must declare an explicit column list, bounded or paginated access, parameterized inputs and N+1 avoidance, each true per row. No numeric threshold is imposed — the skill states none, and none is invented: no minimum or maximum table, index or query count; no coverage percentage below completeness over your declared rows; no numeric transaction-length limit for "short"; no numeric result-set size or page size that makes a result "large"; no deadlock retry count, backoff base or backoff cap; no isolation-level vocabulary (the skill requires the level be *known*, and names no allowed values, so only that attestation is checked); no query-plan cost, row-estimate or timing figure an `EXPLAIN ANALYZE` capture must show (only that the evidence is captured before and after is checked); no composite-index column-count limit; and no snake_case rule beyond the fixed `[a-z][a-z0-9_]*` pattern (no length limit, no reserved-word list). Quantities are computed and reported; the only bar on the computed rows is completeness over your own declared rows. Same manifest in → same verdict out.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "sql-schema-query-engineering-pack"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/sql-schema-query-engineering-pack` — tool name `sql_schema_query_engineering_pack`; `tools/call` arguments = the manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/sql-schema-query-engineering-pack` — body = the manifest object; same `Authorization` header.

## Input

| Field | Meaning |
|---|---|
| `project` (string) | Project under review; carried into the verdict output, not itself checked |
| `schema_design.precise_column_types_declared` | schema evidence: precise column types are declared for the schema |
| `schema_design.not_null_default_with_nullable_exceptions_explicit` | schema evidence: NOT NULL is the default and nullable exceptions are explicit |
| `schema_design.check_and_foreign_key_constraints_in_database` | schema evidence: CHECK and foreign-key constraints are enforced in the database, not only in app code |
| `schema_design.snake_case_naming_consistent` | schema evidence: naming is consistent snake_case across the schema |
| `tables` (list of table-row objects) | computed: must be present and non-empty; reported as `tables_count` |
| `tables[].name` (string) | names the row in the computed outputs; computed for snake_case (`[a-z][a-z0-9_]*` in full) and duplication |
| `tables[].primary_key_declared` | computed: must be `true` per row |
| `tables[].schema_constraints_declared` | computed: must be `true` per row |
| `tables[].not_null_default_declared` | computed: must be `true` per row |
| `index_design.indexes_derived_from_real_access_patterns` | index evidence: indexes are derived from real access patterns |
| `index_design.composite_index_column_order_follows_query_order` | index evidence: composite index column order follows the query order that uses it |
| `index_design.index_write_cost_measured_before_adding` | index evidence: over-indexing write cost is measured before indexes are added |
| `indexes` (list of index-row objects) | computed: must be present and non-empty; reported as `indexes_count` |
| `indexes[].name` (string) | the name a query's `supporting_index_name` must equal to match; computed for duplication |
| `indexes[].table` (string) | must equal the query's declared table to match |
| `indexes[].columns` (list of strings) | computed: must be present and non-empty per row |
| `queries` (list of query-row objects) | computed: must be present and non-empty; reported as `queries_count` |
| `queries[].name` (string) | names the row in the computed outputs; computed for duplication |
| `queries[].table` (string) | a supporting index matches only on the same declared table |
| `queries[].supporting_index_name` (string) | computed: must name a declared index on the same table |
| `queries[].explicit_column_list_declared` | computed: must be `true` per row (no `SELECT *` in app code) |
| `queries[].bounded_or_paginated_declared` | computed: must be `true` per row (no unbounded scan) |
| `queries[].parameterized_inputs_declared` | computed: must be `true` per row |
| `queries[].n_plus_one_avoidance_declared` | computed: must be `true` per row |
| `query_practice.set_based_queries_preferred` | query evidence: set-based queries are preferred over row-by-row processing |
| `query_practice.complex_reads_use_ctes_or_window_functions` | query evidence: complex reads use CTEs or window functions where needed |
| `query_practice.large_results_paginated` | query evidence: large results are paginated |
| `query_practice.related_data_joined_batched_or_preloaded` | query evidence: related data is joined, batched or preloaded instead of fetched row by row |
| `query_practice.query_count_tests_verify_no_n_plus_one` | query evidence: query-count tests verify no N+1 pattern is introduced |
| `transactions.transactions_kept_short` | transaction evidence: transactions are kept short |
| `transactions.isolation_level_known` | transaction evidence: the isolation level in use is known and declared |
| `transactions.deadlock_retry_with_backoff_declared` | transaction evidence: deadlocks are expected and handled with retry and backoff |
| `sql_safety.all_external_input_bound_as_parameters` | safety evidence: all external input is bound as parameters, never string-built into SQL |
| `sql_safety.update_and_delete_statements_all_carry_where` | safety evidence: every UPDATE and DELETE carries a WHERE clause |
| `sql_safety.bounded_writes_rehearsed_before_execution` | safety evidence: bounded UPDATE and DELETE statements are rehearsed before execution |
| `migrations.forward_and_rollback_scripts_present` | migration evidence: every migration carries forward and rollback scripts |
| `migrations.migrations_tested_on_a_copy` | migration evidence: migrations are tested on a copy before live data |
| `migrations.expand_migrate_contract_for_zero_downtime` | migration evidence: zero-downtime changes use expand, migrate, then contract |
| `migrations.one_logical_change_per_migration` | migration evidence: one logical change per migration |
| `performance_evidence.explain_analyze_captured_before_and_after_heavy_changes` | performance evidence: EXPLAIN ANALYZE evidence is captured before and after heavy changes |
| `performance_evidence.query_plan_regressions_watched` | performance evidence: query plan regressions are watched after changes |
| `sql_red_lines.string_concatenated_sql_with_user_input_present` | must be `false` to pass (red line: no string-concatenated SQL with user input) |
| `sql_red_lines.unreviewed_migration_on_live_data_present` | must be `false` to pass (red line: no unreviewed migration on live data) |
| `sql_red_lines.direct_to_production_schema_edit_present` | must be `false` to pass (red line: no direct-to-production schema edit) |
| `sql_red_lines.unbounded_write_without_where_present` | must be `false` to pass (red line: no unbounded UPDATE or DELETE without a WHERE clause) |

A field **absent** = evidence missing (counts toward INSUFFICIENT_EVIDENCE). A field present but false/invalid = the check fails (counts toward SQL_SCHEMA_QUERY_ENGINEERING_PACK_NOT_READY). All fields are booleans unless noted.

## Worked example (real request + real response, from external testing 2026-11-16)

Request — `POST /v1/sql-schema-query-engineering-pack`:

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

Response — HTTP 200 (trimmed; the full response carries all 44 checks and a text stamp of the verdict):

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
  "summary": "44 pass, 0 fail, 0 missing of 44 checks across eight sections."
}
```

## Verdicts

- **SQL_SCHEMA_QUERY_ENGINEERING_PACK_READY** — every check passes; the declared SQL schema + query engineering record is complete and internally consistent.
- **SQL_SCHEMA_QUERY_ENGINEERING_PACK_NOT_READY** — at least one check fails; the failing checks name the breached requirement and the evidence against it.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

The response also reports `computed_status` (`within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null when any of the sixteen primary computed checks cannot be completed), `tables_count`, `indexes_count` and `queries_count` (the declared list lengths, or null when the list is not declared — counts are reported as integers, exactly), the row-name lists `tables_without_primary_key`, `tables_without_schema_constraints`, `tables_without_not_null_default`, `tables_with_non_snake_case_names`, `duplicate_sql_table_names`, `indexes_without_columns`, `duplicate_sql_index_names`, `queries_without_explicit_column_list`, `queries_without_bounded_or_paginated_access`, `queries_without_parameterized_inputs`, `queries_without_n_plus_one_avoidance`, `uncovered_sql_queries` and `duplicate_sql_query_names` (each null when its underlying list — or, for uncovered queries, either list — is not declared), and the coverage ratios `table_primary_key_coverage`, `table_schema_constraints_coverage`, `table_not_null_default_coverage`, `index_columns_coverage`, `query_explicit_column_list_coverage`, `query_bounded_or_paginated_coverage`, `query_parameterized_inputs_coverage`, `query_n_plus_one_avoidance_coverage` and `query_index_support_coverage` (each a string with exactly six decimal places by the fixed rule round half up to 6dp, `floor(v * 1000000 + 0.5) / 1000000`, then format with exactly six decimals; a ratio is null when its denominator list is absent or empty, and for query index support also when the indexes list is absent).

Errors: `401` missing/invalid key · `403` key lacks this atom's scope · `422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
