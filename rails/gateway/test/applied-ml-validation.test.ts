import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/applied-ml-validation.js";
import { FieldTypeError } from "../src/atoms/validate.js";

// The VALIDATED manifest, copied from the Python VerdictTests oracle.
const VALIDATED: Record<string, unknown> = {
  model: "churn intervention ranker v3",
  framing: { decision_named: true,
             error_costs_stated: true,
             alternatives_considered: true },
  baseline: { defined: true,
              baseline_score: 0.30,
              model_score: 0.22,
              metric_direction: "lower_is_better",
              project_stopped_because_baseline_not_beaten: false },
  data: { provenance_documented: true,
          licensing_and_consent_confirmed: true,
          label_quality_checked: true,
          edge_cases_covered: true,
          leakage_audited: true,
          training_without_rights_or_consent: false },
  validation: { temporal_data: true,
                grouped_data: true,
                split_type: "time_and_group" },
  ladder: { baseline_rung_evaluated: true,
            data_and_splits_held_fixed: true,
            complexity_justified_by_evaluation: true,
            selected_model_rung: "boosted_trees",
            rungs_evaluated: ["majority_heuristic", "linear",
                              "boosted_trees"] },
  evaluation: { decision_aligned_metrics_used: true,
                slice_performance_reported: true,
                calibration_reported: true,
                uncertainty_via_resampling_reported: true,
                conclusion_change_condition_stated: true,
                imbalanced_or_high_stakes: true,
                accuracy_only_reporting: false },
  robustness: { distribution_shift_evaluated: true,
                adversarial_inputs_evaluated: true,
                known_failure_modes_documented: true,
                data_limitations_documented: true,
                cherry_picked_examples_presented: false,
                claims_exceed_measured_capability: false },
  deployment: { data_code_model_versioned_together: true,
                drift_monitoring_planned: true,
                live_performance_monitoring_planned: true,
                feedback_loops_monitored: true,
                rollback_path_defined: true,
                regular_revalidation_planned: true },
  documentation: { model_card_written_and_versioned: true },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function checkStatus(v: ReturnType<typeof evaluate>, name: string): string {
  return v.checks.find((c) => c.check === name)!.status;
}

// ---- The 46 Python VerdictTests, ported ----

test("test_validated_manifest_is_validated", () => {
  const v = evaluate(clone(VALIDATED));
  assert.equal(v.verdict, "VALIDATED");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.checks.length, 35);
  assert.equal(v.baseline_status, "beaten_on_declared_evidence");
  assert.equal(v.baseline_improvement, "0.0800");
  assert.equal(v.selected_rung_index, 2);
});

test("test_baseline_improvement_higher_is_better", () => {
  const m = clone(VALIDATED) as any;
  m.baseline.metric_direction = "higher_is_better";
  m.baseline.baseline_score = 0.70;
  m.baseline.model_score = 0.82;
  const v = evaluate(m);
  assert.equal(v.verdict, "VALIDATED");
  assert.equal(v.baseline_improvement, "0.1200");
});

test("test_baseline_improvement_serialized_at_fixed_4dp", () => {
  const m = clone(VALIDATED) as any;
  m.baseline.baseline_score = 0.30003;
  m.baseline.model_score = 0.2;
  assert.equal(evaluate(m).baseline_improvement, "0.1000");
});

test("test_baseline_tied_does_not_beat", () => {
  const m = clone(VALIDATED) as any;
  m.baseline.model_score = 0.30;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_VALIDATED");
  assert.equal(v.sections["framing_and_baseline"], "fail");
  assert.equal(v.baseline_status, "not_beaten_on_declared_evidence");
  assert.equal(v.baseline_improvement, "0.0000");
});

test("test_baseline_worse_than_baseline_fails", () => {
  const m = clone(VALIDATED) as any;
  m.baseline.model_score = 0.35;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_VALIDATED");
  assert.equal(v.baseline_improvement, "-0.0500");
});

test("test_project_rightly_stopped_passes_without_scores", () => {
  const m = clone(VALIDATED) as any;
  m.baseline.project_stopped_because_baseline_not_beaten = true;
  delete m.baseline.baseline_score;
  delete m.baseline.model_score;
  delete m.baseline.metric_direction;
  const v = evaluate(m);
  assert.equal(v.verdict, "VALIDATED");
  assert.equal(v.baseline_status, "project_rightly_stopped");
  assert.equal(v.baseline_improvement, null);
});

test("test_project_rightly_stopped_still_reports_improvement", () => {
  const m = clone(VALIDATED) as any;
  m.baseline.project_stopped_because_baseline_not_beaten = true;
  const v = evaluate(m);
  assert.equal(v.baseline_status, "project_rightly_stopped");
  assert.equal(v.baseline_improvement, "0.0800");
});

test("test_missing_baseline_scores_is_missing_not_failed", () => {
  const m = clone(VALIDATED) as any;
  delete m.baseline.model_score;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.baseline_status, null);
  assert.equal(v.baseline_improvement, null);
  assert.equal(
    checkStatus(v, "baseline_meaningfully_beaten_or_project_stopped"),
    "missing");
});

test("test_invalid_metric_direction_fails", () => {
  const m = clone(VALIDATED) as any;
  m.baseline.metric_direction = "sideways";
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_VALIDATED");
  assert.equal(v.baseline_status, "not_beaten_on_declared_evidence");
  assert.equal(v.baseline_improvement, null);
});

test("test_non_numeric_baseline_score_is_missing", () => {
  // Corrected under the F1 ruling: previously expected a verdict
  // over a wrong-typed documented field (the F1 defect).
  const m = clone(VALIDATED) as any;
  m.baseline.model_score = "low";
  assert.throws(() => evaluate(m), fieldError("baseline.model_score"));
});

test("test_boolean_baseline_score_is_missing", () => {
  // Corrected under the F1 ruling: a boolean is not a number —
  // previously expected a verdict over the wrong-typed field.
  const m = clone(VALIDATED) as any;
  m.baseline.model_score = true;
  assert.throws(() => evaluate(m), fieldError("baseline.model_score"));
});

test("test_decision_not_named_fails", () => {
  const m = clone(VALIDATED) as any;
  m.framing.decision_named = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_VALIDATED");
  assert.equal(v.sections["framing_and_baseline"], "fail");
});

test("test_training_without_consent_fails_red_line", () => {
  const m = clone(VALIDATED) as any;
  m.data.training_without_rights_or_consent = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_VALIDATED");
  assert.equal(v.sections["data_audit_and_leakage"], "fail");
});

test("test_leakage_not_audited_fails", () => {
  const m = clone(VALIDATED) as any;
  m.data.leakage_audited = false;
  assert.equal(evaluate(m).verdict, "NOT_VALIDATED");
});

test("test_random_split_for_temporal_data_fails", () => {
  const m = clone(VALIDATED) as any;
  m.validation.split_type = "random";
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_VALIDATED");
  assert.equal(
    checkStatus(v, "splits_by_time_and_group_where_applicable"), "fail");
});

test("test_time_split_alone_fails_for_grouped_data", () => {
  const m = clone(VALIDATED) as any;
  m.validation.split_type = "time";
  assert.equal(evaluate(m).verdict, "NOT_VALIDATED");
});

test("test_group_split_alone_fails_for_temporal_data", () => {
  const m = clone(VALIDATED) as any;
  m.validation.split_type = "group";
  assert.equal(evaluate(m).verdict, "NOT_VALIDATED");
});

test("test_random_split_passes_when_neither_temporal_nor_grouped", () => {
  const m = clone(VALIDATED) as any;
  m.validation = { temporal_data: false, grouped_data: false,
                   split_type: "random" };
  assert.equal(evaluate(m).verdict, "VALIDATED");
});

test("test_time_split_passes_for_temporal_only", () => {
  const m = clone(VALIDATED) as any;
  m.validation = { temporal_data: true, grouped_data: false,
                   split_type: "time" };
  assert.equal(evaluate(m).verdict, "VALIDATED");
});

test("test_unknown_split_type_fails", () => {
  const m = clone(VALIDATED) as any;
  m.validation.split_type = "kfold";
  assert.equal(evaluate(m).verdict, "NOT_VALIDATED");
});

test("test_missing_split_evidence_is_missing", () => {
  const m = clone(VALIDATED) as any;
  delete m.validation.split_type;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(
    checkStatus(v, "splits_by_time_and_group_where_applicable"), "missing");
});

test("test_non_boolean_temporal_flag_fails_split_check", () => {
  // Corrected under the F1 ruling: previously expected a verdict
  // over a wrong-typed documented field (the F1 defect).
  const m = clone(VALIDATED) as any;
  m.validation.temporal_data = "yes";
  assert.throws(
    () => evaluate(m),
    fieldError("validation.temporal_data"),
  );
});

test("test_ladder_skipping_a_rung_fails", () => {
  const m = clone(VALIDATED) as any;
  m.ladder.rungs_evaluated = ["majority_heuristic", "boosted_trees"];
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_VALIDATED");
  assert.equal(v.sections["model_ladder"], "fail");
  assert.equal(v.selected_rung_index, 2);
});

test("test_ladder_out_of_order_fails", () => {
  const m = clone(VALIDATED) as any;
  m.ladder.rungs_evaluated = ["linear", "majority_heuristic",
                              "boosted_trees"];
  assert.equal(evaluate(m).verdict, "NOT_VALIDATED");
});

test("test_ladder_repeated_rung_fails", () => {
  const m = clone(VALIDATED) as any;
  m.ladder.selected_model_rung = "linear";
  m.ladder.rungs_evaluated = ["majority_heuristic", "linear", "linear"];
  assert.equal(evaluate(m).verdict, "NOT_VALIDATED");
});

test("test_ladder_climbing_past_selected_fails", () => {
  const m = clone(VALIDATED) as any;
  m.ladder.rungs_evaluated = ["majority_heuristic", "linear",
                              "boosted_trees", "deep"];
  assert.equal(evaluate(m).verdict, "NOT_VALIDATED");
});

test("test_ladder_first_rung_only_passes", () => {
  const m = clone(VALIDATED) as any;
  m.ladder.selected_model_rung = "majority_heuristic";
  m.ladder.rungs_evaluated = ["majority_heuristic"];
  const v = evaluate(m);
  assert.equal(v.verdict, "VALIDATED");
  assert.equal(v.selected_rung_index, 0);
});

test("test_ladder_full_climb_to_deep_passes", () => {
  const m = clone(VALIDATED) as any;
  m.ladder.selected_model_rung = "deep";
  m.ladder.rungs_evaluated = ["majority_heuristic", "linear",
                              "boosted_trees", "deep"];
  const v = evaluate(m);
  assert.equal(v.verdict, "VALIDATED");
  assert.equal(v.selected_rung_index, 3);
});

test("test_unknown_selected_rung_fails_and_index_is_none", () => {
  const m = clone(VALIDATED) as any;
  m.ladder.selected_model_rung = "transformer";
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_VALIDATED");
  assert.equal(v.selected_rung_index, null);
});

test("test_missing_ladder_record_is_missing", () => {
  const m = clone(VALIDATED) as any;
  delete m.ladder.rungs_evaluated;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "ladder_climbed_in_order"), "missing");
  assert.equal(v.selected_rung_index, 2);
});

test("test_empty_rungs_evaluated_is_missing", () => {
  const m = clone(VALIDATED) as any;
  m.ladder.rungs_evaluated = [];
  assert.equal(evaluate(m).verdict, "INSUFFICIENT_EVIDENCE");
});

test("test_accuracy_only_on_high_stakes_fails_red_line", () => {
  const m = clone(VALIDATED) as any;
  m.evaluation.accuracy_only_reporting = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_VALIDATED");
  assert.equal(v.sections["evaluation_and_honesty"], "fail");
});

test("test_accuracy_only_passes_as_not_applicable_when_low_stakes", () => {
  const m = clone(VALIDATED) as any;
  m.evaluation.imbalanced_or_high_stakes = false;
  delete m.evaluation.accuracy_only_reporting;
  assert.equal(evaluate(m).verdict, "VALIDATED");
});

test("test_accuracy_only_missing_evidence_when_high_stakes", () => {
  const m = clone(VALIDATED) as any;
  delete m.evaluation.accuracy_only_reporting;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(
    checkStatus(v, "no_accuracy_only_reporting_where_it_matters"),
    "missing");
});

test("test_slice_performance_not_reported_fails", () => {
  const m = clone(VALIDATED) as any;
  m.evaluation.slice_performance_reported = false;
  assert.equal(evaluate(m).verdict, "NOT_VALIDATED");
});

test("test_calibration_not_reported_fails", () => {
  const m = clone(VALIDATED) as any;
  m.evaluation.calibration_reported = false;
  assert.equal(evaluate(m).verdict, "NOT_VALIDATED");
});

test("test_cherry_picked_examples_fail", () => {
  const m = clone(VALIDATED) as any;
  m.robustness.cherry_picked_examples_presented = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_VALIDATED");
  assert.equal(v.sections["robustness_and_limits"], "fail");
});

test("test_claims_beyond_measured_capability_fail_red_line", () => {
  const m = clone(VALIDATED) as any;
  m.robustness.claims_exceed_measured_capability = true;
  assert.equal(evaluate(m).verdict, "NOT_VALIDATED");
});

test("test_failure_modes_not_documented_fails", () => {
  const m = clone(VALIDATED) as any;
  m.robustness.known_failure_modes_documented = false;
  assert.equal(evaluate(m).verdict, "NOT_VALIDATED");
});

test("test_no_rollback_path_fails", () => {
  const m = clone(VALIDATED) as any;
  m.deployment.rollback_path_defined = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_VALIDATED");
  assert.equal(v.sections["deployment_monitoring_and_card"], "fail");
});

test("test_no_monitoring_plan_fails", () => {
  const m = clone(VALIDATED) as any;
  m.deployment.drift_monitoring_planned = false;
  assert.equal(evaluate(m).verdict, "NOT_VALIDATED");
});

test("test_model_card_not_written_fails", () => {
  const m = clone(VALIDATED) as any;
  m.documentation.model_card_written_and_versioned = false;
  assert.equal(evaluate(m).verdict, "NOT_VALIDATED");
});

test("test_absent_evidence_is_insufficient_not_failed", () => {
  const m = clone(VALIDATED) as any;
  delete m.deployment;
  delete m.documentation;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(
    v.sections["deployment_monitoring_and_card"], "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.baseline_status, null);
  assert.equal(v.baseline_improvement, null);
  assert.equal(v.selected_rung_index, null);
  assert.equal(v.checks.length, 35);
});

test("test_stamp_names_the_verdict", () => {
  const v = evaluate(clone(VALIDATED));
  const s = stamp(v);
  assert.ok(s.includes("VERDICT: VALIDATED"));
  assert.ok(s.includes("model: churn intervention ranker v3"));
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
// MalformedTypeTests, ported.

function fieldError(field: string) {
  return (err: unknown) =>
    err instanceof FieldTypeError && err.field === field;
}

test("malformed: top-level string field as number rejected", () => {
  const m = clone(VALIDATED) as any;
  m.model = 12345;
  assert.throws(() => evaluate(m), fieldError("model"));
});

test("malformed: section as string rejected", () => {
  assert.throws(
    () => evaluate({ baseline: "should-be-an-object" }),
    fieldError("baseline"),
  );
});

test("malformed: list field as string rejected", () => {
  const m = clone(VALIDATED) as any;
  m.ladder.rungs_evaluated = "linear";
  assert.throws(() => evaluate(m), fieldError("ladder.rungs_evaluated"));
});

test("malformed: list entry as number rejected", () => {
  const m = clone(VALIDATED) as any;
  m.ladder.rungs_evaluated = ["majority_heuristic", 42];
  assert.throws(
    () => evaluate(m),
    fieldError("ladder.rungs_evaluated[1]"),
  );
});

test("malformed: boolean leaf as string rejected", () => {
  const m = clone(VALIDATED) as any;
  m.validation.temporal_data = "yes";
  assert.throws(() => evaluate(m), fieldError("validation.temporal_data"));
});

test("malformed: numeric leaf as string rejected", () => {
  const m = clone(VALIDATED) as any;
  m.baseline.model_score = "low";
  assert.throws(() => evaluate(m), fieldError("baseline.model_score"));
});

test("malformed: null section rejected", () => {
  const m = clone(VALIDATED) as any;
  m.evaluation = null;
  assert.throws(() => evaluate(m), fieldError("evaluation"));
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
  .filter((f) => f.startsWith("applied-ml-validation--") && f.endsWith(".json"))
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
