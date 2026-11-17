import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/process-waste-review-coaching.js";
import { FieldTypeError } from "../src/atoms/validate.js";

const COMPLETE: Record<string, unknown> = {
  process: "release-process",
  define: { problem_stated: true,
            goal_measurable_stated: true,
            scope_stated: true,
            customer_need_stated: true,
            whole_system_scope_declared: true },
  mapping: { whole_flow_mapped: true,
             work_made_visible: true,
             process_defined_before_automation: true },
  steps: [
    { name: "build", duration_minutes: 20, wait_before_minutes: 5 },
    { name: "review", duration_minutes: 45, wait_before_minutes: 120 },
    { name: "deploy", duration_minutes: 15, wait_before_minutes: 30 },
  ],
  wastes: [
    { category: "waiting", step_name: "review" },
    { category: "defects", step_name: "build" },
    { category: "excess_processing", step_name: "deploy" },
  ],
  measure: { baseline_established_with_data: true,
             baseline_from_data_not_anecdote: true },
  metrics: { leading_indicators_declared: true,
             lagging_indicators_declared: true,
             kpis_limited_to_meaningful_declared: true,
             metrics_made_visible: true },
  analyze: { root_cause_analysis_performed: true,
             pareto_vital_few_identified: true },
  constraint: { bottleneck_identified: true,
                non_bottleneck_effort_subordinated: true,
                bottleneck_step_name: "review" },
  improve: { improvement_piloted_before_scaling: true,
             pdca_cycle_declared: true,
             verified_against_baseline_before_scaling: true,
             small_continuous_improvement_declared: true,
             flow_and_pull_pursued_over_push: true },
  control: { win_standardized: true,
             monitoring_in_place: true,
             regression_made_visible: true },
  red_lines: { automating_broken_process_present: false,
               vanity_metrics_present: false,
               hero_culture_reliance_present: false,
               optimizing_non_constraint_present: false,
               tradition_without_data_present: false,
               local_optimization_hurting_whole_present: false },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function checkStatus(v: ReturnType<typeof evaluate>, name: string) {
  return v.checks.find((c) => c.check === name)?.status;
}

test("test_complete_manifest_is_ready", () => {
  const v = evaluate(clone(COMPLETE));
  assert.equal(v.verdict, "PROCESS_WASTE_REVIEW_READY");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.checks.length, 40);
  assert.equal(v.computed_status, "within_stated_limits_on_declared_evidence");
  assert.equal(v.steps_count, 3);
  assert.equal(v.wastes_count, 3);
  assert.equal(v.total_duration_minutes, 80);
  assert.equal(v.total_wait_minutes, 155);
  assert.equal(v.wait_share, "0.659574");
  assert.deepEqual(v.distinct_waste_categories, ["waiting", "defects", "excess_processing"]);
  assert.deepEqual(v.duplicate_step_names, []);
  assert.deepEqual(v.unmatched_waste_step_names, []);
  assert.equal(v.waste_step_coverage, "1.000000");
  assert.equal(v.bottleneck_step_computed, "review");
});

test("test_empty_lists_are_valid_declarations", () => {
  const m = clone(COMPLETE) as any;
  m.steps = [];
  m.wastes = [];
  delete m.constraint.bottleneck_step_name;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "steps_declared"), "pass");
  assert.equal(checkStatus(v, "wastes_declared"), "pass");
  assert.equal(checkStatus(v, "declared_bottleneck_matches_longest_step"), "missing");
  assert.equal(v.steps_count, 0);
  assert.equal(v.total_duration_minutes, 0);
  assert.equal(v.total_wait_minutes, 0);
  assert.equal(v.wait_share, null);
  assert.equal(v.waste_step_coverage, null);
  assert.equal(v.bottleneck_step_computed, null);
  assert.deepEqual(v.distinct_waste_categories, []);
});

test("test_no_measurable_goal_fails_section1", () => {
  const m = clone(COMPLETE) as any;
  m.define.goal_measurable_stated = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "PROCESS_WASTE_REVIEW_NOT_READY");
  assert.equal(v.sections["define_and_visibility"], "fail");
  assert.equal(checkStatus(v, "process_goal_measurable_stated"), "fail");
});

test("test_automation_before_definition_fails", () => {
  const m = clone(COMPLETE) as any;
  m.mapping.process_defined_before_automation = false;
  assert.equal(checkStatus(evaluate(m), "process_defined_before_automation"), "fail");
});

test("test_negative_wait_fails_and_totals_still_reported", () => {
  const m = clone(COMPLETE) as any;
  m.steps[1].wait_before_minutes = -10;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_step_times_declared_and_nonnegative"), "fail");
  assert.equal(v.total_wait_minutes, 25);
  assert.equal(v.computed_status, "outside_stated_limits_on_declared_evidence");
});

test("test_step_missing_duration_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.steps[0].duration_minutes;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "every_step_times_declared_and_nonnegative"), "missing");
  assert.equal(v.total_duration_minutes, null);
  assert.equal(v.total_wait_minutes, 155);
  assert.equal(v.wait_share, null);
  assert.equal(v.bottleneck_step_computed, null);
});

test("test_duplicate_step_name_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.steps[2].name = "build";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_step_name_duplicated"), "fail");
  assert.deepEqual(v.duplicate_step_names, ["build"]);
});

test("test_invalid_waste_category_fails", () => {
  const m = clone(COMPLETE) as any;
  m.wastes[0].category = "slowness";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_waste_category_valid_downtime"), "fail");
  assert.deepEqual(v.distinct_waste_categories, ["defects", "excess_processing"]);
});

test("test_waste_on_undeclared_step_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.wastes[1].step_name = "packaging";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_waste_step_names_declared_step"), "fail");
  assert.deepEqual(v.unmatched_waste_step_names, ["packaging"]);
  assert.equal(v.waste_step_coverage, "0.666667");
});

test("test_waste_missing_step_name_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.wastes[0].step_name;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "every_waste_step_names_declared_step"), "missing");
  assert.deepEqual(v.unmatched_waste_step_names, []);
});

test("test_absent_steps_list_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.steps;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "steps_declared"), "missing");
  assert.equal(v.computed_status, null);
  assert.equal(v.steps_count, null);
  assert.equal(v.total_duration_minutes, null);
  assert.equal(v.total_wait_minutes, null);
  assert.equal(v.wait_share, null);
  assert.equal(v.duplicate_step_names, null);
  assert.equal(v.unmatched_waste_step_names, null);
  assert.equal(v.waste_step_coverage, null);
  assert.equal(v.bottleneck_step_computed, null);
  assert.deepEqual(v.distinct_waste_categories, ["waiting", "defects", "excess_processing"]);
});

test("test_absent_wastes_list_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.wastes;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "wastes_declared"), "missing");
  assert.equal(v.wastes_count, null);
  assert.equal(v.distinct_waste_categories, null);
  assert.equal(v.unmatched_waste_step_names, null);
  assert.equal(v.waste_step_coverage, null);
});

test("test_anecdote_baseline_fails_section3", () => {
  const m = clone(COMPLETE) as any;
  m.measure.baseline_from_data_not_anecdote = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "PROCESS_WASTE_REVIEW_NOT_READY");
  assert.equal(v.sections["measurement_and_metrics"], "fail");
});

test("test_leading_without_lagging_pair_fails", () => {
  const m = clone(COMPLETE) as any;
  m.metrics.lagging_indicators_declared = false;
  assert.equal(checkStatus(evaluate(m), "lagging_indicators_declared"), "fail");
});

test("test_no_root_cause_fails_section4", () => {
  const m = clone(COMPLETE) as any;
  m.analyze.root_cause_analysis_performed = false;
  const v = evaluate(m);
  assert.equal(v.sections["analysis_and_constraint"], "fail");
});

test("test_declared_bottleneck_not_longest_step_fails", () => {
  const m = clone(COMPLETE) as any;
  m.constraint.bottleneck_step_name = "build";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "declared_bottleneck_matches_longest_step"), "fail");
  assert.equal(v.bottleneck_step_computed, "review");
  assert.equal(v.computed_status, "outside_stated_limits_on_declared_evidence");
});

test("test_bottleneck_tie_resolves_to_first_longest_step", () => {
  const m = clone(COMPLETE) as any;
  m.steps[0].duration_minutes = 45;
  m.constraint.bottleneck_step_name = "build";
  const v = evaluate(m);
  assert.equal(v.bottleneck_step_computed, "build");
  assert.equal(checkStatus(v, "declared_bottleneck_matches_longest_step"), "pass");
});

test("test_missing_bottleneck_name_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.constraint.bottleneck_step_name;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "declared_bottleneck_matches_longest_step"), "missing");
  assert.equal(v.bottleneck_step_computed, "review");
});

test("test_unsubordinated_effort_fails", () => {
  const m = clone(COMPLETE) as any;
  m.constraint.non_bottleneck_effort_subordinated = false;
  assert.equal(checkStatus(evaluate(m), "non_bottleneck_effort_subordinated"), "fail");
});

test("test_scaling_without_pilot_fails_section5", () => {
  const m = clone(COMPLETE) as any;
  m.improve.improvement_piloted_before_scaling = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "PROCESS_WASTE_REVIEW_NOT_READY");
  assert.equal(v.sections["improvement_and_control"], "fail");
});

test("test_unverified_against_baseline_fails", () => {
  const m = clone(COMPLETE) as any;
  m.improve.verified_against_baseline_before_scaling = false;
  assert.equal(checkStatus(evaluate(m), "improvement_verified_against_baseline_before_scaling"), "fail");
});

test("test_regression_not_visible_fails", () => {
  const m = clone(COMPLETE) as any;
  m.control.regression_made_visible = false;
  assert.equal(checkStatus(evaluate(m), "regression_made_visible"), "fail");
});

test("test_automating_broken_process_fails_red_lines", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.automating_broken_process_present = true;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_automating_broken_process"), "fail");
  assert.equal(v.sections["red_lines"], "fail");
});

test("test_vanity_metrics_red_line_fails", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.vanity_metrics_present = true;
  assert.equal(checkStatus(evaluate(m), "no_vanity_metrics"), "fail");
});

test("test_optimizing_non_constraint_red_line_fails", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.optimizing_non_constraint_present = true;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_optimizing_non_constraint"), "fail");
  assert.equal(v.verdict, "PROCESS_WASTE_REVIEW_NOT_READY");
});

test("test_tradition_without_data_red_line_fails", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.tradition_without_data_present = true;
  assert.equal(checkStatus(evaluate(m), "no_tradition_without_data"), "fail");
});

test("test_absent_evidence_is_insufficient_not_failed", () => {
  const m = clone(COMPLETE) as any;
  delete m.control;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["improvement_and_control"], "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.ok(v.checks.every((c) => c.status === "missing"));
  assert.equal(v.computed_status, null);
  assert.equal(v.steps_count, null);
  assert.equal(v.wastes_count, null);
  assert.equal(v.distinct_waste_categories, null);
  assert.equal(v.duplicate_step_names, null);
  assert.equal(v.bottleneck_step_computed, null);
});

test("test_stamp_names_the_verdict", () => {
  assert.ok(stamp(evaluate(clone(COMPLETE))).includes("VERDICT: PROCESS_WASTE_REVIEW_READY"));
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
  m.process = 12345;
  assert.throws(() => evaluate(m), fieldError("process"));
});

test("malformed: object section as string rejected", () => {
  assert.throws(() => evaluate({ define: "should-be-an-object" }), fieldError("define"));
});

test("malformed: list field as object rejected", () => {
  assert.throws(() => evaluate({ steps: { name: "build" } }), fieldError("steps"));
});

test("malformed: list entry as string rejected", () => {
  assert.throws(() => evaluate({ steps: ["build"] }), fieldError("steps[0]"));
});

test("malformed: boolean leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.measure.baseline_from_data_not_anecdote = "yes";
  assert.throws(() => evaluate(m), fieldError("measure.baseline_from_data_not_anecdote"));
});

test("malformed: number leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.steps[0].duration_minutes = "20";
  assert.throws(() => evaluate(m), fieldError("steps[0].duration_minutes"));
});

test("malformed: number leaf as boolean rejected", () => {
  const m = clone(COMPLETE) as any;
  m.steps[0].wait_before_minutes = true;
  assert.throws(() => evaluate(m), fieldError("steps[0].wait_before_minutes"));
});

test("malformed: nested list entry string field rejected", () => {
  const m = clone(COMPLETE) as any;
  m.wastes[0].category = 42;
  assert.throws(() => evaluate(m), fieldError("wastes[0].category"));
});

test("malformed: bottleneck name as number rejected", () => {
  const m = clone(COMPLETE) as any;
  m.constraint.bottleneck_step_name = 7;
  assert.throws(() => evaluate(m), fieldError("constraint.bottleneck_step_name"));
});

test("malformed: null section rejected", () => {
  const m = clone(COMPLETE) as any;
  m.improve = null;
  assert.throws(() => evaluate(m), fieldError("improve"));
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
  .filter((f) => f.startsWith("process-waste-review-coaching--") && f.endsWith(".json"))
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
