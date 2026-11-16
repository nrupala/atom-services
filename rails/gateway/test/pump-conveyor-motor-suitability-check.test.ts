import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/pump-conveyor-motor-suitability-check.js";
import { FieldTypeError } from "../src/atoms/validate.js";

// The SUITABLE manifest, copied from the Python VerdictTests oracle.
const SUITABLE: Record<string, unknown> = {
  asset: "P-101 / CV-201 drive train",
  equipment_kind: "mixed",
  duty: { curve_or_profile_read: true,
          operating_point_documented: true,
          operating_point_within_limits: true,
          operating_modes_defined: true },
  drives: [
    { id: "P-101", kind: "pump",
      required_power_kw: 75, motor_rated_power_kw: 90,
      required_running_torque_nm: 400, motor_rated_torque_nm: 480,
      npsh_available_m: 6.5, npsh_required_m: 4.0,
      operating_flow_m3h: 120, minimum_flow_m3h: 30 },
    { id: "CV-201", kind: "conveyor",
      required_power_kw: 55, motor_rated_power_kw: 75,
      required_running_torque_nm: 300, motor_rated_torque_nm: 360,
      required_starting_torque_nm: 850,
      motor_starting_torque_nm: 1100 },
  ],
  sizing: { verified_against_curve_or_profile: true,
            suitable_because_it_runs_only: false },
  pump: { minimum_flow_protection_set: true,
          impeller_wear_trend_checked: true,
          vfd_soft_start_reviewed: true },
  conveyor: { starting_study_considered: true,
              loaded_starts_holdback_considered: true,
              backstops_brake_interlocks_verified: true,
              sequence_interlock_review_done: true,
              belt_slip_jam_reviewed: true },
  baselines: { recorded_per_operating_mode: true,
               flow_head_current_pressure_recorded: true,
               compared_at_same_conditions: true },
  interface: { mechanical_data_in_asset_record: true,
               data_shared_single_source: true,
               changes_made: true,
               changes_revalidated: true },
  protection: { protection_changed_without_engineering_review: false },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

// ---- The 26 Python VerdictTests, ported ----

test("test_suitable_manifest_is_suitable", () => {
  const v = evaluate(clone(SUITABLE));
  assert.equal(v.verdict, "SUITABLE");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.suitability_status, "suitable_on_declared_values");
  assert.equal(v.checks.length, 26);
});

test("test_computed_margins_serialized_at_fixed_4dp", () => {
  const v = evaluate(clone(SUITABLE));
  assert.equal(v.min_power_margin_kw, "15.0000");
  assert.equal(v.min_running_torque_margin_nm, "60.0000");
  assert.equal(v.min_npsh_margin_m, "2.5000");
  assert.equal(v.min_starting_torque_margin_nm, "250.0000");
});

test("test_motor_power_below_required_fails", () => {
  const m = clone(SUITABLE) as any;
  m.drives[0].motor_rated_power_kw = 70;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_SUITABLE");
  assert.equal(v.sections["motor_sizing"], "fail");
  assert.equal(v.suitability_status, "not_suitable_on_declared_values");
  assert.equal(v.min_power_margin_kw, "-5.0000");
});

test("test_motor_torque_below_running_torque_fails", () => {
  const m = clone(SUITABLE) as any;
  m.drives[1].required_running_torque_nm = 400;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_SUITABLE");
  assert.equal(v.suitability_status, "not_suitable_on_declared_values");
});

test("test_power_exactly_at_required_passes", () => {
  const m = clone(SUITABLE) as any;
  m.drives[0].motor_rated_power_kw = 75;
  const v = evaluate(m);
  assert.equal(v.verdict, "SUITABLE");
  assert.equal(v.min_power_margin_kw, "0.0000");
});

test("test_incomplete_drive_entry_is_missing_not_failed", () => {
  const m = clone(SUITABLE) as any;
  delete m.drives[0].motor_rated_power_kw;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.suitability_status, null);
  assert.equal(v.min_power_margin_kw, null);
});

test("test_npsh_available_below_required_fails", () => {
  const m = clone(SUITABLE) as any;
  m.drives[0].npsh_available_m = 3.5;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_SUITABLE");
  assert.equal(v.sections["pump_checks"], "fail");
  assert.equal(v.min_npsh_margin_m, "-0.5000");
});

test("test_operating_flow_below_minimum_flow_fails", () => {
  const m = clone(SUITABLE) as any;
  m.drives[0].operating_flow_m3h = 25;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_SUITABLE");
  assert.equal(v.sections["pump_checks"], "fail");
});

test("test_minimum_flow_protection_not_set_fails", () => {
  const m = clone(SUITABLE) as any;
  m.pump.minimum_flow_protection_set = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_SUITABLE");
  assert.equal(v.sections["pump_checks"], "fail");
});

test("test_starting_torque_below_required_fails", () => {
  const m = clone(SUITABLE) as any;
  m.drives[1].motor_starting_torque_nm = 800;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_SUITABLE");
  assert.equal(v.sections["conveyor_checks"], "fail");
  assert.equal(v.min_starting_torque_margin_nm, "-50.0000");
});

test("test_no_starting_study_fails_conveyor", () => {
  const m = clone(SUITABLE) as any;
  m.conveyor.starting_study_considered = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_SUITABLE");
  assert.equal(v.sections["conveyor_checks"], "fail");
});

test("test_backstops_not_verified_fails", () => {
  const m = clone(SUITABLE) as any;
  m.conveyor.backstops_brake_interlocks_verified = false;
  assert.equal(evaluate(m).verdict, "NOT_SUITABLE");
});

test("test_pump_only_kind_passes_conveyor_as_not_applicable", () => {
  const m = clone(SUITABLE) as any;
  m.equipment_kind = "pump";
  m.drives = [m.drives[0]];
  delete m.conveyor;
  const v = evaluate(m);
  assert.equal(v.verdict, "SUITABLE");
  assert.equal(v.min_starting_torque_margin_nm, null);
  assert.equal(v.suitability_status, "suitable_on_declared_values");
});

test("test_conveyor_only_kind_passes_pump_as_not_applicable", () => {
  const m = clone(SUITABLE) as any;
  m.equipment_kind = "conveyor";
  m.drives = [m.drives[1]];
  delete m.pump;
  const v = evaluate(m);
  assert.equal(v.verdict, "SUITABLE");
  assert.equal(v.min_npsh_margin_m, null);
});

test("test_missing_equipment_kind_is_insufficient", () => {
  const m = clone(SUITABLE) as any;
  delete m.equipment_kind;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.suitability_status, null);
});

test("test_curve_not_read_fails", () => {
  const m = clone(SUITABLE) as any;
  m.duty.curve_or_profile_read = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_SUITABLE");
  assert.equal(v.sections["load_and_operating_point"], "fail");
});

test("test_operating_point_outside_limits_fails", () => {
  const m = clone(SUITABLE) as any;
  m.duty.operating_point_within_limits = false;
  assert.equal(evaluate(m).verdict, "NOT_SUITABLE");
});

test("test_it_runs_so_sizing_is_fine_fails_red_line", () => {
  const m = clone(SUITABLE) as any;
  m.sizing.suitable_because_it_runs_only = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_SUITABLE");
  assert.equal(v.sections["motor_sizing"], "fail");
});

test("test_protection_change_without_review_fails_red_line", () => {
  const m = clone(SUITABLE) as any;
  m.protection.protection_changed_without_engineering_review = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_SUITABLE");
  assert.equal(v.sections["interface_and_protection"], "fail");
});

test("test_interface_change_without_revalidation_fails", () => {
  const m = clone(SUITABLE) as any;
  m.interface.changes_revalidated = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_SUITABLE");
  assert.equal(v.sections["interface_and_protection"], "fail");
});

test("test_no_interface_change_passes_revalidation_as_not_applicable", () => {
  const m = clone(SUITABLE) as any;
  m.interface.changes_made = false;
  delete m.interface.changes_revalidated;
  assert.equal(evaluate(m).verdict, "SUITABLE");
});

test("test_baselines_not_recorded_fails", () => {
  const m = clone(SUITABLE) as any;
  m.baselines.recorded_per_operating_mode = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_SUITABLE");
  assert.equal(v.sections["baselines"], "fail");
});

test("test_absent_evidence_is_insufficient_not_failed", () => {
  const m = clone(SUITABLE) as any;
  delete m.baselines;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["baselines"], "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.suitability_status, null);
  assert.equal(v.min_power_margin_kw, null);
});

test("test_stamp_names_the_verdict", () => {
  assert.ok(stamp(evaluate(clone(SUITABLE))).includes("VERDICT: SUITABLE"));
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
    () => evaluate({ asset: "ERR-001", equipment_kind: 123, duty: "invalid_string_instead_of_object" }),
    fieldError("equipment_kind"),
  );
});

test("malformed: equipment_kind as number rejected", () => {
  assert.throws(() => evaluate({ equipment_kind: 123 }), fieldError("equipment_kind"));
});

test("malformed: section as string rejected", () => {
  assert.throws(
    () => evaluate({ duty: "invalid_string_instead_of_object" }),
    fieldError("duty"),
  );
});

test("malformed: boolean leaf as string rejected", () => {
  const m = structuredClone(SUITABLE) as Record<string, any>;
  m.duty.curve_or_profile_read = "yes";
  assert.throws(() => evaluate(m), fieldError("duty.curve_or_profile_read"));
});

test("malformed: drives as string rejected", () => {
  const m = structuredClone(SUITABLE) as Record<string, any>;
  m.drives = "P-101";
  assert.throws(() => evaluate(m), fieldError("drives"));
});

test("malformed: drive entry as string rejected", () => {
  const m = structuredClone(SUITABLE) as Record<string, any>;
  m.drives[0] = "P-101";
  assert.throws(() => evaluate(m), fieldError("drives[0]"));
});

test("malformed: drive rating as string rejected", () => {
  const m = structuredClone(SUITABLE) as Record<string, any>;
  m.drives[0].required_power_kw = "75";
  assert.throws(() => evaluate(m), fieldError("drives[0].required_power_kw"));
});

test("malformed: drive npsh as string rejected", () => {
  const m = structuredClone(SUITABLE) as Record<string, any>;
  m.drives[0].npsh_available_m = "deep";
  assert.throws(() => evaluate(m), fieldError("drives[0].npsh_available_m"));
});

test("malformed: null field rejected", () => {
  const m = structuredClone(SUITABLE) as Record<string, any>;
  m.pump = null;
  assert.throws(() => evaluate(m), fieldError("pump"));
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
  .filter((f) => f.startsWith("pump-conveyor-motor-suitability-check--") && f.endsWith(".json"))
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
