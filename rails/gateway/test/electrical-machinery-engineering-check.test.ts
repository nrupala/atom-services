import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/electrical-machinery-engineering-check.js";
import { FieldTypeError } from "../src/atoms/validate.js";

// The SOUND manifest, copied from the Python VerdictTests oracle.
const SOUND: Record<string, unknown> = {
  machine: "pump-motor-P101",
  duty: { load_torque_profile: "constant", starts_per_hour: 6,
          ambient_c: 40, altitude_m: 1000,
          worst_case_identified: true },
  sizing: { worst_case_torque_nm: 850, rated_torque_nm: 1000,
            worst_case_power_kw: 140, rated_power_kw: 160,
            service_factor: 1.15, starting_current_a: 900,
            supply_capability_a: 1200,
            efficiency_at_actual_load_percent: 95.2 },
  specification: { machine_type: "induction", insulation_class: "F",
                   enclosure: "TEFC", bearings_specified: true,
                   space_heaters_specified: true, rtds_specified: true,
                   vibration_limits_specified: true,
                   standards_cited: true },
  tests: { criteria_defined_before_tests: true,
           criteria_from_standards_and_oem: true,
           insulation_resistance_tested: true,
           pi_dar_trends_recorded: true,
           winding_resistance_balance_checked: true,
           surge_comparison_done: true,
           no_load_and_load_runs_done: true,
           results_recorded_with_units: true,
           instruments_and_calibration_recorded: true },
  failure: { investigation_open: true,
             evidence_organized_into_timeline: true,
             operating_history_included: true,
             typical_failure_modes_considered: true },
  trending: { per_asset_baseline_exists: true,
              like_for_like_comparison: true, deltas_compared: true },
  records: { nameplate_and_serial_verified: true,
             re_energized_after_insulation_or_winding_anomaly_without_review: false,
             anomalies_flagged: true, asset_records_updated: true,
             deviations_logged_with_actions: true },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

// ---- The 18 Python VerdictTests, ported ----

test("test_sound_manifest_is_sound", () => {
  const v = evaluate(clone(SOUND));
  assert.equal(v.verdict, "SOUND");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.checks.length, 38);
});

test("test_worst_case_torque_above_rating_fails_sizing", () => {
  const m = clone(SOUND) as any;
  m.sizing.worst_case_torque_nm = 1200;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_SOUND");
  assert.equal(v.sections["sizing"], "fail");
});

test("test_worst_case_power_above_rating_fails_sizing", () => {
  const m = clone(SOUND) as any;
  m.sizing.worst_case_power_kw = 200;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_SOUND");
  assert.equal(v.sections["sizing"], "fail");
});

test("test_starting_current_above_supply_capability_fails", () => {
  const m = clone(SOUND) as any;
  m.sizing.starting_current_a = 1500;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_SOUND");
  assert.equal(v.sections["sizing"], "fail");
});

test("test_unknown_torque_profile_fails_duty", () => {
  const m = clone(SOUND) as any;
  m.duty.load_torque_profile = "steady";
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_SOUND");
  assert.equal(v.sections["duty"], "fail");
});

test("test_unknown_machine_type_fails_specification", () => {
  const m = clone(SOUND) as any;
  m.specification.machine_type = "dc";
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_SOUND");
  assert.equal(v.sections["specification"], "fail");
});

test("test_unknown_enclosure_fails_specification", () => {
  const m = clone(SOUND) as any;
  m.specification.enclosure = "open";
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_SOUND");
  assert.equal(v.sections["specification"], "fail");
});

test("test_missing_service_factor_is_insufficient_not_failed", () => {
  const m = clone(SOUND) as any;
  delete m.sizing.service_factor;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["sizing"], "insufficient_evidence");
});

test("test_non_numeric_torque_is_rejected", () => {
  // Corrected under the coordinator's F1 ruling (was
  // test_non_numeric_torque_fails_the_computed_check, asserting
  // a NOT_SOUND verdict over a wrong-typed documented field):
  // a non-numeric worst_case_torque_nm is a type violation,
  // rejected before any verdict is computed.
  const m = clone(SOUND) as any;
  m.sizing.worst_case_torque_nm = "high";
  assert.throws(() => evaluate(m),
                fieldError("sizing.worst_case_torque_nm"));
});

test("test_criteria_defined_after_tests_fail_acceptance", () => {
  const m = clone(SOUND) as any;
  m.tests.criteria_defined_before_tests = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_SOUND");
  assert.equal(v.sections["acceptance_tests"], "fail");
});

test("test_open_investigation_without_timeline_is_insufficient", () => {
  const m = clone(SOUND) as any;
  delete m.failure.evidence_organized_into_timeline;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["failure_analysis"], "insufficient_evidence");
});

test("test_no_investigation_passes_failure_analysis_as_na", () => {
  const m = clone(SOUND) as any;
  m.failure = { investigation_open: false };
  const v = evaluate(m);
  assert.equal(v.verdict, "SOUND");
  assert.equal(v.sections["failure_analysis"], "pass");
});

test("test_reenergize_after_anomaly_without_review_fails", () => {
  const m = clone(SOUND) as any;
  m.records.re_energized_after_insulation_or_winding_anomaly_without_review = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_SOUND");
  assert.equal(v.sections["records_and_safety"], "fail");
});

test("test_unverified_nameplate_fails_records_and_safety", () => {
  const m = clone(SOUND) as any;
  m.records.nameplate_and_serial_verified = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_SOUND");
  assert.equal(v.sections["records_and_safety"], "fail");
});

test("test_absent_evidence_is_insufficient_not_failed", () => {
  const m = clone(SOUND) as any;
  delete m.trending;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["trending"], "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  assert.equal(evaluate({}).verdict, "INSUFFICIENT_EVIDENCE");
});

test("test_stamp_names_the_verdict", () => {
  assert.ok(stamp(evaluate(clone(SOUND))).includes("VERDICT: SOUND"));
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
    () => evaluate({ machine: "Motor-004",
                     duty: "invalid_string_instead_of_object" }),
    fieldError("duty"),
  );
});

test("malformed: number leaf as string rejected", () => {
  const m = clone(SOUND) as any;
  m.duty.starts_per_hour = "six";
  assert.throws(() => evaluate(m), fieldError("duty.starts_per_hour"));
});

test("malformed: boolean leaf as number rejected", () => {
  const m = clone(SOUND) as any;
  m.records.anomalies_flagged = 1;
  assert.throws(() => evaluate(m), fieldError("records.anomalies_flagged"));
});

test("malformed: null section rejected", () => {
  const m = clone(SOUND) as any;
  m.sizing = null;
  assert.throws(() => evaluate(m), fieldError("sizing"));
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
  .filter((f) => f.startsWith("electrical-machinery-engineering-check--") && f.endsWith(".json"))
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
