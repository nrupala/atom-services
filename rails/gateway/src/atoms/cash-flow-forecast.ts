// Cash-flow forecast — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/cash-flow-forecast/src/cash_flow_forecast.py
// (evaluate() + stamp()). No logic changes: every verdict,
// section outcome, per-check status, evidence string, computed
// value and the summary string are byte-identical to the Python
// output for the same input. Computed amounts and ratios use the
// shared fixed serialization: round half up to 6dp —
// floor(v * 1000000 + 0.5) / 1000000 — then format with exactly
// six decimals; computed comparisons compare the fixed-6dp
// difference to zero. This atom validates a declared cash-flow
// forecast artifact; it produces no forecast and exercises no
// business judgment of its own.

import { pyStr } from "./release-readiness.js";
import { validateManifest, type FieldSpec } from "./validate.js";

// Documented manifest field types (SERVICE.md input table) — the
// identical spec the Python oracle validates against. A field
// present with the wrong JSON type raises FieldTypeError before
// any check runs (F1 remedy, external verification Wave 1).
// Vocabulary strings (the stress-case list entries) are validated
// as strings only, never enum-checked.
const MANIFEST_SPEC: { [field: string]: FieldSpec } = {
  entity: "string",
  flows: {
    recurring_inflows_mapped: "boolean",
    recurring_outflows_mapped: "boolean",
    seasonal_patterns_mapped: "boolean",
    one_offs_mapped: "boolean",
    lag_assumptions_documented: "boolean",
  },
  forecast: {
    opening_balance: "number",
    weeks: [{
      label: "string",
      inflows: "number",
      outflows: "number",
      closing_balance: "number",
    }],
    rolling_maintained_weekly: "boolean",
    monthly_annual_planning_present: "boolean",
  },
  reserves: {
    target_set: "boolean",
    monthly_fixed_costs: "number",
    target_months: "number",
    declared_target_amount: "number",
    held_separately: "boolean",
    breach_requires_explicit_decision: "boolean",
    put_at_risk: "boolean",
  },
  working_capital: {
    ar_aging_reviewed_on_cadence: "boolean",
    chase_ladder_applied: "boolean",
    ap_calendar_maintained: "boolean",
    inventory_only_where_it_pays: "boolean",
  },
  levers: {
    inflow_acceleration_applied: "boolean",
    outflows_phased: "boolean",
    vendors_used_as_silent_financing: "boolean",
  },
  runway: {
    cash_on_hand: "number",
    burn: "number",
    declared_runway_months: "number",
    alert_thresholds_at_6_and_3_months_set: "boolean",
  },
  stress: {
    cases_run: ["string"],
    answers_recorded: "boolean",
    responses_predecided: "boolean",
  },
  reporting: {
    weekly_position_and_forecast_reported: "boolean",
    monthly_summary_drivers_annotated: "boolean",
  },
  commitments: {
    committed_against_unlanded_receivables: "boolean",
  },
};

export const SECTIONS = [
  "flows_and_lags",
  "thirteen_week_forecast",
  "reserves_and_runway",
  "working_capital_and_levers",
  "stress_tests",
  "reporting_and_commitments",
] as const;

export const STATED_STRESS_CASES = [
  "revenue_minus_20_percent",
  "collections_plus_30_days_late",
  "surprise_capex",
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
  entity: unknown;
  verdict: string;
  sections: Record<string, string>;
  checks: CheckResult[];
  computed_status: string | null;
  weeks_evaluated: number;
  computed_final_balance: string | null;
  final_balance_difference: string | null;
  computed_reserve_target: string | null;
  reserve_target_difference: string | null;
  computed_runway_months: string | null;
  runway_difference: string | null;
  stress_cases_not_run: string[] | null;
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

function getEntry(
  entry: Record<string, unknown>,
  key: string,
): [unknown, boolean] {
  if (!Object.prototype.hasOwnProperty.call(entry, key)) {
    return [null, false];
  }
  return [entry[key], true];
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

function isNonemptyStr(value: unknown): boolean {
  return typeof value === "string" && value.length > 0;
}

function fmt6(value: number | null): string | null {
  if (value === null) return null;
  const rounded = Math.floor(value * 1000000 + 0.5) / 1000000;
  return rounded.toFixed(6);
}

interface ForecastComputed {
  weeksEvaluated: number;
  finalBalance: number | null;
  finalDifference: number | null;
}

function forecastChecks(
  results: CheckResult[],
  manifest: Record<string, unknown>,
): ForecastComputed {
  const [weeks, hasWeeks] = getPath(manifest, "forecast", "weeks");
  const [opening, hasOpening] = getPath(
    manifest, "forecast", "opening_balance");
  void hasOpening;
  if (!hasWeeks || !Array.isArray(weeks) || weeks.length === 0) {
    for (const [name, evidence] of [
      ["forecast_week_entries_complete",
       "no weekly forecast buckets declared"],
      ["forecast_covers_thirteen_weeks",
       "no weekly forecast buckets declared"],
      ["weekly_closing_balances_match_rederived",
       "no weekly forecast buckets declared"],
    ] as const) {
      check(results, "thirteen_week_forecast", name,
        weeks, false, false, evidence);
    }
    return { weeksEvaluated: 0, finalBalance: null, finalDifference: null };
  }
  let incomplete = false;
  let evaluated = 0;
  let balancesOk = true;
  let running: number | null = isNumber(opening) ? (opening as number) : null;
  let lastClosing: number | null = null;
  for (const entry of weeks as unknown[]) {
    if (!isPyDict(entry)) {
      incomplete = true;
      continue;
    }
    const [label, hasLabel] = getEntry(entry, "label");
    const [inflows, hasInflows] = getEntry(entry, "inflows");
    const [outflows, hasOutflows] = getEntry(entry, "outflows");
    const [closing, hasClosing] = getEntry(entry, "closing_balance");
    if (!(hasLabel && hasInflows && hasOutflows && hasClosing &&
        isNonemptyStr(label) && isNumber(inflows) &&
        isNumber(outflows) && isNumber(closing))) {
      incomplete = true;
      continue;
    }
    evaluated += 1;
    lastClosing = closing as number;
    if (running !== null) {
      running = running + (inflows as number) - (outflows as number);
      if (fmt6((closing as number) - running) !== "0.000000") {
        balancesOk = false;
      }
    }
  }
  if (incomplete) {
    check(results, "thirteen_week_forecast",
      "forecast_week_entries_complete",
      weeks, false, false,
      "a weekly bucket is missing its label, inflows, outflows, or closing balance");
  } else {
    check(results, "thirteen_week_forecast",
      "forecast_week_entries_complete",
      weeks, true, true,
      "every weekly bucket carries a label, inflows, outflows, and a closing balance");
  }
  check(results, "thirteen_week_forecast",
    "forecast_covers_thirteen_weeks",
    weeks, true, (weeks as unknown[]).length === 13,
    "method step 2: the rolling forecast declares exactly 13 weekly buckets — the horizon the skill names");
  let finalBalance: number | null = null;
  let difference: number | null = null;
  if (incomplete || !isNumber(opening)) {
    check(results, "thirteen_week_forecast",
      "weekly_closing_balances_match_rederived",
      weeks, false, false,
      "the opening balance or a weekly bucket is incomplete, so the closing balances cannot be re-derived");
  } else {
    finalBalance = running;
    difference = (lastClosing as number) - (running as number);
    check(results, "thirteen_week_forecast",
      "weekly_closing_balances_match_rederived",
      weeks, true, balancesOk,
      "method step 2: each declared weekly closing balance equals the opening balance plus cumulative declared inflows minus outflows");
  }
  return { weeksEvaluated: evaluated, finalBalance, finalDifference: difference };
}

export function evaluate(manifest: unknown): Verdict {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateManifest(manifest, MANIFEST_SPEC);
  const results: CheckResult[] = [];

  // ---- Section 1: flows_and_lags ----
  boolCheck(results, "flows_and_lags", "recurring_inflows_mapped",
    manifest, ["flows", "recurring_inflows_mapped"],
    "method step 1: recurring inflows are mapped");
  boolCheck(results, "flows_and_lags", "recurring_outflows_mapped",
    manifest, ["flows", "recurring_outflows_mapped"],
    "method step 1: recurring outflows are mapped");
  boolCheck(results, "flows_and_lags", "seasonal_patterns_mapped",
    manifest, ["flows", "seasonal_patterns_mapped"],
    "method step 1: seasonal patterns are mapped");
  boolCheck(results, "flows_and_lags", "one_offs_mapped",
    manifest, ["flows", "one_offs_mapped"],
    "method step 1: one-off flows are mapped");
  boolCheck(results, "flows_and_lags", "lag_assumptions_documented",
    manifest, ["flows", "lag_assumptions_documented"],
    "quality gate: lag assumptions are documented — payment terms, receivable days, settlement delays");

  // ---- Section 2: thirteen_week_forecast ----
  const { weeksEvaluated, finalBalance, finalDifference } =
    forecastChecks(results, manifest);
  boolCheck(results, "thirteen_week_forecast",
    "rolling_forecast_maintained_weekly",
    manifest, ["forecast", "rolling_maintained_weekly"],
    "quality gate: the rolling forecast is maintained weekly — stale forecasts cause surprises only");
  boolCheck(results, "thirteen_week_forecast",
    "monthly_annual_planning_present",
    manifest, ["forecast", "monthly_annual_planning_present"],
    "method step 2: monthly/annual buckets are kept for planning alongside the weekly near-term forecast");

  // ---- Section 3: reserves_and_runway ----
  boolCheck(results, "reserves_and_runway", "reserve_target_set",
    manifest, ["reserves", "target_set"],
    "quality gate: a reserve target is set");
  const [monthly, hasMonthly] = getPath(
    manifest, "reserves", "monthly_fixed_costs");
  const [months, hasMonths] = getPath(manifest, "reserves", "target_months");
  const [declaredAmt, hasAmt] = getPath(
    manifest, "reserves", "declared_target_amount");
  const reserveAllNumbers = hasMonthly && hasMonths && hasAmt &&
    isNumber(monthly) && isNumber(months) && isNumber(declaredAmt);
  const computedReserve: number | null =
    hasMonthly && hasMonths && isNumber(monthly) && isNumber(months)
      ? (months as number) * (monthly as number)
      : null;
  const reserveDifference: number | null =
    computedReserve !== null && hasAmt && isNumber(declaredAmt)
      ? (declaredAmt as number) - computedReserve
      : null;
  const reserveConsistent = reserveAllNumbers &&
    fmt6((declaredAmt as number) -
      (months as number) * (monthly as number)) === "0.000000";
  check(results, "reserves_and_runway",
    "reserve_target_amount_matches_months_times_fixed_costs",
    declaredAmt, reserveAllNumbers, reserveConsistent,
    "method step 4: the declared reserve target amount equals the declared months of fixed costs multiplied by the declared monthly fixed costs (minimum cash = X months of fixed costs; X itself is sized to volatility and is not judged here)");
  boolCheck(results, "reserves_and_runway", "reserve_held_separately",
    manifest, ["reserves", "held_separately"],
    "quality gate: the reserve is held separately from operating cash");
  boolCheck(results, "reserves_and_runway",
    "reserve_breach_requires_explicit_decision",
    manifest, ["reserves", "breach_requires_explicit_decision"],
    "quality gate: the reserve is only breached by explicit decision");
  falseCheck(results, "reserves_and_runway", "reserves_not_put_at_risk",
    manifest, ["reserves", "put_at_risk"],
    "red line: reserves are never put at risk");
  const [cash, hasCash] = getPath(manifest, "runway", "cash_on_hand");
  const [burn, hasBurn] = getPath(manifest, "runway", "burn");
  const [declaredRunway, hasRunway] = getPath(
    manifest, "runway", "declared_runway_months");
  const runwayAllNumbers = hasCash && hasBurn && hasRunway &&
    isNumber(cash) && isNumber(burn) && isNumber(declaredRunway);
  const computedRunway: number | null =
    hasCash && hasBurn && isNumber(cash) && isNumber(burn) &&
      (burn as number) > 0
      ? (cash as number) / (burn as number)
      : null;
  const runwayDifference: number | null =
    computedRunway !== null && hasRunway && isNumber(declaredRunway)
      ? (declaredRunway as number) - computedRunway
      : null;
  const runwayConsistent = runwayAllNumbers && (burn as number) > 0 &&
    fmt6((declaredRunway as number) -
      (cash as number) / (burn as number)) === "0.000000";
  check(results, "reserves_and_runway",
    "runway_matches_cash_divided_by_burn",
    declaredRunway, runwayAllNumbers, runwayConsistent,
    "method step 6: the declared runway equals the declared cash divided by the declared burn (burn = net monthly outflow; runway = cash / burn)");
  boolCheck(results, "reserves_and_runway",
    "runway_alert_thresholds_at_6_and_3_months_set",
    manifest, ["runway", "alert_thresholds_at_6_and_3_months_set"],
    "method step 6: alert thresholds are set at 6 and 3 months of runway");

  // ---- Section 4: working_capital_and_levers ----
  boolCheck(results, "working_capital_and_levers",
    "ar_aging_reviewed_on_cadence",
    manifest, ["working_capital", "ar_aging_reviewed_on_cadence"],
    "quality gate: AR aging is reviewed on cadence — who owes what");
  boolCheck(results, "working_capital_and_levers", "chase_ladder_applied",
    manifest, ["working_capital", "chase_ladder_applied"],
    "quality gate: the chase ladder is applied to receivables");
  boolCheck(results, "working_capital_and_levers",
    "ap_calendar_maintained",
    manifest, ["working_capital", "ap_calendar_maintained"],
    "method step 5: an AP calendar is maintained — discounts vs float");
  boolCheck(results, "working_capital_and_levers",
    "inventory_only_where_it_pays",
    manifest, ["working_capital", "inventory_only_where_it_pays"],
    "method step 5: inventory is held only where it pays");
  boolCheck(results, "working_capital_and_levers",
    "inflow_levers_applied_honestly",
    manifest, ["levers", "inflow_acceleration_applied"],
    "method step 3: inflows are accelerated honestly — invoicing discipline, deposits, follow-up cadence");
  boolCheck(results, "working_capital_and_levers", "outflow_levers_phased",
    manifest, ["levers", "outflows_phased"],
    "method step 3: outflows are phased — terms, batch purchases, timing");
  falseCheck(results, "working_capital_and_levers",
    "vendors_not_used_as_silent_financing",
    manifest, ["levers", "vendors_used_as_silent_financing"],
    "red line: vendors are never used as silent financing — obligations are never stiffed quietly");

  // ---- Section 5: stress_tests ----
  const [cases, hasCases] = getPath(manifest, "stress", "cases_run");
  const casesIsList = hasCases && Array.isArray(cases);
  const notRun: string[] | null = casesIsList
    ? STATED_STRESS_CASES.filter(
        (c) => !(cases as unknown[]).includes(c))
    : null;
  check(results, "stress_tests", "stress_cases_cover_stated_cases",
    cases, casesIsList,
    casesIsList && (notRun as string[]).length === 0,
    "method step 7: the stress cases run cover every case the skill names — revenue -20%, collections +30 days late, surprise capex");
  boolCheck(results, "stress_tests", "stress_answers_recorded",
    manifest, ["stress", "answers_recorded"],
    "method step 7: the stress answers are recorded — does the plan hold, case by case");
  boolCheck(results, "stress_tests", "stress_responses_predecided",
    manifest, ["stress", "responses_predecided"],
    "quality gate: stress responses are pre-decided");

  // ---- Section 6: reporting_and_commitments ----
  boolCheck(results, "reporting_and_commitments",
    "weekly_position_and_forecast_reported",
    manifest, ["reporting", "weekly_position_and_forecast_reported"],
    "method step 8: the weekly cash position and short forecast are reported");
  boolCheck(results, "reporting_and_commitments",
    "monthly_summary_drivers_annotated",
    manifest, ["reporting", "monthly_summary_drivers_annotated"],
    "method step 8: the monthly summary is reported with drivers annotated");
  falseCheck(results, "reporting_and_commitments",
    "no_commitments_against_unlanded_receivables",
    manifest, ["commitments", "committed_against_unlanded_receivables"],
    "red line: no commitments against expected receivables that haven't landed");

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
    verdict = "CASH_FLOW_FORECAST_NOT_READY";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "CASH_FLOW_FORECAST_READY";
  }

  const computedStatuses = results
    .filter((r) =>
      r.check === "forecast_covers_thirteen_weeks" ||
      r.check === "weekly_closing_balances_match_rederived" ||
      r.check === "reserve_target_amount_matches_months_times_fixed_costs" ||
      r.check === "runway_matches_cash_divided_by_burn" ||
      r.check === "stress_cases_cover_stated_cases")
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
    service: "cash-flow-forecast",
    atom_version: "0.1.0",
    entity: manifest["entity"] ?? null,
    verdict,
    sections,
    checks: results,
    computed_status: computedStatus,
    weeks_evaluated: weeksEvaluated,
    computed_final_balance: fmt6(finalBalance),
    final_balance_difference: fmt6(finalDifference),
    computed_reserve_target: fmt6(computedReserve),
    reserve_target_difference: fmt6(reserveDifference),
    computed_runway_months: fmt6(computedRunway),
    runway_difference: fmt6(runwayDifference),
    stress_cases_not_run: notRun,
    summary:
      `${countStatus("pass")} pass, ` +
      `${countStatus("fail")} fail, ` +
      `${countStatus("missing")} missing ` +
      `of ${results.length} checks across six sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "CASH-FLOW FORECAST",
    `entity: ${pyStr(verdict.entity ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(28)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
