import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/electrical-test-record-preparation.js";
import { FieldTypeError } from "../src/atoms/validate.js";

// The READY manifest, copied from the Python VerdictTests oracle.
const READY: Record<string, unknown> = {
  asset: "MTR-101",
  record: {
    asset_id_present: true,
    datetime_present: true,
    ambient_present: true,
    load_condition_present: true,
    instrument_named: true,
    calibration_status_recorded: true,
    test_method_reference_present: true,
    acceptance_criteria_present: true,
    verdict_value: "pass",
    tester_named: true,
    reviewer_named: true,
    has_na_fields: true,
    na_reasons_recorded: true,
    is_critical_test: true,
    reviewer_signoff_present: true,
  },
  hygiene: {
    asset_ids_consistent: true,
    si_units_used: true,
    conversions_noted: true,
    iso_timestamps: true,
    single_source_of_truth: true,
    raw_data_overwritten: false,
    photos_attached_and_named: true,
  },
  readings: [
    { point: "IR phase A", value: 850, unit: "Mohm",
      acceptance_min: 100, acceptance_max: 10000 },
    { point: "IR phase B", value: 920, unit: "Mohm",
      acceptance_min: 100, acceptance_max: 10000 },
  ],
  format: {
    single_header_row: true,
    tidy_long_format: true,
    required_columns_present: true,
  },
  trending: {
    same_point_method_instrument_class: true,
    plotted_vs_time: true,
    load_varies: true,
    plotted_vs_load: true,
    repair_events_annotated: true,
    control_bands_from_limits_or_baseline: true,
    trends_updated_on_cadence: true,
    anomalies_present: true,
    anomalies_flagged_with_action: true,
  },
  plotting: {
    axes_labeled_with_units: true,
    version_and_date_on_charts: true,
    dual_axis_used: false,
    out_of_band_points_present: true,
    out_of_band_highlighted: true,
    summary_sheet_per_asset: true,
  },
  retention: {
    archived_and_findable: true,
    retention_per_policy: true,
    superseded_revisions_exist: true,
    superseded_retained_marked: true,
    corrections_made: true,
    correction_revision_notes_present: true,
    raw_data_destroyed: false,
  },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

// ---- The 19 Python VerdictTests, ported ----

test("test_ready_manifest_is_record_ready", () => {
  const v = evaluate(clone(READY));
  assert.equal(v.verdict, "RECORD_READY");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.readings_evaluated, 2);
  assert.equal(v.readings_out_of_criteria, 0);
});

test("test_blank_template_field_is_a_defect", () => {
  const m = clone(READY) as any;
  m.record.ambient_present = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "RECORD_NOT_READY");
  assert.equal(v.sections["template_completeness"], "fail");
});

test("test_na_field_without_reason_fails", () => {
  const m = clone(READY) as any;
  m.record.na_reasons_recorded = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "RECORD_NOT_READY");
  assert.equal(v.sections["template_completeness"], "fail");
});

test("test_no_na_fields_passes_na_check_as_not_applicable", () => {
  const m = clone(READY) as any;
  m.record.has_na_fields = false;
  delete m.record.na_reasons_recorded;
  assert.equal(evaluate(m).verdict, "RECORD_READY");
});

test("test_critical_test_without_reviewer_signoff_fails", () => {
  const m = clone(READY) as any;
  m.record.reviewer_signoff_present = false;
  assert.equal(evaluate(m).verdict, "RECORD_NOT_READY");
});

test("test_non_critical_test_passes_signoff_as_not_applicable", () => {
  const m = clone(READY) as any;
  m.record.is_critical_test = false;
  delete m.record.reviewer_signoff_present;
  assert.equal(evaluate(m).verdict, "RECORD_READY");
});

test("test_declared_pass_with_out_of_criteria_reading_fails", () => {
  const m = clone(READY) as any;
  m.readings[0].value = 50;
  const v = evaluate(m);
  assert.equal(v.verdict, "RECORD_NOT_READY");
  assert.equal(v.sections["machine_readable_format"], "fail");
  assert.equal(v.readings_out_of_criteria, 1);
});

test("test_declared_fail_matching_out_of_criteria_reading_passes", () => {
  const m = clone(READY) as any;
  m.readings[0].value = 50;
  m.record.verdict_value = "fail";
  const v = evaluate(m);
  assert.equal(v.verdict, "RECORD_READY");
  assert.equal(v.readings_out_of_criteria, 1);
});

test("test_reading_missing_unit_is_insufficient_evidence", () => {
  const m = clone(READY) as any;
  delete m.readings[0].unit;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["machine_readable_format"],
               "insufficient_evidence");
});

test("test_disordered_acceptance_limits_fail", () => {
  const m = clone(READY) as any;
  m.readings[0].acceptance_min = 20000;
  assert.equal(evaluate(m).verdict, "RECORD_NOT_READY");
});

test("test_raw_data_overwritten_fails_hygiene", () => {
  const m = clone(READY) as any;
  m.hygiene.raw_data_overwritten = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "RECORD_NOT_READY");
  assert.equal(v.sections["data_hygiene"], "fail");
});

test("test_load_varies_without_vs_load_plot_fails", () => {
  const m = clone(READY) as any;
  m.trending.plotted_vs_load = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "RECORD_NOT_READY");
  assert.equal(v.sections["trending"], "fail");
});

test("test_anomalies_without_action_fail", () => {
  const m = clone(READY) as any;
  m.trending.anomalies_flagged_with_action = false;
  assert.equal(evaluate(m).verdict, "RECORD_NOT_READY");
});

test("test_dual_axis_chart_fails_plotting", () => {
  const m = clone(READY) as any;
  m.plotting.dual_axis_used = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "RECORD_NOT_READY");
  assert.equal(v.sections["plotting_discipline"], "fail");
});

test("test_correction_without_revision_note_fails_retention", () => {
  const m = clone(READY) as any;
  m.retention.correction_revision_notes_present = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "RECORD_NOT_READY");
  assert.equal(v.sections["retention_and_audit"], "fail");
});

test("test_absent_evidence_is_insufficient_not_failed", () => {
  const m = clone(READY) as any;
  delete m.retention;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["retention_and_audit"],
               "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.readings_evaluated, 0);
});

test("test_stamp_names_the_verdict", () => {
  assert.ok(stamp(evaluate(clone(READY))).includes("VERDICT: RECORD_READY"));
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
    () => evaluate({ asset: 12345, record: "not-an-object" }),
    fieldError("asset"),
  );
});

test("malformed: asset as number rejected", () => {
  assert.throws(() => evaluate({ asset: 12345 }), fieldError("asset"));
});

test("malformed: record as string rejected", () => {
  assert.throws(() => evaluate({ record: "not-an-object" }), fieldError("record"));
});

test("malformed: boolean leaf as string rejected", () => {
  const m = structuredClone(READY) as Record<string, any>;
  m.record.asset_id_present = "yes";
  assert.throws(() => evaluate(m), fieldError("record.asset_id_present"));
});

test("malformed: string leaf as number rejected", () => {
  const m = structuredClone(READY) as Record<string, any>;
  m.record.verdict_value = 123;
  assert.throws(() => evaluate(m), fieldError("record.verdict_value"));
});

test("malformed: list field as string rejected", () => {
  const m = structuredClone(READY) as Record<string, any>;
  m.readings = "not-a-list";
  assert.throws(() => evaluate(m), fieldError("readings"));
});

test("malformed: reading entry as string rejected", () => {
  const m = structuredClone(READY) as Record<string, any>;
  m.readings[0] = "not-an-object";
  assert.throws(() => evaluate(m), fieldError("readings[0]"));
});

test("malformed: reading value as string rejected", () => {
  const m = structuredClone(READY) as Record<string, any>;
  m.readings[0].value = "850";
  assert.throws(() => evaluate(m), fieldError("readings[0].value"));
});

test("malformed: null field rejected", () => {
  const m = structuredClone(READY) as Record<string, any>;
  m.record = null;
  assert.throws(() => evaluate(m), fieldError("record"));
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
  .filter((f) => f.startsWith("electrical-test-record-preparation--") && f.endsWith(".json"))
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
