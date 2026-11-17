import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/quant-math-derivation-sanity-check.js";
import { FieldTypeError } from "../src/atoms/validate.js";

const COMPLETE: Record<string, unknown> = {
  derivation_title: "weighted-mean-of-two-blocks",
  derivation: { goal_quantity_stated: true,
                givens_defined_before_use: true,
                shown_step_by_step: true,
                final_result_value: 2.0,
                final_result_unit: "1" },
  steps: [
    { step_id: "step-1", operation: "add",
      operand_a: 1.5, operand_b: 2.5, declared_result: 4.0,
      operand_a_unit: "units", operand_b_unit: "units",
      declared_result_unit: "units" },
    { step_id: "step-2", operation: "multiply",
      operand_a: 4.0, operand_b: 0.25, declared_result: 1.0,
      operand_a_unit: "units", operand_b_unit: "1",
      declared_result_unit: "units" },
    { step_id: "step-3", operation: "divide",
      operand_a: 1.0, operand_b: 0.5, declared_result: 2.0,
      operand_a_unit: "units", operand_b_unit: "units",
      declared_result_unit: "1" },
  ],
  dimensions: { dimensions_checked: true,
                units_checked: true,
                unit_conversions_shown_where_needed: true },
  assumptions: { assumptions_listed: true,
                 normality_checked_where_assumed: true,
                 independence_checked_where_assumed: true,
                 stationarity_checked_where_assumed: true,
                 failure_modes_named: true,
                 domain_restrictions_stated: true },
  method: { method_named: true,
            simplest_method_that_fits_chosen: true,
            method_choice_justified_from_problem_structure: true,
            small_numerical_example_verified: true },
  red_lines: { black_box_trust_without_derivation_present: false,
               assumptions_ignored_present: false,
               correlation_presented_as_causation_present: false,
               p_hacking_present: false,
               overfitting_present: false },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function checkStatus(v: ReturnType<typeof evaluate>, name: string) {
  return v.checks.find((c) => c.check === name)?.status;
}

test("test_complete_manifest_is_sound", () => {
  const v = evaluate(clone(COMPLETE));
  assert.equal(v.verdict, "DERIVATION_SOUND");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.checks.length, 30);
  assert.equal(v.computed_status, "within_stated_limits_on_declared_evidence");
  assert.equal(v.derivation_steps_count, 3);
  assert.deepEqual(v.duplicate_derivation_step_ids, []);
  assert.deepEqual(v.derivation_steps_with_arithmetic_mismatch, []);
  assert.deepEqual(v.derivation_steps_with_unit_mismatch, []);
  assert.deepEqual(v.derivation_steps_missing_units, []);
  assert.equal(v.arithmetic_match_ratio, "1.000000");
  assert.equal(v.unit_match_ratio, "1.000000");
});

test("test_goal_not_stated_fails_structure", () => {
  const m = clone(COMPLETE) as any;
  m.derivation.goal_quantity_stated = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "DERIVATION_NOT_SOUND");
  assert.equal(v.sections["derivation_structure"], "fail");
  assert.equal(checkStatus(v, "derivation_goal_quantity_stated"), "fail");
});

test("test_final_value_mismatch_fails_and_is_computed", () => {
  const m = clone(COMPLETE) as any;
  m.derivation.final_result_value = 2.5;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "derivation_final_result_value_matches_last_step"), "fail");
  assert.equal(v.computed_status, "outside_stated_limits_on_declared_evidence");
});

test("test_final_unit_mismatch_fails", () => {
  const m = clone(COMPLETE) as any;
  m.derivation.final_result_unit = "units";
  assert.equal(checkStatus(evaluate(m), "derivation_final_result_unit_matches_last_step"), "fail");
});

test("test_absent_final_value_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.derivation.final_result_value;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "derivation_final_result_value_matches_last_step"), "missing");
});

test("test_arithmetic_mismatch_fails_and_step_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.steps[0].declared_result = 4.5;
  const v = evaluate(m);
  assert.equal(v.verdict, "DERIVATION_NOT_SOUND");
  assert.equal(checkStatus(v, "every_derivation_step_arithmetic_recomputes"), "fail");
  assert.deepEqual(v.derivation_steps_with_arithmetic_mismatch, ["step-1"]);
  assert.equal(v.arithmetic_match_ratio, "0.666667");
});

test("test_arithmetic_within_6dp_serialization_passes", () => {
  const m = clone(COMPLETE) as any;
  m.steps[0].operand_a = 0.1;
  m.steps[0].operand_b = 0.2;
  m.steps[0].declared_result = 0.3;
  assert.equal(checkStatus(evaluate(m), "every_derivation_step_arithmetic_recomputes"), "pass");
});

test("test_divide_by_zero_fails_both_arithmetic_checks", () => {
  const m = clone(COMPLETE) as any;
  m.steps[2].operand_b = 0.0;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_derivation_step_divides_by_zero"), "fail");
  assert.equal(checkStatus(v, "every_derivation_step_arithmetic_recomputes"), "fail");
  assert.deepEqual(v.derivation_steps_with_arithmetic_mismatch, ["step-3"]);
});

test("test_unknown_operation_fails_recognition_and_arithmetic", () => {
  const m = clone(COMPLETE) as any;
  m.steps[1].operation = "power";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_derivation_step_operation_recognised"), "fail");
  assert.equal(checkStatus(v, "every_derivation_step_arithmetic_recomputes"), "fail");
});

test("test_duplicate_step_id_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.steps[2].step_id = "step-1";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_derivation_step_id_unique"), "fail");
  assert.deepEqual(v.duplicate_derivation_step_ids, ["step-1"]);
});

test("test_step_missing_operand_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.steps[1].operand_b;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "every_derivation_step_arithmetic_recomputes"), "missing");
});

test("test_absent_steps_list_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.steps;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "derivation_steps_list_declared"), "missing");
  assert.equal(v.computed_status, null);
  assert.equal(v.derivation_steps_count, null);
  assert.equal(v.duplicate_derivation_step_ids, null);
  assert.equal(v.derivation_steps_with_arithmetic_mismatch, null);
  assert.equal(v.derivation_steps_with_unit_mismatch, null);
  assert.equal(v.derivation_steps_missing_units, null);
  assert.equal(v.arithmetic_match_ratio, null);
  assert.equal(v.unit_match_ratio, null);
});

test("test_empty_steps_list_fails_steps_declared", () => {
  const m = clone(COMPLETE) as any;
  m.steps = [];
  const v = evaluate(m);
  assert.equal(v.verdict, "DERIVATION_NOT_SOUND");
  assert.equal(checkStatus(v, "derivation_steps_list_declared"), "fail");
  assert.equal(v.derivation_steps_count, 0);
  assert.equal(v.arithmetic_match_ratio, null);
  assert.equal(v.unit_match_ratio, null);
});

test("test_additive_unit_mismatch_fails_and_step_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.steps[0].operand_b_unit = "seconds";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_derivation_step_result_unit_follows_unit_algebra"), "fail");
  assert.deepEqual(v.derivation_steps_with_unit_mismatch, ["step-1"]);
  assert.equal(v.unit_match_ratio, "0.666667");
});

test("test_multiply_unit_algebra_product_form", () => {
  const m = clone(COMPLETE) as any;
  m.steps[1].operand_b_unit = "per-unit";
  m.steps[1].declared_result_unit = "units*per-unit";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_derivation_step_result_unit_follows_unit_algebra"), "pass");
  assert.deepEqual(v.derivation_steps_with_unit_mismatch, []);
  assert.equal(v.verdict, "DERIVATION_SOUND");
});

test("test_step_missing_unit_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.steps[0].operand_b_unit;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "every_derivation_step_declares_all_units"), "missing");
  assert.deepEqual(v.derivation_steps_missing_units, ["step-1"]);
});

test("test_step_empty_unit_fails_declares_all_units", () => {
  const m = clone(COMPLETE) as any;
  m.steps[0].operand_b_unit = "";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_derivation_step_declares_all_units"), "fail");
  assert.deepEqual(v.derivation_steps_missing_units, ["step-1"]);
});

test("test_dimensions_not_checked_fails_section3", () => {
  const m = clone(COMPLETE) as any;
  m.dimensions.dimensions_checked = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "DERIVATION_NOT_SOUND");
  assert.equal(v.sections["dimensions_and_units"], "fail");
});

test("test_normality_unchecked_fails_section4", () => {
  const m = clone(COMPLETE) as any;
  m.assumptions.normality_checked_where_assumed = false;
  const v = evaluate(m);
  assert.equal(v.sections["assumptions_and_failure_modes"], "fail");
  assert.equal(checkStatus(v, "derivation_normality_checked_where_assumed"), "fail");
});

test("test_failure_modes_unnamed_fails", () => {
  const m = clone(COMPLETE) as any;
  m.assumptions.failure_modes_named = false;
  assert.equal(checkStatus(evaluate(m), "derivation_failure_modes_named"), "fail");
});

test("test_no_numerical_example_fails_section5", () => {
  const m = clone(COMPLETE) as any;
  m.method.small_numerical_example_verified = false;
  const v = evaluate(m);
  assert.equal(v.sections["method_choice_and_verification"], "fail");
  assert.equal(checkStatus(v, "derivation_verified_with_small_numerical_example"), "fail");
});

test("test_complex_method_without_justification_fails", () => {
  const m = clone(COMPLETE) as any;
  m.method.simplest_method_that_fits_chosen = false;
  assert.equal(checkStatus(evaluate(m), "derivation_simplest_fitting_method_chosen"), "fail");
});

test("test_black_box_trust_fails_red_lines", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.black_box_trust_without_derivation_present = true;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "derivation_free_of_black_box_trust"), "fail");
  assert.equal(v.sections["red_lines"], "fail");
  assert.equal(v.verdict, "DERIVATION_NOT_SOUND");
});

test("test_correlation_as_causation_fails_red_lines", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.correlation_presented_as_causation_present = true;
  assert.equal(checkStatus(evaluate(m), "derivation_free_of_correlation_as_causation"), "fail");
});

test("test_p_hacking_fails_red_lines", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.p_hacking_present = true;
  assert.equal(checkStatus(evaluate(m), "derivation_free_of_p_hacking"), "fail");
});

test("test_absent_evidence_is_insufficient_not_failed", () => {
  const m = clone(COMPLETE) as any;
  delete m.assumptions;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["assumptions_and_failure_modes"], "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.ok(v.checks.every((c) => c.status === "missing"));
  assert.equal(v.computed_status, null);
  assert.equal(v.derivation_steps_count, null);
  assert.equal(v.duplicate_derivation_step_ids, null);
  assert.equal(v.derivation_steps_with_arithmetic_mismatch, null);
  assert.equal(v.derivation_steps_with_unit_mismatch, null);
  assert.equal(v.derivation_steps_missing_units, null);
  assert.equal(v.arithmetic_match_ratio, null);
  assert.equal(v.unit_match_ratio, null);
});

test("test_stamp_names_the_verdict", () => {
  assert.ok(stamp(evaluate(clone(COMPLETE))).includes("VERDICT: DERIVATION_SOUND"));
});

test("test_non_object_manifest_rejected", () => {
  assert.throws(
    () => evaluate(["not", "a", "manifest"]),
    (err: unknown) =>
      err instanceof TypeError &&
      (err as Error).message === "manifest must be a JSON object",
  );
});

function fieldError(field: string) {
  return (err: unknown) =>
    err instanceof FieldTypeError && err.field === field;
}

test("malformed: string field as number rejected", () => {
  const m = clone(COMPLETE) as any;
  m.derivation_title = 12345;
  assert.throws(() => evaluate(m), fieldError("derivation_title"));
});

test("malformed: object section as string rejected", () => {
  assert.throws(() => evaluate({ derivation: "should-be-an-object" }), fieldError("derivation"));
});

test("malformed: list field as object rejected", () => {
  assert.throws(() => evaluate({ steps: { step_id: "step-1" } }), fieldError("steps"));
});

test("malformed: list entry as string rejected", () => {
  assert.throws(() => evaluate({ steps: ["step-1"] }), fieldError("steps[0]"));
});

test("malformed: boolean leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.assumptions.failure_modes_named = "yes";
  assert.throws(() => evaluate(m), fieldError("assumptions.failure_modes_named"));
});

test("malformed: number leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.derivation.final_result_value = "2.0";
  assert.throws(() => evaluate(m), fieldError("derivation.final_result_value"));
});

test("malformed: number leaf as boolean rejected", () => {
  const m = clone(COMPLETE) as any;
  m.steps[0].operand_a = true;
  assert.throws(() => evaluate(m), fieldError("steps[0].operand_a"));
});

test("malformed: nested list entry string field rejected", () => {
  const m = clone(COMPLETE) as any;
  m.steps[1].operation = 42;
  assert.throws(() => evaluate(m), fieldError("steps[1].operation"));
});

test("malformed: null section rejected", () => {
  const m = clone(COMPLETE) as any;
  m.dimensions = null;
  assert.throws(() => evaluate(m), fieldError("dimensions"));
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
  .filter((f) => f.startsWith("quant-math-derivation-sanity-check--") && f.endsWith(".json"))
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
