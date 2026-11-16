import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/electrical-machines-expert-advice.js";
import { FieldTypeError } from "../src/atoms/validate.js";

// The SOUND manifest, copied from the Python VerdictTests oracle.
const SOUND: Record<string, unknown> = {
  advice_id: "advice-2026-041",
  engagement: { question_or_problem_stated: true,
                operating_context_stated: true,
                assumptions_stated_explicitly: true,
                protection_and_safety_not_handwaved: true },
  machine: { machine_family: "induction", full_load_current_a: 100,
             starting_current_a: 620,
             induction_slip_or_equivalent_circuit_addressed: true,
             induction_torque_speed_addressed: true,
             induction_losses_or_efficiency_addressed: true },
  drives: { vfd_involved: true, control_mode: "sensorless_vector",
            harmonics_addressed: true,
            reflected_wave_dvdt_addressed: true,
            bearing_currents_addressed: true,
            cable_charging_addressed: true },
  protection: { protection_in_scope: true,
                selectivity_coordination_addressed: true,
                primary_and_backup_addressed: true,
                ansi_device_numbers: ["50", "51", "49"],
                ct_pt_selection_saturation_burden_addressed: true,
                idmt_curves_and_grading_addressed: true,
                final_settings_deferred_to_study: true,
                settings_published_as_fact: false },
  standards: { applicable_standards_named: true,
               standards_applicability_reasons_stated: true,
               hazardous_area_involved: true,
               hazloc_zone_or_division_stated: true,
               hazloc_gas_group_and_temp_class_stated: true,
               hazloc_ex_method_and_certification_stated: true },
  calculations: { calculations_relied_upon: true,
                  short_circuit_addressed: true,
                  motor_starting_voltage_dip_addressed: true,
                  grounding_addressed: true,
                  load_flow_addressed: true,
                  arc_flash_addressed: true },
  documents: { document_review_in_scope: true, sow_addressed: true,
               sdrl_addressed: true, sqrl_addressed: true,
               supplier_qualification_addressed: true,
               going_public: true, public_sanitization_applied: true },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function fieldError(field: string) {
  return (err: unknown) =>
    err instanceof FieldTypeError && err.field === field;
}

// ---- The 20 Python VerdictTests, ported ----

test("test_sound_manifest_is_sound", () => {
  const v = evaluate(clone(SOUND));
  assert.equal(v.verdict, "SOUND");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.checks.length, 44);
});

test("test_starting_multiple_recorded_not_graded", () => {
  const m = clone(SOUND) as any;
  m.machine.starting_current_a = 300;
  const v = evaluate(m);
  assert.equal(v.verdict, "SOUND");
  const chk = v.checks.find(
    (c) => c.check === "induction_starting_current_multiple_recorded")!;
  assert.ok(chk.evidence.includes("3.000000 x FLA"));
});

test("test_unknown_machine_family_fails_machine_analysis", () => {
  const m = clone(SOUND) as any;
  m.machine.machine_family = "permanent_magnet";
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_SOUND");
  assert.equal(v.sections["machine_analysis"], "fail");
});

test("test_transformer_record_passes_with_own_family_checks", () => {
  const m = clone(SOUND) as any;
  m.machine = {
    machine_family: "transformer",
    transformer_vector_group_or_impedance_addressed: true,
    transformer_inrush_tap_cooling_addressed: true,
    transformer_thermal_aging_addressed: true,
  };
  const v = evaluate(m);
  assert.equal(v.verdict, "SOUND");
  assert.equal(v.sections["machine_analysis"], "pass");
});

test("test_dc_record_with_unknown_excitation_fails", () => {
  const m = clone(SOUND) as any;
  m.machine = {
    machine_family: "dc",
    dc_excitation_type: "compound",
    dc_retrofit_or_legacy_context_addressed: true,
  };
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_SOUND");
  assert.equal(v.sections["machine_analysis"], "fail");
});

test("test_unknown_control_mode_fails_drives", () => {
  const m = clone(SOUND) as any;
  m.drives.control_mode = "direct_torque";
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_SOUND");
  assert.equal(v.sections["drives"], "fail");
});

test("test_no_vfd_passes_drives_as_na", () => {
  const m = clone(SOUND) as any;
  m.drives = { vfd_involved: false };
  const v = evaluate(m);
  assert.equal(v.verdict, "SOUND");
  assert.equal(v.sections["drives"], "pass");
});

test("test_ansi_number_outside_skill_list_fails_protection", () => {
  const m = clone(SOUND) as any;
  m.protection.ansi_device_numbers = ["50", "67"];
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_SOUND");
  assert.equal(v.sections["protection"], "fail");
});

test("test_empty_ansi_list_fails_protection", () => {
  const m = clone(SOUND) as any;
  m.protection.ansi_device_numbers = [];
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_SOUND");
  assert.equal(v.sections["protection"], "fail");
});

test("test_settings_published_as_fact_fails_protection", () => {
  const m = clone(SOUND) as any;
  m.protection.settings_published_as_fact = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_SOUND");
  assert.equal(v.sections["protection"], "fail");
});

test("test_settings_not_deferred_to_study_fails_protection", () => {
  const m = clone(SOUND) as any;
  m.protection.final_settings_deferred_to_study = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_SOUND");
  assert.equal(v.sections["protection"], "fail");
});

test("test_protection_out_of_scope_still_binds_deferral_rules", () => {
  const m = clone(SOUND) as any;
  m.protection = { protection_in_scope: false,
                   final_settings_deferred_to_study: true,
                   settings_published_as_fact: false };
  const v = evaluate(m);
  assert.equal(v.verdict, "SOUND");
  assert.equal(v.sections["protection"], "pass");
});

test("test_missing_assumptions_is_insufficient_not_failed", () => {
  const m = clone(SOUND) as any;
  delete m.engagement.assumptions_stated_explicitly;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["engagement"], "insufficient_evidence");
});

test("test_hazloc_involved_without_gas_group_is_insufficient", () => {
  const m = clone(SOUND) as any;
  delete m.standards.hazloc_gas_group_and_temp_class_stated;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["standards_and_hazloc"],
               "insufficient_evidence");
});

test("test_no_hazardous_area_passes_hazloc_as_na", () => {
  const m = clone(SOUND) as any;
  m.standards = { applicable_standards_named: true,
                  standards_applicability_reasons_stated: true,
                  hazardous_area_involved: false };
  const v = evaluate(m);
  assert.equal(v.verdict, "SOUND");
  assert.equal(v.sections["standards_and_hazloc"], "pass");
});

test("test_going_public_without_sanitization_fails", () => {
  const m = clone(SOUND) as any;
  m.documents.public_sanitization_applied = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_SOUND");
  assert.equal(v.sections["documents_and_disclosure"], "fail");
});

test("test_absent_evidence_is_insufficient_not_failed", () => {
  const m = clone(SOUND) as any;
  delete m.calculations.short_circuit_addressed;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["calculations"], "insufficient_evidence");
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

// ---- F1 regression: malformed field types — the Python
// MalformedTypeTests, ported. A documented field present with the
// wrong JSON type raises FieldTypeError naming the field — never
// a verdict over garbage.

test("malformed: section as string rejected", () => {
  assert.throws(
    () => evaluate({ advice_id: "advice-1",
                     engagement: "invalid_string_instead_of_object" }),
    fieldError("engagement"),
  );
});

test("malformed: number leaf as string rejected", () => {
  const m = clone(SOUND) as any;
  m.machine.full_load_current_a = "one hundred";
  assert.throws(() => evaluate(m),
                fieldError("machine.full_load_current_a"));
});

test("malformed: boolean leaf as number rejected", () => {
  const m = clone(SOUND) as any;
  m.drives.harmonics_addressed = 1;
  assert.throws(() => evaluate(m),
                fieldError("drives.harmonics_addressed"));
});

test("malformed: ansi list entry as number rejected", () => {
  const m = clone(SOUND) as any;
  m.protection.ansi_device_numbers = [50, "51"];
  assert.throws(() => evaluate(m),
                fieldError("protection.ansi_device_numbers[0]"));
});

test("malformed: ansi field as string rejected", () => {
  const m = clone(SOUND) as any;
  m.protection.ansi_device_numbers = "50/51";
  assert.throws(() => evaluate(m),
                fieldError("protection.ansi_device_numbers"));
});

test("malformed: null section rejected", () => {
  const m = clone(SOUND) as any;
  m.protection = null;
  assert.throws(() => evaluate(m), fieldError("protection"));
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
  .filter((f) => f.startsWith("electrical-machines-expert-advice--") && f.endsWith(".json"))
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
