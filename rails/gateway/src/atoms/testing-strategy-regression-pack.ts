// Testing strategy regression pack — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/testing-strategy-regression-pack/src/testing_strategy_regression_pack.py
// (evaluate() + stamp()). No logic changes: every verdict, section
// outcome, per-check status, evidence string, computed field and
// the summary string are byte-identical to the Python output for
// the same input. Computed ratios use the shared fixed
// serialization: round half up to 6dp —
// floor(v * 1000000 + 0.5) / 1000000 — then format with exactly six
// decimals.

import { pyStr } from "./release-readiness.js";
import { validateManifest, type FieldSpec } from "./validate.js";

const MANIFEST_SPEC: { [field: string]: FieldSpec } = {
  plan_title: "string",
  scoping: {
    scope_declared: "boolean",
    risks_identified_before_planning: "boolean",
    p0_flows_identified: "boolean",
    test_plan_document_present: "boolean",
    test_plan_states_exclusions: "boolean",
  },
  risk_rows: [{
    risk_id: "string",
    description: "string",
    is_p0: "boolean",
  }],
  level_planning: {
    pyramid_applied: "boolean",
    logic_tested_at_unit_level: "boolean",
    boundaries_tested_at_integration_level: "boolean",
    critical_journeys_tested_at_e2e_level: "boolean",
    tricky_edge_cases_tested_at_unit_level: "boolean",
  },
  test_level_rows: [{
    level_row_id: "string",
    risk_id: "string",
    test_level: "string",
  }],
  regression_planning: {
    regression_test_written_before_defect_fix: "boolean",
    regression_tests_kept_permanently: "boolean",
    every_fixed_bug_has_regression_test: "boolean",
  },
  declared_changes: [{
    change_id: "string",
    change_kind: "string",
    description: "string",
  }],
  regression_rows: [{
    regression_id: "string",
    change_id: "string",
    kept_permanently: "boolean",
  }],
  fixtures: {
    no_shared_mutable_state: "boolean",
    explicit_seed_data_used: "boolean",
    time_controlled: "boolean",
    randomness_controlled: "boolean",
    fixtures_declared_for_suites: "boolean",
  },
  flake_policy: {
    known_flakes_present: "boolean",
    flakes_quarantined_immediately: "boolean",
    flakes_fixed_within_a_week_or_deleted_consciously: "boolean",
    no_quarantined_test_without_tracked_ticket: "boolean",
    quarantine_ticket_recorded: "boolean",
  },
  negative_testing: {
    invalid_input_tested: "boolean",
    timeouts_tested: "boolean",
    partial_failures_tested: "boolean",
    retries_tested: "boolean",
    sane_failure_asserted: "boolean",
  },
  entry_exit_and_reporting: {
    entry_criteria_declared: "boolean",
    exit_criteria_declared: "boolean",
    full_suite_green_before_handoff: "boolean",
    report_states_what_ran: "boolean",
    report_states_what_passed: "boolean",
    report_states_what_not_covered: "boolean",
    coverage_gaps_stated_explicitly: "boolean",
  },
  red_lines: {
    tests_depend_on_production_systems_present: "boolean",
    tests_depend_on_live_data_present: "boolean",
    assertion_weakened_to_fix_test_present: "boolean",
  },
};

export const SECTIONS = [
  "scope_and_risk_declaration",
  "test_levels_and_pyramid",
  "regression_coverage",
  "fixtures_and_determinism",
  "flake_policy",
  "negative_testing",
  "entry_exit_and_reporting",
  "red_lines",
] as const;

const TEST_LEVELS = ["unit", "integration", "e2e"];
const CHANGE_KINDS = ["feature", "defect_fix", "refactor"];

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
  plan_title: unknown;
  verdict: string;
  sections: Record<string, string>;
  checks: CheckResult[];
  computed_status: string | null;
  risk_rows_count: number | null;
  test_level_rows_count: number | null;
  declared_changes_count: number | null;
  regression_rows_count: number | null;
  unit_level_row_count: number | null;
  integration_level_row_count: number | null;
  e2e_level_row_count: number | null;
  duplicate_risk_ids: string[] | null;
  duplicate_test_level_row_ids: string[] | null;
  duplicate_change_ids: string[] | null;
  duplicate_regression_row_ids: string[] | null;
  risks_without_description: string[] | null;
  risks_without_p0_status: string[] | null;
  test_level_rows_with_invalid_level: string[] | null;
  test_level_rows_with_unknown_risk_reference: string[] | null;
  declared_risks_without_test_level_row: string[] | null;
  p0_risks_without_e2e_row: string[] | null;
  declared_changes_without_description: string[] | null;
  declared_changes_with_invalid_kind: string[] | null;
  regression_rows_with_unknown_change_reference: string[] | null;
  declared_changes_without_regression_row: string[] | null;
  defect_changes_without_regression_row: string[] | null;
  regression_rows_not_declared_permanent: string[] | null;
  risk_level_coverage_ratio: string | null;
  p0_e2e_coverage_ratio: string | null;
  change_regression_coverage_ratio: string | null;
  defect_regression_coverage_ratio: string | null;
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
  if (hasGate && gate) {
    check(results, section, name, target, hasTarget, target === true, evidence);
  } else {
    check(results, section, name, gate, hasGate, true, naEvidence);
  }
}

function fmt6(value: number | null): string | null {
  if (value === null) return null;
  const rounded = Math.floor(value * 1000000 + 0.5) / 1000000;
  return rounded.toFixed(6);
}

function nonemptyStr(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function rowName(entry: unknown, field: string): string {
  if (isPyDict(entry) && typeof entry[field] === "string") {
    return entry[field] as string;
  }
  return "unnamed";
}

function duplicates(rows: unknown[], field: string): string[] {
  const seen: string[] = [];
  const dups: string[] = [];
  for (const c of rows) {
    if (isPyDict(c) && typeof c[field] === "string") {
      const nm = c[field] as string;
      if (seen.includes(nm) && !dups.includes(nm)) dups.push(nm);
      seen.push(nm);
    }
  }
  return dups;
}

function idsOf(rows: unknown[], field: string): string[] {
  const out: string[] = [];
  for (const c of rows) {
    if (isPyDict(c) && typeof c[field] === "string") {
      out.push(c[field] as string);
    }
  }
  return out;
}

export function evaluate(manifest: unknown): Verdict {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateManifest(manifest, MANIFEST_SPEC);
  const results: CheckResult[] = [];

  const [risksRaw, hasRisks] = getPath(manifest, "risk_rows");
  const risksIsList = hasRisks && Array.isArray(risksRaw);
  const riskRows: unknown[] = risksIsList ? (risksRaw as unknown[]) : [];
  const risksCount: number | null = risksIsList ? riskRows.length : null;
  const riskIds = idsOf(riskRows, "risk_id");
  const p0RiskIds: string[] = [];
  for (const c of riskRows) {
    if (isPyDict(c) && typeof c["risk_id"] === "string" && c["is_p0"] === true) {
      p0RiskIds.push(c["risk_id"] as string);
    }
  }

  const [levelsRaw, hasLevels] = getPath(manifest, "test_level_rows");
  const levelsIsList = hasLevels && Array.isArray(levelsRaw);
  const levelRows: unknown[] = levelsIsList ? (levelsRaw as unknown[]) : [];
  const levelsCount: number | null = levelsIsList ? levelRows.length : null;
  const unitCount: number | null = levelsIsList
    ? levelRows.filter((c) => isPyDict(c) && c["test_level"] === "unit").length
    : null;
  const integrationCount: number | null = levelsIsList
    ? levelRows.filter((c) => isPyDict(c) && c["test_level"] === "integration").length
    : null;
  const e2eCount: number | null = levelsIsList
    ? levelRows.filter((c) => isPyDict(c) && c["test_level"] === "e2e").length
    : null;
  const coveredRiskIds = idsOf(levelRows, "risk_id");
  const e2eRiskIds: string[] = [];
  for (const c of levelRows) {
    if (isPyDict(c) && typeof c["risk_id"] === "string" && c["test_level"] === "e2e") {
      e2eRiskIds.push(c["risk_id"] as string);
    }
  }

  const [changesRaw, hasChanges] = getPath(manifest, "declared_changes");
  const changesIsList = hasChanges && Array.isArray(changesRaw);
  const changeRows: unknown[] = changesIsList ? (changesRaw as unknown[]) : [];
  const changesCount: number | null = changesIsList ? changeRows.length : null;
  const changeIds = idsOf(changeRows, "change_id");
  const defectChangeIds: string[] = [];
  for (const c of changeRows) {
    if (isPyDict(c) && typeof c["change_id"] === "string" && c["change_kind"] === "defect_fix") {
      defectChangeIds.push(c["change_id"] as string);
    }
  }

  const [regsRaw, hasRegs] = getPath(manifest, "regression_rows");
  const regsIsList = hasRegs && Array.isArray(regsRaw);
  const regRows: unknown[] = regsIsList ? (regsRaw as unknown[]) : [];
  const regsCount: number | null = regsIsList ? regRows.length : null;
  const regCoveredChangeIds = idsOf(regRows, "change_id");

  const duplicateRiskIds: string[] | null = risksIsList
    ? duplicates(riskRows, "risk_id") : null;
  const duplicateLevelRowIds: string[] | null = levelsIsList
    ? duplicates(levelRows, "level_row_id") : null;
  const duplicateChangeIds: string[] | null = changesIsList
    ? duplicates(changeRows, "change_id") : null;
  const duplicateRegressionIds: string[] | null = regsIsList
    ? duplicates(regRows, "regression_id") : null;

  const risksWithoutDescription: string[] | null = risksIsList
    ? riskRows.filter((c) => hasField(c, "description") &&
        !nonemptyStr((c as Record<string, unknown>)["description"]))
        .map((c) => rowName(c, "risk_id"))
    : null;
  const risksWithoutP0Status: string[] | null = risksIsList
    ? riskRows.filter((c) => !hasField(c, "is_p0"))
        .map((c) => rowName(c, "risk_id"))
    : null;
  const levelRowsWithInvalidLevel: string[] | null = levelsIsList
    ? levelRows.filter((c) => hasField(c, "test_level") &&
        !TEST_LEVELS.includes((c as Record<string, unknown>)["test_level"] as string))
        .map((c) => rowName(c, "level_row_id"))
    : null;
  const levelRowsWithUnknownRisk: string[] | null = levelsIsList && risksIsList
    ? levelRows.filter((c) => hasField(c, "risk_id") &&
        !riskIds.includes((c as Record<string, unknown>)["risk_id"] as string))
        .map((c) => rowName(c, "level_row_id"))
    : null;
  const risksWithoutLevelRow: string[] | null = risksIsList && levelsIsList
    ? riskIds.filter((rid) => !coveredRiskIds.includes(rid))
    : null;
  const p0RisksWithoutE2e: string[] | null = risksIsList && levelsIsList
    ? p0RiskIds.filter((rid) => !e2eRiskIds.includes(rid))
    : null;
  const changesWithoutDescription: string[] | null = changesIsList
    ? changeRows.filter((c) => hasField(c, "description") &&
        !nonemptyStr((c as Record<string, unknown>)["description"]))
        .map((c) => rowName(c, "change_id"))
    : null;
  const changesWithInvalidKind: string[] | null = changesIsList
    ? changeRows.filter((c) => hasField(c, "change_kind") &&
        !CHANGE_KINDS.includes((c as Record<string, unknown>)["change_kind"] as string))
        .map((c) => rowName(c, "change_id"))
    : null;
  const regRowsWithUnknownChange: string[] | null = regsIsList && changesIsList
    ? regRows.filter((c) => hasField(c, "change_id") &&
        !changeIds.includes((c as Record<string, unknown>)["change_id"] as string))
        .map((c) => rowName(c, "regression_id"))
    : null;
  const changesWithoutRegression: string[] | null = changesIsList && regsIsList
    ? changeIds.filter((cid) => !regCoveredChangeIds.includes(cid))
    : null;
  const defectChangesWithoutRegression: string[] | null = changesIsList && regsIsList
    ? defectChangeIds.filter((cid) => !regCoveredChangeIds.includes(cid))
    : null;
  const regRowsNotPermanent: string[] | null = regsIsList
    ? regRows.filter((c) => hasField(c, "kept_permanently") &&
        (c as Record<string, unknown>)["kept_permanently"] !== true)
        .map((c) => rowName(c, "regression_id"))
    : null;

  const riskLevelCoverageRatio: number | null =
    risksIsList && levelsIsList && risksCount !== null && risksCount > 0
      ? riskIds.filter((r) => coveredRiskIds.includes(r)).length / risksCount
      : null;
  const p0E2eCoverageRatio: number | null =
    risksIsList && levelsIsList && p0RiskIds.length > 0
      ? p0RiskIds.filter((r) => e2eRiskIds.includes(r)).length / p0RiskIds.length
      : null;
  const changeRegressionCoverageRatio: number | null =
    changesIsList && regsIsList && changesCount !== null && changesCount > 0
      ? changeIds.filter((c) => regCoveredChangeIds.includes(c)).length / changesCount
      : null;
  const defectRegressionCoverageRatio: number | null =
    changesIsList && regsIsList && defectChangeIds.length > 0
      ? defectChangeIds.filter((c) => regCoveredChangeIds.includes(c)).length / defectChangeIds.length
      : null;

  // ---- Section 1: scope_and_risk_declaration ----
  boolCheck(results, "scope_and_risk_declaration",
    "testing_strategy_scope_declared", manifest,
    ["scoping", "scope_declared"],
    "scope: the system / change scope the strategy covers is declared");
  boolCheck(results, "scope_and_risk_declaration",
    "testing_strategy_risks_identified_before_planning", manifest,
    ["scoping", "risks_identified_before_planning"],
    "risk-first: the risks were identified before levels were planned — test what breaks expensively");
  boolCheck(results, "scope_and_risk_declaration",
    "testing_strategy_p0_flows_identified", manifest,
    ["scoping", "p0_flows_identified"],
    "risk-first: the P0 flows are identified in the declared record");
  boolCheck(results, "scope_and_risk_declaration",
    "testing_strategy_test_plan_document_present", manifest,
    ["scoping", "test_plan_document_present"],
    "artifacts: a short test-plan document is present for the work");
  boolCheck(results, "scope_and_risk_declaration",
    "testing_strategy_test_plan_states_exclusions", manifest,
    ["scoping", "test_plan_states_exclusions"],
    "artifacts: the test plan states what is excluded");
  check(results, "scope_and_risk_declaration",
    "testing_strategy_risk_rows_list_declared", risksRaw, risksIsList,
    risksIsList && risksCount !== null && risksCount > 0,
    "risk rows: the declared record names its risks — the list is present and names at least one risk; an absent list is missing evidence and an empty list declares no risk-first strategy at all");
  const riskIdPresent = risksIsList && riskRows.every((c) => hasField(c, "risk_id"));
  check(results, "scope_and_risk_declaration",
    "every_testing_strategy_risk_id_unique", risksRaw, riskIdPresent,
    risksIsList && duplicateRiskIds !== null && duplicateRiskIds.length === 0,
    "risk rows: no declared risk_id is owned by more than one row");
  const descPresent = risksIsList && riskRows.every((c) => hasField(c, "description"));
  check(results, "scope_and_risk_declaration",
    "every_testing_strategy_risk_description_declared", risksRaw, descPresent,
    risksIsList && riskRows.every((c) => isPyDict(c) && nonemptyStr(c["description"])),
    "risk rows: every declared risk declares a non-empty description");
  const p0Present = risksIsList && riskRows.every((c) => hasField(c, "is_p0"));
  check(results, "scope_and_risk_declaration",
    "every_testing_strategy_risk_p0_status_declared", risksRaw, p0Present,
    risksIsList && riskRows.every((c) => hasField(c, "is_p0")),
    "risk rows: every declared risk declares whether it is a P0 risk");

  // ---- Section 2: test_levels_and_pyramid ----
  boolCheck(results, "test_levels_and_pyramid",
    "testing_strategy_pyramid_applied", manifest,
    ["level_planning", "pyramid_applied"],
    "pyramid: the test pyramid is applied — many unit, fewer integration, few e2e");
  boolCheck(results, "test_levels_and_pyramid",
    "testing_strategy_logic_tested_at_unit_level", manifest,
    ["level_planning", "logic_tested_at_unit_level"],
    "pyramid: logic is tested at the unit level");
  boolCheck(results, "test_levels_and_pyramid",
    "testing_strategy_boundaries_tested_at_integration_level", manifest,
    ["level_planning", "boundaries_tested_at_integration_level"],
    "pyramid: boundaries, DB and API are tested at the integration level");
  boolCheck(results, "test_levels_and_pyramid",
    "testing_strategy_critical_journeys_tested_at_e2e_level", manifest,
    ["level_planning", "critical_journeys_tested_at_e2e_level"],
    "pyramid / quality gate: critical journeys are covered end-to-end");
  boolCheck(results, "test_levels_and_pyramid",
    "testing_strategy_tricky_edge_cases_tested_at_unit_level", manifest,
    ["level_planning", "tricky_edge_cases_tested_at_unit_level"],
    "risk-first: tricky edge cases get unit tests");
  check(results, "test_levels_and_pyramid",
    "testing_strategy_test_level_rows_list_declared", levelsRaw, levelsIsList,
    levelsIsList && levelsCount !== null && levelsCount > 0,
    "level rows: the declared record names its test-level rows — the list is present and names at least one row; an absent list is missing evidence and an empty list declares no level plan at all");
  const levelIdPresent = levelsIsList && levelRows.every((c) => hasField(c, "level_row_id"));
  check(results, "test_levels_and_pyramid",
    "every_testing_strategy_test_level_row_id_unique", levelsRaw, levelIdPresent,
    levelsIsList && duplicateLevelRowIds !== null && duplicateLevelRowIds.length === 0,
    "level rows: no declared level_row_id is owned by more than one row");
  const lvlPresent = levelsIsList && levelRows.every((c) => hasField(c, "test_level"));
  check(results, "test_levels_and_pyramid",
    "every_testing_strategy_test_level_row_level_recognised", levelsRaw, lvlPresent,
    levelsIsList && levelRows.every((c) => isPyDict(c) &&
      TEST_LEVELS.includes(c["test_level"] as string)),
    "level rows: every declared row's level is one of unit, integration, e2e — the three levels the skill names");
  const refPresent = levelsIsList && risksIsList &&
    levelRows.every((c) => hasField(c, "risk_id"));
  check(results, "test_levels_and_pyramid",
    "every_testing_strategy_test_level_row_risk_reference_resolves", levelsRaw,
    refPresent,
    levelsIsList && risksIsList &&
      levelRows.every((c) => hasField(c, "risk_id") &&
        riskIds.includes((c as Record<string, unknown>)["risk_id"] as string)),
    "level rows: every declared row's risk_id names a risk in the declared risk list");
  const coverPresent = risksIsList && levelsIsList &&
    levelRows.every((c) => hasField(c, "risk_id"));
  check(results, "test_levels_and_pyramid",
    "every_testing_strategy_declared_risk_covered_by_level_row", levelsRaw,
    coverPresent,
    risksIsList && levelsIsList &&
      riskIds.every((rid) => coveredRiskIds.includes(rid)),
    "level rows / risk-first: every declared risk is covered by at least one declared test-level row");
  const p0CoverPresent = risksIsList && levelsIsList &&
    riskRows.every((c) => hasField(c, "is_p0")) &&
    levelRows.every((c) => hasField(c, "risk_id") && hasField(c, "test_level"));
  check(results, "test_levels_and_pyramid",
    "every_testing_strategy_p0_risk_covered_by_e2e_row", levelsRaw,
    p0CoverPresent,
    risksIsList && levelsIsList &&
      p0RiskIds.every((rid) => e2eRiskIds.includes(rid)),
    "level rows / risk-first: every declared P0 risk is covered by at least one declared e2e row — P0 flows get e2e");
  const pyramidPresent = levelsIsList &&
    levelRows.every((c) => hasField(c, "test_level"));
  check(results, "test_levels_and_pyramid",
    "testing_strategy_pyramid_level_counts_in_declared_order", levelsRaw,
    pyramidPresent,
    levelsIsList && unitCount !== null && integrationCount !== null &&
      e2eCount !== null && e2eCount >= 1 &&
      unitCount >= integrationCount && integrationCount >= e2eCount,
    "pyramid: the declared level-row counts follow the skill's stated order — at least one row per level, unit rows >= integration rows >= e2e rows (many / fewer / few)");

  // ---- Section 3: regression_coverage ----
  boolCheck(results, "regression_coverage",
    "regression_pack_regression_test_written_before_defect_fix", manifest,
    ["regression_planning", "regression_test_written_before_defect_fix"],
    "bug -> test: for bug fixes the regression test is written first, before the fix");
  boolCheck(results, "regression_coverage",
    "regression_pack_regression_tests_kept_permanently_declared", manifest,
    ["regression_planning", "regression_tests_kept_permanently"],
    "bug -> test: a regression test, once written for a confirmed defect, is kept forever");
  boolCheck(results, "regression_coverage",
    "regression_pack_every_fixed_bug_has_regression_test_declared", manifest,
    ["regression_planning", "every_fixed_bug_has_regression_test"],
    "quality gate: every fixed bug has a regression test");
  check(results, "regression_coverage",
    "regression_pack_declared_changes_list_declared", changesRaw, changesIsList,
    changesIsList && changesCount !== null && changesCount > 0,
    "declared changes: the declared record names its change rows — the list is present and names at least one change; an absent list is missing evidence and an empty list declares no regression scope at all");
  const changeIdPresent = changesIsList && changeRows.every((c) => hasField(c, "change_id"));
  check(results, "regression_coverage",
    "every_regression_pack_change_id_unique", changesRaw, changeIdPresent,
    changesIsList && duplicateChangeIds !== null && duplicateChangeIds.length === 0,
    "declared changes: no declared change_id is owned by more than one row");
  const cdescPresent = changesIsList && changeRows.every((c) => hasField(c, "description"));
  check(results, "regression_coverage",
    "every_regression_pack_change_description_declared", changesRaw, cdescPresent,
    changesIsList && changeRows.every((c) => isPyDict(c) && nonemptyStr(c["description"])),
    "declared changes: every declared change declares a non-empty description");
  const kindPresent = changesIsList && changeRows.every((c) => hasField(c, "change_kind"));
  check(results, "regression_coverage",
    "every_regression_pack_change_kind_recognised", changesRaw, kindPresent,
    changesIsList && changeRows.every((c) => isPyDict(c) &&
      CHANGE_KINDS.includes(c["change_kind"] as string)),
    "declared changes: every declared change's kind is one of feature, defect_fix, refactor — the work kinds the skill names");
  check(results, "regression_coverage",
    "regression_pack_regression_rows_list_declared", regsRaw, regsIsList,
    regsIsList && regsCount !== null && regsCount > 0,
    "regression rows: the declared record names its regression-suite rows — the list is present and names at least one row; an absent list is missing evidence and an empty list declares no regression suite at all");
  const regIdPresent = regsIsList && regRows.every((c) => hasField(c, "regression_id"));
  check(results, "regression_coverage",
    "every_regression_pack_regression_row_id_unique", regsRaw, regIdPresent,
    regsIsList && duplicateRegressionIds !== null && duplicateRegressionIds.length === 0,
    "regression rows: no declared regression_id is owned by more than one row");
  const rrefPresent = regsIsList && changesIsList &&
    regRows.every((c) => hasField(c, "change_id"));
  check(results, "regression_coverage",
    "every_regression_pack_regression_row_change_reference_resolves", regsRaw,
    rrefPresent,
    regsIsList && changesIsList &&
      regRows.every((c) => hasField(c, "change_id") &&
        changeIds.includes((c as Record<string, unknown>)["change_id"] as string)),
    "regression rows: every declared row's change_id names a change in the declared change list");
  const rcoverPresent = changesIsList && regsIsList &&
    regRows.every((c) => hasField(c, "change_id"));
  check(results, "regression_coverage",
    "every_regression_pack_declared_change_covered_by_regression_row", regsRaw,
    rcoverPresent,
    changesIsList && regsIsList &&
      changeIds.every((cid) => regCoveredChangeIds.includes(cid)),
    "regression rows: every declared change is covered by at least one declared regression row");
  const dcoverPresent = changesIsList && regsIsList &&
    changeRows.every((c) => hasField(c, "change_kind")) &&
    regRows.every((c) => hasField(c, "change_id"));
  check(results, "regression_coverage",
    "every_regression_pack_defect_change_covered_by_regression_row", regsRaw,
    dcoverPresent,
    changesIsList && regsIsList &&
      defectChangeIds.every((cid) => regCoveredChangeIds.includes(cid)),
    "regression rows / bug -> test: every declared defect_fix change is covered by at least one declared regression row");
  const permPresent = regsIsList && regRows.every((c) => hasField(c, "kept_permanently"));
  check(results, "regression_coverage",
    "every_regression_pack_regression_row_kept_permanently", regsRaw, permPresent,
    regsIsList && regRows.every((c) => isPyDict(c) && c["kept_permanently"] === true),
    "regression rows: every declared regression row is declared kept permanently — it is kept forever");

  // ---- Section 4: fixtures_and_determinism ----
  boolCheck(results, "fixtures_and_determinism",
    "testing_strategy_fixtures_have_no_shared_mutable_state", manifest,
    ["fixtures", "no_shared_mutable_state"],
    "fixtures: fixtures have no shared mutable state");
  boolCheck(results, "fixtures_and_determinism",
    "testing_strategy_fixtures_use_explicit_seed_data", manifest,
    ["fixtures", "explicit_seed_data_used"],
    "fixtures: fixtures use explicit seed data");
  boolCheck(results, "fixtures_and_determinism",
    "testing_strategy_time_controlled_in_fixtures", manifest,
    ["fixtures", "time_controlled"],
    "fixtures: time is controlled in the fixtures");
  boolCheck(results, "fixtures_and_determinism",
    "testing_strategy_randomness_controlled_in_fixtures", manifest,
    ["fixtures", "randomness_controlled"],
    "fixtures: randomness is controlled in the fixtures");
  boolCheck(results, "fixtures_and_determinism",
    "testing_strategy_fixtures_declared_for_suites", manifest,
    ["fixtures", "fixtures_declared_for_suites"],
    "artifacts / fixtures: fixtures are declared for the suites per level");

  // ---- Section 5: flake_policy ----
  boolCheck(results, "flake_policy",
    "testing_strategy_flakes_quarantined_immediately", manifest,
    ["flake_policy", "flakes_quarantined_immediately"],
    "flake policy: a flaky test is quarantined immediately");
  boolCheck(results, "flake_policy",
    "testing_strategy_flakes_fixed_within_a_week_or_deleted_consciously", manifest,
    ["flake_policy", "flakes_fixed_within_a_week_or_deleted_consciously"],
    "flake policy: a quarantined flake is fixed within a week, or deleted consciously");
  boolCheck(results, "flake_policy",
    "testing_strategy_no_quarantined_test_without_tracked_ticket_declared", manifest,
    ["flake_policy", "no_quarantined_test_without_tracked_ticket"],
    "quality gate: no skipped or quarantined test is left without a tracked ticket");
  gatedBoolCheck(results, "flake_policy",
    "testing_strategy_quarantine_ticket_recorded_where_flakes_present", manifest,
    ["flake_policy", "known_flakes_present"],
    ["flake_policy", "quarantine_ticket_recorded"],
    "flake policy / quality gate: a tracked ticket is recorded for the quarantined flakes declared present",
    "no known flakes declared present");

  // ---- Section 6: negative_testing ----
  boolCheck(results, "negative_testing",
    "testing_strategy_negative_invalid_input_tested", manifest,
    ["negative_testing", "invalid_input_tested"],
    "negative testing: invalid input is tested");
  boolCheck(results, "negative_testing",
    "testing_strategy_negative_timeouts_tested", manifest,
    ["negative_testing", "timeouts_tested"],
    "negative testing: timeouts are tested");
  boolCheck(results, "negative_testing",
    "testing_strategy_negative_partial_failures_tested", manifest,
    ["negative_testing", "partial_failures_tested"],
    "negative testing: partial failures are tested");
  boolCheck(results, "negative_testing",
    "testing_strategy_negative_retries_tested", manifest,
    ["negative_testing", "retries_tested"],
    "negative testing: retries are tested");
  boolCheck(results, "negative_testing",
    "testing_strategy_negative_sane_failure_asserted", manifest,
    ["negative_testing", "sane_failure_asserted"],
    "negative testing: sane failure is asserted, not just \"no crash\"");

  // ---- Section 7: entry_exit_and_reporting ----
  boolCheck(results, "entry_exit_and_reporting",
    "testing_strategy_entry_criteria_declared", manifest,
    ["entry_exit_and_reporting", "entry_criteria_declared"],
    "entry / exit: the entry criteria for testing are declared");
  boolCheck(results, "entry_exit_and_reporting",
    "testing_strategy_exit_criteria_declared", manifest,
    ["entry_exit_and_reporting", "exit_criteria_declared"],
    "entry / exit: the exit criteria for testing are declared");
  boolCheck(results, "entry_exit_and_reporting",
    "testing_strategy_full_suite_green_before_handoff", manifest,
    ["entry_exit_and_reporting", "full_suite_green_before_handoff"],
    "quality gate: the full suite is green before handoff");
  boolCheck(results, "entry_exit_and_reporting",
    "testing_strategy_report_states_what_ran", manifest,
    ["entry_exit_and_reporting", "report_states_what_ran"],
    "honest reporting: the report states what ran");
  boolCheck(results, "entry_exit_and_reporting",
    "testing_strategy_report_states_what_passed", manifest,
    ["entry_exit_and_reporting", "report_states_what_passed"],
    "honest reporting: the report states what passed");
  boolCheck(results, "entry_exit_and_reporting",
    "testing_strategy_report_states_what_not_covered", manifest,
    ["entry_exit_and_reporting", "report_states_what_not_covered"],
    "honest reporting: the report states what is NOT covered");
  boolCheck(results, "entry_exit_and_reporting",
    "testing_strategy_coverage_gaps_stated_explicitly", manifest,
    ["entry_exit_and_reporting", "coverage_gaps_stated_explicitly"],
    "quality gate: coverage gaps are stated explicitly in the report");

  // ---- Section 8: red_lines ----
  falseCheck(results, "red_lines",
    "testing_strategy_free_of_production_system_dependency", manifest,
    ["red_lines", "tests_depend_on_production_systems_present"],
    "red line: no test depends on a production system");
  falseCheck(results, "red_lines",
    "testing_strategy_free_of_live_data_dependency", manifest,
    ["red_lines", "tests_depend_on_live_data_present"],
    "red line: no test depends on live data");
  falseCheck(results, "red_lines",
    "testing_strategy_free_of_assertion_weakened_to_fix_test", manifest,
    ["red_lines", "assertion_weakened_to_fix_test_present"],
    "red line: no test was \"fixed\" by weakening its assertion — the code was fixed, or the test deleted deliberately");

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
    verdict = "TESTING_STRATEGY_NOT_SOUND";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "TESTING_STRATEGY_SOUND";
  }

  const computedNames = [
    "testing_strategy_risk_rows_list_declared",
    "every_testing_strategy_risk_id_unique",
    "every_testing_strategy_risk_description_declared",
    "every_testing_strategy_risk_p0_status_declared",
    "testing_strategy_test_level_rows_list_declared",
    "every_testing_strategy_test_level_row_id_unique",
    "every_testing_strategy_test_level_row_level_recognised",
    "every_testing_strategy_test_level_row_risk_reference_resolves",
    "every_testing_strategy_declared_risk_covered_by_level_row",
    "every_testing_strategy_p0_risk_covered_by_e2e_row",
    "testing_strategy_pyramid_level_counts_in_declared_order",
    "regression_pack_declared_changes_list_declared",
    "every_regression_pack_change_id_unique",
    "every_regression_pack_change_description_declared",
    "every_regression_pack_change_kind_recognised",
    "regression_pack_regression_rows_list_declared",
    "every_regression_pack_regression_row_id_unique",
    "every_regression_pack_regression_row_change_reference_resolves",
    "every_regression_pack_declared_change_covered_by_regression_row",
    "every_regression_pack_defect_change_covered_by_regression_row",
    "every_regression_pack_regression_row_kept_permanently",
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
    service: "testing-strategy-regression-pack",
    atom_version: "0.1.0",
    plan_title: manifest["plan_title"] ?? null,
    verdict,
    sections,
    checks: results,
    computed_status: computedStatus,
    risk_rows_count: risksCount,
    test_level_rows_count: levelsCount,
    declared_changes_count: changesCount,
    regression_rows_count: regsCount,
    unit_level_row_count: unitCount,
    integration_level_row_count: integrationCount,
    e2e_level_row_count: e2eCount,
    duplicate_risk_ids: duplicateRiskIds,
    duplicate_test_level_row_ids: duplicateLevelRowIds,
    duplicate_change_ids: duplicateChangeIds,
    duplicate_regression_row_ids: duplicateRegressionIds,
    risks_without_description: risksWithoutDescription,
    risks_without_p0_status: risksWithoutP0Status,
    test_level_rows_with_invalid_level: levelRowsWithInvalidLevel,
    test_level_rows_with_unknown_risk_reference: levelRowsWithUnknownRisk,
    declared_risks_without_test_level_row: risksWithoutLevelRow,
    p0_risks_without_e2e_row: p0RisksWithoutE2e,
    declared_changes_without_description: changesWithoutDescription,
    declared_changes_with_invalid_kind: changesWithInvalidKind,
    regression_rows_with_unknown_change_reference: regRowsWithUnknownChange,
    declared_changes_without_regression_row: changesWithoutRegression,
    defect_changes_without_regression_row: defectChangesWithoutRegression,
    regression_rows_not_declared_permanent: regRowsNotPermanent,
    risk_level_coverage_ratio: fmt6(riskLevelCoverageRatio),
    p0_e2e_coverage_ratio: fmt6(p0E2eCoverageRatio),
    change_regression_coverage_ratio: fmt6(changeRegressionCoverageRatio),
    defect_regression_coverage_ratio: fmt6(defectRegressionCoverageRatio),
    summary:
      `${count("pass")} pass, ` +
      `${count("fail")} fail, ` +
      `${count("missing")} missing ` +
      `of ${results.length} checks across eight sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "TESTING STRATEGY REGRESSION PACK",
    `plan_title: ${pyStr(verdict.plan_title ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(44)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
