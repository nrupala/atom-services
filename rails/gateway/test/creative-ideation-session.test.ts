import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/creative-ideation-session.js";
import { FieldTypeError } from "../src/atoms/validate.js";

// The SESSION_COMPLETE manifest, copied from the Python oracle tests.
const COMPLETE: Record<string, unknown> = {
  session_title: "Ten fresh angles for a workshop title",
  brief: {
    written: true,
    goal_or_question_stated: true,
    constraints_declared: true,
  },
  preparation: {
    scheduled_in_advance: true,
    prepared_with_inputs_ready: true,
  },
  capture: {
    capture_system_used: true,
    all_ideas_captured: true,
    no_judging_at_capture: true,
  },
  generation: {
    editing_separated_from_generating: true,
    small_reps_or_low_start_bar_used: true,
  },
  divergence: {
    diverged_before_converging: true,
    methods_used: ["brainstorm", "scamper", "what_if"],
    constraints_used_as_prompt: true,
  },
  idea_pool: {
    target_idea_count: 20,
    total_ideas_captured: 26,
    dedup_performed: true,
    duplicates_removed: 6,
    unique_ideas_after_dedup: 20,
    ideas_clustered_or_grouped: true,
  },
  selection: {
    criteria_written_before_scoring: true,
    criteria_applied_to_all_unique_ideas: true,
    scoring_only_after_divergence_complete: true,
  },
  shortlist: {
    shortlist_count: 5,
    rationale_written: true,
    rationale_references_criteria: true,
  },
  outcome: { shared_for_feedback: true },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function checkStatus(v: ReturnType<typeof evaluate>, name: string) {
  return v.checks.find((c) => c.check === name)?.status;
}

// ---- The Python VerdictTests, ported ----

test("test_complete_manifest_is_session_complete", () => {
  const v = evaluate(clone(COMPLETE));
  assert.equal(v.verdict, "SESSION_COMPLETE");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.computed_status,
    "within_stated_limits_on_declared_evidence");
  assert.equal(v.checks.length, 24);
  assert.equal(v.target_idea_count, 20);
  assert.equal(v.total_ideas_captured, 26);
  assert.equal(v.volume_gap_ideas, "6.000000");
  assert.equal(v.duplicates_removed, 6);
  assert.equal(v.unique_ideas_after_dedup, 20);
  assert.equal(v.dedup_discrepancy_ideas, "0.000000");
  assert.equal(v.shortlist_count, 5);
  assert.equal(v.methods_used_count, 3);
  assert.deepStrictEqual(v.methods_used,
    ["brainstorm", "scamper", "what_if"]);
});

test("test_volume_exactly_at_target_passes", () => {
  const m = clone(COMPLETE) as any;
  m.idea_pool.total_ideas_captured = 20;
  m.idea_pool.duplicates_removed = 0;
  m.idea_pool.unique_ideas_after_dedup = 20;
  const v = evaluate(m);
  assert.equal(v.verdict, "SESSION_COMPLETE");
  assert.equal(v.volume_gap_ideas, "0.000000");
});

test("test_volume_below_declared_target_fails", () => {
  const m = clone(COMPLETE) as any;
  m.idea_pool.total_ideas_captured = 12;
  m.idea_pool.duplicates_removed = 2;
  m.idea_pool.unique_ideas_after_dedup = 10;
  const v = evaluate(m);
  assert.equal(v.verdict, "SESSION_NOT_COMPLETE");
  assert.equal(v.sections["idea_pool_and_volume"], "fail");
  assert.equal(checkStatus(v, "volume_meets_declared_target"), "fail");
  assert.equal(v.volume_gap_ideas, "-8.000000");
  assert.equal(v.computed_status,
    "outside_stated_limits_on_declared_evidence");
});

test("test_zero_target_fails", () => {
  const m = clone(COMPLETE) as any;
  m.idea_pool.target_idea_count = 0;
  const v = evaluate(m);
  assert.equal(v.verdict, "SESSION_NOT_COMPLETE");
  assert.equal(checkStatus(v, "volume_meets_declared_target"), "fail");
});

test("test_negative_captured_fails", () => {
  const m = clone(COMPLETE) as any;
  m.idea_pool.total_ideas_captured = -1;
  assert.equal(evaluate(m).verdict, "SESSION_NOT_COMPLETE");
});

test("test_missing_volume_numbers_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.idea_pool.total_ideas_captured;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "volume_meets_declared_target"), "missing");
  assert.equal(checkStatus(v, "dedup_arithmetic_consistent"), "missing");
  assert.equal(v.computed_status, null);
  assert.equal(v.target_idea_count, 20);
  assert.equal(v.total_ideas_captured, null);
  assert.equal(v.volume_gap_ideas, null);
  assert.equal(v.dedup_discrepancy_ideas, null);
});

test("test_large_target_not_capped_by_invented_threshold", () => {
  const m = clone(COMPLETE) as any;
  m.idea_pool.target_idea_count = 200;
  m.idea_pool.total_ideas_captured = 210;
  m.idea_pool.duplicates_removed = 10;
  m.idea_pool.unique_ideas_after_dedup = 200;
  assert.equal(evaluate(m).verdict, "SESSION_COMPLETE");
});

test("test_dedup_arithmetic_mismatch_fails", () => {
  const m = clone(COMPLETE) as any;
  m.idea_pool.unique_ideas_after_dedup = 19;
  const v = evaluate(m);
  assert.equal(v.verdict, "SESSION_NOT_COMPLETE");
  assert.equal(checkStatus(v, "dedup_arithmetic_consistent"), "fail");
  assert.equal(v.dedup_discrepancy_ideas, "-1.000000");
});

test("test_duplicates_above_total_fails", () => {
  const m = clone(COMPLETE) as any;
  m.idea_pool.duplicates_removed = 30;
  m.idea_pool.unique_ideas_after_dedup = -4;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "dedup_arithmetic_consistent"), "fail");
});

test("test_shortlist_above_unique_pool_fails", () => {
  const m = clone(COMPLETE) as any;
  m.shortlist.shortlist_count = 21;
  const v = evaluate(m);
  assert.equal(v.verdict, "SESSION_NOT_COMPLETE");
  assert.equal(v.sections["selection_and_convergence"], "fail");
  assert.equal(checkStatus(v, "shortlist_within_unique_pool"), "fail");
});

test("test_shortlist_exactly_unique_pool_passes", () => {
  const m = clone(COMPLETE) as any;
  m.shortlist.shortlist_count = 20;
  assert.equal(evaluate(m).verdict, "SESSION_COMPLETE");
});

test("test_zero_shortlist_fails", () => {
  const m = clone(COMPLETE) as any;
  m.shortlist.shortlist_count = 0;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "shortlist_within_unique_pool"), "fail");
});

test("test_missing_shortlist_count_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.shortlist.shortlist_count;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "shortlist_within_unique_pool"), "missing");
});

test("test_each_stated_method_passes", () => {
  for (const method of ["brainstorm", "scamper", "analogies",
    "combining_distant_domains", "what_if"]) {
    const m = clone(COMPLETE) as any;
    m.divergence.methods_used = [method];
    assert.equal(evaluate(m).verdict, "SESSION_COMPLETE");
  }
});

test("test_unstated_method_fails", () => {
  const m = clone(COMPLETE) as any;
  m.divergence.methods_used = ["brainstorm", "mind_palace"];
  const v = evaluate(m);
  assert.equal(v.verdict, "SESSION_NOT_COMPLETE");
  assert.equal(checkStatus(v, "methods_used_are_stated_methods"), "fail");
  assert.equal(v.computed_status,
    "outside_stated_limits_on_declared_evidence");
});

test("test_empty_methods_list_fails", () => {
  const m = clone(COMPLETE) as any;
  m.divergence.methods_used = [];
  const v = evaluate(m);
  assert.equal(checkStatus(v, "methods_used_are_stated_methods"), "fail");
  assert.equal(v.methods_used_count, 0);
});

test("test_missing_methods_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.divergence.methods_used;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "methods_used_are_stated_methods"), "missing");
  assert.equal(v.methods_used, null);
  assert.equal(v.methods_used_count, null);
});

test("test_brief_not_written_fails", () => {
  const m = clone(COMPLETE) as any;
  m.brief.written = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "SESSION_NOT_COMPLETE");
  assert.equal(v.sections["brief_and_preparation"], "fail");
});

test("test_constraints_not_declared_fails", () => {
  const m = clone(COMPLETE) as any;
  m.brief.constraints_declared = false;
  assert.equal(evaluate(m).verdict, "SESSION_NOT_COMPLETE");
});

test("test_not_scheduled_waiting_for_inspiration_fails", () => {
  const m = clone(COMPLETE) as any;
  m.preparation.scheduled_in_advance = false;
  assert.equal(evaluate(m).verdict, "SESSION_NOT_COMPLETE");
});

test("test_judging_at_capture_fails", () => {
  const m = clone(COMPLETE) as any;
  m.capture.no_judging_at_capture = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "SESSION_NOT_COMPLETE");
  assert.equal(v.sections["capture_and_generation"], "fail");
});

test("test_editing_while_generating_fails", () => {
  const m = clone(COMPLETE) as any;
  m.generation.editing_separated_from_generating = false;
  assert.equal(evaluate(m).verdict, "SESSION_NOT_COMPLETE");
});

test("test_converging_before_diverging_fails", () => {
  const m = clone(COMPLETE) as any;
  m.divergence.diverged_before_converging = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "SESSION_NOT_COMPLETE");
  assert.equal(v.sections["divergence_and_methods"], "fail");
});

test("test_dedup_not_performed_fails", () => {
  const m = clone(COMPLETE) as any;
  m.idea_pool.dedup_performed = false;
  assert.equal(evaluate(m).verdict, "SESSION_NOT_COMPLETE");
});

test("test_not_clustered_fails", () => {
  const m = clone(COMPLETE) as any;
  m.idea_pool.ideas_clustered_or_grouped = false;
  assert.equal(evaluate(m).verdict, "SESSION_NOT_COMPLETE");
});

test("test_criteria_written_after_scoring_fails", () => {
  const m = clone(COMPLETE) as any;
  m.selection.criteria_written_before_scoring = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "SESSION_NOT_COMPLETE");
  assert.equal(v.sections["selection_and_convergence"], "fail");
});

test("test_criteria_not_applied_to_all_fails", () => {
  const m = clone(COMPLETE) as any;
  m.selection.criteria_applied_to_all_unique_ideas = false;
  assert.equal(evaluate(m).verdict, "SESSION_NOT_COMPLETE");
});

test("test_scoring_before_divergence_complete_fails", () => {
  const m = clone(COMPLETE) as any;
  m.selection.scoring_only_after_divergence_complete = false;
  assert.equal(evaluate(m).verdict, "SESSION_NOT_COMPLETE");
});

test("test_shortlist_rationale_missing_content_fails", () => {
  const m = clone(COMPLETE) as any;
  m.shortlist.rationale_written = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "SESSION_NOT_COMPLETE");
  assert.equal(v.sections["shortlist_and_ship"], "fail");
});

test("test_rationale_not_referencing_criteria_fails", () => {
  const m = clone(COMPLETE) as any;
  m.shortlist.rationale_references_criteria = false;
  assert.equal(evaluate(m).verdict, "SESSION_NOT_COMPLETE");
});

test("test_not_shared_for_feedback_fails", () => {
  const m = clone(COMPLETE) as any;
  m.outcome.shared_for_feedback = false;
  assert.equal(evaluate(m).verdict, "SESSION_NOT_COMPLETE");
});

test("test_absent_section_is_insufficient_not_failed", () => {
  const m = clone(COMPLETE) as any;
  delete m.capture;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["capture_and_generation"],
    "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.computed_status, null);
  assert.equal(v.target_idea_count, null);
  assert.equal(v.total_ideas_captured, null);
  assert.equal(v.volume_gap_ideas, null);
  assert.equal(v.duplicates_removed, null);
  assert.equal(v.unique_ideas_after_dedup, null);
  assert.equal(v.dedup_discrepancy_ideas, null);
  assert.equal(v.shortlist_count, null);
  assert.equal(v.methods_used, null);
  assert.equal(v.methods_used_count, null);
  assert.equal(v.session_title, null);
});

test("test_stamp_names_the_verdict", () => {
  const v = evaluate(clone(COMPLETE));
  assert.ok(stamp(v).includes("VERDICT: SESSION_COMPLETE"));
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
  const m = clone(COMPLETE) as any;
  m.session_title = 12345;
  assert.throws(() => evaluate(m), fieldError("session_title"));
});

test("malformed: section as string rejected", () => {
  assert.throws(
    () => evaluate({ brief: "should-be-an-object" }),
    fieldError("brief"),
  );
});

test("malformed: boolean leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.brief.written = "yes";
  assert.throws(() => evaluate(m), fieldError("brief.written"));
});

test("malformed: boolean leaf as number rejected", () => {
  const m = clone(COMPLETE) as any;
  m.capture.no_judging_at_capture = 1;
  assert.throws(
    () => evaluate(m), fieldError("capture.no_judging_at_capture"));
});

test("malformed: numeric leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.idea_pool.target_idea_count = "20 ideas";
  assert.throws(
    () => evaluate(m), fieldError("idea_pool.target_idea_count"));
});

test("malformed: numeric leaf as boolean rejected", () => {
  const m = clone(COMPLETE) as any;
  m.shortlist.shortlist_count = true;
  assert.throws(() => evaluate(m), fieldError("shortlist.shortlist_count"));
});

test("malformed: methods list as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.divergence.methods_used = "brainstorm";
  assert.throws(
    () => evaluate(m), fieldError("divergence.methods_used"));
});

test("malformed: methods list entry as number rejected", () => {
  const m = clone(COMPLETE) as any;
  m.divergence.methods_used = ["brainstorm", 42];
  assert.throws(
    () => evaluate(m), fieldError("divergence.methods_used[1]"));
});

test("malformed: null section rejected", () => {
  const m = clone(COMPLETE) as any;
  m.selection = null;
  assert.throws(() => evaluate(m), fieldError("selection"));
});

test("malformed: null leaf rejected", () => {
  const m = clone(COMPLETE) as any;
  m.outcome.shared_for_feedback = null;
  assert.throws(
    () => evaluate(m), fieldError("outcome.shared_for_feedback"));
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
  .filter((f) => f.startsWith("creative-ideation-session--") && f.endsWith(".json"))
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
