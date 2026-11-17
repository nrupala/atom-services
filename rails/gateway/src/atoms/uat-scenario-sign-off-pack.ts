// UAT scenario sign-off pack — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/uat-scenario-sign-off-pack/src/uat_scenario_sign_off_pack.py
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
  uat_round_title: "string",
  scope: {
    criteria_source_recorded: "boolean",
    scope_defined_before_execution: "boolean",
    no_silent_scope_edits_during_uat: "boolean",
  },
  acceptance_criteria: [{
    criterion_id: "string",
    description: "string",
  }],
  scenarios: [{
    scenario_id: "string",
    criterion_ids: ["string"],
    steps_recorded: "boolean",
    expected_outcome: "string",
    timeboxed: "boolean",
    result: "string",
  }],
  environment: {
    staging_mirrors_production: "boolean",
    test_data_realistic: "boolean",
    production_data_used: "boolean",
    test_data_anonymized: "boolean",
  },
  people: {
    business_owner_owns_uat: "boolean",
    business_owner_executes_uat: "boolean",
    supporting_team_assigned: "boolean",
    scribe_assigned: "boolean",
  },
  execution: {
    execution_window_completed: "boolean",
    deviations_logged_as_defects: "boolean",
  },
  defects: [{
    defect_id: "string",
    scenario_id: "string",
    severity: "string",
    disposition: "string",
    disposition_note: "string",
    defer_until: "string",
    resolved: "boolean",
  }],
  triage: {
    triage_held_daily: "boolean",
  },
  required_sign_off_roles: ["string"],
  sign_offs: [{
    role: "string",
    signer_name: "string",
    signed: "boolean",
  }],
  sign_off: {
    outcome: "string",
    conditional_open_items_listed: "boolean",
    conditional_owner_named: "boolean",
  },
  retest: {
    uat_fixes_made: "boolean",
    changed_scenarios_retested: "boolean",
    touched_flows_regression_completed: "boolean",
    retest_results_recorded: "boolean",
  },
  declared_totals: {
    acceptance_criteria_count: "number",
    scenarios_count: "number",
    executed_scenarios_count: "number",
    defects_count: "number",
    sign_off_roles_count: "number",
  },
  red_lines: {
    production_data_used_without_anonymization_present: "boolean",
    passed_while_blocker_defects_open_present: "boolean",
  },
};

export const SECTIONS = [
  "scope_and_criteria_mapping",
  "environment_people_and_scripts",
  "execution_and_results",
  "defects_and_triage",
  "sign_off_record",
  "retest_and_regression_after_fixes",
  "red_lines",
] as const;

const RESULT_KINDS = ["passed", "failed", "blocked", "not_run"];
const DISPOSITIONS = ["fix_now", "accept_with_note", "defer_with_date"];
const SIGN_OFF_OUTCOMES = ["pass", "conditional_pass"];

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
  uat_round_title: unknown;
  verdict: string;
  sections: Record<string, string>;
  checks: CheckResult[];
  computed_status: string | null;
  uat_acceptance_criteria_count: number | null;
  uat_scenarios_count: number | null;
  uat_executed_scenarios_count: number | null;
  uat_defects_count: number | null;
  uat_sign_offs_count: number | null;
  uat_required_sign_off_roles_count: number | null;
  duplicate_uat_criterion_ids: string[] | null;
  duplicate_uat_scenario_ids: string[] | null;
  duplicate_uat_defect_ids: string[] | null;
  duplicate_uat_required_sign_off_roles: string[] | null;
  duplicate_uat_sign_off_roles: string[] | null;
  uat_criteria_without_description: string[] | null;
  uat_criteria_not_covered_by_any_scenario: string[] | null;
  uat_scenarios_without_criterion_reference: string[] | null;
  uat_scenarios_with_unknown_criterion_reference: string[] | null;
  uat_scenarios_without_steps_recorded: string[] | null;
  uat_scenarios_without_expected_outcome: string[] | null;
  uat_scenarios_not_timeboxed: string[] | null;
  uat_scenarios_with_invalid_result: string[] | null;
  uat_scenarios_not_executed: string[] | null;
  uat_failed_or_blocked_scenarios_without_defect: string[] | null;
  uat_defects_with_unknown_scenario_reference: string[] | null;
  uat_defects_without_severity: string[] | null;
  uat_defects_with_invalid_disposition: string[] | null;
  uat_accepted_defects_without_note: string[] | null;
  uat_deferred_defects_without_date: string[] | null;
  uat_fix_now_defects_unresolved: string[] | null;
  uat_open_blocker_defect_ids: string[] | null;
  uat_sign_offs_with_unknown_role: string[] | null;
  uat_sign_offs_without_signer_name: string[] | null;
  uat_sign_offs_not_signed: string[] | null;
  uat_required_roles_without_signed_sign_off: string[] | null;
  uat_criterion_coverage_ratio: string | null;
  uat_scenario_execution_ratio: string | null;
  uat_scenario_pass_ratio: string | null;
  uat_defect_disposition_ratio: string | null;
  uat_sign_off_completion_ratio: string | null;
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

function field(entry: unknown, name: string): unknown {
  return isPyDict(entry) ? entry[name] : undefined;
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

function conditionalCheck(
  results: CheckResult[],
  section: string,
  name: string,
  manifest: Record<string, unknown>,
  targetPath: string[],
  evidence: string,
  naEvidence: string,
): void {
  const [outcome, hasOutcome] = getPath(manifest, "sign_off", "outcome");
  const [target, hasTarget] = getPath(manifest, ...targetPath);
  if (hasOutcome && outcome === "conditional_pass") {
    check(results, section, name, target, hasTarget, target === true, evidence);
  } else {
    check(results, section, name, outcome, hasOutcome, true, naEvidence);
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

function rowName(entry: unknown, name: string): string {
  if (isPyDict(entry) && typeof entry[name] === "string") {
    return entry[name] as string;
  }
  return "unnamed";
}

function duplicates(rows: unknown[], name: string): string[] {
  const seen: string[] = [];
  const dups: string[] = [];
  for (const c of rows) {
    if (isPyDict(c) && typeof c[name] === "string") {
      const nm = c[name] as string;
      if (seen.includes(nm) && !dups.includes(nm)) dups.push(nm);
      seen.push(nm);
    }
  }
  return dups;
}

function dupStrings(values: unknown[]): string[] {
  const seen: string[] = [];
  const dups: string[] = [];
  for (const nm of values) {
    if (typeof nm === "string") {
      if (seen.includes(nm) && !dups.includes(nm)) dups.push(nm);
      seen.push(nm);
    }
  }
  return dups;
}

function idsOf(rows: unknown[], name: string): string[] {
  const out: string[] = [];
  for (const c of rows) {
    if (isPyDict(c) && typeof c[name] === "string") {
      out.push(c[name] as string);
    }
  }
  return out;
}

function perRowPresent(
  isList: boolean,
  rows: unknown[],
  fields: string[],
): boolean {
  if (!isList) return false;
  return rows.every((c) => fields.every((f) => hasField(c, f)));
}

export function evaluate(manifest: unknown): Verdict {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateManifest(manifest, MANIFEST_SPEC);
  const results: CheckResult[] = [];

  const [criteriaRaw, hasCriteria] = getPath(manifest, "acceptance_criteria");
  const critIsList = hasCriteria && Array.isArray(criteriaRaw);
  const critRows: unknown[] = critIsList ? (criteriaRaw as unknown[]) : [];
  const critCount: number | null = critIsList ? critRows.length : null;
  const criterionIds = idsOf(critRows, "criterion_id");

  const [scenariosRaw, hasScenarios] = getPath(manifest, "scenarios");
  const scenIsList = hasScenarios && Array.isArray(scenariosRaw);
  const scenRows: unknown[] = scenIsList ? (scenariosRaw as unknown[]) : [];
  const scenCount: number | null = scenIsList ? scenRows.length : null;
  const scenarioIds = idsOf(scenRows, "scenario_id");

  const [defectsRaw, hasDefects] = getPath(manifest, "defects");
  const defectsIsList = hasDefects && Array.isArray(defectsRaw);
  const defectRows: unknown[] = defectsIsList ? (defectsRaw as unknown[]) : [];
  const defectsCount: number | null = defectsIsList ? defectRows.length : null;

  const [rolesRaw, hasRoles] = getPath(manifest, "required_sign_off_roles");
  const rolesIsList = hasRoles && Array.isArray(rolesRaw);
  const roleRows: unknown[] = rolesIsList ? (rolesRaw as unknown[]) : [];
  const rolesCount: number | null = rolesIsList ? roleRows.length : null;

  const [signOffsRaw, hasSignOffs] = getPath(manifest, "sign_offs");
  const soIsList = hasSignOffs && Array.isArray(signOffsRaw);
  const soRows: unknown[] = soIsList ? (signOffsRaw as unknown[]) : [];
  const soCount: number | null = soIsList ? soRows.length : null;

  const [outcome, hasOutcome] = getPath(manifest, "sign_off", "outcome");

  const duplicateCriterionIds: string[] | null = critIsList
    ? duplicates(critRows, "criterion_id") : null;
  const duplicateScenarioIds: string[] | null = scenIsList
    ? duplicates(scenRows, "scenario_id") : null;
  const duplicateDefectIds: string[] | null = defectsIsList
    ? duplicates(defectRows, "defect_id") : null;
  const duplicateRequiredRoles: string[] | null = rolesIsList
    ? dupStrings(roleRows) : null;
  const duplicateSignOffRoles: string[] | null = soIsList
    ? duplicates(soRows, "role") : null;

  const criteriaWithoutDescription: string[] | null = critIsList
    ? critRows.filter((c) => hasField(c, "description") &&
        !nonemptyStr(field(c, "description")))
        .map((c) => rowName(c, "criterion_id"))
    : null;

  const coveredCriterionIds: string[] = [];
  for (const c of scenRows) {
    if (isPyDict(c) && Array.isArray(c["criterion_ids"])) {
      for (const cid of c["criterion_ids"] as unknown[]) {
        if (typeof cid === "string" && !coveredCriterionIds.includes(cid)) {
          coveredCriterionIds.push(cid);
        }
      }
    }
  }
  const uncoveredCriteria: string[] | null = critIsList && scenIsList
    ? criterionIds.filter((cid) => !coveredCriterionIds.includes(cid))
    : null;
  const scenariosWithoutCriterion: string[] | null = scenIsList
    ? scenRows.filter((c) => hasField(c, "criterion_ids") &&
        !(Array.isArray(field(c, "criterion_ids")) &&
          (field(c, "criterion_ids") as unknown[]).length > 0))
        .map((c) => rowName(c, "scenario_id"))
    : null;
  const scenariosWithUnknownCriterion: string[] | null =
    scenIsList && critIsList
      ? scenRows.filter((c) => hasField(c, "criterion_ids") &&
          Array.isArray(field(c, "criterion_ids")) &&
          (field(c, "criterion_ids") as unknown[]).some(
            (cid) => !criterionIds.includes(cid as string)))
          .map((c) => rowName(c, "scenario_id"))
      : null;
  const scenariosWithoutSteps: string[] | null = scenIsList
    ? scenRows.filter((c) => hasField(c, "steps_recorded") &&
        field(c, "steps_recorded") !== true)
        .map((c) => rowName(c, "scenario_id"))
    : null;
  const scenariosWithoutExpected: string[] | null = scenIsList
    ? scenRows.filter((c) => hasField(c, "expected_outcome") &&
        !nonemptyStr(field(c, "expected_outcome")))
        .map((c) => rowName(c, "scenario_id"))
    : null;
  const scenariosNotTimeboxed: string[] | null = scenIsList
    ? scenRows.filter((c) => hasField(c, "timeboxed") &&
        field(c, "timeboxed") !== true)
        .map((c) => rowName(c, "scenario_id"))
    : null;
  const scenariosWithInvalidResult: string[] | null = scenIsList
    ? scenRows.filter((c) => hasField(c, "result") &&
        !RESULT_KINDS.includes(field(c, "result") as string))
        .map((c) => rowName(c, "scenario_id"))
    : null;
  const scenariosNotExecuted: string[] | null = scenIsList
    ? scenRows.filter((c) => hasField(c, "result") &&
        field(c, "result") === "not_run")
        .map((c) => rowName(c, "scenario_id"))
    : null;
  const executedCount: number | null = scenIsList
    ? scenRows.filter((c) =>
        ["passed", "failed", "blocked"].includes(field(c, "result") as string)).length
    : null;
  const defectScenarioIds = idsOf(defectRows, "scenario_id");
  const failedOrBlockedWithoutDefect: string[] | null =
    scenIsList && defectsIsList
      ? scenRows.filter((c) => hasField(c, "result") &&
          ["failed", "blocked"].includes(field(c, "result") as string) &&
          hasField(c, "scenario_id") &&
          !defectScenarioIds.includes(field(c, "scenario_id") as string))
          .map((c) => rowName(c, "scenario_id"))
      : null;

  const defectsWithUnknownScenario: string[] | null =
    defectsIsList && scenIsList
      ? defectRows.filter((c) => hasField(c, "scenario_id") &&
          !scenarioIds.includes(field(c, "scenario_id") as string))
          .map((c) => rowName(c, "defect_id"))
      : null;
  const defectsWithoutSeverity: string[] | null = defectsIsList
    ? defectRows.filter((c) => hasField(c, "severity") &&
        !nonemptyStr(field(c, "severity")))
        .map((c) => rowName(c, "defect_id"))
    : null;
  const defectsWithInvalidDisposition: string[] | null = defectsIsList
    ? defectRows.filter((c) => hasField(c, "disposition") &&
        !DISPOSITIONS.includes(field(c, "disposition") as string))
        .map((c) => rowName(c, "defect_id"))
    : null;
  const acceptedDefectsWithoutNote: string[] | null = defectsIsList
    ? defectRows.filter((c) => hasField(c, "disposition") &&
        field(c, "disposition") === "accept_with_note" &&
        hasField(c, "disposition_note") &&
        !nonemptyStr(field(c, "disposition_note")))
        .map((c) => rowName(c, "defect_id"))
    : null;
  const deferredDefectsWithoutDate: string[] | null = defectsIsList
    ? defectRows.filter((c) => hasField(c, "disposition") &&
        field(c, "disposition") === "defer_with_date" &&
        hasField(c, "defer_until") &&
        !nonemptyStr(field(c, "defer_until")))
        .map((c) => rowName(c, "defect_id"))
    : null;
  const fixNowDefectsUnresolved: string[] | null = defectsIsList
    ? defectRows.filter((c) => hasField(c, "disposition") &&
        field(c, "disposition") === "fix_now" &&
        hasField(c, "resolved") && field(c, "resolved") !== true)
        .map((c) => rowName(c, "defect_id"))
    : null;
  const openBlockerDefectIds: string[] | null = defectsIsList
    ? defectRows.filter((c) => hasField(c, "severity") &&
        field(c, "severity") === "blocker" &&
        hasField(c, "resolved") && field(c, "resolved") !== true)
        .map((c) => rowName(c, "defect_id"))
    : null;

  const signOffsWithUnknownRole: string[] | null = soIsList && rolesIsList
    ? soRows.filter((c) => hasField(c, "role") &&
        !roleRows.includes(field(c, "role")))
        .map((c) => rowName(c, "role"))
    : null;
  const signOffsWithoutSigner: string[] | null = soIsList
    ? soRows.filter((c) => hasField(c, "signer_name") &&
        !nonemptyStr(field(c, "signer_name")))
        .map((c) => rowName(c, "role"))
    : null;
  const signOffsNotSigned: string[] | null = soIsList
    ? soRows.filter((c) => hasField(c, "signed") &&
        field(c, "signed") !== true)
        .map((c) => rowName(c, "role"))
    : null;
  const signedRoles: string[] = [];
  for (const c of soRows) {
    if (isPyDict(c) && typeof c["role"] === "string" && c["signed"] === true) {
      signedRoles.push(c["role"] as string);
    }
  }
  const requiredRolesUnsigned: string[] | null = rolesIsList && soIsList
    ? roleRows.filter((r): r is string =>
        typeof r === "string" && !signedRoles.includes(r))
    : null;

  const [critTotal, hasCritTotal] = getPath(manifest, "declared_totals", "acceptance_criteria_count");
  const [scenTotal, hasScenTotal] = getPath(manifest, "declared_totals", "scenarios_count");
  const [execTotal, hasExecTotal] = getPath(manifest, "declared_totals", "executed_scenarios_count");
  const [defectsTotal, hasDefectsTotal] = getPath(manifest, "declared_totals", "defects_count");
  const [rolesTotal, hasRolesTotal] = getPath(manifest, "declared_totals", "sign_off_roles_count");

  const criterionCoverageRatio: number | null =
    critIsList && scenIsList && critCount !== null && critCount > 0
      ? criterionIds.filter((cid) => coveredCriterionIds.includes(cid)).length / critCount
      : null;
  const scenarioExecutionRatio: number | null =
    scenIsList && scenCount !== null && scenCount > 0 && executedCount !== null
      ? executedCount / scenCount
      : null;
  const scenarioPassRatio: number | null =
    scenIsList && scenCount !== null && scenCount > 0
      ? scenRows.filter((c) => field(c, "result") === "passed").length / scenCount
      : null;
  const defectDispositionRatio: number | null =
    defectsIsList && defectsCount !== null && defectsCount > 0
      ? defectRows.filter((c) =>
          DISPOSITIONS.includes(field(c, "disposition") as string)).length / defectsCount
      : null;
  const signOffCompletionRatio: number | null =
    rolesIsList && soIsList && rolesCount !== null && rolesCount > 0
      ? roleRows.filter((r) => typeof r === "string" && signedRoles.includes(r)).length / rolesCount
      : null;

  // ---- Section 1: scope_and_criteria_mapping ----
  let S = "scope_and_criteria_mapping";
  boolCheck(results, S, "uat_scope_criteria_source_recorded", manifest,
    ["scope", "criteria_source_recorded"],
    "scope: the source of the acceptance criteria for this UAT round was recorded");
  boolCheck(results, S, "uat_scope_defined_before_execution", manifest,
    ["scope", "scope_defined_before_execution"],
    "scope: the UAT scope was defined before execution began");
  boolCheck(results, S, "uat_no_silent_scope_edits_during_round", manifest,
    ["scope", "no_silent_scope_edits_during_uat"],
    "scope / method: no silent scope edits were made mid-UAT");
  check(results, S, "uat_acceptance_criteria_list_declared", criteriaRaw,
    critIsList, critIsList && critCount !== null && critCount > 0,
    "criteria: the declared record names its acceptance-criterion rows — the list is present and names at least one criterion; an absent list is missing evidence and an empty list declares no criteria at all");
  const critIdPresent = critIsList &&
    critRows.every((c) => hasField(c, "criterion_id"));
  check(results, S, "every_uat_acceptance_criterion_id_unique", criteriaRaw,
    critIdPresent,
    critIsList && duplicateCriterionIds !== null && duplicateCriterionIds.length === 0,
    "criteria: no declared criterion_id is owned by more than one row");
  const descPresent = critIsList &&
    critRows.every((c) => hasField(c, "description"));
  check(results, S, "every_uat_acceptance_criterion_description_declared",
    criteriaRaw, descPresent,
    critIsList && critRows.every((c) => nonemptyStr(field(c, "description"))),
    "criteria: every declared criterion declares a non-empty description");
  check(results, S, "uat_scenarios_list_declared", scenariosRaw,
    scenIsList, scenIsList && scenCount !== null && scenCount > 0,
    "scenarios: the declared record names its UAT scenario rows — the list is present and names at least one scenario; an absent list is missing evidence and an empty list declares no scenarios at all");
  const scenIdPresent = scenIsList &&
    scenRows.every((c) => hasField(c, "scenario_id"));
  check(results, S, "every_uat_scenario_id_unique", scenariosRaw, scenIdPresent,
    scenIsList && duplicateScenarioIds !== null && duplicateScenarioIds.length === 0,
    "scenarios: no declared scenario_id is owned by more than one row");
  const critIdsPresent = scenIsList &&
    scenRows.every((c) => hasField(c, "criterion_ids"));
  check(results, S, "every_uat_scenario_covers_at_least_one_criterion",
    scenariosRaw, critIdsPresent,
    scenIsList && scenRows.every((c) => Array.isArray(field(c, "criterion_ids")) &&
      (field(c, "criterion_ids") as unknown[]).length > 0),
    "scenarios: every declared scenario names at least one acceptance criterion it covers");
  const refPresent = scenIsList && critIsList &&
    scenRows.every((c) => hasField(c, "criterion_ids"));
  check(results, S, "every_uat_scenario_criterion_reference_declared_criterion",
    scenariosRaw, refPresent,
    scenIsList && critIsList && scenRows.every((c) =>
      Array.isArray(field(c, "criterion_ids")) &&
      (field(c, "criterion_ids") as unknown[]).every(
        (cid) => criterionIds.includes(cid as string))),
    "scenarios: every criterion_id a declared scenario names is one of the declared acceptance criteria");
  const coverPresent = critIsList && scenIsList &&
    critRows.every((c) => hasField(c, "criterion_id"));
  check(results, S, "every_uat_acceptance_criterion_covered_by_scenario",
    criteriaRaw, coverPresent,
    coverPresent && uncoveredCriteria !== null && uncoveredCriteria.length === 0,
    "scope / quality gate: every acceptance criterion is mapped to at least one UAT scenario");
  check(results, S, "uat_declared_criteria_count_matches_rows",
    critTotal, hasCritTotal && critIsList,
    critIsList && critTotal === critCount,
    "declared totals: the declared acceptance-criteria count recomputes exactly against the declared criterion rows");
  check(results, S, "uat_declared_scenarios_count_matches_rows",
    scenTotal, hasScenTotal && scenIsList,
    scenIsList && scenTotal === scenCount,
    "declared totals: the declared scenarios count recomputes exactly against the declared scenario rows");

  // ---- Section 2: environment_people_and_scripts ----
  S = "environment_people_and_scripts";
  boolCheck(results, S, "uat_environment_staging_mirrors_production", manifest,
    ["environment", "staging_mirrors_production"],
    "environment: staging mirrors production for this UAT round");
  boolCheck(results, S, "uat_environment_test_data_realistic", manifest,
    ["environment", "test_data_realistic"],
    "environment: the UAT data used was realistic");
  gatedBoolCheck(results, S,
    "uat_production_data_anonymized_where_production_data_used", manifest,
    ["environment", "production_data_used"],
    ["environment", "test_data_anonymized"],
    "environment / red line: production data used in UAT was anonymized",
    "no production data use declared");
  boolCheck(results, S, "uat_business_owner_owns_round", manifest,
    ["people", "business_owner_owns_uat"],
    "people: the business owner owns this UAT round");
  boolCheck(results, S, "uat_business_owner_executes_round", manifest,
    ["people", "business_owner_executes_uat"],
    "people: the business owner executes this UAT round");
  boolCheck(results, S, "uat_supporting_team_assigned", manifest,
    ["people", "supporting_team_assigned"],
    "people: the supporting team was assigned to this UAT round");
  boolCheck(results, S, "uat_scribe_assigned", manifest,
    ["people", "scribe_assigned"],
    "people: one scribe was assigned to this UAT round");
  const stepsPresent = scenIsList &&
    scenRows.every((c) => hasField(c, "steps_recorded"));
  check(results, S, "every_uat_scenario_steps_recorded", scenariosRaw,
    stepsPresent,
    scenIsList && scenRows.every((c) => field(c, "steps_recorded") === true),
    "scripts: every declared scenario declares its steps recorded");
  const expectedPresent = scenIsList &&
    scenRows.every((c) => hasField(c, "expected_outcome"));
  check(results, S, "every_uat_scenario_expected_outcome_declared", scenariosRaw,
    expectedPresent,
    scenIsList && scenRows.every((c) => nonemptyStr(field(c, "expected_outcome"))),
    "scripts: every declared scenario declares a non-empty expected outcome");
  const timeboxedPresent = scenIsList &&
    scenRows.every((c) => hasField(c, "timeboxed"));
  check(results, S, "every_uat_scenario_timeboxed", scenariosRaw,
    timeboxedPresent,
    scenIsList && scenRows.every((c) => field(c, "timeboxed") === true),
    "scripts: every declared scenario is declared timeboxed");

  // ---- Section 3: execution_and_results ----
  S = "execution_and_results";
  boolCheck(results, S, "uat_round_execution_window_completed", manifest,
    ["execution", "execution_window_completed"],
    "execution: the UAT execution window for this round was completed");
  boolCheck(results, S, "uat_deviations_logged_as_defects", manifest,
    ["execution", "deviations_logged_as_defects"],
    "execution / method: deviations found in UAT were logged as defects");
  const resultPresent = scenIsList &&
    scenRows.every((c) => hasField(c, "result"));
  check(results, S, "every_uat_scenario_result_recognised", scenariosRaw,
    resultPresent,
    scenIsList && scenRows.every((c) =>
      RESULT_KINDS.includes(field(c, "result") as string)),
    "execution: every declared scenario's result is one of passed, failed, blocked, not_run");
  check(results, S, "every_uat_scenario_result_recorded_as_executed",
    scenariosRaw, resultPresent,
    scenIsList && scenRows.every((c) =>
      ["passed", "failed", "blocked"].includes(field(c, "result") as string)),
    "execution: every declared scenario is declared executed — its result is not not_run");
  check(results, S, "uat_declared_executed_scenarios_count_matches_rows",
    execTotal, hasExecTotal && scenIsList,
    scenIsList && execTotal === executedCount,
    "declared totals: the declared executed-scenarios count recomputes exactly against the declared scenario results");
  const fbPresent = scenIsList && defectsIsList &&
    scenRows.every((c) => hasField(c, "result") && hasField(c, "scenario_id"));
  check(results, S, "every_uat_failed_or_blocked_scenario_has_defect_record",
    scenariosRaw, fbPresent,
    fbPresent && failedOrBlockedWithoutDefect !== null &&
      failedOrBlockedWithoutDefect.length === 0,
    "execution: every failed or blocked declared scenario names at least one declared defect row");

  // ---- Section 4: defects_and_triage ----
  S = "defects_and_triage";
  check(results, S, "uat_defects_list_declared", defectsRaw,
    defectsIsList, defectsIsList,
    "defects: the declared record names its defect rows — the list is present; an empty list declares that the round found no defects, and an absent list is missing evidence");
  const defectIdPresent = defectsIsList &&
    defectRows.every((c) => hasField(c, "defect_id"));
  check(results, S, "every_uat_defect_id_unique", defectsRaw,
    defectsIsList ? defectIdPresent : false,
    defectsIsList && duplicateDefectIds !== null && duplicateDefectIds.length === 0,
    "defects: no declared defect_id is owned by more than one row");
  check(results, S, "every_uat_defect_scenario_reference_declared_scenario",
    defectsRaw,
    perRowPresent(defectsIsList && scenIsList, defectRows, ["scenario_id"]),
    defectsIsList && scenIsList && defectRows.every((c) =>
      scenarioIds.includes(field(c, "scenario_id") as string)),
    "defects: every declared defect names a scenario_id among the declared scenarios");
  check(results, S, "every_uat_defect_severity_declared", defectsRaw,
    perRowPresent(defectsIsList, defectRows, ["severity"]),
    defectsIsList && defectRows.every((c) => nonemptyStr(field(c, "severity"))),
    "defects / quality gate: every declared defect declares a non-empty severity — defects are classified");
  check(results, S, "every_uat_defect_disposition_recognised", defectsRaw,
    perRowPresent(defectsIsList, defectRows, ["disposition"]),
    defectsIsList && defectRows.every((c) =>
      DISPOSITIONS.includes(field(c, "disposition") as string)),
    "defects / quality gate: every declared defect's disposition is one of fix_now, accept_with_note, defer_with_date — the triage dispositions the skill names");
  check(results, S, "every_uat_accepted_defect_disposition_note_declared",
    defectsRaw,
    defectRows.some((c) => field(c, "disposition") === "accept_with_note")
      ? perRowPresent(defectsIsList, defectRows, ["disposition", "disposition_note"])
      : defectsIsList,
    defectsIsList && defectRows
      .filter((c) => field(c, "disposition") === "accept_with_note")
      .every((c) => nonemptyStr(field(c, "disposition_note"))),
    "defects: every defect dispositioned accept_with_note declares a non-empty disposition note");
  check(results, S, "every_uat_deferred_defect_disposition_date_declared",
    defectsRaw,
    defectRows.some((c) => field(c, "disposition") === "defer_with_date")
      ? perRowPresent(defectsIsList, defectRows, ["disposition", "defer_until"])
      : defectsIsList,
    defectsIsList && defectRows
      .filter((c) => field(c, "disposition") === "defer_with_date")
      .every((c) => nonemptyStr(field(c, "defer_until"))),
    "defects: every defect dispositioned defer_with_date declares a non-empty defer date");
  boolCheck(results, S, "uat_triage_held_daily_during_round", manifest,
    ["triage", "triage_held_daily"],
    "triage / method: defects were triaged daily during this UAT round");
  check(results, S, "uat_declared_defects_count_matches_rows",
    defectsTotal, hasDefectsTotal && defectsIsList,
    defectsIsList && defectsTotal === defectsCount,
    "declared totals: the declared defects count recomputes exactly against the declared defect rows");

  // ---- Section 5: sign_off_record ----
  S = "sign_off_record";
  check(results, S, "uat_sign_off_outcome_recognised", outcome,
    hasOutcome, hasOutcome && SIGN_OFF_OUTCOMES.includes(outcome as string),
    "sign-off / quality gate: the declared sign-off outcome is one of pass, conditional_pass — the explicit outcomes the skill names; sign-off is an artifact, not a vibe");
  check(results, S, "uat_sign_off_required_roles_list_declared", rolesRaw,
    rolesIsList, rolesIsList && rolesCount !== null && rolesCount > 0,
    "sign-off: the declared record names its required sign-off roles — the list is present and names at least one role; an absent list is missing evidence and an empty list declares no required sign-off at all");
  check(results, S, "every_uat_required_sign_off_role_unique", rolesRaw,
    rolesIsList,
    rolesIsList && duplicateRequiredRoles !== null && duplicateRequiredRoles.length === 0,
    "sign-off: no declared required role is named more than once");
  check(results, S, "uat_sign_offs_list_declared", signOffsRaw,
    soIsList, soIsList && soCount !== null && soCount > 0,
    "sign-off: the declared record names its sign-off rows — the list is present and names at least one sign-off; an absent list is missing evidence and an empty list declares no sign-off recorded at all");
  const soRolePresent = soIsList &&
    soRows.every((c) => hasField(c, "role"));
  check(results, S, "every_uat_sign_off_role_declared_required", signOffsRaw,
    soRolePresent && rolesIsList,
    soIsList && rolesIsList && soRows.every((c) =>
      roleRows.includes(field(c, "role"))),
    "sign-off: every declared sign-off row names a role among the declared required sign-off roles");
  check(results, S, "every_uat_required_role_signed_off", rolesRaw,
    rolesIsList && soIsList,
    rolesIsList && soIsList && requiredRolesUnsigned !== null &&
      requiredRolesUnsigned.length === 0,
    "sign-off / quality gate: every declared required role has a sign-off row declared signed");
  const signerPresent = soIsList &&
    soRows.every((c) => hasField(c, "signer_name"));
  check(results, S, "every_uat_sign_off_signer_named", signOffsRaw,
    signerPresent,
    soIsList && soRows.every((c) => nonemptyStr(field(c, "signer_name"))),
    "sign-off: every declared sign-off row names its signer — a sign-off is by a named role-holder, never granted by this atom");
  const signedPresent = soIsList &&
    soRows.every((c) => hasField(c, "signed"));
  check(results, S, "every_uat_sign_off_marked_signed", signOffsRaw,
    signedPresent,
    soIsList && soRows.every((c) => field(c, "signed") === true),
    "sign-off: every declared sign-off row is declared signed");
  conditionalCheck(results, S,
    "uat_conditional_sign_off_open_items_listed_where_conditional", manifest,
    ["sign_off", "conditional_open_items_listed"],
    "sign-off: a conditional pass lists its open items",
    "no conditional pass declared");
  conditionalCheck(results, S,
    "uat_conditional_sign_off_owner_named_where_conditional", manifest,
    ["sign_off", "conditional_owner_named"],
    "sign-off / quality gate: a conditional pass names an owner for its open items",
    "no conditional pass declared");
  const blockerPresent = hasOutcome && defectsIsList &&
    defectRows.every((c) => hasField(c, "severity") && hasField(c, "resolved"));
  check(results, S, "uat_sign_off_not_pass_while_blocker_defect_open",
    outcome, blockerPresent,
    blockerPresent && !(outcome === "pass" && openBlockerDefectIds !== null &&
      openBlockerDefectIds.length > 0),
    "sign-off / red line: a declared pass outcome does not stand while a defect declaring severity blocker is not declared resolved");
  check(results, S, "uat_declared_sign_off_roles_count_matches_required_roles",
    rolesTotal, hasRolesTotal && rolesIsList,
    rolesIsList && rolesTotal === rolesCount,
    "declared totals: the declared sign-off roles count recomputes exactly against the declared required sign-off roles");

  // ---- Section 6: retest_and_regression_after_fixes ----
  S = "retest_and_regression_after_fixes";
  gatedBoolCheck(results, S, "uat_changed_scenarios_retested_where_fixes_made",
    manifest, ["retest", "uat_fixes_made"],
    ["retest", "changed_scenarios_retested"],
    "re-test / quality gate: changed scenarios were re-tested after UAT fixes",
    "no UAT fixes declared made");
  gatedBoolCheck(results, S,
    "uat_touched_flows_regression_completed_where_fixes_made",
    manifest, ["retest", "uat_fixes_made"],
    ["retest", "touched_flows_regression_completed"],
    "regression / quality gate: regression on touched flows was completed after UAT fixes",
    "no UAT fixes declared made");
  gatedBoolCheck(results, S, "uat_retest_results_recorded_where_fixes_made",
    manifest, ["retest", "uat_fixes_made"],
    ["retest", "retest_results_recorded"],
    "re-test: the re-test results after UAT fixes were recorded",
    "no UAT fixes declared made");
  check(results, S, "every_uat_fix_now_defect_marked_resolved", defectsRaw,
    defectRows.some((c) => field(c, "disposition") === "fix_now")
      ? perRowPresent(defectsIsList, defectRows, ["disposition", "resolved"])
      : defectsIsList,
    defectsIsList && defectRows
      .filter((c) => field(c, "disposition") === "fix_now")
      .every((c) => field(c, "resolved") === true),
    "re-test: every defect dispositioned fix_now is declared resolved");

  // ---- Section 7: red_lines ----
  S = "red_lines";
  falseCheck(results, S, "uat_free_of_production_data_without_anonymization",
    manifest,
    ["red_lines", "production_data_used_without_anonymization_present"],
    "red line: no UAT on production data without anonymization is present in the record");
  falseCheck(results, S, "uat_free_of_passed_while_blockers_open", manifest,
    ["red_lines", "passed_while_blocker_defects_open_present"],
    "red line: no passed outcome while blockers are open is present in the record");

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
    verdict = "UAT_SIGN_OFF_NOT_SOUND";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "UAT_SIGN_OFF_SOUND";
  }

  const computedNames = [
    "uat_acceptance_criteria_list_declared",
    "every_uat_acceptance_criterion_id_unique",
    "every_uat_acceptance_criterion_description_declared",
    "uat_scenarios_list_declared",
    "every_uat_scenario_id_unique",
    "every_uat_scenario_covers_at_least_one_criterion",
    "every_uat_scenario_criterion_reference_declared_criterion",
    "every_uat_acceptance_criterion_covered_by_scenario",
    "uat_declared_criteria_count_matches_rows",
    "uat_declared_scenarios_count_matches_rows",
    "every_uat_scenario_steps_recorded",
    "every_uat_scenario_expected_outcome_declared",
    "every_uat_scenario_timeboxed",
    "every_uat_scenario_result_recognised",
    "every_uat_scenario_result_recorded_as_executed",
    "uat_declared_executed_scenarios_count_matches_rows",
    "every_uat_failed_or_blocked_scenario_has_defect_record",
    "uat_defects_list_declared",
    "every_uat_defect_id_unique",
    "every_uat_defect_scenario_reference_declared_scenario",
    "every_uat_defect_severity_declared",
    "every_uat_defect_disposition_recognised",
    "every_uat_accepted_defect_disposition_note_declared",
    "every_uat_deferred_defect_disposition_date_declared",
    "uat_declared_defects_count_matches_rows",
    "uat_sign_off_outcome_recognised",
    "uat_sign_off_required_roles_list_declared",
    "every_uat_required_sign_off_role_unique",
    "uat_sign_offs_list_declared",
    "every_uat_sign_off_role_declared_required",
    "every_uat_required_role_signed_off",
    "every_uat_sign_off_signer_named",
    "every_uat_sign_off_marked_signed",
    "uat_sign_off_not_pass_while_blocker_defect_open",
    "uat_declared_sign_off_roles_count_matches_required_roles",
    "every_uat_fix_now_defect_marked_resolved",
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
    service: "uat-scenario-sign-off-pack",
    atom_version: "0.1.0",
    uat_round_title: manifest["uat_round_title"] ?? null,
    verdict,
    sections,
    checks: results,
    computed_status: computedStatus,
    uat_acceptance_criteria_count: critCount,
    uat_scenarios_count: scenCount,
    uat_executed_scenarios_count: executedCount,
    uat_defects_count: defectsCount,
    uat_sign_offs_count: soCount,
    uat_required_sign_off_roles_count: rolesCount,
    duplicate_uat_criterion_ids: duplicateCriterionIds,
    duplicate_uat_scenario_ids: duplicateScenarioIds,
    duplicate_uat_defect_ids: duplicateDefectIds,
    duplicate_uat_required_sign_off_roles: duplicateRequiredRoles,
    duplicate_uat_sign_off_roles: duplicateSignOffRoles,
    uat_criteria_without_description: criteriaWithoutDescription,
    uat_criteria_not_covered_by_any_scenario: uncoveredCriteria,
    uat_scenarios_without_criterion_reference: scenariosWithoutCriterion,
    uat_scenarios_with_unknown_criterion_reference: scenariosWithUnknownCriterion,
    uat_scenarios_without_steps_recorded: scenariosWithoutSteps,
    uat_scenarios_without_expected_outcome: scenariosWithoutExpected,
    uat_scenarios_not_timeboxed: scenariosNotTimeboxed,
    uat_scenarios_with_invalid_result: scenariosWithInvalidResult,
    uat_scenarios_not_executed: scenariosNotExecuted,
    uat_failed_or_blocked_scenarios_without_defect: failedOrBlockedWithoutDefect,
    uat_defects_with_unknown_scenario_reference: defectsWithUnknownScenario,
    uat_defects_without_severity: defectsWithoutSeverity,
    uat_defects_with_invalid_disposition: defectsWithInvalidDisposition,
    uat_accepted_defects_without_note: acceptedDefectsWithoutNote,
    uat_deferred_defects_without_date: deferredDefectsWithoutDate,
    uat_fix_now_defects_unresolved: fixNowDefectsUnresolved,
    uat_open_blocker_defect_ids: openBlockerDefectIds,
    uat_sign_offs_with_unknown_role: signOffsWithUnknownRole,
    uat_sign_offs_without_signer_name: signOffsWithoutSigner,
    uat_sign_offs_not_signed: signOffsNotSigned,
    uat_required_roles_without_signed_sign_off: requiredRolesUnsigned,
    uat_criterion_coverage_ratio: fmt6(criterionCoverageRatio),
    uat_scenario_execution_ratio: fmt6(scenarioExecutionRatio),
    uat_scenario_pass_ratio: fmt6(scenarioPassRatio),
    uat_defect_disposition_ratio: fmt6(defectDispositionRatio),
    uat_sign_off_completion_ratio: fmt6(signOffCompletionRatio),
    summary:
      `${count("pass")} pass, ` +
      `${count("fail")} fail, ` +
      `${count("missing")} missing ` +
      `of ${results.length} checks across seven sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "UAT SCENARIO SIGN-OFF PACK",
    `uat_round_title: ${pyStr(verdict.uat_round_title ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(44)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
