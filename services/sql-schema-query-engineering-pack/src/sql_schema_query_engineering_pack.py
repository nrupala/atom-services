#!/usr/bin/env python3
"""SQL schema & query engineering pack — deterministic core.

Built from the bound skill `sql-engineering`: "The database is
the last line of correctness: enforce rules in the schema, write
set-based queries, and treat migrations like surgery."

This atom is a DELIVERABLE audit of a declared SQL schema +
query engineering record: declared tables, indexes and queries
with their declared access patterns, plus schema, transaction,
safety, migration and performance declarations. It connects to
NO database, executes NO SQL, inspects NO live codebase and
verifies NO declared fact — it checks that the record the skill
requires is present and internally complete and consistent.

Computed checks use ONLY the skill's stated rules plus the
consistency of the declared rows: every declared table names a
primary key, schema constraints and a NOT NULL default, and a
snake_case name (computed with the fixed pattern
[a-z][a-z0-9_]* over the whole name); no table/index/query name
is duplicated; every declared index declares non-empty columns;
every declared query declares an explicit column list, bounded
or paginated access, parameterized inputs and N+1 avoidance,
and names a supporting index that is actually declared on the
same table. Ratios are serialized as strings with exactly six
decimal places by the fixed rule round half up to 6dp,
floor(v*1000000+0.5)/1000000, then six decimals.

Verdict:
- any fail             -> SQL_SCHEMA_QUERY_ENGINEERING_PACK_NOT_READY
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> SQL_SCHEMA_QUERY_ENGINEERING_PACK_READY
"""
import json
import math
import re
import sys

SECTIONS = (
    "schema_constraints_and_naming",
    "index_design_from_access_patterns",
    "query_construction_pagination_and_n_plus_one_prevention",
    "transactions_and_concurrency",
    "sql_safety_and_bounded_writes",
    "migrations_and_migration_safety",
    "performance_evidence_and_plan_regression",
    "sql_red_lines",
)

MANIFEST_SPEC = {
    "project": "string",
    "schema_design": {
        "precise_column_types_declared": "boolean",
        "not_null_default_with_nullable_exceptions_explicit": "boolean",
        "check_and_foreign_key_constraints_in_database": "boolean",
        "snake_case_naming_consistent": "boolean",
    },
    "tables": [{
        "name": "string",
        "primary_key_declared": "boolean",
        "schema_constraints_declared": "boolean",
        "not_null_default_declared": "boolean",
    }],
    "index_design": {
        "indexes_derived_from_real_access_patterns": "boolean",
        "composite_index_column_order_follows_query_order": "boolean",
        "index_write_cost_measured_before_adding": "boolean",
    },
    "indexes": [{
        "name": "string",
        "table": "string",
        "columns": ["string"],
    }],
    "queries": [{
        "name": "string",
        "table": "string",
        "supporting_index_name": "string",
        "explicit_column_list_declared": "boolean",
        "bounded_or_paginated_declared": "boolean",
        "parameterized_inputs_declared": "boolean",
        "n_plus_one_avoidance_declared": "boolean",
    }],
    "query_practice": {
        "set_based_queries_preferred": "boolean",
        "complex_reads_use_ctes_or_window_functions": "boolean",
        "large_results_paginated": "boolean",
        "related_data_joined_batched_or_preloaded": "boolean",
        "query_count_tests_verify_no_n_plus_one": "boolean",
    },
    "transactions": {
        "transactions_kept_short": "boolean",
        "isolation_level_known": "boolean",
        "deadlock_retry_with_backoff_declared": "boolean",
    },
    "sql_safety": {
        "all_external_input_bound_as_parameters": "boolean",
        "update_and_delete_statements_all_carry_where": "boolean",
        "bounded_writes_rehearsed_before_execution": "boolean",
    },
    "migrations": {
        "forward_and_rollback_scripts_present": "boolean",
        "migrations_tested_on_a_copy": "boolean",
        "expand_migrate_contract_for_zero_downtime": "boolean",
        "one_logical_change_per_migration": "boolean",
    },
    "performance_evidence": {
        "explain_analyze_captured_before_and_after_heavy_changes": "boolean",
        "query_plan_regressions_watched": "boolean",
    },
    "sql_red_lines": {
        "string_concatenated_sql_with_user_input_present": "boolean",
        "unreviewed_migration_on_live_data_present": "boolean",
        "direct_to_production_schema_edit_present": "boolean",
        "unbounded_write_without_where_present": "boolean",
    },
}

SNAKE = re.compile(r"[a-z][a-z0-9_]*")


def _validate_value(value, spec, path):
    if spec == "any":
        return
    if spec == "string":
        if not isinstance(value, str):
            raise TypeError(f"{path} must be a string")
        return
    if spec == "boolean":
        if not isinstance(value, bool):
            raise TypeError(f"{path} must be a boolean")
        return
    if spec == "number":
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            raise TypeError(f"{path} must be a number")
        return
    if isinstance(spec, list):
        if not isinstance(value, list):
            raise TypeError(f"{path} must be a list")
        for index, entry in enumerate(value):
            _validate_value(entry, spec[0], f"{path}[{index}]")
        return
    if isinstance(spec, dict):
        if not isinstance(value, dict):
            raise TypeError(f"{path} must be an object")
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


def _get(manifest, *path):
    cur = manifest
    for key in path:
        if not isinstance(cur, dict) or key not in cur:
            return None, False
        cur = cur[key]
    return cur, True


def _check(results, section, name, value, present, ok, evidence):
    status = "missing" if not present else ("pass" if ok else "fail")
    results.append({"section": section, "check": name, "status": status,
                    "evidence": evidence})


def _bool_check(results, section, name, manifest, path, evidence):
    value, present = _get(manifest, *path)
    _check(results, section, name, value, present, value is True, evidence)


def _false_check(results, section, name, manifest, path, evidence):
    value, present = _get(manifest, *path)
    _check(results, section, name, value, present, value is False, evidence)


def _fmt6(value):
    if value is None:
        return None
    rounded = math.floor(value * 1000000 + 0.5) / 1000000
    return f"{rounded:.6f}"


def _row_name(entry):
    if isinstance(entry, dict) and isinstance(entry.get("name"), str):
        return entry["name"]
    return "unnamed"


def _without(rows, is_list, field):
    if not is_list:
        return None
    return [_row_name(c) for c in rows
            if isinstance(c, dict) and field in c
            and c.get(field) is not True]


def _coverage(rows, is_list, count, field):
    if not (is_list and count and count > 0):
        return None
    return sum(1 for c in rows if isinstance(c, dict)
               and c.get(field) is True) / count


def _duplicates(rows, is_list):
    if not is_list:
        return None
    seen, dups = [], []
    for c in rows:
        if isinstance(c, dict) and isinstance(c.get("name"), str):
            nm = c["name"]
            if nm in seen and nm not in dups:
                dups.append(nm)
            seen.append(nm)
    return dups


def evaluate(manifest):
    """Return the verdict dict for a SQL schema/query manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_fields(manifest, MANIFEST_SPEC, "")
    results = []

    tables, has_tables = _get(manifest, "tables")
    tables_is_list = has_tables and isinstance(tables, list)
    trows = tables if tables_is_list else []
    tables_count = len(trows) if tables_is_list else None

    indexes, has_indexes = _get(manifest, "indexes")
    indexes_is_list = has_indexes and isinstance(indexes, list)
    irows = indexes if indexes_is_list else []
    indexes_count = len(irows) if indexes_is_list else None

    queries, has_queries = _get(manifest, "queries")
    queries_is_list = has_queries and isinstance(queries, list)
    qrows = queries if queries_is_list else []
    queries_count = len(qrows) if queries_is_list else None

    tables_without_pk = _without(trows, tables_is_list, "primary_key_declared")
    tables_without_constraints = _without(trows, tables_is_list, "schema_constraints_declared")
    tables_without_not_null = _without(trows, tables_is_list, "not_null_default_declared")
    non_snake = (
        [_row_name(c) for c in trows
         if isinstance(c, dict) and isinstance(c.get("name"), str)
         and SNAKE.fullmatch(c["name"]) is None]
        if tables_is_list else None
    )
    duplicate_table_names = _duplicates(trows, tables_is_list)
    duplicate_index_names = _duplicates(irows, indexes_is_list)
    duplicate_query_names = _duplicates(qrows, queries_is_list)

    indexes_without_columns = (
        [_row_name(c) for c in irows
         if isinstance(c, dict) and "columns" in c
         and not (isinstance(c.get("columns"), list) and len(c["columns"]) > 0)]
        if indexes_is_list else None
    )
    index_columns_coverage = (
        sum(1 for c in irows if isinstance(c, dict)
            and isinstance(c.get("columns"), list) and len(c["columns"]) > 0)
        / indexes_count
        if indexes_is_list and indexes_count else None
    )

    def _index_matches(q):
        if not isinstance(q, dict):
            return False
        sup = q.get("supporting_index_name")
        if not isinstance(sup, str) or not sup or not indexes_is_list:
            return False
        return any(isinstance(i, dict) and i.get("name") == sup
                   and i.get("table") == q.get("table") for i in irows)

    uncovered_queries = (
        [_row_name(q) for q in qrows
         if isinstance(q, dict)
         and isinstance(q.get("supporting_index_name"), str)
         and q.get("supporting_index_name")
         and not _index_matches(q)]
        if queries_is_list and indexes_is_list else None
    )
    covered_count = (
        sum(1 for q in qrows if _index_matches(q))
        if queries_is_list and indexes_is_list else None
    )
    query_index_support_coverage = (
        covered_count / queries_count
        if covered_count is not None and queries_count else None
    )
    queries_without_explicit = _without(qrows, queries_is_list, "explicit_column_list_declared")
    queries_without_bound = _without(qrows, queries_is_list, "bounded_or_paginated_declared")
    queries_without_param = _without(qrows, queries_is_list, "parameterized_inputs_declared")
    queries_without_n1 = _without(qrows, queries_is_list, "n_plus_one_avoidance_declared")

    def _all_field_present(rows, is_list, field):
        return is_list and all(isinstance(c, dict) and field in c for c in rows)

    def _row_bool_check(section, name, raw, rows, is_list, count, field, without, evidence):
        present = _all_field_present(rows, is_list, field)
        _check(results, section, name, raw, present,
               is_list and count is not None and count > 0
               and without is not None and len(without) == 0,
               evidence)

    S1 = "schema_constraints_and_naming"
    _bool_check(results, S1, "precise_column_types_declared_for_sql_schema", manifest,
                ("schema_design", "precise_column_types_declared"),
                "schema: precise column types are declared for the schema")
    _bool_check(results, S1, "sql_not_null_default_with_explicit_nullable_exceptions", manifest,
                ("schema_design", "not_null_default_with_nullable_exceptions_explicit"),
                "schema: NOT NULL is the default and nullable exceptions are explicit")
    _bool_check(results, S1, "sql_check_and_fk_constraints_enforced_in_database_not_app_only", manifest,
                ("schema_design", "check_and_foreign_key_constraints_in_database"),
                "schema: CHECK and foreign-key constraints are enforced in the database, not only in app code")
    _bool_check(results, S1, "sql_snake_case_naming_declared_consistent", manifest,
                ("schema_design", "snake_case_naming_consistent"),
                "schema: naming is consistent snake_case across the schema")
    _check(results, S1, "sql_tables_declared", tables, tables_is_list,
           tables_is_list and tables_count > 0,
           "schema: the declared record names its tables - the tables list is present and non-empty")
    _row_bool_check(S1, "every_sql_table_declares_primary_key", tables, trows, tables_is_list, tables_count,
                    "primary_key_declared", tables_without_pk,
                    "schema: every declared table row declares a primary key")
    _row_bool_check(S1, "every_sql_table_declares_schema_constraints", tables, trows, tables_is_list, tables_count,
                    "schema_constraints_declared", tables_without_constraints,
                    "schema: every declared table row declares its schema constraints")
    _row_bool_check(S1, "every_sql_table_declares_not_null_default", tables, trows, tables_is_list, tables_count,
                    "not_null_default_declared", tables_without_not_null,
                    "schema: every declared table row declares the NOT NULL default")
    name_present = tables_is_list and all(isinstance(c, dict) and "name" in c for c in trows)
    _check(results, S1, "every_sql_table_name_is_snake_case", tables, name_present,
           tables_is_list and tables_count > 0 and non_snake is not None and len(non_snake) == 0,
           "schema: every declared table name matches snake_case [a-z][a-z0-9_]* in full")
    _check(results, S1, "no_sql_table_name_duplicated", tables, name_present,
           tables_is_list and duplicate_table_names is not None and len(duplicate_table_names) == 0,
           "schema: no declared table name appears on more than one row")

    S2 = "index_design_from_access_patterns"
    _bool_check(results, S2, "sql_indexes_derived_from_real_access_patterns", manifest,
                ("index_design", "indexes_derived_from_real_access_patterns"),
                "indexes: indexes are derived from real access patterns")
    _bool_check(results, S2, "sql_composite_index_column_order_follows_query_order", manifest,
                ("index_design", "composite_index_column_order_follows_query_order"),
                "indexes: composite index column order follows the query order that uses it")
    _bool_check(results, S2, "sql_index_write_cost_measured_before_adding_indexes", manifest,
                ("index_design", "index_write_cost_measured_before_adding"),
                "indexes: over-indexing write cost is measured before indexes are added")
    _check(results, S2, "sql_indexes_declared", indexes, indexes_is_list,
           indexes_is_list and indexes_count > 0,
           "indexes: the declared record names its indexes - the indexes list is present and non-empty")
    cols_present = _all_field_present(irows, indexes_is_list, "columns")
    _check(results, S2, "every_sql_index_declares_nonempty_columns", indexes, cols_present,
           indexes_is_list and indexes_count > 0 and indexes_without_columns is not None and len(indexes_without_columns) == 0,
           "indexes: every declared index row declares a non-empty columns list")
    matching_present = (queries_is_list and indexes_is_list
                        and all(isinstance(q, dict) and "supporting_index_name" in q and "table" in q for q in qrows))
    _check(results, S2, "every_declared_sql_query_has_matching_declared_index", queries, matching_present,
           queries_is_list and indexes_is_list and queries_count is not None and queries_count > 0
           and uncovered_queries is not None and len(uncovered_queries) == 0
           and covered_count == queries_count,
           "indexes: every declared query names a supporting index that is declared on the same table")
    iname_present = indexes_is_list and all(isinstance(c, dict) and "name" in c for c in irows)
    _check(results, S2, "no_sql_index_name_duplicated", indexes, iname_present,
           indexes_is_list and duplicate_index_names is not None and len(duplicate_index_names) == 0,
           "indexes: no declared index name appears on more than one row")

    S3 = "query_construction_pagination_and_n_plus_one_prevention"
    _bool_check(results, S3, "sql_set_based_queries_preferred_over_row_by_row", manifest,
                ("query_practice", "set_based_queries_preferred"),
                "queries: set-based queries are preferred over row-by-row processing")
    _bool_check(results, S3, "sql_complex_reads_use_ctes_or_window_functions_where_needed", manifest,
                ("query_practice", "complex_reads_use_ctes_or_window_functions"),
                "queries: complex reads use CTEs or window functions where needed")
    _bool_check(results, S3, "sql_large_results_paginated_in_query_practice", manifest,
                ("query_practice", "large_results_paginated"),
                "queries: large results are paginated")
    _bool_check(results, S3, "sql_related_data_joined_batched_or_preloaded", manifest,
                ("query_practice", "related_data_joined_batched_or_preloaded"),
                "queries: related data is joined, batched or preloaded instead of fetched row by row")
    _bool_check(results, S3, "sql_query_count_tests_verify_no_n_plus_one", manifest,
                ("query_practice", "query_count_tests_verify_no_n_plus_one"),
                "queries: query-count tests verify no N+1 pattern is introduced")
    _check(results, S3, "sql_queries_declared", queries, queries_is_list,
           queries_is_list and queries_count > 0,
           "queries: the declared record names its queries - the queries list is present and non-empty")
    _row_bool_check(S3, "every_sql_query_declares_explicit_column_list", queries, qrows, queries_is_list, queries_count,
                    "explicit_column_list_declared", queries_without_explicit,
                    "queries: every declared query row declares an explicit column list, no SELECT * in app code")
    _row_bool_check(S3, "every_sql_query_declares_bounded_or_paginated_access", queries, qrows, queries_is_list, queries_count,
                    "bounded_or_paginated_declared", queries_without_bound,
                    "queries: every declared query row declares bounded or paginated access, no unbounded scan")
    _row_bool_check(S3, "every_sql_query_declares_n_plus_one_avoidance", queries, qrows, queries_is_list, queries_count,
                    "n_plus_one_avoidance_declared", queries_without_n1,
                    "queries: every declared query row declares its N+1 avoidance")
    qname_present = queries_is_list and all(isinstance(c, dict) and "name" in c for c in qrows)
    _check(results, S3, "no_sql_query_name_duplicated", queries, qname_present,
           queries_is_list and duplicate_query_names is not None and len(duplicate_query_names) == 0,
           "queries: no declared query name appears on more than one row")

    S4 = "transactions_and_concurrency"
    _bool_check(results, S4, "sql_transactions_kept_short", manifest,
                ("transactions", "transactions_kept_short"),
                "transactions: transactions are kept short")
    _bool_check(results, S4, "sql_isolation_level_known_for_transactions", manifest,
                ("transactions", "isolation_level_known"),
                "transactions: the isolation level in use is known and declared")
    _bool_check(results, S4, "sql_deadlock_retry_with_backoff_declared", manifest,
                ("transactions", "deadlock_retry_with_backoff_declared"),
                "transactions: deadlocks are expected and handled with retry and backoff")

    S5 = "sql_safety_and_bounded_writes"
    _bool_check(results, S5, "sql_all_external_input_bound_as_parameters", manifest,
                ("sql_safety", "all_external_input_bound_as_parameters"),
                "safety: all external input is bound as parameters, never string-built into SQL")
    _bool_check(results, S5, "sql_update_and_delete_statements_all_carry_where", manifest,
                ("sql_safety", "update_and_delete_statements_all_carry_where"),
                "safety: every UPDATE and DELETE carries a WHERE clause")
    _bool_check(results, S5, "sql_bounded_writes_rehearsed_before_execution", manifest,
                ("sql_safety", "bounded_writes_rehearsed_before_execution"),
                "safety: bounded UPDATE and DELETE statements are rehearsed before execution")
    _row_bool_check(S5, "every_sql_query_declares_parameterized_inputs", queries, qrows, queries_is_list, queries_count,
                    "parameterized_inputs_declared", queries_without_param,
                    "safety: every declared query row declares parameterized inputs")

    S6 = "migrations_and_migration_safety"
    _bool_check(results, S6, "sql_migrations_carry_forward_and_rollback_scripts", manifest,
                ("migrations", "forward_and_rollback_scripts_present"),
                "migrations: every migration carries forward and rollback scripts")
    _bool_check(results, S6, "sql_migrations_tested_on_a_copy_before_live", manifest,
                ("migrations", "migrations_tested_on_a_copy"),
                "migrations: migrations are tested on a copy before live data")
    _bool_check(results, S6, "sql_zero_downtime_migrations_use_expand_migrate_contract", manifest,
                ("migrations", "expand_migrate_contract_for_zero_downtime"),
                "migrations: zero-downtime changes use expand, migrate, then contract")
    _bool_check(results, S6, "sql_one_logical_change_per_migration", manifest,
                ("migrations", "one_logical_change_per_migration"),
                "migrations: one logical change per migration")

    S7 = "performance_evidence_and_plan_regression"
    _bool_check(results, S7, "sql_explain_analyze_captured_before_and_after_heavy_changes", manifest,
                ("performance_evidence", "explain_analyze_captured_before_and_after_heavy_changes"),
                "performance: EXPLAIN ANALYZE evidence is captured before and after heavy changes")
    _bool_check(results, S7, "sql_query_plan_regressions_watched_after_changes", manifest,
                ("performance_evidence", "query_plan_regressions_watched"),
                "performance: query plan regressions are watched after changes")

    S8 = "sql_red_lines"
    _false_check(results, S8, "sql_no_string_concatenated_sql_with_user_input", manifest,
                 ("sql_red_lines", "string_concatenated_sql_with_user_input_present"),
                 "red line: no string-concatenated SQL with user input is present in the record")
    _false_check(results, S8, "sql_no_unreviewed_migration_on_live_data", manifest,
                 ("sql_red_lines", "unreviewed_migration_on_live_data_present"),
                 "red line: no unreviewed migration on live data is present in the record")
    _false_check(results, S8, "sql_no_direct_to_production_schema_edit", manifest,
                 ("sql_red_lines", "direct_to_production_schema_edit_present"),
                 "red line: no direct-to-production schema edit is present in the record")
    _false_check(results, S8, "sql_no_unbounded_write_without_where", manifest,
                 ("sql_red_lines", "unbounded_write_without_where_present"),
                 "red line: no unbounded UPDATE or DELETE without a WHERE clause is present in the record")

    sections = {}
    for section in SECTIONS:
        sec = [r for r in results if r["section"] == section]
        if any(r["status"] == "fail" for r in sec):
            sections[section] = "fail"
        elif any(r["status"] == "missing" for r in sec):
            sections[section] = "insufficient_evidence"
        else:
            sections[section] = "pass"

    if any(v == "fail" for v in sections.values()):
        verdict = "SQL_SCHEMA_QUERY_ENGINEERING_PACK_NOT_READY"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "SQL_SCHEMA_QUERY_ENGINEERING_PACK_READY"

    computed_names = (
        "sql_tables_declared", "every_sql_table_declares_primary_key",
        "every_sql_table_declares_schema_constraints",
        "every_sql_table_declares_not_null_default",
        "every_sql_table_name_is_snake_case", "no_sql_table_name_duplicated",
        "sql_indexes_declared", "every_sql_index_declares_nonempty_columns",
        "every_declared_sql_query_has_matching_declared_index",
        "no_sql_index_name_duplicated", "sql_queries_declared",
        "every_sql_query_declares_explicit_column_list",
        "every_sql_query_declares_bounded_or_paginated_access",
        "every_sql_query_declares_n_plus_one_avoidance",
        "no_sql_query_name_duplicated",
        "every_sql_query_declares_parameterized_inputs",
    )
    computed_statuses = [r["status"] for r in results if r["check"] in computed_names]
    if any(s == "fail" for s in computed_statuses):
        computed_status = "outside_stated_limits_on_declared_evidence"
    elif all(s == "pass" for s in computed_statuses):
        computed_status = "within_stated_limits_on_declared_evidence"
    else:
        computed_status = None

    return {
        "service": "sql-schema-query-engineering-pack",
        "atom_version": "0.1.0",
        "project": manifest.get("project"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "computed_status": computed_status,
        "tables_count": tables_count,
        "indexes_count": indexes_count,
        "queries_count": queries_count,
        "tables_without_primary_key": tables_without_pk,
        "tables_without_schema_constraints": tables_without_constraints,
        "tables_without_not_null_default": tables_without_not_null,
        "tables_with_non_snake_case_names": non_snake,
        "duplicate_sql_table_names": duplicate_table_names,
        "indexes_without_columns": indexes_without_columns,
        "duplicate_sql_index_names": duplicate_index_names,
        "queries_without_explicit_column_list": queries_without_explicit,
        "queries_without_bounded_or_paginated_access": queries_without_bound,
        "queries_without_parameterized_inputs": queries_without_param,
        "queries_without_n_plus_one_avoidance": queries_without_n1,
        "uncovered_sql_queries": uncovered_queries,
        "duplicate_sql_query_names": duplicate_query_names,
        "table_primary_key_coverage": _fmt6(_coverage(trows, tables_is_list, tables_count, "primary_key_declared")),
        "table_schema_constraints_coverage": _fmt6(_coverage(trows, tables_is_list, tables_count, "schema_constraints_declared")),
        "table_not_null_default_coverage": _fmt6(_coverage(trows, tables_is_list, tables_count, "not_null_default_declared")),
        "index_columns_coverage": _fmt6(index_columns_coverage),
        "query_explicit_column_list_coverage": _fmt6(_coverage(qrows, queries_is_list, queries_count, "explicit_column_list_declared")),
        "query_bounded_or_paginated_coverage": _fmt6(_coverage(qrows, queries_is_list, queries_count, "bounded_or_paginated_declared")),
        "query_parameterized_inputs_coverage": _fmt6(_coverage(qrows, queries_is_list, queries_count, "parameterized_inputs_declared")),
        "query_n_plus_one_avoidance_coverage": _fmt6(_coverage(qrows, queries_is_list, queries_count, "n_plus_one_avoidance_declared")),
        "query_index_support_coverage": _fmt6(query_index_support_coverage),
        "summary": (
            f"{sum(1 for r in results if r['status'] == 'pass')} pass, "
            f"{sum(1 for r in results if r['status'] == 'fail')} fail, "
            f"{sum(1 for r in results if r['status'] == 'missing')} missing "
            f"of {len(results)} checks across eight sections."
        ),
    }


def stamp(verdict):
    lines = [
        "SQL SCHEMA QUERY ENGINEERING PACK",
        f"project: {verdict.get('project')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<44} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: sql_schema_query_engineering_pack.py <manifest.json>", file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "SQL_SCHEMA_QUERY_ENGINEERING_PACK_READY" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
