// Knowledge graph design — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/knowledge-graph-design/src/knowledge_graph_design.py
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
  graph: "string",
  schema: {
    entities_relations_attributes_modeled: "boolean",
    schema_changes_go_through_migrations: "boolean",
    migration_path_documented: "boolean",
    stable_ids_everywhere: "boolean",
    core_type_count: "number",
  },
  provenance: {
    provenance_on_every_assertion: "boolean",
    user_asserted_inferred_imported_distinguished: "boolean",
  },
  assertions: [{
    name: "string",
    source_declared: "boolean",
    date_declared: "boolean",
    confidence_declared: "boolean",
    origin_classified: "boolean",
  }],
  history: {
    append_only_event_log_is_source_of_truth: "boolean",
    current_state_is_projection: "boolean",
    corrections_are_new_events_referencing_old: "boolean",
    silent_edits_present: "boolean",
  },
  storage: {
    storage_fit_selected: "boolean",
    dedicated_graph_db_used: "boolean",
    graph_db_justified_by_query_complexity_or_scale: "boolean",
  },
  query: {
    canonical_query_patterns_defined: "boolean",
    full_text_and_vector_indexes_paired: "boolean",
    agent_queries_bounded: "boolean",
    counts_first_expand_on_request: "boolean",
    full_graph_dumps_present: "boolean",
  },
  portability: {
    export_import_formats_json_or_jsonld: "boolean",
    export_import_round_trip_tested: "boolean",
    versioned_snapshots: "boolean",
    deletion_is_real: "boolean",
    tombstones_where_required_addressed: "boolean",
  },
  privacy: {
    access_scoped: "boolean",
    encryption_at_rest: "boolean",
    sensitive_nodes_redactable: "boolean",
    third_party_personal_data_without_lawful_basis_present: "boolean",
  },
  red_lines: {
    unprovenanced_assertions_presented_as_fact_present: "boolean",
  },
};

const PROVENANCE_FIELDS = [
  "source_declared",
  "date_declared",
  "confidence_declared",
] as const;

export const SECTIONS = [
  "schema_and_modeling",
  "provenance",
  "immutable_history",
  "storage_and_query_retrieval",
  "portability_and_ownership",
  "privacy_and_red_lines",
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
  graph: unknown;
  verdict: string;
  sections: Record<string, string>;
  checks: CheckResult[];
  computed_status: string | null;
  assertions_count: number | null;
  assertions_without_full_provenance: string[] | null;
  provenance_coverage: string | null;
  assertions_without_origin_classification: string[] | null;
  origin_classification_coverage: string | null;
  declared_core_type_count: number | null;
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

function hasFullProvenance(entry: unknown): boolean {
  return isPyDict(entry) &&
    PROVENANCE_FIELDS.every((f) => entry[f] === true);
}

export function evaluate(manifest: unknown): Verdict {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateManifest(manifest, MANIFEST_SPEC);
  const results: CheckResult[] = [];

  const [assertionsRaw, hasAssertions] = getPath(manifest, "assertions");
  const assertionsIsList = hasAssertions && Array.isArray(assertionsRaw);
  const rows: unknown[] = assertionsIsList ? (assertionsRaw as unknown[]) : [];
  const assertionsCount: number | null = assertionsIsList ? rows.length : null;

  const [coreTypeCountRaw, hasCoreTypeCount] =
    getPath(manifest, "schema", "core_type_count");
  const coreTypeCount: number | null =
    hasCoreTypeCount ? (coreTypeCountRaw as number) : null;
  const declaredCoreTypeCount: number | null = coreTypeCount;

  const assertionsWithoutFullProvenance: string[] | null = assertionsIsList
    ? rows.filter((c) => isPyDict(c) &&
        PROVENANCE_FIELDS.some((f) => hasField(c, f) && c[f] !== true))
        .map(rowName)
    : null;
  const assertionsWithoutOrigin: string[] | null = assertionsIsList
    ? rows.filter((c) => hasField(c, "origin_classified") &&
        (c as Record<string, unknown>)["origin_classified"] !== true)
        .map(rowName)
    : null;
  const provenanceCoverage: number | null =
    assertionsIsList && assertionsCount !== null && assertionsCount > 0
      ? rows.filter((c) => hasFullProvenance(c)).length / assertionsCount
      : null;
  const originCoverage: number | null =
    assertionsIsList && assertionsCount !== null && assertionsCount > 0
      ? rows.filter((c) => isPyDict(c) &&
          c["origin_classified"] === true).length / assertionsCount
      : null;

  // ---- Section 1: schema_and_modeling ----
  boolCheck(results, "schema_and_modeling",
    "entities_relations_attributes_modeled", manifest,
    ["schema", "entities_relations_attributes_modeled"],
    "model deliberately: entities, relations and attributes are modeled deliberately");
  boolCheck(results, "schema_and_modeling",
    "schema_changes_go_through_migrations", manifest,
    ["schema", "schema_changes_go_through_migrations"],
    "model deliberately: schema changes go through migrations like a database");
  boolCheck(results, "schema_and_modeling",
    "migration_path_documented", manifest,
    ["schema", "migration_path_documented"],
    "quality gate: schema and migration path are documented");
  boolCheck(results, "schema_and_modeling",
    "stable_ids_everywhere", manifest,
    ["schema", "stable_ids_everywhere"],
    "model deliberately: stable IDs everywhere");
  check(results, "schema_and_modeling",
    "core_type_count_within_stated_start_range", coreTypeCountRaw,
    hasCoreTypeCount,
    hasCoreTypeCount && coreTypeCount !== null &&
      10 <= coreTypeCount && coreTypeCount <= 20,
    "model deliberately: the declared core type count starts small — the skill states 10-20 core types");

  // ---- Section 2: provenance ----
  boolCheck(results, "provenance",
    "provenance_on_every_assertion", manifest,
    ["provenance", "provenance_on_every_assertion"],
    "provenance: every assertion carries provenance — source, date and confidence");
  boolCheck(results, "provenance",
    "user_asserted_inferred_imported_distinguished", manifest,
    ["provenance", "user_asserted_inferred_imported_distinguished"],
    "provenance: user-asserted, inferred and imported facts are distinguished");
  check(results, "provenance",
    "assertions_declared", assertionsRaw, assertionsIsList,
    assertionsIsList && (assertionsCount as number) > 0,
    "the declared record names its assertions — the assertions list is present and non-empty");
  const provenancePresent = assertionsIsList &&
    rows.every((c) => isPyDict(c) &&
      PROVENANCE_FIELDS.every((f) => hasField(c, f)));
  check(results, "provenance",
    "every_assertion_carries_full_provenance", assertionsRaw,
    provenancePresent,
    assertionsIsList && (assertionsCount as number) > 0 &&
      rows.every((c) => hasFullProvenance(c)),
    "provenance: every declared assertion row declares source, date and confidence");
  const originPresent = assertionsIsList &&
    rows.every((c) => hasField(c, "origin_classified"));
  check(results, "provenance",
    "every_assertion_origin_classified", assertionsRaw, originPresent,
    assertionsIsList && (assertionsCount as number) > 0 &&
      rows.every((c) => isPyDict(c) && c["origin_classified"] === true),
    "provenance: every declared assertion row declares its origin classified");

  // ---- Section 3: immutable_history ----
  boolCheck(results, "immutable_history",
    "append_only_event_log_is_source_of_truth", manifest,
    ["history", "append_only_event_log_is_source_of_truth"],
    "immutable history: an append-only event log is the source of truth");
  boolCheck(results, "immutable_history",
    "current_state_is_projection", manifest,
    ["history", "current_state_is_projection"],
    "immutable history: current state is a projection of the event log");
  boolCheck(results, "immutable_history",
    "corrections_are_new_events_referencing_old", manifest,
    ["history", "corrections_are_new_events_referencing_old"],
    "immutable history: corrections are new events referencing the old");
  falseCheck(results, "immutable_history",
    "no_silent_edits", manifest,
    ["history", "silent_edits_present"],
    "red line: no silent edits — append or version");

  // ---- Section 4: storage_and_query_retrieval ----
  boolCheck(results, "storage_and_query_retrieval",
    "storage_fit_selected", manifest,
    ["storage", "storage_fit_selected"],
    "storage fit: storage is selected to fit — SQLite/Postgres with an edges table for most needs, a dedicated graph DB only when query complexity or scale demands");
  gatedBoolCheck(results, "storage_and_query_retrieval",
    "graph_db_justified_when_dedicated_graph_db_used", manifest,
    ["storage", "dedicated_graph_db_used"],
    ["storage", "graph_db_justified_by_query_complexity_or_scale"],
    "storage fit: a dedicated graph DB is justified by query complexity or scale when one is used",
    "no dedicated graph DB declared");
  boolCheck(results, "storage_and_query_retrieval",
    "canonical_query_patterns_defined", manifest,
    ["query", "canonical_query_patterns_defined"],
    "query and retrieval: canonical query patterns — neighborhoods, paths and temporal windows — are defined");
  boolCheck(results, "storage_and_query_retrieval",
    "retrieval_indexes_paired", manifest,
    ["query", "full_text_and_vector_indexes_paired"],
    "storage fit: full-text and vector indexes are paired for retrieval");
  boolCheck(results, "storage_and_query_retrieval",
    "agent_queries_bounded", manifest,
    ["query", "agent_queries_bounded"],
    "quality gate: agent queries are bounded");
  boolCheck(results, "storage_and_query_retrieval",
    "counts_first_expand_on_request", manifest,
    ["query", "counts_first_expand_on_request"],
    "query and retrieval: bounded answers for agents — counts first, expand on request (token-aware serialization)");
  falseCheck(results, "storage_and_query_retrieval",
    "no_full_graph_dumps", manifest,
    ["query", "full_graph_dumps_present"],
    "query and retrieval: the graph is never dumped — bounded answers only");

  // ---- Section 5: portability_and_ownership ----
  boolCheck(results, "portability_and_ownership",
    "export_import_formats_json_or_jsonld", manifest,
    ["portability", "export_import_formats_json_or_jsonld"],
    "portability and ownership: export and import formats are simple JSON or JSON-LD");
  boolCheck(results, "portability_and_ownership",
    "export_import_round_trip_tested", manifest,
    ["portability", "export_import_round_trip_tested"],
    "quality gate: export and import are tested round-trip");
  boolCheck(results, "portability_and_ownership",
    "versioned_snapshots", manifest,
    ["portability", "versioned_snapshots"],
    "portability and ownership: versioned snapshots are kept");
  boolCheck(results, "portability_and_ownership",
    "deletion_is_real", manifest,
    ["portability", "deletion_is_real"],
    "red line: deletion is real — deletion must actually delete");
  boolCheck(results, "portability_and_ownership",
    "tombstones_where_required_addressed", manifest,
    ["portability", "tombstones_where_required_addressed"],
    "portability and ownership: tombstones where required are addressed alongside real deletion");

  // ---- Section 6: privacy_and_red_lines ----
  boolCheck(results, "privacy_and_red_lines",
    "access_scoped", manifest,
    ["privacy", "access_scoped"],
    "quality gate: access is scoped — graphs reveal relationships");
  boolCheck(results, "privacy_and_red_lines",
    "encryption_at_rest", manifest,
    ["privacy", "encryption_at_rest"],
    "privacy and encryption: the graph is encrypted at rest");
  boolCheck(results, "privacy_and_red_lines",
    "sensitive_nodes_redactable", manifest,
    ["privacy", "sensitive_nodes_redactable"],
    "privacy and encryption: sensitive nodes are redactable");
  falseCheck(results, "privacy_and_red_lines",
    "no_third_party_personal_data_without_lawful_basis", manifest,
    ["privacy", "third_party_personal_data_without_lawful_basis_present"],
    "privacy and encryption: no third-party personal data is ingested without a lawful basis");
  falseCheck(results, "privacy_and_red_lines",
    "no_unprovenanced_assertions_presented_as_fact", manifest,
    ["red_lines", "unprovenanced_assertions_presented_as_fact_present"],
    "red line: no unprovenanced assertions are presented as fact");

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
    verdict = "KNOWLEDGE_GRAPH_DESIGN_NOT_SOUND";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "KNOWLEDGE_GRAPH_DESIGN_SOUND";
  }

  const computedNames = [
    "core_type_count_within_stated_start_range",
    "assertions_declared",
    "every_assertion_carries_full_provenance",
    "every_assertion_origin_classified",
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
    service: "knowledge-graph-design",
    atom_version: "0.1.0",
    graph: manifest["graph"] ?? null,
    verdict,
    sections,
    checks: results,
    computed_status: computedStatus,
    assertions_count: assertionsCount,
    assertions_without_full_provenance: assertionsWithoutFullProvenance,
    provenance_coverage: fmt6(provenanceCoverage),
    assertions_without_origin_classification: assertionsWithoutOrigin,
    origin_classification_coverage: fmt6(originCoverage),
    declared_core_type_count: declaredCoreTypeCount,
    summary:
      `${count("pass")} pass, ` +
      `${count("fail")} fail, ` +
      `${count("missing")} missing ` +
      `of ${results.length} checks across six sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "KNOWLEDGE GRAPH DESIGN",
    `graph: ${pyStr(verdict.graph ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(36)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
