// Prediction model leakage & calibration audit — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/prediction-model-leakage-calibration-audit/src/
// prediction_model_leakage_calibration_audit.py (evaluate() + stamp()).
// No logic changes: every verdict, section outcome, per-check status,
// evidence string, computed quantity and the summary string are
// byte-identical to the Python output for the same input. Computed
// quantities use the fixed serialization in both implementations:
// round half up to 4dp — floor(v * 10000 + 0.5) / 10000 — then format
// with exactly four decimals (a string, or null).

import { pyStr } from "./release-readiness.js";
import { validateManifest, type FieldSpec } from "./validate.js";

// Documented manifest field types (SERVICE.md input table) — the
// identical spec the Python oracle validates against. A field
// present with the wrong JSON type raises FieldTypeError before
// any check runs (F1 remedy, external verification Wave 1).
const MANIFEST_SPEC: { [field: string]: FieldSpec } = {
  model: "string",
  prediction_time: "number",
  target: {
    defined: "boolean",
    horizon_declared: "boolean",
    decision_defined: "boolean",
    metric_chosen_from_decision_costs: "boolean",
  },
  baseline: {
    computed: "boolean",
    evaluated_on_same_holdout: "boolean",
  },
  holdout: {
    model_score: "number",
    baseline_score: "number",
    metric_direction: "string",
    untouched: "boolean",
  },
  validation: {
    split_strategy_documented: "boolean",
    temporal_data: "boolean",
    split_type: "string",
    peeking_at_validation: "boolean",
  },
  features: [{
    available_at: "number",
    derived_from_target: "boolean",
  }],
  approach: {
    simple_model_tried_first: "boolean",
    complexity_justified: "boolean",
    outputs_probabilities: "boolean",
    action_thresholds_from_decision_costs: "boolean",
  },
  calibration: {
    reported: "boolean",
    max_tolerated_error: "number",
    observations: [{
      predicted: "number",
      outcome: "number",
    }],
  },
  evaluation: {
    segment_errors_reported: "boolean",
    max_segment_error: "number",
    segments: [{
      name: "string",
      error: "number",
    }],
  },
  drift: {
    monitoring_in_place: "boolean",
    feedback_loops_identified: "boolean",
    retraining_policy_defined: "boolean",
  },
  deployment: {
    versioned_model_and_card: "boolean",
    rollback_path_defined: "boolean",
    silent_updates_in_production: "boolean",
  },
};

export const SECTIONS = [
  "target_and_decision",
  "baseline_and_holdout",
  "leakage_and_validation",
  "model_ladder_and_thresholds",
  "calibration_and_evaluation",
  "drift_and_deployment",
] as const;

export const DIRECTIONS = ["lower_is_better", "higher_is_better"] as const;

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
  holdout_improvement: string | null;
  mean_predicted: string | null;
  mean_observed: string | null;
  calibration_error: string | null;
  worst_segment: string | null;
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

function getFrom(
  obj: Record<string, unknown>,
  key: string,
): [unknown, boolean] {
  if (!Object.prototype.hasOwnProperty.call(obj, key)) return [null, false];
  return [obj[key], true];
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

function holdoutCheck(
  results: CheckResult[],
  manifest: Record<string, unknown>,
): string | null {
  const [model, hasModel] = getPath(manifest, "holdout", "model_score");
  const [baseline, hasBase] = getPath(manifest, "holdout", "baseline_score");
  const [direction, hasDir] = getPath(manifest, "holdout", "metric_direction");
  const complete = hasModel && hasBase && hasDir &&
    isNumber(model) && isNumber(baseline);
  let improvement: number | null = null;
  if (complete && (DIRECTIONS as readonly unknown[]).includes(direction)) {
    improvement = direction === "lower_is_better"
      ? (baseline as number) - (model as number)
      : (model as number) - (baseline as number);
  }
  if (!complete) {
    check(results, "baseline_and_holdout", "model_beats_baseline_on_holdout",
      model, false, false,
      "holdout model / baseline scores or metric direction not declared");
  } else if (!(DIRECTIONS as readonly unknown[]).includes(direction)) {
    check(results, "baseline_and_holdout", "model_beats_baseline_on_holdout",
      model, true, false,
      "metric_direction must be lower_is_better or higher_is_better");
  } else {
    check(results, "baseline_and_holdout", "model_beats_baseline_on_holdout",
      model, true, (improvement as number) > 0,
      "quality gate: baseline computed; improvement demonstrated on untouched holdout — a model that doesn't beat the baseline doesn't ship");
  }
  return fmt4(improvement);
}

function splitCheck(
  results: CheckResult[],
  manifest: Record<string, unknown>,
): void {
  const [temporal, hasTemporal] = getPath(manifest, "validation", "temporal_data");
  const [split, hasSplit] = getPath(manifest, "validation", "split_type");
  if (!(hasTemporal && hasSplit)) {
    check(results, "leakage_and_validation", "no_random_split_for_temporal_data",
      split, false, false, "temporal_data flag or split_type not declared");
  } else {
    const ok = typeof temporal === "boolean" && typeof split === "string" &&
      !(temporal === true && split === "random");
    check(results, "leakage_and_validation", "no_random_split_for_temporal_data",
      split, true, ok,
      "skill red line: no random splits for time-series reality — time-based splits for temporal data");
  }
}

function featuresChecks(
  results: CheckResult[],
  manifest: Record<string, unknown>,
): void {
  const [features, hasFeatures] = getPath(manifest, "features");
  const [predTime, hasTime] = getPath(manifest, "prediction_time");
  if (!hasFeatures || !Array.isArray(features) || features.length === 0) {
    check(results, "leakage_and_validation", "features_available_at_prediction_time",
      features, false, false, "no features declared");
    check(results, "leakage_and_validation", "no_target_derived_features",
      features, false, false, "no features declared");
    return;
  }
  let timeIncomplete = !(hasTime && isNumber(predTime));
  let timeViolating = false;
  let targetIncomplete = false;
  let targetViolating = false;
  for (const feature of features) {
    if (!isPyDict(feature)) {
      timeIncomplete = true;
      targetIncomplete = true;
      continue;
    }
    const [available, hasAvail] = getFrom(feature, "available_at");
    if (!(hasAvail && isNumber(available))) {
      timeIncomplete = true;
    } else if (hasTime && isNumber(predTime) &&
               (available as number) > (predTime as number)) {
      timeViolating = true;
    }
    const [derived, hasDerived] = getFrom(feature, "derived_from_target");
    if (!hasDerived) targetIncomplete = true;
    else if (derived !== false) targetViolating = true;
  }
  if (timeIncomplete) {
    check(results, "leakage_and_validation", "features_available_at_prediction_time",
      features, false, false,
      "a feature is missing its available_at time, or prediction_time is not declared as a number");
  } else {
    check(results, "leakage_and_validation", "features_available_at_prediction_time",
      features, true, !timeViolating,
      "every feature is available at or before the declared prediction time — no future information leaks in");
  }
  if (targetIncomplete) {
    check(results, "leakage_and_validation", "no_target_derived_features",
      features, false, false,
      "a feature is missing its derived_from_target flag");
  } else {
    check(results, "leakage_and_validation", "no_target_derived_features",
      features, true, !targetViolating,
      "no feature is derived from the target itself");
  }
}

function calibrationCheck(
  results: CheckResult[],
  manifest: Record<string, unknown>,
): [string | null, string | null, string | null] {
  const [observations, hasObs] = getPath(manifest, "calibration", "observations");
  const [tolerance, hasTol] = getPath(manifest, "calibration", "max_tolerated_error");
  if (!hasObs || !Array.isArray(observations) || observations.length === 0) {
    check(results, "calibration_and_evaluation", "calibration_within_declared_tolerance",
      observations, false, false, "no calibration observations declared");
    return [null, null, null];
  }
  let incomplete = !(hasTol && isNumber(tolerance));
  let violating = hasTol && isNumber(tolerance) && (tolerance as number) < 0;
  let totalPred = 0.0;
  let totalOutcome = 0.0;
  for (const entry of observations) {
    if (!isPyDict(entry)) {
      incomplete = true;
      continue;
    }
    const [predicted, hasPred] = getFrom(entry, "predicted");
    const [outcome, hasOutcome] = getFrom(entry, "outcome");
    if (!(hasPred && hasOutcome && isNumber(predicted) && isNumber(outcome))) {
      incomplete = true;
      continue;
    }
    totalPred += predicted as number;
    totalOutcome += outcome as number;
    if ((predicted as number) < 0 || (predicted as number) > 1 ||
        !((outcome as number) === 0 || (outcome as number) === 1)) {
      violating = true;
    }
  }
  if (incomplete) {
    check(results, "calibration_and_evaluation", "calibration_within_declared_tolerance",
      observations, false, false,
      "a calibration observation is missing its predicted probability or outcome, or max_tolerated_error is not declared as a number");
    return [null, null, null];
  }
  const meanPred = totalPred / observations.length;
  const meanOutcome = totalOutcome / observations.length;
  const error = Math.abs(meanPred - meanOutcome);
  if (!violating) violating = error > (tolerance as number);
  check(results, "calibration_and_evaluation", "calibration_within_declared_tolerance",
    observations, true, !violating,
    "check calibration: |mean predicted − mean observed| over the declared series, within the caller's declared max_tolerated_error — when it says 70%, it should be right ~70%");
  return [fmt4(meanPred), fmt4(meanOutcome), fmt4(error)];
}

function segmentsCheck(
  results: CheckResult[],
  manifest: Record<string, unknown>,
): string | null {
  const [segments, hasSegments] = getPath(manifest, "evaluation", "segments");
  const [maxError, hasMax] = getPath(manifest, "evaluation", "max_segment_error");
  if (!hasSegments || !Array.isArray(segments) || segments.length === 0) {
    check(results, "calibration_and_evaluation", "segment_errors_within_declared_max",
      segments, false, false, "no segments declared");
    return null;
  }
  let incomplete = !(hasMax && isNumber(maxError));
  let violating = hasMax && isNumber(maxError) && (maxError as number) < 0;
  let worst: string | null = null;
  let worstError: number | null = null;
  for (const entry of segments) {
    if (!isPyDict(entry)) {
      incomplete = true;
      continue;
    }
    const [name, hasName] = getFrom(entry, "name");
    const [error, hasError] = getFrom(entry, "error");
    if (!(hasName && typeof name === "string" && hasError && isNumber(error))) {
      incomplete = true;
      continue;
    }
    if (worstError === null || (error as number) > worstError) {
      worst = name as string;
      worstError = error as number;
    }
    if ((error as number) < 0) violating = true;
    else if (hasMax && isNumber(maxError) && (error as number) > (maxError as number)) {
      violating = true;
    }
  }
  if (incomplete) {
    check(results, "calibration_and_evaluation", "segment_errors_within_declared_max",
      segments, false, false,
      "a segment is missing its name or numeric error, or max_segment_error is not declared as a number");
    return null;
  }
  check(results, "calibration_and_evaluation", "segment_errors_within_declared_max",
    segments, true, !violating,
    "segment errors reported, not just aggregate — every segment within the caller's declared max_segment_error; the worst cohort is the story");
  return worst;
}

export function evaluate(manifest: unknown): Verdict {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateManifest(manifest, MANIFEST_SPEC);
  const results: CheckResult[] = [];

  // ---- Section 1: target_and_decision (skill method 1) ----
  boolCheck(results, "target_and_decision", "target_defined", manifest,
    ["target", "defined"], "what is predicted — the target is defined");
  boolCheck(results, "target_and_decision", "prediction_horizon_declared", manifest,
    ["target", "horizon_declared"], "the prediction horizon is declared");
  boolCheck(results, "target_and_decision", "decision_defined", manifest,
    ["target", "decision_defined"],
    "the decision the prediction drives is defined");
  boolCheck(results, "target_and_decision", "metric_chosen_from_decision_costs", manifest,
    ["target", "metric_chosen_from_decision_costs"],
    "metric chosen from the decision's costs — false positives vs false negatives rarely cost the same");

  // ---- Section 2: baseline_and_holdout (method 2 + quality gate) ----
  boolCheck(results, "baseline_and_holdout", "baseline_computed", manifest,
    ["baseline", "computed"],
    "baseline first: naive rule / historical mean / current heuristic — computed and reported");
  boolCheck(results, "baseline_and_holdout", "baseline_evaluated_on_same_holdout", manifest,
    ["baseline", "evaluated_on_same_holdout"],
    "baseline and model are scored on the same holdout");
  const holdoutImprovement = holdoutCheck(results, manifest);
  boolCheck(results, "baseline_and_holdout", "holdout_untouched", manifest,
    ["holdout", "untouched"],
    "holdout kept untouched for the final read — no peeking at validation");

  // ---- Section 3: leakage_and_validation (method 3 + red line) ----
  boolCheck(results, "leakage_and_validation", "split_strategy_documented", manifest,
    ["validation", "split_strategy_documented"],
    "quality gate: split strategy documented; temporal leakage explicitly checked");
  splitCheck(results, manifest);
  featuresChecks(results, manifest);
  falseCheck(results, "leakage_and_validation", "no_validation_peeking", manifest,
    ["validation", "peeking_at_validation"],
    "no peeking at validation during model selection");

  // ---- Section 4: model_ladder_and_thresholds (methods 4-5) ----
  boolCheck(results, "model_ladder_and_thresholds", "simple_model_tried_first", manifest,
    ["approach", "simple_model_tried_first"],
    "model ladder: simple first (regression, rules, seasonal means)");
  boolCheck(results, "model_ladder_and_thresholds", "complexity_justified", manifest,
    ["approach", "complexity_justified"],
    "complexity earns its keep in accuracy, explainability, and maintenance cost");
  boolCheck(results, "model_ladder_and_thresholds", "outputs_probabilities", manifest,
    ["approach", "outputs_probabilities"],
    "probabilities, not fortune-telling: the model outputs probabilities");
  boolCheck(results, "model_ladder_and_thresholds", "thresholds_from_decision_costs", manifest,
    ["approach", "action_thresholds_from_decision_costs"],
    "action thresholds set from decision costs");

  // ---- Section 5: calibration_and_evaluation (methods 5-6 + gate) ----
  boolCheck(results, "calibration_and_evaluation", "calibration_reported", manifest,
    ["calibration", "reported"],
    "quality gate: calibration reported, not just ranking ability");
  const [meanPred, meanOutcome, calError] = calibrationCheck(results, manifest);
  boolCheck(results, "calibration_and_evaluation", "segment_errors_reported", manifest,
    ["evaluation", "segment_errors_reported"],
    "quality gate: segment errors reported, not just aggregate");
  const worstSegment = segmentsCheck(results, manifest);

  // ---- Section 6: drift_and_deployment (methods 7-8 + red line) ----
  boolCheck(results, "drift_and_deployment", "drift_monitoring_in_place", manifest,
    ["drift", "monitoring_in_place"],
    "quality gate: monitor input drift and live performance");
  boolCheck(results, "drift_and_deployment", "feedback_loops_identified", manifest,
    ["drift", "feedback_loops_identified"],
    "feedback loops identified — predictions change behavior change data");
  boolCheck(results, "drift_and_deployment", "retraining_policy_defined", manifest,
    ["drift", "retraining_policy_defined"],
    "quality gate: retrain policy in place before relying on the model");
  boolCheck(results, "drift_and_deployment", "versioned_model_and_card", manifest,
    ["deployment", "versioned_model_and_card"],
    "deploy carefully: versioned model + card");
  boolCheck(results, "drift_and_deployment", "rollback_path_defined", manifest,
    ["deployment", "rollback_path_defined"],
    "rollout with monitoring and a rollback path");
  falseCheck(results, "drift_and_deployment", "no_silent_model_updates", manifest,
    ["deployment", "silent_updates_in_production"],
    "skill red line: no silent model updates in production");

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
    verdict = "PREDICTION_AUDIT_UNSOUND";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "PREDICTION_AUDIT_SOUND";
  }

  const count = (status: CheckStatus) =>
    results.filter((r) => r.status === status).length;

  return {
    service: "prediction-model-leakage-calibration-audit",
    atom_version: "0.1.0",
    model: manifest["model"] ?? null,
    verdict,
    sections,
    checks: results,
    holdout_improvement: holdoutImprovement,
    mean_predicted: meanPred,
    mean_observed: meanOutcome,
    calibration_error: calError,
    worst_segment: worstSegment,
    summary:
      `${count("pass")} pass, ` +
      `${count("fail")} fail, ` +
      `${count("missing")} missing ` +
      `of ${results.length} checks across six sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "PREDICTION-MODEL LEAKAGE CALIBRATION AUDIT",
    `model: ${pyStr(verdict.model ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(28)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
