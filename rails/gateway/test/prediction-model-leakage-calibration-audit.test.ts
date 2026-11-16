import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/prediction-model-leakage-calibration-audit.js";
import { FieldTypeError } from "../src/atoms/validate.js";

// The SOUND manifest, copied from the Python VerdictTests oracle.
const SOUND: Record<string, unknown> = {
  model: "churn-v3",
  prediction_time: 100,
  target: { defined: true, horizon_declared: true, decision_defined: true,
            metric_chosen_from_decision_costs: true },
  baseline: { computed: true, evaluated_on_same_holdout: true },
  holdout: { model_score: 0.82, baseline_score: 0.71,
             metric_direction: "higher_is_better", untouched: true },
  validation: { split_strategy_documented: true, temporal_data: true,
                split_type: "time_based", peeking_at_validation: false },
  features: [
    { name: "tenure_days", available_at: 90, derived_from_target: false },
    { name: "last_login_gap", available_at: 100, derived_from_target: false },
  ],
  approach: { simple_model_tried_first: true, complexity_justified: true,
              outputs_probabilities: true,
              action_thresholds_from_decision_costs: true },
  calibration: {
    reported: true, max_tolerated_error: 0.05,
    observations: [
      { predicted: 0.7, outcome: 1 },
      { predicted: 0.7, outcome: 1 },
      { predicted: 0.3, outcome: 0 },
      { predicted: 0.3, outcome: 0 },
    ],
  },
  evaluation: {
    segment_errors_reported: true, max_segment_error: 0.2,
    segments: [
      { name: "new_users", error: 0.18 },
      { name: "long_tenure", error: 0.09 },
    ],
  },
  drift: { monitoring_in_place: true, feedback_loops_identified: true,
           retraining_policy_defined: true },
  deployment: { versioned_model_and_card: true, rollback_path_defined: true,
                silent_updates_in_production: false },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

// ---- The 24 Python VerdictTests, ported ----

test("test_sound_manifest_is_audit_sound", () => {
  const v = evaluate(clone(SOUND));
  assert.equal(v.verdict, "PREDICTION_AUDIT_SOUND");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.holdout_improvement, "0.1100");
  assert.equal(v.mean_predicted, "0.5000");
  assert.equal(v.mean_observed, "0.5000");
  assert.equal(v.calibration_error, "0.0000");
  assert.equal(v.worst_segment, "new_users");
});

test("test_model_not_beating_baseline_fails", () => {
  const m = clone(SOUND) as any;
  m.holdout.model_score = 0.70;
  const v = evaluate(m);
  assert.equal(v.verdict, "PREDICTION_AUDIT_UNSOUND");
  assert.equal(v.sections["baseline_and_holdout"], "fail");
  assert.equal(v.holdout_improvement, "-0.0100");
});

test("test_equal_scores_do_not_beat_baseline", () => {
  const m = clone(SOUND) as any;
  m.holdout.model_score = 0.71;
  const v = evaluate(m);
  assert.equal(v.verdict, "PREDICTION_AUDIT_UNSOUND");
  assert.equal(v.holdout_improvement, "0.0000");
});

test("test_lower_is_better_direction", () => {
  const m = clone(SOUND) as any;
  m.holdout = { model_score: 0.21, baseline_score: 0.34,
                metric_direction: "lower_is_better", untouched: true };
  const v = evaluate(m);
  assert.equal(v.verdict, "PREDICTION_AUDIT_SOUND");
  assert.equal(v.holdout_improvement, "0.1300");
});

test("test_invalid_metric_direction_fails", () => {
  const m = clone(SOUND) as any;
  m.holdout.metric_direction = "sideways";
  const v = evaluate(m);
  assert.equal(v.verdict, "PREDICTION_AUDIT_UNSOUND");
  assert.equal(v.holdout_improvement, null);
});

test("test_random_split_for_temporal_data_is_red_line_fail", () => {
  const m = clone(SOUND) as any;
  m.validation.split_type = "random";
  const v = evaluate(m);
  assert.equal(v.verdict, "PREDICTION_AUDIT_UNSOUND");
  assert.equal(v.sections["leakage_and_validation"], "fail");
});

test("test_random_split_for_non_temporal_data_passes", () => {
  const m = clone(SOUND) as any;
  m.validation.temporal_data = false;
  m.validation.split_type = "random";
  assert.equal(evaluate(m).verdict, "PREDICTION_AUDIT_SOUND");
});

test("test_future_feature_is_leakage_fail", () => {
  const m = clone(SOUND) as any;
  m.features[0].available_at = 101;
  const v = evaluate(m);
  assert.equal(v.verdict, "PREDICTION_AUDIT_UNSOUND");
  assert.equal(v.sections["leakage_and_validation"], "fail");
});

test("test_feature_at_prediction_time_passes", () => {
  const m = clone(SOUND) as any;
  m.features[0].available_at = 100;
  assert.equal(evaluate(m).verdict, "PREDICTION_AUDIT_SOUND");
});

test("test_target_derived_feature_fails", () => {
  const m = clone(SOUND) as any;
  m.features[1].derived_from_target = true;
  assert.equal(evaluate(m).verdict, "PREDICTION_AUDIT_UNSOUND");
});

test("test_feature_missing_timestamp_is_missing", () => {
  const m = clone(SOUND) as any;
  delete m.features[0].available_at;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["leakage_and_validation"], "insufficient_evidence");
});

test("test_validation_peeking_fails", () => {
  const m = clone(SOUND) as any;
  m.validation.peeking_at_validation = true;
  assert.equal(evaluate(m).verdict, "PREDICTION_AUDIT_UNSOUND");
});

test("test_overconfident_calibration_fails", () => {
  const m = clone(SOUND) as any;
  m.calibration.observations = [
    { predicted: 0.9, outcome: 0 },
    { predicted: 0.9, outcome: 0 },
    { predicted: 0.9, outcome: 1 },
    { predicted: 0.9, outcome: 0 },
  ];
  const v = evaluate(m);
  assert.equal(v.verdict, "PREDICTION_AUDIT_UNSOUND");
  assert.equal(v.mean_predicted, "0.9000");
  assert.equal(v.mean_observed, "0.2500");
  assert.equal(v.calibration_error, "0.6500");
});

test("test_calibration_at_tolerance_boundary_passes", () => {
  const m = clone(SOUND) as any;
  m.calibration.observations = [
    { predicted: 0.5625, outcome: 1 },
    { predicted: 0.5625, outcome: 0 },
  ];
  m.calibration.max_tolerated_error = 0.0625;
  const v = evaluate(m);
  assert.equal(v.calibration_error, "0.0625");
  assert.equal(v.verdict, "PREDICTION_AUDIT_SOUND");
});

test("test_calibration_probability_out_of_range_fails", () => {
  const m = clone(SOUND) as any;
  m.calibration.observations[0].predicted = 1.4;
  assert.equal(evaluate(m).verdict, "PREDICTION_AUDIT_UNSOUND");
});

test("test_segment_over_declared_max_fails_and_is_worst", () => {
  const m = clone(SOUND) as any;
  m.evaluation.segments[1].error = 0.25;
  const v = evaluate(m);
  assert.equal(v.verdict, "PREDICTION_AUDIT_UNSOUND");
  assert.equal(v.worst_segment, "long_tenure");
});

test("test_no_baseline_fails", () => {
  const m = clone(SOUND) as any;
  m.baseline.computed = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "PREDICTION_AUDIT_UNSOUND");
  assert.equal(v.sections["baseline_and_holdout"], "fail");
});

test("test_metric_not_from_decision_costs_fails", () => {
  const m = clone(SOUND) as any;
  m.target.metric_chosen_from_decision_costs = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "PREDICTION_AUDIT_UNSOUND");
  assert.equal(v.sections["target_and_decision"], "fail");
});

test("test_silent_updates_are_red_line_fail", () => {
  const m = clone(SOUND) as any;
  m.deployment.silent_updates_in_production = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "PREDICTION_AUDIT_UNSOUND");
  assert.equal(v.sections["drift_and_deployment"], "fail");
});

test("test_no_drift_monitoring_fails", () => {
  const m = clone(SOUND) as any;
  m.drift.monitoring_in_place = false;
  assert.equal(evaluate(m).verdict, "PREDICTION_AUDIT_UNSOUND");
});

test("test_absent_evidence_is_insufficient_not_failed", () => {
  const m = clone(SOUND) as any;
  delete m.drift;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["drift_and_deployment"], "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.holdout_improvement, null);
  assert.equal(v.calibration_error, null);
  assert.equal(v.worst_segment, null);
});

test("test_stamp_names_the_verdict", () => {
  assert.ok(stamp(evaluate(clone(SOUND))).includes("VERDICT: PREDICTION_AUDIT_SOUND"));
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
    () => evaluate({ model: 123, prediction_time: "not-a-number" }),
    fieldError("model"),
  );
});

test("malformed: model as number rejected", () => {
  assert.throws(
    () => evaluate({ model: 123 }),
    fieldError("model"),
  );
});

test("malformed: prediction_time as string rejected", () => {
  assert.throws(
    () => evaluate({ prediction_time: "not-a-number" }),
    fieldError("prediction_time"),
  );
});

test("malformed: numeric leaf as string rejected", () => {
  const m = structuredClone(SOUND) as Record<string, any>;
  m.holdout.model_score = "high";
  assert.throws(() => evaluate(m), fieldError("holdout.model_score"));
});

test("malformed: list field as string rejected", () => {
  const m = structuredClone(SOUND) as Record<string, any>;
  m.features = "not-a-list";
  assert.throws(() => evaluate(m), fieldError("features"));
});

test("malformed: list entry field as string rejected", () => {
  const m = structuredClone(SOUND) as Record<string, any>;
  m.features[0].available_at = "later";
  assert.throws(() => evaluate(m), fieldError("features[0].available_at"));
});

test("malformed: nested list entry field as string rejected", () => {
  const m = structuredClone(SOUND) as Record<string, any>;
  m.calibration.observations[0].predicted = "likely";
  assert.throws(() => evaluate(m), fieldError("calibration.observations[0].predicted"));
});

test("malformed: null field rejected", () => {
  const m = structuredClone(SOUND) as Record<string, any>;
  m.prediction_time = null;
  assert.throws(() => evaluate(m), fieldError("prediction_time"));
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
  .filter((f) => f.startsWith("prediction-model-leakage-calibration-audit--") && f.endsWith(".json"))
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
