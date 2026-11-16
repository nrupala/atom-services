// Applied ML validation — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/applied-ml-validation/src/applied_ml_validation.py
// (evaluate() + stamp()). No logic changes: every verdict, section
// outcome, per-check status, evidence string, computed baseline
// status / improvement, selected rung index and the summary string
// are byte-identical to the Python output for the same input. The
// computed baseline improvement uses the shared fixed
// serialization: round half up to 4dp — floor(v * 10000 + 0.5) /
// 10000 — then format with exactly four decimals; comparisons use
// the unrounded values.

import { pyStr } from "./release-readiness.js";
import { validateManifest, type FieldSpec } from "./validate.js";

// Documented manifest field types (SERVICE.md input table) — the
// identical spec the Python oracle validates against. A field
// present with the wrong JSON type raises FieldTypeError before
// any check runs (F1 remedy, external verification Wave 1).
const MANIFEST_SPEC: { [field: string]: FieldSpec } = {
  model: "string",
  framing: {
    decision_named: "boolean",
    error_costs_stated: "boolean",
    alternatives_considered: "boolean",
  },
  baseline: {
    defined: "boolean",
    baseline_score: "number",
    model_score: "number",
    metric_direction: "string",
    project_stopped_because_baseline_not_beaten: "boolean",
  },
  data: {
    provenance_documented: "boolean",
    licensing_and_consent_confirmed: "boolean",
    label_quality_checked: "boolean",
    edge_cases_covered: "boolean",
    leakage_audited: "boolean",
    training_without_rights_or_consent: "boolean",
  },
  validation: {
    temporal_data: "boolean",
    grouped_data: "boolean",
    split_type: "string",
  },
  ladder: {
    baseline_rung_evaluated: "boolean",
    data_and_splits_held_fixed: "boolean",
    complexity_justified_by_evaluation: "boolean",
    selected_model_rung: "string",
    rungs_evaluated: ["string"],
  },
  evaluation: {
    decision_aligned_metrics_used: "boolean",
    slice_performance_reported: "boolean",
    calibration_reported: "boolean",
    uncertainty_via_resampling_reported: "boolean",
    conclusion_change_condition_stated: "boolean",
    imbalanced_or_high_stakes: "boolean",
    accuracy_only_reporting: "boolean",
  },
  robustness: {
    distribution_shift_evaluated: "boolean",
    adversarial_inputs_evaluated: "boolean",
    known_failure_modes_documented: "boolean",
    data_limitations_documented: "boolean",
    cherry_picked_examples_presented: "boolean",
    claims_exceed_measured_capability: "boolean",
  },
  deployment: {
    data_code_model_versioned_together: "boolean",
    drift_monitoring_planned: "boolean",
    live_performance_monitoring_planned: "boolean",
    feedback_loops_monitored: "boolean",
    rollback_path_defined: "boolean",
    regular_revalidation_planned: "boolean",
  },
  documentation: { model_card_written_and_versioned: "boolean" },
};

export const SECTIONS = [
  "framing_and_baseline",
  "data_audit_and_leakage",
  "model_ladder",
  "evaluation_and_honesty",
  "robustness_and_limits",
  "deployment_monitoring_and_card",
] as const;

export const DIRECTIONS = ["lower_is_better", "higher_is_better"] as const;
export const SPLIT_TYPES = ["random", "time", "group", "time_and_group"] as const;
export const LADDER_RUNGS = [
  "majority_heuristic",
  "linear",
  "boosted_trees",
  "deep",
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
  model: unknown;
  verdict: string;
  sections: Record<string, string>;
  checks: CheckResult[];
  baseline_improvement: string | null;
  baseline_status: string | null;
  selected_rung_index: number | null;
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

function isNumber(value: unknown): boolean {
  return typeof value === "number";
}

function fmt4(value: number | null): string | null {
  if (value === null) return null;
  const rounded = Math.floor(value * 10000 + 0.5) / 10000;
  return rounded.toFixed(4);
}

function baselineCheck(
  results: CheckResult[],
  manifest: Record<string, unknown>,
): [string | null, string | null] {
  const [stopped, hasStopped] = getPath(
    manifest, "baseline", "project_stopped_because_baseline_not_beaten");
  const [model, hasModel] = getPath(manifest, "baseline", "model_score");
  const [base, hasBase] = getPath(manifest, "baseline", "baseline_score");
  const [direction, hasDir] = getPath(manifest, "baseline", "metric_direction");
  const complete = hasModel && hasBase && hasDir &&
    isNumber(model) && isNumber(base);
  let improvement: number | null = null;
  if (complete && (DIRECTIONS as readonly unknown[]).includes(direction)) {
    improvement = direction === "lower_is_better"
      ? (base as number) - (model as number)
      : (model as number) - (base as number);
  }
  if (hasStopped && stopped === true) {
    check(results, "framing_and_baseline",
      "baseline_meaningfully_beaten_or_project_stopped",
      stopped, true, true,
      "quality gate: baseline defined and meaningfully beaten (or the project rightly stopped) — the project is declared stopped because the baseline was not beaten");
    return [fmt4(improvement), "project_rightly_stopped"];
  }
  if (!complete) {
    check(results, "framing_and_baseline",
      "baseline_meaningfully_beaten_or_project_stopped",
      model, false, false,
      "baseline / model scores or metric direction not declared, and no rightly-stopped declaration");
    return [fmt4(improvement), null];
  }
  if (!(DIRECTIONS as readonly unknown[]).includes(direction)) {
    check(results, "framing_and_baseline",
      "baseline_meaningfully_beaten_or_project_stopped",
      model, true, false,
      "metric_direction must be lower_is_better or higher_is_better");
    return [null, "not_beaten_on_declared_evidence"];
  }
  const ok = (improvement as number) > 0;
  check(results, "framing_and_baseline",
    "baseline_meaningfully_beaten_or_project_stopped",
    model, true, ok,
    "quality gate: baseline defined and meaningfully beaten (or the project rightly stopped) — the model strictly beats the declared baseline score in the declared metric direction; the skill states no margin above the baseline, so equality does not pass");
  return [fmt4(improvement), ok
    ? "beaten_on_declared_evidence"
    : "not_beaten_on_declared_evidence"];
}

function splitCheck(
  results: CheckResult[],
  manifest: Record<string, unknown>,
): void {
  const [temporal, hasTemporal] = getPath(manifest, "validation", "temporal_data");
  const [grouped, hasGrouped] = getPath(manifest, "validation", "grouped_data");
  const [split, hasSplit] = getPath(manifest, "validation", "split_type");
  if (!(hasTemporal && hasGrouped && hasSplit)) {
    check(results, "data_audit_and_leakage",
      "splits_by_time_and_group_where_applicable",
      split, false, false,
      "temporal_data / grouped_data flags or split_type not declared");
    return;
  }
  let ok = typeof temporal === "boolean" && typeof grouped === "boolean" &&
    (SPLIT_TYPES as readonly unknown[]).includes(split);
  if (ok && temporal && split !== "time" && split !== "time_and_group") {
    ok = false;
  }
  if (ok && grouped && split !== "group" && split !== "time_and_group") {
    ok = false;
  }
  check(results, "data_audit_and_leakage",
    "splits_by_time_and_group_where_applicable",
    split, true, ok,
    "splits by time and group where applicable — not just random rows: temporal data requires a time split, grouped data requires a group split");
}

function ladderCheck(
  results: CheckResult[],
  manifest: Record<string, unknown>,
): number | null {
  const [selected, hasSelected] = getPath(manifest, "ladder", "selected_model_rung");
  const [rungs, hasRungs] = getPath(manifest, "ladder", "rungs_evaluated");
  const selectedIndex: number | null = hasSelected &&
    (LADDER_RUNGS as readonly unknown[]).includes(selected)
    ? (LADDER_RUNGS as readonly unknown[]).indexOf(selected)
    : null;
  if (!hasSelected || !hasRungs || !Array.isArray(rungs) || rungs.length === 0) {
    check(results, "model_ladder", "ladder_climbed_in_order",
      rungs, false, false,
      "selected_model_rung or rungs_evaluated not declared");
    return selectedIndex;
  }
  const expected: string[] | null = selectedIndex !== null
    ? LADDER_RUNGS.slice(0, selectedIndex + 1) as unknown as string[]
    : null;
  const ok = expected !== null && Array.isArray(rungs) &&
    rungs.length === expected.length &&
    rungs.every((r, i) => r === expected[i]);
  check(results, "model_ladder", "ladder_climbed_in_order",
    rungs, true, ok,
    "model ladder: majority/heuristic -> linear -> boosted trees -> deep — the rungs evaluated are exactly the ladder prefix up to the selected rung, in order, with no rung skipped, repeated, or evaluated out of order");
  return selectedIndex;
}

function accuracyOnlyCheck(
  results: CheckResult[],
  manifest: Record<string, unknown>,
): void {
  const [stakes, hasStakes] = getPath(
    manifest, "evaluation", "imbalanced_or_high_stakes");
  const [accOnly, hasAcc] = getPath(
    manifest, "evaluation", "accuracy_only_reporting");
  if (hasStakes && pyTruthy(stakes)) {
    check(results, "evaluation_and_honesty",
      "no_accuracy_only_reporting_where_it_matters",
      accOnly, hasAcc, accOnly === false,
      "red line: no accuracy-only reporting on imbalanced or high-stakes problems");
  } else {
    check(results, "evaluation_and_honesty",
      "no_accuracy_only_reporting_where_it_matters",
      stakes, hasStakes, true,
      "problem not declared imbalanced or high-stakes");
  }
}

export function evaluate(manifest: unknown): Verdict {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateManifest(manifest, MANIFEST_SPEC);
  const results: CheckResult[] = [];

  // ---- Section 1: framing_and_baseline ----
  boolCheck(results, "framing_and_baseline", "decision_named",
    manifest, ["framing", "decision_named"],
    "frame: what decision does the model inform? The decision is named");
  boolCheck(results, "framing_and_baseline", "error_costs_stated",
    manifest, ["framing", "error_costs_stated"],
    "frame: what is the cost of each error type? The error costs are stated");
  boolCheck(results, "framing_and_baseline",
    "simpler_alternatives_considered",
    manifest, ["framing", "alternatives_considered"],
    "frame: would rules, a simple regression, or asking a human do better? The simpler alternatives are considered — baseline first, always");
  boolCheck(results, "framing_and_baseline", "baseline_defined",
    manifest, ["baseline", "defined"],
    "quality gate: baseline defined — baseline first, always");
  const [improvement, baselineStatus] = baselineCheck(results, manifest);

  // ---- Section 2: data_audit_and_leakage ----
  boolCheck(results, "data_audit_and_leakage",
    "data_provenance_documented",
    manifest, ["data", "provenance_documented"],
    "data audit: provenance is documented");
  boolCheck(results, "data_audit_and_leakage",
    "licensing_and_consent_confirmed",
    manifest, ["data", "licensing_and_consent_confirmed"],
    "data audit: licensing and consent are confirmed");
  boolCheck(results, "data_audit_and_leakage",
    "label_quality_checked",
    manifest, ["data", "label_quality_checked"],
    "data audit: label quality is checked");
  boolCheck(results, "data_audit_and_leakage",
    "edge_case_coverage_checked",
    manifest, ["data", "edge_cases_covered"],
    "data audit: coverage of edge cases is checked");
  boolCheck(results, "data_audit_and_leakage", "leakage_audited",
    manifest, ["data", "leakage_audited"],
    "data audit: leakage checked (temporal, group, target proxies)");
  falseCheck(results, "data_audit_and_leakage",
    "no_training_without_rights_or_consent",
    manifest, ["data", "training_without_rights_or_consent"],
    "red line: no training on data without rights/consent; PII per the privacy rules");
  splitCheck(results, manifest);

  // ---- Section 3: model_ladder ----
  boolCheck(results, "model_ladder", "baseline_rung_evaluated",
    manifest, ["ladder", "baseline_rung_evaluated"],
    "model ladder: the majority/heuristic rung is evaluated first — earn complexity");
  boolCheck(results, "model_ladder",
    "data_and_splits_held_fixed_while_climbing",
    manifest, ["ladder", "data_and_splits_held_fixed"],
    "model ladder: climb holding data and splits fixed");
  boolCheck(results, "model_ladder",
    "complexity_justified_by_evaluation",
    manifest, ["ladder", "complexity_justified_by_evaluation"],
    "model ladder: climb only when evaluation justifies it");
  const selectedRungIndex = ladderCheck(results, manifest);

  // ---- Section 4: evaluation_and_honesty ----
  boolCheck(results, "evaluation_and_honesty",
    "decision_aligned_metrics_used",
    manifest, ["evaluation", "decision_aligned_metrics_used"],
    "evaluate on decision-aligned metrics: costs of FP / FN, not a generic score");
  boolCheck(results, "evaluation_and_honesty",
    "slice_performance_reported",
    manifest, ["evaluation", "slice_performance_reported"],
    "quality gate: slice performance reported, not aggregate accuracy alone");
  boolCheck(results, "evaluation_and_honesty",
    "calibration_reported",
    manifest, ["evaluation", "calibration_reported"],
    "quality gate: calibration reported, not aggregate accuracy alone");
  boolCheck(results, "evaluation_and_honesty",
    "uncertainty_via_resampling_reported",
    manifest, ["evaluation", "uncertainty_via_resampling_reported"],
    "evaluate: uncertainty via resampling is reported");
  boolCheck(results, "evaluation_and_honesty",
    "conclusion_change_condition_stated",
    manifest, ["evaluation", "conclusion_change_condition_stated"],
    "evaluate: what would be needed to change the conclusion is reported");
  accuracyOnlyCheck(results, manifest);

  // ---- Section 5: robustness_and_limits ----
  boolCheck(results, "robustness_and_limits",
    "distribution_shift_evaluated",
    manifest, ["robustness", "distribution_shift_evaluated"],
    "robustness & honesty: distribution shift is evaluated");
  boolCheck(results, "robustness_and_limits",
    "adversarial_inputs_evaluated",
    manifest, ["robustness", "adversarial_inputs_evaluated"],
    "robustness & honesty: adversarial inputs are evaluated");
  boolCheck(results, "robustness_and_limits",
    "known_failure_modes_documented",
    manifest, ["robustness", "known_failure_modes_documented"],
    "robustness & honesty: known failure modes are documented — no hiding failure modes");
  boolCheck(results, "robustness_and_limits",
    "data_limitations_documented",
    manifest, ["robustness", "data_limitations_documented"],
    "robustness & honesty: documented data limitations");
  falseCheck(results, "robustness_and_limits",
    "no_cherry_picked_examples",
    manifest, ["robustness", "cherry_picked_examples_presented"],
    "robustness & honesty: no cherry-picked examples");
  falseCheck(results, "robustness_and_limits",
    "no_claims_beyond_measured_capability",
    manifest, ["robustness", "claims_exceed_measured_capability"],
    "red line: no 'AI' claims beyond measured capability");

  // ---- Section 6: deployment_monitoring_and_card ----
  boolCheck(results, "deployment_monitoring_and_card",
    "data_code_model_versioned_together",
    manifest, ["deployment", "data_code_model_versioned_together"],
    "deploy & monitor: version data+code+model together");
  boolCheck(results, "deployment_monitoring_and_card",
    "drift_monitoring_planned",
    manifest, ["deployment", "drift_monitoring_planned"],
    "quality gate: monitoring planned before deployment — drift is monitored");
  boolCheck(results, "deployment_monitoring_and_card",
    "live_performance_monitoring_planned",
    manifest, ["deployment", "live_performance_monitoring_planned"],
    "deploy & monitor: live performance is monitored");
  boolCheck(results, "deployment_monitoring_and_card",
    "feedback_loops_monitored",
    manifest, ["deployment", "feedback_loops_monitored"],
    "deploy & monitor: feedback loops are monitored");
  boolCheck(results, "deployment_monitoring_and_card",
    "rollback_path_defined",
    manifest, ["deployment", "rollback_path_defined"],
    "quality gate: monitoring + rollback planned before deployment — a rollback path is defined");
  boolCheck(results, "deployment_monitoring_and_card",
    "regular_revalidation_planned",
    manifest, ["deployment", "regular_revalidation_planned"],
    "deploy & monitor: regular re-validation is planned");
  boolCheck(results, "deployment_monitoring_and_card",
    "model_card_written_and_versioned",
    manifest, ["documentation", "model_card_written_and_versioned"],
    "quality gate: model card written and versioned — intended use, limits, metrics per slice, training data summary; keep it current");

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
    verdict = "NOT_VALIDATED";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "VALIDATED";
  }

  const count = (status: CheckStatus) =>
    results.filter((r) => r.status === status).length;

  return {
    service: "applied-ml-validation",
    atom_version: "0.1.0",
    model: manifest["model"] ?? null,
    verdict,
    sections,
    checks: results,
    baseline_improvement: improvement,
    baseline_status: baselineStatus,
    selected_rung_index: selectedRungIndex,
    summary:
      `${count("pass")} pass, ` +
      `${count("fail")} fail, ` +
      `${count("missing")} missing ` +
      `of ${results.length} checks across six sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "APPLIED ML VALIDATION",
    `model: ${pyStr(verdict.model ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(32)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
