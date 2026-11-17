import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/prd-with-testable-acceptance-criteria.js";
import { FieldTypeError } from "../src/atoms/validate.js";

const COMPLETE: Record<string, unknown> = {
  product: "vault-mobile",
  problem: { statement_declared: true,
             who_has_it_declared: true,
             why_now_declared: true,
             problem_first_before_solution_declared: true,
             statement_sentence_count: 4 },
  outcome: { observable_change_defined: true,
             outcome_is_behavior_or_metric_not_feature_only: true },
  stories: [
    { id: "S1", role: "vault owner",
      capability: "scan a document into the vault",
      benefit: "paper records are searchable", priority: "P0" },
    { id: "S2", role: "vault owner",
      capability: "unlock the vault with biometrics",
      benefit: "access is fast without a password", priority: "P0" },
    { id: "S3", role: "family member",
      capability: "receive a sync alert",
      benefit: "shared records stay current", priority: "P1" },
  ],
  acceptance_criteria: [
    { id: "AC1", story_id: "S1", testable_declared: true, binary_declared: true },
    { id: "AC2", story_id: "S1", testable_declared: true, binary_declared: true },
    { id: "AC3", story_id: "S2", testable_declared: true, binary_declared: true },
    { id: "AC4", story_id: "S3", testable_declared: true, binary_declared: true },
  ],
  out_of_scope_items: ["video editing", "desktop client"],
  scope: { explicit_out_of_scope_list_declared: true,
           explicit_scope_boundaries_declared: true,
           deferrals_placed_in_later_list: true,
           deferrals_not_silently_inside_scope: true },
  priorities: { priority_scheme_p0_p1_p2_applied: true,
                priority_tiers_applied_in_shipping_order: true,
                p0_items_shippable_alone_declared: true,
                priority_conflicts_resolved_with_decision_owner: true },
  decisions: { decision_owner_named: true,
               key_decisions_logged_in_prd: true },
  open_questions: [
    { id: "Q1", architecture_changing: true, blocks_build: true },
    { id: "Q2", architecture_changing: false, blocks_build: false },
  ],
  open_question_tracking: { tracked_explicitly: true,
                            architecture_changing_questions_block_build: true,
                            non_architecture_questions_do_not_block_build: true },
  approval: { approved_spec_declared: true },
  red_lines: { build_started_before_approved_spec_present: false,
               unlabeled_spike_treated_as_approved_spec_present: false,
               scope_widened_mid_phase_without_prd_update_and_reapproval_present: false },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function checkStatus(v: ReturnType<typeof evaluate>, name: string) {
  return v.checks.find((c) => c.check === name)?.status;
}

test("test_complete_manifest_is_ready", () => {
  const v = evaluate(clone(COMPLETE));
  assert.equal(v.verdict, "PRD_WITH_TESTABLE_ACCEPTANCE_CRITERIA_READY");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.checks.length, 38);
  assert.equal(v.computed_status, "within_stated_limits_on_declared_evidence");
  assert.equal(v.problem_statement_sentence_count, 4);
  assert.equal(v.stories_count, 3);
  assert.equal(v.acceptance_criteria_count, 4);
  assert.equal(v.p0_story_count, 2);
  assert.deepEqual(v.stories_without_criteria, []);
  assert.deepEqual(v.criteria_without_declared_story, []);
  assert.deepEqual(v.duplicate_story_ids, []);
  assert.deepEqual(v.duplicate_criterion_ids, []);
  assert.equal(v.story_criteria_coverage, "1.000000");
  assert.equal(v.testable_criteria_coverage, "1.000000");
  assert.equal(v.binary_criteria_coverage, "1.000000");
  assert.equal(v.out_of_scope_items_count, 2);
  assert.deepEqual(v.misc_bucket_items, []);
  assert.equal(v.open_questions_count, 2);
  assert.equal(v.architecture_changing_open_questions_count, 1);
  assert.equal(v.blocking_open_questions_count, 1);
});

test("test_empty_open_questions_list_is_a_valid_declaration", () => {
  const m = clone(COMPLETE) as any;
  m.open_questions = [];
  const v = evaluate(m);
  assert.equal(v.verdict, "PRD_WITH_TESTABLE_ACCEPTANCE_CRITERIA_READY");
  assert.equal(v.open_questions_count, 0);
  assert.equal(v.architecture_changing_open_questions_count, 0);
  assert.equal(v.blocking_open_questions_count, 0);
  assert.equal(checkStatus(v, "open_questions_declared"), "pass");
  assert.equal(checkStatus(v, "every_open_question_block_flag_matches_architecture_impact"), "pass");
});

test("test_problem_over_five_sentences_fails_section1", () => {
  const m = clone(COMPLETE) as any;
  m.problem.statement_sentence_count = 6;
  const v = evaluate(m);
  assert.equal(v.verdict, "PRD_WITH_TESTABLE_ACCEPTANCE_CRITERIA_NOT_READY");
  assert.equal(v.sections["problem_and_outcome"], "fail");
  assert.equal(checkStatus(v, "problem_statement_within_five_sentences"), "fail");
});

test("test_problem_at_exactly_five_sentences_passes", () => {
  const m = clone(COMPLETE) as any;
  m.problem.statement_sentence_count = 5;
  assert.equal(checkStatus(evaluate(m), "problem_statement_within_five_sentences"), "pass");
});

test("test_problem_sentence_count_absent_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.problem.statement_sentence_count;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "problem_statement_within_five_sentences"), "missing");
  assert.equal(v.problem_statement_sentence_count, null);
});

test("test_outcome_as_feature_only_fails", () => {
  const m = clone(COMPLETE) as any;
  m.outcome.outcome_is_behavior_or_metric_not_feature_only = false;
  assert.equal(evaluate(m).verdict, "PRD_WITH_TESTABLE_ACCEPTANCE_CRITERIA_NOT_READY");
});

test("test_story_missing_benefit_fails_and_is_a_form_failure", () => {
  const m = clone(COMPLETE) as any;
  m.stories[0].benefit = "";
  const v = evaluate(m);
  assert.equal(v.verdict, "PRD_WITH_TESTABLE_ACCEPTANCE_CRITERIA_NOT_READY");
  assert.equal(checkStatus(v, "every_prd_story_states_role_capability_and_benefit"), "fail");
});

test("test_story_missing_role_field_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.stories[1].role;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "every_prd_story_states_role_capability_and_benefit"), "missing");
});

test("test_duplicate_story_id_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.stories[2].id = "S1";
  m.acceptance_criteria[3].story_id = "S1";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_prd_story_id_unique_and_nonempty"), "fail");
  assert.deepEqual(v.duplicate_story_ids, ["S1"]);
});

test("test_story_priority_outside_p0_p1_p2_fails", () => {
  const m = clone(COMPLETE) as any;
  m.stories[2].priority = "P9";
  assert.equal(checkStatus(evaluate(m), "every_prd_story_priority_is_p0_p1_or_p2"), "fail");
});

test("test_story_without_criteria_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.acceptance_criteria.splice(3, 1);
  const v = evaluate(m);
  assert.equal(v.verdict, "PRD_WITH_TESTABLE_ACCEPTANCE_CRITERIA_NOT_READY");
  assert.equal(checkStatus(v, "every_story_has_acceptance_criteria"), "fail");
  assert.deepEqual(v.stories_without_criteria, ["S3"]);
  assert.equal(v.story_criteria_coverage, "0.666667");
  assert.equal(v.computed_status, "outside_stated_limits_on_declared_evidence");
});

test("test_criterion_tracing_to_undeclared_story_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.acceptance_criteria[3].story_id = "S99";
  m.acceptance_criteria.push({ id: "AC5", story_id: "S3", testable_declared: true, binary_declared: true });
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_acceptance_criterion_traces_to_declared_story"), "fail");
  assert.deepEqual(v.criteria_without_declared_story, ["AC4"]);
});

test("test_criterion_missing_story_id_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.acceptance_criteria[0].story_id;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "every_acceptance_criterion_traces_to_declared_story"), "missing");
  assert.deepEqual(v.criteria_without_declared_story, []);
});

test("test_untestable_criterion_fails", () => {
  const m = clone(COMPLETE) as any;
  m.acceptance_criteria[1].testable_declared = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_acceptance_criterion_declared_testable"), "fail");
  assert.equal(v.testable_criteria_coverage, "0.750000");
});

test("test_non_binary_criterion_fails", () => {
  const m = clone(COMPLETE) as any;
  m.acceptance_criteria[2].binary_declared = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_acceptance_criterion_declared_binary"), "fail");
  assert.equal(v.binary_criteria_coverage, "0.750000");
});

test("test_duplicate_criterion_id_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.acceptance_criteria[3].id = "AC1";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_acceptance_criterion_id_unique_and_nonempty"), "fail");
  assert.deepEqual(v.duplicate_criterion_ids, ["AC1"]);
});

test("test_absent_stories_list_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.stories;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "prd_stories_declared"), "missing");
  assert.equal(v.computed_status, null);
  assert.equal(v.stories_count, null);
  assert.equal(v.p0_story_count, null);
  assert.equal(v.stories_without_criteria, null);
  assert.equal(v.criteria_without_declared_story, null);
  assert.equal(v.duplicate_story_ids, null);
  assert.equal(v.story_criteria_coverage, null);
});

test("test_empty_stories_list_fails", () => {
  const m = clone(COMPLETE) as any;
  m.stories = [];
  const v = evaluate(m);
  assert.equal(v.verdict, "PRD_WITH_TESTABLE_ACCEPTANCE_CRITERIA_NOT_READY");
  assert.equal(checkStatus(v, "prd_stories_declared"), "fail");
  assert.equal(v.stories_count, 0);
});

test("test_misc_bucket_in_out_of_scope_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.out_of_scope_items = ["video editing", "Misc"];
  const v = evaluate(m);
  assert.equal(v.sections["scope_fences"], "fail");
  assert.equal(checkStatus(v, "no_misc_bucket_in_out_of_scope_items"), "fail");
  assert.deepEqual(v.misc_bucket_items, ["Misc"]);
});

test("test_deferrals_silently_inside_scope_fails_section3", () => {
  const m = clone(COMPLETE) as any;
  m.scope.deferrals_not_silently_inside_scope = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "PRD_WITH_TESTABLE_ACCEPTANCE_CRITERIA_NOT_READY");
  assert.equal(v.sections["scope_fences"], "fail");
});

test("test_p0_not_shippable_alone_fails_section4", () => {
  const m = clone(COMPLETE) as any;
  m.priorities.p0_items_shippable_alone_declared = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "PRD_WITH_TESTABLE_ACCEPTANCE_CRITERIA_NOT_READY");
  assert.equal(v.sections["priorities_and_decisions"], "fail");
  assert.equal(checkStatus(v, "p0_stories_shippable_alone"), "fail");
});

test("test_key_decisions_not_recorded_fails", () => {
  const m = clone(COMPLETE) as any;
  m.decisions.key_decisions_logged_in_prd = false;
  assert.equal(checkStatus(evaluate(m), "prd_key_decisions_recorded"), "fail");
});

test("test_non_architecture_question_blocking_build_fails", () => {
  const m = clone(COMPLETE) as any;
  m.open_questions[1].blocks_build = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "PRD_WITH_TESTABLE_ACCEPTANCE_CRITERIA_NOT_READY");
  assert.equal(checkStatus(v, "every_open_question_block_flag_matches_architecture_impact"), "fail");
  assert.equal(v.blocking_open_questions_count, 2);
});

test("test_architecture_question_not_blocking_build_fails", () => {
  const m = clone(COMPLETE) as any;
  m.open_questions[0].blocks_build = false;
  assert.equal(checkStatus(evaluate(m), "every_open_question_block_flag_matches_architecture_impact"), "fail");
});

test("test_open_question_missing_block_flag_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.open_questions[0].blocks_build;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "every_open_question_block_flag_matches_architecture_impact"), "missing");
});

test("test_unapproved_spec_fails_section5", () => {
  const m = clone(COMPLETE) as any;
  m.approval.approved_spec_declared = false;
  const v = evaluate(m);
  assert.equal(v.sections["open_questions_and_approval"], "fail");
  assert.equal(checkStatus(v, "spec_approved_for_build"), "fail");
});

test("test_build_before_approved_spec_fails_red_lines", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.build_started_before_approved_spec_present = true;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_build_before_approved_spec"), "fail");
  assert.equal(v.sections["red_lines"], "fail");
});

test("test_unlabeled_spike_red_line_fails", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.unlabeled_spike_treated_as_approved_spec_present = true;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_unlabeled_spike_as_spec_exception"), "fail");
  assert.equal(v.verdict, "PRD_WITH_TESTABLE_ACCEPTANCE_CRITERIA_NOT_READY");
});

test("test_scope_widened_without_reapproval_red_line_fails", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.scope_widened_mid_phase_without_prd_update_and_reapproval_present = true;
  assert.equal(checkStatus(evaluate(m), "no_scope_widening_without_prd_update_and_reapproval"), "fail");
});

test("test_absent_evidence_is_insufficient_not_failed", () => {
  const m = clone(COMPLETE) as any;
  delete m.scope;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["scope_fences"], "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.ok(v.checks.every((c) => c.status === "missing"));
  assert.equal(v.computed_status, null);
  assert.equal(v.problem_statement_sentence_count, null);
  assert.equal(v.stories_count, null);
  assert.equal(v.acceptance_criteria_count, null);
  assert.equal(v.stories_without_criteria, null);
  assert.equal(v.story_criteria_coverage, null);
  assert.equal(v.testable_criteria_coverage, null);
  assert.equal(v.binary_criteria_coverage, null);
  assert.equal(v.out_of_scope_items_count, null);
  assert.equal(v.misc_bucket_items, null);
  assert.equal(v.open_questions_count, null);
});

test("test_stamp_names_the_verdict", () => {
  assert.ok(stamp(evaluate(clone(COMPLETE))).includes("VERDICT: PRD_WITH_TESTABLE_ACCEPTANCE_CRITERIA_READY"));
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
  m.product = 12345;
  assert.throws(() => evaluate(m), fieldError("product"));
});

test("malformed: object section as string rejected", () => {
  assert.throws(() => evaluate({ problem: "should-be-an-object" }), fieldError("problem"));
});

test("malformed: list field as object rejected", () => {
  assert.throws(() => evaluate({ stories: { id: "S1" } }), fieldError("stories"));
});

test("malformed: list entry as string rejected", () => {
  assert.throws(() => evaluate({ stories: ["S1"] }), fieldError("stories[0]"));
});

test("malformed: number leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.problem.statement_sentence_count = "four";
  assert.throws(() => evaluate(m), fieldError("problem.statement_sentence_count"));
});

test("malformed: boolean leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.approval.approved_spec_declared = "yes";
  assert.throws(() => evaluate(m), fieldError("approval.approved_spec_declared"));
});

test("malformed: nested list entry string field rejected", () => {
  const m = clone(COMPLETE) as any;
  m.stories[0].priority = 0;
  assert.throws(() => evaluate(m), fieldError("stories[0].priority"));
});

test("malformed: nested list entry boolean field rejected", () => {
  const m = clone(COMPLETE) as any;
  m.acceptance_criteria[1].testable_declared = 7;
  assert.throws(() => evaluate(m), fieldError("acceptance_criteria[1].testable_declared"));
});

test("malformed: string list entry as number rejected", () => {
  const m = clone(COMPLETE) as any;
  m.out_of_scope_items = [42];
  assert.throws(() => evaluate(m), fieldError("out_of_scope_items[0]"));
});

test("malformed: null section rejected", () => {
  const m = clone(COMPLETE) as any;
  m.scope = null;
  assert.throws(() => evaluate(m), fieldError("scope"));
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
  .filter((f) => f.startsWith("prd-with-testable-acceptance-criteria--") && f.endsWith(".json"))
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
