// Structured decision making — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/structured-decision-making/src/structured_decision_making.py
// (evaluate() + stamp()). No logic changes: every verdict, section
// outcome, per-check status, evidence string, computed field and
// the summary string are byte-identical to the Python output for
// the same input. Computed quantities use the shared fixed
// serialization: round half up to 6dp —
// floor(v * 1000000 + 0.5) / 1000000 — then format with exactly six
// decimals; weighted-total comparisons are made on those 6dp
// serializations of the recomputed and declared values.

import { pyStr } from "./release-readiness.js";
import { validateManifest, type FieldSpec } from "./validate.js";

const MANIFEST_SPEC: { [field: string]: FieldSpec } = {
  decision: "string",
  framing: {
    decision_restated_crisp: "boolean",
    decide_by_date_stated: "boolean",
    constraints_named: "boolean",
    out_of_scope_named: "boolean",
    classification: "string",
    stakes_assessed: "boolean",
    effort_budget_matched_to_stakes_and_reversibility: "boolean",
    slowed_deliberation_declared: "boolean",
  },
  options: [{
    name: "string",
    kind: "string",
    scores: [{
      criterion: "string",
      score: "number",
    }],
    declared_weighted_total: "number",
  }],
  criteria: [{
    name: "string",
    weight: "number",
    defined_before_scoring: "boolean",
  }],
  evaluation: {
    method: "string",
    score_scale_min: "number",
    score_scale_max: "number",
    probabilities_estimable: "boolean",
    expected_value_used: "boolean",
    scenario_thinking_used: "boolean",
    uncertainty_flagged: "boolean",
    base_rates_considered: "boolean",
  },
  premortem: {
    decision_is_material: "boolean",
    conducted: "boolean",
    failure_reasons_named: "boolean",
    top_reasons_fixed_or_hedged: "boolean",
  },
  log: {
    choice_recorded: "boolean",
    chosen_option: "string",
    rationale_recorded: "boolean",
    assumptions_recorded: "boolean",
    communicated_with_why: "boolean",
  },
  review: {
    review_date_set: "boolean",
    outcomes_vs_expectations_review_planned: "boolean",
    luck_separated_from_process_declared: "boolean",
  },
  red_lines: {
    decision_without_options_present: "boolean",
    criteria_invented_after_scores_present: "boolean",
    irreversible_decision_rushed_present: "boolean",
    irreversible_decision_made_in_mood_present: "boolean",
  },
};

export const SECTIONS = [
  "structured_framing",
  "structured_options",
  "structured_criteria",
  "structured_matrix_scoring",
  "structured_evaluation_and_uncertainty",
  "structured_pre_mortem",
  "structured_commit_log_and_review",
  "structured_red_lines",
] as const;

const CLASSIFICATIONS = ["reversible", "irreversible"];
const OPTION_KINDS = ["action", "status_quo", "smaller_reversible_step"];
const METHODS = ["decision_matrix", "expected_value", "decision_tree",
  "scenario_thinking"];

export type CheckStatus = "pass" | "fail" | "missing";

export interface CheckResult {
  section: string;
  check: string;
  status: CheckStatus;
  evidence: string;
}

export interface RecomputedTotal {
  option: string;
  recomputed_weighted_total: string | null;
}

export interface Verdict {
  service: string;
  atom_version: string;
  decision: unknown;
  verdict: string;
  sections: Record<string, string>;
  checks: CheckResult[];
  computed_status: string | null;
  options_count: number | null;
  criteria_count: number | null;
  duplicate_option_names: string[] | null;
  duplicate_criterion_names: string[] | null;
  criteria_weights_sum: string | null;
  recomputed_weighted_totals: RecomputedTotal[] | null;
  options_with_weighted_total_mismatch: string[] | null;
  options_without_complete_scores: string[] | null;
  score_coverage_ratio: string | null;
  weighted_total_match_ratio: string | null;
  chosen_option: unknown;
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
    check(results, section, name, target, hasTarget, target === true,
      evidence);
  } else {
    check(results, section, name, gate, hasGate, true, naEvidence);
  }
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
  if (isPyDict(entry) && typeof entry["name"] === "string") {
    return entry["name"] as string;
  }
  return "unnamed";
}

function nonemptyStr(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function duplicates(rows: unknown[], field: string): string[] {
  const seen: string[] = [];
  const dups: string[] = [];
  for (const c of rows) {
    if (isPyDict(c) && typeof c[field] === "string") {
      const nm = c[field] as string;
      if (seen.includes(nm) && !dups.includes(nm)) {
        dups.push(nm);
      }
      seen.push(nm);
    }
  }
  return dups;
}

function scoreRows(entry: unknown): unknown[] | null {
  if (isPyDict(entry) && Array.isArray(entry["scores"])) {
    return entry["scores"] as unknown[];
  }
  return null;
}

function scoreCriteria(entry: unknown): string[] | null {
  const rows = scoreRows(entry);
  if (rows === null) return null;
  const out: string[] = [];
  for (const r of rows) {
    if (isPyDict(r) && typeof r["criterion"] === "string") {
      out.push(r["criterion"] as string);
    }
  }
  return out;
}

type Weights = Array<[string, number]> | null;

function scoresCompleteExact(
  entry: unknown,
  criteriaNames: string[] | null,
  weights: Weights,
): boolean {
  if (weights === null || criteriaNames === null) return false;
  const rows = scoreRows(entry);
  if (rows === null) return false;
  const crits = scoreCriteria(entry);
  if (crits === null || crits.length !== rows.length) return false;
  const sortedCrits = [...crits].sort();
  const sortedNames = [...criteriaNames].sort();
  if (sortedCrits.length !== sortedNames.length ||
      sortedCrits.some((v, i) => v !== sortedNames[i])) return false;
  return rows.every((r) => isPyDict(r) && isNumber(r["score"]));
}

function recomputedTotal(
  entry: Record<string, unknown>,
  weights: Array<[string, number]>,
): number {
  const scores = new Map<string, number>();
  for (const r of scoreRows(entry) ?? []) {
    if (isPyDict(r)) {
      scores.set(r["criterion"] as string, r["score"] as number);
    }
  }
  let total = 0.0;
  for (const [name, weight] of weights) {
    total += weight * (scores.get(name) as number);
  }
  return total;
}

export function evaluate(manifest: unknown): Verdict {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateManifest(manifest, MANIFEST_SPEC);
  const results: CheckResult[] = [];

  const [optionsRaw, hasOptions] = getPath(manifest, "options");
  const optionsIsList = hasOptions && Array.isArray(optionsRaw);
  const optionRows: unknown[] = optionsIsList ? (optionsRaw as unknown[]) : [];
  const optionsCount: number | null = optionsIsList ? optionRows.length : null;

  const [criteriaRaw, hasCriteria] = getPath(manifest, "criteria");
  const criteriaIsList = hasCriteria && Array.isArray(criteriaRaw);
  const criteriaRows: unknown[] = criteriaIsList
    ? (criteriaRaw as unknown[]) : [];
  const criteriaCount: number | null = criteriaIsList
    ? criteriaRows.length : null;

  const duplicateOptionNames: string[] | null = optionsIsList
    ? duplicates(optionRows, "name") : null;
  const duplicateCriterionNames: string[] | null = criteriaIsList
    ? duplicates(criteriaRows, "name") : null;

  const criteriaNames: string[] | null = criteriaIsList
    ? criteriaRows
        .filter((c) => isPyDict(c) && typeof c["name"] === "string")
        .map((c) => (c as Record<string, unknown>)["name"] as string)
    : null;
  const criteriaNamesComplete: boolean = criteriaIsList &&
    criteriaRows.length > 0 &&
    criteriaRows.every((c) => hasField(c, "name")) &&
    criteriaNames !== null &&
    criteriaNames.length === criteriaRows.length;
  let weights: Weights = null;
  if (criteriaNamesComplete && duplicateCriterionNames !== null &&
      duplicateCriterionNames.length === 0 &&
      criteriaRows.every((c) => isNumber(
        (c as Record<string, unknown>)["weight"]))) {
    weights = criteriaRows.map((c) => [
      (c as Record<string, unknown>)["name"] as string,
      (c as Record<string, unknown>)["weight"] as number,
    ]);
  }
  const criteriaWeightsSum: number | null =
    criteriaIsList &&
    criteriaRows.every((c) => hasField(c, "weight") &&
      isNumber((c as Record<string, unknown>)["weight"])) &&
    criteriaRows.length > 0
      ? criteriaRows.reduce<number>(
          (acc, c) => acc + ((c as Record<string, unknown>)["weight"] as number),
          0)
      : null;

  const scoresExact = (entry: unknown): boolean =>
    scoresCompleteExact(entry, criteriaNames, weights);

  const recomputedTotals: RecomputedTotal[] | null =
    optionsIsList && criteriaIsList
      ? optionRows.map((c) => ({
          option: rowName(c),
          recomputed_weighted_total: fmt6(
            scoresExact(c)
              ? recomputedTotal(c as Record<string, unknown>,
                  weights as Array<[string, number]>)
              : null),
        }))
      : null;
  const optionsWithoutCompleteScores: string[] | null =
    optionsIsList && criteriaIsList
      ? optionRows.filter((c) => !scoresExact(c)).map(rowName)
      : null;
  const optionsWithTotalMismatch: string[] | null =
    optionsIsList && criteriaIsList
      ? optionRows.filter((c) => scoresExact(c) &&
          hasField(c, "declared_weighted_total") &&
          !valuesMatch(
            recomputedTotal(c as Record<string, unknown>,
              weights as Array<[string, number]>),
            (c as Record<string, unknown>)["declared_weighted_total"]))
          .map(rowName)
      : null;

  const coversAllCriteria = (entry: unknown): boolean => {
    const crits = scoreCriteria(entry);
    if (crits === null || criteriaNames === null) return false;
    return criteriaNames.every((n) => crits.includes(n));
  };

  const scoreCoverageRatio: number | null =
    optionsIsList && criteriaNamesComplete &&
    optionsCount !== null && optionsCount > 0
      ? optionRows.filter((c) => coversAllCriteria(c)).length / optionsCount
      : null;
  const weightedTotalMatchRatio: number | null =
    optionsIsList && weights !== null &&
    optionsCount !== null && optionsCount > 0
      ? optionRows.filter((c) => scoresExact(c) &&
          hasField(c, "declared_weighted_total") &&
          valuesMatch(
            recomputedTotal(c as Record<string, unknown>,
              weights as Array<[string, number]>),
            (c as Record<string, unknown>)["declared_weighted_total"]))
          .length / optionsCount
      : null;

  const [scaleMin, hasScaleMin] = getPath(manifest, "evaluation",
    "score_scale_min");
  const [scaleMax, hasScaleMax] = getPath(manifest, "evaluation",
    "score_scale_max");
  const [chosenOption, hasChosen] = getPath(manifest, "log", "chosen_option");

  // ---- Section 1: structured_framing ----
  boolCheck(results, "structured_framing",
    "structured_framing_decision_restated_crisp", manifest,
    ["framing", "decision_restated_crisp"],
    "frame: the actual decision is restated until it is crisp — what needs deciding is stated");
  boolCheck(results, "structured_framing",
    "structured_framing_decide_by_date_stated", manifest,
    ["framing", "decide_by_date_stated"],
    "frame: by when the decision must be made is stated");
  boolCheck(results, "structured_framing",
    "structured_framing_constraints_named", manifest,
    ["framing", "constraints_named"],
    "frame: the constraints on the decision are named");
  boolCheck(results, "structured_framing",
    "structured_framing_out_of_scope_named", manifest,
    ["framing", "out_of_scope_named"],
    "frame: what is out of scope for the decision is named");
  const [classification, hasClassification] = getPath(manifest,
    "framing", "classification");
  check(results, "structured_framing",
    "structured_classification_is_reversible_or_irreversible",
    classification, hasClassification,
    CLASSIFICATIONS.includes(classification as string),
    "classify: the decision is classified reversible or irreversible — speed where reversible, care where not");
  boolCheck(results, "structured_framing",
    "structured_framing_stakes_assessed", manifest,
    ["framing", "stakes_assessed"],
    "classify: the stakes of the decision are assessed — stakes x reversibility sets the effort budget");
  boolCheck(results, "structured_framing",
    "structured_effort_budget_matched_to_stakes_and_reversibility",
    manifest,
    ["framing", "effort_budget_matched_to_stakes_and_reversibility"],
    "classify: the effort spent on the decision is declared matched to its stakes and reversibility");
  const irreversible = hasClassification &&
    classification === "irreversible";
  const [slowed, hasSlowed] = getPath(manifest, "framing",
    "slowed_deliberation_declared");
  if (irreversible) {
    check(results, "structured_framing",
      "structured_slowed_deliberation_when_irreversible",
      slowed, hasSlowed, slowed === true,
      "classify: an irreversible decision is slowed down and deliberated, not decided fast");
  } else {
    check(results, "structured_framing",
      "structured_slowed_deliberation_when_irreversible",
      classification, hasClassification, true,
      "decision is not classified irreversible — slowed deliberation is not required by the classification");
  }

  // ---- Section 2: structured_options ----
  check(results, "structured_options",
    "structured_options_list_declares_at_least_three", optionsRaw,
    optionsIsList,
    optionsIsList && optionsCount !== null && optionsCount >= 3,
    "options: the declared record names at least three options — binary choices are usually false binaries; an absent list is missing evidence and a shorter list fails");
  const namePresent = optionsIsList &&
    optionRows.every((c) => hasField(c, "name"));
  check(results, "structured_options",
    "structured_every_option_row_names_the_option", optionsRaw,
    namePresent,
    optionsIsList &&
      optionRows.every((c) => nonemptyStr(
        (c as Record<string, unknown>)["name"])),
    "options: every declared option row names the option (a non-empty name)");
  check(results, "structured_options",
    "structured_option_names_are_unique", optionsRaw, namePresent,
    optionsIsList && duplicateOptionNames !== null &&
      duplicateOptionNames.length === 0,
    "options: no declared option name is owned by more than one row");
  const kindPresent = optionsIsList &&
    optionRows.every((c) => hasField(c, "kind"));
  check(results, "structured_options",
    "structured_every_option_kind_is_recognised", optionsRaw,
    kindPresent,
    optionsIsList &&
      optionRows.every((c) => isPyDict(c) &&
        OPTION_KINDS.includes(c["kind"] as string)),
    "options: every declared option's kind is one of action, status_quo, smaller_reversible_step");
  check(results, "structured_options",
    "structured_options_include_a_status_quo_row", optionsRaw,
    kindPresent,
    optionsIsList &&
      optionRows.some((c) => isPyDict(c) && c["kind"] === "status_quo"),
    "options: the declared rows include a status-quo option ('do nothing / wait')");
  check(results, "structured_options",
    "structured_options_include_a_smaller_reversible_step_row",
    optionsRaw, kindPresent,
    optionsIsList &&
      optionRows.some((c) => isPyDict(c) &&
        c["kind"] === "smaller_reversible_step"),
    "options: the declared rows include a smaller reversible step option");

  // ---- Section 3: structured_criteria ----
  check(results, "structured_criteria",
    "structured_criteria_list_is_declared", criteriaRaw,
    criteriaIsList,
    criteriaIsList && criteriaCount !== null && criteriaCount > 0,
    "criteria: the declared record names its criteria — the criteria list is present and names at least one criterion; an absent list is missing evidence and an empty list declares no criteria at all");
  const critNamePresent = criteriaIsList &&
    criteriaRows.every((c) => hasField(c, "name"));
  check(results, "structured_criteria",
    "structured_every_criterion_row_names_the_criterion", criteriaRaw,
    critNamePresent,
    criteriaIsList &&
      criteriaRows.every((c) => nonemptyStr(
        (c as Record<string, unknown>)["name"])),
    "criteria: every declared criterion row names the criterion (a non-empty name)");
  check(results, "structured_criteria",
    "structured_criterion_names_are_unique", criteriaRaw,
    critNamePresent,
    criteriaIsList && duplicateCriterionNames !== null &&
      duplicateCriterionNames.length === 0,
    "criteria: no declared criterion name is owned by more than one row");
  const weightPresent = criteriaIsList &&
    criteriaRows.every((c) => hasField(c, "weight"));
  check(results, "structured_criteria",
    "structured_every_criterion_weight_is_nonnegative", criteriaRaw,
    weightPresent,
    criteriaIsList &&
      criteriaRows.every((c) => isNumber(
        (c as Record<string, unknown>)["weight"]) &&
        ((c as Record<string, unknown>)["weight"] as number) >= 0),
    "criteria: every declared criterion declares a non-negative weight");
  check(results, "structured_criteria",
    "structured_criteria_weights_sum_is_positive", criteriaRaw,
    weightPresent,
    criteriaWeightsSum !== null && criteriaWeightsSum > 0,
    "criteria: the declared criterion weights sum to a positive total — a matrix whose weights sum to zero scores nothing");
  const beforePresent = criteriaIsList &&
    criteriaRows.every((c) => hasField(c, "defined_before_scoring"));
  check(results, "structured_criteria",
    "structured_every_criterion_defined_before_scoring", criteriaRaw,
    beforePresent,
    criteriaIsList &&
      criteriaRows.every((c) =>
        (c as Record<string, unknown>)["defined_before_scoring"] === true),
    "criteria: every declared criterion is declared defined before scoring — criteria first, weights before scores");

  // ---- Section 4: structured_matrix_scoring ----
  const matrixPresent = optionsIsList && criteriaNamesComplete &&
    optionRows.every((c) => hasField(c, "scores")) &&
    optionRows.every((c) => {
      const crits = scoreCriteria(c);
      const rows = scoreRows(c);
      return crits !== null && rows !== null && crits.length === rows.length;
    });
  check(results, "structured_matrix_scoring",
    "structured_every_option_scores_every_declared_criterion",
    optionsRaw, matrixPresent,
    optionsIsList && criteriaNamesComplete && optionRows.length > 0 &&
      optionRows.every((c) => coversAllCriteria(c)),
    "matrix: every declared option scores every declared criterion — the score matrix is complete over the record's own declared criteria");
  check(results, "structured_matrix_scoring",
    "structured_no_option_scores_an_undeclared_criterion",
    optionsRaw, matrixPresent,
    optionsIsList && criteriaNames !== null &&
      optionRows.every((c) => (scoreCriteria(c) ?? [])
        .every((cr) => criteriaNames.includes(cr))),
    "matrix: no declared option scores a criterion the record does not declare");
  check(results, "structured_matrix_scoring",
    "structured_no_option_scores_a_criterion_twice", optionsRaw,
    matrixPresent,
    optionsIsList &&
      optionRows.every((c) => {
        const crits = scoreCriteria(c) ?? [];
        return crits.length === new Set(crits).size;
      }),
    "matrix: no declared option scores the same criterion on more than one score row");
  const scalePresent = hasScaleMin && hasScaleMax;
  check(results, "structured_matrix_scoring",
    "structured_score_scale_bounds_are_coherent", scaleMin,
    scalePresent,
    scalePresent && isNumber(scaleMin) && isNumber(scaleMax) &&
      scaleMin <= (scaleMax as number),
    "matrix: the record's declared score scale bounds are coherent — score_scale_min does not exceed score_scale_max");
  const scoresPresent = optionsIsList && scalePresent &&
    optionRows.every((c) => hasField(c, "scores")) &&
    optionRows.every((c) => {
      const rows = scoreRows(c);
      return rows !== null &&
        rows.every((r) => isPyDict(r) && hasField(r, "score"));
    });
  check(results, "structured_matrix_scoring",
    "structured_every_score_lies_within_the_declared_scale",
    optionsRaw, scoresPresent,
    scoresPresent && optionRows.length > 0 &&
      optionRows.every((c) => (scoreRows(c) ?? []).every((r) =>
        isNumber((r as Record<string, unknown>)["score"]) &&
        (scaleMin as number) <=
          ((r as Record<string, unknown>)["score"] as number) &&
        ((r as Record<string, unknown>)["score"] as number) <=
          (scaleMax as number))),
    "matrix: every declared score lies within the score scale the record itself declares");
  const totalsPresent = optionsIsList && weights !== null &&
    optionRows.every((c) => scoresExact(c)) &&
    optionRows.every((c) => hasField(c, "declared_weighted_total"));
  check(results, "structured_matrix_scoring",
    "structured_every_declared_weighted_total_recomputes",
    optionsRaw, totalsPresent,
    totalsPresent && optionRows.length > 0 &&
      optionRows.every((c) => valuesMatch(
        recomputedTotal(c as Record<string, unknown>,
          weights as Array<[string, number]>),
        (c as Record<string, unknown>)["declared_weighted_total"])),
    "matrix: every declared option's declared weighted total recomputes exactly as sum(declared criterion weight x declared score) over the declared criteria (6dp serialization)");

  // ---- Section 5: structured_evaluation_and_uncertainty ----
  const [method, hasMethod] = getPath(manifest, "evaluation", "method");
  check(results, "structured_evaluation_and_uncertainty",
    "structured_evaluation_method_is_recognised", method, hasMethod,
    METHODS.includes(method as string),
    "evaluation: the declared evaluation method is one of decision_matrix, expected_value, decision_tree, scenario_thinking — a fitting tool for the decision");
  boolCheck(results, "structured_evaluation_and_uncertainty",
    "structured_evaluation_uncertainty_is_flagged", manifest,
    ["evaluation", "uncertainty_flagged"],
    "evaluation: the uncertainty in the evaluation is flagged");
  boolCheck(results, "structured_evaluation_and_uncertainty",
    "structured_evaluation_base_rates_are_considered", manifest,
    ["evaluation", "base_rates_considered"],
    "evaluation: base-rate / reference information is declared considered before the inside view of this decision (its arithmetic, if any, is the base-rate-card atom's ground, not this record's)");
  gatedBoolCheck(results, "structured_evaluation_and_uncertainty",
    "structured_expected_value_used_when_probabilities_estimable",
    manifest, ["evaluation", "probabilities_estimable"],
    ["evaluation", "expected_value_used"],
    "evaluation: when probabilities are declared estimable, expected value / decision-tree evaluation is declared used",
    "probabilities are not declared estimable — expected-value evaluation is not required");
  const [estimable, hasEstimable] = getPath(manifest, "evaluation",
    "probabilities_estimable");
  const [scenario, hasScenario] = getPath(manifest, "evaluation",
    "scenario_thinking_used");
  if (hasEstimable && estimable === false) {
    check(results, "structured_evaluation_and_uncertainty",
      "structured_scenario_thinking_used_when_probabilities_not_estimable",
      scenario, hasScenario, scenario === true,
      "evaluation: when probabilities are declared not estimable, scenario thinking is declared used");
  } else {
    check(results, "structured_evaluation_and_uncertainty",
      "structured_scenario_thinking_used_when_probabilities_not_estimable",
      estimable, hasEstimable, true,
      "probabilities are not declared non-estimable — scenario thinking is not the required fitting tool");
  }

  // ---- Section 6: structured_pre_mortem ----
  gatedBoolCheck(results, "structured_pre_mortem",
    "structured_premortem_conducted_when_decision_is_material",
    manifest, ["premortem", "decision_is_material"],
    ["premortem", "conducted"],
    "pre-mortem: for a material decision a pre-mortem is declared conducted — assume it failed, why?",
    "decision is not declared material — a pre-mortem is not required by the quality gate");
  gatedBoolCheck(results, "structured_pre_mortem",
    "structured_premortem_failure_reasons_named_when_material",
    manifest, ["premortem", "decision_is_material"],
    ["premortem", "failure_reasons_named"],
    "pre-mortem: the pre-mortem's failure reasons are declared named for a material decision",
    "decision is not declared material — pre-mortem failure reasons are not required");
  gatedBoolCheck(results, "structured_pre_mortem",
    "structured_premortem_top_reasons_fixed_or_hedged_when_material",
    manifest, ["premortem", "decision_is_material"],
    ["premortem", "top_reasons_fixed_or_hedged"],
    "pre-mortem: the pre-mortem's top reasons are declared fixed or hedged now, for a material decision",
    "decision is not declared material — pre-mortem hedging is not required");

  // ---- Section 7: structured_commit_log_and_review ----
  boolCheck(results, "structured_commit_log_and_review",
    "structured_log_choice_is_recorded", manifest,
    ["log", "choice_recorded"],
    "commit: the choice is recorded in the decision log");
  const optionNames: string[] | null = optionsIsList
    ? optionRows
        .filter((c) => isPyDict(c) && typeof c["name"] === "string")
        .map((c) => (c as Record<string, unknown>)["name"] as string)
    : null;
  const chosenPresent = hasChosen && optionsIsList;
  check(results, "structured_commit_log_and_review",
    "structured_logged_chosen_option_matches_a_declared_option",
    chosenOption, chosenPresent,
    chosenPresent && typeof chosenOption === "string" &&
      optionNames !== null && optionNames.includes(chosenOption),
    "commit: the logged chosen option names a declared option row — the log commits to an option the record actually evaluated (which option is chosen is the caller's decision; this atom never checks it against the recomputed totals)");
  boolCheck(results, "structured_commit_log_and_review",
    "structured_log_rationale_is_recorded", manifest,
    ["log", "rationale_recorded"],
    "commit: the rationale for the choice is recorded");
  boolCheck(results, "structured_commit_log_and_review",
    "structured_log_assumptions_are_recorded", manifest,
    ["log", "assumptions_recorded"],
    "commit: the assumptions behind the choice are recorded in the log");
  boolCheck(results, "structured_commit_log_and_review",
    "structured_log_decision_communicated_with_why", manifest,
    ["log", "communicated_with_why"],
    "commit: the decision is declared communicated with the 'why'");
  boolCheck(results, "structured_commit_log_and_review",
    "structured_review_date_is_set", manifest,
    ["review", "review_date_set"],
    "review: a review date is set — review on schedule");
  boolCheck(results, "structured_commit_log_and_review",
    "structured_review_compares_outcomes_to_expectations", manifest,
    ["review", "outcomes_vs_expectations_review_planned"],
    "review: the review is declared to compare outcomes against the expectations recorded at commit time");
  boolCheck(results, "structured_commit_log_and_review",
    "structured_review_separates_luck_from_process", manifest,
    ["review", "luck_separated_from_process_declared"],
    "review: the review is declared to separate luck from process and update the record");

  // ---- Section 8: structured_red_lines ----
  falseCheck(results, "structured_red_lines",
    "structured_record_free_of_decision_without_options", manifest,
    ["red_lines", "decision_without_options_present"],
    "red line: no decision without options is present in the record");
  falseCheck(results, "structured_red_lines",
    "structured_record_free_of_criteria_invented_after_scores", manifest,
    ["red_lines", "criteria_invented_after_scores_present"],
    "red line: no criteria invented after scores are present in the record");
  falseCheck(results, "structured_red_lines",
    "structured_record_free_of_irreversible_decision_rushed", manifest,
    ["red_lines", "irreversible_decision_rushed_present"],
    "red line: no irreversible decision made in a rush is present in the record");
  falseCheck(results, "structured_red_lines",
    "structured_record_free_of_irreversible_decision_in_a_mood", manifest,
    ["red_lines", "irreversible_decision_made_in_mood_present"],
    "red line: no irreversible decision made in a mood is present in the record");

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
    verdict = "DECISION_RECORD_NOT_SOUND";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "DECISION_RECORD_SOUND";
  }

  const computedNames = [
    "structured_classification_is_reversible_or_irreversible",
    "structured_slowed_deliberation_when_irreversible",
    "structured_options_list_declares_at_least_three",
    "structured_option_names_are_unique",
    "structured_criteria_list_is_declared",
    "structured_criterion_names_are_unique",
    "structured_criteria_weights_sum_is_positive",
    "structured_every_option_scores_every_declared_criterion",
    "structured_no_option_scores_an_undeclared_criterion",
    "structured_no_option_scores_a_criterion_twice",
    "structured_score_scale_bounds_are_coherent",
    "structured_every_score_lies_within_the_declared_scale",
    "structured_every_declared_weighted_total_recomputes",
    "structured_logged_chosen_option_matches_a_declared_option",
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
    service: "structured-decision-making",
    atom_version: "0.1.0",
    decision: manifest["decision"] ?? null,
    verdict,
    sections,
    checks: results,
    computed_status: computedStatus,
    options_count: optionsCount,
    criteria_count: criteriaCount,
    duplicate_option_names: duplicateOptionNames,
    duplicate_criterion_names: duplicateCriterionNames,
    criteria_weights_sum: fmt6(criteriaWeightsSum),
    recomputed_weighted_totals: recomputedTotals,
    options_with_weighted_total_mismatch: optionsWithTotalMismatch,
    options_without_complete_scores: optionsWithoutCompleteScores,
    score_coverage_ratio: fmt6(scoreCoverageRatio),
    weighted_total_match_ratio: fmt6(weightedTotalMatchRatio),
    chosen_option: hasChosen ? chosenOption : null,
    summary:
      `${count("pass")} pass, ` +
      `${count("fail")} fail, ` +
      `${count("missing")} missing ` +
      `of ${results.length} checks across eight sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "STRUCTURED DECISION MAKING",
    `decision: ${pyStr(verdict.decision ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(44)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
