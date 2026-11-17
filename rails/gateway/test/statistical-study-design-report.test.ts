import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/statistical-study-design-report.js";
import { FieldTypeError } from "../src/atoms/validate.js";

const COMPLETE: Record<string, unknown> = {
  study_title: "widget-retention-two-arm-study",
  framing: { decision_stated: true,
             research_question_stated: true,
             outcome_defined: true,
             unit_of_analysis_defined: true,
             population_defined: true,
             timeframe_defined: true },
  design: { design_type: "randomized_experiment",
            assignment_mechanism_stated: true,
            estimand_stated: true,
            confounders_identified: true },
  variables: [
    { variable_id: "retention-30d", role: "outcome" },
    { variable_id: "arm", role: "exposure" },
    { variable_id: "age", role: "covariate" },
    { variable_id: "baseline-usage", role: "confounder" },
  ],
  sampling: { sampling_frame_defined: true,
              sampling_method_stated: true,
              inclusion_exclusion_criteria_stated: true,
              power_analysis_done_before_collection: true,
              declared_total_sample_size: 200,
              declared_alpha: 0.05,
              declared_target_power: 0.8,
              declared_effect_size: 0.4 },
  groups: [
    { group_id: "control", declared_size: 100 },
    { group_id: "treatment", declared_size: 100 },
  ],
  analysis: { plan_written_before_collection: true,
              plan_preregistered: true,
              primary_method_named: true,
              assumption_checks_planned: true,
              effect_size_with_uncertainty_planned: true,
              multiple_comparison_discipline_planned: true,
              deviations_logging_planned: true },
  validation: { sensitivity_analyses_planned: true,
                robustness_checks_planned: true,
                leakage_audit_planned: true,
                limitations_section_planned: true,
                what_would_change_conclusion_stated: true },
  delivery: { executive_summary_planned: true,
              methods_memo_planned: true,
              reproducible_appendix_planned: true,
              pipeline_sealed_for_rerun: true },
  red_lines: {
    significance_without_effect_size_and_uncertainty_present: false,
    p_hacking_or_selective_reporting_present: false,
    causal_language_from_observational_without_design_present: false,
    unredacted_pii_or_unapproved_reuse_present: false,
    outcome_guarantee_present: false },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function checkStatus(v: ReturnType<typeof evaluate>, name: string) {
  return v.checks.find((c) => c.check === name)?.status;
}

test("test_complete_manifest_is_ready", () => {
  const v = evaluate(clone(COMPLETE));
  assert.equal(v.verdict, "STUDY_DESIGN_READY");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.checks.length, 46);
  assert.equal(v.computed_status, "within_stated_limits_on_declared_evidence");
  assert.equal(v.variables_count, 4);
  assert.equal(v.outcome_variable_count, 1);
  assert.deepEqual(v.duplicate_variable_ids, []);
  assert.deepEqual(v.variables_with_unrecognised_role, []);
  assert.equal(v.groups_count, 2);
  assert.deepEqual(v.duplicate_group_ids, []);
  assert.equal(v.computed_total_sample_size, 200);
  assert.equal(v.declared_total_sample_size, 200);
  assert.equal(v.total_sample_size_difference, 0);
  assert.equal(v.largest_group_share, "0.500000");
  assert.equal(v.declared_alpha, 0.05);
  assert.equal(v.declared_target_power, 0.8);
  assert.equal(v.declared_effect_size, 0.4);
});

test("test_decision_not_stated_fails_framing", () => {
  const m = clone(COMPLETE) as any;
  m.framing.decision_stated = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "STUDY_DESIGN_NOT_READY");
  assert.equal(v.sections["decision_framing"], "fail");
  assert.equal(checkStatus(v, "study_design_decision_stated_before_design"), "fail");
});

test("test_unrecognised_design_type_fails", () => {
  const m = clone(COMPLETE) as any;
  m.design.design_type = "anecdotal";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "study_design_type_recognised"), "fail");
  assert.equal(v.computed_status, "outside_stated_limits_on_declared_evidence");
});

test("test_absent_design_type_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.design.design_type;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "study_design_type_recognised"), "missing");
});

test("test_observational_design_type_passes", () => {
  const m = clone(COMPLETE) as any;
  m.design.design_type = "observational";
  assert.equal(checkStatus(evaluate(m), "study_design_type_recognised"), "pass");
});

test("test_duplicate_variable_id_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.variables[1].variable_id = "retention-30d";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "study_design_every_variable_id_unique"), "fail");
  assert.deepEqual(v.duplicate_variable_ids, ["retention-30d"]);
});

test("test_unrecognised_role_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.variables[2].role = "vibes";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "study_design_every_variable_role_recognised"), "fail");
  assert.deepEqual(v.variables_with_unrecognised_role, ["age"]);
});

test("test_no_outcome_variable_fails", () => {
  const m = clone(COMPLETE) as any;
  m.variables[0].role = "predictor";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "study_design_at_least_one_outcome_variable_declared"), "fail");
  assert.equal(v.outcome_variable_count, 0);
});

test("test_variable_missing_role_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.variables[1].role;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "study_design_every_variable_role_recognised"), "missing");
});

test("test_absent_variables_list_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.variables;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "study_design_variables_list_declared"), "missing");
  assert.equal(v.variables_count, null);
  assert.equal(v.duplicate_variable_ids, null);
  assert.equal(v.variables_with_unrecognised_role, null);
  assert.equal(v.outcome_variable_count, null);
});

test("test_empty_variables_list_fails", () => {
  const m = clone(COMPLETE) as any;
  m.variables = [];
  const v = evaluate(m);
  assert.equal(checkStatus(v, "study_design_variables_list_declared"), "fail");
  assert.equal(v.variables_count, 0);
});

test("test_total_mismatch_fails_and_difference_reported", () => {
  const m = clone(COMPLETE) as any;
  m.sampling.declared_total_sample_size = 210;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "study_design_total_sample_size_matches_group_sum"), "fail");
  assert.equal(v.total_sample_size_difference, 10);
  assert.equal(v.computed_status, "outside_stated_limits_on_declared_evidence");
});

test("test_absent_total_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.sampling.declared_total_sample_size;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "study_design_total_sample_size_matches_group_sum"), "missing");
  assert.equal(v.total_sample_size_difference, null);
});

test("test_duplicate_group_id_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.groups[1].group_id = "control";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "study_design_every_group_id_unique"), "fail");
  assert.deepEqual(v.duplicate_group_ids, ["control"]);
});

test("test_zero_group_size_fails", () => {
  const m = clone(COMPLETE) as any;
  m.groups[0].declared_size = 0;
  m.sampling.declared_total_sample_size = 100;
  assert.equal(checkStatus(evaluate(m), "study_design_every_group_size_positive_whole"), "fail");
});

test("test_fractional_group_size_fails", () => {
  const m = clone(COMPLETE) as any;
  m.groups[0].declared_size = 99.5;
  assert.equal(checkStatus(evaluate(m), "study_design_every_group_size_positive_whole"), "fail");
});

test("test_group_missing_size_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.groups[0].declared_size;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "study_design_every_group_size_positive_whole"), "missing");
  assert.equal(v.computed_total_sample_size, null);
});

test("test_alpha_out_of_range_fails", () => {
  for (const bad of [0, 1, 1.5, -0.1]) {
    const m = clone(COMPLETE) as any;
    m.sampling.declared_alpha = bad;
    assert.equal(checkStatus(evaluate(m), "study_design_alpha_in_valid_probability_range"), "fail");
  }
});

test("test_power_out_of_range_fails", () => {
  const m = clone(COMPLETE) as any;
  m.sampling.declared_target_power = 1.0;
  assert.equal(checkStatus(evaluate(m), "study_design_target_power_in_valid_probability_range"), "fail");
});

test("test_low_power_is_reported_not_failed", () => {
  const m = clone(COMPLETE) as any;
  m.sampling.declared_target_power = 0.2;
  const v = evaluate(m);
  assert.equal(v.verdict, "STUDY_DESIGN_READY");
  assert.equal(v.declared_target_power, 0.2);
});

test("test_zero_effect_size_fails", () => {
  const m = clone(COMPLETE) as any;
  m.sampling.declared_effect_size = 0;
  assert.equal(checkStatus(evaluate(m), "study_design_effect_size_nonzero"), "fail");
});

test("test_negative_effect_size_passes_nonzero", () => {
  const m = clone(COMPLETE) as any;
  m.sampling.declared_effect_size = -0.4;
  assert.equal(checkStatus(evaluate(m), "study_design_effect_size_nonzero"), "pass");
});

test("test_power_analysis_after_collection_fails", () => {
  const m = clone(COMPLETE) as any;
  m.sampling.power_analysis_done_before_collection = false;
  assert.equal(evaluate(m).sections["sampling_and_power"], "fail");
});

test("test_unpreregistered_plan_fails", () => {
  const m = clone(COMPLETE) as any;
  m.analysis.plan_preregistered = false;
  const v = evaluate(m);
  assert.equal(v.sections["analysis_plan"], "fail");
  assert.equal(checkStatus(v, "study_design_analysis_plan_preregistered"), "fail");
});

test("test_bare_p_value_plan_fails", () => {
  const m = clone(COMPLETE) as any;
  m.analysis.effect_size_with_uncertainty_planned = false;
  assert.equal(checkStatus(evaluate(m), "study_design_effect_size_with_uncertainty_planned"), "fail");
});

test("test_no_sensitivity_fails_validation", () => {
  const m = clone(COMPLETE) as any;
  m.validation.sensitivity_analyses_planned = false;
  assert.equal(evaluate(m).sections["validation_and_bias_controls"], "fail");
});

test("test_no_reproducible_appendix_fails_delivery", () => {
  const m = clone(COMPLETE) as any;
  m.delivery.reproducible_appendix_planned = false;
  assert.equal(evaluate(m).sections["delivery_and_reproducibility"], "fail");
});

test("test_p_hacking_fails_red_lines", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.p_hacking_or_selective_reporting_present = true;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "study_design_free_of_p_hacking_or_selective_reporting"), "fail");
  assert.equal(v.sections["red_lines"], "fail");
  assert.equal(v.verdict, "STUDY_DESIGN_NOT_READY");
});

test("test_causal_language_fails_red_lines", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.causal_language_from_observational_without_design_present = true;
  assert.equal(checkStatus(evaluate(m), "study_design_free_of_unsupported_causal_language"), "fail");
});

test("test_outcome_guarantee_fails_red_lines", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.outcome_guarantee_present = true;
  assert.equal(checkStatus(evaluate(m), "study_design_free_of_outcome_guarantees"), "fail");
});

test("test_absent_evidence_is_insufficient_not_failed", () => {
  const m = clone(COMPLETE) as any;
  delete m.analysis;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["analysis_plan"], "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.ok(v.checks.every((c) => c.status === "missing"));
  assert.equal(v.computed_status, null);
  assert.equal(v.variables_count, null);
  assert.equal(v.groups_count, null);
  assert.equal(v.computed_total_sample_size, null);
  assert.equal(v.declared_total_sample_size, null);
  assert.equal(v.largest_group_share, null);
  assert.equal(v.declared_alpha, null);
});

test("test_stamp_names_the_verdict", () => {
  assert.ok(stamp(evaluate(clone(COMPLETE))).includes("VERDICT: STUDY_DESIGN_READY"));
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
  m.study_title = 12345;
  assert.throws(() => evaluate(m), fieldError("study_title"));
});

test("malformed: object section as string rejected", () => {
  assert.throws(() => evaluate({ framing: "should-be-an-object" }), fieldError("framing"));
});

test("malformed: list field as object rejected", () => {
  assert.throws(() => evaluate({ variables: { variable_id: "x" } }), fieldError("variables"));
});

test("malformed: list entry as string rejected", () => {
  assert.throws(() => evaluate({ groups: ["control"] }), fieldError("groups[0]"));
});

test("malformed: boolean leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.analysis.plan_preregistered = "yes";
  assert.throws(() => evaluate(m), fieldError("analysis.plan_preregistered"));
});

test("malformed: number leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.sampling.declared_alpha = "0.05";
  assert.throws(() => evaluate(m), fieldError("sampling.declared_alpha"));
});

test("malformed: number leaf as boolean rejected", () => {
  const m = clone(COMPLETE) as any;
  m.groups[0].declared_size = true;
  assert.throws(() => evaluate(m), fieldError("groups[0].declared_size"));
});

test("malformed: nested list entry string field rejected", () => {
  const m = clone(COMPLETE) as any;
  m.variables[1].role = 42;
  assert.throws(() => evaluate(m), fieldError("variables[1].role"));
});

test("malformed: null section rejected", () => {
  const m = clone(COMPLETE) as any;
  m.delivery = null;
  assert.throws(() => evaluate(m), fieldError("delivery"));
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
  .filter((f) => f.startsWith("statistical-study-design-report--") && f.endsWith(".json"))
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
