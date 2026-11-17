// Statistical study design report — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/statistical-study-design-report/src/statistical_study_design_report.py
// (evaluate() + stamp()). No logic changes: every verdict, section
// outcome, per-check status, evidence string, computed field and
// the summary string are byte-identical to the Python output for
// the same input. Computed ratios use the shared fixed
// serialization: round half up to 6dp —
// floor(v * 1000000 + 0.5) / 1000000 — then format with exactly six
// decimals; the total sample-size comparison is made on those 6dp
// serializations of the declared and recomputed values.

import { pyStr } from "./release-readiness.js";
import { validateManifest, type FieldSpec } from "./validate.js";

const MANIFEST_SPEC: { [field: string]: FieldSpec } = {
  study_title: "string",
  framing: {
    decision_stated: "boolean",
    research_question_stated: "boolean",
    outcome_defined: "boolean",
    unit_of_analysis_defined: "boolean",
    population_defined: "boolean",
    timeframe_defined: "boolean",
  },
  design: {
    design_type: "string",
    assignment_mechanism_stated: "boolean",
    estimand_stated: "boolean",
    confounders_identified: "boolean",
  },
  variables: [{
    variable_id: "string",
    role: "string",
  }],
  sampling: {
    sampling_frame_defined: "boolean",
    sampling_method_stated: "boolean",
    inclusion_exclusion_criteria_stated: "boolean",
    power_analysis_done_before_collection: "boolean",
    declared_total_sample_size: "number",
    declared_alpha: "number",
    declared_target_power: "number",
    declared_effect_size: "number",
  },
  groups: [{
    group_id: "string",
    declared_size: "number",
  }],
  analysis: {
    plan_written_before_collection: "boolean",
    plan_preregistered: "boolean",
    primary_method_named: "boolean",
    assumption_checks_planned: "boolean",
    effect_size_with_uncertainty_planned: "boolean",
    multiple_comparison_discipline_planned: "boolean",
    deviations_logging_planned: "boolean",
  },
  validation: {
    sensitivity_analyses_planned: "boolean",
    robustness_checks_planned: "boolean",
    leakage_audit_planned: "boolean",
    limitations_section_planned: "boolean",
    what_would_change_conclusion_stated: "boolean",
  },
  delivery: {
    executive_summary_planned: "boolean",
    methods_memo_planned: "boolean",
    reproducible_appendix_planned: "boolean",
    pipeline_sealed_for_rerun: "boolean",
  },
  red_lines: {
    significance_without_effect_size_and_uncertainty_present: "boolean",
    p_hacking_or_selective_reporting_present: "boolean",
    causal_language_from_observational_without_design_present: "boolean",
    unredacted_pii_or_unapproved_reuse_present: "boolean",
    outcome_guarantee_present: "boolean",
  },
};

export const SECTIONS = [
  "decision_framing",
  "design_and_variables",
  "sampling_and_power",
  "analysis_plan",
  "validation_and_bias_controls",
  "delivery_and_reproducibility",
  "red_lines",
] as const;

const DESIGN_TYPES = [
  "randomized_experiment",
  "factorial_experiment",
  "sequential_experiment",
  "quasi_experiment",
  "observational",
];

const VARIABLE_ROLES = [
  "outcome",
  "exposure",
  "predictor",
  "confounder",
  "covariate",
  "stratification",
];

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
  study_title: unknown;
  verdict: string;
  sections: Record<string, string>;
  checks: CheckResult[];
  computed_status: string | null;
  variables_count: number | null;
  outcome_variable_count: number | null;
  duplicate_variable_ids: string[] | null;
  variables_with_unrecognised_role: string[] | null;
  groups_count: number | null;
  duplicate_group_ids: string[] | null;
  computed_total_sample_size: number | null;
  declared_total_sample_size: number | null;
  total_sample_size_difference: number | null;
  largest_group_share: string | null;
  declared_alpha: number | null;
  declared_target_power: number | null;
  declared_effect_size: number | null;
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

function isPositiveWhole(value: unknown): boolean {
  return isNumber(value) && Number.isInteger(value) && value >= 1;
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

export function evaluate(manifest: unknown): Verdict {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateManifest(manifest, MANIFEST_SPEC);
  const results: CheckResult[] = [];

  const [variablesRaw, hasVariables] = getPath(manifest, "variables");
  const variablesIsList = hasVariables && Array.isArray(variablesRaw);
  const vrows: unknown[] = variablesIsList ? (variablesRaw as unknown[]) : [];
  const variablesCount: number | null = variablesIsList ? vrows.length : null;

  const [groupsRaw, hasGroups] = getPath(manifest, "groups");
  const groupsIsList = hasGroups && Array.isArray(groupsRaw);
  const grows: unknown[] = groupsIsList ? (groupsRaw as unknown[]) : [];
  const groupsCount: number | null = groupsIsList ? grows.length : null;

  const duplicateVariableIds: string[] | null = variablesIsList
    ? duplicates(vrows, "variable_id") : null;
  const duplicateGroupIds: string[] | null = groupsIsList
    ? duplicates(grows, "group_id") : null;
  const outcomeVariableCount: number | null = variablesIsList
    ? vrows.filter((c) => isPyDict(c) && c["role"] === "outcome").length
    : null;
  const variablesWithUnrecognisedRole: string[] | null = variablesIsList
    ? vrows.filter((c) => isPyDict(c) && typeof c["role"] === "string" &&
        !VARIABLE_ROLES.includes(c["role"] as string))
        .map((c) => rowName(c, "variable_id"))
    : null;
  const computedTotalSampleSize: number | null =
    groupsIsList && grows.length > 0 &&
      grows.every((c) => isPyDict(c) && isNumber(c["declared_size"]))
      ? grows.reduce<number>(
          (acc, c) => acc + ((c as Record<string, unknown>)["declared_size"] as number),
          0)
      : null;
  const [declaredTotal, hasDeclaredTotal] = getPath(manifest,
    "sampling", "declared_total_sample_size");
  const declaredTotalOut: number | null =
    hasDeclaredTotal && isNumber(declaredTotal) ? declaredTotal : null;
  const totalDifference: number | null =
    declaredTotalOut !== null && computedTotalSampleSize !== null
      ? declaredTotalOut - computedTotalSampleSize : null;
  const largestGroupShare: number | null =
    computedTotalSampleSize !== null && computedTotalSampleSize !== 0
      ? Math.max(...grows.map(
          (c) => (c as Record<string, unknown>)["declared_size"] as number))
        / computedTotalSampleSize
      : null;
  const [alpha, hasAlpha] = getPath(manifest, "sampling", "declared_alpha");
  const [targetPower, hasPower] = getPath(manifest,
    "sampling", "declared_target_power");
  const [effectSize, hasEffect] = getPath(manifest,
    "sampling", "declared_effect_size");
  const alphaOut: number | null = hasAlpha && isNumber(alpha) ? alpha : null;
  const powerOut: number | null =
    hasPower && isNumber(targetPower) ? targetPower : null;
  const effectOut: number | null =
    hasEffect && isNumber(effectSize) ? effectSize : null;

  // ---- Section 1: decision_framing ----
  boolCheck(results, "decision_framing",
    "study_design_decision_stated_before_design", manifest,
    ["framing", "decision_stated"],
    "intake: the decision that changes with the answer is stated and written before the design");
  boolCheck(results, "decision_framing",
    "study_design_research_question_stated", manifest,
    ["framing", "research_question_stated"],
    "intake: the research question the study answers is stated");
  boolCheck(results, "decision_framing",
    "study_design_primary_outcome_defined", manifest,
    ["framing", "outcome_defined"],
    "intake: the outcome is defined before design");
  boolCheck(results, "decision_framing",
    "study_design_unit_of_analysis_defined", manifest,
    ["framing", "unit_of_analysis_defined"],
    "intake: the unit of analysis is defined");
  boolCheck(results, "decision_framing",
    "study_design_target_population_defined", manifest,
    ["framing", "population_defined"],
    "intake: the target population is defined");
  boolCheck(results, "decision_framing",
    "study_design_timeframe_defined", manifest,
    ["framing", "timeframe_defined"],
    "intake: the timeframe is defined");

  // ---- Section 2: design_and_variables ----
  const [designType, hasDesignType] = getPath(manifest,
    "design", "design_type");
  check(results, "design_and_variables",
    "study_design_type_recognised", designType, hasDesignType,
    hasDesignType && DESIGN_TYPES.includes(designType as string),
    "design: the declared design type is one of randomized_experiment, factorial_experiment, sequential_experiment, quasi_experiment, observational");
  boolCheck(results, "design_and_variables",
    "study_design_assignment_mechanism_stated", manifest,
    ["design", "assignment_mechanism_stated"],
    "design: the assignment or exposure mechanism is stated (randomization, factorial allocation, blocking, sequential rule, or observational exposure as the design provides)");
  boolCheck(results, "design_and_variables",
    "study_design_estimand_stated", manifest,
    ["design", "estimand_stated"],
    "design: the target estimand is stated");
  boolCheck(results, "design_and_variables",
    "study_design_confounders_identified", manifest,
    ["design", "confounders_identified"],
    "design: confounders are identified, with matching or weighting declared where the design uses them");
  check(results, "design_and_variables",
    "study_design_variables_list_declared", variablesRaw, variablesIsList,
    variablesIsList && variablesCount !== null && variablesCount > 0,
    "the declared record names its variables — the variables list is present and names at least one variable; an absent list is missing evidence and an empty list declares no variables at all");
  const varIdPresent = variablesIsList &&
    vrows.every((c) => hasField(c, "variable_id"));
  check(results, "design_and_variables",
    "study_design_every_variable_id_unique", variablesRaw, varIdPresent,
    variablesIsList && duplicateVariableIds !== null &&
      duplicateVariableIds.length === 0,
    "variables: no declared variable_id is owned by more than one row");
  const varRolePresent = variablesIsList &&
    vrows.every((c) => hasField(c, "role"));
  check(results, "design_and_variables",
    "study_design_every_variable_role_recognised", variablesRaw,
    varRolePresent,
    variablesIsList &&
      vrows.every((c) => isPyDict(c) &&
        VARIABLE_ROLES.includes(c["role"] as string)),
    "variables: every declared variable's role is one of outcome, exposure, predictor, confounder, covariate, stratification");
  check(results, "design_and_variables",
    "study_design_at_least_one_outcome_variable_declared", variablesRaw,
    varRolePresent,
    variablesIsList && outcomeVariableCount !== null &&
      outcomeVariableCount >= 1,
    "variables: at least one declared variable has the outcome role — the intake outcome is among the declared variables");

  // ---- Section 3: sampling_and_power ----
  boolCheck(results, "sampling_and_power",
    "study_design_sampling_frame_defined", manifest,
    ["sampling", "sampling_frame_defined"],
    "sampling: the sampling frame is defined");
  boolCheck(results, "sampling_and_power",
    "study_design_sampling_method_stated", manifest,
    ["sampling", "sampling_method_stated"],
    "sampling: the sampling method is stated");
  boolCheck(results, "sampling_and_power",
    "study_design_inclusion_exclusion_criteria_stated", manifest,
    ["sampling", "inclusion_exclusion_criteria_stated"],
    "sampling: inclusion and exclusion criteria are stated");
  boolCheck(results, "sampling_and_power",
    "study_design_power_analysis_done_before_collection", manifest,
    ["sampling", "power_analysis_done_before_collection"],
    "design: power / precision analysis is done before collection, not after");
  check(results, "sampling_and_power",
    "study_design_groups_list_declared", groupsRaw, groupsIsList,
    groupsIsList && groupsCount !== null && groupsCount > 0,
    "the declared record names its groups — the groups list is present and names at least one group; an absent list is missing evidence and an empty list declares no groups at all");
  const groupIdPresent = groupsIsList &&
    grows.every((c) => hasField(c, "group_id"));
  check(results, "sampling_and_power",
    "study_design_every_group_id_unique", groupsRaw, groupIdPresent,
    groupsIsList && duplicateGroupIds !== null &&
      duplicateGroupIds.length === 0,
    "groups: no declared group_id is owned by more than one row");
  const groupSizePresent = groupsIsList &&
    grows.every((c) => hasField(c, "declared_size") &&
      isNumber((c as Record<string, unknown>)["declared_size"]));
  check(results, "sampling_and_power",
    "study_design_every_group_size_positive_whole", groupsRaw,
    groupSizePresent,
    groupsIsList &&
      grows.every((c) => isPyDict(c) &&
        isPositiveWhole(c["declared_size"])),
    "groups: every declared group size is a positive whole number (at least one)");
  const totalPresent = groupsIsList && grows.length > 0 &&
    hasDeclaredTotal && groupSizePresent;
  check(results, "sampling_and_power",
    "study_design_total_sample_size_matches_group_sum", groupsRaw,
    totalPresent,
    totalPresent && valuesMatch(declaredTotal, computedTotalSampleSize),
    "sample size: the declared total sample size equals the sum of the declared group sizes (6dp serialization)");
  check(results, "sampling_and_power",
    "study_design_alpha_in_valid_probability_range", alpha, hasAlpha,
    hasAlpha && isNumber(alpha) && alpha > 0 && alpha < 1,
    "power inputs: the declared alpha is a probability — strictly between 0 and 1");
  check(results, "sampling_and_power",
    "study_design_target_power_in_valid_probability_range", targetPower,
    hasPower,
    hasPower && isNumber(targetPower) && targetPower > 0 && targetPower < 1,
    "power inputs: the declared target power is a probability — strictly between 0 and 1");
  check(results, "sampling_and_power",
    "study_design_effect_size_nonzero", effectSize, hasEffect,
    hasEffect && isNumber(effectSize) && effectSize !== 0,
    "power inputs: the declared effect size is non-zero — a zero effect is the null, not an effect to detect");

  // ---- Section 4: analysis_plan ----
  boolCheck(results, "analysis_plan",
    "study_design_analysis_plan_written_before_collection", manifest,
    ["analysis", "plan_written_before_collection"],
    "analysis plan: the analysis plan is written before collection");
  boolCheck(results, "analysis_plan",
    "study_design_analysis_plan_preregistered", manifest,
    ["analysis", "plan_preregistered"],
    "analysis plan: the analysis plan is pre-registered");
  boolCheck(results, "analysis_plan",
    "study_design_primary_analysis_method_named", manifest,
    ["analysis", "primary_method_named"],
    "analysis plan: the primary analysis method is named (the model ladder starts simple)");
  boolCheck(results, "analysis_plan",
    "study_design_assumption_checks_planned", manifest,
    ["analysis", "assumption_checks_planned"],
    "analysis plan: assumption checks are planned — assumptions tested, not assumed");
  boolCheck(results, "analysis_plan",
    "study_design_effect_size_with_uncertainty_planned", manifest,
    ["analysis", "effect_size_with_uncertainty_planned"],
    "analysis plan: effect sizes with uncertainty (confidence / credible intervals) are planned — never bare p-values");
  boolCheck(results, "analysis_plan",
    "study_design_multiple_comparison_discipline_planned", manifest,
    ["analysis", "multiple_comparison_discipline_planned"],
    "analysis plan: multiple-comparison discipline is planned");
  boolCheck(results, "analysis_plan",
    "study_design_analysis_plan_deviations_logging_planned", manifest,
    ["analysis", "deviations_logging_planned"],
    "quality gate: deviations from the analysis plan will be logged with reasons");

  // ---- Section 5: validation_and_bias_controls ----
  boolCheck(results, "validation_and_bias_controls",
    "study_design_sensitivity_analyses_planned", manifest,
    ["validation", "sensitivity_analyses_planned"],
    "validate: sensitivity analyses are planned");
  boolCheck(results, "validation_and_bias_controls",
    "study_design_robustness_checks_planned", manifest,
    ["validation", "robustness_checks_planned"],
    "validate: robustness to outliers and misspecification is planned");
  boolCheck(results, "validation_and_bias_controls",
    "study_design_leakage_audit_planned", manifest,
    ["validation", "leakage_audit_planned"],
    "intake audit: a leakage audit of the data is planned (with provenance and missingness)");
  boolCheck(results, "validation_and_bias_controls",
    "study_design_limitations_section_planned", manifest,
    ["validation", "limitations_section_planned"],
    "quality gate: a limitations section is planned and honest");
  boolCheck(results, "validation_and_bias_controls",
    "study_design_what_would_change_conclusion_stated", manifest,
    ["validation", "what_would_change_conclusion_stated"],
    "handoff: what would change the conclusion is documented");

  // ---- Section 6: delivery_and_reproducibility ----
  boolCheck(results, "delivery_and_reproducibility",
    "study_design_executive_summary_planned", manifest,
    ["delivery", "executive_summary_planned"],
    "deliver: a one-page executive summary is planned (findings, decisions, limitations)");
  boolCheck(results, "delivery_and_reproducibility",
    "study_design_methods_memo_planned", manifest,
    ["delivery", "methods_memo_planned"],
    "deliver: a methods memo is planned");
  boolCheck(results, "delivery_and_reproducibility",
    "study_design_reproducible_appendix_planned", manifest,
    ["delivery", "reproducible_appendix_planned"],
    "deliver: a reproducible appendix is planned (script, data checksums, environment)");
  boolCheck(results, "delivery_and_reproducibility",
    "study_design_pipeline_sealed_for_rerun", manifest,
    ["delivery", "pipeline_sealed_for_rerun"],
    "handoff: the pipeline is sealed so the analysis can be re-run when data updates");

  // ---- Section 7: red_lines ----
  falseCheck(results, "red_lines",
    "study_design_free_of_significance_without_uncertainty", manifest,
    ["red_lines",
     "significance_without_effect_size_and_uncertainty_present"],
    "red line: no significance reported without effect size and uncertainty is present in the record");
  falseCheck(results, "red_lines",
    "study_design_free_of_p_hacking_or_selective_reporting", manifest,
    ["red_lines", "p_hacking_or_selective_reporting_present"],
    "red line: no p-hacking or selective reporting is present in the record");
  falseCheck(results, "red_lines",
    "study_design_free_of_unsupported_causal_language", manifest,
    ["red_lines",
     "causal_language_from_observational_without_design_present"],
    "red line: no causal language from observational data without the design to back it is present in the record");
  falseCheck(results, "red_lines",
    "study_design_free_of_unredacted_pii_or_unapproved_reuse", manifest,
    ["red_lines", "unredacted_pii_or_unapproved_reuse_present"],
    "red line: no unredacted PII or unapproved reuse of client data is present in the record");
  falseCheck(results, "red_lines",
    "study_design_free_of_outcome_guarantees", manifest,
    ["red_lines", "outcome_guarantee_present"],
    "red line: no guarantee of outcomes is present in the record");

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
    verdict = "STUDY_DESIGN_NOT_READY";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "STUDY_DESIGN_READY";
  }

  const computedNames = [
    "study_design_type_recognised",
    "study_design_variables_list_declared",
    "study_design_every_variable_id_unique",
    "study_design_every_variable_role_recognised",
    "study_design_at_least_one_outcome_variable_declared",
    "study_design_groups_list_declared",
    "study_design_every_group_id_unique",
    "study_design_every_group_size_positive_whole",
    "study_design_total_sample_size_matches_group_sum",
    "study_design_alpha_in_valid_probability_range",
    "study_design_target_power_in_valid_probability_range",
    "study_design_effect_size_nonzero",
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
    service: "statistical-study-design-report",
    atom_version: "0.1.0",
    study_title: manifest["study_title"] ?? null,
    verdict,
    sections,
    checks: results,
    computed_status: computedStatus,
    variables_count: variablesCount,
    outcome_variable_count: outcomeVariableCount,
    duplicate_variable_ids: duplicateVariableIds,
    variables_with_unrecognised_role: variablesWithUnrecognisedRole,
    groups_count: groupsCount,
    duplicate_group_ids: duplicateGroupIds,
    computed_total_sample_size: computedTotalSampleSize,
    declared_total_sample_size: declaredTotalOut,
    total_sample_size_difference: totalDifference,
    largest_group_share: fmt6(largestGroupShare),
    declared_alpha: alphaOut,
    declared_target_power: powerOut,
    declared_effect_size: effectOut,
    summary:
      `${count("pass")} pass, ` +
      `${count("fail")} fail, ` +
      `${count("missing")} missing ` +
      `of ${results.length} checks across seven sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "STATISTICAL STUDY DESIGN REPORT",
    `study_title: ${pyStr(verdict.study_title ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(44)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
