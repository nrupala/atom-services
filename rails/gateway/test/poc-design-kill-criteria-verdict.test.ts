import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/poc-design-kill-criteria-verdict.js";
import { FieldTypeError } from "../src/atoms/validate.js";

const COMPLETE: Record<string, unknown> = {
  poc: "offline-sync-spike",
  design: { uncertainty_to_reduce_named: true,
            answer_changes_plan_declared: true,
            uncertainty_reduction_purpose_declared: true,
            design_record_completed_before_run: true,
            evaluates_vendor_or_tool: false },
  criteria: [
    { name: "sync-latency-bar", kind: "success",
      condition_stated: true, declared_before_run: true,
      assesses_house_stack_fit: false },
    { name: "data-loss-limit", kind: "success",
      condition_stated: true, declared_before_run: true,
      assesses_house_stack_fit: false },
    { name: "sync-engine-dead-end", kind: "kill",
      condition_stated: true, declared_before_run: true,
      assesses_house_stack_fit: false },
    { name: "battery-drain-limit", kind: "kill",
      condition_stated: true, declared_before_run: true,
      assesses_house_stack_fit: false },
  ],
  timebox: { window_set_before_run: true,
             start_date: "2027-01-05", end_date: "2027-01-16" },
  scope_items: [
    { name: "sync-engine-prototype", on_critical_path: true },
    { name: "conflict-resolution-probe", on_critical_path: true },
    { name: "single-device-harness", on_critical_path: true },
  ],
  red_lines: {
    poc_code_planned_for_direct_production_use_present: false,
    open_ended_design_present: false,
    poc_success_planned_as_production_readiness_present: false },
};

const VENDOR_COMPLETE: Record<string, unknown> = (() => {
  const m = clone(COMPLETE) as any;
  m.design.evaluates_vendor_or_tool = true;
  m.criteria[0].assesses_house_stack_fit = true;
  return m;
})();

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function checkStatus(v: ReturnType<typeof evaluate>, name: string) {
  return v.checks.find((c) => c.check === name)?.status;
}

test("test_complete_manifest_is_sound", () => {
  const v = evaluate(clone(COMPLETE));
  assert.equal(v.verdict, "POC_DESIGN_SOUND");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.checks.length, 22);
  assert.equal(v.computed_status, "within_stated_limits_on_declared_evidence");
  assert.equal(v.criteria_count, 4);
  assert.equal(v.success_criteria_count, 2);
  assert.equal(v.kill_criteria_count, 2);
  assert.deepEqual(v.criteria_without_condition, []);
  assert.equal(v.condition_stated_coverage, "1.000000");
  assert.deepEqual(v.criteria_not_declared_before_run, []);
  assert.equal(v.declared_before_run_coverage, "1.000000");
  assert.deepEqual(v.criteria_with_invalid_kind, []);
  assert.deepEqual(v.duplicate_criterion_names, []);
  assert.equal(v.timebox_start_date, "2027-01-05");
  assert.equal(v.timebox_end_date, "2027-01-16");
  assert.equal(v.timebox_duration_days, 11);
  assert.equal(v.scope_items_count, 3);
  assert.deepEqual(v.scope_items_off_critical_path, []);
  assert.equal(v.critical_path_coverage, "1.000000");
  assert.deepEqual(v.duplicate_scope_item_names, []);
});

test("test_vendor_project_complete_is_sound", () => {
  const v = evaluate(clone(VENDOR_COMPLETE));
  assert.equal(v.verdict, "POC_DESIGN_SOUND");
  assert.equal(checkStatus(v, "house_stack_fit_criterion_when_evaluating_vendor"), "pass");
});

test("test_uncertainty_not_named_fails_section1", () => {
  const m = clone(COMPLETE) as any;
  m.design.uncertainty_to_reduce_named = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "POC_DESIGN_NOT_SOUND");
  assert.equal(v.sections["design_premise"], "fail");
  assert.equal(checkStatus(v, "uncertainty_to_reduce_named"), "fail");
});

test("test_answer_not_changing_plan_fails", () => {
  const m = clone(COMPLETE) as any;
  m.design.answer_changes_plan_declared = false;
  assert.equal(evaluate(m).verdict, "POC_DESIGN_NOT_SOUND");
});

test("test_design_record_after_run_fails", () => {
  const m = clone(COMPLETE) as any;
  m.design.design_record_completed_before_run = false;
  assert.equal(checkStatus(evaluate(m), "design_record_completed_before_run"), "fail");
});

test("test_no_kill_criterion_row_fails", () => {
  const m = clone(COMPLETE) as any;
  for (const row of m.criteria) row.kind = "success";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "at_least_one_kill_criterion_declared"), "fail");
  assert.equal(v.kill_criteria_count, 0);
  assert.equal(v.sections["criteria_row_consistency"], "fail");
});

test("test_no_success_criterion_row_fails", () => {
  const m = clone(COMPLETE) as any;
  for (const row of m.criteria) row.kind = "kill";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "at_least_one_success_criterion_declared"), "fail");
  assert.equal(v.success_criteria_count, 0);
});

test("test_invalid_criterion_kind_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.criteria[1].kind = "aspirational";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_criterion_kind_is_success_or_kill"), "fail");
  assert.deepEqual(v.criteria_with_invalid_kind, ["data-loss-limit"]);
});

test("test_criterion_missing_kind_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.criteria[0].kind;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "every_criterion_kind_is_success_or_kill"), "missing");
  assert.deepEqual(v.criteria_with_invalid_kind, []);
});

test("test_criterion_without_condition_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.criteria[0].condition_stated = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "POC_DESIGN_NOT_SOUND");
  assert.equal(checkStatus(v, "every_criterion_condition_stated"), "fail");
  assert.deepEqual(v.criteria_without_condition, ["sync-latency-bar"]);
  assert.equal(v.condition_stated_coverage, "0.750000");
  assert.equal(v.computed_status, "outside_stated_limits_on_declared_evidence");
});

test("test_criterion_missing_condition_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.criteria[2].condition_stated;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "every_criterion_condition_stated"), "missing");
  assert.deepEqual(v.criteria_without_condition, []);
});

test("test_criterion_not_before_run_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.criteria[3].declared_before_run = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_criterion_declared_before_run"), "fail");
  assert.deepEqual(v.criteria_not_declared_before_run, ["battery-drain-limit"]);
  assert.equal(v.declared_before_run_coverage, "0.750000");
});

test("test_duplicate_criterion_name_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.criteria[3].name = "sync-latency-bar";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_criterion_name_duplicated"), "fail");
  assert.deepEqual(v.duplicate_criterion_names, ["sync-latency-bar"]);
});

test("test_criterion_missing_name_is_missing_for_duplicate_check", () => {
  const m = clone(COMPLETE) as any;
  delete m.criteria[3].name;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "no_criterion_name_duplicated"), "missing");
  assert.deepEqual(v.duplicate_criterion_names, []);
});

test("test_empty_criteria_list_fails", () => {
  const m = clone(COMPLETE) as any;
  m.criteria = [];
  const v = evaluate(m);
  assert.equal(checkStatus(v, "criteria_declared"), "fail");
  assert.equal(v.criteria_count, 0);
  assert.equal(v.success_criteria_count, 0);
  assert.equal(v.kill_criteria_count, 0);
  assert.equal(v.condition_stated_coverage, null);
  assert.equal(v.declared_before_run_coverage, null);
  assert.deepEqual(v.duplicate_criterion_names, []);
});

test("test_vendor_gate_absent_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.design.evaluates_vendor_or_tool;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "vendor_evaluation_applicability_declared"), "missing");
  assert.equal(checkStatus(v, "house_stack_fit_criterion_when_evaluating_vendor"), "missing");
});

test("test_vendor_project_without_house_stack_fit_row_fails", () => {
  const m = clone(COMPLETE) as any;
  m.design.evaluates_vendor_or_tool = true;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "house_stack_fit_criterion_when_evaluating_vendor"), "fail");
  assert.equal(v.verdict, "POC_DESIGN_NOT_SOUND");
});

test("test_non_vendor_project_fit_fields_false_still_pass", () => {
  const v = evaluate(clone(COMPLETE));
  assert.equal(checkStatus(v, "house_stack_fit_criterion_when_evaluating_vendor"), "pass");
});

test("test_timebox_not_set_before_run_fails_section3", () => {
  const m = clone(COMPLETE) as any;
  m.timebox.window_set_before_run = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "POC_DESIGN_NOT_SOUND");
  assert.equal(v.sections["timebox_window"], "fail");
});

test("test_timebox_impossible_date_fails", () => {
  const m = clone(COMPLETE) as any;
  m.timebox.end_date = "2027-02-30";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "timebox_window_dates_valid"), "fail");
  assert.equal(checkStatus(v, "timebox_end_after_start"), "fail");
  assert.equal(v.timebox_duration_days, null);
});

test("test_timebox_malformed_date_string_fails", () => {
  const m = clone(COMPLETE) as any;
  m.timebox.start_date = "Jan 5 2027";
  assert.equal(checkStatus(evaluate(m), "timebox_window_dates_valid"), "fail");
});

test("test_timebox_end_before_start_fails", () => {
  const m = clone(COMPLETE) as any;
  m.timebox.end_date = "2027-01-02";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "timebox_window_dates_valid"), "pass");
  assert.equal(checkStatus(v, "timebox_end_after_start"), "fail");
  assert.equal(v.timebox_duration_days, -3);
});

test("test_timebox_end_equal_start_fails", () => {
  const m = clone(COMPLETE) as any;
  m.timebox.end_date = "2027-01-05";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "timebox_end_after_start"), "fail");
  assert.equal(v.timebox_duration_days, 0);
});

test("test_timebox_missing_date_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.timebox.end_date;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "timebox_window_dates_valid"), "missing");
  assert.equal(v.timebox_duration_days, null);
  assert.equal(v.timebox_end_date, null);
});

test("test_scope_item_off_critical_path_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.scope_items[1].on_critical_path = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "POC_DESIGN_NOT_SOUND");
  assert.equal(checkStatus(v, "every_scope_item_on_critical_path"), "fail");
  assert.deepEqual(v.scope_items_off_critical_path, ["conflict-resolution-probe"]);
  assert.equal(v.critical_path_coverage, "0.666667");
  assert.equal(v.sections["scope_row_consistency"], "fail");
});

test("test_scope_item_missing_path_field_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.scope_items[0].on_critical_path;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "every_scope_item_on_critical_path"), "missing");
  assert.deepEqual(v.scope_items_off_critical_path, []);
});

test("test_duplicate_scope_item_name_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.scope_items[2].name = "sync-engine-prototype";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_scope_item_name_duplicated"), "fail");
  assert.deepEqual(v.duplicate_scope_item_names, ["sync-engine-prototype"]);
});

test("test_empty_scope_list_fails", () => {
  const m = clone(COMPLETE) as any;
  m.scope_items = [];
  const v = evaluate(m);
  assert.equal(checkStatus(v, "scope_items_declared"), "fail");
  assert.equal(v.scope_items_count, 0);
  assert.equal(v.critical_path_coverage, null);
  assert.deepEqual(v.duplicate_scope_item_names, []);
});

test("test_direct_production_use_plan_fails_red_lines", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.poc_code_planned_for_direct_production_use_present = true;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_poc_code_planned_for_direct_production_use"), "fail");
  assert.equal(v.sections["production_boundary_by_design"], "fail");
});

test("test_open_ended_and_readiness_red_lines_fail", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.open_ended_design_present = true;
  m.red_lines.poc_success_planned_as_production_readiness_present = true;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_open_ended_design"), "fail");
  assert.equal(checkStatus(v, "no_poc_success_planned_as_production_readiness"), "fail");
  assert.equal(v.verdict, "POC_DESIGN_NOT_SOUND");
});

test("test_absent_evidence_is_insufficient_not_failed", () => {
  const m = clone(COMPLETE) as any;
  delete m.timebox;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["timebox_window"], "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.ok(v.checks.every((c) => c.status === "missing"));
  assert.equal(v.computed_status, null);
  assert.equal(v.criteria_count, null);
  assert.equal(v.success_criteria_count, null);
  assert.equal(v.kill_criteria_count, null);
  assert.equal(v.criteria_without_condition, null);
  assert.equal(v.condition_stated_coverage, null);
  assert.equal(v.criteria_not_declared_before_run, null);
  assert.equal(v.declared_before_run_coverage, null);
  assert.equal(v.criteria_with_invalid_kind, null);
  assert.equal(v.duplicate_criterion_names, null);
  assert.equal(v.timebox_start_date, null);
  assert.equal(v.timebox_end_date, null);
  assert.equal(v.timebox_duration_days, null);
  assert.equal(v.scope_items_count, null);
  assert.equal(v.scope_items_off_critical_path, null);
  assert.equal(v.critical_path_coverage, null);
  assert.equal(v.duplicate_scope_item_names, null);
});

test("test_stamp_names_the_verdict", () => {
  assert.ok(stamp(evaluate(clone(COMPLETE))).includes("VERDICT: POC_DESIGN_SOUND"));
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
  m.poc = 12345;
  assert.throws(() => evaluate(m), fieldError("poc"));
});

test("malformed: object section as string rejected", () => {
  assert.throws(() => evaluate({ design: "should-be-an-object" }), fieldError("design"));
});

test("malformed: list field as object rejected", () => {
  assert.throws(() => evaluate({ criteria: { name: "sync-latency-bar" } }), fieldError("criteria"));
});

test("malformed: list entry as string rejected", () => {
  assert.throws(() => evaluate({ criteria: ["sync-latency-bar"] }), fieldError("criteria[0]"));
});

test("malformed: boolean leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.design.uncertainty_to_reduce_named = "yes";
  assert.throws(() => evaluate(m), fieldError("design.uncertainty_to_reduce_named"));
});

test("malformed: nested list entry string field rejected", () => {
  const m = clone(COMPLETE) as any;
  m.criteria[0].name = 42;
  assert.throws(() => evaluate(m), fieldError("criteria[0].name"));
});

test("malformed: nested list entry boolean as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.criteria[1].condition_stated = "true";
  assert.throws(() => evaluate(m), fieldError("criteria[1].condition_stated"));
});

test("malformed: date field as number rejected", () => {
  const m = clone(COMPLETE) as any;
  m.timebox.start_date = 20270105;
  assert.throws(() => evaluate(m), fieldError("timebox.start_date"));
});

test("malformed: null section rejected", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines = null;
  assert.throws(() => evaluate(m), fieldError("red_lines"));
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
  .filter((f) => f.startsWith("poc-design-kill-criteria-verdict--") && f.endsWith(".json"))
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
