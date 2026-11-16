import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/code-review-service.js";
import { FieldTypeError } from "../src/atoms/validate.js";

// The CODE_REVIEW_READY manifest, copied from the Python oracle tests.
const COMPLETE: Record<string, unknown> = {
  entity: "PR #42 — add export button",
  pr: {
    changed_lines: 250,
    description_what_present: true,
    description_why_present: true,
    description_how_to_test_present: true,
    spec_or_issue_linked: true,
    screenshots_included_for_ui_changes: true,
  },
  checklist: {
    covered_items: ["correctness", "security", "tests",
                    "readability", "docs"],
    correctness_edge_cases_checked: true,
    security_inputs_secrets_dependencies_checked: true,
    tests_coverage_and_determinism_checked: true,
    readability_names_and_structure_checked: true,
  },
  feedback: {
    total_comments: 8,
    labeled_comments: 8,
    labels_use_must_nit_q_scheme: true,
    why_explained: true,
    proposes_not_dictates: true,
  },
  resolution: {
    total_comments: 8,
    answered_comments: 8,
    resolved_only_when_addressed: true,
    resolved_nits_not_relitigated: true,
  },
  gates: {
    ci_green_before_approval: true,
    change_nontrivial: true,
    reviewer_count: 2,
    reviewer_sign_off_recorded: true,
    unresolved_comments: 0,
    behavior_changing: true,
    docs_and_changelog_updated: true,
    approver_would_ship: true,
  },
  red_lines: {
    force_push_over_review_without_telling: false,
    rubber_stamped: false,
    unexplained_blocking: false,
  },
  merge: {
    self_merged_unreviewed: false,
    emergency_hotfix: false,
    hotfix_post_review_completed: false,
  },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function checkStatus(v: ReturnType<typeof evaluate>, name: string) {
  return v.checks.find((c) => c.check === name)?.status;
}

// ---- The Python VerdictTests, ported ----

test("test_complete_manifest_is_ready", () => {
  const v = evaluate(clone(COMPLETE));
  assert.equal(v.verdict, "CODE_REVIEW_READY");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.computed_status,
    "within_stated_limits_on_declared_evidence");
  assert.equal(v.checks.length, 29);
  assert.equal(v.computed_changed_lines, "250.000000");
  assert.equal(v.changed_lines_over_stated_aim, "-150.000000");
  assert.deepEqual(v.checklist_items_not_covered, []);
  assert.equal(v.labeled_comment_difference, "0.000000");
  assert.equal(v.answered_comment_difference, "0.000000");
  assert.equal(v.computed_reviewer_count, "2.000000");
  assert.equal(v.computed_unresolved_comments, "0.000000");
});

test("test_pr_at_exactly_400_lines_passes", () => {
  const m = clone(COMPLETE) as any;
  m.pr.changed_lines = 400;
  const v = evaluate(m);
  assert.equal(v.verdict, "CODE_REVIEW_READY");
  assert.equal(v.changed_lines_over_stated_aim, "0.000000");
});

test("test_pr_over_400_lines_fails", () => {
  const m = clone(COMPLETE) as any;
  m.pr.changed_lines = 850;
  const v = evaluate(m);
  assert.equal(v.verdict, "CODE_REVIEW_NOT_READY");
  assert.equal(v.sections["pr_size_and_description"], "fail");
  assert.equal(checkStatus(v, "pr_size_within_stated_aim"), "fail");
  assert.equal(v.changed_lines_over_stated_aim, "450.000000");
  assert.equal(v.computed_status,
    "outside_stated_limits_on_declared_evidence");
});

test("test_missing_changed_lines_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.pr.changed_lines;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "pr_size_within_stated_aim"), "missing");
  assert.equal(v.computed_changed_lines, null);
  assert.equal(v.computed_status, null);
});

test("test_description_why_missing_fails", () => {
  const m = clone(COMPLETE) as any;
  m.pr.description_why_present = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "CODE_REVIEW_NOT_READY");
  assert.equal(v.sections["pr_size_and_description"], "fail");
});

test("test_spec_not_linked_fails", () => {
  const m = clone(COMPLETE) as any;
  m.pr.spec_or_issue_linked = false;
  assert.equal(evaluate(m).verdict, "CODE_REVIEW_NOT_READY");
});

test("test_checklist_coverage_missing_one_fails", () => {
  const m = clone(COMPLETE) as any;
  m.checklist.covered_items = m.checklist.covered_items.filter(
    (c: string) => c !== "security");
  const v = evaluate(m);
  assert.equal(v.verdict, "CODE_REVIEW_NOT_READY");
  assert.deepEqual(v.checklist_items_not_covered, ["security"]);
  assert.equal(
    checkStatus(v, "checklist_items_cover_stated_checklist"), "fail");
});

test("test_checklist_empty_list_fails_not_missing", () => {
  const m = clone(COMPLETE) as any;
  m.checklist.covered_items = [];
  const v = evaluate(m);
  assert.equal(v.verdict, "CODE_REVIEW_NOT_READY");
  assert.deepEqual(v.checklist_items_not_covered,
    ["correctness", "security", "tests", "readability", "docs"]);
});

test("test_checklist_unknown_entries_do_not_satisfy_coverage", () => {
  const m = clone(COMPLETE) as any;
  m.checklist.covered_items = ["style", "performance"];
  const v = evaluate(m);
  assert.equal(v.verdict, "CODE_REVIEW_NOT_READY");
  assert.equal(v.checklist_items_not_covered?.length, 5);
});

test("test_missing_checklist_list_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.checklist.covered_items;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.checklist_items_not_covered, null);
});

test("test_security_not_checked_fails", () => {
  const m = clone(COMPLETE) as any;
  m.checklist.security_inputs_secrets_dependencies_checked = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "CODE_REVIEW_NOT_READY");
  assert.equal(v.sections["review_checklist"], "fail");
});

test("test_unlabeled_comments_fail", () => {
  const m = clone(COMPLETE) as any;
  m.feedback.labeled_comments = 5;
  const v = evaluate(m);
  assert.equal(v.verdict, "CODE_REVIEW_NOT_READY");
  assert.equal(checkStatus(v, "feedback_comments_all_labeled"), "fail");
  assert.equal(v.labeled_comment_difference, "-3.000000");
});

test("test_labeled_over_total_also_fails", () => {
  const m = clone(COMPLETE) as any;
  m.feedback.labeled_comments = 9;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "feedback_comments_all_labeled"), "fail");
  assert.equal(v.labeled_comment_difference, "1.000000");
});

test("test_missing_feedback_count_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.feedback.labeled_comments;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.labeled_comment_difference, null);
});

test("test_zero_comments_labeled_passes", () => {
  const m = clone(COMPLETE) as any;
  m.feedback.total_comments = 0;
  m.feedback.labeled_comments = 0;
  m.resolution.total_comments = 0;
  m.resolution.answered_comments = 0;
  assert.equal(evaluate(m).verdict, "CODE_REVIEW_READY");
});

test("test_labels_scheme_not_used_fails", () => {
  const m = clone(COMPLETE) as any;
  m.feedback.labels_use_must_nit_q_scheme = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "CODE_REVIEW_NOT_READY");
  assert.equal(v.sections["feedback_etiquette"], "fail");
});

test("test_unanswered_comments_fail", () => {
  const m = clone(COMPLETE) as any;
  m.resolution.answered_comments = 6;
  const v = evaluate(m);
  assert.equal(v.verdict, "CODE_REVIEW_NOT_READY");
  assert.equal(checkStatus(v, "authors_answer_every_comment"), "fail");
  assert.equal(v.answered_comment_difference, "-2.000000");
});

test("test_missing_answered_count_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.resolution.answered_comments;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.answered_comment_difference, null);
});

test("test_resolved_before_addressed_fails", () => {
  const m = clone(COMPLETE) as any;
  m.resolution.resolved_only_when_addressed = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "CODE_REVIEW_NOT_READY");
  assert.equal(v.sections["response_and_resolution"], "fail");
});

test("test_ci_not_green_fails", () => {
  const m = clone(COMPLETE) as any;
  m.gates.ci_green_before_approval = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "CODE_REVIEW_NOT_READY");
  assert.equal(v.sections["approval_gates"], "fail");
});

test("test_nontrivial_with_no_reviewer_fails", () => {
  const m = clone(COMPLETE) as any;
  m.gates.reviewer_count = 0;
  const v = evaluate(m);
  assert.equal(v.verdict, "CODE_REVIEW_NOT_READY");
  assert.equal(
    checkStatus(v, "at_least_one_reviewer_for_nontrivial_change"),
    "fail");
});

test("test_nontrivial_with_one_reviewer_passes", () => {
  const m = clone(COMPLETE) as any;
  m.gates.reviewer_count = 1;
  assert.equal(evaluate(m).verdict, "CODE_REVIEW_READY");
});

test("test_trivial_with_no_reviewer_passes_reviewer_gate", () => {
  const m = clone(COMPLETE) as any;
  m.gates.change_nontrivial = false;
  m.gates.reviewer_count = 0;
  const v = evaluate(m);
  assert.equal(v.verdict, "CODE_REVIEW_READY");
  assert.equal(
    checkStatus(v, "at_least_one_reviewer_for_nontrivial_change"),
    "pass");
});

test("test_missing_reviewer_gate_input_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.gates.reviewer_count;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(
    checkStatus(v, "at_least_one_reviewer_for_nontrivial_change"),
    "missing");
  assert.equal(v.computed_reviewer_count, null);
});

test("test_unresolved_comments_at_approval_fail", () => {
  const m = clone(COMPLETE) as any;
  m.gates.unresolved_comments = 3;
  const v = evaluate(m);
  assert.equal(v.verdict, "CODE_REVIEW_NOT_READY");
  assert.equal(
    checkStatus(v, "no_unresolved_comments_before_approval"), "fail");
  assert.equal(v.computed_unresolved_comments, "3.000000");
});

test("test_behavior_change_without_docs_fails", () => {
  const m = clone(COMPLETE) as any;
  m.gates.docs_and_changelog_updated = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "CODE_REVIEW_NOT_READY");
  assert.equal(
    checkStatus(v,
      "docs_and_changelog_updated_for_behavior_changing_change"),
    "fail");
});

test("test_non_behavior_change_without_docs_passes_docs_gate", () => {
  const m = clone(COMPLETE) as any;
  m.gates.behavior_changing = false;
  m.gates.docs_and_changelog_updated = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "CODE_REVIEW_READY");
  assert.equal(
    checkStatus(v,
      "docs_and_changelog_updated_for_behavior_changing_change"),
    "pass");
});

test("test_missing_docs_gate_input_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.gates.behavior_changing;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(
    checkStatus(v,
      "docs_and_changelog_updated_for_behavior_changing_change"),
    "missing");
});

test("test_no_sign_off_fails", () => {
  const m = clone(COMPLETE) as any;
  m.gates.reviewer_sign_off_recorded = false;
  assert.equal(evaluate(m).verdict, "CODE_REVIEW_NOT_READY");
});

test("test_force_push_without_telling_fails_red_line", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.force_push_over_review_without_telling = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "CODE_REVIEW_NOT_READY");
  assert.equal(v.sections["red_lines_and_merge_discipline"], "fail");
  assert.equal(
    checkStatus(v, "no_force_push_over_review_without_telling"),
    "fail");
});

test("test_rubber_stamping_fails_red_line", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.rubber_stamped = true;
  assert.equal(evaluate(m).verdict, "CODE_REVIEW_NOT_READY");
});

test("test_unexplained_blocking_fails_red_line", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.unexplained_blocking = true;
  assert.equal(evaluate(m).verdict, "CODE_REVIEW_NOT_READY");
});

test("test_self_merged_unreviewed_fails", () => {
  const m = clone(COMPLETE) as any;
  m.merge.self_merged_unreviewed = true;
  assert.equal(evaluate(m).verdict, "CODE_REVIEW_NOT_READY");
});

test("test_hotfix_without_post_review_fails", () => {
  const m = clone(COMPLETE) as any;
  m.merge.emergency_hotfix = true;
  m.merge.hotfix_post_review_completed = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "CODE_REVIEW_NOT_READY");
  assert.equal(
    checkStatus(v, "emergency_hotfix_post_reviewed_if_applicable"),
    "fail");
});

test("test_hotfix_with_post_review_passes", () => {
  const m = clone(COMPLETE) as any;
  m.merge.emergency_hotfix = true;
  m.merge.hotfix_post_review_completed = true;
  assert.equal(evaluate(m).verdict, "CODE_REVIEW_READY");
});

test("test_non_hotfix_without_post_review_passes_hotfix_gate", () => {
  const v = evaluate(clone(COMPLETE));
  assert.equal(
    checkStatus(v, "emergency_hotfix_post_reviewed_if_applicable"),
    "pass");
});

test("test_missing_hotfix_gate_input_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.merge.emergency_hotfix;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(
    checkStatus(v, "emergency_hotfix_post_reviewed_if_applicable"),
    "missing");
});

test("test_absent_section_is_insufficient_not_failed", () => {
  const m = clone(COMPLETE) as any;
  delete m.feedback;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["feedback_etiquette"],
    "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.computed_status, null);
  assert.equal(v.computed_changed_lines, null);
  assert.equal(v.checklist_items_not_covered, null);
  assert.equal(v.labeled_comment_difference, null);
  assert.equal(v.computed_reviewer_count, null);
});

test("test_stamp_names_the_verdict", () => {
  const v = evaluate(clone(COMPLETE));
  assert.ok(stamp(v).includes("VERDICT: CODE_REVIEW_READY"));
});

test("test_non_object_manifest_rejected", () => {
  assert.throws(
    () => evaluate(["not", "a", "manifest"]),
    (err: unknown) =>
      err instanceof TypeError &&
      (err as Error).message === "manifest must be a JSON object",
  );
});

// ---- F1 regression: malformed field types (external verification
// Wave 1) — the Python MalformedTypeTests, ported. A documented
// field present with the wrong JSON type raises FieldTypeError
// naming the field — never a verdict over garbage.

function fieldError(field: string) {
  return (err: unknown) =>
    err instanceof FieldTypeError && err.field === field;
}

test("malformed: top-level string field as number rejected", () => {
  const m = clone(COMPLETE) as any;
  m.entity = 12345;
  assert.throws(() => evaluate(m), fieldError("entity"));
});

test("malformed: section as string rejected", () => {
  assert.throws(
    () => evaluate({ pr: "should-be-an-object" }),
    fieldError("pr"),
  );
});

test("malformed: list field as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.checklist.covered_items = "correctness";
  assert.throws(() => evaluate(m), fieldError("checklist.covered_items"));
});

test("malformed: list entry as number rejected", () => {
  const m = clone(COMPLETE) as any;
  m.checklist.covered_items = ["correctness", 42];
  assert.throws(
    () => evaluate(m), fieldError("checklist.covered_items[1]"));
});

test("malformed: boolean leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.gates.ci_green_before_approval = "yes";
  assert.throws(
    () => evaluate(m), fieldError("gates.ci_green_before_approval"));
});

test("malformed: numeric leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.pr.changed_lines = "250";
  assert.throws(() => evaluate(m), fieldError("pr.changed_lines"));
});

test("malformed: numeric leaf as boolean rejected", () => {
  const m = clone(COMPLETE) as any;
  m.gates.reviewer_count = true;
  assert.throws(() => evaluate(m), fieldError("gates.reviewer_count"));
});

test("malformed: conditional boolean as number rejected", () => {
  const m = clone(COMPLETE) as any;
  m.gates.change_nontrivial = 1;
  assert.throws(() => evaluate(m), fieldError("gates.change_nontrivial"));
});

test("malformed: null section rejected", () => {
  const m = clone(COMPLETE) as any;
  m.gates = null;
  assert.throws(() => evaluate(m), fieldError("gates"));
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
  .filter((f) => f.startsWith("code-review-service--") && f.endsWith(".json"))
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
