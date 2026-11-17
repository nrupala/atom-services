// Quant math derivation sanity check — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/quant-math-derivation-sanity-check/src/quant_math_derivation_sanity_check.py
// (evaluate() + stamp()). No logic changes: every verdict, section
// outcome, per-check status, evidence string, computed field and
// the summary string are byte-identical to the Python output for
// the same input. Computed ratios use the shared fixed
// serialization: round half up to 6dp —
// floor(v * 1000000 + 0.5) / 1000000 — then format with exactly six
// decimals; arithmetic and final-result comparisons are made on
// those 6dp serializations of the recomputed and declared values.

import { pyStr } from "./release-readiness.js";
import { validateManifest, type FieldSpec } from "./validate.js";

const MANIFEST_SPEC: { [field: string]: FieldSpec } = {
  derivation_title: "string",
  derivation: {
    goal_quantity_stated: "boolean",
    givens_defined_before_use: "boolean",
    shown_step_by_step: "boolean",
    final_result_value: "number",
    final_result_unit: "string",
  },
  steps: [{
    step_id: "string",
    operation: "string",
    operand_a: "number",
    operand_b: "number",
    declared_result: "number",
    operand_a_unit: "string",
    operand_b_unit: "string",
    declared_result_unit: "string",
  }],
  dimensions: {
    dimensions_checked: "boolean",
    units_checked: "boolean",
    unit_conversions_shown_where_needed: "boolean",
  },
  assumptions: {
    assumptions_listed: "boolean",
    normality_checked_where_assumed: "boolean",
    independence_checked_where_assumed: "boolean",
    stationarity_checked_where_assumed: "boolean",
    failure_modes_named: "boolean",
    domain_restrictions_stated: "boolean",
  },
  method: {
    method_named: "boolean",
    simplest_method_that_fits_chosen: "boolean",
    method_choice_justified_from_problem_structure: "boolean",
    small_numerical_example_verified: "boolean",
  },
  red_lines: {
    black_box_trust_without_derivation_present: "boolean",
    assumptions_ignored_present: "boolean",
    correlation_presented_as_causation_present: "boolean",
    p_hacking_present: "boolean",
    overfitting_present: "boolean",
  },
};

export const SECTIONS = [
  "derivation_structure",
  "step_arithmetic",
  "dimensions_and_units",
  "assumptions_and_failure_modes",
  "method_choice_and_verification",
  "red_lines",
] as const;

const OPERATIONS = ["add", "subtract", "multiply", "divide"];

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
  derivation_title: unknown;
  verdict: string;
  sections: Record<string, string>;
  checks: CheckResult[];
  computed_status: string | null;
  derivation_steps_count: number | null;
  duplicate_derivation_step_ids: string[] | null;
  derivation_steps_with_arithmetic_mismatch: string[] | null;
  derivation_steps_with_unit_mismatch: string[] | null;
  derivation_steps_missing_units: string[] | null;
  arithmetic_match_ratio: string | null;
  unit_match_ratio: string | null;
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

function isNumber(value: unknown): value is number {
  return typeof value === "number";
}

function valuesMatch(a: unknown, b: unknown): boolean {
  if (!isNumber(a) || !isNumber(b)) return false;
  if (Number.isFinite(a) && Number.isFinite(b)) {
    return fmt6(a) === fmt6(b);
  }
  return a === b;
}

function rowName(entry: unknown): string {
  if (isPyDict(entry) && typeof entry["step_id"] === "string") {
    return entry["step_id"] as string;
  }
  return "unnamed";
}

function nonemptyStr(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function recompute(entry: Record<string, unknown>): number | null {
  const op = entry["operation"];
  const a = entry["operand_a"] as number;
  const b = entry["operand_b"] as number;
  if (op === "add") return a + b;
  if (op === "subtract") return a - b;
  if (op === "multiply") return a * b;
  if (op === "divide") {
    if (b === 0) return null;
    return a / b;
  }
  return null;
}

function expectedResultUnit(entry: Record<string, unknown>): string | null {
  const op = entry["operation"];
  const aUnit = entry["operand_a_unit"] as string;
  const bUnit = entry["operand_b_unit"] as string;
  if (op === "add" || op === "subtract") {
    return aUnit === bUnit ? aUnit : null;
  }
  if (op === "multiply") {
    if (aUnit === "1") return bUnit;
    if (bUnit === "1") return aUnit;
    return `${aUnit}*${bUnit}`;
  }
  if (op === "divide") {
    if (bUnit === "1") return aUnit;
    if (aUnit === bUnit) return "1";
    if (aUnit === "1") return `1/${bUnit}`;
    return `${aUnit}/${bUnit}`;
  }
  return null;
}

function stepCompleteForArithmetic(entry: unknown): boolean {
  return isPyDict(entry) &&
    hasField(entry, "operation") && hasField(entry, "operand_a") &&
    hasField(entry, "operand_b") && hasField(entry, "declared_result") &&
    isNumber(entry["operand_a"]) && isNumber(entry["operand_b"]) &&
    isNumber(entry["declared_result"]);
}

function stepCompleteForUnits(entry: unknown): boolean {
  return isPyDict(entry) &&
    hasField(entry, "operation") &&
    nonemptyStr(entry["operand_a_unit"]) &&
    nonemptyStr(entry["operand_b_unit"]) &&
    nonemptyStr(entry["declared_result_unit"]);
}

function stepArithmeticMatches(entry: unknown): boolean {
  if (!stepCompleteForArithmetic(entry)) return false;
  const recomputed = recompute(entry as Record<string, unknown>);
  if (recomputed === null) return false;
  return valuesMatch(recomputed,
    (entry as Record<string, unknown>)["declared_result"]);
}

function stepUnitMatches(entry: unknown): boolean {
  if (!stepCompleteForUnits(entry)) return false;
  const expected = expectedResultUnit(entry as Record<string, unknown>);
  if (expected === null) return false;
  return (entry as Record<string, unknown>)["declared_result_unit"] === expected;
}

export function evaluate(manifest: unknown): Verdict {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateManifest(manifest, MANIFEST_SPEC);
  const results: CheckResult[] = [];

  const [stepsRaw, hasSteps] = getPath(manifest, "steps");
  const stepsIsList = hasSteps && Array.isArray(stepsRaw);
  const rows: unknown[] = stepsIsList ? (stepsRaw as unknown[]) : [];
  const stepsCount: number | null = stepsIsList ? rows.length : null;

  let duplicateStepIds: string[] | null = null;
  if (stepsIsList) {
    const seen: string[] = [];
    duplicateStepIds = [];
    for (const c of rows) {
      if (isPyDict(c) && typeof c["step_id"] === "string") {
        const nm = c["step_id"] as string;
        if (seen.includes(nm) && !duplicateStepIds.includes(nm)) {
          duplicateStepIds.push(nm);
        }
        seen.push(nm);
      }
    }
  }
  const stepsWithArithmeticMismatch: string[] | null = stepsIsList
    ? rows.filter((c) => stepCompleteForArithmetic(c) &&
        !stepArithmeticMatches(c)).map(rowName)
    : null;
  const stepsWithUnitMismatch: string[] | null = stepsIsList
    ? rows.filter((c) => stepCompleteForUnits(c) &&
        !stepUnitMatches(c)).map(rowName)
    : null;
  const stepsMissingUnits: string[] | null = stepsIsList
    ? rows.filter((c) => !stepCompleteForUnits(c)).map(rowName)
    : null;
  const arithmeticMatchRatio: number | null =
    stepsIsList && stepsCount !== null && stepsCount > 0
      ? rows.filter((c) => stepArithmeticMatches(c)).length / stepsCount
      : null;
  const unitMatchRatio: number | null =
    stepsIsList && stepsCount !== null && stepsCount > 0
      ? rows.filter((c) => stepUnitMatches(c)).length / stepsCount
      : null;

  // ---- Section 1: derivation_structure ----
  boolCheck(results, "derivation_structure",
    "derivation_goal_quantity_stated", manifest,
    ["derivation", "goal_quantity_stated"],
    "derivation: the goal quantity the derivation derives is stated");
  boolCheck(results, "derivation_structure",
    "derivation_givens_defined_before_use", manifest,
    ["derivation", "givens_defined_before_use"],
    "derivation: every given quantity is defined before it is used");
  boolCheck(results, "derivation_structure",
    "derivation_shown_step_by_step", manifest,
    ["derivation", "shown_step_by_step"],
    "derivation: the derivation is shown step by step, not asserted as a black-box result");
  const [finalValue, hasFinalValue] = getPath(manifest,
    "derivation", "final_result_value");
  const lastStep: unknown = stepsIsList && rows.length > 0
    ? rows[rows.length - 1] : null;
  const finalValuePresent = stepsIsList && rows.length > 0 &&
    hasFinalValue && hasField(lastStep, "declared_result");
  check(results, "derivation_structure",
    "derivation_final_result_value_matches_last_step", finalValue,
    finalValuePresent,
    finalValuePresent &&
      valuesMatch(finalValue,
        (lastStep as Record<string, unknown>)["declared_result"]),
    "derivation: the declared final result value equals the last declared step's declared result value");
  const [finalUnit, hasFinalUnitRaw] = getPath(manifest,
    "derivation", "final_result_unit");
  void hasFinalUnitRaw;
  const finalUnitPresent = stepsIsList && rows.length > 0 &&
    nonemptyStr(finalUnit) &&
    nonemptyStr(isPyDict(lastStep) ? lastStep["declared_result_unit"] : null);
  check(results, "derivation_structure",
    "derivation_final_result_unit_matches_last_step", finalUnit,
    finalUnitPresent,
    finalUnitPresent &&
      finalUnit ===
        (lastStep as Record<string, unknown>)["declared_result_unit"],
    "derivation: the declared final result unit equals the last declared step's declared result unit");

  // ---- Section 2: step_arithmetic ----
  check(results, "step_arithmetic",
    "derivation_steps_list_declared", stepsRaw, stepsIsList,
    stepsIsList && stepsCount !== null && stepsCount > 0,
    "the declared record names its derivation steps — the steps list is present and names at least one step; an absent list is missing evidence and an empty list declares no derivation at all");
  const idPresent = stepsIsList &&
    rows.every((c) => hasField(c, "step_id"));
  check(results, "step_arithmetic",
    "every_derivation_step_id_unique", stepsRaw, idPresent,
    stepsIsList && duplicateStepIds !== null &&
      duplicateStepIds.length === 0,
    "derivation steps: no declared step_id is owned by more than one row");
  const operationPresent = stepsIsList &&
    rows.every((c) => hasField(c, "operation"));
  check(results, "step_arithmetic",
    "every_derivation_step_operation_recognised", stepsRaw,
    operationPresent,
    stepsIsList &&
      rows.every((c) => isPyDict(c) &&
        OPERATIONS.includes(c["operation"] as string)),
    "derivation steps: every declared step's operation is one of add, subtract, multiply, divide");
  const arithmeticPresent = stepsIsList &&
    rows.every((c) => stepCompleteForArithmetic(c));
  check(results, "step_arithmetic",
    "every_derivation_step_arithmetic_recomputes", stepsRaw,
    arithmeticPresent,
    stepsIsList && rows.every((c) => stepArithmeticMatches(c)),
    "derivation steps: every declared step's declared result recomputes exactly from its declared operands under its declared operation (6dp serialization)");
  const dividePresent = stepsIsList &&
    rows.every((c) => hasField(c, "operation") &&
      hasField(c, "operand_b") &&
      isNumber((c as Record<string, unknown>)["operand_b"]));
  check(results, "step_arithmetic",
    "no_derivation_step_divides_by_zero", stepsRaw, dividePresent,
    stepsIsList &&
      rows.every((c) => !(isPyDict(c) &&
        c["operation"] === "divide" &&
        isNumber(c["operand_b"]) && c["operand_b"] === 0)),
    "derivation steps: no declared divide step has a zero second operand");

  // ---- Section 3: dimensions_and_units ----
  boolCheck(results, "dimensions_and_units",
    "derivation_dimensions_checked", manifest,
    ["dimensions", "dimensions_checked"],
    "dimensions: the derivation's dimensions are checked");
  boolCheck(results, "dimensions_and_units",
    "derivation_units_checked", manifest,
    ["dimensions", "units_checked"],
    "units: the derivation's units are checked");
  boolCheck(results, "dimensions_and_units",
    "derivation_unit_conversions_shown_where_needed", manifest,
    ["dimensions", "unit_conversions_shown_where_needed"],
    "units: every unit conversion the derivation needs is shown where it is used");
  const unitsDeclared = stepsIsList &&
    rows.every((c) => hasField(c, "operand_a_unit") &&
      hasField(c, "operand_b_unit") &&
      hasField(c, "declared_result_unit"));
  check(results, "dimensions_and_units",
    "every_derivation_step_declares_all_units", stepsRaw, unitsDeclared,
    stepsIsList && rows.every((c) => stepCompleteForUnits(c)),
    "derivation steps: every declared step declares its operand_a_unit, operand_b_unit and declared_result_unit, none empty");
  const unitsComplete = stepsIsList &&
    rows.every((c) => stepCompleteForUnits(c));
  check(results, "dimensions_and_units",
    "every_derivation_step_result_unit_follows_unit_algebra", stepsRaw,
    unitsComplete,
    stepsIsList && rows.every((c) => stepUnitMatches(c)),
    "derivation steps: every declared step's result unit is the unit the declared unit algebra produces — add/subtract keep the shared operand unit, multiply gives <a>*<b>, divide gives <a>/<b>, and the dimensionless unit 1 drops out");

  // ---- Section 4: assumptions_and_failure_modes ----
  boolCheck(results, "assumptions_and_failure_modes",
    "derivation_assumptions_listed", manifest,
    ["assumptions", "assumptions_listed"],
    "assumptions: the derivation's assumptions are listed");
  boolCheck(results, "assumptions_and_failure_modes",
    "derivation_normality_checked_where_assumed", manifest,
    ["assumptions", "normality_checked_where_assumed"],
    "assumptions: normality is checked wherever the derivation assumes it");
  boolCheck(results, "assumptions_and_failure_modes",
    "derivation_independence_checked_where_assumed", manifest,
    ["assumptions", "independence_checked_where_assumed"],
    "assumptions: independence is checked wherever the derivation assumes it");
  boolCheck(results, "assumptions_and_failure_modes",
    "derivation_stationarity_checked_where_assumed", manifest,
    ["assumptions", "stationarity_checked_where_assumed"],
    "assumptions: stationarity is checked wherever the derivation assumes it");
  boolCheck(results, "assumptions_and_failure_modes",
    "derivation_failure_modes_named", manifest,
    ["assumptions", "failure_modes_named"],
    "assumptions: the method's failure modes are named");
  boolCheck(results, "assumptions_and_failure_modes",
    "derivation_domain_restrictions_stated", manifest,
    ["assumptions", "domain_restrictions_stated"],
    "assumptions: the derivation's domain restrictions are stated (where its steps are defined)");

  // ---- Section 5: method_choice_and_verification ----
  boolCheck(results, "method_choice_and_verification",
    "derivation_method_named", manifest,
    ["method", "method_named"],
    "method: the method the derivation uses is named");
  boolCheck(results, "method_choice_and_verification",
    "derivation_simplest_fitting_method_chosen", manifest,
    ["method", "simplest_method_that_fits_chosen"],
    "method: the simplest method that fits is the method chosen");
  boolCheck(results, "method_choice_and_verification",
    "derivation_method_choice_justified_from_problem_structure", manifest,
    ["method", "method_choice_justified_from_problem_structure"],
    "method: the method choice is justified from the problem's structure, not from library habit");
  boolCheck(results, "method_choice_and_verification",
    "derivation_verified_with_small_numerical_example", manifest,
    ["method", "small_numerical_example_verified"],
    "verification: the derivation is verified with a small numerical example");

  // ---- Section 6: red_lines ----
  falseCheck(results, "red_lines",
    "derivation_free_of_black_box_trust", manifest,
    ["red_lines", "black_box_trust_without_derivation_present"],
    "red line: no black-box result trusted without a derivation is present in the record");
  falseCheck(results, "red_lines",
    "derivation_free_of_ignored_assumptions", manifest,
    ["red_lines", "assumptions_ignored_present"],
    "red line: no ignored assumptions are present in the record");
  falseCheck(results, "red_lines",
    "derivation_free_of_correlation_as_causation", manifest,
    ["red_lines", "correlation_presented_as_causation_present"],
    "red line: no correlation presented as causation is present in the record");
  falseCheck(results, "red_lines",
    "derivation_free_of_p_hacking", manifest,
    ["red_lines", "p_hacking_present"],
    "red line: no p-hacking is present in the record");
  falseCheck(results, "red_lines",
    "derivation_free_of_overfitting", manifest,
    ["red_lines", "overfitting_present"],
    "red line: no overfitting is present in the record");

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
    verdict = "DERIVATION_NOT_SOUND";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "DERIVATION_SOUND";
  }

  const computedNames = [
    "derivation_final_result_value_matches_last_step",
    "derivation_final_result_unit_matches_last_step",
    "derivation_steps_list_declared",
    "every_derivation_step_id_unique",
    "every_derivation_step_operation_recognised",
    "every_derivation_step_arithmetic_recomputes",
    "no_derivation_step_divides_by_zero",
    "every_derivation_step_declares_all_units",
    "every_derivation_step_result_unit_follows_unit_algebra",
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
    service: "quant-math-derivation-sanity-check",
    atom_version: "0.1.0",
    derivation_title: manifest["derivation_title"] ?? null,
    verdict,
    sections,
    checks: results,
    computed_status: computedStatus,
    derivation_steps_count: stepsCount,
    duplicate_derivation_step_ids: duplicateStepIds,
    derivation_steps_with_arithmetic_mismatch: stepsWithArithmeticMismatch,
    derivation_steps_with_unit_mismatch: stepsWithUnitMismatch,
    derivation_steps_missing_units: stepsMissingUnits,
    arithmetic_match_ratio: fmt6(arithmeticMatchRatio),
    unit_match_ratio: fmt6(unitMatchRatio),
    summary:
      `${count("pass")} pass, ` +
      `${count("fail")} fail, ` +
      `${count("missing")} missing ` +
      `of ${results.length} checks across six sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "QUANT MATH DERIVATION SANITY CHECK",
    `derivation_title: ${pyStr(verdict.derivation_title ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(44)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
