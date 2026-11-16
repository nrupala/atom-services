// Strategy backtest validation — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/strategy-backtest-validation/src/strategy_backtest_validation.py
// (evaluate() + stamp()). No logic changes: every verdict, section
// outcome, per-check status, evidence string, computed output and
// the summary string are byte-identical to the Python output for
// the same input. The computed params-to-data ratio uses the
// shared fixed serialization: round half up to 4dp —
// floor(v * 10000 + 0.5) / 10000 — then format with exactly four
// decimals.

import { pyStr } from "./release-readiness.js";
import { validateManifest, type FieldSpec } from "./validate.js";

// Documented manifest field types (SERVICE.md input table) — the
// identical spec the Python oracle validates against. A field
// present with the wrong JSON type raises FieldTypeError before
// any check runs (F1 remedy, external verification Wave 1).
const MANIFEST_SPEC: { [field: string]: FieldSpec } = {
  strategy: "string",
  harness: {
    deterministic_runs: "boolean",
    data_snapshots_versioned: "boolean",
    point_in_time_universe: "boolean",
    look_ahead_used: "boolean",
    realistic_fills_modeled: "boolean",
  },
  protocol: {
    hypothesis_stated: "boolean",
    in_sample_reported: "boolean",
    out_of_sample_reported: "boolean",
    holdout_untouched_until_end: "boolean",
    walk_forward_reported: "boolean",
    reported_side_by_side: "boolean",
  },
  costs: {
    commissions_modeled: "boolean",
    spreads_modeled: "boolean",
    slippage_modeled: "boolean",
    borrow_modeled: "boolean",
    financing_modeled: "boolean",
    taxes_material: "boolean",
    taxes_modeled: "boolean",
    costs_skipped: "boolean",
  },
  overfit: {
    parameter_sensitivity_shown: "boolean",
    sensitivity_shows_smooth_plateau: "boolean",
    parameter_count: "number",
    observation_count: "number",
    best_of_n_disclosed: "boolean",
    curve_fit_parameters_used: "boolean",
  },
  fragility: {
    single_name_dominance_checked: "boolean",
    regime_dependence_checked: "boolean",
    capacity_liquidity_checked: "boolean",
  },
  paper: {
    period_or_fill_count_defined: "boolean",
    completed: "boolean",
    waived: "boolean",
    waiver_written_reason: "boolean",
    waiver_approval_recorded: "boolean",
    live_vs_model_compared: "boolean",
  },
  monitoring: {
    divergence_tracked: "boolean",
    kill_criteria_defined_before_scaling: "boolean",
    kill_criteria_cover_all_three: "boolean",
  },
  house_gates: {
    explicit_confirmation_for_live_trades: "boolean",
    max_planned_trade_usd: "number",
    clear_yes_for_trades_over_500: "boolean",
    backtest_used_as_sole_live_confirmation: "boolean",
  },
};

export const SECTIONS = [
  "harness_standards",
  "protocol_and_reporting",
  "costs_and_frictions",
  "overfit_and_fragility",
  "paper_gate",
  "live_monitoring_and_house_gates",
] as const;

export const LARGE_TRADE_THRESHOLD_USD = 500;

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
  strategy: unknown;
  verdict: string;
  sections: Record<string, string>;
  checks: CheckResult[];
  results_sets_reported: number;
  params_to_data_ratio: string | null;
  paper_gate_status: string | null;
  over_500_trade_declared: boolean | null;
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

function ratioCheck(
  results: CheckResult[],
  manifest: Record<string, unknown>,
): number | null {
  const [params, hasParams] = getPath(manifest, "overfit", "parameter_count");
  const [observations, hasObs] = getPath(manifest, "overfit", "observation_count");
  if (!(hasParams && hasObs)) {
    check(results, "overfit_and_fragility", "params_vs_data_ratio_computable",
      params, false, false,
      "overfit detection: params-vs-data ratio — no parameter count or observation count declared");
    return null;
  }
  if (!(isNumber(params) && isNumber(observations)) || observations === 0) {
    check(results, "overfit_and_fragility", "params_vs_data_ratio_computable",
      params, true, false,
      "overfit detection: params-vs-data ratio — the parameter count and observation count must be numbers and the observation count must be non-zero");
    return null;
  }
  check(results, "overfit_and_fragility", "params_vs_data_ratio_computable",
    params, true, true,
    "overfit detection: params-vs-data ratio recomputed from the declared parameter and observation counts (reported, with no acceptance bar — the skill states none)");
  return (params as number) / (observations as number);
}

function taxesCheck(
  results: CheckResult[],
  manifest: Record<string, unknown>,
): void {
  const [material, hasMaterial] = getPath(manifest, "costs", "taxes_material");
  const [modeled, hasModeled] = getPath(manifest, "costs", "taxes_modeled");
  if (hasMaterial && pyTruthy(material)) {
    check(results, "costs_and_frictions", "taxes_modeled_when_material",
      modeled, hasModeled, modeled === true,
      "costs & frictions: taxes modeled where material");
  } else {
    check(results, "costs_and_frictions", "taxes_modeled_when_material",
      material, hasMaterial, true,
      "taxes not declared material — modeling taxes is not required");
  }
}

function paperChecks(
  results: CheckResult[],
  manifest: Record<string, unknown>,
): void {
  const [completed, hasCompleted] = getPath(manifest, "paper", "completed");
  const [waived, hasWaived] = getPath(manifest, "paper", "waived");
  if (!(hasCompleted || hasWaived)) {
    check(results, "paper_gate", "paper_gate_completed_or_waived",
      completed, false, false,
      "no paper-gate completion or waiver declared");
  } else {
    check(results, "paper_gate", "paper_gate_completed_or_waived",
      completed, true, completed === true || waived === true,
      "quality gate: paper gate completed (or consciously waived with written reason + approval)");
  }
  if (hasWaived && pyTruthy(waived)) {
    const [reason, hasReason] = getPath(manifest, "paper", "waiver_written_reason");
    const [approval, hasApproval] = getPath(manifest, "paper", "waiver_approval_recorded");
    if (!(hasReason && hasApproval)) {
      check(results, "paper_gate", "waiver_reason_and_approval_documented",
        reason, false, false,
        "a paper-gate waiver requires a written reason and an approval on record");
    } else {
      check(results, "paper_gate", "waiver_reason_and_approval_documented",
        reason, true, reason === true && approval === true,
        "quality gate: a conscious waiver carries a written reason and an approval");
    }
  } else {
    check(results, "paper_gate", "waiver_reason_and_approval_documented",
      waived, hasWaived, true,
      "paper gate not waived — no waiver reason or approval is required");
  }
  if (hasWaived && pyTruthy(waived)) {
    check(results, "paper_gate", "live_vs_model_behavior_compared",
      waived, true, true,
      "paper gate waived — the paper-phase live-vs-model comparison is discharged by the waiver");
  } else {
    boolCheck(results, "paper_gate", "live_vs_model_behavior_compared",
      manifest, ["paper", "live_vs_model_compared"],
      "paper gate: compare live vs model behavior (slippage, signal timing) before scaling");
  }
}

function largeTradeCheck(
  results: CheckResult[],
  manifest: Record<string, unknown>,
): boolean | null {
  const [amount, hasAmount] = getPath(manifest, "house_gates", "max_planned_trade_usd");
  const [clear, hasClear] = getPath(manifest, "house_gates", "clear_yes_for_trades_over_500");
  if (!hasAmount) {
    check(results, "live_monitoring_and_house_gates",
      "trades_over_500_have_clear_yes",
      amount, false, false,
      "no maximum planned trade size declared, so the $500 clear-yes gate cannot be checked");
    return null;
  }
  if (!isNumber(amount)) {
    check(results, "live_monitoring_and_house_gates",
      "trades_over_500_have_clear_yes",
      amount, true, false,
      "the maximum planned trade size must be a number");
    return null;
  }
  if ((amount as number) <= LARGE_TRADE_THRESHOLD_USD) {
    check(results, "live_monitoring_and_house_gates",
      "trades_over_500_have_clear_yes",
      amount, true, true,
      "no trade over $500 declared — the clear-yes gate does not bind");
    return false;
  }
  if (!hasClear) {
    check(results, "live_monitoring_and_house_gates",
      "trades_over_500_have_clear_yes",
      clear, false, false,
      "a trade over $500 is declared but no clear-yes evidence is declared");
    return true;
  }
  check(results, "live_monitoring_and_house_gates",
    "trades_over_500_have_clear_yes",
    clear, true, clear === true,
    "house gate: >$500 trades need a clear yes");
  return true;
}

export function evaluate(manifest: unknown): Verdict {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateManifest(manifest, MANIFEST_SPEC);
  const results: CheckResult[] = [];

  // ---- Section 1: harness_standards ----
  boolCheck(results, "harness_standards", "deterministic_runs",
    manifest, ["harness", "deterministic_runs"],
    "harness standards: deterministic runs");
  boolCheck(results, "harness_standards", "data_snapshots_versioned",
    manifest, ["harness", "data_snapshots_versioned"],
    "harness standards: versioned data snapshots");
  boolCheck(results, "harness_standards", "point_in_time_universe_correct",
    manifest, ["harness", "point_in_time_universe"],
    "harness standards: correct point-in-time universes");
  falseCheck(results, "harness_standards", "no_look_ahead",
    manifest, ["harness", "look_ahead_used"],
    "harness standards: no look-ahead — signals use only what was known then");
  boolCheck(results, "harness_standards", "realistic_fills_modeled",
    manifest, ["harness", "realistic_fills_modeled"],
    "harness standards: realistic fills (next-open or worse for illiquid names)");

  // ---- Section 2: protocol_and_reporting ----
  boolCheck(results, "protocol_and_reporting",
    "hypothesis_stated_before_testing", manifest,
    ["protocol", "hypothesis_stated"],
    "protocol: hypothesis stated before in-sample development");
  boolCheck(results, "protocol_and_reporting",
    "in_sample_results_reported", manifest,
    ["protocol", "in_sample_reported"],
    "protocol: in-sample development results reported");
  boolCheck(results, "protocol_and_reporting",
    "out_of_sample_holdout_reported", manifest,
    ["protocol", "out_of_sample_reported"],
    "protocol: out-of-sample holdout results reported");
  boolCheck(results, "protocol_and_reporting",
    "holdout_untouched_until_end", manifest,
    ["protocol", "holdout_untouched_until_end"],
    "protocol: the out-of-sample holdout was untouched until the end");
  boolCheck(results, "protocol_and_reporting",
    "walk_forward_results_reported", manifest,
    ["protocol", "walk_forward_reported"],
    "protocol: walk-forward window results reported");
  boolCheck(results, "protocol_and_reporting",
    "all_three_reported_side_by_side", manifest,
    ["protocol", "reported_side_by_side"],
    "quality gate: OOS + walk-forward results reported with in-sample, side by side — all three, not just the shiny one");

  // ---- Section 3: costs_and_frictions ----
  boolCheck(results, "costs_and_frictions", "commissions_modeled",
    manifest, ["costs", "commissions_modeled"],
    "costs & frictions: commissions modeled from day one, not as an afterthought");
  boolCheck(results, "costs_and_frictions", "spreads_modeled",
    manifest, ["costs", "spreads_modeled"],
    "costs & frictions: spreads modeled");
  boolCheck(results, "costs_and_frictions", "slippage_modeled",
    manifest, ["costs", "slippage_modeled"],
    "costs & frictions: slippage modeled");
  boolCheck(results, "costs_and_frictions", "borrow_modeled",
    manifest, ["costs", "borrow_modeled"],
    "costs & frictions: borrow modeled");
  boolCheck(results, "costs_and_frictions", "financing_modeled",
    manifest, ["costs", "financing_modeled"],
    "costs & frictions: financing modeled");
  taxesCheck(results, manifest);
  falseCheck(results, "costs_and_frictions", "no_skipped_costs",
    manifest, ["costs", "costs_skipped"],
    "skill red line: no skipped costs");

  // ---- Section 4: overfit_and_fragility ----
  boolCheck(results, "overfit_and_fragility",
    "parameter_sensitivity_shown", manifest,
    ["overfit", "parameter_sensitivity_shown"],
    "overfit detection: parameter sensitivity shown");
  boolCheck(results, "overfit_and_fragility",
    "sensitivity_shows_smooth_plateau_not_sharp_peak", manifest,
    ["overfit", "sensitivity_shows_smooth_plateau"],
    "overfit detection: sensitivity shows smooth plateaus, not sharp peaks — if it only works at exactly 14/3/7, it doesn't work");
  const ratio = ratioCheck(results, manifest);
  boolCheck(results, "overfit_and_fragility",
    "best_of_n_trials_disclosed", manifest,
    ["overfit", "best_of_n_disclosed"],
    "overfit detection: \"best of N\" awareness — the number of trials the reported result was selected from is disclosed");
  falseCheck(results, "overfit_and_fragility",
    "no_curve_fit_parameters", manifest,
    ["overfit", "curve_fit_parameters_used"],
    "skill red line: no curve-fit parameters");
  boolCheck(results, "overfit_and_fragility",
    "single_name_dominance_checked", manifest,
    ["fragility", "single_name_dominance_checked"],
    "fragility checks: single-name dominance checked");
  boolCheck(results, "overfit_and_fragility",
    "regime_dependence_checked", manifest,
    ["fragility", "regime_dependence_checked"],
    "fragility checks: regime dependence checked (works only in bull markets?)");
  boolCheck(results, "overfit_and_fragility",
    "capacity_liquidity_checked", manifest,
    ["fragility", "capacity_liquidity_checked"],
    "fragility checks: capacity/liquidity checked (can the size actually trade?)");

  // ---- Section 5: paper_gate ----
  boolCheck(results, "paper_gate",
    "paper_period_or_fill_count_defined", manifest,
    ["paper", "period_or_fill_count_defined"],
    "paper gate: paper-trade (or tiny size with explicit sign-off) for a defined period/fill count");
  paperChecks(results, manifest);

  // ---- Section 6: live_monitoring_and_house_gates ----
  boolCheck(results, "live_monitoring_and_house_gates",
    "live_vs_backtest_divergence_tracked", manifest,
    ["monitoring", "divergence_tracked"],
    "live monitoring: live-vs-backtest divergence tracked");
  boolCheck(results, "live_monitoring_and_house_gates",
    "kill_criteria_defined_before_scaling", manifest,
    ["monitoring", "kill_criteria_defined_before_scaling"],
    "quality gate: kill criteria defined before scaling");
  boolCheck(results, "live_monitoring_and_house_gates",
    "kill_criteria_cover_drawdown_divergence_invalidation", manifest,
    ["monitoring", "kill_criteria_cover_all_three"],
    "live monitoring: kill criteria cover drawdown, divergence and invalidation, defined in advance");
  boolCheck(results, "live_monitoring_and_house_gates",
    "explicit_confirmation_for_live_trades", manifest,
    ["house_gates", "explicit_confirmation_for_live_trades"],
    "house gate: no live trade without explicit confirmation");
  const over500 = largeTradeCheck(results, manifest);
  falseCheck(results, "live_monitoring_and_house_gates",
    "no_backtest_alone_as_live_confirmation", manifest,
    ["house_gates", "backtest_used_as_sole_live_confirmation"],
    "skill red line: no \"the backtest says so\" as a substitute for live confirmation discipline");

  let reported = 0;
  for (const key of ["in_sample_reported", "out_of_sample_reported", "walk_forward_reported"]) {
    const [value] = getPath(manifest, "protocol", key);
    if (value === true) reported += 1;
  }
  const [completed, hasCompleted] = getPath(manifest, "paper", "completed");
  const [waived, hasWaived] = getPath(manifest, "paper", "waived");
  let paperGateStatus: string | null;
  if (completed === true) {
    paperGateStatus = "completed";
  } else if (waived === true) {
    paperGateStatus = "waived";
  } else if (hasCompleted || hasWaived) {
    paperGateStatus = "not_completed";
  } else {
    paperGateStatus = null;
  }

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
    service: "strategy-backtest-validation",
    atom_version: "0.1.0",
    strategy: manifest["strategy"] ?? null,
    verdict,
    sections,
    checks: results,
    results_sets_reported: reported,
    params_to_data_ratio: fmt4(ratio),
    paper_gate_status: paperGateStatus,
    over_500_trade_declared: over500,
    summary:
      `${count("pass")} pass, ` +
      `${count("fail")} fail, ` +
      `${count("missing")} missing ` +
      `of ${results.length} checks across six sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "STRATEGY BACKTEST VALIDATION",
    `strategy: ${pyStr(verdict.strategy ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(32)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
