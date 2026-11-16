import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/forecast-with-ranges-and-scorecard.js";
import { FieldTypeError } from "../src/atoms/validate.js";

// The READY manifest, copied from the Python VerdictTests oracle.
// Scorecard arithmetic: errors -10, 0, -10 -> MAE 6.67,
// MAPE 6.36, bias -6.67 (declared rounded to two decimals).
const READY: Record<string, unknown> = {
  series: "Portfolio revenue",
  forecast: {
    purpose_stated: true,
    horizon_stated: true,
    decision_cadence_matched: true,
    owner_named: true,
  },
  baselines: {
    naive_value: 95,
    moving_average_value: 102.5,
    seasonal_naive_value: 98,
    compared_to_forecast: true,
    complex_model_used: true,
    complex_model_beats_baselines: true,
  },
  decomposition: {
    level_trend_seasonality_shown: true,
    drivers_known: true,
    driver_based_shown: true,
  },
  range: { low: 90, base: 110, high: 135 },
  scenarios: [
    { name: "base", trigger_condition: "orders track plan" },
    { name: "best", trigger_condition: "pipeline closes early" },
    { name: "worst", trigger_condition: "churn spikes above 5%" },
  ],
  scenario_detail: { sensitivity_shown: true },
  scorecard: {
    published: true,
    tracked_per_series: true,
    history: [
      { period: "2026-01", forecast: 100, actual: 110 },
      { period: "2026-02", forecast: 120, actual: 120 },
      { period: "2026-03", forecast: 90, actual: 100 },
    ],
    declared_mae: 6.67,
    declared_mape_percent: 6.36,
    declared_bias: -6.67,
  },
  revision: {
    forecast_actual_history_preserved: true,
    revisions_made: true,
    revision_reasons_documented: true,
    silently_restated: false,
  },
  cadence: {
    rolling_forecast_maintained: true,
    cadence_matches_review_rhythm: true,
    forecast_updated_on_cadence: true,
  },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

// ---- The 26 Python VerdictTests, ported ----

test("test_ready_manifest_is_forecast_ready", () => {
  const v = evaluate(clone(READY));
  assert.equal(v.verdict, "FORECAST_READY");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.history_entries_evaluated, 3);
  assert.equal(v.scenarios_evaluated, 3);
  assert.equal(v.checks.length, 25);
});

test("test_forecast_without_owner_fails", () => {
  const m = clone(READY) as any;
  m.forecast.owner_named = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "FORECAST_NOT_READY");
  assert.equal(v.sections["purpose_and_horizon"], "fail");
});

test("test_missing_baseline_value_is_insufficient_evidence", () => {
  const m = clone(READY) as any;
  delete m.baselines.seasonal_naive_value;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["baselines_and_decomposition"],
               "insufficient_evidence");
});

test("test_non_numeric_baseline_value_rejected", () => {
  // F1 test correction (coordinator ruling, 2026-11-15): this test
  // previously asserted a FORECAST_NOT_READY verdict over a
  // wrong-typed documented field — that assertion encoded the F1
  // defect itself. A non-numeric baseline value is a caller error,
  // rejected with FieldTypeError naming the field.
  const m = clone(READY) as any;
  m.baselines.naive_value = "last month";
  assert.throws(
    () => evaluate(m),
    (err: unknown) =>
      err instanceof FieldTypeError &&
      err.field === "baselines.naive_value",
  );
});

test("test_complex_model_not_beating_baselines_fails", () => {
  const m = clone(READY) as any;
  m.baselines.complex_model_beats_baselines = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "FORECAST_NOT_READY");
  assert.equal(v.sections["baselines_and_decomposition"], "fail");
});

test("test_no_complex_model_passes_beats_check_as_not_applicable", () => {
  const m = clone(READY) as any;
  m.baselines.complex_model_used = false;
  delete m.baselines.complex_model_beats_baselines;
  assert.equal(evaluate(m).verdict, "FORECAST_READY");
});

test("test_drivers_known_without_driver_based_forecast_fails", () => {
  const m = clone(READY) as any;
  m.decomposition.driver_based_shown = false;
  assert.equal(evaluate(m).verdict, "FORECAST_NOT_READY");
});

test("test_no_known_drivers_passes_driver_check_as_not_applicable", () => {
  const m = clone(READY) as any;
  m.decomposition.drivers_known = false;
  delete m.decomposition.driver_based_shown;
  assert.equal(evaluate(m).verdict, "FORECAST_READY");
});

test("test_bare_point_range_fails", () => {
  const m = clone(READY) as any;
  m.range = { low: 110, base: 110, high: 110 };
  const v = evaluate(m);
  assert.equal(v.verdict, "FORECAST_NOT_READY");
  assert.equal(v.sections["ranges_and_scenarios"], "fail");
});

test("test_disordered_range_fails", () => {
  const m = clone(READY) as any;
  m.range = { low: 120, base: 110, high: 135 };
  assert.equal(evaluate(m).verdict, "FORECAST_NOT_READY");
});

test("test_range_at_boundary_low_equals_base_passes", () => {
  const m = clone(READY) as any;
  m.range = { low: 110, base: 110, high: 135 };
  assert.equal(evaluate(m).verdict, "FORECAST_READY");
});

test("test_missing_range_is_insufficient_evidence", () => {
  const m = clone(READY) as any;
  delete m.range;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["ranges_and_scenarios"],
               "insufficient_evidence");
});

test("test_scenarios_missing_worst_case_fail", () => {
  const m = clone(READY) as any;
  m.scenarios = m.scenarios.slice(0, 2);
  const v = evaluate(m);
  assert.equal(v.verdict, "FORECAST_NOT_READY");
  assert.equal(v.sections["ranges_and_scenarios"], "fail");
});

test("test_scenario_without_trigger_fails", () => {
  const m = clone(READY) as any;
  delete m.scenarios[2].trigger_condition;
  assert.equal(evaluate(m).verdict, "FORECAST_NOT_READY");
});

test("test_declared_mae_mismatch_fails_scorecard", () => {
  const m = clone(READY) as any;
  m.scorecard.declared_mae = 2.5;
  const v = evaluate(m);
  assert.equal(v.verdict, "FORECAST_NOT_READY");
  assert.equal(v.sections["scorecard_accuracy"], "fail");
});

test("test_declared_mae_just_outside_tolerance_fails", () => {
  const m = clone(READY) as any;
  m.scorecard.declared_mae = 6.68;
  const v = evaluate(m);
  assert.equal(v.verdict, "FORECAST_NOT_READY");
  assert.equal(v.sections["scorecard_accuracy"], "fail");
});

test("test_declared_bias_mismatch_fails_scorecard", () => {
  const m = clone(READY) as any;
  m.scorecard.declared_bias = 6.67;
  const v = evaluate(m);
  assert.equal(v.verdict, "FORECAST_NOT_READY");
  assert.equal(v.sections["scorecard_accuracy"], "fail");
});

test("test_history_entry_missing_actual_is_insufficient_evidence", () => {
  const m = clone(READY) as any;
  delete m.scorecard.history[0].actual;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["scorecard_accuracy"],
               "insufficient_evidence");
  assert.equal(v.history_entries_evaluated, 2);
});

test("test_zero_actuals_make_mape_unverifiable", () => {
  const m = clone(READY) as any;
  for (const entry of m.scorecard.history) entry.actual = 0;
  m.scorecard.declared_mae = 103.33;
  m.scorecard.declared_bias = 103.33;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["scorecard_accuracy"],
               "insufficient_evidence");
});

test("test_silent_restatement_fails_revision_hygiene", () => {
  const m = clone(READY) as any;
  m.revision.silently_restated = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "FORECAST_NOT_READY");
  assert.equal(v.sections["revision_hygiene"], "fail");
});

test("test_revision_without_reason_fails", () => {
  const m = clone(READY) as any;
  m.revision.revision_reasons_documented = false;
  assert.equal(evaluate(m).verdict, "FORECAST_NOT_READY");
});

test("test_no_revisions_passes_reasons_check_as_not_applicable", () => {
  const m = clone(READY) as any;
  m.revision.revisions_made = false;
  delete m.revision.revision_reasons_documented;
  assert.equal(evaluate(m).verdict, "FORECAST_READY");
});

test("test_absent_evidence_is_insufficient_not_failed", () => {
  const m = clone(READY) as any;
  delete m.cadence;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["cadence"], "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.history_entries_evaluated, 0);
  assert.equal(v.scenarios_evaluated, 0);
});

test("test_stamp_names_the_verdict", () => {
  assert.ok(stamp(evaluate(clone(READY))).includes("VERDICT: FORECAST_READY"));
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

test("malformed: recorded external case rejected", () => {
  assert.throws(
    () => evaluate({ baselines: { naive_value: "not_a_number", moving_average_value: 100, seasonal_naive_value: 100 } }),
    fieldError("baselines.naive_value"),
  );
});

test("malformed: baseline leaf as string rejected", () => {
  assert.throws(
    () => evaluate({ baselines: { naive_value: "not_a_number" } }),
    fieldError("baselines.naive_value"),
  );
});

test("malformed: section as string rejected", () => {
  assert.throws(
    () => evaluate({ baselines: "not-an-object" }),
    fieldError("baselines"),
  );
});

test("malformed: range leaf as string rejected", () => {
  const m = structuredClone(READY) as Record<string, any>;
  m.range.low = "low";
  assert.throws(() => evaluate(m), fieldError("range.low"));
});

test("malformed: list field as string rejected", () => {
  const m = structuredClone(READY) as Record<string, any>;
  m.scenarios = "not-a-list";
  assert.throws(() => evaluate(m), fieldError("scenarios"));
});

test("malformed: list entry field as number rejected", () => {
  const m = structuredClone(READY) as Record<string, any>;
  m.scenarios[0].name = 42;
  assert.throws(() => evaluate(m), fieldError("scenarios[0].name"));
});

test("malformed: nested history entry field as string rejected", () => {
  const m = structuredClone(READY) as Record<string, any>;
  m.scorecard.history[0].forecast = "soon";
  assert.throws(() => evaluate(m), fieldError("scorecard.history[0].forecast"));
});

test("malformed: null field rejected", () => {
  const m = structuredClone(READY) as Record<string, any>;
  m.range = null;
  assert.throws(() => evaluate(m), fieldError("range"));
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
  .filter((f) => f.startsWith("forecast-with-ranges-and-scorecard--") && f.endsWith(".json"))
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
