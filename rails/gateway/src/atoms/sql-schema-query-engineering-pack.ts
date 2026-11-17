// SQL schema & query engineering pack — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/sql-schema-query-engineering-pack/src/sql_schema_query_engineering_pack.py
// (evaluate() + stamp()). No logic changes: every verdict, section
// outcome, per-check status, evidence string, computed field and
// the summary string are byte-identical to the Python output for
// the same input. Computed ratios use the shared fixed
// serialization: round half up to 6dp —
// floor(v * 1000000 + 0.5) / 1000000 — then format with exactly six
// decimals; comparisons use the unrounded values.

import { pyStr } from "./release-readiness.js";
import { validateManifest, type FieldSpec } from "./validate.js";

const MANIFEST_SPEC: { [field: string]: FieldSpec } = {
  project: "string",
  schema_design: {
    precise_column_types_declared: "boolean",
    not_null_default_with_nullable_exceptions_explicit: "boolean",
    check_and_foreign_key_constraints_in_database: "boolean",
    snake_case_naming_consistent: "boolean",
  },
  tables: [{
    name: "string",
    primary_key_declared: "boolean",
    schema_constraints_declared: "boolean",
    not_null_default_declared: "boolean",
  }],
  index_design: {
    indexes_derived_from_real_access_patterns: "boolean",
    composite_index_column_order_follows_query_order: "boolean",
    index_write_cost_measured_before_adding: "boolean",
  },
  indexes: [{
    name: "string",
    table: "string",
    columns: ["string"],
  }],
  queries: [{
    name: "string",
    table: "string",
    supporting_index_name: "string",
    explicit_column_list_declared: "boolean",
    bounded_or_paginated_declared: "boolean",
    parameterized_inputs_declared: "boolean",
    n_plus_one_avoidance_declared: "boolean",
  }],
  query_practice: {
    set_based_queries_preferred: "boolean",
    complex_reads_use_ctes_or_window_functions: "boolean",
    large_results_paginated: "boolean",
    related_data_joined_batched_or_preloaded: "boolean",
    query_count_tests_verify_no_n_plus_one: "boolean",
  },
  transactions: {
    transactions_kept_short: "boolean",
    isolation_level_known: "boolean",
    deadlock_retry_with_backoff_declared: "boolean",
  },
  sql_safety: {
    all_external_input_bound_as_parameters: "boolean",
    update_and_delete_statements_all_carry_where: "boolean",
    bounded_writes_rehearsed_before_execution: "boolean",
  },
  migrations: {
    forward_and_rollback_scripts_present: "boolean",
    migrations_tested_on_a_copy: "boolean",
    expand_migrate_contract_for_zero_downtime: "boolean",
    one_logical_change_per_migration: "boolean",
  },
  performance_evidence: {
    explain_analyze_captured_before_and_after_heavy_changes: "boolean",
    query_plan_regressions_watched: "boolean",
  },
  sql_red_lines: {
    string_concatenated_sql_with_user_input_present: "boolean",
    unreviewed_migration_on_live_data_present: "boolean",
    direct_to_production_schema_edit_present: "boolean",
    unbounded_write_without_where_present: "boolean",
  },
};

export const SECTIONS = [
  "schema_constraints_and_naming",
  "index_design_from_access_patterns",
  "query_construction_pagination_and_n_plus_one_prevention",
  "transactions_and_concurrency",
  "sql_safety_and_bounded_writes",
  "migrations_and_migration_safety",
  "performance_evidence_and_plan_regression",
  "sql_red_lines",
] as const;

export type CheckStatus = "pass" | "fail" | "missing";

export interface CheckResult {
  section: string;
  check: string;
  status: CheckStatus;
  evidence: string;
}

export interface Verdict {
  service: string;
  atom_version: string;
  project: unknown;
  verdict: string;
  sections: Record<string, string>;
  checks: CheckResult[];
  computed_status: string | null;
  tables_count: number | null;
  indexes_count: number | null;
  queries_count: number | null;
  tables_without_primary_key: string[] | null;
  tables_without_schema_constraints: string[] | null;
  tables_without_not_null_default: string[] | null;
  tables_with_non_snake_case_names: string[] | null;
  duplicate_sql_table_names: string[] | null;
  indexes_without_columns: string[] | null;
  duplicate_sql_index_names: string[] | null;
  queries_without_explicit_column_list: string[] | null;
  queries_without_bounded_or_paginated_access: string[] | null;
  queries_without_parameterized_inputs: string[] | null;
  queries_without_n_plus_one_avoidance: string[] | null;
  uncovered_sql_queries: string[] | null;
  duplicate_sql_query_names: string[] | null;
  table_primary_key_coverage: string | null;
  table_schema_constraints_coverage: string | null;
  table_not_null_default_coverage: string | null;
  index_columns_coverage: string | null;
  query_explicit_column_list_coverage: string | null;
  query_bounded_or_paginated_coverage: string | null;
  query_parameterized_inputs_coverage: string | null;
  query_n_plus_one_avoidance_coverage: string | null;
  query_index_support_coverage: string | null;
  summary: string;
}

function isPyDict(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getPath(
  manifest: Record<string, unknown>,
  ...path: string[]
): [unknown, boolean] {
  let cur: unknown = manifest;
  for (const key of path) {
    if (!isPyDict(cur) || !Object.prototype.hasOwnProperty.call(cur, key)) {
      return [null, false];
    }
    cur = cur[key];
  }
  return [cur, true];
}

function hasField(entry: unknown, field: string): boolean {
  return isPyDict(entry) &&
    Object.prototype.hasOwnProperty.call(entry, field);
}

function check(
  results: CheckResult[],
  section: string,
  name: string,
  _value: unknown,
  present: boolean,
  ok: boolean,
  evidence: string,
): void {
  const status: CheckStatus = !present ? "missing" : ok ? "pass" : "fail";
  results.push({ section, check: name, status, evidence });
}

function boolCheck(
  results: CheckResult[],
  section: string,
  name: string,
  manifest: Record<string, unknown>,
  path: string[],
  evidence: string,
): void {
  const [value, present] = getPath(manifest, ...path);
  check(results, section, name, value, present, value === true, evidence);
}

function falseCheck(
  results: CheckResult[],
  section: string,
  name: string,
  manifest: Record<string, unknown>,
  path: string[],
  evidence: string,
): void {
  const [value, present] = getPath(manifest, ...path);
  check(results, section, name, value, present, value === false, evidence);
}

function fmt6(value: number | null): string | null {
  if (value === null) return null;
  const rounded = Math.floor(value * 1000000 + 0.5) / 1000000;
  return rounded.toFixed(6);
}

function rowName(entry: unknown): string {
  if (isPyDict(entry) && typeof entry["name"] === "string") {
    return entry["name"] as string;
  }
  return "unnamed";
}

const SNAKE = /^[a-z][a-z0-9_]*$/;

export function evaluate(manifest: unknown): Verdict {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateManifest(manifest, MANIFEST_SPEC);
  const results: CheckResult[] = [];

  const [tablesRaw, hasTables] = getPath(manifest, "tables");
  const tablesIsList = hasTables && Array.isArray(tablesRaw);
  const trows: unknown[] = tablesIsList ? (tablesRaw as unknown[]) : [];
  const tablesCount: number | null = tablesIsList ? trows.length : null;

  const [indexesRaw, hasIndexes] = getPath(manifest, "indexes");
  const indexesIsList = hasIndexes && Array.isArray(indexesRaw);
  const irows: unknown[] = indexesIsList ? (indexesRaw as unknown[]) : [];
  const indexesCount: number | null = indexesIsList ? irows.length : null;

  const [queriesRaw, hasQueries] = getPath(manifest, "queries");
  const queriesIsList = hasQueries && Array.isArray(queriesRaw);
  const qrows: unknown[] = queriesIsList ? (queriesRaw as unknown[]) : [];
  const queriesCount: number | null = queriesIsList ? qrows.length : null;

  const without = (
    rows: unknown[], isList: boolean, field: string,
  ): string[] | null => isList
    ? rows.filter((c) => hasField(c, field) &&
        (c as Record<string, unknown>)[field] !== true).map(rowName)
    : null;

  const coverage = (
    rows: unknown[], isList: boolean, count: number | null, field: string,
  ): number | null => (isList && count !== null && count > 0)
    ? rows.filter((c) => isPyDict(c) && c[field] === true).length / count
    : null;

  const duplicates = (
    rows: unknown[], isList: boolean,
  ): string[] | null => {
    if (!isList) return null;
    const seen: string[] = [];
    const dups: string[] = [];
    for (const c of rows) {
      if (isPyDict(c) && typeof c["name"] === "string") {
        const nm = c["name"] as string;
        if (seen.includes(nm) && !dups.includes(nm)) dups.push(nm);
        seen.push(nm);
      }
    }
    return dups;
  };

  const tablesWithoutPk = without(trows, tablesIsList, "primary_key_declared");
  const tablesWithoutConstraints = without(trows, tablesIsList, "schema_constraints_declared");
  const tablesWithoutNotNull = without(trows, tablesIsList, "not_null_default_declared");
  const nonSnake: string[] | null = tablesIsList
    ? trows.filter((c) => isPyDict(c) && typeof c["name"] === "string" &&
        !SNAKE.test(c["name"] as string)).map(rowName)
    : null;
  const duplicateTableNames = duplicates(trows, tablesIsList);
  const duplicateIndexNames = duplicates(irows, indexesIsList);
  const duplicateQueryNames = duplicates(qrows, queriesIsList);

  const indexesWithoutColumns: string[] | null = indexesIsList
    ? irows.filter((c) => hasField(c, "columns") &&
        !(Array.isArray((c as Record<string, unknown>)["columns"]) &&
          ((c as Record<string, unknown>)["columns"] as unknown[]).length > 0))
        .map(rowName)
    : null;
  const indexColumnsCoverage: number | null =
    indexesIsList && indexesCount !== null && indexesCount > 0
      ? irows.filter((c) => isPyDict(c) && Array.isArray(c["columns"]) &&
          (c["columns"] as unknown[]).length > 0).length / indexesCount
      : null;

  const indexMatches = (q: unknown): boolean => {
    if (!isPyDict(q)) return false;
    const sup = q["supporting_index_name"];
    if (typeof sup !== "string" || sup.length === 0 || !indexesIsList) {
      return false;
    }
    return irows.some((i) => isPyDict(i) && i["name"] === sup &&
      i["table"] === q["table"]);
  };

  const uncoveredQueries: string[] | null =
    queriesIsList && indexesIsList
      ? qrows.filter((q) => isPyDict(q) &&
          typeof q["supporting_index_name"] === "string" &&
          (q["supporting_index_name"] as string).length > 0 &&
          !indexMatches(q)).map(rowName)
      : null;
  const coveredCount: number | null =
    queriesIsList && indexesIsList
      ? qrows.filter((q) => indexMatches(q)).length
      : null;
  const queryIndexSupportCoverage: number | null =
    coveredCount !== null && queriesCount !== null && queriesCount > 0
      ? coveredCount / queriesCount
      : null;

  const queriesWithoutExplicit = without(qrows, queriesIsList, "explicit_column_list_declared");
  const queriesWithoutBound = without(qrows, queriesIsList, "bounded_or_paginated_declared");
  const queriesWithoutParam = without(qrows, queriesIsList, "parameterized_inputs_declared");
  const queriesWithoutN1 = without(qrows, queriesIsList, "n_plus_one_avoidance_declared");

  const allFieldPresent = (
    rows: unknown[], isList: boolean, field: string,
  ): boolean => isList && rows.every((c) => hasField(c, field));

  const rowBoolCheck = (
    section: string, name: string, raw: unknown, rows: unknown[],
    isList: boolean, count: number | null, field: string,
    withoutList: string[] | null, evidence: string,
  ): void => {
    const present = allFieldPresent(rows, isList, field);
    check(results, section, name, raw, present,
      isList && count !== null && count > 0 &&
        withoutList !== null && withoutList.length === 0,
      evidence);
  };

  const S1 = "schema_constraints_and_naming";
  boolCheck(results, S1, "precise_column_types_declared_for_sql_schema", manifest,
    ["schema_design", "precise_column_types_declared"],
    "schema: precise column types are declared for the schema");
  boolCheck(results, S1, "sql_not_null_default_with_explicit_nullable_exceptions", manifest,
    ["schema_design", "not_null_default_with_nullable_exceptions_explicit"],
    "schema: NOT NULL is the default and nullable exceptions are explicit");
  boolCheck(results, S1, "sql_check_and_fk_constraints_enforced_in_database_not_app_only", manifest,
    ["schema_design", "check_and_foreign_key_constraints_in_database"],
    "schema: CHECK and foreign-key constraints are enforced in the database, not only in app code");
  boolCheck(results, S1, "sql_snake_case_naming_declared_consistent", manifest,
    ["schema_design", "snake_case_naming_consistent"],
    "schema: naming is consistent snake_case across the schema");
  check(results, S1, "sql_tables_declared", tablesRaw, tablesIsList,
    tablesIsList && (tablesCount as number) > 0,
    "schema: the declared record names its tables - the tables list is present and non-empty");
  rowBoolCheck(S1, "every_sql_table_declares_primary_key", tablesRaw, trows, tablesIsList, tablesCount,
    "primary_key_declared", tablesWithoutPk,
    "schema: every declared table row declares a primary key");
  rowBoolCheck(S1, "every_sql_table_declares_schema_constraints", tablesRaw, trows, tablesIsList, tablesCount,
    "schema_constraints_declared", tablesWithoutConstraints,
    "schema: every declared table row declares its schema constraints");
  rowBoolCheck(S1, "every_sql_table_declares_not_null_default", tablesRaw, trows, tablesIsList, tablesCount,
    "not_null_default_declared", tablesWithoutNotNull,
    "schema: every declared table row declares the NOT NULL default");
  const namePresent = tablesIsList && trows.every((c) => hasField(c, "name"));
  check(results, S1, "every_sql_table_name_is_snake_case", tablesRaw, namePresent,
    tablesIsList && (tablesCount as number) > 0 && nonSnake !== null && nonSnake.length === 0,
    "schema: every declared table name matches snake_case [a-z][a-z0-9_]* in full");
  check(results, S1, "no_sql_table_name_duplicated", tablesRaw, namePresent,
    tablesIsList && duplicateTableNames !== null && duplicateTableNames.length === 0,
    "schema: no declared table name appears on more than one row");

  const S2 = "index_design_from_access_patterns";
  boolCheck(results, S2, "sql_indexes_derived_from_real_access_patterns", manifest,
    ["index_design", "indexes_derived_from_real_access_patterns"],
    "indexes: indexes are derived from real access patterns");
  boolCheck(results, S2, "sql_composite_index_column_order_follows_query_order", manifest,
    ["index_design", "composite_index_column_order_follows_query_order"],
    "indexes: composite index column order follows the query order that uses it");
  boolCheck(results, S2, "sql_index_write_cost_measured_before_adding_indexes", manifest,
    ["index_design", "index_write_cost_measured_before_adding"],
    "indexes: over-indexing write cost is measured before indexes are added");
  check(results, S2, "sql_indexes_declared", indexesRaw, indexesIsList,
    indexesIsList && (indexesCount as number) > 0,
    "indexes: the declared record names its indexes - the indexes list is present and non-empty");
  const colsPresent = allFieldPresent(irows, indexesIsList, "columns");
  check(results, S2, "every_sql_index_declares_nonempty_columns", indexesRaw, colsPresent,
    indexesIsList && (indexesCount as number) > 0 && indexesWithoutColumns !== null && indexesWithoutColumns.length === 0,
    "indexes: every declared index row declares a non-empty columns list");
  const matchingPresent = queriesIsList && indexesIsList &&
    qrows.every((q) => hasField(q, "supporting_index_name") && hasField(q, "table"));
  check(results, S2, "every_declared_sql_query_has_matching_declared_index", queriesRaw, matchingPresent,
    queriesIsList && indexesIsList && queriesCount !== null && queriesCount > 0 &&
      uncoveredQueries !== null && uncoveredQueries.length === 0 &&
      coveredCount === queriesCount,
    "indexes: every declared query names a supporting index that is declared on the same table");
  const inamePresent = indexesIsList && irows.every((c) => hasField(c, "name"));
  check(results, S2, "no_sql_index_name_duplicated", indexesRaw, inamePresent,
    indexesIsList && duplicateIndexNames !== null && duplicateIndexNames.length === 0,
    "indexes: no declared index name appears on more than one row");

  const S3 = "query_construction_pagination_and_n_plus_one_prevention";
  boolCheck(results, S3, "sql_set_based_queries_preferred_over_row_by_row", manifest,
    ["query_practice", "set_based_queries_preferred"],
    "queries: set-based queries are preferred over row-by-row processing");
  boolCheck(results, S3, "sql_complex_reads_use_ctes_or_window_functions_where_needed", manifest,
    ["query_practice", "complex_reads_use_ctes_or_window_functions"],
    "queries: complex reads use CTEs or window functions where needed");
  boolCheck(results, S3, "sql_large_results_paginated_in_query_practice", manifest,
    ["query_practice", "large_results_paginated"],
    "queries: large results are paginated");
  boolCheck(results, S3, "sql_related_data_joined_batched_or_preloaded", manifest,
    ["query_practice", "related_data_joined_batched_or_preloaded"],
    "queries: related data is joined, batched or preloaded instead of fetched row by row");
  boolCheck(results, S3, "sql_query_count_tests_verify_no_n_plus_one", manifest,
    ["query_practice", "query_count_tests_verify_no_n_plus_one"],
    "queries: query-count tests verify no N+1 pattern is introduced");
  check(results, S3, "sql_queries_declared", queriesRaw, queriesIsList,
    queriesIsList && (queriesCount as number) > 0,
    "queries: the declared record names its queries - the queries list is present and non-empty");
  rowBoolCheck(S3, "every_sql_query_declares_explicit_column_list", queriesRaw, qrows, queriesIsList, queriesCount,
    "explicit_column_list_declared", queriesWithoutExplicit,
    "queries: every declared query row declares an explicit column list, no SELECT * in app code");
  rowBoolCheck(S3, "every_sql_query_declares_bounded_or_paginated_access", queriesRaw, qrows, queriesIsList, queriesCount,
    "bounded_or_paginated_declared", queriesWithoutBound,
    "queries: every declared query row declares bounded or paginated access, no unbounded scan");
  rowBoolCheck(S3, "every_sql_query_declares_n_plus_one_avoidance", queriesRaw, qrows, queriesIsList, queriesCount,
    "n_plus_one_avoidance_declared", queriesWithoutN1,
    "queries: every declared query row declares its N+1 avoidance");
  const qnamePresent = queriesIsList && qrows.every((c) => hasField(c, "name"));
  check(results, S3, "no_sql_query_name_duplicated", queriesRaw, qnamePresent,
    queriesIsList && duplicateQueryNames !== null && duplicateQueryNames.length === 0,
    "queries: no declared query name appears on more than one row");

  const S4 = "transactions_and_concurrency";
  boolCheck(results, S4, "sql_transactions_kept_short", manifest,
    ["transactions", "transactions_kept_short"],
    "transactions: transactions are kept short");
  boolCheck(results, S4, "sql_isolation_level_known_for_transactions", manifest,
    ["transactions", "isolation_level_known"],
    "transactions: the isolation level in use is known and declared");
  boolCheck(results, S4, "sql_deadlock_retry_with_backoff_declared", manifest,
    ["transactions", "deadlock_retry_with_backoff_declared"],
    "transactions: deadlocks are expected and handled with retry and backoff");

  const S5 = "sql_safety_and_bounded_writes";
  boolCheck(results, S5, "sql_all_external_input_bound_as_parameters", manifest,
    ["sql_safety", "all_external_input_bound_as_parameters"],
    "safety: all external input is bound as parameters, never string-built into SQL");
  boolCheck(results, S5, "sql_update_and_delete_statements_all_carry_where", manifest,
    ["sql_safety", "update_and_delete_statements_all_carry_where"],
    "safety: every UPDATE and DELETE carries a WHERE clause");
  boolCheck(results, S5, "sql_bounded_writes_rehearsed_before_execution", manifest,
    ["sql_safety", "bounded_writes_rehearsed_before_execution"],
    "safety: bounded UPDATE and DELETE statements are rehearsed before execution");
  rowBoolCheck(S5, "every_sql_query_declares_parameterized_inputs", queriesRaw, qrows, queriesIsList, queriesCount,
    "parameterized_inputs_declared", queriesWithoutParam,
    "safety: every declared query row declares parameterized inputs");

  const S6 = "migrations_and_migration_safety";
  boolCheck(results, S6, "sql_migrations_carry_forward_and_rollback_scripts", manifest,
    ["migrations", "forward_and_rollback_scripts_present"],
    "migrations: every migration carries forward and rollback scripts");
  boolCheck(results, S6, "sql_migrations_tested_on_a_copy_before_live", manifest,
    ["migrations", "migrations_tested_on_a_copy"],
    "migrations: migrations are tested on a copy before live data");
  boolCheck(results, S6, "sql_zero_downtime_migrations_use_expand_migrate_contract", manifest,
    ["migrations", "expand_migrate_contract_for_zero_downtime"],
    "migrations: zero-downtime changes use expand, migrate, then contract");
  boolCheck(results, S6, "sql_one_logical_change_per_migration", manifest,
    ["migrations", "one_logical_change_per_migration"],
    "migrations: one logical change per migration");

  const S7 = "performance_evidence_and_plan_regression";
  boolCheck(results, S7, "sql_explain_analyze_captured_before_and_after_heavy_changes", manifest,
    ["performance_evidence", "explain_analyze_captured_before_and_after_heavy_changes"],
    "performance: EXPLAIN ANALYZE evidence is captured before and after heavy changes");
  boolCheck(results, S7, "sql_query_plan_regressions_watched_after_changes", manifest,
    ["performance_evidence", "query_plan_regressions_watched"],
    "performance: query plan regressions are watched after changes");

  const S8 = "sql_red_lines";
  falseCheck(results, S8, "sql_no_string_concatenated_sql_with_user_input", manifest,
    ["sql_red_lines", "string_concatenated_sql_with_user_input_present"],
    "red line: no string-concatenated SQL with user input is present in the record");
  falseCheck(results, S8, "sql_no_unreviewed_migration_on_live_data", manifest,
    ["sql_red_lines", "unreviewed_migration_on_live_data_present"],
    "red line: no unreviewed migration on live data is present in the record");
  falseCheck(results, S8, "sql_no_direct_to_production_schema_edit", manifest,
    ["sql_red_lines", "direct_to_production_schema_edit_present"],
    "red line: no direct-to-production schema edit is present in the record");
  falseCheck(results, S8, "sql_no_unbounded_write_without_where", manifest,
    ["sql_red_lines", "unbounded_write_without_where_present"],
    "red line: no unbounded UPDATE or DELETE without a WHERE clause is present in the record");

  const sections: Record<string, string> = {};
  for (const section of SECTIONS) {
    const secResults = results.filter((r) => r.section === section);
    if (secResults.some((r) => r.status === "fail")) {
      sections[section] = "fail";
    } else if (secResults.some((r) => r.status === "missing")) {
      sections[section] = "insufficient_evidence";
    } else {
      sections[section] = "pass";
    }
  }

  let verdict: string;
  if (Object.values(sections).some((v) => v === "fail")) {
    verdict = "SQL_SCHEMA_QUERY_ENGINEERING_PACK_NOT_READY";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "SQL_SCHEMA_QUERY_ENGINEERING_PACK_READY";
  }

  const computedNames = [
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
  ];
  const computedStatuses = results
    .filter((r) => computedNames.includes(r.check))
    .map((r) => r.status);
  let computedStatus: string | null;
  if (computedStatuses.some((s) => s === "fail")) {
    computedStatus = "outside_stated_limits_on_declared_evidence";
  } else if (computedStatuses.every((s) => s === "pass")) {
    computedStatus = "within_stated_limits_on_declared_evidence";
  } else {
    computedStatus = null;
  }

  const count = (status: CheckStatus) =>
    results.filter((r) => r.status === status).length;

  return {
    service: "sql-schema-query-engineering-pack",
    atom_version: "0.1.0",
    project: manifest["project"] ?? null,
    verdict,
    sections,
    checks: results,
    computed_status: computedStatus,
    tables_count: tablesCount,
    indexes_count: indexesCount,
    queries_count: queriesCount,
    tables_without_primary_key: tablesWithoutPk,
    tables_without_schema_constraints: tablesWithoutConstraints,
    tables_without_not_null_default: tablesWithoutNotNull,
    tables_with_non_snake_case_names: nonSnake,
    duplicate_sql_table_names: duplicateTableNames,
    indexes_without_columns: indexesWithoutColumns,
    duplicate_sql_index_names: duplicateIndexNames,
    queries_without_explicit_column_list: queriesWithoutExplicit,
    queries_without_bounded_or_paginated_access: queriesWithoutBound,
    queries_without_parameterized_inputs: queriesWithoutParam,
    queries_without_n_plus_one_avoidance: queriesWithoutN1,
    uncovered_sql_queries: uncoveredQueries,
    duplicate_sql_query_names: duplicateQueryNames,
    table_primary_key_coverage: fmt6(coverage(trows, tablesIsList, tablesCount, "primary_key_declared")),
    table_schema_constraints_coverage: fmt6(coverage(trows, tablesIsList, tablesCount, "schema_constraints_declared")),
    table_not_null_default_coverage: fmt6(coverage(trows, tablesIsList, tablesCount, "not_null_default_declared")),
    index_columns_coverage: fmt6(indexColumnsCoverage),
    query_explicit_column_list_coverage: fmt6(coverage(qrows, queriesIsList, queriesCount, "explicit_column_list_declared")),
    query_bounded_or_paginated_coverage: fmt6(coverage(qrows, queriesIsList, queriesCount, "bounded_or_paginated_declared")),
    query_parameterized_inputs_coverage: fmt6(coverage(qrows, queriesIsList, queriesCount, "parameterized_inputs_declared")),
    query_n_plus_one_avoidance_coverage: fmt6(coverage(qrows, queriesIsList, queriesCount, "n_plus_one_avoidance_declared")),
    query_index_support_coverage: fmt6(queryIndexSupportCoverage),
    summary:
      `${count("pass")} pass, ` +
      `${count("fail")} fail, ` +
      `${count("missing")} missing ` +
      `of ${results.length} checks across eight sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "SQL SCHEMA QUERY ENGINEERING PACK",
    `project: ${pyStr(verdict.project ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(44)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
