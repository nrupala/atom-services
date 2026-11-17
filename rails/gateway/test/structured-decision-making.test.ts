import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/structured-decision-making.js";
import { FieldTypeError } from "../src/atoms/validate.js";

const COMPLETE: Record<string, unknown> = {
  decision: "choose deployment route",
  framing: { decision_restated_crisp: true,
             decide_by_date_stated: true,
             constraints_named: true,
             out_of_scope_named: true,
             classification: "irreversible",
             stakes_assessed: true,
             effort_budget_matched_to_stakes_and_reversibility: true,
             slowed_deliberation_declared: true },
  options: [
    { name: "full rollout", kind: "action",
      scores: [{ criterion: "cost", score: 4 },
               { criterion: "risk", score: 3 },
               { criterion: "time-to-value", score: 5 }],
      declared_weighted_total: 7.5 },
    { name: "do nothing", kind: "status_quo",
      scores: [{ criterion: "cost", score: 5 },
               { criterion: "risk", score: 2 },
               { criterion: "time-to-value", score: 1 }],
      declared_weighted_total: 5.0 },
    { name: "pilot one site", kind: "smaller_reversible_step",
      scores: [{ criterion: "cost", score: 3 },
               { criterion: "risk", score: 4 },
               { criterion: "time-to-value", score: 3 }],
      declared_weighted_total: 7.0 },
  ],
  criteria: [
    { name: "cost", weight: 0.5, defined_before_scoring: true },
    { name: "risk", weight: 1.0, defined_before_scoring: true },
    { name: "time-to-value", weight: 0.5, defined_before_scoring: true },
  ],
  evaluation: { method: "decision_matrix",
                score_scale_min: 0, score_scale_max: 5,
                probabilities_estimable: false,
                expected_value_used: false,
                scenario_thinking_used: true,
                uncertainty_flagged: true,
                base_rates_considered: true },
  premortem: { decision_is_material: true, conducted: true,
               failure_reasons_named: true,
               top_reasons_fixed_or_hedged: true },
  log: { choice_recorded: true, chosen_option: "pilot one site",
         rationale_recorded: true, assumptions_recorded: true,
         communicated_with_why: true },
  review: { review_date_set: true,
            outcomes_vs_expectations_review_planned: true,
            luck_separated_from_process_declared: true },
  red_lines: { decision_without_options_present: false,
               criteria_invented_after_scores_present: false,
               irreversible_decision_rushed_present: false,
               irreversible_decision_made_in_mood_present: false },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function checkStatus(v: ReturnType<typeof evaluate>, name: string) {
  return v.checks.find((c) => c.check === name)?.status;
}

test("test_complete_manifest_is_sound", () => {
  const v = evaluate(clone(COMPLETE));
  assert.equal(v.verdict, "DECISION_RECORD_SOUND");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.checks.length, 46);
  assert.equal(v.computed_status, "within_stated_limits_on_declared_evidence");
  assert.equal(v.options_count, 3);
  assert.equal(v.criteria_count, 3);
  assert.deepEqual(v.duplicate_option_names, []);
  assert.deepEqual(v.duplicate_criterion_names, []);
  assert.equal(v.criteria_weights_sum, "2.000000");
  assert.deepEqual(v.recomputed_weighted_totals, [
    { option: "full rollout", recomputed_weighted_total: "7.500000" },
    { option: "do nothing", recomputed_weighted_total: "5.000000" },
    { option: "pilot one site", recomputed_weighted_total: "7.000000" },
  ]);
  assert.deepEqual(v.options_with_weighted_total_mismatch, []);
  assert.deepEqual(v.options_without_complete_scores, []);
  assert.equal(v.score_coverage_ratio, "1.000000");
  assert.equal(v.weighted_total_match_ratio, "1.000000");
  assert.equal(v.chosen_option, "pilot one site");
});

test("test_chosen_option_need_not_have_highest_total", () => {
  const v = evaluate(clone(COMPLETE));
  assert.equal(checkStatus(v, "structured_logged_chosen_option_matches_a_declared_option"), "pass");
  assert.equal(v.verdict, "DECISION_RECORD_SOUND");
});

test("test_framing_not_crisp_fails", () => {
  const m = clone(COMPLETE) as any;
  m.framing.decision_restated_crisp = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "DECISION_RECORD_NOT_SOUND");
  assert.equal(v.sections["structured_framing"], "fail");
  assert.equal(checkStatus(v, "structured_framing_decision_restated_crisp"), "fail");
});

test("test_unknown_classification_fails", () => {
  const m = clone(COMPLETE) as any;
  m.framing.classification = "one-way";
  assert.equal(checkStatus(evaluate(m), "structured_classification_is_reversible_or_irreversible"), "fail");
});

test("test_irreversible_without_slowed_deliberation_fails", () => {
  const m = clone(COMPLETE) as any;
  m.framing.slowed_deliberation_declared = false;
  assert.equal(checkStatus(evaluate(m), "structured_slowed_deliberation_when_irreversible"), "fail");
});

test("test_reversible_slowed_deliberation_not_applicable", () => {
  const m = clone(COMPLETE) as any;
  m.framing.classification = "reversible";
  delete m.framing.slowed_deliberation_declared;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "structured_slowed_deliberation_when_irreversible"), "pass");
  assert.equal(v.verdict, "DECISION_RECORD_SOUND");
});

test("test_two_options_fail_at_least_three", () => {
  const m = clone(COMPLETE) as any;
  m.options = m.options.slice(0, 2);
  m.log.chosen_option = "full rollout";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "structured_options_list_declares_at_least_three"), "fail");
  assert.equal(v.options_count, 2);
});

test("test_absent_options_list_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.options;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "structured_options_list_declares_at_least_three"), "missing");
  assert.equal(v.computed_status, null);
  assert.equal(v.options_count, null);
  assert.equal(v.duplicate_option_names, null);
  assert.equal(v.recomputed_weighted_totals, null);
  assert.equal(v.options_with_weighted_total_mismatch, null);
  assert.equal(v.options_without_complete_scores, null);
  assert.equal(v.score_coverage_ratio, null);
  assert.equal(v.weighted_total_match_ratio, null);
});

test("test_empty_options_list_fails", () => {
  const m = clone(COMPLETE) as any;
  m.options = [];
  const v = evaluate(m);
  assert.equal(v.verdict, "DECISION_RECORD_NOT_SOUND");
  assert.equal(checkStatus(v, "structured_options_list_declares_at_least_three"), "fail");
  assert.equal(v.options_count, 0);
});

test("test_duplicate_option_name_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.options[2].name = "full rollout";
  m.log.chosen_option = "full rollout";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "structured_option_names_are_unique"), "fail");
  assert.deepEqual(v.duplicate_option_names, ["full rollout"]);
});

test("test_option_missing_name_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.options[0].name;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "structured_every_option_row_names_the_option"), "missing");
});

test("test_option_empty_name_fails", () => {
  const m = clone(COMPLETE) as any;
  m.options[0].name = "";
  assert.equal(checkStatus(evaluate(m), "structured_every_option_row_names_the_option"), "fail");
});

test("test_unknown_option_kind_fails", () => {
  const m = clone(COMPLETE) as any;
  m.options[0].kind = "gamble";
  assert.equal(checkStatus(evaluate(m), "structured_every_option_kind_is_recognised"), "fail");
});

test("test_no_status_quo_row_fails", () => {
  const m = clone(COMPLETE) as any;
  m.options[1].kind = "action";
  assert.equal(checkStatus(evaluate(m), "structured_options_include_a_status_quo_row"), "fail");
});

test("test_no_smaller_reversible_step_row_fails", () => {
  const m = clone(COMPLETE) as any;
  m.options[2].kind = "action";
  assert.equal(checkStatus(evaluate(m), "structured_options_include_a_smaller_reversible_step_row"), "fail");
});

test("test_absent_criteria_list_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.criteria;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.criteria_count, null);
  assert.equal(v.criteria_weights_sum, null);
  assert.equal(v.recomputed_weighted_totals, null);
});

test("test_empty_criteria_list_fails", () => {
  const m = clone(COMPLETE) as any;
  m.criteria = [];
  const v = evaluate(m);
  assert.equal(checkStatus(v, "structured_criteria_list_is_declared"), "fail");
  assert.equal(v.criteria_count, 0);
  assert.equal(v.criteria_weights_sum, null);
});

test("test_duplicate_criterion_name_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.criteria[2].name = "cost";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "structured_criterion_names_are_unique"), "fail");
  assert.deepEqual(v.duplicate_criterion_names, ["cost"]);
});

test("test_negative_weight_fails", () => {
  const m = clone(COMPLETE) as any;
  m.criteria[0].weight = -0.5;
  assert.equal(checkStatus(evaluate(m), "structured_every_criterion_weight_is_nonnegative"), "fail");
});

test("test_zero_weight_sum_fails", () => {
  const m = clone(COMPLETE) as any;
  for (const c of m.criteria) c.weight = 0;
  for (const o of m.options) o.declared_weighted_total = 0;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "structured_criteria_weights_sum_is_positive"), "fail");
  assert.equal(v.criteria_weights_sum, "0.000000");
});

test("test_criterion_not_defined_before_scoring_fails", () => {
  const m = clone(COMPLETE) as any;
  m.criteria[1].defined_before_scoring = false;
  assert.equal(checkStatus(evaluate(m), "structured_every_criterion_defined_before_scoring"), "fail");
});

test("test_option_missing_a_criterion_score_fails_coverage", () => {
  const m = clone(COMPLETE) as any;
  m.options[0].scores = m.options[0].scores.slice(0, 2);
  const v = evaluate(m);
  assert.equal(checkStatus(v, "structured_every_option_scores_every_declared_criterion"), "fail");
  assert.deepEqual(v.options_without_complete_scores, ["full rollout"]);
  assert.equal(v.score_coverage_ratio, "0.666667");
});

test("test_option_scoring_undeclared_criterion_fails", () => {
  const m = clone(COMPLETE) as any;
  m.options[0].scores.push({ criterion: "vibes", score: 5 });
  assert.equal(checkStatus(evaluate(m), "structured_no_option_scores_an_undeclared_criterion"), "fail");
});

test("test_option_scoring_criterion_twice_fails", () => {
  const m = clone(COMPLETE) as any;
  m.options[0].scores.push({ criterion: "cost", score: 1 });
  assert.equal(checkStatus(evaluate(m), "structured_no_option_scores_a_criterion_twice"), "fail");
});

test("test_score_outside_declared_scale_fails", () => {
  const m = clone(COMPLETE) as any;
  m.options[0].scores[0].score = 6;
  m.options[0].declared_weighted_total = 8.5;
  assert.equal(checkStatus(evaluate(m), "structured_every_score_lies_within_the_declared_scale"), "fail");
});

test("test_incoherent_scale_bounds_fail", () => {
  const m = clone(COMPLETE) as any;
  m.evaluation.score_scale_min = 5;
  m.evaluation.score_scale_max = 0;
  assert.equal(checkStatus(evaluate(m), "structured_score_scale_bounds_are_coherent"), "fail");
});

test("test_absent_scale_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.evaluation.score_scale_max;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "structured_every_score_lies_within_the_declared_scale"), "missing");
});

test("test_weighted_total_mismatch_fails_and_option_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.options[1].declared_weighted_total = 5.5;
  const v = evaluate(m);
  assert.equal(v.verdict, "DECISION_RECORD_NOT_SOUND");
  assert.equal(checkStatus(v, "structured_every_declared_weighted_total_recomputes"), "fail");
  assert.deepEqual(v.options_with_weighted_total_mismatch, ["do nothing"]);
  assert.equal(v.weighted_total_match_ratio, "0.666667");
  assert.equal(v.computed_status, "outside_stated_limits_on_declared_evidence");
});

test("test_weighted_total_within_6dp_serialization_passes", () => {
  const m = clone(COMPLETE) as any;
  m.criteria[0].weight = 0.1;
  m.criteria[1].weight = 0.2;
  m.criteria[2].weight = 0.3;
  m.options[0].declared_weighted_total = 2.5;
  m.options[1].declared_weighted_total = 1.2;
  m.options[2].declared_weighted_total = 2.0;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "structured_every_declared_weighted_total_recomputes"), "pass");
  assert.equal(v.criteria_weights_sum, "0.600000");
});

test("test_unknown_evaluation_method_fails", () => {
  const m = clone(COMPLETE) as any;
  m.evaluation.method = "coin_flip";
  assert.equal(checkStatus(evaluate(m), "structured_evaluation_method_is_recognised"), "fail");
});

test("test_expected_value_required_when_estimable", () => {
  const m = clone(COMPLETE) as any;
  m.evaluation.probabilities_estimable = true;
  m.evaluation.expected_value_used = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "structured_expected_value_used_when_probabilities_estimable"), "fail");
  assert.equal(checkStatus(v, "structured_scenario_thinking_used_when_probabilities_not_estimable"), "pass");
});

test("test_scenario_required_when_not_estimable", () => {
  const m = clone(COMPLETE) as any;
  m.evaluation.scenario_thinking_used = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "structured_scenario_thinking_used_when_probabilities_not_estimable"), "fail");
  assert.equal(checkStatus(v, "structured_expected_value_used_when_probabilities_estimable"), "pass");
});

test("test_uncertainty_not_flagged_fails", () => {
  const m = clone(COMPLETE) as any;
  m.evaluation.uncertainty_flagged = false;
  assert.equal(evaluate(m).sections["structured_evaluation_and_uncertainty"], "fail");
});

test("test_premortem_required_when_material", () => {
  const m = clone(COMPLETE) as any;
  m.premortem.conducted = false;
  assert.equal(checkStatus(evaluate(m), "structured_premortem_conducted_when_decision_is_material"), "fail");
});

test("test_premortem_not_applicable_when_not_material", () => {
  const m = clone(COMPLETE) as any;
  m.premortem = { decision_is_material: false };
  const v = evaluate(m);
  assert.equal(v.sections["structured_pre_mortem"], "pass");
  assert.equal(v.verdict, "DECISION_RECORD_SOUND");
});

test("test_premortem_gate_absent_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.premortem.decision_is_material;
  assert.equal(checkStatus(evaluate(m), "structured_premortem_conducted_when_decision_is_material"), "missing");
});

test("test_chosen_option_not_declared_fails", () => {
  const m = clone(COMPLETE) as any;
  m.log.chosen_option = "secret fourth option";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "structured_logged_chosen_option_matches_a_declared_option"), "fail");
  assert.equal(v.chosen_option, "secret fourth option");
});

test("test_absent_chosen_option_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.log.chosen_option;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.chosen_option, null);
});

test("test_review_date_not_set_fails", () => {
  const m = clone(COMPLETE) as any;
  m.review.review_date_set = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "structured_review_date_is_set"), "fail");
  assert.equal(v.sections["structured_commit_log_and_review"], "fail");
});

test("test_criteria_invented_after_scores_fails_red_lines", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.criteria_invented_after_scores_present = true;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "structured_record_free_of_criteria_invented_after_scores"), "fail");
  assert.equal(v.sections["structured_red_lines"], "fail");
  assert.equal(v.verdict, "DECISION_RECORD_NOT_SOUND");
});

test("test_irreversible_rushed_fails_red_lines", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.irreversible_decision_rushed_present = true;
  assert.equal(checkStatus(evaluate(m), "structured_record_free_of_irreversible_decision_rushed"), "fail");
});

test("test_decision_without_options_fails_red_lines", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.decision_without_options_present = true;
  assert.equal(checkStatus(evaluate(m), "structured_record_free_of_decision_without_options"), "fail");
});

test("test_absent_evidence_is_insufficient_not_failed", () => {
  const m = clone(COMPLETE) as any;
  delete m.review;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["structured_commit_log_and_review"], "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.ok(v.checks.every((c) => c.status === "missing"));
  assert.equal(v.computed_status, null);
  assert.equal(v.options_count, null);
  assert.equal(v.criteria_count, null);
  assert.equal(v.duplicate_option_names, null);
  assert.equal(v.duplicate_criterion_names, null);
  assert.equal(v.criteria_weights_sum, null);
  assert.equal(v.recomputed_weighted_totals, null);
  assert.equal(v.options_with_weighted_total_mismatch, null);
  assert.equal(v.options_without_complete_scores, null);
  assert.equal(v.score_coverage_ratio, null);
  assert.equal(v.weighted_total_match_ratio, null);
  assert.equal(v.chosen_option, null);
});

test("test_stamp_names_the_verdict", () => {
  assert.ok(stamp(evaluate(clone(COMPLETE))).includes("VERDICT: DECISION_RECORD_SOUND"));
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
  m.decision = 12345;
  assert.throws(() => evaluate(m), fieldError("decision"));
});

test("malformed: object section as string rejected", () => {
  assert.throws(() => evaluate({ framing: "should-be-an-object" }), fieldError("framing"));
});

test("malformed: list field as object rejected", () => {
  assert.throws(() => evaluate({ options: { name: "x" } }), fieldError("options"));
});

test("malformed: list entry as string rejected", () => {
  assert.throws(() => evaluate({ options: ["full rollout"] }), fieldError("options[0]"));
});

test("malformed: boolean leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.premortem.conducted = "yes";
  assert.throws(() => evaluate(m), fieldError("premortem.conducted"));
});

test("malformed: number leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.criteria[0].weight = "0.5";
  assert.throws(() => evaluate(m), fieldError("criteria[0].weight"));
});

test("malformed: number leaf as boolean rejected", () => {
  const m = clone(COMPLETE) as any;
  m.options[0].scores[0].score = true;
  assert.throws(() => evaluate(m), fieldError("options[0].scores[0].score"));
});

test("malformed: nested list entry string field rejected", () => {
  const m = clone(COMPLETE) as any;
  m.options[1].kind = 42;
  assert.throws(() => evaluate(m), fieldError("options[1].kind"));
});

test("malformed: null section rejected", () => {
  const m = clone(COMPLETE) as any;
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
  .filter((f) => f.startsWith("structured-decision-making--") && f.endsWith(".json"))
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
