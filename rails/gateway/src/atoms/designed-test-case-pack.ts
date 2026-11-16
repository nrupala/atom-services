// Designed test case pack — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/designed-test-case-pack/src/designed_test_case_pack.py
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
  pack: "string",
  requirements: [{
    id: "string",
  }],
  cases: [{
    id: "string",
    requirement_ids: ["string"],
    level: "string",
    preconditions_declared: "boolean",
    steps_declared: "boolean",
    expected_result: "string",
    expected_result_written_before_execution: "boolean",
    covers_boundary: "boolean",
    covers_negative: "boolean",
  }],
  technique_application: {
    equivalence_partitioning_applied: "boolean",
    equivalence_representative_and_edges_per_class: "boolean",
    boundary_value_analysis_applied: "boolean",
    boundary_just_below_at_and_above_covered: "boolean",
    decision_tables_applicable: "boolean",
    decision_table_rules_covered_including_awkward: "boolean",
    stateful_behaviour_present: "boolean",
    state_transitions_allowed_forbidden_and_interrupts_tested: "boolean",
    many_config_axes_present: "boolean",
    pairwise_pair_coverage_used: "boolean",
  },
  negative_and_error_guessing: {
    negative_cases_designed: "boolean",
    invalid_inputs_covered: "boolean",
    wrong_order_retries_and_partial_failure_covered: "boolean",
  },
  risk_selection: {
    risk_based_selection_applied: "boolean",
    cases_ranked_by_damage_and_likelihood: "boolean",
    highest_risk_cases_selected_first: "boolean",
    not_tested_stated_explicitly: "boolean",
  },
  coverage: {
    coverage_gaps_stated_explicitly: "boolean",
    duplicate_path_suites_present: "boolean",
    happy_path_only_suite_present: "boolean",
    cases_written_before_execution: "boolean",
  },
};

export const SECTIONS = [
  "traceability_and_case_format",
  "technique_coverage",
  "negative_and_risk_selection",
  "coverage_gaps_and_suite_hygiene",
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
  pack: unknown;
  verdict: string;
  sections: Record<string, string>;
  checks: CheckResult[];
  computed_status: string | null;
  requirements_count: number | null;
  cases_count: number | null;
  untraced_requirements: string[] | null;
  requirement_trace_coverage: string | null;
  cases_without_expected_result: string[] | null;
  expected_result_coverage: string | null;
  cases_without_traceability: string[] | null;
  duplicate_case_ids: string[] | null;
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

function rowId(entry: unknown): string {
  if (isPyDict(entry) && typeof entry["id"] === "string") {
    return entry["id"] as string;
  }
  return "unnamed";
}

function hasExpected(entry: unknown): boolean {
  return isPyDict(entry) && typeof entry["expected_result"] === "string" &&
    (entry["expected_result"] as string).length > 0;
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
  const [requirementsRaw, hasRequirements] = getPath(manifest, "requirements");
  const requirementsIsList = hasRequirements && Array.isArray(requirementsRaw);
  const requirements: unknown[] = requirementsIsList
    ? (requirementsRaw as unknown[]) : [];
  const [casesRaw, hasCases] = getPath(manifest, "cases");
  const casesIsList = hasCases && Array.isArray(casesRaw);
  const cases: unknown[] = casesIsList ? (casesRaw as unknown[]) : [];

  const requirementsCount: number | null = requirementsIsList
    ? requirements.length : null;
  const casesCount: number | null = casesIsList ? cases.length : null;

  const reqIds = new Set<string>();
  if (requirementsIsList) {
    for (const r of requirements) {
      if (isPyDict(r) && typeof r["id"] === "string" &&
        (r["id"] as string).length > 0) {
        reqIds.add(r["id"] as string);
      }
    }
  }
  const tracedIds = new Set<string>();
  if (casesIsList) {
    for (const c of cases) {
      if (isPyDict(c) && Array.isArray(c["requirement_ids"])) {
        for (const ref of c["requirement_ids"] as unknown[]) {
          if (typeof ref === "string") tracedIds.add(ref);
        }
      }
    }
  }

  const untracedRequirements: string[] | null =
    requirementsIsList && casesIsList
      ? requirements.filter((r) => !(isPyDict(r) &&
          typeof r["id"] === "string" &&
          (r["id"] as string).length > 0 &&
          tracedIds.has(r["id"] as string))).map(rowId)
      : null;
  const requirementTraceCoverage: number | null =
    untracedRequirements !== null && requirementsCount
      ? (requirementsCount - untracedRequirements.length) / requirementsCount
      : null;

  const casesWithoutExpected: string[] | null = casesIsList
    ? cases.filter((c) => !hasExpected(c)).map(rowId)
    : null;
  const expectedResultCoverage: number | null =
    casesIsList && casesCount
      ? ((casesCount as number) -
          (casesWithoutExpected as string[]).length) / casesCount
      : null;

  function traces(c: unknown): boolean {
    if (!isPyDict(c)) return false;
    const refs = c["requirement_ids"];
    if (!Array.isArray(refs) || refs.length === 0) return false;
    return refs.some((ref) => typeof ref === "string" && reqIds.has(ref));
  }

  const casesWithoutTraceability: string[] | null =
    casesIsList && requirementsIsList
      ? cases.filter((c) => isPyDict(c) &&
          hasField(c, "requirement_ids") && !traces(c)).map(rowId)
      : null;

  let duplicateCaseIds: string[] | null = null;
  if (casesIsList) {
    const seen = new Set<string>();
    duplicateCaseIds = [];
    for (const c of cases) {
      const cid = isPyDict(c) ? c["id"] : undefined;
      if (typeof cid === "string" && cid.length > 0) {
        if (seen.has(cid) && !duplicateCaseIds.includes(cid)) {
          duplicateCaseIds.push(cid);
        }
        seen.add(cid);
      }
    }
  }

  // ---- Section 1: traceability_and_case_format ----
  check(results, "traceability_and_case_format", "requirements_declared",
    requirementsRaw, requirementsIsList,
    requirementsIsList && (requirementsCount as number) > 0,
    "case format: the declared pack record names its requirements — the requirements list is present and non-empty");
  check(results, "traceability_and_case_format", "cases_declared",
    casesRaw, casesIsList,
    casesIsList && (casesCount as number) > 0,
    "case format: the declared pack record names its test cases — the cases list is present and non-empty");
  const tracedPresent = requirementsIsList && casesIsList &&
    requirements.every((r) => hasField(r, "id")) &&
    cases.every((c) => hasField(c, "requirement_ids"));
  check(results, "traceability_and_case_format",
    "every_requirement_traced_to_at_least_one_case", requirementsRaw,
    tracedPresent,
    requirementsIsList && casesIsList && (requirementsCount as number) > 0 &&
      untracedRequirements !== null && untracedRequirements.length === 0,
    "quality gate: every requirement is traced to at least one case");
  const caseTracePresent = casesIsList && requirementsIsList &&
    cases.every((c) => hasField(c, "requirement_ids"));
  check(results, "traceability_and_case_format",
    "every_case_traces_to_at_least_one_requirement", casesRaw,
    caseTracePresent,
    casesIsList && requirementsIsList && (casesCount as number) > 0 &&
      casesWithoutTraceability !== null &&
      casesWithoutTraceability.length === 0 &&
      cases.every((c) => traces(c)),
    "case format: every declared case is traceable to at least one declared requirement");
  const idPresent = casesIsList &&
    cases.every((c) => hasField(c, "id"));
  check(results, "traceability_and_case_format",
    "every_case_has_unique_nonempty_id", casesRaw, idPresent,
    casesIsList && (casesCount as number) > 0 &&
      duplicateCaseIds !== null && duplicateCaseIds.length === 0 &&
      cases.every((c) => isPyDict(c) && typeof c["id"] === "string" &&
        (c["id"] as string).length > 0),
    "case format: every declared case carries an id, and no id is declared twice");
  const levelPresent = casesIsList &&
    cases.every((c) => hasField(c, "level"));
  check(results, "traceability_and_case_format",
    "every_case_declares_level", casesRaw, levelPresent,
    casesIsList && (casesCount as number) > 0 &&
      cases.every((c) => isPyDict(c) && typeof c["level"] === "string" &&
        (c["level"] as string).length > 0),
    "case format: every declared case declares its level");
  const preconditionsPresent = casesIsList &&
    cases.every((c) => hasField(c, "preconditions_declared"));
  check(results, "traceability_and_case_format",
    "every_case_declares_preconditions", casesRaw, preconditionsPresent,
    casesIsList && (casesCount as number) > 0 &&
      cases.every((c) => isPyDict(c) &&
        c["preconditions_declared"] === true),
    "case format: every declared case declares its preconditions");
  const stepsPresent = casesIsList &&
    cases.every((c) => hasField(c, "steps_declared"));
  check(results, "traceability_and_case_format",
    "every_case_declares_steps", casesRaw, stepsPresent,
    casesIsList && (casesCount as number) > 0 &&
      cases.every((c) => isPyDict(c) && c["steps_declared"] === true),
    "case format: every declared case declares its steps");
  const expectedPresent = casesIsList &&
    cases.every((c) => hasField(c, "expected_result"));
  check(results, "traceability_and_case_format",
    "every_case_has_expected_result", casesRaw, expectedPresent,
    casesIsList && (casesCount as number) > 0 &&
      casesWithoutExpected !== null && casesWithoutExpected.length === 0,
    "red line: no case without an expected result — every declared case names a non-empty expected result");
  const beforePresent = casesIsList &&
    cases.every((c) => hasField(c, "expected_result_written_before_execution"));
  check(results, "traceability_and_case_format",
    "every_case_expected_result_written_before_execution", casesRaw,
    beforePresent,
    casesIsList && (casesCount as number) > 0 &&
      cases.every((c) => isPyDict(c) &&
        c["expected_result_written_before_execution"] === true),
    "quality gate: expected results are written before execution — every declared case declares its expected result was written before running");

  // ---- Section 2: technique_coverage ----
  boolCheck(results, "technique_coverage",
    "equivalence_partitioning_applied", manifest,
    ["technique_application", "equivalence_partitioning_applied"],
    "equivalence partitioning: inputs are grouped into classes");
  boolCheck(results, "technique_coverage",
    "equivalence_representative_and_edges_per_class", manifest,
    ["technique_application", "equivalence_representative_and_edges_per_class"],
    "equivalence partitioning: one representative plus the edges per class — not every value");
  boolCheck(results, "technique_coverage",
    "boundary_value_analysis_applied", manifest,
    ["technique_application", "boundary_value_analysis_applied"],
    "boundary value analysis: boundaries are tested");
  boolCheck(results, "technique_coverage",
    "boundary_just_below_at_and_above_covered", manifest,
    ["technique_application", "boundary_just_below_at_and_above_covered"],
    "boundary value analysis: just-below / at / just-above each boundary is covered");
  const boundaryPresent = casesIsList &&
    cases.every((c) => hasField(c, "covers_boundary"));
  check(results, "technique_coverage",
    "at_least_one_boundary_case_declared", casesRaw, boundaryPresent,
    casesIsList && (casesCount as number) > 0 &&
      cases.some((c) => isPyDict(c) && c["covers_boundary"] === true),
    "quality gate: boundaries are present — at least one declared case is declared a boundary case");
  gatedBoolCheck(results, "technique_coverage",
    "decision_table_rules_covered_when_applicable", manifest,
    ["technique_application", "decision_tables_applicable"],
    ["technique_application", "decision_table_rules_covered_including_awkward"],
    "decision tables: condition combinations are enumerated and the interesting rules are covered, including the awkward ones",
    "decision tables not declared applicable");
  gatedBoolCheck(results, "technique_coverage",
    "state_transitions_tested_when_stateful", manifest,
    ["technique_application", "stateful_behaviour_present"],
    ["technique_application", "state_transitions_allowed_forbidden_and_interrupts_tested"],
    "state transition testing: allowed transitions, forbidden transitions, and interrupts are tested",
    "no stateful behaviour declared present");
  gatedBoolCheck(results, "technique_coverage",
    "pairwise_coverage_used_when_many_config_axes", manifest,
    ["technique_application", "many_config_axes_present"],
    ["technique_application", "pairwise_pair_coverage_used"],
    "pairwise / combinatorial: all pairs are covered instead of the full cross-product",
    "not many configuration axes declared present");

  // ---- Section 3: negative_and_risk_selection ----
  boolCheck(results, "negative_and_risk_selection",
    "negative_cases_designed", manifest,
    ["negative_and_error_guessing", "negative_cases_designed"],
    "negative + error guessing: negative cases are designed — accidents and attackers live here");
  boolCheck(results, "negative_and_risk_selection",
    "invalid_inputs_covered", manifest,
    ["negative_and_error_guessing", "invalid_inputs_covered"],
    "negative + error guessing: invalid inputs are covered");
  boolCheck(results, "negative_and_risk_selection",
    "wrong_order_retries_and_partial_failure_covered", manifest,
    ["negative_and_error_guessing", "wrong_order_retries_and_partial_failure_covered"],
    "negative + error guessing: wrong order, retries, and partial failure are covered");
  const negativePresent = casesIsList &&
    cases.every((c) => hasField(c, "covers_negative"));
  check(results, "negative_and_risk_selection",
    "at_least_one_negative_case_declared", casesRaw, negativePresent,
    casesIsList && (casesCount as number) > 0 &&
      cases.some((c) => isPyDict(c) && c["covers_negative"] === true),
    "quality gate: negatives are present — at least one declared case is declared a negative case");
  boolCheck(results, "negative_and_risk_selection",
    "risk_based_selection_applied", manifest,
    ["risk_selection", "risk_based_selection_applied"],
    "risk-based selection: techniques and cases are chosen by risk");
  boolCheck(results, "negative_and_risk_selection",
    "cases_ranked_by_damage_and_likelihood", manifest,
    ["risk_selection", "cases_ranked_by_damage_and_likelihood"],
    "risk-based selection: cases are ranked by damage times likelihood");
  boolCheck(results, "negative_and_risk_selection",
    "highest_risk_cases_selected_first", manifest,
    ["risk_selection", "highest_risk_cases_selected_first"],
    "risk-based selection: the highest-risk cases are selected first");
  boolCheck(results, "negative_and_risk_selection",
    "not_tested_stated_explicitly", manifest,
    ["risk_selection", "not_tested_stated_explicitly"],
    "risk-based selection: what is NOT tested is stated explicitly");

  // ---- Section 4: coverage_gaps_and_suite_hygiene ----
  boolCheck(results, "coverage_gaps_and_suite_hygiene",
    "coverage_gaps_stated_explicitly", manifest,
    ["coverage", "coverage_gaps_stated_explicitly"],
    "quality gate: coverage gaps are stated explicitly");
  falseCheck(results, "coverage_gaps_and_suite_hygiene",
    "no_duplicate_path_suites", manifest,
    ["coverage", "duplicate_path_suites_present"],
    "red line: no copy-paste suites that re-test the same path");
  falseCheck(results, "coverage_gaps_and_suite_hygiene",
    "not_happy_path_only", manifest,
    ["coverage", "happy_path_only_suite_present"],
    "quality gate: the suite is not happy paths only — boundaries and negatives are present");
  boolCheck(results, "coverage_gaps_and_suite_hygiene",
    "cases_written_before_execution", manifest,
    ["coverage", "cases_written_before_execution"],
    "case format: cases are written BEFORE running");

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
    verdict = "TEST_CASE_PACK_NOT_SOUND";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "TEST_CASE_PACK_SOUND";
  }

  const computedNames = [
    "requirements_declared",
    "cases_declared",
    "every_requirement_traced_to_at_least_one_case",
    "every_case_traces_to_at_least_one_requirement",
    "every_case_has_expected_result",
    "every_case_has_unique_nonempty_id",
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
    service: "designed-test-case-pack",
    atom_version: "0.1.0",
    pack: manifest["pack"] ?? null,
    verdict,
    sections,
    checks: results,
    computed_status: computedStatus,
    requirements_count: requirementsCount,
    cases_count: casesCount,
    untraced_requirements: untracedRequirements,
    requirement_trace_coverage: fmt4(requirementTraceCoverage),
    cases_without_expected_result: casesWithoutExpected,
    expected_result_coverage: fmt4(expectedResultCoverage),
    cases_without_traceability: casesWithoutTraceability,
    duplicate_case_ids: duplicateCaseIds,
    summary:
      `${count("pass")} pass, ` +
      `${count("fail")} fail, ` +
      `${count("missing")} missing ` +
      `of ${results.length} checks across four sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "DESIGNED TEST CASE PACK",
    `pack: ${pyStr(verdict.pack ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(36)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
