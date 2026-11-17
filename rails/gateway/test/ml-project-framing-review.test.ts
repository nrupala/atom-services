import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/ml-project-framing-review.js";
import { FieldTypeError } from "../src/atoms/validate.js";

const COMPLETE: Record<string, unknown> = {
  project: "churn-prediction",
  framing: { problem_statement_defined: true,
             ml_necessity_assessed: true,
             non_ml_rule_or_heuristic_considered: true,
             decision_and_action_named: true,
             framing_completed_before_modeling: true },
  metric: { primary_metric_named: true,
            metric_tied_to_decision: true,
            accuracy_for_its_own_sake_present: false },
  baseline: { baseline_value_written_down: true,
              baseline_is_rule_or_heuristic_benchmark: true,
              baseline_recorded_before_complex_build: true },
  metrics: [
    { name: "retention-uplift", decision_action: "trigger-save-offer",
      tied_to_decision: true, baseline_recorded_before_modeling: true },
    { name: "false-alarm-rate", decision_action: "cap-offer-volume",
      tied_to_decision: true, baseline_recorded_before_modeling: true },
    { name: "cost-per-save", decision_action: "set-offer-budget",
      tied_to_decision: true, baseline_recorded_before_modeling: true },
  ],
  data_plan: { provenance_plan_stated: true,
               leakage_risks_identified: true,
               split_honesty_strategy_planned: true,
               never_tune_on_test_committed: true,
               distribution_shift_risk_noted: true },
  evaluation_plan: { evaluation_designed_before_modeling: true,
                     offline_online_gap_acknowledged: true,
                     online_check_planned: true,
                     ablation_planned: true },
  approach: { start_simple_first_step_named: true,
              complexity_must_earn_keep_accepted: true,
              reproducibility_plan_stated: true,
              uncertainty_reporting_planned: true,
              worst_case_failure_analysis_planned: true },
  llm: { uses_llm_or_rag: false,
         retrieval_quality_prioritized_over_model_size: false,
         golden_set_evaluation_planned: false,
         grounding_citation_and_idk_required: false,
         prompts_versioned_with_changelog: false },
  serving: { local_first_serving_options_considered: true,
             latency_and_cost_budget_considered: true },
  red_lines: { chasing_sota_without_baseline_present: false,
               evaluating_on_training_data_present: false,
               demo_driven_development_present: false,
               tuning_on_test_present: false,
               latency_cost_ignored_present: false,
               llm_output_treated_as_correct_present: false },
};

const LLM_COMPLETE: Record<string, unknown> = (() => {
  const m = clone(COMPLETE) as any;
  m.llm = { uses_llm_or_rag: true,
            retrieval_quality_prioritized_over_model_size: true,
            golden_set_evaluation_planned: true,
            grounding_citation_and_idk_required: true,
            prompts_versioned_with_changelog: true };
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
  assert.equal(v.verdict, "ML_FRAMING_SOUND");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.checks.length, 43);
  assert.equal(v.computed_status, "within_stated_limits_on_declared_evidence");
  assert.equal(v.metrics_count, 3);
  assert.deepEqual(v.metrics_without_tied_decision, []);
  assert.equal(v.tied_to_decision_coverage, "1.000000");
  assert.deepEqual(v.metrics_without_baseline_recorded, []);
  assert.equal(v.baseline_recorded_coverage, "1.000000");
  assert.deepEqual(v.duplicate_metric_names, []);
});

test("test_llm_project_complete_is_sound", () => {
  const v = evaluate(clone(LLM_COMPLETE));
  assert.equal(v.verdict, "ML_FRAMING_SOUND");
  assert.equal(checkStatus(v, "golden_set_evaluation_planned"), "pass");
});

test("test_no_ml_necessity_fails_section1", () => {
  const m = clone(COMPLETE) as any;
  m.framing.ml_necessity_assessed = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "ML_FRAMING_NOT_SOUND");
  assert.equal(v.sections["ml_necessity_and_decision_framing"], "fail");
  assert.equal(checkStatus(v, "ml_necessity_assessed"), "fail");
});

test("test_no_non_ml_alternative_fails", () => {
  const m = clone(COMPLETE) as any;
  m.framing.non_ml_rule_or_heuristic_considered = false;
  assert.equal(evaluate(m).verdict, "ML_FRAMING_NOT_SOUND");
});

test("test_framing_after_modeling_fails", () => {
  const m = clone(COMPLETE) as any;
  m.framing.framing_completed_before_modeling = false;
  assert.equal(checkStatus(evaluate(m), "framing_completed_before_modeling"), "fail");
});

test("test_accuracy_for_its_own_sake_fails", () => {
  const m = clone(COMPLETE) as any;
  m.metric.accuracy_for_its_own_sake_present = true;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_accuracy_for_its_own_sake"), "fail");
  assert.equal(v.sections["metric_and_baseline_framing"], "fail");
});

test("test_baseline_not_written_down_fails", () => {
  const m = clone(COMPLETE) as any;
  m.baseline.baseline_value_written_down = false;
  assert.equal(evaluate(m).verdict, "ML_FRAMING_NOT_SOUND");
});

test("test_metric_without_tied_decision_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.metrics[0].tied_to_decision = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "ML_FRAMING_NOT_SOUND");
  assert.equal(checkStatus(v, "every_metric_tied_to_decision"), "fail");
  assert.deepEqual(v.metrics_without_tied_decision, ["retention-uplift"]);
  assert.equal(v.tied_to_decision_coverage, "0.666667");
  assert.equal(v.computed_status, "outside_stated_limits_on_declared_evidence");
});

test("test_metric_missing_tied_field_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.metrics[0].tied_to_decision;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "every_metric_tied_to_decision"), "missing");
  assert.deepEqual(v.metrics_without_tied_decision, []);
});

test("test_metric_without_baseline_recorded_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.metrics[1].baseline_recorded_before_modeling = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_metric_baseline_recorded_before_modeling"), "fail");
  assert.deepEqual(v.metrics_without_baseline_recorded, ["false-alarm-rate"]);
  assert.equal(v.baseline_recorded_coverage, "0.666667");
});

test("test_metric_missing_decision_action_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.metrics[2].decision_action;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "every_metric_names_decision_action"), "missing");
});

test("test_metric_empty_decision_action_fails", () => {
  const m = clone(COMPLETE) as any;
  m.metrics[2].decision_action = "";
  assert.equal(checkStatus(evaluate(m), "every_metric_names_decision_action"), "fail");
});

test("test_duplicate_metric_name_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.metrics[2].name = "retention-uplift";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_metric_name_duplicated"), "fail");
  assert.deepEqual(v.duplicate_metric_names, ["retention-uplift"]);
});

test("test_metric_missing_name_is_missing_for_duplicate_check", () => {
  const m = clone(COMPLETE) as any;
  delete m.metrics[2].name;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "no_metric_name_duplicated"), "missing");
  assert.deepEqual(v.duplicate_metric_names, []);
});

test("test_empty_metrics_list_fails", () => {
  const m = clone(COMPLETE) as any;
  m.metrics = [];
  const v = evaluate(m);
  assert.equal(checkStatus(v, "metrics_declared"), "fail");
  assert.equal(v.metrics_count, 0);
  assert.equal(v.tied_to_decision_coverage, null);
  assert.equal(v.baseline_recorded_coverage, null);
  assert.deepEqual(v.duplicate_metric_names, []);
});

test("test_leakage_risks_not_identified_fails_section3", () => {
  const m = clone(COMPLETE) as any;
  m.data_plan.leakage_risks_identified = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "ML_FRAMING_NOT_SOUND");
  assert.equal(v.sections["data_and_evaluation_plan"], "fail");
});

test("test_no_online_check_planned_fails", () => {
  const m = clone(COMPLETE) as any;
  m.evaluation_plan.online_check_planned = false;
  assert.equal(checkStatus(evaluate(m), "online_check_planned"), "fail");
});

test("test_evaluation_after_modeling_fails", () => {
  const m = clone(COMPLETE) as any;
  m.evaluation_plan.evaluation_designed_before_modeling = false;
  assert.equal(evaluate(m).verdict, "ML_FRAMING_NOT_SOUND");
});

test("test_complexity_without_earn_keep_fails_section4", () => {
  const m = clone(COMPLETE) as any;
  m.approach.complexity_must_earn_keep_accepted = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "ML_FRAMING_NOT_SOUND");
  assert.equal(v.sections["approach_reproducibility_and_llm_framing"], "fail");
});

test("test_llm_gate_absent_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.llm.uses_llm_or_rag;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "llm_applicability_declared"), "missing");
  assert.equal(checkStatus(v, "golden_set_evaluation_planned"), "missing");
});

test("test_llm_project_without_golden_set_fails", () => {
  const m = clone(LLM_COMPLETE) as any;
  m.llm.golden_set_evaluation_planned = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "golden_set_evaluation_planned"), "fail");
  assert.equal(v.verdict, "ML_FRAMING_NOT_SOUND");
});

test("test_non_llm_project_llm_fields_false_still_pass", () => {
  const v = evaluate(clone(COMPLETE));
  assert.equal(checkStatus(v, "retrieval_quality_prioritized_over_model_size"), "pass");
  assert.equal(checkStatus(v, "prompts_versioned_with_changelog"), "pass");
});

test("test_llm_field_absent_with_gate_true_is_missing", () => {
  const m = clone(LLM_COMPLETE) as any;
  delete m.llm.golden_set_evaluation_planned;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "golden_set_evaluation_planned"), "missing");
});

test("test_sota_chasing_fails_red_lines", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.chasing_sota_without_baseline_present = true;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_chasing_sota_without_baseline"), "fail");
  assert.equal(v.sections["anti_pattern_red_lines"], "fail");
});

test("test_evaluating_on_training_data_fails_red_lines", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.evaluating_on_training_data_present = true;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_evaluating_on_training_data"), "fail");
  assert.equal(v.verdict, "ML_FRAMING_NOT_SOUND");
});

test("test_demo_driven_and_llm_output_red_lines_fail", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.demo_driven_development_present = true;
  m.red_lines.llm_output_treated_as_correct_present = true;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_demo_driven_development"), "fail");
  assert.equal(checkStatus(v, "no_llm_output_treated_as_correct"), "fail");
});

test("test_absent_evidence_is_insufficient_not_failed", () => {
  const m = clone(COMPLETE) as any;
  delete m.evaluation_plan;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["data_and_evaluation_plan"], "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.ok(v.checks.every((c) => c.status === "missing"));
  assert.equal(v.computed_status, null);
  assert.equal(v.metrics_count, null);
  assert.equal(v.metrics_without_tied_decision, null);
  assert.equal(v.tied_to_decision_coverage, null);
  assert.equal(v.metrics_without_baseline_recorded, null);
  assert.equal(v.baseline_recorded_coverage, null);
  assert.equal(v.duplicate_metric_names, null);
});

test("test_stamp_names_the_verdict", () => {
  assert.ok(stamp(evaluate(clone(COMPLETE))).includes("VERDICT: ML_FRAMING_SOUND"));
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
  m.project = 12345;
  assert.throws(() => evaluate(m), fieldError("project"));
});

test("malformed: object section as string rejected", () => {
  assert.throws(() => evaluate({ framing: "should-be-an-object" }), fieldError("framing"));
});

test("malformed: list field as object rejected", () => {
  assert.throws(() => evaluate({ metrics: { name: "retention-uplift" } }), fieldError("metrics"));
});

test("malformed: list entry as string rejected", () => {
  assert.throws(() => evaluate({ metrics: ["retention-uplift"] }), fieldError("metrics[0]"));
});

test("malformed: boolean leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.framing.ml_necessity_assessed = "yes";
  assert.throws(() => evaluate(m), fieldError("framing.ml_necessity_assessed"));
});

test("malformed: nested list entry string field rejected", () => {
  const m = clone(COMPLETE) as any;
  m.metrics[0].name = 42;
  assert.throws(() => evaluate(m), fieldError("metrics[0].name"));
});

test("malformed: nested list entry boolean as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.metrics[1].tied_to_decision = "true";
  assert.throws(() => evaluate(m), fieldError("metrics[1].tied_to_decision"));
});

test("malformed: null section rejected", () => {
  const m = clone(COMPLETE) as any;
  m.llm = null;
  assert.throws(() => evaluate(m), fieldError("llm"));
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
  .filter((f) => f.startsWith("ml-project-framing-review--") && f.endsWith(".json"))
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
