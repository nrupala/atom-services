import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/vfd-application-engineering-check.js";
import { FieldTypeError } from "../src/atoms/validate.js";

// The SOUND manifest, copied from the Python VerdictTests oracle.
const SOUND: Record<string, unknown> = {
  asset: "VFD-201 / M-201 drive",
  application: { load_torque_type: "variable",
                 overload_duty_declared: true,
                 speed_range_declared: true,
                 starts_per_hour: 6,
                 environment_declared: true,
                 selected_to_duty: true },
  power_quality: { harmonic_impact_estimated: true,
                   harmonic_distortion_percent: 4.2,
                   site_limit_percent: 5.0,
                   mitigation_declared: true,
                   capacitor_bank_interaction_reviewed: true,
                   harmonics_per_site_standard: true },
  cable: { cable_length_m: 45, oem_max_lead_length_m: 100,
           motor_insulation_within_drive_limits: true,
           dvdt_reflected_wave_reviewed: true,
           inverter_duty_motor_assessed: true,
           shaft_bearing_protection_reviewed: true },
  drive: { derated_current_a: 120, required_load_current_a: 105 },
  protection: { overload_model_configured: true,
                ground_fault_configured: true,
                over_under_voltage_configured: true,
                stall_configured: true,
                bypass_philosophy_documented: true,
                estop_interlocks_verified: true },
  commissioning: { parameter_sheet_completed_archived: true,
                   motor_id_run_done: true,
                   protections_tested_logically: true,
                   ramps_limits_setpoints_documented: true,
                   baseline_trends_recorded: true },
  troubleshooting: { open: true,
                     fault_log_reviewed_first: true,
                     typical_fault_causes_cross_checked: true,
                     mechanical_causes_cross_checked: true,
                     findings_documented: true },
  records: { parameter_backup_archived: true,
             commissioning_sheet_archived: true,
             firmware_version: "v4.2.1",
             hipot_performed_on_drive_output: false,
             protections_bypassed_without_documented_approval: false },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

// ---- The 29 Python VerdictTests, ported ----

test("test_sound_manifest_is_sound", () => {
  const v = evaluate(clone(SOUND));
  assert.equal(v.verdict, "SOUND");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.engineering_status, "sound_on_declared_values");
  assert.equal(v.checks.length, 37);
});

test("test_computed_margins_serialized_at_fixed_4dp", () => {
  const v = evaluate(clone(SOUND));
  assert.equal(v.harmonic_margin_percent, "0.8000");
  assert.equal(v.cable_margin_m, "55.0000");
  assert.equal(v.current_margin_a, "15.0000");
});

test("test_harmonics_above_site_limit_fails", () => {
  const m = clone(SOUND) as any;
  m.power_quality.harmonic_distortion_percent = 6.5;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_SOUND");
  assert.equal(v.sections["power_quality"], "fail");
  assert.equal(v.engineering_status, "not_sound_on_declared_values");
  assert.equal(v.harmonic_margin_percent, "-1.5000");
});

test("test_harmonics_exactly_at_site_limit_passes", () => {
  const m = clone(SOUND) as any;
  m.power_quality.harmonic_distortion_percent = 5.0;
  const v = evaluate(m);
  assert.equal(v.verdict, "SOUND");
  assert.equal(v.harmonic_margin_percent, "0.0000");
});

test("test_cable_length_above_oem_limit_fails", () => {
  const m = clone(SOUND) as any;
  m.cable.cable_length_m = 120;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_SOUND");
  assert.equal(v.sections["motor_cable_drive"], "fail");
  assert.equal(v.cable_margin_m, "-20.0000");
});

test("test_cable_length_exactly_at_oem_limit_passes", () => {
  const m = clone(SOUND) as any;
  m.cable.cable_length_m = 100;
  assert.equal(evaluate(m).verdict, "SOUND");
});

test("test_derated_current_below_required_fails", () => {
  const m = clone(SOUND) as any;
  m.drive.derated_current_a = 100;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_SOUND");
  assert.equal(v.sections["motor_cable_drive"], "fail");
  assert.equal(v.current_margin_a, "-5.0000");
});

test("test_derated_current_exactly_at_required_passes", () => {
  const m = clone(SOUND) as any;
  m.drive.derated_current_a = 105;
  const v = evaluate(m);
  assert.equal(v.verdict, "SOUND");
  assert.equal(v.current_margin_a, "0.0000");
});

test("test_missing_computed_value_is_missing_not_failed", () => {
  const m = clone(SOUND) as any;
  delete m.cable.oem_max_lead_length_m;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.engineering_status, null);
  assert.equal(v.cable_margin_m, null);
});

test("test_non_numeric_computed_value_fails", () => {
  // F1 correction (coordinator ruling, 2026-11-15): this ported
  // test previously asserted a NOT_SOUND verdict over a wrong-typed
  // documented field — that assertion encoded the F1 defect itself.
  // A non-numeric cable_length_m is invalid input and is now
  // rejected with FieldTypeError naming the field.
  const m = clone(SOUND) as any;
  m.cable.cable_length_m = "long";
  assert.throws(
    () => evaluate(m),
    (err: unknown) =>
      err instanceof FieldTypeError && err.field === "cable.cable_length_m",
  );
});

test("test_invalid_torque_type_fails", () => {
  const m = clone(SOUND) as any;
  m.application.load_torque_type = "unknown";
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_SOUND");
  assert.equal(v.sections["application_profile"], "fail");
});

test("test_constant_torque_type_passes", () => {
  const m = clone(SOUND) as any;
  m.application.load_torque_type = "constant";
  assert.equal(evaluate(m).verdict, "SOUND");
});

test("test_starts_per_hour_non_numeric_fails", () => {
  // F1 correction (coordinator ruling, 2026-11-15): this ported
  // test previously asserted a NOT_SOUND verdict over a wrong-typed
  // documented field — that assertion encoded the F1 defect itself
  // (it is the recorded external malformed case). A non-numeric
  // starts_per_hour is invalid input and is now rejected with
  // FieldTypeError naming the field.
  const m = clone(SOUND) as any;
  m.application.starts_per_hour = "many";
  assert.throws(
    () => evaluate(m),
    (err: unknown) =>
      err instanceof FieldTypeError &&
      err.field === "application.starts_per_hour",
  );
});

test("test_not_selected_to_duty_fails", () => {
  const m = clone(SOUND) as any;
  m.application.selected_to_duty = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_SOUND");
  assert.equal(v.sections["application_profile"], "fail");
});

test("test_capacitor_interaction_not_reviewed_fails", () => {
  const m = clone(SOUND) as any;
  m.power_quality.capacitor_bank_interaction_reviewed = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_SOUND");
  assert.equal(v.sections["power_quality"], "fail");
});

test("test_shaft_bearing_protection_not_reviewed_fails", () => {
  const m = clone(SOUND) as any;
  m.cable.shaft_bearing_protection_reviewed = false;
  assert.equal(evaluate(m).verdict, "NOT_SOUND");
});

test("test_estop_not_verified_fails", () => {
  const m = clone(SOUND) as any;
  m.protection.estop_interlocks_verified = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_SOUND");
  assert.equal(v.sections["protection_and_control"], "fail");
});

test("test_protections_set_but_not_tested_fails", () => {
  const m = clone(SOUND) as any;
  m.commissioning.protections_tested_logically = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_SOUND");
  assert.equal(v.sections["commissioning"], "fail");
});

test("test_motor_id_run_not_done_fails", () => {
  const m = clone(SOUND) as any;
  m.commissioning.motor_id_run_done = false;
  assert.equal(evaluate(m).verdict, "NOT_SOUND");
});

test("test_troubleshooting_closed_passes_as_not_applicable", () => {
  const m = clone(SOUND) as any;
  m.troubleshooting = { open: false };
  const v = evaluate(m);
  assert.equal(v.verdict, "SOUND");
  assert.equal(v.sections["troubleshooting"], "pass");
});

test("test_troubleshooting_open_without_fault_log_fails", () => {
  const m = clone(SOUND) as any;
  m.troubleshooting.fault_log_reviewed_first = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_SOUND");
  assert.equal(v.sections["troubleshooting"], "fail");
});

test("test_troubleshooting_gate_absent_is_insufficient", () => {
  const m = clone(SOUND) as any;
  delete m.troubleshooting;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["troubleshooting"], "insufficient_evidence");
});

test("test_hipot_on_drive_output_fails_red_line", () => {
  const m = clone(SOUND) as any;
  m.records.hipot_performed_on_drive_output = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_SOUND");
  assert.equal(v.sections["records_and_red_lines"], "fail");
});

test("test_protection_bypass_without_approval_fails_red_line", () => {
  const m = clone(SOUND) as any;
  m.records.protections_bypassed_without_documented_approval = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_SOUND");
  assert.equal(v.sections["records_and_red_lines"], "fail");
});

test("test_firmware_version_empty_fails", () => {
  const m = clone(SOUND) as any;
  m.records.firmware_version = "";
  assert.equal(evaluate(m).verdict, "NOT_SOUND");
});

test("test_absent_evidence_is_insufficient_not_failed", () => {
  const m = clone(SOUND) as any;
  delete m.commissioning;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["commissioning"], "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.engineering_status, null);
  assert.equal(v.harmonic_margin_percent, null);
  assert.equal(v.cable_margin_m, null);
  assert.equal(v.current_margin_a, null);
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
    () => evaluate({ asset: "VFD-004", application: { starts_per_hour: "not-a-number" } }),
    fieldError("application.starts_per_hour"),
  );
});

test("malformed: section as string rejected", () => {
  assert.throws(
    () => evaluate({ application: "should-be-an-object" }),
    fieldError("application"),
  );
});

test("malformed: boolean leaf as string rejected", () => {
  const m = structuredClone(SOUND) as Record<string, any>;
  m.protection.stall_configured = "yes";
  assert.throws(() => evaluate(m), fieldError("protection.stall_configured"));
});

test("malformed: numeric leaf as string rejected", () => {
  const m = structuredClone(SOUND) as Record<string, any>;
  m.power_quality.harmonic_distortion_percent = "high";
  assert.throws(() => evaluate(m), fieldError("power_quality.harmonic_distortion_percent"));
});

test("malformed: firmware version as number rejected", () => {
  const m = structuredClone(SOUND) as Record<string, any>;
  m.records.firmware_version = 12345;
  assert.throws(() => evaluate(m), fieldError("records.firmware_version"));
});

test("malformed: null field rejected", () => {
  const m = structuredClone(SOUND) as Record<string, any>;
  m.drive = null;
  assert.throws(() => evaluate(m), fieldError("drive"));
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
  .filter((f) => f.startsWith("vfd-application-engineering-check--") && f.endsWith(".json"))
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
