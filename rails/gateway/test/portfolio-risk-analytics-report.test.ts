import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp, fmt } from "../src/atoms/portfolio-risk-analytics-report.js";
import { FieldTypeError } from "../src/atoms/validate.js";

// The FULL manifest, copied from the Python RiskAnalyticsTests oracle.
const FULL: Record<string, unknown> = {
  portfolio: "test-portfolio",
  returns: [0.03, -0.02, 0.05, 0.01, -0.04, 0.02, 0.06, -0.01],
  benchmark_returns: [0.02, -0.01, 0.04, 0.005, -0.03, 0.015, 0.05, -0.005],
  periods_per_year: 12,
  risk_free_per_period: 0.001,
  var_confidence: 0.95,
  holdings: [
    { id: "A", weight: 50, currency: "USD" },
    { id: "B", weight: 30, currency: "USD" },
    { id: "C", weight: 20, currency: "CAD", leveraged: true,
      income_per_period: 0.03, financing_per_period: 0.01 },
  ],
  factors: [
    { name: "market",
      returns: [0.02, -0.015, 0.04, 0.008, -0.03, 0.012, 0.045, -0.006] },
    { name: "value",
      returns: [0.005, 0.002, -0.003, 0.001, 0.004, -0.002, 0.006, 0.003] },
  ],
  holding_returns: [
    { id: "A", returns: [0.04, -0.01, 0.06, 0.02, -0.03, 0.01, 0.07, -0.02] },
    { id: "B", returns: [0.02, -0.03, 0.04, 0.00, -0.05, 0.03, 0.05, 0.00] },
  ],
  correlation_window: 4,
  stress_scenarios: [
    { name: "gfc-like", portfolio_return: -0.35 },
    { name: "shock-ab",
      shocks: [{ holding_id: "A", return: -0.2 },
               { holding_id: "B", return: -0.1 },
               { holding_id: "C", return: 0.05 }] },
  ],
  decision_journal: [
    { confidence: 0.7, correct: true },
    { confidence: 0.6, correct: false },
    { confidence: 0.8, correct: true },
  ],
};

const PARAMS: Record<string, unknown> = {
  periods_per_year: 12, risk_free_per_period: 0.001, var_confidence: 0.95,
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function withParams(manifest: Record<string, unknown>): Record<string, unknown> {
  return { ...manifest, ...PARAMS };
}

type Section = Record<string, unknown>;
const sec = (v: ReturnType<typeof evaluate>, name: string): Section =>
  v[name as keyof typeof v] as Section;

// ---- The 32 Python RiskAnalyticsTests, ported ----

test("test_full_manifest_is_complete_with_no_gaps", () => {
  const v = evaluate(clone(FULL));
  assert.equal(v.status, "complete");
  assert.deepEqual(v.gaps, []);
  assert.deepEqual(v.layers, {
    holdings: "present", risk_metrics: "present",
    factor_exposures: "present", concentration: "present",
    decisions: "present",
  });
});

test("test_total_and_mean_return", () => {
  const rm = sec(evaluate(clone(FULL)), "risk_metrics");
  assert.equal(rm["mean_return_per_period"], "0.012500");
  assert.equal(rm["total_return"], "0.099984");
  assert.equal(rm["best_period_return"], "0.060000");
  assert.equal(rm["worst_period_return"], "-0.040000");
  assert.equal(rm["positive_period_fraction"], "0.625000");
});

test("test_volatility_and_annualization", () => {
  const rm = sec(evaluate(clone(FULL)), "risk_metrics");
  assert.equal(rm["volatility_per_period"], "0.034538");
  assert.equal(rm["annualized_volatility"], "0.119642");
  assert.equal(rm["annualized_return"], "0.153665");
});

test("test_drawdown_path", () => {
  const rm = sec(evaluate(clone(FULL)), "risk_metrics");
  assert.equal(rm["max_drawdown"], "-0.040000");
  assert.equal(rm["max_drawdown_peak_period"], 3);
  assert.equal(rm["max_drawdown_trough_period"], 4);
  assert.equal(rm["current_drawdown"], "-0.010000");
  assert.equal(rm["longest_underwater_periods"], 2);
});

test("test_drawdown_from_initial_capital", () => {
  const v = evaluate(withParams(
    { returns: [0.10, -0.05, 0.02, 0.03, -0.01, 0.04] }));
  const rm = sec(v, "risk_metrics");
  assert.equal(rm["max_drawdown"], "-0.050000");
  assert.equal(rm["max_drawdown_peak_period"], 0);
  assert.equal(rm["max_drawdown_trough_period"], 1);
  assert.equal(rm["longest_underwater_periods"], 4);
  assert.equal(rm["total_return"], "0.130374");
});

test("test_sharpe_and_sortino", () => {
  const rm = sec(evaluate(clone(FULL)), "risk_metrics");
  assert.equal(rm["downside_deviation_per_period"], "0.016744");
  assert.equal(rm["sharpe_per_period"], "0.332969");
  assert.equal(rm["sharpe_annualized"], "1.153438");
  assert.equal(rm["sortino_per_period"], "0.686797");
  assert.equal(rm["sortino_annualized"], "2.379134");
});

test("test_historical_var_cvar_nearest_rank", () => {
  const v = evaluate({ returns: [0.10, -0.05, 0.02, 0.03, -0.01, 0.04],
                       var_confidence: 0.8 });
  const rm = sec(v, "risk_metrics");
  assert.equal(rm["var_confidence"], "0.800000");
  assert.equal(rm["historical_var"], "0.010000");
  assert.equal(rm["historical_cvar"], "0.030000");
});

test("test_missing_parameters_are_labeled_gaps_not_defaults", () => {
  const v = evaluate({ returns: [0.02, -0.01, 0.03] });
  assert.equal(v.status, "partial");
  const rm = sec(v, "risk_metrics");
  assert.equal(rm["sharpe_per_period"], null);
  assert.equal(rm["annualized_volatility"], null);
  assert.equal(rm["historical_var"], null);
  assert.equal(v.gaps.length, 3);
});

test("test_invalid_var_confidence_is_a_gap", () => {
  const manifest = withParams({ returns: [0.02, -0.01, 0.03] });
  manifest["var_confidence"] = 1.0;
  const v = evaluate(manifest);
  assert.equal(v.status, "partial");
  assert.equal(sec(v, "risk_metrics")["historical_var"], null);
});

test("test_non_numeric_return_entries_excluded", () => {
  const v = evaluate(withParams(
    { returns: [0.02, "bad", -0.01, null, 0.03, true] }));
  assert.equal(v.status, "partial");
  assert.equal(v.counts["periods"], 3);
  assert.equal(v.counts["invalid_return_entries"], 3);
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.status, "insufficient_evidence");
  assert.equal(v.risk_metrics, null);
  assert.equal(v.layers["risk_metrics"], "absent");
});

test("test_single_observation_is_insufficient_evidence", () => {
  assert.equal(evaluate({ returns: [0.05] }).status,
               "insufficient_evidence");
});

test("test_non_list_returns_rejected", () => {
  // F1 test correction (coordinator ruling, 2026-11-15): the
  // single-observation test previously also asserted an
  // insufficient_evidence verdict over returns as a string — a
  // wrong-typed documented field (the field itself, not an entry;
  // invalid ENTRIES remain counted-and-excluded per SERVICE.md).
  // That assertion encoded the F1 defect itself: returns is
  // documented as a list, so the manifest is rejected with
  // FieldTypeError naming the field.
  assert.throws(
    () => evaluate({ returns: "not-a-series" }),
    (err: unknown) =>
      err instanceof FieldTypeError && err.field === "returns",
  );
});

test("test_benchmark_beta_and_correlation_exact", () => {
  const v = evaluate(withParams({
    returns: [0.02, 0.04, -0.02, 0.00],
    benchmark_returns: [0.01, 0.02, -0.01, 0.00],
  }));
  const b = sec(v, "benchmark");
  assert.equal(b["aligned"], true);
  assert.equal(b["beta"], "2.000000");
  assert.equal(b["correlation"], "1.000000");
  assert.equal(v.status, "complete");
});

test("test_benchmark_misalignment_is_a_gap", () => {
  const v = evaluate(withParams({
    returns: [0.02, 0.04, -0.02, 0.00],
    benchmark_returns: [0.01, 0.02],
  }));
  assert.equal(v.status, "partial");
  const b = sec(v, "benchmark");
  assert.equal(b["aligned"], false);
  assert.equal(b["beta"], null);
});

test("test_concentration_hhi_and_currency_shares", () => {
  const c = sec(evaluate(clone(FULL)), "concentration");
  assert.equal(c["weight_sum"], "100.000000");
  assert.equal(c["hhi"], "0.380000");
  assert.equal(c["effective_holdings"], "2.631579");
  assert.equal(c["largest_holding_id"], "A");
  assert.equal(c["largest_holding_share"], "0.500000");
  assert.deepEqual(c["currency_shares"], [
    { currency: "CAD", share: "0.200000" },
    { currency: "USD", share: "0.800000" },
  ]);
});

test("test_zero_weight_sum_is_a_gap", () => {
  const v = evaluate(withParams({
    returns: [0.02, -0.01, 0.03],
    holdings: [{ id: "A", weight: 10 }, { id: "B", weight: -10 }],
  }));
  assert.equal(v.status, "partial");
  assert.equal(sec(v, "concentration")["hhi"], null);
});

test("test_negative_carry_is_flagged_plainly", () => {
  const v = evaluate(withParams({
    returns: [0.02, -0.01, 0.03],
    holdings: [{ id: "L", weight: 100, leveraged: true,
                 income_per_period: 0.02, financing_per_period: 0.05 }],
  }));
  const carry = sec(v, "carry");
  const rows = carry["rows"] as Section[];
  assert.equal(rows[0]["net_carry_per_period"], "-0.030000");
  assert.equal(rows[0]["negative_carry"], true);
  assert.equal(carry["any_negative_carry"], true);
  assert.equal(v.status, "complete");
});

test("test_missing_carry_inputs_are_a_gap", () => {
  const v = evaluate(withParams({
    returns: [0.02, -0.01, 0.03],
    holdings: [{ id: "L", weight: 100, leveraged: true,
                 income_per_period: 0.02 }],
  }));
  assert.equal(v.status, "partial");
  const rows = sec(v, "carry")["rows"] as Section[];
  assert.equal(rows[0]["net_carry_per_period"], null);
  assert.equal(rows[0]["negative_carry"], null);
});

test("test_factor_ols_recovers_known_coefficients", () => {
  const f1 = [0.01, -0.02, 0.03, 0.005, -0.01, 0.02];
  const f2 = [0.002, 0.001, -0.004, 0.003, 0.0005, -0.002];
  const returns = f1.map((a, i) => 0.001 + 1.5 * a - 0.5 * f2[i]);
  const v = evaluate(withParams({
    returns,
    factors: [{ name: "f1", returns: f1 }, { name: "f2", returns: f2 }],
  }));
  const d = sec(v, "factor_decomposition");
  assert.equal(d["computable"], true);
  assert.equal(d["intercept_alpha_per_period"], "0.001000");
  assert.deepEqual(d["coefficients"], [
    { factor: "f1", coefficient: "1.500000" },
    { factor: "f2", coefficient: "-0.500000" },
  ]);
  assert.equal(d["r_squared"], "1.000000");
  assert.equal(d["residual_volatility_per_period"], "0.000000");
});

test("test_singular_factors_are_a_gap", () => {
  const f1 = [0.01, -0.02, 0.03, 0.005, -0.01, 0.02];
  const f2 = f1.map((a) => 2 * a);
  const v = evaluate(withParams({
    returns: [0.02, -0.01, 0.03, 0.00, -0.02, 0.01],
    factors: [{ name: "f1", returns: f1 }, { name: "f2", returns: f2 }],
  }));
  assert.equal(v.status, "partial");
  assert.equal(sec(v, "factor_decomposition")["computable"], false);
});

test("test_misaligned_factor_series_is_a_gap", () => {
  const v = evaluate(withParams({
    returns: [0.02, -0.01, 0.03],
    factors: [{ name: "mkt", returns: [0.01, 0.02] }],
  }));
  assert.equal(v.status, "partial");
  assert.equal(sec(v, "factor_decomposition")["computable"], false);
});

test("test_stress_portfolio_return_and_weighted_shocks", () => {
  const v = evaluate(clone(FULL));
  assert.deepEqual(v.stress_tests, [
    { name: "gfc-like", scenario_return: "-0.350000",
      basis: "portfolio_return" },
    { name: "shock-ab", scenario_return: "-0.120000",
      basis: "holding_shocks" },
  ]);
});

test("test_stress_missing_shock_is_a_gap", () => {
  const v = evaluate(withParams({
    returns: [0.02, -0.01, 0.03],
    holdings: [{ id: "A", weight: 60 }, { id: "B", weight: 40 }],
    stress_scenarios: [
      { name: "partial-shock",
        shocks: [{ holding_id: "A", return: -0.2 }] },
    ],
  }));
  assert.equal(v.status, "partial");
  assert.equal(v.stress_tests[0]["scenario_return"], null);
  assert.equal(v.stress_tests[0]["basis"], "not_computable");
});

test("test_journal_calibration", () => {
  const v = evaluate(withParams({
    returns: [0.02, -0.01, 0.03],
    decision_journal: [
      { confidence: 0.7, correct: true },
      { confidence: 0.7, correct: true },
      { confidence: 0.7, correct: true },
      { confidence: 0.7, correct: false },
    ],
  }));
  const j = sec(v, "decision_journal");
  assert.equal(j["mean_confidence"], "0.700000");
  assert.equal(j["hit_rate"], "0.750000");
  assert.equal(j["calibration_gap"], "0.050000");
  assert.equal(j["brier_score"], "0.190000");
});

test("test_journal_invalid_entries_counted", () => {
  const v = evaluate(withParams({
    returns: [0.02, -0.01, 0.03],
    decision_journal: [
      { confidence: 0.7, correct: true },
      { confidence: 1.5, correct: true },
      { confidence: 0.5 },
      "not-an-entry",
    ],
  }));
  assert.equal(v.status, "partial");
  assert.equal(v.counts["journal_entries"], 1);
  assert.equal(v.counts["invalid_journal_entries"], 3);
});

test("test_holding_correlations_and_max_pair", () => {
  const hc = sec(evaluate(clone(FULL)), "holding_correlations");
  assert.equal(hc["series_count"], 2);
  const pairs = hc["pairs"] as Section[];
  assert.equal(pairs[0]["correlation"], "0.867874");
  assert.equal((hc["max_pair"] as Section)["correlation"], "0.867874");
  assert.equal(hc["window"], 4);
  const wp = hc["window_pairs"] as Section[];
  assert.equal(wp[0]["correlation"], "0.864331");
});

test("test_constant_holding_series_correlation_is_a_gap", () => {
  const v = evaluate(withParams({
    returns: [0.02, -0.01, 0.03, 0.01],
    holding_returns: [
      { id: "A", returns: [0.01, 0.01, 0.01, 0.01] },
      { id: "B", returns: [0.02, -0.01, 0.03, 0.00] },
    ],
  }));
  assert.equal(v.status, "partial");
  const hc = sec(v, "holding_correlations");
  assert.equal((hc["pairs"] as Section[])[0]["correlation"], null);
  assert.equal(hc["max_pair"], null);
});

test("test_invalid_correlation_window_is_a_gap", () => {
  const v = evaluate(withParams({
    returns: [0.02, -0.01, 0.03],
    holding_returns: [{ id: "A", returns: [0.02, -0.01, 0.03] }],
    correlation_window: 99,
  }));
  assert.equal(v.status, "partial");
  assert.equal(sec(v, "holding_correlations")["window"], null);
});

test("test_constant_returns_zero_volatility", () => {
  const v = evaluate(withParams({ returns: [0.01, 0.01, 0.01] }));
  const rm = sec(v, "risk_metrics");
  assert.equal(v.status, "partial");
  assert.equal(rm["volatility_per_period"], "0.000000");
  assert.equal(rm["sharpe_per_period"], null);
  assert.equal(rm["sortino_per_period"], null);
  assert.equal(rm["max_drawdown"], "0.000000");
  assert.equal(rm["historical_var"], "-0.010000");
});

test("test_fmt_serialization_rule", () => {
  assert.equal(fmt(0.1234567), "0.123457");
  assert.equal(fmt(-2.5), "-2.500000");
  assert.equal(fmt(0), "0.000000");
  assert.equal(fmt(-0.0000001), "0.000000");
  assert.equal(fmt(null), null);
});

test("test_disclaimer_and_stamp", () => {
  const v = evaluate(clone(FULL));
  assert.ok(v.disclaimer.includes("not financial advice"));
  const text = stamp(v);
  assert.ok(text.includes("STATUS: complete"));
  assert.ok(text.includes("portfolio: test-portfolio"));
  assert.ok(text.includes("user decides"));
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
// naming the field — never a report over garbage. (List entries of
// the counted-invalid fields stay unvalidated per SERVICE.md —
// see MANIFEST_SPEC; the containers and the scalar fields are
// what this block pins.)

function fieldError(field: string) {
  return (err: unknown) =>
    err instanceof FieldTypeError && err.field === field;
}

test("malformed: recorded external case rejected", () => {
  assert.throws(
    () => evaluate({ portfolio: 12345, returns: "not_a_list", holdings: "should_be_a_list" }),
    fieldError("portfolio"),
  );
});

test("malformed: portfolio as number rejected", () => {
  assert.throws(
    () => evaluate({ portfolio: 12345 }),
    fieldError("portfolio"),
  );
});

test("malformed: returns as string rejected", () => {
  assert.throws(
    () => evaluate({ returns: "not_a_list" }),
    fieldError("returns"),
  );
});

test("malformed: holdings as string rejected", () => {
  assert.throws(
    () => evaluate({ holdings: "should_be_a_list" }),
    fieldError("holdings"),
  );
});

test("malformed: benchmark_returns as string rejected", () => {
  assert.throws(
    () => evaluate(withParams({ returns: [0.02, -0.01, 0.03], benchmark_returns: "not-a-list" })),
    fieldError("benchmark_returns"),
  );
});

test("malformed: parameter as string rejected", () => {
  const m = withParams({ returns: [0.02, -0.01, 0.03] });
  m["periods_per_year"] = "12";
  assert.throws(() => evaluate(m), fieldError("periods_per_year"));
});

test("malformed: factor name as number rejected", () => {
  assert.throws(
    () => evaluate(withParams({
      returns: [0.02, -0.01, 0.03],
      factors: [{ name: 42, returns: [0.01, 0.02, 0.0] }],
    })),
    fieldError("factors[0].name"),
  );
});

test("malformed: factor returns as string rejected", () => {
  assert.throws(
    () => evaluate(withParams({
      returns: [0.02, -0.01, 0.03],
      factors: [{ name: "mkt", returns: "not-a-list" }],
    })),
    fieldError("factors[0].returns"),
  );
});

test("malformed: null field rejected", () => {
  const m = withParams({ returns: [0.02, -0.01, 0.03] });
  m["var_confidence"] = null;
  assert.throws(() => evaluate(m), fieldError("var_confidence"));
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
  .filter((f) =>
    f.startsWith("portfolio-risk-analytics-report--") &&
    f.endsWith(".json"))
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
