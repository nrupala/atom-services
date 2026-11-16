import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import {
  evaluate,
  stamp,
} from "../src/atoms/bias-controlled-quant-study-pack.js";
import { FieldTypeError } from "../src/atoms/validate.js";

// The STUDY_PACK_COMPLETE manifest, copied from the Python tests.
const COMPLETE: Record<string, unknown> = {
  study: "Momentum among large-cap energy names, 2015-2025",
  hypothesis: {
    hypothesis_written: true,
    prediction_stated: true,
    falsification_test_defined: true,
    results_looked_at_before_registration: false,
  },
  data: {
    provenance_documented: true,
    snapshot_version_documented: true,
    adjusted_prices: true,
    delisted_names_retained: true,
    survivorship_gap_present: false,
    point_in_time_fundamentals: true,
    restatement_peeking: false,
    timezone_timestamp_discipline: true,
  },
  distribution: {
    fat_tails_considered: true,
    volatility_clustering_considered: true,
    gaussian_assumed: false,
    crisis_correlations_considered: true,
  },
  stationarity: {
    stability_tested: true,
    stability_periods: ["2015-2019", "2020-2022", "2023-2025"],
    regime_context_provided: true,
    mechanism_stated: true,
    claim_made_without_regime_context: false,
  },
  multiple_testing: {
    controlled: true,
    deflated_significance_applied: true,
    holdout_used: true,
    signals_tested: 10000,
    signals_reported: 3,
    p_hacked_screen_presented_as_strategy: false,
    result_from_single_sample: false,
  },
  costs: {
    costs_included: true,
    included: ["spreads", "fees", "slippage", "borrow", "taxes"],
    results_net_of_costs: true,
  },
  reproducibility: {
    seeded_runs: true,
    snapshot_pinned: true,
    code_versioned: true,
    rerunnable_by_others: true,
  },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function checkStatus(v: ReturnType<typeof evaluate>, name: string) {
  return v.checks.find((c) => c.check === name)?.status;
}

// ---- The Python VerdictTests, ported ----

test("test_complete_manifest_is_study_pack_complete", () => {
  const v = evaluate(clone(COMPLETE));
  assert.equal(v.verdict, "STUDY_PACK_COMPLETE");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.computed_status,
    "within_stated_limits_on_declared_evidence");
  assert.equal(v.checks.length, 34);
  assert.equal(v.stability_period_count, 3);
  assert.equal(v.signals_tested, 10000);
  assert.equal(v.signals_reported, 3);
  assert.equal(v.signals_reported_minus_tested, -9997);
  assert.deepEqual(v.costs_not_included, []);
});

test("test_results_seen_before_registration_fails", () => {
  const m = clone(COMPLETE) as any;
  m.hypothesis.results_looked_at_before_registration = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "STUDY_PACK_NOT_COMPLETE");
  assert.equal(v.sections["hypothesis_preregistration"], "fail");
});

test("test_falsification_not_defined_fails", () => {
  const m = clone(COMPLETE) as any;
  m.hypothesis.falsification_test_defined = false;
  assert.equal(evaluate(m).verdict, "STUDY_PACK_NOT_COMPLETE");
});

test("test_survivorship_gap_fails", () => {
  const m = clone(COMPLETE) as any;
  m.data.survivorship_gap_present = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "STUDY_PACK_NOT_COMPLETE");
  assert.equal(v.sections["data_hygiene"], "fail");
});

test("test_delisted_names_not_retained_fails", () => {
  const m = clone(COMPLETE) as any;
  m.data.delisted_names_retained = false;
  assert.equal(evaluate(m).verdict, "STUDY_PACK_NOT_COMPLETE");
});

test("test_restatement_peeking_fails", () => {
  const m = clone(COMPLETE) as any;
  m.data.restatement_peeking = true;
  assert.equal(evaluate(m).verdict, "STUDY_PACK_NOT_COMPLETE");
});

test("test_unadjusted_prices_fail", () => {
  const m = clone(COMPLETE) as any;
  m.data.adjusted_prices = false;
  assert.equal(evaluate(m).verdict, "STUDY_PACK_NOT_COMPLETE");
});

test("test_gaussian_assumed_fails", () => {
  const m = clone(COMPLETE) as any;
  m.distribution.gaussian_assumed = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "STUDY_PACK_NOT_COMPLETE");
  assert.equal(v.sections["distribution_reality"], "fail");
});

test("test_fat_tails_not_considered_fails", () => {
  const m = clone(COMPLETE) as any;
  m.distribution.fat_tails_considered = false;
  assert.equal(evaluate(m).verdict, "STUDY_PACK_NOT_COMPLETE");
});

test("test_single_stability_period_fails", () => {
  const m = clone(COMPLETE) as any;
  m.stationarity.stability_periods = ["2020-2025"];
  const v = evaluate(m);
  assert.equal(v.verdict, "STUDY_PACK_NOT_COMPLETE");
  assert.equal(
    checkStatus(v, "stability_periods_cover_multiple_periods"), "fail");
  assert.equal(v.stability_period_count, 1);
  assert.equal(v.computed_status,
    "outside_stated_limits_on_declared_evidence");
});

test("test_repeated_period_is_still_one_period", () => {
  const m = clone(COMPLETE) as any;
  m.stationarity.stability_periods = ["2020-2022", "2020-2022"];
  const v = evaluate(m);
  assert.equal(v.verdict, "STUDY_PACK_NOT_COMPLETE");
  assert.equal(v.stability_period_count, 1);
});

test("test_two_distinct_periods_pass", () => {
  const m = clone(COMPLETE) as any;
  m.stationarity.stability_periods = ["2015-2019", "2020-2025"];
  const v = evaluate(m);
  assert.equal(v.verdict, "STUDY_PACK_COMPLETE");
  assert.equal(v.stability_period_count, 2);
});

test("test_empty_period_list_fails_not_missing", () => {
  const m = clone(COMPLETE) as any;
  m.stationarity.stability_periods = [];
  const v = evaluate(m);
  assert.equal(v.verdict, "STUDY_PACK_NOT_COMPLETE");
  assert.equal(
    checkStatus(v, "stability_periods_cover_multiple_periods"), "fail");
  assert.equal(v.stability_period_count, 0);
});

test("test_missing_period_list_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.stationarity.stability_periods;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.stability_period_count, null);
  assert.equal(v.computed_status, null);
});

test("test_claim_without_regime_context_fails_red_line", () => {
  const m = clone(COMPLETE) as any;
  m.stationarity.claim_made_without_regime_context = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "STUDY_PACK_NOT_COMPLETE");
  assert.equal(v.sections["stationarity_and_stability"], "fail");
});

test("test_curve_fit_without_mechanism_fails", () => {
  const m = clone(COMPLETE) as any;
  m.stationarity.mechanism_stated = false;
  assert.equal(evaluate(m).verdict, "STUDY_PACK_NOT_COMPLETE");
});

test("test_reported_above_tested_fails", () => {
  const m = clone(COMPLETE) as any;
  m.multiple_testing.signals_tested = 10;
  m.multiple_testing.signals_reported = 12;
  const v = evaluate(m);
  assert.equal(v.verdict, "STUDY_PACK_NOT_COMPLETE");
  assert.equal(
    checkStatus(v, "reported_signals_within_tested_count"), "fail");
  assert.equal(v.signals_reported_minus_tested, 2);
  assert.equal(v.computed_status,
    "outside_stated_limits_on_declared_evidence");
});

test("test_reported_equal_to_tested_passes", () => {
  const m = clone(COMPLETE) as any;
  m.multiple_testing.signals_tested = 5;
  m.multiple_testing.signals_reported = 5;
  assert.equal(evaluate(m).verdict, "STUDY_PACK_COMPLETE");
});

test("test_fractional_signal_count_fails", () => {
  const m = clone(COMPLETE) as any;
  m.multiple_testing.signals_reported = 2.5;
  const v = evaluate(m);
  assert.equal(v.verdict, "STUDY_PACK_NOT_COMPLETE");
  assert.equal(
    checkStatus(v, "reported_signals_within_tested_count"), "fail");
});

test("test_negative_signal_count_fails", () => {
  const m = clone(COMPLETE) as any;
  m.multiple_testing.signals_tested = -4;
  assert.equal(evaluate(m).verdict, "STUDY_PACK_NOT_COMPLETE");
});

test("test_missing_signal_counts_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.multiple_testing.signals_tested;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(
    checkStatus(v, "reported_signals_within_tested_count"), "missing");
  assert.equal(v.signals_tested, null);
  assert.equal(v.signals_reported, 3);
  assert.equal(v.signals_reported_minus_tested, null);
});

test("test_phacked_screen_presented_as_strategy_fails_red_line", () => {
  const m = clone(COMPLETE) as any;
  m.multiple_testing.p_hacked_screen_presented_as_strategy = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "STUDY_PACK_NOT_COMPLETE");
  assert.equal(v.sections["multiple_testing"], "fail");
});

test("test_single_lucky_sample_fails_red_line", () => {
  const m = clone(COMPLETE) as any;
  m.multiple_testing.result_from_single_sample = true;
  assert.equal(evaluate(m).verdict, "STUDY_PACK_NOT_COMPLETE");
});

test("test_holdout_not_used_fails", () => {
  const m = clone(COMPLETE) as any;
  m.multiple_testing.holdout_used = false;
  assert.equal(evaluate(m).verdict, "STUDY_PACK_NOT_COMPLETE");
});

test("test_cost_coverage_missing_one_fails", () => {
  const m = clone(COMPLETE) as any;
  m.costs.included = m.costs.included.filter(
    (c: string) => c !== "borrow");
  const v = evaluate(m);
  assert.equal(v.verdict, "STUDY_PACK_NOT_COMPLETE");
  assert.deepEqual(v.costs_not_included, ["borrow"]);
  assert.equal(checkStatus(v, "all_stated_costs_included"), "fail");
});

test("test_cost_empty_list_fails_not_missing", () => {
  const m = clone(COMPLETE) as any;
  m.costs.included = [];
  const v = evaluate(m);
  assert.equal(v.verdict, "STUDY_PACK_NOT_COMPLETE");
  assert.deepEqual(v.costs_not_included,
    ["spreads", "fees", "slippage", "borrow", "taxes"]);
});

test("test_cost_unknown_entries_do_not_satisfy_coverage", () => {
  const m = clone(COMPLETE) as any;
  m.costs.included = ["commissions", "margin_interest"];
  const v = evaluate(m);
  assert.equal(v.verdict, "STUDY_PACK_NOT_COMPLETE");
  assert.equal(v.costs_not_included?.length, 5);
});

test("test_cost_extra_entries_beyond_stated_pass", () => {
  const m = clone(COMPLETE) as any;
  m.costs.included = [...m.costs.included, "commissions"];
  assert.equal(evaluate(m).verdict, "STUDY_PACK_COMPLETE");
});

test("test_missing_cost_list_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.costs.included;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.costs_not_included, null);
});

test("test_results_gross_of_costs_fail", () => {
  const m = clone(COMPLETE) as any;
  m.costs.results_net_of_costs = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "STUDY_PACK_NOT_COMPLETE");
  assert.equal(v.sections["costs"], "fail");
});

test("test_unseeded_runs_fail", () => {
  const m = clone(COMPLETE) as any;
  m.reproducibility.seeded_runs = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "STUDY_PACK_NOT_COMPLETE");
  assert.equal(v.sections["reproducibility"], "fail");
});

test("test_absent_section_is_insufficient_not_failed", () => {
  const m = clone(COMPLETE) as any;
  delete m.reproducibility;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["reproducibility"], "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.computed_status, null);
  assert.equal(v.stability_period_count, null);
  assert.equal(v.signals_tested, null);
  assert.equal(v.signals_reported, null);
  assert.equal(v.signals_reported_minus_tested, null);
  assert.equal(v.costs_not_included, null);
});

test("test_stamp_names_the_verdict", () => {
  const v = evaluate(clone(COMPLETE));
  assert.ok(stamp(v).includes("VERDICT: STUDY_PACK_COMPLETE"));
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
  m.study = 12345;
  assert.throws(() => evaluate(m), fieldError("study"));
});

test("malformed: section as string rejected", () => {
  assert.throws(
    () => evaluate({ data: "should-be-an-object" }),
    fieldError("data"),
  );
});

test("malformed: null section rejected", () => {
  const m = clone(COMPLETE) as any;
  m.costs = null;
  assert.throws(() => evaluate(m), fieldError("costs"));
});

test("malformed: boolean leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.hypothesis.hypothesis_written = "yes";
  assert.throws(
    () => evaluate(m), fieldError("hypothesis.hypothesis_written"));
});

test("malformed: boolean leaf as number rejected", () => {
  const m = clone(COMPLETE) as any;
  m.data.delisted_names_retained = 1;
  assert.throws(
    () => evaluate(m), fieldError("data.delisted_names_retained"));
});

test("malformed: numeric leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.multiple_testing.signals_tested = "10000";
  assert.throws(
    () => evaluate(m), fieldError("multiple_testing.signals_tested"));
});

test("malformed: numeric leaf as boolean rejected", () => {
  const m = clone(COMPLETE) as any;
  m.multiple_testing.signals_reported = true;
  assert.throws(
    () => evaluate(m), fieldError("multiple_testing.signals_reported"));
});

test("malformed: null leaf rejected", () => {
  const m = clone(COMPLETE) as any;
  m.distribution.gaussian_assumed = null;
  assert.throws(
    () => evaluate(m), fieldError("distribution.gaussian_assumed"));
});

test("malformed: list field as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.costs.included = "spreads";
  assert.throws(() => evaluate(m), fieldError("costs.included"));
});

test("malformed: list entry as number rejected", () => {
  const m = clone(COMPLETE) as any;
  m.stationarity.stability_periods = ["2015-2019", 42];
  assert.throws(
    () => evaluate(m),
    fieldError("stationarity.stability_periods[1]"));
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
    f.startsWith("bias-controlled-quant-study-pack--") &&
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
