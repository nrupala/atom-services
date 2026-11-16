import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/assumption-audit.js";
import { FieldTypeError } from "../src/atoms/validate.js";

// The SOUND manifest, copied from the Python VerdictTests oracle.
const SOUND: Record<string, unknown> = {
  decision: "hire-or-not for the support lead role",
  framing: { decision_named: true, options_listed: true,
             decision_maker_identified: true, objective_defined: true },
  preset: { criteria_set_before_data: true, default_action_set: true,
            change_threshold_set_before_data: true },
  loss: { framed_each_direction: true, threshold_reflects_asymmetry: true },
  rigor: { stakes_assessed: true, reversibility_assessed: true,
           effort_matched: true },
  data: { exploratory_confirmatory_separated: true,
          conclusion_not_from_inspiring_data: true,
          evidence_could_change_decision: true, roles_clear: true },
  review: { conducted: true, separates_decision_from_outcome: true },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

// ---- The 16 Python VerdictTests, ported ----

test("test_sound_manifest_is_sound", () => {
  const v = evaluate(clone(SOUND));
  assert.equal(v.verdict, "SOUND");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
});

test("test_criteria_set_after_seeing_data_fails", () => {
  const m = clone(SOUND) as any;
  m.preset.criteria_set_before_data = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "UNSOUND");
  assert.equal(v.sections["preset_criteria"], "fail");
});

test("test_no_default_action_fails", () => {
  const m = clone(SOUND) as any;
  m.preset.default_action_set = false;
  assert.equal(evaluate(m).verdict, "UNSOUND");
});

test("test_no_change_my_mind_threshold_fails", () => {
  const m = clone(SOUND) as any;
  m.preset.change_threshold_set_before_data = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "UNSOUND");
  assert.equal(v.sections["preset_criteria"], "fail");
});

test("test_loss_framed_one_way_only_fails", () => {
  const m = clone(SOUND) as any;
  m.loss.framed_each_direction = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "UNSOUND");
  assert.equal(v.sections["loss_function"], "fail");
});

test("test_threshold_ignoring_asymmetric_costs_fails", () => {
  const m = clone(SOUND) as any;
  m.loss.threshold_reflects_asymmetry = false;
  assert.equal(evaluate(m).verdict, "UNSOUND");
});

test("test_reversibility_not_assessed_fails_rigor", () => {
  const m = clone(SOUND) as any;
  m.rigor.reversibility_assessed = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "UNSOUND");
  assert.equal(v.sections["rigor_sizing"], "fail");
});

test("test_conclusion_from_inspiring_data_fails", () => {
  const m = clone(SOUND) as any;
  m.data.conclusion_not_from_inspiring_data = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "UNSOUND");
  assert.equal(v.sections["data_discipline"], "fail");
});

test("test_decorative_evidence_fails", () => {
  const m = clone(SOUND) as any;
  m.data.evidence_could_change_decision = false;
  assert.equal(evaluate(m).verdict, "UNSOUND");
});

test("test_analyst_making_the_call_fails_roles", () => {
  const m = clone(SOUND) as any;
  m.data.roles_clear = false;
  assert.equal(evaluate(m).verdict, "UNSOUND");
});

test("test_resulting_in_review_fails", () => {
  const m = clone(SOUND) as any;
  m.review.separates_decision_from_outcome = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "UNSOUND");
  assert.equal(v.sections["review"], "fail");
});

test("test_single_foregone_option_fails_framing", () => {
  const m = clone(SOUND) as any;
  m.framing.options_listed = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "UNSOUND");
  assert.equal(v.sections["framing"], "fail");
});

test("test_absent_evidence_is_insufficient_not_failed", () => {
  const m = clone(SOUND) as any;
  delete m.loss;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["loss_function"], "insufficient_evidence");
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
    () => evaluate({ decision: "Malformed test", framing: "not-an-object", preset: { criteria_set_before_data: "should-be-boolean" } }),
    fieldError("framing"),
  );
});

test("malformed: section as string rejected", () => {
  assert.throws(
    () => evaluate({ framing: "not-an-object" }),
    fieldError("framing"),
  );
});

test("malformed: preset leaf as string rejected", () => {
  assert.throws(
    () => evaluate({ preset: { criteria_set_before_data: "should-be-boolean" } }),
    fieldError("preset.criteria_set_before_data"),
  );
});

test("malformed: decision as number rejected", () => {
  assert.throws(
    () => evaluate({ decision: 42 }),
    fieldError("decision"),
  );
});

test("malformed: boolean leaf as string rejected", () => {
  const m = clone(SOUND) as any;
  m.review.conducted = "yes";
  assert.throws(() => evaluate(m), fieldError("review.conducted"));
});

test("malformed: null field rejected", () => {
  const m = clone(SOUND) as any;
  m.loss = null;
  assert.throws(() => evaluate(m), fieldError("loss"));
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
  .filter((f) => f.startsWith("assumption-audit--") && f.endsWith(".json"))
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
