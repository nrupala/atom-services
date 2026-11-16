import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/predictive-maintenance-failure-risk-assessment.js";
import { FieldTypeError } from "../src/atoms/validate.js";

// The SOUND manifest, copied from the Python VerdictTests oracle.
const SOUND: Record<string, unknown> = {
  asset: "main air compressor motor, plant 2",
  strategy: { asset_criticality_assessed: true, failure_cost_assessed: true,
              matched_to_criticality_and_failure_cost: true,
              pdm_justified_for_asset: true },
  pf_curve: { detectable_point_identified: true,
              detection_early_in_window: true,
              planning_runway_sufficient: true },
  monitoring: { techniques_matched_to_failure_modes: true,
                sensor_coverage_covers_failure_modes: true,
                operating_parameters_monitored: true },
  prediction: { healthy_baseline_established: true,
                anomaly_detection_or_rul_in_place: true,
                fault_labels_available_or_imbalance_handled: true,
                uncertainty_reported: true,
                thresholds_tuned_to_missed_failure_vs_false_alarm_cost: true },
  reliability: { fmea_completed: true,
                 prioritised_by_severity_occurrence_detectability: true,
                 rcm_strategy_per_failure_mode: true,
                 mtbf_mttr_tracked: true,
                 fmea_and_engineering_judgement_not_replaced: true },
  integration: { sensor_quality_and_calibration_verified: true,
                 leakage_label_scarcity_and_drift_watched: true,
                 edge_vs_cloud_inference_decided: true,
                 work_orders_closed_into_cmms: true },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

// ---- The 21 Python VerdictTests, ported ----

test("test_sound_manifest_is_assessment_sound", () => {
  const v = evaluate(clone(SOUND));
  assert.equal(v.verdict, "ASSESSMENT_SOUND");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.checks.length, 24);
});

test("test_criticality_not_assessed_fails_strategy", () => {
  const m = clone(SOUND) as any;
  m.strategy.asset_criticality_assessed = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "ASSESSMENT_UNSOUND");
  assert.equal(v.sections["strategy_fit"], "fail");
});

test("test_pdm_on_unjustified_asset_fails", () => {
  const m = clone(SOUND) as any;
  m.strategy.pdm_justified_for_asset = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "ASSESSMENT_UNSOUND");
  assert.equal(v.sections["strategy_fit"], "fail");
});

test("test_strategy_not_matched_to_failure_cost_fails", () => {
  const m = clone(SOUND) as any;
  m.strategy.matched_to_criticality_and_failure_cost = false;
  assert.equal(evaluate(m).verdict, "ASSESSMENT_UNSOUND");
});

test("test_detectable_point_not_identified_fails_pf_window", () => {
  const m = clone(SOUND) as any;
  m.pf_curve.detectable_point_identified = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "ASSESSMENT_UNSOUND");
  assert.equal(v.sections["pf_window"], "fail");
});

test("test_detection_late_in_window_fails", () => {
  const m = clone(SOUND) as any;
  m.pf_curve.detection_early_in_window = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "ASSESSMENT_UNSOUND");
  assert.equal(v.sections["pf_window"], "fail");
});

test("test_techniques_not_matched_to_failure_modes_fails", () => {
  const m = clone(SOUND) as any;
  m.monitoring.techniques_matched_to_failure_modes = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "ASSESSMENT_UNSOUND");
  assert.equal(v.sections["condition_monitoring"], "fail");
});

test("test_operating_parameters_not_monitored_fails", () => {
  const m = clone(SOUND) as any;
  m.monitoring.operating_parameters_monitored = false;
  assert.equal(evaluate(m).verdict, "ASSESSMENT_UNSOUND");
});

test("test_no_healthy_baseline_fails_prediction", () => {
  const m = clone(SOUND) as any;
  m.prediction.healthy_baseline_established = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "ASSESSMENT_UNSOUND");
  assert.equal(v.sections["prediction"], "fail");
});

test("test_fault_classification_without_labels_fails", () => {
  const m = clone(SOUND) as any;
  m.prediction.fault_labels_available_or_imbalance_handled = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "ASSESSMENT_UNSOUND");
  assert.equal(v.sections["prediction"], "fail");
});

test("test_thresholds_ignoring_false_alarm_cost_fails", () => {
  const m = clone(SOUND) as any;
  m.prediction.thresholds_tuned_to_missed_failure_vs_false_alarm_cost = false;
  assert.equal(evaluate(m).verdict, "ASSESSMENT_UNSOUND");
});

test("test_uncertainty_not_reported_fails", () => {
  const m = clone(SOUND) as any;
  m.prediction.uncertainty_reported = false;
  assert.equal(evaluate(m).verdict, "ASSESSMENT_UNSOUND");
});

test("test_no_fmea_fails_reliability", () => {
  const m = clone(SOUND) as any;
  m.reliability.fmea_completed = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "ASSESSMENT_UNSOUND");
  assert.equal(v.sections["reliability_frame"], "fail");
});

test("test_no_rpn_prioritisation_fails", () => {
  const m = clone(SOUND) as any;
  m.reliability.prioritised_by_severity_occurrence_detectability = false;
  assert.equal(evaluate(m).verdict, "ASSESSMENT_UNSOUND");
});

test("test_black_box_replacing_judgement_fails", () => {
  const m = clone(SOUND) as any;
  m.reliability.fmea_and_engineering_judgement_not_replaced = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "ASSESSMENT_UNSOUND");
  assert.equal(v.sections["reliability_frame"], "fail");
});

test("test_uncalibrated_sensors_fail_integration", () => {
  const m = clone(SOUND) as any;
  m.integration.sensor_quality_and_calibration_verified = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "ASSESSMENT_UNSOUND");
  assert.equal(v.sections["data_and_integration"], "fail");
});

test("test_open_loop_work_orders_fail", () => {
  const m = clone(SOUND) as any;
  m.integration.work_orders_closed_into_cmms = false;
  assert.equal(evaluate(m).verdict, "ASSESSMENT_UNSOUND");
});

test("test_absent_evidence_is_insufficient_not_failed", () => {
  const m = clone(SOUND) as any;
  delete m.reliability;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["reliability_frame"], "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  assert.equal(evaluate({}).verdict, "INSUFFICIENT_EVIDENCE");
});

test("test_stamp_names_the_verdict", () => {
  assert.ok(stamp(evaluate(clone(SOUND))).includes("VERDICT: ASSESSMENT_SOUND"));
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
    () => evaluate({ asset: 12345, strategy: "invalid_string_instead_of_object" }),
    fieldError("asset"),
  );
});

test("malformed: asset as number rejected", () => {
  assert.throws(() => evaluate({ asset: 12345 }), fieldError("asset"));
});

test("malformed: section as string rejected", () => {
  assert.throws(
    () => evaluate({ strategy: "invalid_string_instead_of_object" }),
    fieldError("strategy"),
  );
});

test("malformed: boolean leaf as string rejected", () => {
  const m = structuredClone(SOUND) as Record<string, any>;
  m.reliability.fmea_completed = "yes";
  assert.throws(() => evaluate(m), fieldError("reliability.fmea_completed"));
});

test("malformed: boolean leaf as number rejected", () => {
  const m = structuredClone(SOUND) as Record<string, any>;
  m.prediction.uncertainty_reported = 1;
  assert.throws(() => evaluate(m), fieldError("prediction.uncertainty_reported"));
});

test("malformed: null section rejected", () => {
  const m = structuredClone(SOUND) as Record<string, any>;
  m.integration = null;
  assert.throws(() => evaluate(m), fieldError("integration"));
});

test("malformed: null leaf rejected", () => {
  const m = structuredClone(SOUND) as Record<string, any>;
  m.strategy.failure_cost_assessed = null;
  assert.throws(() => evaluate(m), fieldError("strategy.failure_cost_assessed"));
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
  .filter((f) => f.startsWith("predictive-maintenance-failure-risk-assessment--") && f.endsWith(".json"))
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
