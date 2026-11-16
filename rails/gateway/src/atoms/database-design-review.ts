// Database design review — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/database-design-review/src/database_design_review.py
// (evaluate() + stamp()). No logic changes: every verdict, section
// outcome, per-check status, evidence string, computed field and
// the summary string are byte-identical to the Python output for
// the same input. Computed ratios use the shared fixed
// serialization: round half up to 4dp —
// floor(v * 10000 + 0.5) / 10000 — then format with exactly four
// decimals; comparisons use the unrounded values.

import { pyStr } from "./release-readiness.js";
import { validateManifest, type FieldSpec } from "./validate.js";

// Documented manifest field types (SERVICE.md input table) — the
// identical spec the Python oracle validates against. A field
// present with the wrong JSON type raises FieldTypeError before
// any check runs (F1 remedy, external verification Wave 1).
const MANIFEST_SPEC: { [field: string]: FieldSpec } = {
  design: "string",
  store_selection: {
    access_patterns_mapped: "boolean",
    store_chosen_from_access_patterns: "boolean",
    relational_default_or_fit_justified: "boolean",
  },
  tables: [{
    name: "string",
    primary_key: "string",
    constraints_declared: "boolean",
  }],
  normalization: {
    normalized_to_3nf: "boolean",
    denormalized: "boolean",
    denormalization_reasons_documented: "boolean",
  },
  query_patterns: [{
    name: "string",
    table: "string",
    supporting_index: "string",
  }],
  indexes: [{
    name: "string",
    table: "string",
    columns: ["string"],
  }],
  indexing: {
    composite_column_order_equality_then_range: "boolean",
    covering_indexes_for_hot_queries: "boolean",
    write_cost_considered: "boolean",
    explain_analyze_before_and_after: "boolean",
  },
  performance: {
    measured_first: "boolean",
    n_plus_one_queries_addressed: "boolean",
    keyset_pagination_for_large_sets: "boolean",
    offset_pagination_at_scale_present: "boolean",
    connection_pooling_declared: "boolean",
    bounded_result_sets: "boolean",
    cache_deliberate_with_honest_invalidation: "boolean",
  },
  integrity: {
    constraints_enforce_invariants: "boolean",
    appropriate_types_used: "boolean",
    money_stored_as_float: "boolean",
  },
  transactions: {
    isolation_level_and_anomalies_known: "boolean",
    transactions_kept_short: "boolean",
    writes_idempotent_where_retries_possible: "boolean",
    distributed_store_used: "boolean",
    consistency_availability_tradeoff_explicit: "boolean",
  },
  security: {
    parametrized_queries_only: "boolean",
    string_concatenated_sql_present: "boolean",
    least_privilege_users_per_service: "boolean",
    shared_superuser_present: "boolean",
    encryption_at_rest: "boolean",
  },
  migrations: {
    forward_only: "boolean",
    past_migrations_edited: "boolean",
    expand_contract_pattern_used: "boolean",
    big_bang_schema_swap_present: "boolean",
  },
  backups: {
    backups_scheduled: "boolean",
    restores_tested_on_schedule: "boolean",
    untested_backup_trusted: "boolean",
  },
};

export const SECTIONS = [
  "schema_and_normalization",
  "indexing_and_performance",
  "integrity_transactions_and_security",
  "migrations_and_backups",
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
  design: unknown;
  verdict: string;
  sections: Record<string, string>;
  checks: CheckResult[];
  computed_status: string | null;
  tables_count: number | null;
  tables_without_primary_key: string[] | null;
  tables_without_constraints_declared: string[] | null;
  primary_key_coverage: string | null;
  query_patterns_count: number | null;
  indexes_count: number | null;
  uncovered_query_patterns: string[] | null;
  query_pattern_index_coverage: string | null;
  summary: string;
}

function isPyDict(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function pyTruthy(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") return value.length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (isPyDict(value)) return Object.keys(value).length > 0;
  return Boolean(value);
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

function gatedBoolCheck(
  results: CheckResult[],
  section: string,
  name: string,
  manifest: Record<string, unknown>,
  gatePath: string[],
  targetPath: string[],
  evidence: string,
  naEvidence: string,
): void {
  const [gate, hasGate] = getPath(manifest, ...gatePath);
  const [target, hasTarget] = getPath(manifest, ...targetPath);
  if (hasGate && pyTruthy(gate)) {
    check(results, section, name, target, hasTarget,
      target === true, evidence);
  } else {
    check(results, section, name, gate, hasGate, true, naEvidence);
  }
}

function fmt4(value: number | null): string | null {
  if (value === null) return null;
  const rounded = Math.floor(value * 10000 + 0.5) / 10000;
  return rounded.toFixed(4);
}

function rowName(entry: unknown): string {
  if (isPyDict(entry) && typeof entry["name"] === "string") {
    return entry["name"] as string;
  }
  return "unnamed";
}

function hasPk(entry: unknown): boolean {
  return isPyDict(entry) && typeof entry["primary_key"] === "string" &&
    (entry["primary_key"] as string).length > 0;
}

function hasField(entry: unknown, field: string): boolean {
  return isPyDict(entry) &&
    Object.prototype.hasOwnProperty.call(entry, field);
}

export function evaluate(manifest: unknown): Verdict {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateManifest(manifest, MANIFEST_SPEC);
  const results: CheckResult[] = [];

  // ---- Declared rows, read once for the computed checks ----
  const [tablesRaw, hasTables] = getPath(manifest, "tables");
  const tablesIsList = hasTables && Array.isArray(tablesRaw);
  const tables: unknown[] = tablesIsList ? (tablesRaw as unknown[]) : [];
  const [patternsRaw, hasPatterns] = getPath(manifest, "query_patterns");
  const patternsIsList = hasPatterns && Array.isArray(patternsRaw);
  const patterns: unknown[] = patternsIsList ? (patternsRaw as unknown[]) : [];
  const [indexesRaw, hasIndexes] = getPath(manifest, "indexes");
  const indexesIsList = hasIndexes && Array.isArray(indexesRaw);
  const indexes: unknown[] = indexesIsList ? (indexesRaw as unknown[]) : [];

  const tablesCount: number | null = tablesIsList ? tables.length : null;
  const patternsCount: number | null = patternsIsList ? patterns.length : null;
  const indexesCount: number | null = indexesIsList ? indexes.length : null;

  const tablesWithoutPk: string[] | null = tablesIsList
    ? tables.filter((t) => !hasPk(t)).map(rowName)
    : null;
  const tablesWithoutConstraints: string[] | null = tablesIsList
    ? tables.filter((t) => !(isPyDict(t) && t["constraints_declared"] === true)).map(rowName)
    : null;
  const primaryKeyCoverage: number | null =
    tablesIsList && tablesCount !== null && tablesCount > 0 &&
      tablesWithoutPk !== null
      ? (tablesCount - tablesWithoutPk.length) / tablesCount
      : null;

  function indexMatches(pattern: unknown): boolean {
    if (!isPyDict(pattern)) return false;
    const supporting = pattern["supporting_index"];
    if (typeof supporting !== "string" || supporting.length === 0) {
      return false;
    }
    if (!indexesIsList) return false;
    for (const idx of indexes) {
      if (isPyDict(idx) && idx["name"] === supporting &&
        idx["table"] === pattern["table"]) {
        return true;
      }
    }
    return false;
  }

  const uncoveredPatterns: string[] | null =
    patternsIsList && indexesIsList
      ? patterns.filter((p) => isPyDict(p) &&
          typeof p["supporting_index"] === "string" &&
          (p["supporting_index"] as string).length > 0 &&
          !indexMatches(p)).map(rowName)
      : null;
  const coveredCount: number | null =
    patternsIsList && indexesIsList
      ? patterns.filter((p) => indexMatches(p)).length
      : null;
  const patternCoverage: number | null =
    coveredCount !== null && patternsCount
      ? coveredCount / patternsCount
      : null;

  // ---- Section 1: schema_and_normalization ----
  boolCheck(results, "schema_and_normalization",
    "access_patterns_mapped_before_store_choice", manifest,
    ["store_selection", "access_patterns_mapped"],
    "choosing a store: the access patterns — reads vs writes, query shapes, consistency needs — are mapped before a store is chosen");
  boolCheck(results, "schema_and_normalization",
    "store_chosen_from_access_patterns", manifest,
    ["store_selection", "store_chosen_from_access_patterns"],
    "choosing a store: the store is picked for how the data is actually used — the declared access patterns, not the hype");
  boolCheck(results, "schema_and_normalization",
    "relational_default_or_fit_justified", manifest,
    ["store_selection", "relational_default_or_fit_justified"],
    "choosing a store: relational is the default for anything with relationships and integrity needs, and any document/KV/graph choice is justified by the access pattern genuinely fitting");
  check(results, "schema_and_normalization", "tables_declared",
    tablesRaw, tablesIsList,
    tablesIsList && (tablesCount as number) > 0,
    "relational design: the declared design record names its tables — the tables list is present and non-empty");
  const pkPresent = tablesIsList &&
    tables.every((t) => hasField(t, "primary_key"));
  check(results, "schema_and_normalization",
    "every_table_has_primary_key_named", tablesRaw, pkPresent,
    tablesIsList && (tablesCount as number) > 0 &&
      tablesWithoutPk !== null && tablesWithoutPk.length === 0,
    "relational design: every declared table row names a primary key");
  const constraintsPresent = tablesIsList &&
    tables.every((t) => hasField(t, "constraints_declared"));
  check(results, "schema_and_normalization",
    "every_table_declares_constraints", tablesRaw, constraintsPresent,
    tablesIsList && (tablesCount as number) > 0 &&
      tablesWithoutConstraints !== null &&
      tablesWithoutConstraints.length === 0,
    "relational design: every declared table row declares its constraints — NOT NULL, UNIQUE, FK, CHECK — so the database enforces invariants");
  boolCheck(results, "schema_and_normalization",
    "normalized_to_3nf_declared", manifest,
    ["normalization", "normalized_to_3nf"],
    "relational design: the design is normalized to 3NF first");
  gatedBoolCheck(results, "schema_and_normalization",
    "denormalization_reasons_documented_when_denormalized", manifest,
    ["normalization", "denormalized"],
    ["normalization", "denormalization_reasons_documented"],
    "relational design: denormalization is deliberate, for hot read paths, and its reasons are documented",
    "no denormalization declared");

  // ---- Section 2: indexing_and_performance ----
  check(results, "indexing_and_performance", "query_patterns_declared",
    patternsRaw, patternsIsList,
    patternsIsList && (patternsCount as number) > 0,
    "indexing: the declared design record names its query patterns — the query patterns list is present and non-empty");
  check(results, "indexing_and_performance", "indexes_declared",
    indexesRaw, indexesIsList,
    indexesIsList && (indexesCount as number) > 0,
    "indexing: the declared design record names its indexes — the indexes list is present and non-empty");
  const columnsPresent = indexesIsList &&
    indexes.every((i) => hasField(i, "columns"));
  check(results, "indexing_and_performance",
    "every_index_declares_columns", indexesRaw, columnsPresent,
    indexesIsList && (indexesCount as number) > 0 &&
      indexes.every((i) => isPyDict(i) && Array.isArray(i["columns"]) &&
        (i["columns"] as unknown[]).length > 0),
    "indexing: every declared index row declares its columns");
  const matchingPresent = patternsIsList && indexesIsList &&
    patterns.every((p) => hasField(p, "supporting_index") &&
      hasField(p, "table"));
  check(results, "indexing_and_performance",
    "every_query_pattern_has_matching_index", patternsRaw,
    matchingPresent,
    patternsIsList && indexesIsList && (patternsCount as number) > 0 &&
      uncoveredPatterns !== null && uncoveredPatterns.length === 0 &&
      coveredCount === patternsCount,
    "indexing: every declared query pattern names a supporting index that is declared, on the same table — indexes are for the actual query patterns");
  boolCheck(results, "indexing_and_performance",
    "composite_index_column_order_equality_then_range", manifest,
    ["indexing", "composite_column_order_equality_then_range"],
    "indexing: composite index column order matters — equality columns first, then range");
  boolCheck(results, "indexing_and_performance",
    "covering_indexes_for_hot_queries", manifest,
    ["indexing", "covering_indexes_for_hot_queries"],
    "indexing: covering indexes are aimed for on hot queries");
  boolCheck(results, "indexing_and_performance",
    "index_write_cost_considered", manifest,
    ["indexing", "write_cost_considered"],
    "indexing: the write cost is considered — every index taxes writes");
  boolCheck(results, "indexing_and_performance",
    "explain_analyze_before_and_after", manifest,
    ["indexing", "explain_analyze_before_and_after"],
    "indexing: EXPLAIN / ANALYZE is run before and after — measure, don't guess");
  boolCheck(results, "indexing_and_performance",
    "performance_measured_first", manifest,
    ["performance", "measured_first"],
    "performance: measure first");
  boolCheck(results, "indexing_and_performance",
    "n_plus_one_queries_addressed", manifest,
    ["performance", "n_plus_one_queries_addressed"],
    "performance: N+1 queries are killed");
  boolCheck(results, "indexing_and_performance",
    "keyset_pagination_for_large_sets", manifest,
    ["performance", "keyset_pagination_for_large_sets"],
    "performance: keyset (cursor) pagination is preferred for large sets");
  falseCheck(results, "indexing_and_performance",
    "no_offset_pagination_at_scale", manifest,
    ["performance", "offset_pagination_at_scale_present"],
    "anti-pattern: no OFFSET pagination at scale");
  boolCheck(results, "indexing_and_performance",
    "connection_pooling_declared", manifest,
    ["performance", "connection_pooling_declared"],
    "performance: connection pooling is declared");
  boolCheck(results, "indexing_and_performance", "bounded_result_sets",
    manifest, ["performance", "bounded_result_sets"],
    "performance: result sets are bounded");
  boolCheck(results, "indexing_and_performance",
    "cache_deliberate_and_invalidation_honest", manifest,
    ["performance", "cache_deliberate_with_honest_invalidation"],
    "performance: caching is deliberate and invalidation is honest");

  // ---- Section 3: integrity_transactions_and_security ----
  boolCheck(results, "integrity_transactions_and_security",
    "constraints_enforce_invariants", manifest,
    ["integrity", "constraints_enforce_invariants"],
    "relational design: constraints are data integrity — NOT NULL, UNIQUE, FK, CHECK — and the database enforces invariants");
  boolCheck(results, "integrity_transactions_and_security",
    "appropriate_types_used", manifest,
    ["integrity", "appropriate_types_used"],
    "relational design: the right types are used — timestamps with time zone, numeric for money, enums/lookup tables for categories");
  falseCheck(results, "integrity_transactions_and_security",
    "money_not_stored_as_float", manifest,
    ["integrity", "money_stored_as_float"],
    "anti-pattern: money is not stored as float");
  boolCheck(results, "integrity_transactions_and_security",
    "isolation_level_and_anomalies_known", manifest,
    ["transactions", "isolation_level_and_anomalies_known"],
    "transactions & consistency: the isolation level and what anomalies it permits are known");
  boolCheck(results, "integrity_transactions_and_security",
    "transactions_kept_short", manifest,
    ["transactions", "transactions_kept_short"],
    "transactions & consistency: transactions are kept short");
  boolCheck(results, "integrity_transactions_and_security",
    "writes_idempotent_where_retries_possible", manifest,
    ["transactions", "writes_idempotent_where_retries_possible"],
    "transactions & consistency: writes are designed to be idempotent where retries are possible");
  gatedBoolCheck(results, "integrity_transactions_and_security",
    "consistency_availability_tradeoff_explicit_when_distributed",
    manifest, ["transactions", "distributed_store_used"],
    ["transactions", "consistency_availability_tradeoff_explicit"],
    "transactions & consistency: the consistency vs availability trade-off is explicit for the distributed store in use",
    "no distributed store declared in use");
  boolCheck(results, "integrity_transactions_and_security",
    "parametrized_queries_only", manifest,
    ["security", "parametrized_queries_only"],
    "security: parametrized queries only — user input is never concatenated");
  falseCheck(results, "integrity_transactions_and_security",
    "no_string_concatenated_sql", manifest,
    ["security", "string_concatenated_sql_present"],
    "anti-pattern: no string-concatenated SQL");
  boolCheck(results, "integrity_transactions_and_security",
    "least_privilege_users_per_service", manifest,
    ["security", "least_privilege_users_per_service"],
    "security: least-privilege database users per service");
  falseCheck(results, "integrity_transactions_and_security",
    "no_shared_superuser", manifest,
    ["security", "shared_superuser_present"],
    "security: no shared superuser");
  boolCheck(results, "integrity_transactions_and_security",
    "encryption_at_rest_declared", manifest,
    ["security", "encryption_at_rest"],
    "security: encryption at rest is declared");

  // ---- Section 4: migrations_and_backups ----
  boolCheck(results, "migrations_and_backups",
    "migrations_forward_only", manifest,
    ["migrations", "forward_only"],
    "migrations: migrations are forward-only");
  falseCheck(results, "migrations_and_backups",
    "no_past_migrations_edited", manifest,
    ["migrations", "past_migrations_edited"],
    "migrations / anti-pattern: past migrations are never edited — reversal is a new migration");
  boolCheck(results, "migrations_and_backups",
    "expand_contract_pattern_used", manifest,
    ["migrations", "expand_contract_pattern_used"],
    "migrations: backward-compatible deploys use expand/contract — add new, backfill, switch reads, stop writes to old, drop old");
  falseCheck(results, "migrations_and_backups",
    "no_big_bang_schema_swap", manifest,
    ["migrations", "big_bang_schema_swap_present"],
    "migrations: no big-bang schema swaps against live traffic");
  boolCheck(results, "migrations_and_backups", "backups_scheduled",
    manifest, ["backups", "backups_scheduled"],
    "backups: backups are scheduled");
  boolCheck(results, "migrations_and_backups",
    "restores_tested_on_schedule", manifest,
    ["backups", "restores_tested_on_schedule"],
    "backups: restores are tested on a schedule — a backup you haven't restored is a hope, not a backup");
  falseCheck(results, "migrations_and_backups",
    "untested_backup_not_trusted", manifest,
    ["backups", "untested_backup_trusted"],
    "anti-pattern: an untested backup is not trusted");

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
    verdict = "DATABASE_DESIGN_NOT_SOUND";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "DATABASE_DESIGN_SOUND";
  }

  const computedNames = [
    "tables_declared",
    "every_table_has_primary_key_named",
    "every_table_declares_constraints",
    "query_patterns_declared",
    "indexes_declared",
    "every_query_pattern_has_matching_index",
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
    service: "database-design-review",
    atom_version: "0.1.0",
    design: manifest["design"] ?? null,
    verdict,
    sections,
    checks: results,
    computed_status: computedStatus,
    tables_count: tablesCount,
    tables_without_primary_key: tablesWithoutPk,
    tables_without_constraints_declared: tablesWithoutConstraints,
    primary_key_coverage: fmt4(primaryKeyCoverage),
    query_patterns_count: patternsCount,
    indexes_count: indexesCount,
    uncovered_query_patterns: uncoveredPatterns,
    query_pattern_index_coverage: fmt4(patternCoverage),
    summary:
      `${count("pass")} pass, ` +
      `${count("fail")} fail, ` +
      `${count("missing")} missing ` +
      `of ${results.length} checks across four sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "DATABASE DESIGN REVIEW",
    `design: ${pyStr(verdict.design ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(36)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
