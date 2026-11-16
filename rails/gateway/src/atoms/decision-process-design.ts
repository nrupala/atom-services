// Decision process design — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/decision-process-design/src/decision_process_design.py
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
  decision: "string",
  framing: {
    decision_named: "boolean",
    decision_maker_identified: "boolean",
    objective_stated: "boolean",
    decision_maker_defines_what_matters: "boolean",
    analyst_informs_not_decides: "boolean",
    analysis_makes_the_call_present: "boolean",
  },
  options: [{
    name: "string",
    viable: "boolean",
  }],
  criteria: [{
    name: "string",
    set_before_data: "boolean",
    threshold_declared: "boolean",
  }],
  precommitment: {
    default_action: "string",
    change_my_mind_threshold_stated: "boolean",
    criteria_and_thresholds_set_before_data_seen: "boolean",
    data_seen_before_criteria_set_present: "boolean",
  },
  loss: {
    loss_function_framed: "boolean",
    cost_of_being_wrong_in_each_direction_stated: "boolean",
    cost_of_false_action: "number",
    cost_of_false_inaction: "number",
    asymmetric_costs_declared: "boolean",
    threshold_adjusted_for_asymmetric_costs: "boolean",
  },
  rigor: {
    stakes_assessed: "boolean",
    reversibility_assessed: "boolean",
    effort_matched_to_stakes_and_reversibility: "boolean",
    data_gathering_worth_assessed: "boolean",
    irreversible_declared: "boolean",
    slowed_down_and_more_evidence_for_irreversible: "boolean",
    reversible_declared: "boolean",
    default_to_action_for_reversible: "boolean",
  },
  evidence: {
    exploratory_and_confirmatory_distinguished: "boolean",
    confirmatory_analysis_used: "boolean",
    hypothesis_preregistered: "boolean",
    conclusion_drawn_from_inspiring_data_present: "boolean",
    evidence_has_power_to_change_decision: "boolean",
    data_is_decoration_present: "boolean",
    acted_per_preset_criteria_after_gathering: "boolean",
  },
  review: {
    decision_quality_reviewed_separately_from_outcome: "boolean",
    decision_judged_by_process_and_information_at_time: "boolean",
    outcome_used_alone_to_judge_present: "boolean",
  },
};

export const SECTIONS = [
  "framing_and_roles",
  "precommitment_before_data",
  "loss_stakes_and_rigor",
  "evidence_discipline_and_review",
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
  decision: unknown;
  verdict: string;
  sections: Record<string, string>;
  checks: CheckResult[];
  computed_status: string | null;
  options_count: number | null;
  options_without_name: string[] | null;
  options_not_declared_viable: string[] | null;
  option_name_coverage: string | null;
  criteria_count: number | null;
  criteria_without_name: string[] | null;
  criteria_not_set_before_data: string[] | null;
  criteria_without_threshold: string[] | null;
  criterion_set_before_data_coverage: string | null;
  criterion_threshold_coverage: string | null;
  default_action: unknown;
  loss_cost_ratio: string | null;
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

function hasName(entry: unknown): boolean {
  return isPyDict(entry) && typeof entry["name"] === "string" &&
    (entry["name"] as string).length > 0;
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
  const [optionsRaw, hasOptions] = getPath(manifest, "options");
  const optionsIsList = hasOptions && Array.isArray(optionsRaw);
  const options: unknown[] = optionsIsList ? (optionsRaw as unknown[]) : [];
  const [criteriaRaw, hasCriteria] = getPath(manifest, "criteria");
  const criteriaIsList = hasCriteria && Array.isArray(criteriaRaw);
  const criteria: unknown[] = criteriaIsList ? (criteriaRaw as unknown[]) : [];

  const optionsCount: number | null = optionsIsList ? options.length : null;
  const criteriaCount: number | null = criteriaIsList ? criteria.length : null;

  const optionsWithoutName: string[] | null = optionsIsList
    ? options.filter((o) => !hasName(o)).map(rowName)
    : null;
  const optionsNotViable: string[] | null = optionsIsList
    ? options.filter((o) => !(isPyDict(o) && o["viable"] === true)).map(rowName)
    : null;
  const optionNameCoverage: number | null =
    optionsIsList && optionsCount !== null && optionsCount > 0 &&
      optionsWithoutName !== null
      ? (optionsCount - optionsWithoutName.length) / optionsCount
      : null;

  const criteriaWithoutName: string[] | null = criteriaIsList
    ? criteria.filter((c) => !hasName(c)).map(rowName)
    : null;
  const criteriaNotBefore: string[] | null = criteriaIsList
    ? criteria.filter((c) => !(isPyDict(c) && c["set_before_data"] === true)).map(rowName)
    : null;
  const criteriaWithoutThreshold: string[] | null = criteriaIsList
    ? criteria.filter((c) => !(isPyDict(c) && c["threshold_declared"] === true)).map(rowName)
    : null;
  const criterionBeforeCoverage: number | null =
    criteriaIsList && criteriaCount !== null && criteriaCount > 0 &&
      criteriaNotBefore !== null
      ? (criteriaCount - criteriaNotBefore.length) / criteriaCount
      : null;
  const criterionThresholdCoverage: number | null =
    criteriaIsList && criteriaCount !== null && criteriaCount > 0 &&
      criteriaWithoutThreshold !== null
      ? (criteriaCount - criteriaWithoutThreshold.length) / criteriaCount
      : null;

  const [defaultAction, hasDefault] = getPath(manifest, "precommitment", "default_action");
  const defaultMatches = optionsIsList && typeof defaultAction === "string" &&
    options.some((o) => isPyDict(o) && o["name"] === defaultAction);

  const [costAction, hasCostAction] = getPath(manifest, "loss", "cost_of_false_action");
  const [costInaction, hasCostInaction] = getPath(manifest, "loss", "cost_of_false_inaction");
  const hasBothCosts = hasCostAction && hasCostInaction;
  const lossCostRatio: number | null =
    hasBothCosts && typeof costAction === "number" &&
      typeof costInaction === "number" && costInaction !== 0
      ? costAction / costInaction
      : null;

  // ---- Section 1: framing_and_roles ----
  boolCheck(results, "framing_and_roles", "decision_named", manifest,
    ["framing", "decision_named"],
    "process checklist step 1: the decision itself is named — what is actually being decided");
  check(results, "framing_and_roles", "options_declared",
    optionsRaw, optionsIsList,
    optionsIsList && (optionsCount as number) > 0,
    "process checklist step 1: the declared record names the real options — the options list is present and non-empty");
  const namePresent = optionsIsList &&
    options.every((o) => hasField(o, "name"));
  check(results, "framing_and_roles", "every_option_named",
    optionsRaw, namePresent,
    optionsIsList && (optionsCount as number) > 0 &&
      optionsWithoutName !== null && optionsWithoutName.length === 0,
    "process checklist step 1: every declared option row names the option");
  const viablePresent = optionsIsList &&
    options.every((o) => hasField(o, "viable"));
  check(results, "framing_and_roles", "every_option_declared_viable",
    optionsRaw, viablePresent,
    optionsIsList && (optionsCount as number) > 0 &&
      optionsNotViable !== null && optionsNotViable.length === 0,
    "process checklist step 1: every declared option row declares the option viable — a real option, not a straw option");
  boolCheck(results, "framing_and_roles", "decision_maker_identified", manifest,
    ["framing", "decision_maker_identified"],
    "process checklist step 2: the decision-maker is identified");
  boolCheck(results, "framing_and_roles", "objective_stated", manifest,
    ["framing", "objective_stated"],
    "process checklist step 2: what the decision-maker actually cares about — the objective — is stated");
  boolCheck(results, "framing_and_roles", "decision_maker_defines_what_matters", manifest,
    ["framing", "decision_maker_defines_what_matters"],
    "roles clear: the decision-maker frames the decision and defines what matters and the thresholds");
  boolCheck(results, "framing_and_roles", "analyst_informs_not_decides", manifest,
    ["framing", "analyst_informs_not_decides"],
    "roles clear: the analyst informs the decision — the analyst does not make it");
  falseCheck(results, "framing_and_roles", "no_analysis_makes_the_call", manifest,
    ["framing", "analysis_makes_the_call_present"],
    "roles clear: analysis does not quietly make the call");

  // ---- Section 2: precommitment_before_data ----
  check(results, "precommitment_before_data", "criteria_declared",
    criteriaRaw, criteriaIsList,
    criteriaIsList && (criteriaCount as number) > 0,
    "decide how to decide before the data: the declared record names its decision criteria — the criteria list is present and non-empty");
  const critNamePresent = criteriaIsList &&
    criteria.every((c) => hasField(c, "name"));
  check(results, "precommitment_before_data", "every_criterion_named",
    criteriaRaw, critNamePresent,
    criteriaIsList && (criteriaCount as number) > 0 &&
      criteriaWithoutName !== null && criteriaWithoutName.length === 0,
    "decide how to decide before the data: every declared criterion row names the criterion");
  const beforePresent = criteriaIsList &&
    criteria.every((c) => hasField(c, "set_before_data"));
  check(results, "precommitment_before_data", "every_criterion_set_before_data",
    criteriaRaw, beforePresent,
    criteriaIsList && (criteriaCount as number) > 0 &&
      criteriaNotBefore !== null && criteriaNotBefore.length === 0,
    "decide how to decide before the data: every declared criterion row declares it was set before the data was seen");
  const thresholdPresent = criteriaIsList &&
    criteria.every((c) => hasField(c, "threshold_declared"));
  check(results, "precommitment_before_data", "every_criterion_threshold_declared",
    criteriaRaw, thresholdPresent,
    criteriaIsList && (criteriaCount as number) > 0 &&
      criteriaWithoutThreshold !== null && criteriaWithoutThreshold.length === 0,
    "decide how to decide before the data: every declared criterion row declares its threshold");
  check(results, "precommitment_before_data", "default_action_matches_declared_option",
    defaultAction, hasDefault && optionsIsList,
    defaultMatches,
    "default action: the declared default action names one of the declared real options");
  boolCheck(results, "precommitment_before_data", "change_my_mind_threshold_stated", manifest,
    ["precommitment", "change_my_mind_threshold_stated"],
    "default action + change-my-mind threshold: exactly what evidence would flip the default is pre-committed, answered before looking");
  boolCheck(results, "precommitment_before_data", "criteria_and_thresholds_set_before_data_seen", manifest,
    ["precommitment", "criteria_and_thresholds_set_before_data_seen"],
    "decide how to decide before you see the data: the decision criteria, default action and thresholds are set in advance, before the data");
  falseCheck(results, "precommitment_before_data", "no_data_seen_before_precommitment", manifest,
    ["precommitment", "data_seen_before_criteria_set_present"],
    "decide how to decide before you see the data: the data was not seen before the criteria were set — no post-hoc rationalization");

  // ---- Section 3: loss_stakes_and_rigor ----
  boolCheck(results, "loss_stakes_and_rigor", "loss_function_framed", manifest,
    ["loss", "loss_function_framed"],
    "frame the loss function: what being wrong costs is framed — what actually matters, not a tidy metric");
  boolCheck(results, "loss_stakes_and_rigor", "cost_of_being_wrong_in_each_direction_stated", manifest,
    ["loss", "cost_of_being_wrong_in_each_direction_stated"],
    "frame the loss function: the cost of being wrong is stated in each direction");
  check(results, "loss_stakes_and_rigor", "loss_costs_both_directions_declared",
    costAction, hasBothCosts,
    hasBothCosts && typeof costAction === "number" &&
      typeof costInaction === "number" &&
      (costAction as number) >= 0 && (costInaction as number) >= 0,
    "frame the loss function: a numeric cost is declared for being wrong in each direction — acting wrongly and not acting wrongly");
  gatedBoolCheck(results, "loss_stakes_and_rigor",
    "threshold_adjusted_when_costs_asymmetric", manifest,
    ["loss", "asymmetric_costs_declared"],
    ["loss", "threshold_adjusted_for_asymmetric_costs"],
    "frame the loss function: asymmetric costs move the threshold — the threshold is adjusted for the declared asymmetry",
    "no asymmetric costs declared");
  boolCheck(results, "loss_stakes_and_rigor", "stakes_assessed", manifest,
    ["rigor", "stakes_assessed"],
    "right-size the rigor: the stakes are assessed");
  boolCheck(results, "loss_stakes_and_rigor", "reversibility_assessed", manifest,
    ["rigor", "reversibility_assessed"],
    "right-size the rigor: reversibility is assessed — two-way-door or one-way-door");
  boolCheck(results, "loss_stakes_and_rigor", "effort_matched_to_stakes_and_reversibility", manifest,
    ["rigor", "effort_matched_to_stakes_and_reversibility"],
    "right-size the rigor: effort is matched to stakes and reversibility");
  boolCheck(results, "loss_stakes_and_rigor", "data_gathering_worth_assessed", manifest,
    ["rigor", "data_gathering_worth_assessed"],
    "process checklist step 4: how much data and analysis is worth gathering is decided, given stakes and reversibility");
  gatedBoolCheck(results, "loss_stakes_and_rigor",
    "slowed_down_when_irreversible", manifest,
    ["rigor", "irreversible_declared"],
    ["rigor", "slowed_down_and_more_evidence_for_irreversible"],
    "right-size the rigor: an irreversible or expensive one-way-door decision is slowed down and more evidence is gathered",
    "no irreversible decision declared");
  gatedBoolCheck(results, "loss_stakes_and_rigor",
    "default_to_action_when_reversible", manifest,
    ["rigor", "reversible_declared"],
    ["rigor", "default_to_action_for_reversible"],
    "right-size the rigor: a reversible two-way-door decision defaults to action and is decided fast",
    "no reversible decision declared");

  // ---- Section 4: evidence_discipline_and_review ----
  boolCheck(results, "evidence_discipline_and_review", "exploratory_and_confirmatory_distinguished", manifest,
    ["evidence", "exploratory_and_confirmatory_distinguished"],
    "data-driven vs data-inspired: exploratory analysis, which generates hypotheses, is distinguished from confirmatory analysis, which tests a pre-registered hypothesis");
  gatedBoolCheck(results, "evidence_discipline_and_review",
    "hypothesis_preregistered_when_confirmatory", manifest,
    ["evidence", "confirmatory_analysis_used"],
    ["evidence", "hypothesis_preregistered"],
    "data-driven vs data-inspired: the confirmatory analysis tests a pre-registered hypothesis",
    "no confirmatory analysis declared in use");
  falseCheck(results, "evidence_discipline_and_review", "no_conclusion_from_inspiring_data", manifest,
    ["evidence", "conclusion_drawn_from_inspiring_data_present"],
    "data-driven vs data-inspired: no conclusion is drawn from the same data that inspired it");
  boolCheck(results, "evidence_discipline_and_review", "evidence_has_power_to_change_decision", manifest,
    ["evidence", "evidence_has_power_to_change_decision"],
    "do not be a data-driven fool: the evidence has the power to change the decision — some possible data could change the action");
  falseCheck(results, "evidence_discipline_and_review", "no_data_decoration", manifest,
    ["evidence", "data_is_decoration_present"],
    "do not be a data-driven fool: the data is not decoration — it is not gathered when no possible data could change the action");
  boolCheck(results, "evidence_discipline_and_review", "acted_per_preset_criteria_after_gathering", manifest,
    ["evidence", "acted_per_preset_criteria_after_gathering"],
    "process checklist step 5: after gathering, the action is taken per the pre-set criteria");
  boolCheck(results, "evidence_discipline_and_review", "decision_quality_reviewed_separately_from_outcome", manifest,
    ["review", "decision_quality_reviewed_separately_from_outcome"],
    "process checklist step 6: decision quality is reviewed separately from the outcome");
  boolCheck(results, "evidence_discipline_and_review", "decision_judged_by_process_and_information_at_time", manifest,
    ["review", "decision_judged_by_process_and_information_at_time"],
    "decisions are not outcomes: the decision is judged by the process and the information available at the time");
  falseCheck(results, "evidence_discipline_and_review", "no_outcome_alone_judgment", manifest,
    ["review", "outcome_used_alone_to_judge_present"],
    "decisions are not outcomes: the outcome alone is not used to judge the decision — no resulting or outcome bias");

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
    verdict = "DECISION_PROCESS_NOT_SOUND";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "DECISION_PROCESS_SOUND";
  }

  const computedNames = [
    "options_declared",
    "every_option_named",
    "every_option_declared_viable",
    "criteria_declared",
    "every_criterion_named",
    "every_criterion_set_before_data",
    "every_criterion_threshold_declared",
    "default_action_matches_declared_option",
    "loss_costs_both_directions_declared",
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
    service: "decision-process-design",
    atom_version: "0.1.0",
    decision: manifest["decision"] ?? null,
    verdict,
    sections,
    checks: results,
    computed_status: computedStatus,
    options_count: optionsCount,
    options_without_name: optionsWithoutName,
    options_not_declared_viable: optionsNotViable,
    option_name_coverage: fmt4(optionNameCoverage),
    criteria_count: criteriaCount,
    criteria_without_name: criteriaWithoutName,
    criteria_not_set_before_data: criteriaNotBefore,
    criteria_without_threshold: criteriaWithoutThreshold,
    criterion_set_before_data_coverage: fmt4(criterionBeforeCoverage),
    criterion_threshold_coverage: fmt4(criterionThresholdCoverage),
    default_action: hasDefault ? defaultAction : null,
    loss_cost_ratio: fmt4(lossCostRatio),
    summary:
      `${count("pass")} pass, ` +
      `${count("fail")} fail, ` +
      `${count("missing")} missing ` +
      `of ${results.length} checks across four sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "DECISION PROCESS DESIGN",
    `decision: ${pyStr(verdict.decision ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(36)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
