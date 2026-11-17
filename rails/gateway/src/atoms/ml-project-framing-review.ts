// ML project framing review — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/ml-project-framing-review/src/ml_project_framing_review.py
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
  project: "string",
  framing: {
    problem_statement_defined: "boolean",
    ml_necessity_assessed: "boolean",
    non_ml_rule_or_heuristic_considered: "boolean",
    decision_and_action_named: "boolean",
    framing_completed_before_modeling: "boolean",
  },
  metric: {
    primary_metric_named: "boolean",
    metric_tied_to_decision: "boolean",
    accuracy_for_its_own_sake_present: "boolean",
  },
  baseline: {
    baseline_value_written_down: "boolean",
    baseline_is_rule_or_heuristic_benchmark: "boolean",
    baseline_recorded_before_complex_build: "boolean",
  },
  metrics: [{
    name: "string",
    decision_action: "string",
    tied_to_decision: "boolean",
    baseline_recorded_before_modeling: "boolean",
  }],
  data_plan: {
    provenance_plan_stated: "boolean",
    leakage_risks_identified: "boolean",
    split_honesty_strategy_planned: "boolean",
    never_tune_on_test_committed: "boolean",
    distribution_shift_risk_noted: "boolean",
  },
  evaluation_plan: {
    evaluation_designed_before_modeling: "boolean",
    offline_online_gap_acknowledged: "boolean",
    online_check_planned: "boolean",
    ablation_planned: "boolean",
  },
  approach: {
    start_simple_first_step_named: "boolean",
    complexity_must_earn_keep_accepted: "boolean",
    reproducibility_plan_stated: "boolean",
    uncertainty_reporting_planned: "boolean",
    worst_case_failure_analysis_planned: "boolean",
  },
  llm: {
    uses_llm_or_rag: "boolean",
    retrieval_quality_prioritized_over_model_size: "boolean",
    golden_set_evaluation_planned: "boolean",
    grounding_citation_and_idk_required: "boolean",
    prompts_versioned_with_changelog: "boolean",
  },
  serving: {
    local_first_serving_options_considered: "boolean",
    latency_and_cost_budget_considered: "boolean",
  },
  red_lines: {
    chasing_sota_without_baseline_present: "boolean",
    evaluating_on_training_data_present: "boolean",
    demo_driven_development_present: "boolean",
    tuning_on_test_present: "boolean",
    latency_cost_ignored_present: "boolean",
    llm_output_treated_as_correct_present: "boolean",
  },
};

export const SECTIONS = [
  "ml_necessity_and_decision_framing",
  "metric_and_baseline_framing",
  "data_and_evaluation_plan",
  "approach_reproducibility_and_llm_framing",
  "anti_pattern_red_lines",
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
  project: unknown;
  verdict: string;
  sections: Record<string, string>;
  checks: CheckResult[];
  computed_status: string | null;
  metrics_count: number | null;
  metrics_without_tied_decision: string[] | null;
  tied_to_decision_coverage: string | null;
  metrics_without_baseline_recorded: string[] | null;
  baseline_recorded_coverage: string | null;
  duplicate_metric_names: string[] | null;
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

function gatedLlmCheck(
  results: CheckResult[],
  section: string,
  name: string,
  manifest: Record<string, unknown>,
  field: string,
  evidence: string,
): void {
  const [gate, gatePresent] = getPath(manifest, "llm", "uses_llm_or_rag");
  const [value, present] = getPath(manifest, "llm", field);
  const bothPresent = gatePresent && present;
  const ok = gatePresent && gate === false ? true : value === true;
  check(results, section, name, value, bothPresent, ok, evidence);
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

export function evaluate(manifest: unknown): Verdict {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateManifest(manifest, MANIFEST_SPEC);
  const results: CheckResult[] = [];

  const [metricsRaw, hasMetrics] = getPath(manifest, "metrics");
  const metricsIsList = hasMetrics && Array.isArray(metricsRaw);
  const rows: unknown[] = metricsIsList ? (metricsRaw as unknown[]) : [];
  const metricsCount: number | null = metricsIsList ? rows.length : null;

  const metricsWithoutTiedDecision: string[] | null = metricsIsList
    ? rows.filter((c) => hasField(c, "tied_to_decision") &&
        (c as Record<string, unknown>)["tied_to_decision"] !== true)
        .map(rowName)
    : null;
  const metricsWithoutBaselineRecorded: string[] | null = metricsIsList
    ? rows.filter((c) => hasField(c, "baseline_recorded_before_modeling") &&
        (c as Record<string, unknown>)["baseline_recorded_before_modeling"] !== true)
        .map(rowName)
    : null;
  let duplicateMetricNames: string[] | null = null;
  if (metricsIsList) {
    const seen: string[] = [];
    duplicateMetricNames = [];
    for (const c of rows) {
      if (isPyDict(c) && typeof c["name"] === "string") {
        const nm = c["name"] as string;
        if (seen.includes(nm) && !duplicateMetricNames.includes(nm)) {
          duplicateMetricNames.push(nm);
        }
        seen.push(nm);
      }
    }
  }
  const tiedToDecisionCoverage: number | null =
    metricsIsList && metricsCount !== null && metricsCount > 0
      ? rows.filter((c) => isPyDict(c) &&
          c["tied_to_decision"] === true).length / metricsCount
      : null;
  const baselineRecordedCoverage: number | null =
    metricsIsList && metricsCount !== null && metricsCount > 0
      ? rows.filter((c) => isPyDict(c) &&
          c["baseline_recorded_before_modeling"] === true).length / metricsCount
      : null;

  // ---- Section 1: ml_necessity_and_decision_framing ----
  boolCheck(results, "ml_necessity_and_decision_framing",
    "problem_statement_defined", manifest,
    ["framing", "problem_statement_defined"],
    "framing: the problem statement is defined before any modeling");
  boolCheck(results, "ml_necessity_and_decision_framing",
    "ml_necessity_assessed", manifest,
    ["framing", "ml_necessity_assessed"],
    "framing: whether this even needs ML is assessed");
  boolCheck(results, "ml_necessity_and_decision_framing",
    "non_ml_rule_or_heuristic_considered", manifest,
    ["framing", "non_ml_rule_or_heuristic_considered"],
    "framing: a rule or heuristic alternative is considered — it is often enough");
  boolCheck(results, "ml_necessity_and_decision_framing",
    "decision_and_action_named", manifest,
    ["framing", "decision_and_action_named"],
    "framing: the decision is named — what action changes based on the output");
  boolCheck(results, "ml_necessity_and_decision_framing",
    "framing_completed_before_modeling", manifest,
    ["framing", "framing_completed_before_modeling"],
    "framing: the framing is completed before modeling begins");

  // ---- Section 2: metric_and_baseline_framing ----
  boolCheck(results, "metric_and_baseline_framing",
    "primary_metric_named", manifest,
    ["metric", "primary_metric_named"],
    "metric: a primary metric is named at framing");
  boolCheck(results, "metric_and_baseline_framing",
    "metric_tied_to_decision", manifest,
    ["metric", "metric_tied_to_decision"],
    "metric: the metric is tied to a decision");
  falseCheck(results, "metric_and_baseline_framing",
    "no_accuracy_for_its_own_sake", manifest,
    ["metric", "accuracy_for_its_own_sake_present"],
    "metric: accuracy is not optimized for its own sake");
  boolCheck(results, "metric_and_baseline_framing",
    "baseline_value_written_down", manifest,
    ["baseline", "baseline_value_written_down"],
    "baseline: the baseline number is written down before building anything complex");
  boolCheck(results, "metric_and_baseline_framing",
    "baseline_is_rule_or_heuristic_benchmark", manifest,
    ["baseline", "baseline_is_rule_or_heuristic_benchmark"],
    "baseline: the benchmark to beat is a rule or heuristic baseline");
  boolCheck(results, "metric_and_baseline_framing",
    "baseline_recorded_before_complex_build", manifest,
    ["baseline", "baseline_recorded_before_complex_build"],
    "baseline: the baseline is recorded before any complex build begins");
  check(results, "metric_and_baseline_framing",
    "metrics_declared", metricsRaw, metricsIsList,
    metricsIsList && (metricsCount as number) > 0,
    "the declared record names its metrics — the metrics list is present and non-empty");
  const tiedPresent = metricsIsList &&
    rows.every((c) => hasField(c, "tied_to_decision"));
  check(results, "metric_and_baseline_framing",
    "every_metric_tied_to_decision", metricsRaw, tiedPresent,
    metricsIsList && (metricsCount as number) > 0 &&
      rows.every((c) => isPyDict(c) && c["tied_to_decision"] === true),
    "metric: every declared metric row is tied to a decision");
  const actionPresent = metricsIsList &&
    rows.every((c) => hasField(c, "decision_action"));
  check(results, "metric_and_baseline_framing",
    "every_metric_names_decision_action", metricsRaw, actionPresent,
    metricsIsList && (metricsCount as number) > 0 &&
      rows.every((c) => isPyDict(c) &&
        typeof c["decision_action"] === "string" &&
        c["decision_action"] !== ""),
    "metric: every declared metric row names the decision action it drives");
  const basePresent = metricsIsList &&
    rows.every((c) => hasField(c, "baseline_recorded_before_modeling"));
  check(results, "metric_and_baseline_framing",
    "every_metric_baseline_recorded_before_modeling", metricsRaw, basePresent,
    metricsIsList && (metricsCount as number) > 0 &&
      rows.every((c) => isPyDict(c) &&
        c["baseline_recorded_before_modeling"] === true),
    "baseline: every declared metric row has its baseline recorded before modeling");
  const namePresent = metricsIsList &&
    rows.every((c) => hasField(c, "name"));
  check(results, "metric_and_baseline_framing",
    "no_metric_name_duplicated", metricsRaw, namePresent,
    metricsIsList && duplicateMetricNames !== null &&
      duplicateMetricNames.length === 0,
    "metric: no declared metric name is owned by more than one metric row");

  // ---- Section 3: data_and_evaluation_plan ----
  boolCheck(results, "data_and_evaluation_plan",
    "provenance_plan_stated", manifest,
    ["data_plan", "provenance_plan_stated"],
    "data plan: where the data comes from is stated at framing — provenance first");
  boolCheck(results, "data_and_evaluation_plan",
    "leakage_risks_identified", manifest,
    ["data_plan", "leakage_risks_identified"],
    "data plan: leakage risks — could the label leak into features — are identified at framing");
  boolCheck(results, "data_and_evaluation_plan",
    "split_honesty_strategy_planned", manifest,
    ["data_plan", "split_honesty_strategy_planned"],
    "data plan: an honest split strategy — strict train / validation / test separation, no temporal or group leakage — is planned");
  boolCheck(results, "data_and_evaluation_plan",
    "never_tune_on_test_committed", manifest,
    ["data_plan", "never_tune_on_test_committed"],
    "data plan: never tune on test is committed at framing");
  boolCheck(results, "data_and_evaluation_plan",
    "distribution_shift_risk_noted", manifest,
    ["data_plan", "distribution_shift_risk_noted"],
    "data plan: distribution shift between training and serving is noted as a framing risk");
  boolCheck(results, "data_and_evaluation_plan",
    "evaluation_designed_before_modeling", manifest,
    ["evaluation_plan", "evaluation_designed_before_modeling"],
    "evaluation plan: evaluation is designed before modeling — evaluation before modeling");
  boolCheck(results, "data_and_evaluation_plan",
    "offline_online_gap_acknowledged", manifest,
    ["evaluation_plan", "offline_online_gap_acknowledged"],
    "evaluation plan: offline metrics are not online value — the gap is acknowledged");
  boolCheck(results, "data_and_evaluation_plan",
    "online_check_planned", manifest,
    ["evaluation_plan", "online_check_planned"],
    "evaluation plan: an online check — A/B or shadow — is planned for anything that ships");
  boolCheck(results, "data_and_evaluation_plan",
    "ablation_planned", manifest,
    ["evaluation_plan", "ablation_planned"],
    "evaluation plan: ablation is planned — show which component actually drives the gain");

  // ---- Section 4: approach_reproducibility_and_llm_framing ----
  boolCheck(results, "approach_reproducibility_and_llm_framing",
    "start_simple_first_step_named", manifest,
    ["approach", "start_simple_first_step_named"],
    "approach: the first step is simple — linear / tree / baseline — and is named");
  boolCheck(results, "approach_reproducibility_and_llm_framing",
    "complexity_must_earn_keep_accepted", manifest,
    ["approach", "complexity_must_earn_keep_accepted"],
    "approach: complexity is added only when it earns its keep");
  boolCheck(results, "approach_reproducibility_and_llm_framing",
    "reproducibility_plan_stated", manifest,
    ["approach", "reproducibility_plan_stated"],
    "reproducibility plan: pin seeds, version data + config + code, log experiments — a result that cannot be reproduced is not a result");
  boolCheck(results, "approach_reproducibility_and_llm_framing",
    "uncertainty_reporting_planned", manifest,
    ["approach", "uncertainty_reporting_planned"],
    "approach: reporting uncertainty — confidence intervals, error bars, not just point metrics — is planned");
  boolCheck(results, "approach_reproducibility_and_llm_framing",
    "worst_case_failure_analysis_planned", manifest,
    ["approach", "worst_case_failure_analysis_planned"],
    "approach: failure analysis on the worst cases is planned");
  const [gateValue, gatePresent] = getPath(manifest, "llm", "uses_llm_or_rag");
  check(results, "approach_reproducibility_and_llm_framing",
    "llm_applicability_declared", gateValue, gatePresent, true,
    "LLM/RAG framing: whether the project uses an LLM or RAG is declared — the LLM/RAG checks apply only when it does");
  gatedLlmCheck(results, "approach_reproducibility_and_llm_framing",
    "retrieval_quality_prioritized_over_model_size", manifest,
    "retrieval_quality_prioritized_over_model_size",
    "LLM/RAG framing: retrieval quality beats model size — chunking, embeddings and reranking get the investment");
  gatedLlmCheck(results, "approach_reproducibility_and_llm_framing",
    "golden_set_evaluation_planned", manifest,
    "golden_set_evaluation_planned",
    "LLM/RAG framing: evaluation against a golden set of question to expected-answer pairs is planned, with regressions tracked");
  gatedLlmCheck(results, "approach_reproducibility_and_llm_framing",
    "grounding_citation_and_idk_required", manifest,
    "grounding_citation_and_idk_required",
    "LLM/RAG framing: answers are grounded in retrieved context, sources are cited, and I don't know is preferred over confident fabrication");
  gatedLlmCheck(results, "approach_reproducibility_and_llm_framing",
    "prompts_versioned_with_changelog", manifest,
    "prompts_versioned_with_changelog",
    "LLM/RAG framing: prompts are versioned like code, with a prompt/eval changelog");
  boolCheck(results, "approach_reproducibility_and_llm_framing",
    "local_first_serving_options_considered", manifest,
    ["serving", "local_first_serving_options_considered"],
    "serving framing: sovereign / local-first serving options are considered over locked-in cloud APIs");
  boolCheck(results, "approach_reproducibility_and_llm_framing",
    "latency_and_cost_budget_considered", manifest,
    ["serving", "latency_and_cost_budget_considered"],
    "serving framing: latency and cost are considered at framing, not ignored");

  // ---- Section 5: anti_pattern_red_lines ----
  falseCheck(results, "anti_pattern_red_lines",
    "no_chasing_sota_without_baseline", manifest,
    ["red_lines", "chasing_sota_without_baseline_present"],
    "red line: no chasing SOTA without a baseline is present in the framing");
  falseCheck(results, "anti_pattern_red_lines",
    "no_evaluating_on_training_data", manifest,
    ["red_lines", "evaluating_on_training_data_present"],
    "red line: no evaluating on training data is present in the framing");
  falseCheck(results, "anti_pattern_red_lines",
    "no_demo_driven_development", manifest,
    ["red_lines", "demo_driven_development_present"],
    "red line: no demo-driven development is present in the framing");
  falseCheck(results, "anti_pattern_red_lines",
    "no_tuning_on_test", manifest,
    ["red_lines", "tuning_on_test_present"],
    "red line: no tuning on test is present in the framing");
  falseCheck(results, "anti_pattern_red_lines",
    "no_latency_cost_ignored", manifest,
    ["red_lines", "latency_cost_ignored_present"],
    "red line: latency and cost are not ignored in the framing");
  falseCheck(results, "anti_pattern_red_lines",
    "no_llm_output_treated_as_correct", manifest,
    ["red_lines", "llm_output_treated_as_correct_present"],
    "red line: an LLM's fluent output is not treated as correct output in the framing");

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
    verdict = "ML_FRAMING_NOT_SOUND";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "ML_FRAMING_SOUND";
  }

  const computedNames = [
    "metrics_declared",
    "every_metric_tied_to_decision",
    "every_metric_names_decision_action",
    "every_metric_baseline_recorded_before_modeling",
    "no_metric_name_duplicated",
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
    service: "ml-project-framing-review",
    atom_version: "0.1.0",
    project: manifest["project"] ?? null,
    verdict,
    sections,
    checks: results,
    computed_status: computedStatus,
    metrics_count: metricsCount,
    metrics_without_tied_decision: metricsWithoutTiedDecision,
    tied_to_decision_coverage: fmt6(tiedToDecisionCoverage),
    metrics_without_baseline_recorded: metricsWithoutBaselineRecorded,
    baseline_recorded_coverage: fmt6(baselineRecordedCoverage),
    duplicate_metric_names: duplicateMetricNames,
    summary:
      `${count("pass")} pass, ` +
      `${count("fail")} fail, ` +
      `${count("missing")} missing ` +
      `of ${results.length} checks across five sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "ML PROJECT FRAMING REVIEW",
    `project: ${pyStr(verdict.project ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(44)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
