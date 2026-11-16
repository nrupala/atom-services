import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/condition-monitoring-triage.js";
import { FieldTypeError } from "../src/atoms/validate.js";

// The SOUND manifest, copied from the Python VerdictTests oracle.
const SOUND: Record<string, unknown> = {
  asset: "MTR-101",
  baseline: { exists: true, captured_under_known_load: true,
              repair_since_baseline: true,
              post_repair_baseline_captured: true },
  monitoring: { techniques_match_asset: true, fixed_route_points: true,
                same_instrument_class: true },
  context: { load_recorded: true, ambient_recorded: true,
             speed_recorded: true },
  trending: { deltas_vs_baseline_computed: true,
              rate_of_change_considered: true,
              repair_events_annotated: true },
  bands: { defined_per_standard_or_oem: true },
  readings: [
    { parameter: "vibration_mm_s", value: 3.1, watch_limit: 4.5,
      warning_limit: 7.1, action_limit: 11.0 },
    { parameter: "winding_temp_c", value: 96, watch_limit: 110,
      warning_limit: 130, action_limit: 155 },
  ],
  alarms: [
    { id: "a1", disposition: "watch", reasoning_recorded: true,
      recheck_interval_set: true, work_request_raised: false },
  ],
  escalation: { findings_sent_with_trend_pack: true,
                alarm_closed_without_triage_note: false,
                condemned_or_cleared_on_single_reading: false },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

// ---- The 18 Python VerdictTests, ported ----

test("test_sound_manifest_is_triage_sound", () => {
  const v = evaluate(clone(SOUND));
  assert.equal(v.verdict, "TRIAGE_SOUND");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.highest_band, "normal");
});

test("test_no_baseline_fails", () => {
  const m = clone(SOUND) as any;
  m.baseline.exists = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "TRIAGE_UNSOUND");
  assert.equal(v.sections["baseline"], "fail");
});

test("test_repair_without_post_repair_baseline_fails", () => {
  const m = clone(SOUND) as any;
  m.baseline.post_repair_baseline_captured = false;
  assert.equal(evaluate(m).verdict, "TRIAGE_UNSOUND");
});

test("test_no_repair_passes_post_repair_check_as_not_applicable", () => {
  const m = clone(SOUND) as any;
  m.baseline.repair_since_baseline = false;
  delete m.baseline.post_repair_baseline_captured;
  assert.equal(evaluate(m).verdict, "TRIAGE_SOUND");
});

test("test_readings_without_load_context_fail", () => {
  const m = clone(SOUND) as any;
  m.context.load_recorded = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "TRIAGE_UNSOUND");
  assert.equal(v.sections["context"], "fail");
});

test("test_action_band_reading_without_act_triage_fails", () => {
  const m = clone(SOUND) as any;
  m.readings[0].value = 12.5;
  const v = evaluate(m);
  assert.equal(v.verdict, "TRIAGE_UNSOUND");
  assert.equal(v.highest_band, "action");
  assert.equal(v.sections["alert_bands_and_triage"], "fail");
});

test("test_action_band_reading_with_act_triage_passes", () => {
  const m = clone(SOUND) as any;
  m.readings[0].value = 12.5;
  m.alarms.push({ id: "a2", disposition: "act", reasoning_recorded: true,
                  recheck_interval_set: false, work_request_raised: true });
  const v = evaluate(m);
  assert.equal(v.verdict, "TRIAGE_SOUND");
  assert.equal(v.highest_band, "action");
});

test("test_act_triage_without_work_request_fails", () => {
  const m = clone(SOUND) as any;
  m.alarms = [{ id: "a2", disposition: "act", reasoning_recorded: true,
                recheck_interval_set: false, work_request_raised: false }];
  assert.equal(evaluate(m).verdict, "TRIAGE_UNSOUND");
});

test("test_watch_triage_without_recheck_interval_fails", () => {
  const m = clone(SOUND) as any;
  m.alarms[0].recheck_interval_set = false;
  assert.equal(evaluate(m).verdict, "TRIAGE_UNSOUND");
});

test("test_alarm_without_reasoning_fails", () => {
  const m = clone(SOUND) as any;
  m.alarms[0].reasoning_recorded = false;
  assert.equal(evaluate(m).verdict, "TRIAGE_UNSOUND");
});

test("test_disordered_band_limits_fail", () => {
  const m = clone(SOUND) as any;
  m.readings[0].warning_limit = 3.0;
  assert.equal(evaluate(m).verdict, "TRIAGE_UNSOUND");
});

test("test_warning_band_is_reported", () => {
  const m = clone(SOUND) as any;
  m.readings[1].value = 140;
  assert.equal(evaluate(m).highest_band, "warning");
});

test("test_alarm_closed_without_note_is_a_red_line_fail", () => {
  const m = clone(SOUND) as any;
  m.escalation.alarm_closed_without_triage_note = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "TRIAGE_UNSOUND");
  assert.equal(v.sections["escalation"], "fail");
});

test("test_single_reading_condemnation_is_a_red_line_fail", () => {
  const m = clone(SOUND) as any;
  m.escalation.condemned_or_cleared_on_single_reading = true;
  assert.equal(evaluate(m).verdict, "TRIAGE_UNSOUND");
});

test("test_absent_evidence_is_insufficient_not_failed", () => {
  const m = clone(SOUND) as any;
  delete m.trending;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["trending"], "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.highest_band, null);
});

test("test_stamp_names_the_verdict", () => {
  assert.ok(stamp(evaluate(clone(SOUND))).includes("VERDICT: TRIAGE_SOUND"));
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
    () => evaluate({ asset: "Motor-001", baseline: "NOT_A_BOOLEAN_OBJECT" }),
    fieldError("baseline"),
  );
});

test("malformed: section as string rejected", () => {
  assert.throws(
    () => evaluate({ baseline: "NOT_A_BOOLEAN_OBJECT" }),
    fieldError("baseline"),
  );
});

test("malformed: boolean leaf as string rejected", () => {
  const m = clone(SOUND) as any;
  m.baseline.exists = "yes";
  assert.throws(() => evaluate(m), fieldError("baseline.exists"));
});

test("malformed: readings as string rejected", () => {
  assert.throws(
    () => evaluate({ readings: "not-a-list" }),
    fieldError("readings"),
  );
});

test("malformed: reading entry number as string rejected", () => {
  const m = clone(SOUND) as any;
  m.readings[0].value = "high";
  assert.throws(() => evaluate(m), fieldError("readings[0].value"));
});

test("malformed: alarm entry string as number rejected", () => {
  const m = clone(SOUND) as any;
  m.alarms[0].disposition = 42;
  assert.throws(() => evaluate(m), fieldError("alarms[0].disposition"));
});

test("malformed: null field rejected", () => {
  const m = clone(SOUND) as any;
  m.baseline = null;
  assert.throws(() => evaluate(m), fieldError("baseline"));
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
  .filter((f) => f.startsWith("condition-monitoring-triage--") && f.endsWith(".json"))
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
