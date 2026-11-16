// Decision-trap sweep — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/decision-trap-sweep/src/decision_trap_sweep.py
// (evaluate() + stamp()). No logic changes: every verdict, section
// outcome, per-check status, evidence string and the summary string are
// byte-identical to the Python output for the same input.

import { pyStr } from "./release-readiness.js";
import { validateManifest, type FieldSpec } from "./validate.js";

// Documented manifest field types (SERVICE.md input table) — the
// identical spec the Python oracle validates against. A field
// present with the wrong JSON type raises FieldTypeError before
// any check runs (F1 remedy, external verification Wave 1).
// Vocabulary strings (framing.classification) are validated as
// "string" only, never enum-checked here.
const MANIFEST_SPEC: { [field: string]: FieldSpec } = {
  decision: "string",
  framing: {
    decision_stated: "boolean",
    decide_by_named: "boolean",
    constraints_named: "boolean",
    out_of_scope_named: "boolean",
    classification: "string",
    stakes_assessed: "boolean",
  },
  options: {
    list: ["string"],
    includes_status_quo: "boolean",
    includes_smaller_reversible_step: "boolean",
  },
  criteria: {
    criteria_listed: "boolean",
    defined_before_scoring: "boolean",
    weights_assigned_before_scoring: "boolean",
  },
  evaluation: {
    method_named: "boolean",
    uncertainty_flagged: "boolean",
    probabilities_estimable: "boolean",
    expected_value_used: "boolean",
  },
  premortem: {
    decision_is_material: "boolean",
    conducted: "boolean",
    top_risks_hedged: "boolean",
  },
  rush: {
    made_in_rush: "boolean",
    made_in_a_mood: "boolean",
  },
  log: {
    choice_recorded: "boolean",
    rationale_recorded: "boolean",
    assumptions_recorded: "boolean",
    review_date_set: "boolean",
    communicated_with_why: "boolean",
  },
};

export const SECTIONS = [
  "framing_and_classification",
  "options",
  "criteria_before_evaluation",
  "evaluation_and_uncertainty",
  "pre_mortem",
  "rush_and_mood_trap",
  "decision_log_and_review",
] as const;

const CLASSIFICATIONS = ["reversible", "irreversible"] as const;

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
  decision: unknown;
  verdict: string;
  sections: Record<string, string>;
  checks: CheckResult[];
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

export function evaluate(manifest: unknown): Verdict {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateManifest(manifest, MANIFEST_SPEC);
  const results: CheckResult[] = [];

  // ---- Section 1: framing_and_classification (method 1-2,
  //      quality gate 1) ----
  boolCheck(results, "framing_and_classification",
    "decision_stated", manifest,
    ["framing", "decision_stated"],
    "what needs deciding is stated — frame the actual decision until it is crisp");
  boolCheck(results, "framing_and_classification",
    "decide_by_named", manifest,
    ["framing", "decide_by_named"],
    "by when the decision must be made is named");
  boolCheck(results, "framing_and_classification",
    "constraints_named", manifest,
    ["framing", "constraints_named"],
    "the constraints on the decision are named");
  boolCheck(results, "framing_and_classification",
    "out_of_scope_named", manifest,
    ["framing", "out_of_scope_named"],
    "what is out of scope is named");
  const [classification, hasClassification] = getPath(manifest, "framing", "classification");
  check(results, "framing_and_classification",
    "decision_classified_reversible_or_irreversible",
    classification, hasClassification,
    (CLASSIFICATIONS as readonly unknown[]).includes(classification),
    "classify the decision: reversible (decide fast, adjust) vs irreversible (slow down, deliberate)");
  boolCheck(results, "framing_and_classification",
    "stakes_assessed", manifest,
    ["framing", "stakes_assessed"],
    "stakes assessed — stakes x reversibility sets the effort budget");

  // ---- Section 2: options (method 3, quality gate 2, red line) ----
  const [optionsList, hasOptionsList] = getPath(manifest, "options", "list");
  check(results, "options", "at_least_three_options",
    optionsList, hasOptionsList,
    Array.isArray(optionsList) && optionsList.length >= 3,
    "generate at least three options — binary choices are usually false binaries");
  boolCheck(results, "options", "status_quo_option_included",
    manifest, ["options", "includes_status_quo"],
    "the options include 'do nothing / wait'");
  boolCheck(results, "options",
    "smaller_reversible_step_included", manifest,
    ["options", "includes_smaller_reversible_step"],
    "the options include a smaller reversible step");

  // ---- Section 3: criteria_before_evaluation (method 4, quality
  //      gate 2, red line) ----
  boolCheck(results, "criteria_before_evaluation",
    "criteria_listed", manifest,
    ["criteria", "criteria_listed"],
    "what matters is defined (cost, risk, time-to-value, optionality)");
  boolCheck(results, "criteria_before_evaluation",
    "criteria_defined_before_scoring", manifest,
    ["criteria", "defined_before_scoring"],
    "criteria are defined BEFORE scoring options — criteria after scores is rationalization");
  boolCheck(results, "criteria_before_evaluation",
    "weights_assigned_before_scoring", manifest,
    ["criteria", "weights_assigned_before_scoring"],
    "weights are assigned before evaluation, not fitted to the scores afterwards");

  // ---- Section 4: evaluation_and_uncertainty (method 5) ----
  boolCheck(results, "evaluation_and_uncertainty",
    "fitting_evaluation_method_named", manifest,
    ["evaluation", "method_named"],
    "evaluate with a fitting tool — decision matrix for multi-criteria, expected value / decision trees when probabilities are estimable, scenario thinking when they are not; the method used is named");
  boolCheck(results, "evaluation_and_uncertainty",
    "uncertainty_flagged", manifest,
    ["evaluation", "uncertainty_flagged"],
    "flag the uncertainty in the evaluation");
  const [estimable, hasEstimable] = getPath(manifest, "evaluation", "probabilities_estimable");
  const [evUsed, hasEvUsed] = getPath(manifest, "evaluation", "expected_value_used");
  if (hasEstimable && pyTruthy(estimable)) {
    check(results, "evaluation_and_uncertainty",
      "expected_value_used_when_probabilities_estimable",
      evUsed, hasEvUsed, evUsed === true,
      "when probabilities are estimable, evaluate with expected value / decision trees");
  } else {
    check(results, "evaluation_and_uncertainty",
      "expected_value_used_when_probabilities_estimable",
      estimable, hasEstimable, true,
      "probabilities are not declared estimable — expected value is not required; scenario thinking is the fitting tool");
  }

  // ---- Section 5: pre_mortem (method 6, quality gate 3) ----
  const [material, hasMaterial] = getPath(manifest, "premortem", "decision_is_material");
  const [conducted, hasConducted] = getPath(manifest, "premortem", "conducted");
  if (hasMaterial && pyTruthy(material)) {
    check(results, "pre_mortem",
      "premortem_conducted_for_material_decision",
      conducted, hasConducted, conducted === true,
      "pre-mortem for material decisions: assume it failed — why?");
  } else {
    check(results, "pre_mortem",
      "premortem_conducted_for_material_decision",
      material, hasMaterial, true,
      "decision is not declared material — a pre-mortem is not required by the quality gate");
  }
  const [hedged, hasHedged] = getPath(manifest, "premortem", "top_risks_hedged");
  if (hasMaterial && pyTruthy(material)) {
    check(results, "pre_mortem",
      "premortem_top_risks_hedged_for_material_decision",
      hedged, hasHedged, hedged === true,
      "fix or hedge the pre-mortem's top failure reasons now");
  } else {
    check(results, "pre_mortem",
      "premortem_top_risks_hedged_for_material_decision",
      material, hasMaterial, true,
      "decision is not declared material — pre-mortem risk hedging is not required");
  }

  // ---- Section 6: rush_and_mood_trap (red line) ----
  const irreversible = hasClassification && classification === "irreversible";
  const [madeInRush, hasRush] = getPath(manifest, "rush", "made_in_rush");
  if (irreversible) {
    check(results, "rush_and_mood_trap",
      "irreversible_decision_not_made_in_rush",
      madeInRush, hasRush, madeInRush === false,
      "no irreversible decision made in a rush");
  } else {
    check(results, "rush_and_mood_trap",
      "irreversible_decision_not_made_in_rush",
      classification, hasClassification, true,
      "decision is not classified irreversible — the rush red line does not bind it");
  }
  const [madeInMood, hasMood] = getPath(manifest, "rush", "made_in_a_mood");
  if (irreversible) {
    check(results, "rush_and_mood_trap",
      "irreversible_decision_not_made_in_a_mood",
      madeInMood, hasMood, madeInMood === false,
      "no irreversible decision made in a mood");
  } else {
    check(results, "rush_and_mood_trap",
      "irreversible_decision_not_made_in_a_mood",
      classification, hasClassification, true,
      "decision is not classified irreversible — the mood red line does not bind it");
  }

  // ---- Section 7: decision_log_and_review (method 7-8, quality
  //      gate 4) ----
  boolCheck(results, "decision_log_and_review", "choice_logged",
    manifest, ["log", "choice_recorded"],
    "the choice is logged");
  boolCheck(results, "decision_log_and_review", "rationale_logged",
    manifest, ["log", "rationale_recorded"],
    "the rationale is logged");
  boolCheck(results, "decision_log_and_review",
    "assumptions_logged", manifest,
    ["log", "assumptions_recorded"],
    "the assumptions behind the choice are logged");
  boolCheck(results, "decision_log_and_review", "review_date_set",
    manifest, ["log", "review_date_set"],
    "a review date is set — review on schedule: outcomes vs expectations; separate luck from process; update");
  boolCheck(results, "decision_log_and_review",
    "decision_communicated_with_why", manifest,
    ["log", "communicated_with_why"],
    "the decision is communicated with the 'why'");

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
    verdict = "TRAPS_PRESENT";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "TRAP_CLEAR";
  }

  const count = (status: CheckStatus) =>
    results.filter((r) => r.status === status).length;

  return {
    service: "decision-trap-sweep",
    atom_version: "0.1.0",
    decision: manifest["decision"] ?? null,
    verdict,
    sections,
    checks: results,
    summary:
      `${count("pass")} pass, ` +
      `${count("fail")} fail, ` +
      `${count("missing")} missing ` +
      `of ${results.length} checks across seven sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "DECISION-TRAP SWEEP",
    `decision: ${pyStr(verdict.decision ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(28)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
