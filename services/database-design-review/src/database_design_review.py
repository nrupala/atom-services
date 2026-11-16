#!/usr/bin/env python3
"""Database design review — deterministic core.

Built from the bound skill `database-sme`: "Model the domain,
then pick the store that fits the access patterns — not the hype.
Schema mistakes are the most expensive to undo."

This atom is an AUDIT of a declared database design record: it
validates the record a caller declares against the skill's
sections — choosing a store, relational design, indexing,
transactions & consistency, migrations, performance, security &
sovereignty, backups, and the anti-patterns it refuses. It does
not design a schema, choose a store for the caller, run a
database, or verify that a declared control actually works — it
checks that the record the skill requires is present and
internally complete and consistent on the declared evidence.

The caller submits a database-design manifest (a dict, or JSON
on the CLI). Every check reads declared manifest fields:

- field present and true/valid   -> pass
- field present and false/invalid -> fail
- field absent                    -> missing (evidence not provided)

Computed checks use ONLY what the skill itself states, plus the
consistency of the declared rows themselves — no outside
threshold is imported:

- tables: the declared `tables` list must be non-empty, every
  declared table row must name a primary key, and every row must
  declare its constraints;
- query patterns vs indexes: the declared `query_patterns` and
  `indexes` lists must be non-empty, every declared index must
  declare its columns, and every declared query pattern must name
  a supporting index that is actually declared — an index matches
  only when its name equals the pattern's `supporting_index` and
  its declared table equals the pattern's declared table;
- two check groups are conditional, following the skill's own
  scoping: the denormalization-reason check binds only when
  denormalization is declared (skill: "denormalize deliberately
  ... and document why"), and the consistency/availability
  trade-off check binds only when a distributed store is declared
  in use (skill: "Be explicit about the consistency vs
  availability trade-off for distributed stores").

Computed ratios are serialized as strings with exactly four
decimal places, produced in both implementations by the same
fixed rule — round half up to 4dp, floor(v * 10000 + 0.5) /
10000, then format with exactly four decimals; comparisons use
the unrounded values. That fixed serialization is what makes the
Python and TypeScript outputs byte-identical. Counts are reported
as integers (exact). The declared rows that fail the primary-key
and constraint computations are reported by name as
`tables_without_primary_key` and
`tables_without_constraints_declared`; declared query patterns
whose declared supporting index names no matching declared index
are reported as `uncovered_query_patterns`. The computed outcome
over the six primary computed checks is reported as
`computed_status`.

The skill states no numeric threshold — no table count, index
count, coverage percentage, transaction duration, backup
frequency, or restore cadence in numbers — so no numeric
threshold check is invented; quantities are computed and reported,
and completeness (every declared table / every declared query
pattern) is the only bar, exactly as the task's declared-row
consistency requires.

Verdict:
- any fail             -> DATABASE_DESIGN_NOT_SOUND
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> DATABASE_DESIGN_SOUND

No model call, no network, no clock dependence: the same manifest
always produces the same verdict. That determinism is the product.
"""
import json
import math
import sys

SECTIONS = (
    "schema_and_normalization",
    "indexing_and_performance",
    "integrity_transactions_and_security",
    "migrations_and_backups",
)

# Documented manifest field types (SERVICE.md input table). Every
# field the core reads is listed, in read order. A field present
# with the wrong JSON type is a caller error (ValueError -> the
# gateway's HTTP 422 invalid_input), never evidence: F1 remedy,
# external verification Wave 1. Absent fields are not validated —
# absence is missing evidence, decided by the checks below.
MANIFEST_SPEC = {
    "design": "string",
    "store_selection": {
        "access_patterns_mapped": "boolean",
        "store_chosen_from_access_patterns": "boolean",
        "relational_default_or_fit_justified": "boolean",
    },
    "tables": [{
        "name": "string",
        "primary_key": "string",
        "constraints_declared": "boolean",
    }],
    "normalization": {
        "normalized_to_3nf": "boolean",
        "denormalized": "boolean",
        "denormalization_reasons_documented": "boolean",
    },
    "query_patterns": [{
        "name": "string",
        "table": "string",
        "supporting_index": "string",
    }],
    "indexes": [{
        "name": "string",
        "table": "string",
        "columns": ["string"],
    }],
    "indexing": {
        "composite_column_order_equality_then_range": "boolean",
        "covering_indexes_for_hot_queries": "boolean",
        "write_cost_considered": "boolean",
        "explain_analyze_before_and_after": "boolean",
    },
    "performance": {
        "measured_first": "boolean",
        "n_plus_one_queries_addressed": "boolean",
        "keyset_pagination_for_large_sets": "boolean",
        "offset_pagination_at_scale_present": "boolean",
        "connection_pooling_declared": "boolean",
        "bounded_result_sets": "boolean",
        "cache_deliberate_with_honest_invalidation": "boolean",
    },
    "integrity": {
        "constraints_enforce_invariants": "boolean",
        "appropriate_types_used": "boolean",
        "money_stored_as_float": "boolean",
    },
    "transactions": {
        "isolation_level_and_anomalies_known": "boolean",
        "transactions_kept_short": "boolean",
        "writes_idempotent_where_retries_possible": "boolean",
        "distributed_store_used": "boolean",
        "consistency_availability_tradeoff_explicit": "boolean",
    },
    "security": {
        "parametrized_queries_only": "boolean",
        "string_concatenated_sql_present": "boolean",
        "least_privilege_users_per_service": "boolean",
        "shared_superuser_present": "boolean",
        "encryption_at_rest": "boolean",
    },
    "migrations": {
        "forward_only": "boolean",
        "past_migrations_edited": "boolean",
        "expand_contract_pattern_used": "boolean",
        "big_bang_schema_swap_present": "boolean",
    },
    "backups": {
        "backups_scheduled": "boolean",
        "restores_tested_on_schedule": "boolean",
        "untested_backup_trusted": "boolean",
    },
}


def _validate_value(value, spec, path):
    if spec == "any":
        return
    if spec == "string":
        if not isinstance(value, str):
            raise ValueError(f"{path} must be a string")
        return
    if spec == "boolean":
        if not isinstance(value, bool):
            raise ValueError(f"{path} must be a boolean")
        return
    if spec == "number":
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            raise ValueError(f"{path} must be a number")
        return
    if isinstance(spec, list):
        if not isinstance(value, list):
            raise ValueError(f"{path} must be a list")
        for index, entry in enumerate(value):
            _validate_value(entry, spec[0], f"{path}[{index}]")
        return
    if isinstance(spec, dict):
        if not isinstance(value, dict):
            raise ValueError(f"{path} must be an object")
        _validate_fields(value, spec, path)
        return
    raise AssertionError(f"unknown manifest spec at {path}")


def _validate_fields(obj, spec, prefix):
    for field, field_spec in spec.items():
        if field not in obj:
            continue
        value = obj[field]
        path = f"{prefix}.{field}" if prefix else field
        _validate_value(value, field_spec, path)


def _validate_manifest(manifest):
    _validate_fields(manifest, MANIFEST_SPEC, "")


def _get(manifest, *path):
    cur = manifest
    for key in path:
        if not isinstance(cur, dict) or key not in cur:
            return None, False
        cur = cur[key]
    return cur, True


def _check(results, section, name, value, present, ok, evidence):
    if not present:
        status = "missing"
    else:
        status = "pass" if ok else "fail"
    results.append(
        {"section": section, "check": name, "status": status,
         "evidence": evidence}
    )


def _bool_check(results, section, name, manifest, path, evidence):
    value, present = _get(manifest, *path)
    _check(results, section, name, value, present, value is True, evidence)


def _false_check(results, section, name, manifest, path, evidence):
    value, present = _get(manifest, *path)
    _check(results, section, name, value, present, value is False,
           evidence)


def _gated_bool_check(results, section, name, manifest, gate_path,
                      target_path, evidence, na_evidence):
    gate, has_gate = _get(manifest, *gate_path)
    target, has_target = _get(manifest, *target_path)
    if has_gate and gate:
        _check(results, section, name, target, has_target,
               target is True, evidence)
    else:
        _check(results, section, name, gate, has_gate, True,
               na_evidence)


def _fmt4(value):
    """Fixed 4dp serialization: round half up, then 4 decimals."""
    if value is None:
        return None
    rounded = math.floor(value * 10000 + 0.5) / 10000
    return f"{rounded:.4f}"


def _row_name(entry):
    if isinstance(entry, dict) and isinstance(entry.get("name"), str):
        return entry["name"]
    return "unnamed"


def _has_pk(entry):
    return (
        isinstance(entry, dict)
        and isinstance(entry.get("primary_key"), str)
        and len(entry["primary_key"]) > 0
    )


def evaluate(manifest):
    """Return the verdict dict for a database-design manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Declared rows, read once for the computed checks ----
    tables, has_tables = _get(manifest, "tables")
    tables_is_list = has_tables and isinstance(tables, list)
    patterns, has_patterns = _get(manifest, "query_patterns")
    patterns_is_list = has_patterns and isinstance(patterns, list)
    indexes, has_indexes = _get(manifest, "indexes")
    indexes_is_list = has_indexes and isinstance(indexes, list)

    tables_count = len(tables) if tables_is_list else None
    patterns_count = len(patterns) if patterns_is_list else None
    indexes_count = len(indexes) if indexes_is_list else None

    tables_without_pk = (
        [_row_name(t) for t in tables if not _has_pk(t)]
        if tables_is_list else None
    )
    tables_without_constraints = (
        [_row_name(t) for t in tables
         if not (isinstance(t, dict)
                 and t.get("constraints_declared") is True)]
        if tables_is_list else None
    )
    primary_key_coverage = (
        (tables_count - len(tables_without_pk)) / tables_count
        if tables_is_list and tables_count > 0 else None
    )

    def _index_matches(pattern):
        if not isinstance(pattern, dict):
            return False
        supporting = pattern.get("supporting_index")
        if not isinstance(supporting, str) or len(supporting) == 0:
            return False
        if not indexes_is_list:
            return False
        for idx in indexes:
            if (
                isinstance(idx, dict)
                and idx.get("name") == supporting
                and idx.get("table") == pattern.get("table")
            ):
                return True
        return False

    uncovered_patterns = (
        [_row_name(p) for p in patterns
         if isinstance(p, dict)
         and isinstance(p.get("supporting_index"), str)
         and len(p["supporting_index"]) > 0
         and not _index_matches(p)]
        if patterns_is_list and indexes_is_list else None
    )
    covered_count = (
        sum(1 for p in patterns if _index_matches(p))
        if patterns_is_list and indexes_is_list else None
    )
    pattern_coverage = (
        covered_count / patterns_count
        if covered_count is not None and patterns_count
        else None
    )

    # ---- Section 1: schema_and_normalization (skill: choosing a
    #      store — map access patterns before choosing, relational
    #      by default for relationships/integrity, document/KV/graph
    #      only when the pattern genuinely fits; relational design
    #      — normalize to 3NF first, denormalize deliberately and
    #      document why, constraints are data integrity) ----
    _bool_check(results, "schema_and_normalization",
                "access_patterns_mapped_before_store_choice", manifest,
                ("store_selection", "access_patterns_mapped"),
                "choosing a store: the access patterns — reads vs "
                "writes, query shapes, consistency needs — are mapped "
                "before a store is chosen")
    _bool_check(results, "schema_and_normalization",
                "store_chosen_from_access_patterns", manifest,
                ("store_selection", "store_chosen_from_access_patterns"),
                "choosing a store: the store is picked for how the "
                "data is actually used — the declared access "
                "patterns, not the hype")
    _bool_check(results, "schema_and_normalization",
                "relational_default_or_fit_justified", manifest,
                ("store_selection", "relational_default_or_fit_justified"),
                "choosing a store: relational is the default for "
                "anything with relationships and integrity needs, "
                "and any document/KV/graph choice is justified by "
                "the access pattern genuinely fitting")
    _check(results, "schema_and_normalization", "tables_declared",
           tables, tables_is_list,
           tables_is_list and tables_count > 0,
           "relational design: the declared design record names "
           "its tables — the tables list is present and non-empty")
    pk_present = (
        tables_is_list
        and all(isinstance(t, dict) and "primary_key" in t
                for t in tables)
    )
    _check(results, "schema_and_normalization",
           "every_table_has_primary_key_named", tables, pk_present,
           tables_is_list and tables_count > 0
           and len(tables_without_pk) == 0,
           "relational design: every declared table row names a "
           "primary key")
    constraints_present = (
        tables_is_list
        and all(isinstance(t, dict) and "constraints_declared" in t
                for t in tables)
    )
    _check(results, "schema_and_normalization",
           "every_table_declares_constraints", tables,
           constraints_present,
           tables_is_list and tables_count > 0
           and len(tables_without_constraints) == 0,
           "relational design: every declared table row declares "
           "its constraints — NOT NULL, UNIQUE, FK, CHECK — so the "
           "database enforces invariants")
    _bool_check(results, "schema_and_normalization",
                "normalized_to_3nf_declared", manifest,
                ("normalization", "normalized_to_3nf"),
                "relational design: the design is normalized to 3NF "
                "first")
    _gated_bool_check(
        results, "schema_and_normalization",
        "denormalization_reasons_documented_when_denormalized",
        manifest, ("normalization", "denormalized"),
        ("normalization", "denormalization_reasons_documented"),
        "relational design: denormalization is deliberate, for "
        "hot read paths, and its reasons are documented",
        "no denormalization declared")

    # ---- Section 2: indexing_and_performance (skill: indexing —
    #      index for actual query patterns, composite column order
    #      matters, covering indexes on hot queries, every index
    #      taxes writes, EXPLAIN/ANALYZE before and after;
    #      performance — measure first, kill N+1, keyset pagination
    #      over OFFSET for large sets, connection pooling, bounded
    #      result sets; anti-pattern: OFFSET pagination at scale) ----
    _check(results, "indexing_and_performance",
           "query_patterns_declared", patterns, patterns_is_list,
           patterns_is_list and patterns_count > 0,
           "indexing: the declared design record names its query "
           "patterns — the query patterns list is present and "
           "non-empty")
    _check(results, "indexing_and_performance", "indexes_declared",
           indexes, indexes_is_list,
           indexes_is_list and indexes_count > 0,
           "indexing: the declared design record names its indexes "
           "— the indexes list is present and non-empty")
    columns_present = (
        indexes_is_list
        and all(isinstance(i, dict) and "columns" in i for i in indexes)
    )
    _check(results, "indexing_and_performance",
           "every_index_declares_columns", indexes, columns_present,
           indexes_is_list and indexes_count > 0
           and all(isinstance(i, dict)
                   and isinstance(i.get("columns"), list)
                   and len(i["columns"]) > 0 for i in indexes),
           "indexing: every declared index row declares its "
           "columns")
    matching_present = (
        patterns_is_list and indexes_is_list
        and all(isinstance(p, dict) and "supporting_index" in p
                and "table" in p for p in patterns)
    )
    _check(results, "indexing_and_performance",
           "every_query_pattern_has_matching_index", patterns,
           matching_present,
           patterns_is_list and indexes_is_list and patterns_count > 0
           and uncovered_patterns is not None
           and len(uncovered_patterns) == 0
           and covered_count == patterns_count,
           "indexing: every declared query pattern names a "
           "supporting index that is declared, on the same table — "
           "indexes are for the actual query patterns")
    _bool_check(results, "indexing_and_performance",
                "composite_index_column_order_equality_then_range",
                manifest,
                ("indexing",
                 "composite_column_order_equality_then_range"),
                "indexing: composite index column order matters — "
                "equality columns first, then range")
    _bool_check(results, "indexing_and_performance",
                "covering_indexes_for_hot_queries", manifest,
                ("indexing", "covering_indexes_for_hot_queries"),
                "indexing: covering indexes are aimed for on hot "
                "queries")
    _bool_check(results, "indexing_and_performance",
                "index_write_cost_considered", manifest,
                ("indexing", "write_cost_considered"),
                "indexing: the write cost is considered — every "
                "index taxes writes")
    _bool_check(results, "indexing_and_performance",
                "explain_analyze_before_and_after", manifest,
                ("indexing", "explain_analyze_before_and_after"),
                "indexing: EXPLAIN / ANALYZE is run before and "
                "after — measure, don't guess")
    _bool_check(results, "indexing_and_performance",
                "performance_measured_first", manifest,
                ("performance", "measured_first"),
                "performance: measure first")
    _bool_check(results, "indexing_and_performance",
                "n_plus_one_queries_addressed", manifest,
                ("performance", "n_plus_one_queries_addressed"),
                "performance: N+1 queries are killed")
    _bool_check(results, "indexing_and_performance",
                "keyset_pagination_for_large_sets", manifest,
                ("performance", "keyset_pagination_for_large_sets"),
                "performance: keyset (cursor) pagination is "
                "preferred for large sets")
    _false_check(results, "indexing_and_performance",
                 "no_offset_pagination_at_scale", manifest,
                 ("performance", "offset_pagination_at_scale_present"),
                 "anti-pattern: no OFFSET pagination at scale")
    _bool_check(results, "indexing_and_performance",
                "connection_pooling_declared", manifest,
                ("performance", "connection_pooling_declared"),
                "performance: connection pooling is declared")
    _bool_check(results, "indexing_and_performance",
                "bounded_result_sets", manifest,
                ("performance", "bounded_result_sets"),
                "performance: result sets are bounded")
    _bool_check(results, "indexing_and_performance",
                "cache_deliberate_and_invalidation_honest", manifest,
                ("performance",
                 "cache_deliberate_with_honest_invalidation"),
                "performance: caching is deliberate and invalidation "
                "is honest")

    # ---- Section 3: integrity_transactions_and_security (skill:
    #      relational design — constraints and right types;
    #      transactions & consistency — isolation level and its
    #      anomalies, short transactions, idempotent writes,
    #      explicit consistency vs availability trade-off;
    #      security & sovereignty — parametrized queries only,
    #      least-privilege users, no shared superuser, encryption
    #      at rest; anti-patterns: string-concatenated SQL, storing
    #      money as float) ----
    _bool_check(results, "integrity_transactions_and_security",
                "constraints_enforce_invariants", manifest,
                ("integrity", "constraints_enforce_invariants"),
                "relational design: constraints are data integrity "
                "— NOT NULL, UNIQUE, FK, CHECK — and the database "
                "enforces invariants")
    _bool_check(results, "integrity_transactions_and_security",
                "appropriate_types_used", manifest,
                ("integrity", "appropriate_types_used"),
                "relational design: the right types are used — "
                "timestamps with time zone, numeric for money, "
                "enums/lookup tables for categories")
    _false_check(results, "integrity_transactions_and_security",
                 "money_not_stored_as_float", manifest,
                 ("integrity", "money_stored_as_float"),
                 "anti-pattern: money is not stored as float")
    _bool_check(results, "integrity_transactions_and_security",
                "isolation_level_and_anomalies_known", manifest,
                ("transactions", "isolation_level_and_anomalies_known"),
                "transactions & consistency: the isolation level "
                "and what anomalies it permits are known")
    _bool_check(results, "integrity_transactions_and_security",
                "transactions_kept_short", manifest,
                ("transactions", "transactions_kept_short"),
                "transactions & consistency: transactions are kept "
                "short")
    _bool_check(results, "integrity_transactions_and_security",
                "writes_idempotent_where_retries_possible", manifest,
                ("transactions",
                 "writes_idempotent_where_retries_possible"),
                "transactions & consistency: writes are designed "
                "to be idempotent where retries are possible")
    _gated_bool_check(
        results, "integrity_transactions_and_security",
        "consistency_availability_tradeoff_explicit_when_distributed",
        manifest, ("transactions", "distributed_store_used"),
        ("transactions",
         "consistency_availability_tradeoff_explicit"),
        "transactions & consistency: the consistency vs "
        "availability trade-off is explicit for the distributed "
        "store in use",
        "no distributed store declared in use")
    _bool_check(results, "integrity_transactions_and_security",
                "parametrized_queries_only", manifest,
                ("security", "parametrized_queries_only"),
                "security: parametrized queries only — user input "
                "is never concatenated")
    _false_check(results, "integrity_transactions_and_security",
                 "no_string_concatenated_sql", manifest,
                 ("security", "string_concatenated_sql_present"),
                 "anti-pattern: no string-concatenated SQL")
    _bool_check(results, "integrity_transactions_and_security",
                "least_privilege_users_per_service", manifest,
                ("security", "least_privilege_users_per_service"),
                "security: least-privilege database users per "
                "service")
    _false_check(results, "integrity_transactions_and_security",
                 "no_shared_superuser", manifest,
                 ("security", "shared_superuser_present"),
                 "security: no shared superuser")
    _bool_check(results, "integrity_transactions_and_security",
                "encryption_at_rest_declared", manifest,
                ("security", "encryption_at_rest"),
                "security: encryption at rest is declared")

    # ---- Section 4: migrations_and_backups (skill: migrations —
    #      forward-only, reverse by a new migration never by
    #      editing history, expand/contract, no big-bang swaps;
    #      backups — a backup you haven't restored is a hope, test
    #      restores on a schedule; anti-patterns: editing past
    #      migrations, trusting an untested backup) ----
    _bool_check(results, "migrations_and_backups",
                "migrations_forward_only", manifest,
                ("migrations", "forward_only"),
                "migrations: migrations are forward-only")
    _false_check(results, "migrations_and_backups",
                 "no_past_migrations_edited", manifest,
                 ("migrations", "past_migrations_edited"),
                 "migrations / anti-pattern: past migrations are "
                 "never edited — reversal is a new migration")
    _bool_check(results, "migrations_and_backups",
                "expand_contract_pattern_used", manifest,
                ("migrations", "expand_contract_pattern_used"),
                "migrations: backward-compatible deploys use "
                "expand/contract — add new, backfill, switch reads, "
                "stop writes to old, drop old")
    _false_check(results, "migrations_and_backups",
                 "no_big_bang_schema_swap", manifest,
                 ("migrations", "big_bang_schema_swap_present"),
                 "migrations: no big-bang schema swaps against live "
                 "traffic")
    _bool_check(results, "migrations_and_backups",
                "backups_scheduled", manifest,
                ("backups", "backups_scheduled"),
                "backups: backups are scheduled")
    _bool_check(results, "migrations_and_backups",
                "restores_tested_on_schedule", manifest,
                ("backups", "restores_tested_on_schedule"),
                "backups: restores are tested on a schedule — a "
                "backup you haven't restored is a hope, not a backup")
    _false_check(results, "migrations_and_backups",
                 "untested_backup_not_trusted", manifest,
                 ("backups", "untested_backup_trusted"),
                 "anti-pattern: an untested backup is not trusted")

    sections = {}
    for section in SECTIONS:
        sec_results = [r for r in results if r["section"] == section]
        if any(r["status"] == "fail" for r in sec_results):
            sections[section] = "fail"
        elif any(r["status"] == "missing" for r in sec_results):
            sections[section] = "insufficient_evidence"
        else:
            sections[section] = "pass"

    if any(v == "fail" for v in sections.values()):
        verdict = "DATABASE_DESIGN_NOT_SOUND"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "DATABASE_DESIGN_SOUND"

    computed_names = (
        "tables_declared",
        "every_table_has_primary_key_named",
        "every_table_declares_constraints",
        "query_patterns_declared",
        "indexes_declared",
        "every_query_pattern_has_matching_index",
    )
    computed_statuses = [
        r["status"] for r in results if r["check"] in computed_names
    ]
    if any(s == "fail" for s in computed_statuses):
        computed_status = "outside_stated_limits_on_declared_evidence"
    elif all(s == "pass" for s in computed_statuses):
        computed_status = "within_stated_limits_on_declared_evidence"
    else:
        computed_status = None

    return {
        "service": "database-design-review",
        "atom_version": "0.1.0",
        "design": manifest.get("design"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "computed_status": computed_status,
        "tables_count": tables_count,
        "tables_without_primary_key": tables_without_pk,
        "tables_without_constraints_declared": tables_without_constraints,
        "primary_key_coverage": _fmt4(primary_key_coverage),
        "query_patterns_count": patterns_count,
        "indexes_count": indexes_count,
        "uncovered_query_patterns": uncovered_patterns,
        "query_pattern_index_coverage": _fmt4(pattern_coverage),
        "summary": (
            f"{sum(1 for r in results if r['status'] == 'pass')} pass, "
            f"{sum(1 for r in results if r['status'] == 'fail')} fail, "
            f"{sum(1 for r in results if r['status'] == 'missing')} missing "
            f"of {len(results)} checks across four sections."
        ),
    }


def stamp(verdict):
    """Human-readable stamp of a verdict dict."""
    lines = [
        "DATABASE DESIGN REVIEW",
        f"design: {verdict.get('design')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<36} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: database_design_review.py <manifest.json>",
              file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "DATABASE_DESIGN_SOUND" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
