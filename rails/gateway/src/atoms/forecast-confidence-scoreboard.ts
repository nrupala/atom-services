// Forecast confidence scoreboard — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/forecast-confidence-scoreboard/src/forecast_confidence_scoreboard.py
// (evaluate() + stamp()). No logic changes: every verdict, section
// outcome, per-check status, evidence string, computed field and
// the summary string are byte-identical to the Python output for
// the same input. Computed ratios use the shared fixed
// serialization: round half up to 6dp —
// floor(v * 1000000 + 0.5) / 1000000 — then format with exactly six
// decimals; comparisons use the serialized values for
// declared-vs-recomputed agreement and the unrounded values
// elsewhere.

import { pyStr } from "./release-readiness.js";
import { validateManifest, type FieldSpec } from "./validate.js";

// Documented manifest field types (SERVICE.md input table) — the
// identical spec the Python oracle validates against. A field
// present with the wrong JSON type raises FieldTypeError before
// any check runs (F1 remedy, external verification Wave 1).
const MANIFEST_SPEC: { [field: string]: FieldSpec } = {
  subject: "string",
  record: {
    resolution_criteria_predeclared: "boolean",
    forecasts_recorded_before_resolution: "boolean",
    unresolved_forecasts_excluded: "boolean",
  },
  forecasts: [{
    forecaster: "string",
    claim: "string",
    stated_probability: "number",
    outcome: "number",
  }],
  scoreboard: [{
    forecaster: "string",
    forecasts_count: "number",
    mean_stated_probability: "number",
    hit_rate: "number",
    calibration_gap: "number",
    brier_score: "number",
    rank: "number",
  }],
  confidence_reporting: {
    calibration_reported_per_forecaster: "boolean",
    outputs_are_probabilities: "boolean",
    calibration_reported_not_just_ranking: "boolean",
    worst_forecaster_surfaced: "boolean",
  },
  scoreboard_use: {
    decision_stated: "boolean",
    decision_costs_considered: "boolean",
  },
  honesty: {
    metric_chosen_to_flatter_present: "boolean",
    silent_score_rewrites_present: "boolean",
    scores_refreshed_as_outcomes_resolve: "boolean",
  },
};

export const SECTIONS = [
  "ledger_and_resolution",
  "per_forecaster_scoring",
  "calibration_reporting",
  "ranking_integrity",
  "honesty_and_live_use",
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
  subject: unknown;
  verdict: string;
  sections: Record<string, string>;
  checks: CheckResult[];
  computed_status: string | null;
  forecasts_count: number | null;
  forecasters_count: number | null;
  overall_mean_stated_probability: string | null;
  overall_hit_rate: string | null;
  overall_calibration_gap: string | null;
  overall_brier_score: string | null;
  calibration_direction: string | null;
  worst_calibrated_forecaster: string | null;
  forecasters_without_scoreboard_row: string[] | null;
  scoreboard_rows_without_forecasts: string[] | null;
  mismatched_scoreboard_rows: string[] | null;
  forecasters_with_wrong_rank: string[] | null;
  summary: string;
}

interface ForecasterStats {
  count: number;
  prob_sum: number;
  hit_sum: number;
  brier_sum: number;
  mean: number;
  hit: number;
  gap: number;
  brier: number;
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

function nonemptyStr(value: unknown): boolean {
  return typeof value === "string" && value.length > 0;
}

function statsValid(entry: unknown): boolean {
  if (!isPyDict(entry)) return false;
  const prob = entry["stated_probability"];
  const outcome = entry["outcome"];
  return nonemptyStr(entry["forecaster"]) &&
    isNumber(prob) && prob >= 0 && prob <= 1 &&
    isNumber(outcome) && (outcome === 0 || outcome === 1);
}

function forecasterStats(
  rows: unknown[],
): Map<string, ForecasterStats> {
  const stats = new Map<string, ForecasterStats>();
  for (const entry of rows) {
    if (!statsValid(entry)) continue;
    const rec = entry as Record<string, unknown>;
    const name = rec["forecaster"] as string;
    let bucket = stats.get(name);
    if (!bucket) {
      bucket = { count: 0, prob_sum: 0, hit_sum: 0, brier_sum: 0,
                 mean: 0, hit: 0, gap: 0, brier: 0 };
      stats.set(name, bucket);
    }
    const prob = rec["stated_probability"] as number;
    const outcome = rec["outcome"] as number;
    bucket.count += 1;
    bucket.prob_sum += prob;
    bucket.hit_sum += outcome;
    const diff = prob - outcome;
    bucket.brier_sum += diff * diff;
  }
  for (const bucket of stats.values()) {
    bucket.mean = bucket.prob_sum / bucket.count;
    bucket.hit = bucket.hit_sum / bucket.count;
    bucket.gap = Math.abs(bucket.mean - bucket.hit);
    bucket.brier = bucket.brier_sum / bucket.count;
  }
  return stats;
}

export function evaluate(manifest: unknown): Verdict {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateManifest(manifest, MANIFEST_SPEC);
  const results: CheckResult[] = [];

  // ---- Declared rows, read once for the computed checks ----
  const [forecastsRaw, hasForecasts] = getPath(manifest, "forecasts");
  const forecastsIsList = hasForecasts && Array.isArray(forecastsRaw);
  const fRows: unknown[] = forecastsIsList ? (forecastsRaw as unknown[]) : [];
  const forecastsCount: number | null = forecastsIsList ? fRows.length : null;

  const [scoreboardRaw, hasScoreboard] = getPath(manifest, "scoreboard");
  const scoreboardIsList = hasScoreboard && Array.isArray(scoreboardRaw);
  const sRows: unknown[] = scoreboardIsList ? (scoreboardRaw as unknown[]) : [];

  const stats = forecasterStats(fRows);
  const statsComplete = forecastsIsList && (forecastsCount as number) > 0 &&
    fRows.every((c) => statsValid(c));
  const validEntries = fRows.filter((c) => statsValid(c));

  let overallMean: number | null = null;
  let overallHit: number | null = null;
  let overallGap: number | null = null;
  let overallBrier: number | null = null;
  let calibrationDirection: string | null = null;
  if (validEntries.length > 0) {
    overallMean = validEntries.reduce<number>(
      (acc, c) => acc + ((c as Record<string, unknown>)["stated_probability"] as number),
      0) / validEntries.length;
    overallHit = validEntries.reduce<number>(
      (acc, c) => acc + ((c as Record<string, unknown>)["outcome"] as number),
      0) / validEntries.length;
    overallGap = Math.abs(overallMean - overallHit);
    overallBrier = validEntries.reduce<number>((acc, c) => {
      const d = ((c as Record<string, unknown>)["stated_probability"] as number) -
        ((c as Record<string, unknown>)["outcome"] as number);
      return acc + d * d;
    }, 0) / validEntries.length;
    calibrationDirection = overallMean > overallHit
      ? "overconfident"
      : overallMean < overallHit ? "underconfident" : "exact";
  }

  let worstCalibratedForecaster: string | null = null;
  let worstGap: number | null = null;
  for (const name of [...stats.keys()].sort()) {
    const gap = (stats.get(name) as ForecasterStats).gap;
    if (worstGap === null || gap > worstGap) {
      worstGap = gap;
      worstCalibratedForecaster = name;
    }
  }

  const ledgerNames: string[] = [];
  for (const c of fRows) {
    if (isPyDict(c) && nonemptyStr(c["forecaster"]) &&
        !ledgerNames.includes(c["forecaster"] as string)) {
      ledgerNames.push(c["forecaster"] as string);
    }
  }
  const forecastersCount: number | null = forecastsIsList
    ? ledgerNames.length : null;
  const sbNames: string[] = [];
  for (const c of sRows) {
    if (isPyDict(c) && typeof c["forecaster"] === "string" &&
        !sbNames.includes(c["forecaster"] as string)) {
      sbNames.push(c["forecaster"] as string);
    }
  }
  const forecastersWithoutRow: string[] | null =
    forecastsIsList && scoreboardIsList
      ? ledgerNames.filter((n) => !sbNames.includes(n))
      : null;
  const sbRowsWithoutForecasts: string[] | null =
    forecastsIsList && scoreboardIsList
      ? sbNames.filter((n) => !ledgerNames.includes(n))
      : null;

  const rowMismatches = (row: unknown): boolean => {
    if (!isPyDict(row)) return false;
    const name = row["forecaster"];
    if (typeof name !== "string") return false;
    if (hasField(row, "forecasts_count")) {
      const ledgerCount = fRows.filter(
        (c) => isPyDict(c) && c["forecaster"] === name).length;
      if (row["forecasts_count"] !== ledgerCount) return true;
    }
    const bucket = stats.get(name);
    if (bucket) {
      const pairs: Array<[string, number]> = [
        ["mean_stated_probability", bucket.mean],
        ["hit_rate", bucket.hit],
        ["calibration_gap", bucket.gap],
        ["brier_score", bucket.brier],
      ];
      for (const [field, expected] of pairs) {
        if (hasField(row, field) &&
            fmt6(row[field] as number) !== fmt6(expected)) return true;
      }
    }
    return false;
  };
  const mismatchedRows: string[] | null =
    forecastsIsList && scoreboardIsList
      ? sRows.filter((c) => isPyDict(c) &&
          typeof c["forecaster"] === "string" && rowMismatches(c))
          .map((c) => (c as Record<string, unknown>)["forecaster"] as string)
      : null;

  const expectedRank = new Map<string, number>();
  if (statsComplete && scoreboardIsList) {
    const ordered = sRows
      .filter((c) => isPyDict(c) && stats.has(c["forecaster"] as string))
      .map((c) => (c as Record<string, unknown>)["forecaster"] as string)
      .sort((a, b) => {
        const aBrier = (stats.get(a) as ForecasterStats).brier;
        const bBrier = (stats.get(b) as ForecasterStats).brier;
        if (aBrier < bBrier) return -1;
        if (aBrier > bBrier) return 1;
        return a < b ? -1 : a > b ? 1 : 0;
      });
    ordered.forEach((name, index) => {
      if (!expectedRank.has(name)) expectedRank.set(name, index + 1);
    });
  }
  const forecastersWithWrongRank: string[] | null =
    statsComplete && scoreboardIsList
      ? sRows.filter((c) => isPyDict(c) && hasField(c, "rank") &&
          expectedRank.has(c["forecaster"] as string) &&
          c["rank"] !== expectedRank.get(c["forecaster"] as string))
          .map((c) => (c as Record<string, unknown>)["forecaster"] as string)
      : null;

  // ---- Section 1: ledger_and_resolution ----
  boolCheck(results, "ledger_and_resolution",
    "resolution_criteria_predeclared", manifest,
    ["record", "resolution_criteria_predeclared"],
    "target & decision: the criteria that resolve each claim are declared before outcomes are known");
  boolCheck(results, "ledger_and_resolution",
    "forecasts_recorded_before_resolution", manifest,
    ["record", "forecasts_recorded_before_resolution"],
    "validation without leakage: every forecast is recorded before its outcome resolves — no peeking");
  boolCheck(results, "ledger_and_resolution",
    "unresolved_forecasts_excluded_from_scoring", manifest,
    ["record", "unresolved_forecasts_excluded"],
    "scoreboard honesty: only resolved forecasts are scored — unresolved forecasts are excluded");
  check(results, "ledger_and_resolution", "forecasts_declared",
    forecastsRaw, forecastsIsList,
    forecastsIsList && (forecastsCount as number) > 0,
    "the declared record names its resolved forecasts — the forecasts list is present and non-empty");
  const namesPresent = forecastsIsList &&
    fRows.every((c) => hasField(c, "forecaster"));
  check(results, "ledger_and_resolution",
    "every_forecast_names_forecaster", forecastsRaw, namesPresent,
    forecastsIsList && (forecastsCount as number) > 0 &&
      fRows.every((c) => isPyDict(c) && nonemptyStr(c["forecaster"])),
    "every declared forecast row names its forecaster — a non-empty forecaster string");
  const claimPresent = forecastsIsList &&
    fRows.every((c) => hasField(c, "claim"));
  check(results, "ledger_and_resolution",
    "every_forecast_states_claim", forecastsRaw, claimPresent,
    forecastsIsList && (forecastsCount as number) > 0 &&
      fRows.every((c) => isPyDict(c) && nonemptyStr(c["claim"])),
    "every declared forecast row states the claim that was predicted — a non-empty claim string");
  const probPresent = forecastsIsList &&
    fRows.every((c) => hasField(c, "stated_probability"));
  check(results, "ledger_and_resolution",
    "every_forecast_probability_in_range", forecastsRaw, probPresent,
    forecastsIsList && (forecastsCount as number) > 0 &&
      fRows.every((c) => isPyDict(c) &&
        isNumber(c["stated_probability"]) &&
        (c["stated_probability"] as number) >= 0 &&
        (c["stated_probability"] as number) <= 1),
    "probabilities, not fortune-telling: every declared forecast row states a probability inside [0, 1]");
  const outcomePresent = forecastsIsList &&
    fRows.every((c) => hasField(c, "outcome"));
  check(results, "ledger_and_resolution",
    "every_forecast_outcome_binary", forecastsRaw, outcomePresent,
    forecastsIsList && (forecastsCount as number) > 0 &&
      fRows.every((c) => isPyDict(c) && isNumber(c["outcome"]) &&
        (c["outcome"] === 0 || c["outcome"] === 1)),
    "every declared forecast row records a binary outcome — 0 or 1");

  // ---- Section 2: per_forecaster_scoring ----
  check(results, "per_forecaster_scoring", "scoreboard_declared",
    scoreboardRaw, scoreboardIsList,
    scoreboardIsList && sRows.length > 0,
    "the declared record publishes its scoreboard — the scoreboard list is present and non-empty");
  const coversPresent = forecastsIsList && scoreboardIsList &&
    fRows.every((c) => hasField(c, "forecaster")) &&
    sRows.every((c) => hasField(c, "forecaster"));
  const rawSbNames = sRows.filter(isPyDict).map((c) => c["forecaster"]);
  const rawLedgerNames = fRows.filter(isPyDict).map((c) => c["forecaster"]);
  const ledgerNameSet = new Set(rawLedgerNames);
  const sbNameSet = new Set(rawSbNames);
  check(results, "per_forecaster_scoring",
    "scoreboard_covers_every_forecaster", scoreboardRaw, coversPresent,
    forecastsIsList && scoreboardIsList &&
      ledgerNameSet.size === sbNameSet.size &&
      [...ledgerNameSet].every((n) => sbNameSet.has(n)) &&
      rawSbNames.length === sbNameSet.size,
    "the scoreboard covers exactly the forecasters in the ledger — no forecaster omitted, no row without forecasts, no duplicate rows");
  const countPresent = forecastsIsList && scoreboardIsList &&
    fRows.every((c) => hasField(c, "forecaster")) &&
    sRows.every((c) => hasField(c, "forecaster") &&
      hasField(c, "forecasts_count"));
  check(results, "per_forecaster_scoring",
    "every_scoreboard_forecast_count_matches_ledger",
    scoreboardRaw, countPresent,
    scoreboardIsList &&
      sRows.every((c) => isPyDict(c) &&
        c["forecasts_count"] === fRows.filter(
          (f) => isPyDict(f) && f["forecaster"] === c["forecaster"]).length),
    "every scoreboard row's forecasts_count equals the number of ledger rows naming that forecaster");

  const aggregateCheck = (
    name: string,
    field: string,
    pick: (b: ForecasterStats) => number,
    evidence: string,
  ): void => {
    const present = statsComplete && scoreboardIsList &&
      sRows.every((c) => hasField(c, "forecaster") && hasField(c, field)) &&
      sRows.every((c) => isPyDict(c) && stats.has(c["forecaster"] as string));
    check(results, "per_forecaster_scoring", name, scoreboardRaw, present,
      scoreboardIsList && sRows.length > 0 &&
        sRows.every((c) => isPyDict(c) &&
          stats.has(c["forecaster"] as string) &&
          fmt6(c[field] as number) ===
            fmt6(pick(stats.get(c["forecaster"] as string) as ForecasterStats))),
      evidence);
  };
  aggregateCheck(
    "every_scoreboard_mean_probability_matches",
    "mean_stated_probability", (b) => b.mean,
    "every scoreboard row's mean stated probability agrees with the mean recomputed from that forecaster's ledger rows (agreement at the fixed 6dp serialization)");
  aggregateCheck(
    "every_scoreboard_hit_rate_matches",
    "hit_rate", (b) => b.hit,
    "every scoreboard row's hit rate agrees with the hit rate recomputed from that forecaster's ledger rows (agreement at the fixed 6dp serialization)");
  aggregateCheck(
    "every_scoreboard_brier_score_matches",
    "brier_score", (b) => b.brier,
    "every scoreboard row's Brier score — mean squared (stated probability - outcome) — agrees with the Brier score recomputed from that forecaster's ledger rows (agreement at the fixed 6dp serialization)");

  // ---- Section 3: calibration_reporting ----
  const gapPresent = statsComplete && scoreboardIsList &&
    sRows.every((c) => hasField(c, "forecaster") &&
      hasField(c, "calibration_gap")) &&
    sRows.every((c) => isPyDict(c) && stats.has(c["forecaster"] as string));
  check(results, "calibration_reporting",
    "every_scoreboard_calibration_gap_matches", scoreboardRaw, gapPresent,
    scoreboardIsList && sRows.length > 0 &&
      sRows.every((c) => isPyDict(c) &&
        stats.has(c["forecaster"] as string) &&
        fmt6(c["calibration_gap"] as number) ===
          fmt6((stats.get(c["forecaster"] as string) as ForecasterStats).gap)),
    "every scoreboard row's calibration gap — |mean stated probability - hit rate| — agrees with the gap recomputed from that forecaster's ledger rows (agreement at the fixed 6dp serialization)");
  boolCheck(results, "calibration_reporting",
    "calibration_reported_per_forecaster", manifest,
    ["confidence_reporting", "calibration_reported_per_forecaster"],
    "check calibration: calibration is reported per forecaster, not only in aggregate");
  boolCheck(results, "calibration_reporting",
    "probabilities_reported_not_point_verdicts", manifest,
    ["confidence_reporting", "outputs_are_probabilities"],
    "probabilities, not fortune-telling: the scoreboard reports stated probabilities, not bare point verdicts");
  boolCheck(results, "calibration_reporting",
    "calibration_reported_not_just_ranking", manifest,
    ["confidence_reporting", "calibration_reported_not_just_ranking"],
    "check calibration — not just ranking ability: calibration is reported alongside any ranking");
  boolCheck(results, "calibration_reporting",
    "worst_calibrated_forecaster_surfaced", manifest,
    ["confidence_reporting", "worst_forecaster_surfaced"],
    "segment errors — the worst cohort is the story: the worst-calibrated forecaster is surfaced, not hidden in the aggregate");

  // ---- Section 4: ranking_integrity ----
  const ranksPresent = scoreboardIsList &&
    sRows.every((c) => hasField(c, "forecaster") && hasField(c, "rank"));
  const rankValues = sRows.filter(isPyDict).map((c) => c["rank"]);
  const sortedRanks = [...rankValues].sort(
    (a, b) => (a as number) - (b as number));
  check(results, "ranking_integrity",
    "scoreboard_ranks_complete_and_unique", scoreboardRaw, ranksPresent,
    scoreboardIsList && sRows.length > 0 &&
      rankValues.every((r) => isNumber(r) && Number.isInteger(r)) &&
      sortedRanks.every((r, i) => r === i + 1),
    "the published ranks are exactly 1..N over the scoreboard rows — complete, unique, integral");
  const rankingPresent = statsComplete && scoreboardIsList &&
    sRows.length > 0 &&
    sRows.every((c) => hasField(c, "forecaster") && hasField(c, "rank")) &&
    sRows.every((c) => isPyDict(c) && stats.has(c["forecaster"] as string));
  check(results, "ranking_integrity",
    "scoreboard_ranking_matches_brier_order", scoreboardRaw, rankingPresent,
    rankingPresent &&
      sRows.every((c) => !isPyDict(c) ||
        c["rank"] === expectedRank.get(c["forecaster"] as string)),
    "the published ranking follows the recomputed Brier order — lower Brier ranks first, ties break by forecaster name ascending");

  // ---- Section 5: honesty_and_live_use ----
  boolCheck(results, "honesty_and_live_use",
    "scoreboard_decision_stated", manifest,
    ["scoreboard_use", "decision_stated"],
    "target & decision: the decision this scoreboard drives — whose forecasts get trusted or weighted — is stated");
  boolCheck(results, "honesty_and_live_use",
    "decision_costs_considered", manifest,
    ["scoreboard_use", "decision_costs_considered"],
    "target & decision: the metric is chosen from the decision's costs — false positives vs false negatives rarely cost the same");
  falseCheck(results, "honesty_and_live_use",
    "no_metric_chosen_to_flatter", manifest,
    ["honesty", "metric_chosen_to_flatter_present"],
    "red line: no metric-chosen-to-flatter — the published score is not selected to flatter a forecaster");
  falseCheck(results, "honesty_and_live_use",
    "no_silent_score_rewrites", manifest,
    ["honesty", "silent_score_rewrites_present"],
    "red line: no silent updates — published scores are never silently rewritten after resolution");
  boolCheck(results, "honesty_and_live_use",
    "live_scores_refreshed_on_resolution", manifest,
    ["honesty", "scores_refreshed_as_outcomes_resolve"],
    "drift & loops: monitor live performance — scores are refreshed as new outcomes resolve");

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
    verdict = "CONFIDENCE_SCOREBOARD_NOT_SOUND";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "CONFIDENCE_SCOREBOARD_SOUND";
  }

  const computedNames = [
    "forecasts_declared",
    "every_forecast_names_forecaster",
    "every_forecast_states_claim",
    "every_forecast_probability_in_range",
    "every_forecast_outcome_binary",
    "scoreboard_declared",
    "scoreboard_covers_every_forecaster",
    "every_scoreboard_forecast_count_matches_ledger",
    "every_scoreboard_mean_probability_matches",
    "every_scoreboard_hit_rate_matches",
    "every_scoreboard_brier_score_matches",
    "every_scoreboard_calibration_gap_matches",
    "scoreboard_ranks_complete_and_unique",
    "scoreboard_ranking_matches_brier_order",
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
    service: "forecast-confidence-scoreboard",
    atom_version: "0.1.0",
    subject: manifest["subject"] ?? null,
    verdict,
    sections,
    checks: results,
    computed_status: computedStatus,
    forecasts_count: forecastsCount,
    forecasters_count: forecastersCount,
    overall_mean_stated_probability: fmt6(overallMean),
    overall_hit_rate: fmt6(overallHit),
    overall_calibration_gap: fmt6(overallGap),
    overall_brier_score: fmt6(overallBrier),
    calibration_direction: calibrationDirection,
    worst_calibrated_forecaster: worstCalibratedForecaster,
    forecasters_without_scoreboard_row: forecastersWithoutRow,
    scoreboard_rows_without_forecasts: sbRowsWithoutForecasts,
    mismatched_scoreboard_rows: mismatchedRows,
    forecasters_with_wrong_rank: forecastersWithWrongRank,
    summary:
      `${count("pass")} pass, ` +
      `${count("fail")} fail, ` +
      `${count("missing")} missing ` +
      `of ${results.length} checks across five sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "FORECAST CONFIDENCE SCOREBOARD",
    `subject: ${pyStr(verdict.subject ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(28)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
