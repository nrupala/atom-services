// Bias-controlled quant study pack — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/bias-controlled-quant-study-pack/src/
// bias_controlled_quant_study_pack.py (evaluate() + stamp()).
// No logic changes: every verdict, section outcome, per-check
// status, evidence string, computed value and the summary string
// are byte-identical to the Python output for the same input.
// Computed checks use ONLY what the bound skill (quant-research)
// itself states, plus the arithmetic / set logic of the declared
// values: cost coverage over the five costs the skill names,
// stability across at least two distinct declared periods, and
// reported-within-tested accounting coherence between the two
// declared signal counts. No significance level, deflation
// formula or test-count ceiling is imposed — the skill states
// none.

import { pyStr } from "./release-readiness.js";
import { validateManifest, type FieldSpec } from "./validate.js";

// Documented manifest field types (SERVICE.md input table) — the
// identical spec the Python oracle validates against. A field
// present with the wrong JSON type raises FieldTypeError before
// any check runs (F1 remedy, external verification Wave 1).
// Vocabulary strings (the cost list and stability-period list
// entries) are validated as strings only, never enum-checked.
const MANIFEST_SPEC: { [field: string]: FieldSpec } = {
  study: "string",
  hypothesis: {
    hypothesis_written: "boolean",
    prediction_stated: "boolean",
    falsification_test_defined: "boolean",
    results_looked_at_before_registration: "boolean",
  },
  data: {
    provenance_documented: "boolean",
    snapshot_version_documented: "boolean",
    adjusted_prices: "boolean",
    delisted_names_retained: "boolean",
    survivorship_gap_present: "boolean",
    point_in_time_fundamentals: "boolean",
    restatement_peeking: "boolean",
    timezone_timestamp_discipline: "boolean",
  },
  distribution: {
    fat_tails_considered: "boolean",
    volatility_clustering_considered: "boolean",
    gaussian_assumed: "boolean",
    crisis_correlations_considered: "boolean",
  },
  stationarity: {
    stability_tested: "boolean",
    stability_periods: ["string"],
    regime_context_provided: "boolean",
    mechanism_stated: "boolean",
    claim_made_without_regime_context: "boolean",
  },
  multiple_testing: {
    controlled: "boolean",
    deflated_significance_applied: "boolean",
    holdout_used: "boolean",
    signals_tested: "number",
    signals_reported: "number",
    p_hacked_screen_presented_as_strategy: "boolean",
    result_from_single_sample: "boolean",
  },
  costs: {
    costs_included: "boolean",
    included: ["string"],
    results_net_of_costs: "boolean",
  },
  reproducibility: {
    seeded_runs: "boolean",
    snapshot_pinned: "boolean",
    code_versioned: "boolean",
    rerunnable_by_others: "boolean",
  },
};

export const SECTIONS = [
  "hypothesis_preregistration",
  "data_hygiene",
  "distribution_reality",
  "stationarity_and_stability",
  "multiple_testing",
  "costs",
  "reproducibility",
] as const;

export const STATED_COSTS = [
  "spreads",
  "fees",
  "slippage",
  "borrow",
  "taxes",
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
  study: unknown;
  verdict: string;
  sections: Record<string, string>;
  checks: CheckResult[];
  computed_status: string | null;
  stability_period_count: number | null;
  signals_tested: number | null;
  signals_reported: number | null;
  signals_reported_minus_tested: number | null;
  costs_not_included: string[] | null;
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

function isCount(value: unknown): boolean {
  return isNumber(value) && Number.isInteger(value as number);
}

export function evaluate(manifest: unknown): Verdict {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateManifest(manifest, MANIFEST_SPEC);
  const results: CheckResult[] = [];

  // ---- Section 1: hypothesis_preregistration ----
  boolCheck(results, "hypothesis_preregistration",
    "hypothesis_written_before_analysis",
    manifest, ["hypothesis", "hypothesis_written"],
    "method step 1: the hypothesis is written before analysis (pre-registration)");
  boolCheck(results, "hypothesis_preregistration",
    "prediction_stated_before_analysis",
    manifest, ["hypothesis", "prediction_stated"],
    "method step 1: the prediction the hypothesis makes is stated before looking at results");
  boolCheck(results, "hypothesis_preregistration",
    "falsification_test_defined_before_analysis",
    manifest, ["hypothesis", "falsification_test_defined"],
    "quality gate: the falsification test is written before analysis — what result would kill the hypothesis");
  falseCheck(results, "hypothesis_preregistration",
    "results_not_seen_before_registration",
    manifest, ["hypothesis", "results_looked_at_before_registration"],
    "method step 1: results are not looked at before the hypothesis, prediction and falsification test are written");

  // ---- Section 2: data_hygiene ----
  boolCheck(results, "data_hygiene", "data_provenance_documented",
    manifest, ["data", "provenance_documented"],
    "quality gate: data provenance is documented — where every series came from");
  boolCheck(results, "data_hygiene", "snapshot_version_documented",
    manifest, ["data", "snapshot_version_documented"],
    "method step 2: the data snapshot version is documented alongside the provenance");
  boolCheck(results, "data_hygiene",
    "prices_adjusted_for_splits_and_dividends",
    manifest, ["data", "adjusted_prices"],
    "method step 2: adjusted prices (splits/dividends) are done correctly");
  boolCheck(results, "data_hygiene", "delisted_names_retained",
    manifest, ["data", "delisted_names_retained"],
    "method step 2: delisted names are retained in the dataset (survivorship)");
  falseCheck(results, "data_hygiene", "no_survivorship_gap",
    manifest, ["data", "survivorship_gap_present"],
    "quality gate: there is no survivorship gap — the dataset is not silently limited to names that survived");
  boolCheck(results, "data_hygiene",
    "point_in_time_fundamentals_used",
    manifest, ["data", "point_in_time_fundamentals"],
    "method step 2: fundamentals are point-in-time — the values as known on the date, not as later restated");
  falseCheck(results, "data_hygiene", "no_restatement_peeking",
    manifest, ["data", "restatement_peeking"],
    "method step 2: no restatement peeking — later restated fundamentals are not read back into earlier dates");
  boolCheck(results, "data_hygiene",
    "timezone_and_timestamp_discipline",
    manifest, ["data", "timezone_timestamp_discipline"],
    "method step 2: timezone and timestamp discipline is applied across the dataset");

  // ---- Section 3: distribution_reality ----
  boolCheck(results, "distribution_reality",
    "fat_tails_accounted_for",
    manifest, ["distribution", "fat_tails_considered"],
    "method step 3: fat tails are accounted for — extreme moves are more common than a normal distribution implies");
  boolCheck(results, "distribution_reality",
    "volatility_clustering_accounted_for",
    manifest, ["distribution", "volatility_clustering_considered"],
    "method step 3: volatility clustering is accounted for — turbulent and quiet periods bunch together");
  falseCheck(results, "distribution_reality", "gaussian_not_assumed",
    manifest, ["distribution", "gaussian_assumed"],
    "method step 3: a Gaussian distribution is not assumed — returns are non-normal");
  boolCheck(results, "distribution_reality",
    "crisis_correlation_rise_accounted_for",
    manifest, ["distribution", "crisis_correlations_considered"],
    "method step 3: the rise of correlations in crises is accounted for — diversification fails exactly when needed");

  // ---- Section 4: stationarity_and_stability ----
  boolCheck(results, "stationarity_and_stability",
    "stability_tested_across_periods",
    manifest, ["stationarity", "stability_tested"],
    "method step 4: stability is tested across periods — regimes end and relationships decay");
  const [periods, hasPeriods] = getPath(
    manifest, "stationarity", "stability_periods");
  const periodsIsList = hasPeriods && Array.isArray(periods);
  const periodCount: number | null = periodsIsList
    ? new Set(periods as unknown[]).size
    : null;
  check(results, "stationarity_and_stability",
    "stability_periods_cover_multiple_periods", periods,
    periodsIsList,
    periodsIsList && (periodCount as number) >= 2,
    "method step 4: the declared stability periods cover at least two distinct periods — stability 'across periods' cannot be shown inside a single period, and a repeated period is still one period");
  boolCheck(results, "stationarity_and_stability",
    "regime_context_provided",
    manifest, ["stationarity", "regime_context_provided"],
    "red line: performance claims carry their regime context — which regimes the study period covers");
  boolCheck(results, "stationarity_and_stability",
    "mechanism_theory_stated",
    manifest, ["stationarity", "mechanism_stated"],
    "method step 4: the study rests on a theory with a mechanism, preferred over a curve fit without one");
  falseCheck(results, "stationarity_and_stability",
    "no_claim_without_regime_context",
    manifest, ["stationarity", "claim_made_without_regime_context"],
    "red line: no 'works since 2021' claims without regime context");

  // ---- Section 5: multiple_testing ----
  boolCheck(results, "multiple_testing",
    "multiple_testing_controlled",
    manifest, ["multiple_testing", "controlled"],
    "quality gate: multiple testing is controlled — a screen that tests thousands of things expects lucky winners by chance alone");
  boolCheck(results, "multiple_testing",
    "deflated_significance_awareness_applied",
    manifest, ["multiple_testing", "deflated_significance_applied"],
    "method step 5: deflated significance awareness is applied — significance is read against how many things were tested");
  boolCheck(results, "multiple_testing", "holdout_discipline_applied",
    manifest, ["multiple_testing", "holdout_used"],
    "method step 5: holdout discipline is applied — part of the evidence is kept back and not used to select the result");
  const [tested, hasTested] = getPath(
    manifest, "multiple_testing", "signals_tested");
  const [reported, hasReported] = getPath(
    manifest, "multiple_testing", "signals_reported");
  const bothCounts = hasTested && hasReported &&
    isCount(tested) && isCount(reported);
  const coherent = bothCounts &&
    (tested as number) >= 0 && (reported as number) >= 0 &&
    (reported as number) <= (tested as number);
  check(results, "multiple_testing",
    "reported_signals_within_tested_count", reported,
    hasTested && hasReported, coherent,
    "method step 5: the signals reported as results never exceed the signals actually tested, and both declared counts are whole numbers — pure accounting coherence between the two counts the pack itself declares");
  falseCheck(results, "multiple_testing",
    "no_phacked_screen_presented_as_strategy",
    manifest,
    ["multiple_testing", "p_hacked_screen_presented_as_strategy"],
    "red line: no p-hacked screens presented as strategy");
  falseCheck(results, "multiple_testing",
    "result_not_from_single_lucky_sample",
    manifest, ["multiple_testing", "result_from_single_sample"],
    "red line: no result from one lucky sample");

  // ---- Section 6: costs ----
  boolCheck(results, "costs", "costs_included_from_day_one",
    manifest, ["costs", "costs_included"],
    "quality gate: costs are included from day one — a paper edge that dies after costs is not an edge");
  const [includedList, hasIncluded] = getPath(manifest, "costs", "included");
  const includedIsList = hasIncluded && Array.isArray(includedList);
  const notIncluded: string[] | null = includedIsList
    ? STATED_COSTS.filter(
        (c) => !(includedList as unknown[]).includes(c))
    : null;
  check(results, "costs", "all_stated_costs_included",
    includedList, includedIsList,
    includedIsList && (notIncluded as string[]).length === 0,
    "method step 6: the included costs cover every cost the skill names — spreads, fees, slippage, borrow, taxes");
  boolCheck(results, "costs", "results_reported_net_of_costs",
    manifest, ["costs", "results_net_of_costs"],
    "method step 6: results are reported net of costs — the edge shown is the edge after spreads, fees, slippage, borrow and taxes");

  // ---- Section 7: reproducibility ----
  boolCheck(results, "reproducibility", "seeded_runs",
    manifest, ["reproducibility", "seeded_runs"],
    "method step 7: runs are seeded — the same inputs rerun to the same outputs");
  boolCheck(results, "reproducibility", "data_snapshot_pinned",
    manifest, ["reproducibility", "snapshot_pinned"],
    "quality gate: the data snapshot is pinned — results are reproducible from the snapshot");
  boolCheck(results, "reproducibility",
    "notebooks_and_scripts_versioned",
    manifest, ["reproducibility", "code_versioned"],
    "method step 7: notebooks and scripts are versioned — the exact code that produced the result is on record");
  boolCheck(results, "reproducibility",
    "results_rerunnable_by_someone_else",
    manifest, ["reproducibility", "rerunnable_by_others"],
    "method step 7: results are rerunnable by someone else from the seeded runs, the pinned snapshot and the versioned code");

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
    verdict = "STUDY_PACK_NOT_COMPLETE";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "STUDY_PACK_COMPLETE";
  }

  const computedStatuses = results
    .filter((r) =>
      r.check === "stability_periods_cover_multiple_periods" ||
      r.check === "reported_signals_within_tested_count" ||
      r.check === "all_stated_costs_included")
    .map((r) => r.status);
  let computedStatus: string | null;
  if (computedStatuses.some((s) => s === "fail")) {
    computedStatus = "outside_stated_limits_on_declared_evidence";
  } else if (computedStatuses.every((s) => s === "pass")) {
    computedStatus = "within_stated_limits_on_declared_evidence";
  } else {
    computedStatus = null;
  }

  const signalsTested: number | null =
    hasTested && isNumber(tested) ? (tested as number) : null;
  const signalsReported: number | null =
    hasReported && isNumber(reported) ? (reported as number) : null;
  const signalsDifference: number | null =
    signalsTested !== null && signalsReported !== null
      ? signalsReported - signalsTested
      : null;

  const countStatus = (status: CheckStatus) =>
    results.filter((r) => r.status === status).length;

  return {
    service: "bias-controlled-quant-study-pack",
    atom_version: "0.1.0",
    study: manifest["study"] ?? null,
    verdict,
    sections,
    checks: results,
    computed_status: computedStatus,
    stability_period_count: periodCount,
    signals_tested: signalsTested,
    signals_reported: signalsReported,
    signals_reported_minus_tested: signalsDifference,
    costs_not_included: notIncluded,
    summary:
      `${countStatus("pass")} pass, ` +
      `${countStatus("fail")} fail, ` +
      `${countStatus("missing")} missing ` +
      `of ${results.length} checks across seven sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "BIAS-CONTROLLED QUANT STUDY PACK",
    `study: ${pyStr(verdict.study ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(28)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
