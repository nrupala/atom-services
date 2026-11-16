# Database design review — user guide

Full documentation: [DOCUMENTATION.md](DOCUMENTATION.md)

## What it does

You have a database design record — store selection, declared tables, normalization, query patterns and indexes, integrity, transactions and security, migrations and backups. This atom reads one declared manifest and returns one deterministic verdict across four sections: **DATABASE_DESIGN_SOUND**, **DATABASE_DESIGN_NOT_SOUND**, or **INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing — the verdict names exactly which). It audits the declared record's completeness and internal consistency only — it designs no schema, chooses no store, runs no database, and never judges whether the chosen store is actually right for the workload or the normalization truly 3NF. Computed checks: the declared `tables`, `query_patterns` and `indexes` lists must each be present and non-empty; every declared table must name a non-empty `primary_key` and declare its constraints; every declared index must declare a non-empty `columns` list; and every declared query pattern must name a supporting index that is actually declared — an index matches only when its `name` equals the pattern's `supporting_index` **and** its declared `table` equals the pattern's table. Two checks are conditional: denormalization reasons are required only when denormalization is declared, and an explicit consistency/availability trade-off is required only when a distributed store is declared in use; otherwise those checks pass as not applicable. No numeric threshold is imposed — no minimum table, index or coverage count beyond completeness over your own declared rows. Same manifest in → same verdict out.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "database-design-review"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/database-design-review` — tool name `database_design_review`; `tools/call` arguments = the manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/database-design-review` — body = the manifest object; same `Authorization` header.

## Input — the database-design manifest

All fields are booleans unless noted.

| Field | Meaning |
|---|---|
| `design` | design / system name (string; carried into the output, not checked) |
| `store_selection.access_patterns_mapped` / `store_chosen_from_access_patterns` / `relational_default_or_fit_justified` | store-selection evidence: access patterns mapped before the choice, store chosen from them, relational by default or the non-relational fit justified |
| `tables` (list of `{name, primary_key, constraints_declared}`) | computed: list must be present and non-empty; each row's `primary_key` (string) must be non-empty and `constraints_declared` must be `true`; reported as `tables_count`, `tables_without_primary_key`, `tables_without_constraints_declared` and `primary_key_coverage` |
| `normalization.normalized_to_3nf` | normalized to 3NF declared |
| `normalization.denormalized` / `denormalization_reasons_documented` | reasons documented is required only when `denormalized` is `true` |
| `query_patterns` (list of `{name, table, supporting_index}`) | computed: list must be present and non-empty; each pattern's `supporting_index` must name a declared index on the same `table`; reported as `query_patterns_count`, `uncovered_query_patterns` and `query_pattern_index_coverage` |
| `indexes` (list of `{name, table, columns}`) | computed: list must be present and non-empty; each row's `columns` (list of strings) must be present and non-empty; reported as `indexes_count` |
| `indexing.composite_column_order_equality_then_range` / `covering_indexes_for_hot_queries` / `write_cost_considered` / `explain_analyze_before_and_after` | indexing evidence |
| `performance.measured_first` / `n_plus_one_queries_addressed` / `keyset_pagination_for_large_sets` / `connection_pooling_declared` / `bounded_result_sets` / `cache_deliberate_with_honest_invalidation` | performance evidence |
| `performance.offset_pagination_at_scale_present` | must be `false` to pass |
| `integrity.constraints_enforce_invariants` / `appropriate_types_used` | integrity evidence |
| `integrity.money_stored_as_float` | must be `false` to pass |
| `transactions.isolation_level_and_anomalies_known` / `transactions_kept_short` / `writes_idempotent_where_retries_possible` | transaction evidence |
| `transactions.distributed_store_used` / `consistency_availability_tradeoff_explicit` | the trade-off is required only when `distributed_store_used` is `true` |
| `security.parametrized_queries_only` / `least_privilege_users_per_service` / `encryption_at_rest` | security evidence |
| `security.string_concatenated_sql_present` / `shared_superuser_present` | must be `false` to pass |
| `migrations.forward_only` / `expand_contract_pattern_used` | migration evidence |
| `migrations.past_migrations_edited` / `big_bang_schema_swap_present` | must be `false` to pass |
| `backups.backups_scheduled` / `restores_tested_on_schedule` | backup evidence |
| `backups.untested_backup_trusted` | must be `false` to pass |

A field **absent** = evidence missing (counts toward INSUFFICIENT_EVIDENCE). A field present but false/invalid = the check fails (counts toward DATABASE_DESIGN_NOT_SOUND).

## Worked example (real request + real response, from external testing 2026-11-15)

Request — `POST /v1/database-design-review`:

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

Response — HTTP 200 (trimmed; the full response carries all 42 checks and a text stamp of the verdict):

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
  "computed_status": "within_stated_limits_on_declared_evidence",
  "tables_count": 1,
  "tables_without_primary_key": [],
  "tables_without_constraints_declared": [],
  "primary_key_coverage": "1.0000",
  "query_patterns_count": 1,
  "indexes_count": 1,
  "uncovered_query_patterns": [],
  "query_pattern_index_coverage": "1.0000",
  "summary": "42 pass, 0 fail, 0 missing of 42 checks across four sections."
}
```

## Verdicts

- **DATABASE_DESIGN_SOUND** — every check passes; the design record is complete and internally consistent on the declared evidence.
- **DATABASE_DESIGN_NOT_SOUND** — at least one check fails; the failing checks name the breached rule and the evidence against it.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

The response also reports `tables_count`, `query_patterns_count` and `indexes_count` (declared list lengths, or null when a list is not declared), `tables_without_primary_key`, `tables_without_constraints_declared` and `uncovered_query_patterns` (row-name lists, or null when the underlying list is not declared), `primary_key_coverage` and `query_pattern_index_coverage` (ratios as strings with exactly four decimals, or null when the denominator list is absent or empty — and, for query-pattern coverage, when the indexes list is absent) and `computed_status` (`within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null).

Errors: `401` missing/invalid key · `403` key lacks this atom's scope · `422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
