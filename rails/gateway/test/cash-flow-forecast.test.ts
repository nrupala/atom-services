import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/cash-flow-forecast.js";
import { FieldTypeError } from "../src/atoms/validate.js";

function weeks(count = 13, net = 5000, opening = 100000) {
  const out: Record<string, unknown>[] = [];
  let balance = opening;
  for (let i = 0; i < count; i++) {
    balance += net;
    out.push({
      label: `week_${i + 1}`,
      inflows: 20000,
      outflows: 20000 - net,
      closing_balance: balance,
    });
  }
  return out;
}

// The CASH_FLOW_FORECAST_READY manifest, copied from the Python
// oracle tests.
const COMPLETE: Record<string, unknown> = {
  entity: "Acme Operations",
  flows: {
    recurring_inflows_mapped: true,
    recurring_outflows_mapped: true,
    seasonal_patterns_mapped: true,
    one_offs_mapped: true,
    lag_assumptions_documented: true,
  },
  forecast: {
    opening_balance: 100000,
    weeks: weeks(),
    rolling_maintained_weekly: true,
    monthly_annual_planning_present: true,
  },
  reserves: {
    target_set: true,
    monthly_fixed_costs: 20000,
    target_months: 3,
    declared_target_amount: 60000,
    held_separately: true,
    breach_requires_explicit_decision: true,
    put_at_risk: false,
  },
  working_capital: {
    ar_aging_reviewed_on_cadence: true,
    chase_ladder_applied: true,
    ap_calendar_maintained: true,
    inventory_only_where_it_pays: true,
  },
  levers: {
    inflow_acceleration_applied: true,
    outflows_phased: true,
    vendors_used_as_silent_financing: false,
  },
  runway: {
    cash_on_hand: 150000,
    burn: 10000,
    declared_runway_months: 15,
    alert_thresholds_at_6_and_3_months_set: true,
  },
  stress: {
    cases_run: ["revenue_minus_20_percent",
                "collections_plus_30_days_late", "surprise_capex"],
    answers_recorded: true,
    responses_predecided: true,
  },
  reporting: {
    weekly_position_and_forecast_reported: true,
    monthly_summary_drivers_annotated: true,
  },
  commitments: { committed_against_unlanded_receivables: false },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function checkStatus(v: ReturnType<typeof evaluate>, name: string) {
  return v.checks.find((c) => c.check === name)?.status;
}

// ---- The Python VerdictTests, ported ----

test("test_complete_manifest_is_ready", () => {
  const v = evaluate(clone(COMPLETE));
  assert.equal(v.verdict, "CASH_FLOW_FORECAST_READY");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.computed_status,
    "within_stated_limits_on_declared_evidence");
  assert.equal(v.checks.length, 30);
  assert.equal(v.weeks_evaluated, 13);
  assert.equal(v.computed_final_balance, "165000.000000");
  assert.equal(v.final_balance_difference, "0.000000");
  assert.equal(v.computed_reserve_target, "60000.000000");
  assert.equal(v.reserve_target_difference, "0.000000");
  assert.equal(v.computed_runway_months, "15.000000");
  assert.equal(v.runway_difference, "0.000000");
  assert.deepEqual(v.stress_cases_not_run, []);
});

test("test_balances_match_at_other_values_passes", () => {
  const m = clone(COMPLETE) as any;
  m.forecast.weeks = weeks(13, -2000);
  const v = evaluate(m);
  assert.equal(v.verdict, "CASH_FLOW_FORECAST_READY");
  assert.equal(v.computed_final_balance, "74000.000000");
});

test("test_closing_balance_disagreeing_with_flows_fails", () => {
  const m = clone(COMPLETE) as any;
  m.forecast.weeks[12].closing_balance = 160000;
  const v = evaluate(m);
  assert.equal(v.verdict, "CASH_FLOW_FORECAST_NOT_READY");
  assert.equal(v.sections["thirteen_week_forecast"], "fail");
  assert.equal(
    checkStatus(v, "weekly_closing_balances_match_rederived"), "fail");
  assert.equal(v.final_balance_difference, "-5000.000000");
  assert.equal(v.computed_status,
    "outside_stated_limits_on_declared_evidence");
});

test("test_mid_forecast_balance_error_fails_even_if_final_matches", () => {
  const m = clone(COMPLETE) as any;
  m.forecast.weeks[5].closing_balance += 1;
  const v = evaluate(m);
  assert.equal(
    checkStatus(v, "weekly_closing_balances_match_rederived"), "fail");
  assert.equal(v.final_balance_difference, "0.000000");
});

test("test_twelve_weeks_fails_thirteen_week_coverage", () => {
  const m = clone(COMPLETE) as any;
  m.forecast.weeks = weeks(12);
  const v = evaluate(m);
  assert.equal(v.verdict, "CASH_FLOW_FORECAST_NOT_READY");
  assert.equal(checkStatus(v, "forecast_covers_thirteen_weeks"), "fail");
  assert.equal(v.weeks_evaluated, 12);
  assert.equal(v.computed_final_balance, "160000.000000");
});

test("test_fourteen_weeks_also_fails_coverage", () => {
  const m = clone(COMPLETE) as any;
  m.forecast.weeks = weeks(14);
  assert.equal(evaluate(m).verdict, "CASH_FLOW_FORECAST_NOT_READY");
});

test("test_missing_weeks_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.forecast.weeks;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(
    checkStatus(v, "weekly_closing_balances_match_rederived"), "missing");
  assert.equal(v.weeks_evaluated, 0);
  assert.equal(v.computed_final_balance, null);
  assert.equal(v.computed_status, null);
});

test("test_empty_weeks_list_is_missing", () => {
  const m = clone(COMPLETE) as any;
  m.forecast.weeks = [];
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "forecast_covers_thirteen_weeks"), "missing");
});

test("test_incomplete_week_entry_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.forecast.weeks[3].inflows;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(
    checkStatus(v, "forecast_week_entries_complete"), "missing");
  assert.equal(v.weeks_evaluated, 12);
  assert.equal(v.computed_final_balance, null);
});

test("test_missing_opening_balance_makes_balances_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.forecast.opening_balance;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(
    checkStatus(v, "weekly_closing_balances_match_rederived"), "missing");
  assert.equal(checkStatus(v, "forecast_covers_thirteen_weeks"), "pass");
});

test("test_reserve_target_mismatch_fails", () => {
  const m = clone(COMPLETE) as any;
  m.reserves.declared_target_amount = 50000;
  const v = evaluate(m);
  assert.equal(v.verdict, "CASH_FLOW_FORECAST_NOT_READY");
  assert.equal(
    checkStatus(v,
      "reserve_target_amount_matches_months_times_fixed_costs"), "fail");
  assert.equal(v.reserve_target_difference, "-10000.000000");
});

test("test_reserve_target_at_other_months_passes", () => {
  const m = clone(COMPLETE) as any;
  m.reserves.target_months = 6;
  m.reserves.declared_target_amount = 120000;
  const v = evaluate(m);
  assert.equal(v.verdict, "CASH_FLOW_FORECAST_READY");
  assert.equal(v.computed_reserve_target, "120000.000000");
});

test("test_missing_reserve_number_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.reserves.target_months;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.computed_reserve_target, null);
});

test("test_reserve_put_at_risk_fails_red_line", () => {
  const m = clone(COMPLETE) as any;
  m.reserves.put_at_risk = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "CASH_FLOW_FORECAST_NOT_READY");
  assert.equal(v.sections["reserves_and_runway"], "fail");
});

test("test_reserve_not_held_separately_fails", () => {
  const m = clone(COMPLETE) as any;
  m.reserves.held_separately = false;
  assert.equal(evaluate(m).verdict, "CASH_FLOW_FORECAST_NOT_READY");
});

test("test_runway_mismatch_fails", () => {
  const m = clone(COMPLETE) as any;
  m.runway.declared_runway_months = 12;
  const v = evaluate(m);
  assert.equal(v.verdict, "CASH_FLOW_FORECAST_NOT_READY");
  assert.equal(
    checkStatus(v, "runway_matches_cash_divided_by_burn"), "fail");
  assert.equal(v.runway_difference, "-3.000000");
});

test("test_runway_at_other_values_passes", () => {
  const m = clone(COMPLETE) as any;
  m.runway = {
    cash_on_hand: 90000, burn: 12000, declared_runway_months: 7.5,
    alert_thresholds_at_6_and_3_months_set: true,
  };
  const v = evaluate(m);
  assert.equal(v.verdict, "CASH_FLOW_FORECAST_READY");
  assert.equal(v.computed_runway_months, "7.500000");
});

test("test_zero_burn_fails_runway", () => {
  const m = clone(COMPLETE) as any;
  m.runway.burn = 0;
  m.runway.declared_runway_months = 0;
  const v = evaluate(m);
  assert.equal(v.verdict, "CASH_FLOW_FORECAST_NOT_READY");
  assert.equal(v.computed_runway_months, null);
  assert.equal(v.runway_difference, null);
});

test("test_missing_runway_number_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.runway.declared_runway_months;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.computed_runway_months, "15.000000");
  assert.equal(v.runway_difference, null);
});

test("test_alert_thresholds_not_set_fails", () => {
  const m = clone(COMPLETE) as any;
  m.runway.alert_thresholds_at_6_and_3_months_set = false;
  assert.equal(evaluate(m).verdict, "CASH_FLOW_FORECAST_NOT_READY");
});

test("test_lag_assumptions_not_documented_fails", () => {
  const m = clone(COMPLETE) as any;
  m.flows.lag_assumptions_documented = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "CASH_FLOW_FORECAST_NOT_READY");
  assert.equal(v.sections["flows_and_lags"], "fail");
});

test("test_rolling_forecast_not_maintained_fails", () => {
  const m = clone(COMPLETE) as any;
  m.forecast.rolling_maintained_weekly = false;
  assert.equal(evaluate(m).verdict, "CASH_FLOW_FORECAST_NOT_READY");
});

test("test_ar_aging_not_reviewed_fails", () => {
  const m = clone(COMPLETE) as any;
  m.working_capital.ar_aging_reviewed_on_cadence = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "CASH_FLOW_FORECAST_NOT_READY");
  assert.equal(v.sections["working_capital_and_levers"], "fail");
});

test("test_vendors_as_silent_financing_fails_red_line", () => {
  const m = clone(COMPLETE) as any;
  m.levers.vendors_used_as_silent_financing = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "CASH_FLOW_FORECAST_NOT_READY");
  assert.equal(
    checkStatus(v, "vendors_not_used_as_silent_financing"), "fail");
});

test("test_stress_coverage_missing_one_fails", () => {
  const m = clone(COMPLETE) as any;
  m.stress.cases_run = m.stress.cases_run.filter(
    (c: string) => c !== "surprise_capex");
  const v = evaluate(m);
  assert.equal(v.verdict, "CASH_FLOW_FORECAST_NOT_READY");
  assert.deepEqual(v.stress_cases_not_run, ["surprise_capex"]);
  assert.equal(
    checkStatus(v, "stress_cases_cover_stated_cases"), "fail");
});

test("test_stress_empty_list_fails_not_missing", () => {
  const m = clone(COMPLETE) as any;
  m.stress.cases_run = [];
  const v = evaluate(m);
  assert.equal(v.verdict, "CASH_FLOW_FORECAST_NOT_READY");
  assert.deepEqual(v.stress_cases_not_run,
    ["revenue_minus_20_percent", "collections_plus_30_days_late",
     "surprise_capex"]);
});

test("test_stress_unknown_entries_do_not_satisfy_coverage", () => {
  const m = clone(COMPLETE) as any;
  m.stress.cases_run = ["recession", "rate_hike"];
  const v = evaluate(m);
  assert.equal(v.verdict, "CASH_FLOW_FORECAST_NOT_READY");
  assert.equal(v.stress_cases_not_run?.length, 3);
});

test("test_missing_stress_list_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.stress.cases_run;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.stress_cases_not_run, null);
});

test("test_stress_responses_not_predecided_fails", () => {
  const m = clone(COMPLETE) as any;
  m.stress.responses_predecided = false;
  assert.equal(evaluate(m).verdict, "CASH_FLOW_FORECAST_NOT_READY");
});

test("test_commitments_against_unlanded_receivables_fails", () => {
  const m = clone(COMPLETE) as any;
  m.commitments.committed_against_unlanded_receivables = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "CASH_FLOW_FORECAST_NOT_READY");
  assert.equal(v.sections["reporting_and_commitments"], "fail");
});

test("test_monthly_summary_without_drivers_fails", () => {
  const m = clone(COMPLETE) as any;
  m.reporting.monthly_summary_drivers_annotated = false;
  assert.equal(evaluate(m).verdict, "CASH_FLOW_FORECAST_NOT_READY");
});

test("test_absent_section_is_insufficient_not_failed", () => {
  const m = clone(COMPLETE) as any;
  delete m.stress;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["stress_tests"], "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.computed_status, null);
  assert.equal(v.weeks_evaluated, 0);
  assert.equal(v.computed_final_balance, null);
  assert.equal(v.computed_reserve_target, null);
  assert.equal(v.computed_runway_months, null);
  assert.equal(v.stress_cases_not_run, null);
});

test("test_stamp_names_the_verdict", () => {
  const v = evaluate(clone(COMPLETE));
  assert.ok(stamp(v).includes("VERDICT: CASH_FLOW_FORECAST_READY"));
});

test("test_non_object_manifest_rejected", () => {
  assert.throws(
    () => evaluate(["not", "a", "manifest"]),
    (err: unknown) =>
      err instanceof TypeError &&
      (err as Error).message === "manifest must be a JSON object",
  );
});

// ---- F1 regression: malformed field types (external verification
// Wave 1) — the Python MalformedTypeTests, ported. A documented
// field present with the wrong JSON type raises FieldTypeError
// naming the field — never a verdict over garbage.

function fieldError(field: string) {
  return (err: unknown) =>
    err instanceof FieldTypeError && err.field === field;
}

test("malformed: top-level string field as number rejected", () => {
  const m = clone(COMPLETE) as any;
  m.entity = 12345;
  assert.throws(() => evaluate(m), fieldError("entity"));
});

test("malformed: section as string rejected", () => {
  assert.throws(
    () => evaluate({ flows: "should-be-an-object" }),
    fieldError("flows"),
  );
});

test("malformed: list field as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.stress.cases_run = "surprise_capex";
  assert.throws(() => evaluate(m), fieldError("stress.cases_run"));
});

test("malformed: list entry as number rejected", () => {
  const m = clone(COMPLETE) as any;
  m.stress.cases_run = ["surprise_capex", 42];
  assert.throws(() => evaluate(m), fieldError("stress.cases_run[1]"));
});

test("malformed: weeks list as object rejected", () => {
  const m = clone(COMPLETE) as any;
  m.forecast.weeks = { label: "week_1" };
  assert.throws(() => evaluate(m), fieldError("forecast.weeks"));
});

test("malformed: week entry as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.forecast.weeks[0] = "week_1";
  assert.throws(() => evaluate(m), fieldError("forecast.weeks[0]"));
});

test("malformed: week numeric leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.forecast.weeks[2].inflows = "20000";
  assert.throws(() => evaluate(m), fieldError("forecast.weeks[2].inflows"));
});

test("malformed: week label as number rejected", () => {
  const m = clone(COMPLETE) as any;
  m.forecast.weeks[0].label = 1;
  assert.throws(() => evaluate(m), fieldError("forecast.weeks[0].label"));
});

test("malformed: boolean leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.flows.lag_assumptions_documented = "yes";
  assert.throws(
    () => evaluate(m), fieldError("flows.lag_assumptions_documented"));
});

test("malformed: numeric leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.runway.burn = "10000";
  assert.throws(() => evaluate(m), fieldError("runway.burn"));
});

test("malformed: numeric leaf as boolean rejected", () => {
  const m = clone(COMPLETE) as any;
  m.reserves.target_months = true;
  assert.throws(() => evaluate(m), fieldError("reserves.target_months"));
});

test("malformed: null section rejected", () => {
  const m = clone(COMPLETE) as any;
  m.reserves = null;
  assert.throws(() => evaluate(m), fieldError("reserves"));
});

// ---- Golden-fixture parity against the Python oracle ----

const fixturesDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "test",
  "fixtures",
);

interface Fixture {
  name: string;
  manifest: unknown;
  expected: unknown;
}

const fixtureFiles = readdirSync(fixturesDir)
  .filter((f) => f.startsWith("cash-flow-forecast--") && f.endsWith(".json"))
  .sort();

assert.ok(fixtureFiles.length > 0, "no golden fixtures found for this atom");

for (const file of fixtureFiles) {
  const fixture = JSON.parse(
    readFileSync(path.join(fixturesDir, file), "utf-8"),
  ) as Fixture;
  test(`golden fixture parity: ${fixture.name}`, () => {
    assert.deepStrictEqual(evaluate(fixture.manifest), fixture.expected);
  });
}
