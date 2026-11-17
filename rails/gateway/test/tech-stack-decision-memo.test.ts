import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/tech-stack-decision-memo.js";
import { FieldTypeError } from "../src/atoms/validate.js";

const COMPLETE: Record<string, unknown> = {
  memo_title: "dashboard-stack-memo",
  context: { hard_constraints_declared: true,
             security_model_constraint_addressed: true,
             regulatory_constraint_addressed: true,
             performance_constraint_addressed: true,
             offline_constraint_addressed: true,
             access_patterns_declared: true,
             usage_patterns_declared: true,
             team_operability_context_declared: true,
             decision_framed_as_sticky: true },
  candidate_work: {
    candidates_compared_against_same_hard_constraints: true,
    boring_technology_bias_addressed: true,
    novelty_budget_allocation_declared: true,
    novelty_spend_tied_to_differentiation_declared: true },
  candidates: [
    { candidate_id: "cand-1", stack_name: "Proven relational stack",
      novelty_classification: "proven",
      evidence_note: "Operability notes recorded",
      scores: [{ criterion_id: "crit-1", score: 4 },
               { criterion_id: "crit-2", score: 5 },
               { criterion_id: "crit-3", score: 3 }],
      weighted_total_declared: 26 },
    { candidate_id: "cand-2", stack_name: "Novel edge stack",
      novelty_classification: "novel",
      evidence_note: "Prototype notes recorded",
      scores: [{ criterion_id: "crit-1", score: 3 },
               { criterion_id: "crit-2", score: 4 },
               { criterion_id: "crit-3", score: 2 }],
      weighted_total_declared: 20 },
  ],
  evaluation: { evidence_basis_recorded: true,
                evaluation_applied_consistently_across_candidates: true },
  criteria: [
    { criterion_id: "crit-1", criterion_name: "Operability fit", weight: 2 },
    { criterion_id: "crit-2", criterion_name: "Constraint fit", weight: 3 },
    { criterion_id: "crit-3", criterion_name: "Exit cost", weight: 1 },
  ],
  tco: { licensing_cost_addressed: true, operations_burden_addressed: true,
         learning_curve_addressed: true, lock_in_cost_addressed: true,
         operability_cost_addressed: true,
         on_call_operability_owner_declared: true,
         team_can_operate_declared_stack: true,
         free_tier_or_free_choice_used: true,
         hidden_fragility_cost_named: true },
  decision: { decision_recorded: true, chosen_candidate_id: "cand-1",
              rationale_recorded: true,
              rationale_tied_to_hard_constraints: true,
              rationale_tied_to_evaluation_criteria: true,
              tradeoffs_of_decision_recorded: true,
              declared_ranking_candidate_ids: ["cand-1", "cand-2"] },
  reversibility: { exit_cost_assessed: true, exit_path_kept: true,
                   vendor_specific_pieces_isolated_behind_interfaces: true,
                   reversibility_assessed: true },
  red_lines: { framework_of_the_week_chosen_for_novelty_present: false,
               microservices_for_solo_project_present: false,
               docker_by_default_choice_present: false,
               lock_in_with_no_exit_present: false,
               technology_chosen_to_pad_cv_present: false },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function checkStatus(v: ReturnType<typeof evaluate>, name: string) {
  return v.checks.find((c) => c.check === name)?.status;
}

test("test_complete_manifest_is_sound", () => {
  const v = evaluate(clone(COMPLETE));
  assert.equal(v.verdict, "TECH_STACK_DECISION_SOUND");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.checks.length, 51);
  assert.equal(v.computed_status, "within_stated_limits_on_declared_evidence");
  assert.equal(v.tech_stack_candidates_count, 2);
  assert.equal(v.tech_stack_criteria_count, 3);
  assert.deepEqual(v.duplicate_tech_stack_candidate_ids, []);
  assert.deepEqual(v.duplicate_tech_stack_criterion_ids, []);
  assert.equal(v.tech_stack_criteria_weights_sum, "6.000000");
  assert.equal(v.candidate_score_coverage_ratio, "1.000000");
  assert.equal(v.candidate_weighted_total_match_ratio, "1.000000");
  assert.equal(v.candidate_evidence_note_ratio, "1.000000");
});

test("test_hard_constraints_not_declared_fails_section1", () => {
  const m = clone(COMPLETE) as any;
  m.context.hard_constraints_declared = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "TECH_STACK_DECISION_NOT_SOUND");
  assert.equal(v.sections["context_and_constraints"], "fail");
  assert.equal(checkStatus(v, "tech_stack_memo_hard_constraints_declared"), "fail");
});

test("test_duplicate_candidate_id_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.candidates[1].candidate_id = "cand-1";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_tech_stack_memo_candidate_id_unique"), "fail");
  assert.deepEqual(v.duplicate_tech_stack_candidate_ids, ["cand-1"]);
});

test("test_single_candidate_fails_comparison", () => {
  const m = clone(COMPLETE) as any;
  m.candidates = m.candidates.slice(0, 1);
  assert.equal(checkStatus(evaluate(m), "tech_stack_memo_candidates_list_declared"), "fail");
});

test("test_absent_candidates_list_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.candidates;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "tech_stack_memo_candidates_list_declared"), "missing");
  assert.equal(v.tech_stack_candidates_count, null);
  assert.equal(v.computed_status, null);
});

test("test_invalid_novelty_classification_fails", () => {
  const m = clone(COMPLETE) as any;
  m.candidates[0].novelty_classification = "trendy";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_tech_stack_memo_candidate_novelty_classification_recognised"), "fail");
  assert.deepEqual(v.tech_stack_candidates_with_invalid_novelty_classification, ["cand-1"]);
});

test("test_empty_evidence_note_fails", () => {
  const m = clone(COMPLETE) as any;
  m.candidates[1].evidence_note = "";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_tech_stack_memo_candidate_evidence_note_declared"), "fail");
  assert.deepEqual(v.tech_stack_candidates_without_evidence_note, ["cand-2"]);
  assert.equal(v.candidate_evidence_note_ratio, "0.500000");
});

test("test_negative_weight_fails", () => {
  const m = clone(COMPLETE) as any;
  m.criteria[0].weight = -1;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_tech_stack_memo_criterion_weight_non_negative"), "fail");
  assert.deepEqual(v.tech_stack_criteria_with_invalid_weight, ["crit-1"]);
});

test("test_zero_weight_sum_fails", () => {
  const m = clone(COMPLETE) as any;
  for (const c of m.criteria) c.weight = 0;
  for (const cand of m.candidates) cand.weighted_total_declared = 0;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "tech_stack_memo_criteria_weights_sum_positive"), "fail");
  assert.equal(v.tech_stack_criteria_weights_sum, "0.000000");
});

test("test_missing_score_fails_coverage", () => {
  const m = clone(COMPLETE) as any;
  m.candidates[0].scores = m.candidates[0].scores.slice(0, 2);
  m.candidates[0].weighted_total_declared = 23;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_tech_stack_memo_candidate_scores_every_declared_criterion"), "fail");
  assert.deepEqual(v.tech_stack_candidates_with_incomplete_or_extra_scores, ["cand-1"]);
  assert.equal(v.candidate_score_coverage_ratio, "0.500000");
});

test("test_weighted_total_mismatch_fails", () => {
  const m = clone(COMPLETE) as any;
  m.candidates[1].weighted_total_declared = 21;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_tech_stack_memo_candidate_weighted_total_recomputes"), "fail");
  assert.deepEqual(v.tech_stack_candidates_with_weighted_total_mismatch, ["cand-2"]);
  assert.equal(v.candidate_weighted_total_match_ratio, "0.500000");
});

test("test_candidate_missing_weight_field_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.criteria[0].weight;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "every_tech_stack_memo_criterion_weight_non_negative"), "missing");
});

test("test_free_choice_without_fragility_cost_fails_gated", () => {
  const m = clone(COMPLETE) as any;
  m.tco.hidden_fragility_cost_named = false;
  assert.equal(checkStatus(evaluate(m), "tech_stack_memo_hidden_fragility_cost_named_where_free_choice_used"), "fail");
});

test("test_no_free_choice_passes_gated_as_na", () => {
  const m = clone(COMPLETE) as any;
  m.tco.free_tier_or_free_choice_used = false;
  m.tco.hidden_fragility_cost_named = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "tech_stack_memo_hidden_fragility_cost_named_where_free_choice_used"), "pass");
  assert.equal(v.verdict, "TECH_STACK_DECISION_SOUND");
});

test("test_chosen_unknown_candidate_fails", () => {
  const m = clone(COMPLETE) as any;
  m.decision.chosen_candidate_id = "cand-99";
  assert.equal(checkStatus(evaluate(m), "tech_stack_memo_chosen_candidate_resolves_to_declared_candidate"), "fail");
});

test("test_chosen_not_top_ranked_still_passes", () => {
  const m = clone(COMPLETE) as any;
  m.decision.chosen_candidate_id = "cand-2";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "tech_stack_memo_chosen_candidate_resolves_to_declared_candidate"), "pass");
  assert.equal(v.verdict, "TECH_STACK_DECISION_SOUND");
});

test("test_ranking_missing_candidate_fails", () => {
  const m = clone(COMPLETE) as any;
  m.decision.declared_ranking_candidate_ids = ["cand-1"];
  const v = evaluate(m);
  assert.equal(checkStatus(v, "tech_stack_memo_declared_ranking_matches_declared_candidates"), "fail");
  assert.deepEqual(v.tech_stack_candidates_missing_from_declared_ranking, ["cand-2"]);
});

test("test_ranking_extra_candidate_fails", () => {
  const m = clone(COMPLETE) as any;
  m.decision.declared_ranking_candidate_ids = ["cand-1", "cand-2", "cand-9"];
  const v = evaluate(m);
  assert.equal(checkStatus(v, "tech_stack_memo_declared_ranking_matches_declared_candidates"), "fail");
  assert.deepEqual(v.declared_ranking_ids_not_declared_as_candidates, ["cand-9"]);
});

test("test_ranking_reordered_still_passes", () => {
  const m = clone(COMPLETE) as any;
  m.decision.declared_ranking_candidate_ids = ["cand-2", "cand-1"];
  assert.equal(checkStatus(evaluate(m), "tech_stack_memo_declared_ranking_matches_declared_candidates"), "pass");
});

test("test_exit_path_not_kept_fails_section6", () => {
  const m = clone(COMPLETE) as any;
  m.reversibility.exit_path_kept = false;
  assert.equal(evaluate(m).sections["reversibility_and_exit"], "fail");
});

test("test_lock_in_with_no_exit_fails_red_lines", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.lock_in_with_no_exit_present = true;
  const v = evaluate(m);
  assert.equal(v.sections["red_lines"], "fail");
  assert.equal(v.verdict, "TECH_STACK_DECISION_NOT_SOUND");
});

test("test_cv_padding_fails_red_lines", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.technology_chosen_to_pad_cv_present = true;
  assert.equal(checkStatus(evaluate(m), "tech_stack_memo_free_of_technology_chosen_to_pad_cv"), "fail");
});

test("test_absent_evidence_is_insufficient_not_failed", () => {
  const m = clone(COMPLETE) as any;
  delete m.tco;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["total_cost_and_operability"], "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.ok(v.checks.every((c) => c.status === "missing"));
  assert.equal(v.computed_status, null);
  assert.equal(v.tech_stack_candidates_count, null);
  assert.equal(v.tech_stack_criteria_weights_sum, null);
  assert.equal(v.candidate_score_coverage_ratio, null);
});

test("test_stamp_names_the_verdict", () => {
  assert.ok(stamp(evaluate(clone(COMPLETE))).includes("VERDICT: TECH_STACK_DECISION_SOUND"));
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
  m.memo_title = 12345;
  assert.throws(() => evaluate(m), fieldError("memo_title"));
});

test("malformed: object section as string rejected", () => {
  assert.throws(() => evaluate({ context: "should-be-an-object" }), fieldError("context"));
});

test("malformed: list field as object rejected", () => {
  assert.throws(() => evaluate({ candidates: { candidate_id: "cand-1" } }), fieldError("candidates"));
});

test("malformed: list entry as string rejected", () => {
  assert.throws(() => evaluate({ criteria: ["crit-1"] }), fieldError("criteria[0]"));
});

test("malformed: boolean leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.context.hard_constraints_declared = "yes";
  assert.throws(() => evaluate(m), fieldError("context.hard_constraints_declared"));
});

test("malformed: number leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.criteria[0].weight = "2";
  assert.throws(() => evaluate(m), fieldError("criteria[0].weight"));
});

test("malformed: nested score as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.candidates[0].scores[0].score = "4";
  assert.throws(() => evaluate(m), fieldError("candidates[0].scores[0].score"));
});

test("malformed: string list entry as number rejected", () => {
  const m = clone(COMPLETE) as any;
  m.decision.declared_ranking_candidate_ids = [42];
  assert.throws(() => evaluate(m), fieldError("decision.declared_ranking_candidate_ids[0]"));
});

test("malformed: null section rejected", () => {
  const m = clone(COMPLETE) as any;
  m.reversibility = null;
  assert.throws(() => evaluate(m), fieldError("reversibility"));
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
  .filter((f) => f.startsWith("tech-stack-decision-memo--") && f.endsWith(".json"))
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
