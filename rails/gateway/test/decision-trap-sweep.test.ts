import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/decision-trap-sweep.js";
import { FieldTypeError } from "../src/atoms/validate.js";

// The CLEAR manifest, copied from the Python VerdictTests oracle.
const CLEAR: Record<string, unknown> = {
  decision: "adopt the new routing vendor",
  framing: { decision_stated: true, decide_by_named: true,
             constraints_named: true, out_of_scope_named: true,
             classification: "irreversible", stakes_assessed: true },
  options: { list: ["adopt vendor A", "build in-house",
                    "do nothing / wait"],
             includes_status_quo: true,
             includes_smaller_reversible_step: true },
  criteria: { criteria_listed: true, defined_before_scoring: true,
              weights_assigned_before_scoring: true },
  evaluation: { method_named: true, uncertainty_flagged: true,
                probabilities_estimable: true,
                expected_value_used: true },
  premortem: { decision_is_material: true, conducted: true,
               top_risks_hedged: true },
  rush: { made_in_rush: false, made_in_a_mood: false },
  log: { choice_recorded: true, rationale_recorded: true,
         assumptions_recorded: true, review_date_set: true,
         communicated_with_why: true },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

// ---- The 20 Python VerdictTests, ported ----

test("test_clear_record_is_trap_clear", () => {
  const v = evaluate(clone(CLEAR));
  assert.equal(v.verdict, "TRAP_CLEAR");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.checks.length, 24);
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  assert.equal(evaluate({}).verdict, "INSUFFICIENT_EVIDENCE");
});

test("test_stamp_names_the_verdict", () => {
  assert.ok(stamp(evaluate(clone(CLEAR))).includes("VERDICT: TRAP_CLEAR"));
});

test("test_non_object_manifest_rejected", () => {
  assert.throws(
    () => evaluate(["not", "a", "manifest"]),
    (err: unknown) =>
      err instanceof TypeError &&
      (err as Error).message === "manifest must be a JSON object",
  );
});

test("test_false_binary_two_options_fails", () => {
  const m = clone(CLEAR) as any;
  m.options.list = ["adopt vendor A", "build in-house"];
  const v = evaluate(m);
  assert.equal(v.verdict, "TRAPS_PRESENT");
  assert.equal(v.sections["options"], "fail");
});

test("test_options_not_a_list_is_rejected", () => {
  // Corrected under the coordinator's F1 ruling (was
  // test_options_not_a_list_fails, asserting a TRAPS_PRESENT
  // verdict over a wrong-typed documented field): a non-list
  // options.list is a type violation, rejected before any
  // verdict is computed.
  const m = clone(CLEAR) as any;
  m.options.list = "adopt vendor A";
  assert.throws(() => evaluate(m), fieldError("options.list"));
});

test("test_missing_status_quo_option_fails", () => {
  const m = clone(CLEAR) as any;
  m.options.includes_status_quo = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "TRAPS_PRESENT");
  assert.equal(v.sections["options"], "fail");
});

test("test_missing_smaller_reversible_step_fails", () => {
  const m = clone(CLEAR) as any;
  m.options.includes_smaller_reversible_step = false;
  assert.equal(evaluate(m).verdict, "TRAPS_PRESENT");
});

test("test_criteria_defined_after_scores_fails", () => {
  const m = clone(CLEAR) as any;
  m.criteria.defined_before_scoring = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "TRAPS_PRESENT");
  assert.equal(v.sections["criteria_before_evaluation"], "fail");
});

test("test_weights_fitted_after_scoring_fails", () => {
  const m = clone(CLEAR) as any;
  m.criteria.weights_assigned_before_scoring = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "TRAPS_PRESENT");
  assert.equal(v.sections["criteria_before_evaluation"], "fail");
});

test("test_unflagged_uncertainty_fails", () => {
  const m = clone(CLEAR) as any;
  m.evaluation.uncertainty_flagged = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "TRAPS_PRESENT");
  assert.equal(v.sections["evaluation_and_uncertainty"], "fail");
});

test("test_estimable_probabilities_without_expected_value_fails", () => {
  const m = clone(CLEAR) as any;
  m.evaluation.expected_value_used = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "TRAPS_PRESENT");
  assert.equal(v.sections["evaluation_and_uncertainty"], "fail");
});

test("test_non_estimable_probabilities_pass_ev_check_as_not_applicable", () => {
  const m = clone(CLEAR) as any;
  m.evaluation.probabilities_estimable = false;
  delete m.evaluation.expected_value_used;
  assert.equal(evaluate(m).verdict, "TRAP_CLEAR");
});

test("test_material_decision_without_premortem_fails", () => {
  const m = clone(CLEAR) as any;
  m.premortem.conducted = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "TRAPS_PRESENT");
  assert.equal(v.sections["pre_mortem"], "fail");
});

test("test_immaterial_decision_passes_premortem_as_not_applicable", () => {
  const m = clone(CLEAR) as any;
  m.premortem.decision_is_material = false;
  delete m.premortem.conducted;
  delete m.premortem.top_risks_hedged;
  assert.equal(evaluate(m).verdict, "TRAP_CLEAR");
});

test("test_irreversible_decision_in_a_rush_fails", () => {
  const m = clone(CLEAR) as any;
  m.rush.made_in_rush = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "TRAPS_PRESENT");
  assert.equal(v.sections["rush_and_mood_trap"], "fail");
});

test("test_irreversible_decision_in_a_mood_fails", () => {
  const m = clone(CLEAR) as any;
  m.rush.made_in_a_mood = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "TRAPS_PRESENT");
  assert.equal(v.sections["rush_and_mood_trap"], "fail");
});

test("test_reversible_decision_passes_rush_trap_as_not_applicable", () => {
  const m = clone(CLEAR) as any;
  m.framing.classification = "reversible";
  m.rush.made_in_rush = true;
  m.rush.made_in_a_mood = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "TRAP_CLEAR");
  assert.equal(v.sections["rush_and_mood_trap"], "pass");
});

test("test_invalid_classification_fails", () => {
  const m = clone(CLEAR) as any;
  m.framing.classification = "permanent-ish";
  const v = evaluate(m);
  assert.equal(v.verdict, "TRAPS_PRESENT");
  assert.equal(v.sections["framing_and_classification"], "fail");
});

test("test_absent_log_is_insufficient_not_failed", () => {
  const m = clone(CLEAR) as any;
  delete m.log;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["decision_log_and_review"],
               "insufficient_evidence");
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
    () => evaluate({ decision: "Malformed input",
                     framing: { classification: 123 },
                     options: "not-a-list" }),
    fieldError("framing.classification"),
  );
});

test("malformed: options as string rejected", () => {
  assert.throws(
    () => evaluate({ decision: "Malformed input", options: "not-a-list" }),
    fieldError("options"),
  );
});

test("malformed: option entry as number rejected", () => {
  const m = clone(CLEAR) as any;
  m.options.list = ["adopt vendor A", 42, "do nothing"];
  assert.throws(() => evaluate(m), fieldError("options.list[1]"));
});

test("malformed: boolean leaf as string rejected", () => {
  const m = clone(CLEAR) as any;
  m.rush.made_in_rush = "no";
  assert.throws(() => evaluate(m), fieldError("rush.made_in_rush"));
});

test("malformed: null section rejected", () => {
  const m = clone(CLEAR) as any;
  m.log = null;
  assert.throws(() => evaluate(m), fieldError("log"));
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
  .filter((f) => f.startsWith("decision-trap-sweep--") && f.endsWith(".json"))
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
