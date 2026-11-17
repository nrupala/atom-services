// POC design kill criteria verdict — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/poc-design-kill-criteria-verdict/src/poc_design_kill_criteria_verdict.py
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
  poc: "string",
  design: {
    uncertainty_to_reduce_named: "boolean",
    answer_changes_plan_declared: "boolean",
    uncertainty_reduction_purpose_declared: "boolean",
    design_record_completed_before_run: "boolean",
    evaluates_vendor_or_tool: "boolean",
  },
  criteria: [{
    name: "string",
    kind: "string",
    condition_stated: "boolean",
    declared_before_run: "boolean",
    assesses_house_stack_fit: "boolean",
  }],
  timebox: {
    window_set_before_run: "boolean",
    start_date: "string",
    end_date: "string",
  },
  scope_items: [{
    name: "string",
    on_critical_path: "boolean",
  }],
  red_lines: {
    poc_code_planned_for_direct_production_use_present: "boolean",
    open_ended_design_present: "boolean",
    poc_success_planned_as_production_readiness_present: "boolean",
  },
};

export const SECTIONS = [
  "design_premise",
  "criteria_row_consistency",
  "timebox_window",
  "scope_row_consistency",
  "production_boundary_by_design",
] as const;

const STATED_KINDS = ["success", "kill"];

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
  poc: unknown;
  verdict: string;
  sections: Record<string, string>;
  checks: CheckResult[];
  computed_status: string | null;
  criteria_count: number | null;
  success_criteria_count: number | null;
  kill_criteria_count: number | null;
  criteria_without_condition: string[] | null;
  condition_stated_coverage: string | null;
  criteria_not_declared_before_run: string[] | null;
  declared_before_run_coverage: string | null;
  criteria_with_invalid_kind: string[] | null;
  duplicate_criterion_names: string[] | null;
  timebox_start_date: unknown;
  timebox_end_date: unknown;
  timebox_duration_days: number | null;
  scope_items_count: number | null;
  scope_items_off_critical_path: string[] | null;
  critical_path_coverage: string | null;
  duplicate_scope_item_names: string[] | null;
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

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function daysInMonth(year: number, month: number): number {
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  return [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];
}

function daysFromCivil(y: number, m: number, d: number): number {
  const yy = m <= 2 ? y - 1 : y;
  const era = Math.floor(yy / 400);
  const yoe = yy - era * 400;
  const mp = (m + 9) % 12;
  const doy = Math.floor((153 * mp + 2) / 5) + d - 1;
  const doe = yoe * 365 + Math.floor(yoe / 4) - Math.floor(yoe / 100) + doy;
  return era * 146097 + doe;
}

// Strict ISO YYYY-MM-DD -> day number, or null if not a real date
// (proleptic Gregorian, year >= 1 — identical to Python date()).
function parseDate(value: unknown): number | null {
  if (typeof value !== "string" || !DATE_RE.test(value)) return null;
  const y = Number(value.slice(0, 4));
  const m = Number(value.slice(5, 7));
  const d = Number(value.slice(8, 10));
  if (y < 1 || m < 1 || m > 12 || d < 1 || d > daysInMonth(y, m)) {
    return null;
  }
  return daysFromCivil(y, m, d);
}

function duplicates(rows: unknown[]): string[] {
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
}

export function evaluate(manifest: unknown): Verdict {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateManifest(manifest, MANIFEST_SPEC);
  const results: CheckResult[] = [];

  const [criteriaRaw, hasCriteria] = getPath(manifest, "criteria");
  const criteriaIsList = hasCriteria && Array.isArray(criteriaRaw);
  const crows: unknown[] = criteriaIsList ? (criteriaRaw as unknown[]) : [];
  const criteriaCount: number | null = criteriaIsList ? crows.length : null;

  const [scopeRaw, hasScope] = getPath(manifest, "scope_items");
  const scopeIsList = hasScope && Array.isArray(scopeRaw);
  const srows: unknown[] = scopeIsList ? (scopeRaw as unknown[]) : [];
  const scopeCount: number | null = scopeIsList ? srows.length : null;

  const successCriteriaCount: number | null = criteriaIsList
    ? crows.filter((c) => isPyDict(c) && c["kind"] === "success").length
    : null;
  const killCriteriaCount: number | null = criteriaIsList
    ? crows.filter((c) => isPyDict(c) && c["kind"] === "kill").length
    : null;
  const criteriaWithoutCondition: string[] | null = criteriaIsList
    ? crows.filter((c) => hasField(c, "condition_stated") &&
        (c as Record<string, unknown>)["condition_stated"] !== true)
        .map(rowName)
    : null;
  const criteriaNotDeclaredBeforeRun: string[] | null = criteriaIsList
    ? crows.filter((c) => hasField(c, "declared_before_run") &&
        (c as Record<string, unknown>)["declared_before_run"] !== true)
        .map(rowName)
    : null;
  const criteriaWithInvalidKind: string[] | null = criteriaIsList
    ? crows.filter((c) => hasField(c, "kind") &&
        !STATED_KINDS.includes(
          (c as Record<string, unknown>)["kind"] as string))
        .map(rowName)
    : null;
  const duplicateCriterionNames: string[] | null = criteriaIsList
    ? duplicates(crows)
    : null;
  const conditionStatedCoverage: number | null =
    criteriaIsList && criteriaCount !== null && criteriaCount > 0
      ? crows.filter((c) => isPyDict(c) &&
          c["condition_stated"] === true).length / criteriaCount
      : null;
  const declaredBeforeRunCoverage: number | null =
    criteriaIsList && criteriaCount !== null && criteriaCount > 0
      ? crows.filter((c) => isPyDict(c) &&
          c["declared_before_run"] === true).length / criteriaCount
      : null;

  const scopeItemsOffCriticalPath: string[] | null = scopeIsList
    ? srows.filter((c) => hasField(c, "on_critical_path") &&
        (c as Record<string, unknown>)["on_critical_path"] !== true)
        .map(rowName)
    : null;
  const duplicateScopeItemNames: string[] | null = scopeIsList
    ? duplicates(srows)
    : null;
  const criticalPathCoverage: number | null =
    scopeIsList && scopeCount !== null && scopeCount > 0
      ? srows.filter((c) => isPyDict(c) &&
          c["on_critical_path"] === true).length / scopeCount
      : null;

  const [startRaw, hasStart] = getPath(manifest, "timebox", "start_date");
  const [endRaw, hasEnd] = getPath(manifest, "timebox", "end_date");
  const startDate = hasStart ? parseDate(startRaw) : null;
  const endDate = hasEnd ? parseDate(endRaw) : null;
  const bothDatesValid = startDate !== null && endDate !== null;
  const timeboxDurationDays: number | null = bothDatesValid
    ? (endDate as number) - (startDate as number)
    : null;

  // ---- Section 1: design_premise ----
  boolCheck(results, "design_premise",
    "uncertainty_to_reduce_named", manifest,
    ["design", "uncertainty_to_reduce_named"],
    "design premise: the uncertainty the POC exists to reduce is named in the design");
  boolCheck(results, "design_premise",
    "answer_changes_plan_declared", manifest,
    ["design", "answer_changes_plan_declared"],
    "design premise: the design declares that the answer changes the plan — the question is worth asking before building");
  boolCheck(results, "design_premise",
    "uncertainty_reduction_purpose_declared", manifest,
    ["design", "uncertainty_reduction_purpose_declared"],
    "design premise: the stated purpose is reducing uncertainty, not shipping");
  boolCheck(results, "design_premise",
    "design_record_completed_before_run", manifest,
    ["design", "design_record_completed_before_run"],
    "design premise: this design record is completed before the run — the question, criteria and timebox are defined before writing code");

  // ---- Section 2: criteria_row_consistency ----
  const [gateValue, gatePresent] = getPath(
    manifest, "design", "evaluates_vendor_or_tool");
  check(results, "criteria_row_consistency",
    "vendor_evaluation_applicability_declared", gateValue, gatePresent,
    true,
    "criteria rows: whether the POC evaluates a vendor or tool is declared — the house-stack-fit check applies only when it does");
  check(results, "criteria_row_consistency",
    "criteria_declared", criteriaRaw, criteriaIsList,
    criteriaIsList && (criteriaCount as number) > 0,
    "the declared design names its criteria — the criteria list is present and non-empty");
  const kindPresent = criteriaIsList &&
    crows.every((c) => hasField(c, "kind"));
  check(results, "criteria_row_consistency",
    "every_criterion_kind_is_success_or_kill", criteriaRaw, kindPresent,
    criteriaIsList && (criteriaCount as number) > 0 &&
      crows.every((c) => isPyDict(c) &&
        STATED_KINDS.includes(c["kind"] as string)),
    "criteria rows: every declared criterion row is one of the two kinds the skill names — success or kill");
  check(results, "criteria_row_consistency",
    "at_least_one_success_criterion_declared", criteriaRaw, kindPresent,
    criteriaIsList && successCriteriaCount !== null &&
      successCriteriaCount > 0,
    "criteria rows: at least one declared row is a success criterion — success AND kill criteria");
  check(results, "criteria_row_consistency",
    "at_least_one_kill_criterion_declared", criteriaRaw, kindPresent,
    criteriaIsList && killCriteriaCount !== null && killCriteriaCount > 0,
    "criteria rows: at least one declared row is a kill criterion — success AND kill criteria");
  const condPresent = criteriaIsList &&
    crows.every((c) => hasField(c, "condition_stated"));
  check(results, "criteria_row_consistency",
    "every_criterion_condition_stated", criteriaRaw, condPresent,
    criteriaIsList && (criteriaCount as number) > 0 &&
      crows.every((c) => isPyDict(c) && c["condition_stated"] === true),
    "criteria rows: every declared criterion row states the condition that satisfies it — the success bar or kill trigger is written, not implied");
  const beforePresent = criteriaIsList &&
    crows.every((c) => hasField(c, "declared_before_run"));
  check(results, "criteria_row_consistency",
    "every_criterion_declared_before_run", criteriaRaw, beforePresent,
    criteriaIsList && (criteriaCount as number) > 0 &&
      crows.every((c) => isPyDict(c) && c["declared_before_run"] === true),
    "criteria rows: every declared criterion row is itself declared before the run — no criterion is added after the fact");
  const namePresent = criteriaIsList &&
    crows.every((c) => hasField(c, "name"));
  check(results, "criteria_row_consistency",
    "no_criterion_name_duplicated", criteriaRaw, namePresent,
    criteriaIsList && duplicateCriterionNames !== null &&
      duplicateCriterionNames.length === 0,
    "criteria rows: no declared criterion name is owned by more than one criterion row");
  const houseFitPresent = gatePresent && criteriaIsList;
  const houseFitOk = gatePresent && gateValue === false
    ? true
    : criteriaIsList && crows.some((c) => isPyDict(c) &&
        c["assesses_house_stack_fit"] === true);
  check(results, "criteria_row_consistency",
    "house_stack_fit_criterion_when_evaluating_vendor", criteriaRaw,
    houseFitPresent, houseFitOk,
    "criteria rows: when the POC evaluates a vendor or tool, at least one criterion row assesses fit against the house stack");

  // ---- Section 3: timebox_window ----
  boolCheck(results, "timebox_window",
    "timebox_window_set_before_run", manifest,
    ["timebox", "window_set_before_run"],
    "timebox window: the window is set before the run — the timebox is defined upfront, not discovered during the run");
  const bothPresent = hasStart && hasEnd;
  check(results, "timebox_window",
    "timebox_window_dates_valid", startRaw, bothPresent, bothDatesValid,
    "timebox window: the declared start and end dates are real calendar dates in strict ISO form");
  check(results, "timebox_window",
    "timebox_end_after_start", endRaw, bothPresent,
    bothDatesValid && (endDate as number) > (startDate as number),
    "timebox window: the declared end date falls after the declared start date — the window has a positive length; its length itself is not judged");

  // ---- Section 4: scope_row_consistency ----
  check(results, "scope_row_consistency",
    "scope_items_declared", scopeRaw, scopeIsList,
    scopeIsList && (scopeCount as number) > 0,
    "the declared design names its scope — the scope items list is present and non-empty");
  const pathPresent = scopeIsList &&
    srows.every((c) => hasField(c, "on_critical_path"));
  check(results, "scope_row_consistency",
    "every_scope_item_on_critical_path", scopeRaw, pathPresent,
    scopeIsList && (scopeCount as number) > 0 &&
      srows.every((c) => isPyDict(c) && c["on_critical_path"] === true),
    "scope rows: every declared scope item is on the critical path — scope is the critical path, nothing more");
  const snamePresent = scopeIsList &&
    srows.every((c) => hasField(c, "name"));
  check(results, "scope_row_consistency",
    "no_scope_item_name_duplicated", scopeRaw, snamePresent,
    scopeIsList && duplicateScopeItemNames !== null &&
      duplicateScopeItemNames.length === 0,
    "scope rows: no declared scope name is owned by more than one scope item");

  // ---- Section 5: production_boundary_by_design ----
  falseCheck(results, "production_boundary_by_design",
    "no_poc_code_planned_for_direct_production_use", manifest,
    ["red_lines", "poc_code_planned_for_direct_production_use_present"],
    "red line by design: the design does not plan for POC code to be used directly in production — no POC-to-production gradient is designed in");
  falseCheck(results, "production_boundary_by_design",
    "no_open_ended_design", manifest,
    ["red_lines", "open_ended_design_present"],
    "red line by design: the design is not open-ended — no unbounded POC is designed in");
  falseCheck(results, "production_boundary_by_design",
    "no_poc_success_planned_as_production_readiness", manifest,
    ["red_lines", "poc_success_planned_as_production_readiness_present"],
    "red line by design: the design does not plan to treat POC success as production readiness — 'it worked in the POC' is never production evidence");

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
    verdict = "POC_DESIGN_NOT_SOUND";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "POC_DESIGN_SOUND";
  }

  const computedNames = [
    "criteria_declared",
    "every_criterion_kind_is_success_or_kill",
    "at_least_one_success_criterion_declared",
    "at_least_one_kill_criterion_declared",
    "every_criterion_condition_stated",
    "every_criterion_declared_before_run",
    "no_criterion_name_duplicated",
    "house_stack_fit_criterion_when_evaluating_vendor",
    "timebox_window_dates_valid",
    "timebox_end_after_start",
    "scope_items_declared",
    "every_scope_item_on_critical_path",
    "no_scope_item_name_duplicated",
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
    service: "poc-design-kill-criteria-verdict",
    atom_version: "0.1.0",
    poc: manifest["poc"] ?? null,
    verdict,
    sections,
    checks: results,
    computed_status: computedStatus,
    criteria_count: criteriaCount,
    success_criteria_count: successCriteriaCount,
    kill_criteria_count: killCriteriaCount,
    criteria_without_condition: criteriaWithoutCondition,
    condition_stated_coverage: fmt6(conditionStatedCoverage),
    criteria_not_declared_before_run: criteriaNotDeclaredBeforeRun,
    declared_before_run_coverage: fmt6(declaredBeforeRunCoverage),
    criteria_with_invalid_kind: criteriaWithInvalidKind,
    duplicate_criterion_names: duplicateCriterionNames,
    timebox_start_date: hasStart ? startRaw : null,
    timebox_end_date: hasEnd ? endRaw : null,
    timebox_duration_days: timeboxDurationDays,
    scope_items_count: scopeCount,
    scope_items_off_critical_path: scopeItemsOffCriticalPath,
    critical_path_coverage: fmt6(criticalPathCoverage),
    duplicate_scope_item_names: duplicateScopeItemNames,
    summary:
      `${count("pass")} pass, ` +
      `${count("fail")} fail, ` +
      `${count("missing")} missing ` +
      `of ${results.length} checks across five sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "POC DESIGN KILL CRITERIA VERDICT",
    `poc: ${pyStr(verdict.poc ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(32)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
