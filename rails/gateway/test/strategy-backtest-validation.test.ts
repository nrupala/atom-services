import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/strategy-backtest-validation.js";
import { FieldTypeError } from "../src/atoms/validate.js";

// The VALIDATED manifest, copied from the Python VerdictTests oracle.
const VALIDATED: Record<string, unknown> = {
  strategy: "Momentum rotation v3",
  harness: { deterministic_runs: true,
             data_snapshots_versioned: true,
             point_in_time_universe: true,
             look_ahead_used: false,
             realistic_fills_modeled: true },
  protocol: { hypothesis_stated: true,
              in_sample_reported: true,
              out_of_sample_reported: true,
              holdout_untouched_until_end: true,
              walk_forward_reported: true,
              reported_side_by_side: true },
  costs: { commissions_modeled: true,
           spreads_modeled: true,
           slippage_modeled: true,
           borrow_modeled: true,
           financing_modeled: true,
           taxes_material: true,
           taxes_modeled: true,
           costs_skipped: false },
  overfit: { parameter_sensitivity_shown: true,
             sensitivity_shows_smooth_plateau: true,
             parameter_count: 6,
             observation_count: 1200,
             best_of_n_disclosed: true,
             curve_fit_parameters_used: false },
  fragility: { single_name_dominance_checked: true,
               regime_dependence_checked: true,
               capacity_liquidity_checked: true },
  paper: { period_or_fill_count_defined: true,
           completed: true,
           waived: false,
           live_vs_model_compared: true },
  monitoring: { divergence_tracked: true,
                kill_criteria_defined_before_scaling: true,
                kill_criteria_cover_all_three: true },
  house_gates: { explicit_confirmation_for_live_trades: true,
                 max_planned_trade_usd: 1500,
                 clear_yes_for_trades_over_500: true,
                 backtest_used_as_sole_live_confirmation: false },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

// ---- The 32 Python VerdictTests, ported ----

test("test_validated_manifest_is_validated", () => {
  const v = evaluate(clone(VALIDATED));
  assert.equal(v.verdict, "VALIDATED");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.checks.length, 36);
});

test("test_computed_outputs", () => {
  const v = evaluate(clone(VALIDATED));
  assert.equal(v.results_sets_reported, 3);
  assert.equal(v.params_to_data_ratio, "0.0050");
  assert.equal(v.paper_gate_status, "completed");
  assert.equal(v.over_500_trade_declared, true);
});

test("test_look_ahead_fails_harness_red_line", () => {
  const m = clone(VALIDATED) as any;
  m.harness.look_ahead_used = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_VALIDATED");
  assert.equal(v.sections["harness_standards"], "fail");
});

test("test_unrealistic_fills_fail", () => {
  const m = clone(VALIDATED) as any;
  m.harness.realistic_fills_modeled = false;
  assert.equal(evaluate(m).verdict, "NOT_VALIDATED");
});

test("test_oos_not_reported_fails_protocol", () => {
  const m = clone(VALIDATED) as any;
  m.protocol.out_of_sample_reported = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_VALIDATED");
  assert.equal(v.sections["protocol_and_reporting"], "fail");
  assert.equal(v.results_sets_reported, 2);
});

test("test_holdout_touched_fails", () => {
  const m = clone(VALIDATED) as any;
  m.protocol.holdout_untouched_until_end = false;
  assert.equal(evaluate(m).verdict, "NOT_VALIDATED");
});

test("test_not_reported_side_by_side_fails_quality_gate", () => {
  const m = clone(VALIDATED) as any;
  m.protocol.reported_side_by_side = false;
  assert.equal(evaluate(m).verdict, "NOT_VALIDATED");
});

test("test_unmodeled_commissions_fail_costs", () => {
  const m = clone(VALIDATED) as any;
  m.costs.commissions_modeled = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_VALIDATED");
  assert.equal(v.sections["costs_and_frictions"], "fail");
});

test("test_skipped_costs_fail_red_line", () => {
  const m = clone(VALIDATED) as any;
  m.costs.costs_skipped = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_VALIDATED");
  assert.equal(v.sections["costs_and_frictions"], "fail");
});

test("test_taxes_material_but_not_modeled_fails", () => {
  const m = clone(VALIDATED) as any;
  m.costs.taxes_modeled = false;
  assert.equal(evaluate(m).verdict, "NOT_VALIDATED");
});

test("test_taxes_not_material_passes_without_modeling", () => {
  const m = clone(VALIDATED) as any;
  m.costs.taxes_material = false;
  delete m.costs.taxes_modeled;
  assert.equal(evaluate(m).verdict, "VALIDATED");
});

test("test_taxes_material_evidence_absent_is_insufficient", () => {
  const m = clone(VALIDATED) as any;
  delete m.costs.taxes_modeled;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["costs_and_frictions"], "insufficient_evidence");
});

test("test_curve_fit_parameters_fail_red_line", () => {
  const m = clone(VALIDATED) as any;
  m.overfit.curve_fit_parameters_used = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_VALIDATED");
  assert.equal(v.sections["overfit_and_fragility"], "fail");
});

test("test_sharp_peak_sensitivity_fails", () => {
  const m = clone(VALIDATED) as any;
  m.overfit.sensitivity_shows_smooth_plateau = false;
  assert.equal(evaluate(m).verdict, "NOT_VALIDATED");
});

test("test_ratio_recomputed_with_no_acceptance_bar", () => {
  const m = clone(VALIDATED) as any;
  m.overfit.parameter_count = 900;
  const v = evaluate(m);
  assert.equal(v.verdict, "VALIDATED");
  assert.equal(v.params_to_data_ratio, "0.7500");
});

test("test_ratio_zero_observations_fails", () => {
  const m = clone(VALIDATED) as any;
  m.overfit.observation_count = 0;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_VALIDATED");
  assert.equal(v.params_to_data_ratio, null);
});

test("test_ratio_counts_absent_is_insufficient", () => {
  const m = clone(VALIDATED) as any;
  delete m.overfit.parameter_count;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.params_to_data_ratio, null);
});

test("test_regime_dependence_not_checked_fails", () => {
  const m = clone(VALIDATED) as any;
  m.fragility.regime_dependence_checked = false;
  assert.equal(evaluate(m).verdict, "NOT_VALIDATED");
});

test("test_paper_gate_not_completed_or_waived_fails", () => {
  const m = clone(VALIDATED) as any;
  m.paper.completed = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_VALIDATED");
  assert.equal(v.sections["paper_gate"], "fail");
  assert.equal(v.paper_gate_status, "not_completed");
});

test("test_paper_waiver_with_reason_and_approval_validates", () => {
  const m = clone(VALIDATED) as any;
  m.paper = { period_or_fill_count_defined: true,
              completed: false,
              waived: true,
              waiver_written_reason: true,
              waiver_approval_recorded: true };
  const v = evaluate(m);
  assert.equal(v.verdict, "VALIDATED");
  assert.equal(v.paper_gate_status, "waived");
});

test("test_paper_waiver_without_reason_fails", () => {
  const m = clone(VALIDATED) as any;
  m.paper = { period_or_fill_count_defined: true,
              completed: false,
              waived: true,
              waiver_written_reason: false,
              waiver_approval_recorded: true };
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_VALIDATED");
  assert.equal(v.sections["paper_gate"], "fail");
});

test("test_paper_waiver_reason_absent_is_insufficient", () => {
  const m = clone(VALIDATED) as any;
  m.paper = { period_or_fill_count_defined: true,
              completed: false,
              waived: true,
              waiver_approval_recorded: true };
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
});

test("test_live_vs_model_not_compared_fails", () => {
  const m = clone(VALIDATED) as any;
  m.paper.live_vs_model_compared = false;
  assert.equal(evaluate(m).verdict, "NOT_VALIDATED");
});

test("test_kill_criteria_not_defined_fails", () => {
  const m = clone(VALIDATED) as any;
  m.monitoring.kill_criteria_defined_before_scaling = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_VALIDATED");
  assert.equal(v.sections["live_monitoring_and_house_gates"], "fail");
});

test("test_trade_over_500_without_clear_yes_fails", () => {
  const m = clone(VALIDATED) as any;
  m.house_gates.clear_yes_for_trades_over_500 = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_VALIDATED");
  assert.equal(v.over_500_trade_declared, true);
});

test("test_trade_at_exactly_500_does_not_bind_clear_yes", () => {
  const m = clone(VALIDATED) as any;
  m.house_gates.max_planned_trade_usd = 500;
  delete m.house_gates.clear_yes_for_trades_over_500;
  const v = evaluate(m);
  assert.equal(v.verdict, "VALIDATED");
  assert.equal(v.over_500_trade_declared, false);
});

test("test_trade_over_500_clear_yes_absent_is_insufficient", () => {
  const m = clone(VALIDATED) as any;
  delete m.house_gates.clear_yes_for_trades_over_500;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.over_500_trade_declared, true);
});

test("test_backtest_alone_as_confirmation_fails_red_line", () => {
  const m = clone(VALIDATED) as any;
  m.house_gates.backtest_used_as_sole_live_confirmation = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_VALIDATED");
  assert.equal(v.sections["live_monitoring_and_house_gates"], "fail");
});

test("test_absent_evidence_is_insufficient_not_failed", () => {
  const m = clone(VALIDATED) as any;
  delete m.costs;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["costs_and_frictions"], "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.results_sets_reported, 0);
  assert.equal(v.params_to_data_ratio, null);
  assert.equal(v.paper_gate_status, null);
  assert.equal(v.over_500_trade_declared, null);
});

test("test_stamp_names_the_verdict", () => {
  assert.ok(stamp(evaluate(clone(VALIDATED))).includes("VERDICT: VALIDATED"));
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
    () => evaluate({ strategy: "Malformed-Input", harness: "should_be_an_object" }),
    fieldError("harness"),
  );
});

test("malformed: section as string rejected", () => {
  assert.throws(
    () => evaluate({ harness: "should_be_an_object" }),
    fieldError("harness"),
  );
});

test("malformed: boolean leaf as string rejected", () => {
  const m = structuredClone(VALIDATED) as Record<string, any>;
  m.harness.deterministic_runs = "yes";
  assert.throws(() => evaluate(m), fieldError("harness.deterministic_runs"));
});

test("malformed: parameter count as string rejected", () => {
  const m = structuredClone(VALIDATED) as Record<string, any>;
  m.overfit.parameter_count = "six";
  assert.throws(() => evaluate(m), fieldError("overfit.parameter_count"));
});

test("malformed: observation count as string rejected", () => {
  const m = structuredClone(VALIDATED) as Record<string, any>;
  m.overfit.observation_count = "many";
  assert.throws(() => evaluate(m), fieldError("overfit.observation_count"));
});

test("malformed: max planned trade as string rejected", () => {
  const m = structuredClone(VALIDATED) as Record<string, any>;
  m.house_gates.max_planned_trade_usd = "1500";
  assert.throws(() => evaluate(m), fieldError("house_gates.max_planned_trade_usd"));
});

test("malformed: null field rejected", () => {
  const m = structuredClone(VALIDATED) as Record<string, any>;
  m.costs = null;
  assert.throws(() => evaluate(m), fieldError("costs"));
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
  .filter((f) => f.startsWith("strategy-backtest-validation--") && f.endsWith(".json"))
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
