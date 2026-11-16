import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/distribution-equipment-rating-condition-check.js";
import { FieldTypeError } from "../src/atoms/validate.js";

// The SOUND manifest, copied from the Python VerdictTests oracle.
const SOUND: Record<string, unknown> = {
  lineup: "MSB-1 lineup",
  ratings: { fault_study_current: true, gaps_documented: true },
  equipment: [
    { id: "MSB-1", interrupting_rating_ka: 65,
      available_fault_current_ka: 42,
      continuous_current_rating_a: 2000, load_current_a: 1450 },
    { id: "MCC-1", interrupting_rating_ka: 42,
      available_fault_current_ka: 38,
      continuous_current_rating_a: 1200, load_current_a: 900 },
  ],
  mcc: { section_bus_rating_verified: true,
         starter_types_recorded: true,
         segregation_and_barriers_verified: true,
         heat_load_assessed: true,
         planned_spare_capacity_recorded: true,
         labeling_matches_lineup_drawing: true },
  switchgear: { breaker_relay_schemes_verified: true,
                ct_ratios_and_wiring_checked: true,
                trip_tests_per_plan: true,
                interlock_function_tests_done: true,
                torque_checks_per_oem: true },
  transformers: [
    { id: "TX-1", nameplate_kva: 1500, load_kva: 1100,
      top_oil_temp_c: 68, top_oil_limit_c: 85,
      winding_temp_c: 84, winding_limit_c: 105,
      paralleled: true, vector_group_match: true,
      ratio_match: true, impedance_match: true },
    { id: "TX-2", nameplate_kva: 1500, load_kva: 950,
      top_oil_temp_c: 61, top_oil_limit_c: 85,
      winding_temp_c: 77, winding_limit_c: 105,
      paralleled: true, vector_group_match: true,
      ratio_match: true, impedance_match: true },
  ],
  transformer: { tap_positions_recorded: true,
                 harmonic_rich_load: true,
                 k_factor_assessed: true },
  condition: { oil_dga_screening_on_schedule: true,
               ir_scans_done: true,
               audible_corona_logged_vs_baseline: true },
  coordination: { settings_labels_study_aligned: true,
                  equipment_changed: true,
                  study_refresh_flagged: true,
                  test_records_complete_with_instruments_and_calibration: true,
                  energized_work_outside_permit_system: false },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

// ---- The 18 Python VerdictTests, ported ----

test("test_sound_manifest_is_sound", () => {
  const v = evaluate(clone(SOUND));
  assert.equal(v.verdict, "RATING_CONDITION_SOUND");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.rating_status, "within_declared_ratings");
  assert.equal(v.checks.length, 27);
});

test("test_interrupting_rating_below_fault_current_fails", () => {
  const m = clone(SOUND) as any;
  m.equipment[0].interrupting_rating_ka = 40;
  const v = evaluate(m);
  assert.equal(v.verdict, "RATING_CONDITION_UNSOUND");
  assert.equal(v.sections["ratings_vs_fault_study"], "fail");
  assert.equal(v.rating_status, "exceeded");
});

test("test_continuous_rating_below_load_fails", () => {
  const m = clone(SOUND) as any;
  m.equipment[1].load_current_a = 1300;
  const v = evaluate(m);
  assert.equal(v.verdict, "RATING_CONDITION_UNSOUND");
  assert.equal(v.rating_status, "exceeded");
});

test("test_incomplete_equipment_entry_is_missing_not_failed", () => {
  const m = clone(SOUND) as any;
  delete m.equipment[0].interrupting_rating_ka;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.rating_status, null);
});

test("test_mcc_labeling_mismatch_fails", () => {
  const m = clone(SOUND) as any;
  m.mcc.labeling_matches_lineup_drawing = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "RATING_CONDITION_UNSOUND");
  assert.equal(v.sections["mcc_specifics"], "fail");
});

test("test_torque_not_per_oem_fails_switchgear", () => {
  const m = clone(SOUND) as any;
  m.switchgear.torque_checks_per_oem = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "RATING_CONDITION_UNSOUND");
  assert.equal(v.sections["switchgear_specifics"], "fail");
});

test("test_transformer_overload_fails", () => {
  const m = clone(SOUND) as any;
  m.transformers[0].load_kva = 1600;
  const v = evaluate(m);
  assert.equal(v.verdict, "RATING_CONDITION_UNSOUND");
  assert.equal(v.sections["transformers"], "fail");
  assert.equal(v.rating_status, "exceeded");
});

test("test_transformer_temperature_over_declared_limit_fails", () => {
  const m = clone(SOUND) as any;
  m.transformers[1].winding_temp_c = 110;
  const v = evaluate(m);
  assert.equal(v.verdict, "RATING_CONDITION_UNSOUND");
  assert.equal(v.rating_status, "exceeded");
});

test("test_paralleling_impedance_mismatch_fails", () => {
  const m = clone(SOUND) as any;
  m.transformers[0].impedance_match = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "RATING_CONDITION_UNSOUND");
  assert.equal(v.sections["transformers"], "fail");
});

test("test_not_paralleled_passes_paralleling_check", () => {
  const m = clone(SOUND) as any;
  for (const entry of m.transformers) {
    entry.paralleled = false;
    delete entry.vector_group_match;
    delete entry.ratio_match;
    delete entry.impedance_match;
  }
  assert.equal(evaluate(m).verdict, "RATING_CONDITION_SOUND");
});

test("test_harmonic_load_without_k_factor_fails", () => {
  const m = clone(SOUND) as any;
  m.transformer.k_factor_assessed = false;
  assert.equal(evaluate(m).verdict, "RATING_CONDITION_UNSOUND");
});

test("test_no_harmonic_load_passes_k_factor_as_not_applicable", () => {
  const m = clone(SOUND) as any;
  m.transformer.harmonic_rich_load = false;
  delete m.transformer.k_factor_assessed;
  assert.equal(evaluate(m).verdict, "RATING_CONDITION_SOUND");
});

test("test_dga_off_schedule_fails_condition", () => {
  const m = clone(SOUND) as any;
  m.condition.oil_dga_screening_on_schedule = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "RATING_CONDITION_UNSOUND");
  assert.equal(v.sections["condition_awareness"], "fail");
});

test("test_equipment_change_without_study_refresh_fails", () => {
  const m = clone(SOUND) as any;
  m.coordination.study_refresh_flagged = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "RATING_CONDITION_UNSOUND");
  assert.equal(v.sections["coordination_and_safety"], "fail");
});

test("test_energized_work_outside_permit_fails", () => {
  const m = clone(SOUND) as any;
  m.coordination.energized_work_outside_permit_system = true;
  assert.equal(evaluate(m).verdict, "RATING_CONDITION_UNSOUND");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.rating_status, null);
});

test("test_stamp_names_the_verdict", () => {
  assert.ok(stamp(evaluate(clone(SOUND))).includes(
    "VERDICT: RATING_CONDITION_SOUND"));
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
    () => evaluate({ lineup: "Malformed-Input", ratings: "invalid_string_instead_of_object" }),
    fieldError("ratings"),
  );
});

test("malformed: ratings as string rejected", () => {
  assert.throws(() => evaluate({ ratings: "invalid_string_instead_of_object" }), fieldError("ratings"));
});

test("malformed: lineup as number rejected", () => {
  assert.throws(() => evaluate({ lineup: 12345 }), fieldError("lineup"));
});

test("malformed: boolean leaf as string rejected", () => {
  const m = structuredClone(SOUND) as Record<string, any>;
  m.ratings.fault_study_current = "yes";
  assert.throws(() => evaluate(m), fieldError("ratings.fault_study_current"));
});

test("malformed: list field as string rejected", () => {
  const m = structuredClone(SOUND) as Record<string, any>;
  m.equipment = "not-a-list";
  assert.throws(() => evaluate(m), fieldError("equipment"));
});

test("malformed: equipment entry number as string rejected", () => {
  const m = structuredClone(SOUND) as Record<string, any>;
  m.equipment[0].interrupting_rating_ka = "65";
  assert.throws(() => evaluate(m), fieldError("equipment[0].interrupting_rating_ka"));
});

test("malformed: transformer entry number as string rejected", () => {
  const m = structuredClone(SOUND) as Record<string, any>;
  m.transformers[0].load_kva = "1100";
  assert.throws(() => evaluate(m), fieldError("transformers[0].load_kva"));
});

test("malformed: null field rejected", () => {
  const m = structuredClone(SOUND) as Record<string, any>;
  m.ratings = null;
  assert.throws(() => evaluate(m), fieldError("ratings"));
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
  .filter((f) => f.startsWith("distribution-equipment-rating-condition-check--") && f.endsWith(".json"))
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
