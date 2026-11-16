// Forecast with ranges and scorecard — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/forecast-with-ranges-and-scorecard/src/
// forecast_with_ranges_and_scorecard.py (evaluate() + stamp()).
// No logic changes: every verdict, section outcome, per-check status,
// evidence string and the summary string are byte-identical to the
// Python output for the same input. This atom validates a declared
// forecast artifact; it produces no forecast judgment of its own.

import { pyStr } from "./release-readiness.js";
import { validateManifest, type FieldSpec } from "./validate.js";

// Documented manifest field types (SERVICE.md input table) — the
// identical spec the Python oracle validates against. A field
// present with the wrong JSON type raises FieldTypeError before
// any check runs (F1 remedy, external verification Wave 1).
const MANIFEST_SPEC: { [field: string]: FieldSpec } = {
  series: "string",
  forecast: {
    purpose_stated: "boolean",
    horizon_stated: "boolean",
    decision_cadence_matched: "boolean",
    owner_named: "boolean",
  },
  baselines: {
    naive_value: "number",
    moving_average_value: "number",
    seasonal_naive_value: "number",
    compared_to_forecast: "boolean",
    complex_model_used: "boolean",
    complex_model_beats_baselines: "boolean",
  },
  decomposition: {
    level_trend_seasonality_shown: "boolean",
    drivers_known: "boolean",
    driver_based_shown: "boolean",
  },
  range: {
    low: "number",
    base: "number",
    high: "number",
  },
  scenarios: [{
    name: "string",
    trigger_condition: "string",
  }],
  scenario_detail: {
    sensitivity_shown: "boolean",
  },
  scorecard: {
    published: "boolean",
    tracked_per_series: "boolean",
    history: [{
      period: "string",
      forecast: "number",
      actual: "number",
    }],
    declared_mae: "number",
    declared_mape_percent: "number",
    declared_bias: "number",
  },
  revision: {
    forecast_actual_history_preserved: "boolean",
    revisions_made: "boolean",
    revision_reasons_documented: "boolean",
    silently_restated: "boolean",
  },
  cadence: {
    rolling_forecast_maintained: "boolean",
    cadence_matches_review_rhythm: "boolean",
    forecast_updated_on_cadence: "boolean",
  },
};

export const SECTIONS = [
  "purpose_and_horizon",
  "baselines_and_decomposition",
  "ranges_and_scenarios",
  "scorecard_accuracy",
  "revision_hygiene",
  "cadence",
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
  series: unknown;
  verdict: string;
  sections: Record<string, string>;
  checks: CheckResult[];
  history_entries_evaluated: number;
  scenarios_evaluated: number;
  summary: string;
}

const METRIC_TOLERANCE = 0.01;

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

function isNumber(value: unknown): value is number {
  return typeof value === "number";
}

function isNonemptyStr(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function baselinesCheck(
  results: CheckResult[],
  manifest: Record<string, unknown>,
): void {
  const keys = ["naive_value", "moving_average_value", "seasonal_naive_value"];
  const values: unknown[] = [];
  let presentAll = true;
  for (const key of keys) {
    const [value, present] = getPath(manifest, "baselines", key);
    values.push(value);
    presentAll = presentAll && present;
  }
  if (!presentAll) {
    check(results, "baselines_and_decomposition",
      "baselines_computed_and_shown",
      values, false, false,
      "baseline methods always: naive, moving average and seasonal-naive — computed and shown");
  } else {
    check(results, "baselines_and_decomposition",
      "baselines_computed_and_shown",
      values, true, values.every((v) => isNumber(v)),
      "baseline methods always: naive, moving average and seasonal-naive — computed and shown");
  }
}

function rangeCheck(
  results: CheckResult[],
  manifest: Record<string, unknown>,
): void {
  const [low, hasLow] = getPath(manifest, "range", "low");
  const [base, hasBase] = getPath(manifest, "range", "base");
  const [high, hasHigh] = getPath(manifest, "range", "high");
  if (!(hasLow && hasBase && hasHigh)) {
    check(results, "ranges_and_scenarios",
      "range_ordered_and_nondegenerate",
      null, false, false,
      "ranges, not points: a low/base/high range is declared");
  } else if (!(isNumber(low) && isNumber(base) && isNumber(high))) {
    check(results, "ranges_and_scenarios",
      "range_ordered_and_nondegenerate",
      null, true, false,
      "range low, base and high must all be numbers");
  } else {
    check(results, "ranges_and_scenarios",
      "range_ordered_and_nondegenerate",
      null, true,
      (low as number) <= (base as number) &&
        (base as number) <= (high as number) &&
        (low as number) < (high as number),
      "ranges, not points: low <= base <= high with low < high — a bare point is false precision");
  }
}

function scenarioChecks(
  results: CheckResult[],
  manifest: Record<string, unknown>,
): number {
  const [scenarios, hasScenarios] = getPath(manifest, "scenarios");
  if (!hasScenarios || !Array.isArray(scenarios) || scenarios.length === 0) {
    check(results, "ranges_and_scenarios",
      "scenarios_cover_base_best_worst",
      scenarios, false, false, "no scenarios declared");
    check(results, "ranges_and_scenarios",
      "scenario_triggers_documented",
      scenarios, false, false, "no scenarios declared");
    return 0;
  }
  const names: string[] = [];
  let triggersOk = true;
  for (const scenario of scenarios) {
    if (!isPyDict(scenario)) {
      triggersOk = false;
      continue;
    }
    const [name, hasName] = getPath(scenario, "name");
    const [trigger, hasTrigger] = getPath(scenario, "trigger_condition");
    if (hasName && isNonemptyStr(name)) {
      names.push(name);
    }
    if (!(hasTrigger && isNonemptyStr(trigger))) {
      triggersOk = false;
    }
  }
  check(results, "ranges_and_scenarios",
    "scenarios_cover_base_best_worst",
    scenarios, true,
    ["base", "best", "worst"].every((n) => names.includes(n)),
    "scenario & sensitivity: base/best/worst scenarios delivered");
  check(results, "ranges_and_scenarios",
    "scenario_triggers_documented",
    scenarios, true, triggersOk,
    "every scenario carries a trigger condition (what signal tells you you're in that case)");
  return scenarios.length;
}

function scorecardChecks(
  results: CheckResult[],
  manifest: Record<string, unknown>,
): number {
  const [history, hasHistory] = getPath(manifest, "scorecard", "history");
  if (!hasHistory || !Array.isArray(history) || history.length === 0) {
    for (const name of [
      "history_entries_complete",
      "declared_mae_matches_computed",
      "declared_mape_matches_computed",
      "declared_bias_matches_computed",
    ]) {
      check(results, "scorecard_accuracy", name,
        history, false, false,
        "no forecast-vs-actual history declared");
    }
    return 0;
  }
  let incomplete = false;
  let evaluated = 0;
  const absErrors: number[] = [];
  const signedErrors: number[] = [];
  const apes: number[] = [];
  for (const entry of history) {
    if (!isPyDict(entry)) {
      incomplete = true;
      continue;
    }
    const [period, hasPeriod] = getPath(entry, "period");
    const [forecast, hasForecast] = getPath(entry, "forecast");
    const [actual, hasActual] = getPath(entry, "actual");
    if (!(hasPeriod && hasForecast && hasActual &&
          isNonemptyStr(period) && isNumber(forecast) && isNumber(actual))) {
      incomplete = true;
      continue;
    }
    evaluated += 1;
    const error = (forecast as number) - (actual as number);
    signedErrors.push(error);
    absErrors.push(Math.abs(error));
    if (actual !== 0) {
      apes.push(Math.abs(error) / Math.abs(actual as number) * 100);
    }
  }
  if (incomplete) {
    check(results, "scorecard_accuracy", "history_entries_complete",
      history, false, false,
      "a history entry is missing its period, forecast, or actual");
  } else {
    check(results, "scorecard_accuracy", "history_entries_complete",
      history, true, true,
      "every history entry carries a period, a forecast, and an actual");
  }
  const computed: Record<string, number> = {};
  if (evaluated) {
    computed["mae"] =
      absErrors.reduce((a, b) => a + b, 0) / absErrors.length;
    computed["bias"] =
      signedErrors.reduce((a, b) => a + b, 0) / signedErrors.length;
  }
  if (apes.length) {
    computed["mape"] = apes.reduce((a, b) => a + b, 0) / apes.length;
  }
  const metricSpecs: Array<[string, string, string, string]> = [
    ["declared_mae_matches_computed", "mae", "declared_mae", "MAE"],
    ["declared_mape_matches_computed", "mape", "declared_mape_percent",
     "MAPE (percent)"],
    ["declared_bias_matches_computed", "bias", "declared_bias",
     "bias (mean signed error, forecast - actual)"],
  ];
  for (const [name, key, declaredKey, label] of metricSpecs) {
    const evidence =
      `accuracy tracking: the declared ${label} agrees with ` +
      `the ${label} recomputed from the forecast-vs-actual ` +
      "history (within 0.01, the declared value rounded to " +
      "two decimals)";
    const [declared, hasDeclared] = getPath(manifest, "scorecard", declaredKey);
    if (incomplete) {
      check(results, "scorecard_accuracy", name,
        declared, false, false,
        `a history entry is incomplete, so the declared ${label} cannot be verified against the history`);
    } else if (!(key in computed)) {
      check(results, "scorecard_accuracy", name,
        declared, false, false,
        `no history entry with a non-zero actual, so the declared ${label} cannot be verified`);
    } else if (!hasDeclared) {
      check(results, "scorecard_accuracy", name,
        declared, false, false,
        `no declared ${label} on the scorecard`);
    } else if (!isNumber(declared)) {
      check(results, "scorecard_accuracy", name,
        declared, true, false,
        `the declared ${label} must be a number`);
    } else {
      check(results, "scorecard_accuracy", name,
        declared, true,
        Math.abs(declared - computed[key]) <= METRIC_TOLERANCE + 1e-9,
        evidence);
    }
  }
  return evaluated;
}

export function evaluate(manifest: unknown): Verdict {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateManifest(manifest, MANIFEST_SPEC);
  const results: CheckResult[] = [];

  // ---- Section 1: purpose_and_horizon ----
  boolCheck(results, "purpose_and_horizon", "purpose_stated",
    manifest, ["forecast", "purpose_stated"],
    "purpose stated: what decision this forecast feeds");
  boolCheck(results, "purpose_and_horizon", "horizon_stated",
    manifest, ["forecast", "horizon_stated"],
    "horizon stated: operational (weeks) vs strategic (years)");
  boolCheck(results, "purpose_and_horizon",
    "forecast_matched_to_decision_cadence", manifest,
    ["forecast", "decision_cadence_matched"],
    "forecast to the decision cadence — daily forecasts for daily decisions");
  boolCheck(results, "purpose_and_horizon", "owner_named",
    manifest, ["forecast", "owner_named"],
    "red line: no forecasts without owners");

  // ---- Section 2: baselines_and_decomposition ----
  baselinesCheck(results, manifest);
  boolCheck(results, "baselines_and_decomposition",
    "baseline_compared_to_forecast", manifest,
    ["baselines", "compared_to_forecast"],
    "quality gate: baseline computed and compared");
  const [complexUsed, hasComplex] = getPath(manifest, "baselines", "complex_model_used");
  const [beats, hasBeats] = getPath(manifest, "baselines", "complex_model_beats_baselines");
  if (hasComplex && pyTruthy(complexUsed)) {
    check(results, "baselines_and_decomposition",
      "complex_model_beats_baselines",
      beats, hasBeats, beats === true,
      "complexity must beat simplicity to earn its place");
  } else {
    check(results, "baselines_and_decomposition",
      "complex_model_beats_baselines",
      complexUsed, hasComplex, true,
      "no complex model declared — beating the baselines is not required");
  }
  boolCheck(results, "baselines_and_decomposition",
    "decomposition_shown", manifest,
    ["decomposition", "level_trend_seasonality_shown"],
    "decompose: level / trend / seasonality shown");
  const [driversKnown, hasDriversKnown] = getPath(manifest, "decomposition", "drivers_known");
  const [driverBased, hasDriverBased] = getPath(manifest, "decomposition", "driver_based_shown");
  if (hasDriversKnown && pyTruthy(driversKnown)) {
    check(results, "baselines_and_decomposition",
      "driver_based_when_drivers_known",
      driverBased, hasDriverBased, driverBased === true,
      "prefer driver-based forecasts where drivers are known (units x price, loads x rates, headcount x costs) over blind extrapolation");
  } else {
    check(results, "baselines_and_decomposition",
      "driver_based_when_drivers_known",
      driversKnown, hasDriversKnown, true,
      "no known drivers declared — a driver-based forecast is not required");
  }

  // ---- Section 3: ranges_and_scenarios ----
  rangeCheck(results, manifest);
  const scenariosEvaluated = scenarioChecks(results, manifest);
  boolCheck(results, "ranges_and_scenarios", "sensitivity_shown",
    manifest, ["scenario_detail", "sensitivity_shown"],
    "scenario & sensitivity: sensitivity of the forecast to its drivers shown");

  // ---- Section 4: scorecard_accuracy ----
  boolCheck(results, "scorecard_accuracy", "scorecard_published",
    manifest, ["scorecard", "published"],
    "publish scorecards so trust is earned");
  boolCheck(results, "scorecard_accuracy",
    "accuracy_tracked_per_series", manifest,
    ["scorecard", "tracked_per_series"],
    "quality gate: accuracy tracked per series with a scorecard");
  const historyEvaluated = scorecardChecks(results, manifest);

  // ---- Section 5: revision_hygiene ----
  boolCheck(results, "revision_hygiene",
    "forecast_actual_history_preserved", manifest,
    ["revision", "forecast_actual_history_preserved"],
    "revision hygiene: keep forecast-vs-actual history");
  const [revisionsMade, hasRevisions] = getPath(manifest, "revision", "revisions_made");
  const [reasons, hasReasons] = getPath(manifest, "revision", "revision_reasons_documented");
  if (hasRevisions && pyTruthy(revisionsMade)) {
    check(results, "revision_hygiene",
      "revision_reasons_documented",
      reasons, hasReasons, reasons === true,
      "document why revisions happened");
  } else {
    check(results, "revision_hygiene",
      "revision_reasons_documented",
      revisionsMade, hasRevisions, true,
      "no revisions declared");
  }
  falseCheck(results, "revision_hygiene",
    "no_silent_restatement", manifest,
    ["revision", "silently_restated"],
    "red line: no hindsight edits — never silently restate old forecasts");

  // ---- Section 6: cadence ----
  boolCheck(results, "cadence", "rolling_forecast_maintained",
    manifest, ["cadence", "rolling_forecast_maintained"],
    "monthly rolling forecasts (12-month) typical; weekly for operations; annual for strategy");
  boolCheck(results, "cadence", "cadence_matches_review_rhythm",
    manifest, ["cadence", "cadence_matches_review_rhythm"],
    "cadence matched to the review rhythm");
  boolCheck(results, "cadence", "forecast_updated_on_cadence",
    manifest, ["cadence", "forecast_updated_on_cadence"],
    "the forecast is actually updated on its declared cadence");

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
    verdict = "FORECAST_NOT_READY";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "FORECAST_READY";
  }

  const count = (status: CheckStatus) =>
    results.filter((r) => r.status === status).length;

  return {
    service: "forecast-with-ranges-and-scorecard",
    atom_version: "0.1.0",
    series: manifest["series"] ?? null,
    verdict,
    sections,
    checks: results,
    history_entries_evaluated: historyEvaluated,
    scenarios_evaluated: scenariosEvaluated,
    summary:
      `${count("pass")} pass, ` +
      `${count("fail")} fail, ` +
      `${count("missing")} missing ` +
      `of ${results.length} checks across six sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "FORECAST WITH RANGES AND SCORECARD",
    `series: ${pyStr(verdict.series ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(28)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
