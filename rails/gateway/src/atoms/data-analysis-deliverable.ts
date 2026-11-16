// Data analysis deliverable — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/data-analysis-deliverable/src/data_analysis_deliverable.py
// (evaluate() + stamp()). No logic changes: every verdict, section
// outcome, per-check status, evidence string, computed value and
// the summary string are byte-identical to the Python output for
// the same input. Computed figures use the shared fixed
// serialization: round half up to 6dp — floor(v * 1000000 + 0.5) /
// 1000000 — then format with exactly six decimals; comparisons use
// the unrounded values except the re-derivation checks, which
// compare the fixed-6dp difference to zero.

import { pyStr } from "./release-readiness.js";
import { validateManifest, type FieldSpec } from "./validate.js";

// Documented manifest field types (SERVICE.md input table) — the
// identical spec the Python oracle validates against. A field
// present with the wrong JSON type raises FieldTypeError before
// any check runs (F1 remedy, external verification Wave 1).
// Vocabulary strings (the data-source list entries) are validated
// as strings only, never enum-checked.
const MANIFEST_SPEC: { [field: string]: FieldSpec } = {
  question: "string",
  framing: {
    question_stated: "boolean",
    decision_named: "boolean",
    decision_owner_named: "boolean",
    decision_deadline_stated: "boolean",
    data_that_would_change_decision_stated: "boolean",
  },
  data: {
    sources: ["string"],
    provenance_documented: "boolean",
    coverage_documented: "boolean",
    definitions_documented: "boolean",
    metrics_have_single_definition: "boolean",
    gaps_documented: "boolean",
    biases_documented: "boolean",
  },
  analysis: {
    distributions_shown: "boolean",
    segments_shown: "boolean",
    trends_on_comparable_windows: "boolean",
    cherry_picked_baselines_used: "boolean",
    decomposition_performed: "boolean",
    cohort_views_shown: "boolean",
    mechanisms_triangulated: "boolean",
  },
  figures: {
    values: ["number"],
    stated_total: "number",
    stated_mean: "number",
    prior_window_value: "number",
    current_window_value: "number",
    stated_percent_change: "number",
  },
  inference: {
    sample_size_or_power_considered: "boolean",
    uncertainty_stated: "boolean",
    practical_vs_statistical_significance_distinguished: "boolean",
    multiple_comparisons_checked: "boolean",
    causal_claims_from_observational_data_alone: "boolean",
  },
  recommendation: {
    so_what_stated: "boolean",
    recommendation_made: "boolean",
    expected_effect_stated: "boolean",
    recommendation_owner_named: "boolean",
    measurement_plan_stated: "boolean",
    uncertainty_stated_plainly: "boolean",
  },
  report: {
    covers_question_data_method_finding_recommendation_caveats: "boolean",
    is_one_page: "boolean",
    caveats_stated: "boolean",
    charts_oversell_findings: "boolean",
    numbers_reproducible: "boolean",
  },
  closure: {
    predicted_vs_actual_compared: "boolean",
    model_of_world_updated: "boolean",
  },
};

export const SECTIONS = [
  "question_framing",
  "data_provenance",
  "descriptive_and_diagnostic",
  "statistical_care",
  "insight_and_action",
  "reporting_and_reproducibility",
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
  question: unknown;
  verdict: string;
  sections: Record<string, string>;
  checks: CheckResult[];
  computed_status: string | null;
  recomputed_total: string | null;
  recomputed_mean: string | null;
  recomputed_percent_change: string | null;
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

function isNumber(value: unknown): boolean {
  return typeof value === "number";
}

function fmt6(value: number | null): string | null {
  if (value === null) return null;
  const rounded = Math.floor(value * 1000000 + 0.5) / 1000000;
  return rounded.toFixed(6);
}

export function evaluate(manifest: unknown): Verdict {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateManifest(manifest, MANIFEST_SPEC);
  const results: CheckResult[] = [];

  // ---- Section 1: question_framing ----
  boolCheck(results, "question_framing", "question_stated",
    manifest, ["framing", "question_stated"],
    "red line: no analysis without a question — the question is stated");
  boolCheck(results, "question_framing", "decision_named",
    manifest, ["framing", "decision_named"],
    "method step 1 / quality gate: the decision the analysis feeds is named before analysis");
  boolCheck(results, "question_framing", "decision_owner_named",
    manifest, ["framing", "decision_owner_named"],
    "method step 1 / quality gate: who decides is named — the decision owner");
  boolCheck(results, "question_framing", "decision_deadline_stated",
    manifest, ["framing", "decision_deadline_stated"],
    "method step 1: by when the decision is made is stated");
  boolCheck(results, "question_framing",
    "data_that_would_change_decision_stated",
    manifest, ["framing", "data_that_would_change_decision_stated"],
    "method step 1: what data would change the decision is stated");

  // ---- Section 2: data_provenance ----
  const [sources, hasSources] = getPath(manifest, "data", "sources");
  const sourcesIsList = hasSources && Array.isArray(sources);
  check(results, "data_provenance", "data_sources_declared",
    sources, sourcesIsList,
    sourcesIsList && (sources as unknown[]).length > 0,
    "method step 2: the data sources the analysis uses are declared — a present-but-empty list declares none");
  boolCheck(results, "data_provenance", "provenance_documented",
    manifest, ["data", "provenance_documented"],
    "method step 2 / quality gate: data provenance is documented");
  boolCheck(results, "data_provenance", "coverage_documented",
    manifest, ["data", "coverage_documented"],
    "method step 2: data coverage is documented");
  boolCheck(results, "data_provenance", "definitions_documented",
    manifest, ["data", "definitions_documented"],
    "method step 2 / quality gate: definitions are documented");
  boolCheck(results, "data_provenance", "metrics_have_single_definition",
    manifest, ["data", "metrics_have_single_definition"],
    "method step 2: every metric has a single definition — a metric with two definitions is a bug");
  boolCheck(results, "data_provenance", "gaps_documented",
    manifest, ["data", "gaps_documented"],
    "method step 2: gaps in the data are documented");
  boolCheck(results, "data_provenance", "biases_documented",
    manifest, ["data", "biases_documented"],
    "method step 2: biases in the data are documented");

  // ---- Section 3: descriptive_and_diagnostic ----
  boolCheck(results, "descriptive_and_diagnostic", "distributions_shown",
    manifest, ["analysis", "distributions_shown"],
    "method step 3 / quality gate: distributions are shown — distributions before averages");
  boolCheck(results, "descriptive_and_diagnostic", "segments_shown",
    manifest, ["analysis", "segments_shown"],
    "method step 3 / quality gate: segments are shown — segments before totals");
  boolCheck(results, "descriptive_and_diagnostic",
    "trends_on_comparable_windows",
    manifest, ["analysis", "trends_on_comparable_windows"],
    "method step 3: trends are shown on comparable windows");
  falseCheck(results, "descriptive_and_diagnostic",
    "no_cherry_picked_baselines",
    manifest, ["analysis", "cherry_picked_baselines_used"],
    "method step 3: no cherry-picked baselines");
  boolCheck(results, "descriptive_and_diagnostic", "decomposition_performed",
    manifest, ["analysis", "decomposition_performed"],
    "method step 4: what moved the metric is decomposed");
  boolCheck(results, "descriptive_and_diagnostic", "cohort_views_shown",
    manifest, ["analysis", "cohort_views_shown"],
    "method step 4: cohort views are shown");
  boolCheck(results, "descriptive_and_diagnostic", "mechanisms_triangulated",
    manifest, ["analysis", "mechanisms_triangulated"],
    "method step 4: mechanisms are triangulated");

  const [values, hasValues] = getPath(manifest, "figures", "values");
  const valuesIsList = hasValues && Array.isArray(values);
  const valuesUsable = valuesIsList && (values as unknown[]).length > 0;
  const sumValues = valuesUsable
    ? (values as number[]).reduce((a, b) => a + b, 0)
    : null;
  const totalValue: number | null = sumValues;
  const meanValue: number | null = valuesUsable
    ? (sumValues as number) / (values as unknown[]).length
    : null;
  const [statedTotal, hasTotal] = getPath(manifest, "figures", "stated_total");
  const totalPresent = valuesIsList && hasTotal;
  check(results, "descriptive_and_diagnostic",
    "stated_total_matches_declared_values", statedTotal,
    totalPresent,
    valuesUsable && isNumber(statedTotal) &&
      fmt6((statedTotal as number) - (totalValue as number)) === "0.000000",
    "method step 3: the stated total equals the sum of the declared segment values (segments before totals)");
  const [statedMean, hasMean] = getPath(manifest, "figures", "stated_mean");
  const meanPresent = valuesIsList && hasMean;
  check(results, "descriptive_and_diagnostic",
    "stated_mean_matches_declared_values", statedMean,
    meanPresent,
    valuesUsable && isNumber(statedMean) &&
      fmt6((statedMean as number) - (meanValue as number)) === "0.000000",
    "method step 3: the stated mean equals the mean of the declared values (distributions before averages)");
  const [prior, hasPrior] = getPath(manifest, "figures", "prior_window_value");
  const [current, hasCurrent] = getPath(
    manifest, "figures", "current_window_value");
  const [statedPct, hasPct] = getPath(
    manifest, "figures", "stated_percent_change");
  const pctValue: number | null =
    hasPrior && hasCurrent && isNumber(prior) && isNumber(current) &&
      (prior as number) !== 0
      ? ((current as number) - (prior as number)) / (prior as number) * 100
      : null;
  const pctPresent = hasPrior && hasCurrent && hasPct;
  check(results, "descriptive_and_diagnostic",
    "stated_percent_change_matches_declared_windows",
    statedPct, pctPresent,
    pctValue !== null && isNumber(statedPct) &&
      fmt6((statedPct as number) - pctValue) === "0.000000",
    "method step 3: the stated percent change equals (current - prior) / prior * 100 over the declared comparable-window values, with a non-zero prior window");

  // ---- Section 4: statistical_care ----
  boolCheck(results, "statistical_care", "sample_size_or_power_considered",
    manifest, ["inference", "sample_size_or_power_considered"],
    "method step 5: sample size / power is considered when inferring");
  boolCheck(results, "statistical_care", "uncertainty_stated",
    manifest, ["inference", "uncertainty_stated"],
    "method step 5 / quality gate: inference claims carry uncertainty — confidence is stated");
  boolCheck(results, "statistical_care",
    "practical_vs_statistical_significance_distinguished",
    manifest,
    ["inference", "practical_vs_statistical_significance_distinguished"],
    "method step 5: practical vs statistical significance is distinguished");
  boolCheck(results, "statistical_care", "multiple_comparisons_checked",
    manifest, ["inference", "multiple_comparisons_checked"],
    "method step 5 / quality gate: multiple-comparison risk is checked");
  falseCheck(results, "statistical_care",
    "no_causal_claims_from_observational_data_alone",
    manifest,
    ["inference", "causal_claims_from_observational_data_alone"],
    "red line: no causal claims from observational data alone");

  // ---- Section 5: insight_and_action ----
  boolCheck(results, "insight_and_action", "so_what_stated",
    manifest, ["recommendation", "so_what_stated"],
    "method step 6: the so-what is stated — the insight that changes an action");
  boolCheck(results, "insight_and_action", "recommendation_made",
    manifest, ["recommendation", "recommendation_made"],
    "method step 6: a recommendation is made");
  boolCheck(results, "insight_and_action", "expected_effect_stated",
    manifest, ["recommendation", "expected_effect_stated"],
    "method step 6: the recommendation's expected effect is stated");
  boolCheck(results, "insight_and_action", "recommendation_owner_named",
    manifest, ["recommendation", "recommendation_owner_named"],
    "method step 6 / quality gate: the recommendation has an owner");
  boolCheck(results, "insight_and_action", "measurement_plan_stated",
    manifest, ["recommendation", "measurement_plan_stated"],
    "method step 6 / quality gate: a measurement plan is stated");
  boolCheck(results, "insight_and_action", "uncertainty_stated_plainly",
    manifest, ["recommendation", "uncertainty_stated_plainly"],
    "method step 6: uncertainty is stated plainly");

  // ---- Section 6: reporting_and_reproducibility ----
  boolCheck(results, "reporting_and_reproducibility",
    "report_covers_required_parts",
    manifest,
    ["report", "covers_question_data_method_finding_recommendation_caveats"],
    "method step 7: the report covers question, data, method, finding, recommendation, and caveats");
  boolCheck(results, "reporting_and_reproducibility", "report_is_one_page",
    manifest, ["report", "is_one_page"],
    "method step 7: the report is one page");
  boolCheck(results, "reporting_and_reproducibility", "caveats_stated",
    manifest, ["report", "caveats_stated"],
    "method step 7: caveats are stated in the report");
  falseCheck(results, "reporting_and_reproducibility",
    "charts_do_not_oversell",
    manifest, ["report", "charts_oversell_findings"],
    "red line: no charts that oversell");
  boolCheck(results, "reporting_and_reproducibility", "numbers_reproducible",
    manifest, ["report", "numbers_reproducible"],
    "method step 7 / quality gate: numbers are reproducible — results reproducible");
  boolCheck(results, "reporting_and_reproducibility",
    "predicted_vs_actual_compared",
    manifest, ["closure", "predicted_vs_actual_compared"],
    "method step 8: after the action, predicted vs actual is compared — close the loop");
  boolCheck(results, "reporting_and_reproducibility",
    "model_of_world_updated",
    manifest, ["closure", "model_of_world_updated"],
    "method step 8: the model of the world is updated from the comparison");

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
    verdict = "DELIVERABLE_NOT_COMPLETE";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "DELIVERABLE_COMPLETE";
  }

  const computedStatuses = results
    .filter((r) =>
      r.check === "stated_total_matches_declared_values" ||
      r.check === "stated_mean_matches_declared_values" ||
      r.check === "stated_percent_change_matches_declared_windows")
    .map((r) => r.status);
  let computedStatus: string | null;
  if (computedStatuses.some((s) => s === "fail")) {
    computedStatus = "outside_stated_limits_on_declared_evidence";
  } else if (computedStatuses.every((s) => s === "pass")) {
    computedStatus = "within_stated_limits_on_declared_evidence";
  } else {
    computedStatus = null;
  }

  const countStatus = (status: CheckStatus) =>
    results.filter((r) => r.status === status).length;

  return {
    service: "data-analysis-deliverable",
    atom_version: "0.1.0",
    question: manifest["question"] ?? null,
    verdict,
    sections,
    checks: results,
    computed_status: computedStatus,
    recomputed_total: fmt6(totalValue),
    recomputed_mean: fmt6(meanValue),
    recomputed_percent_change: fmt6(pctValue),
    summary:
      `${countStatus("pass")} pass, ` +
      `${countStatus("fail")} fail, ` +
      `${countStatus("missing")} missing ` +
      `of ${results.length} checks across six sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "DATA ANALYSIS DELIVERABLE",
    `question: ${pyStr(verdict.question ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(28)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
