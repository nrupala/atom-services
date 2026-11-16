import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/difficult-conversation-coaching.js";
import { FieldTypeError } from "../src/atoms/validate.js";

// The CONVERSATION_PREPARATION_COMPLETE manifest, copied from the
// Python VerdictTests oracle.
const COMPLETE: Record<string, unknown> = {
  conversation_title: "vendor-escalation-call",
  preparation_domains: ["self_awareness", "self_management",
                        "social_awareness", "relationship_management"],
  self_awareness: { emotion_named: true,
                    pause_before_reacting_planned: true },
  self_management: { firm_not_hot_stance_declared: true,
                     regulation_approach_declared: true,
                     venting_in_writing_present: false,
                     emotion_suppressed_instead_of_regulated_present: false },
  rehearsal: { rehearsal_completed: true },
  empathy: { counterpart_emotion_considered: true,
             emotion_separated_from_position: true,
             acknowledgement_before_redirect_planned: true,
             strongest_reasonable_version_identified: true },
  framing: { facts_led_with: true,
             specifics_prepared: true,
             ask_stated_clearly: true,
             boundary_stated_clearly: true,
             firm_on_substance_warm_on_tone_declared: true,
             hostility_mirroring_present: false },
  structure: { own_part_owned: true,
               other_view_invited: true,
               concrete_next_step_proposed: true },
  feedback: { feedback_to_be_given: true },
  feedback_points: [
    { name: "missed_deadline", situation_stated: true,
      behavior_described: true, impact_stated: true,
      targets_identity: false },
    { name: "escalation_tone", situation_stated: true,
      behavior_described: true, impact_stated: true,
      targets_identity: false },
  ],
  safeguards: { do_not_respond_list_checked: true,
                target_on_do_not_respond_list: false,
                register_appropriate_to_relationship_declared: true },
  repair: { thread_has_soured: true,
            repair_move_planned: true,
            relationship_and_outcome_protected_over_point_scoring_declared: true,
            winning_argument_losing_relationship_present: false },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function checkStatus(v: ReturnType<typeof evaluate>, name: string) {
  return v.checks.find((c) => c.check === name)?.status;
}

// ---- The 25 Python VerdictTests, ported ----

test("test_complete_manifest_is_complete", () => {
  const v = evaluate(clone(COMPLETE));
  assert.equal(v.verdict, "CONVERSATION_PREPARATION_COMPLETE");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.checks.length, 31);
  assert.equal(v.computed_status, "within_stated_limits_on_declared_evidence");
  assert.equal(v.preparation_domains_count, 4);
  assert.deepEqual(v.preparation_domains_missing, []);
  assert.equal(v.preparation_domain_coverage, "1.0000");
  assert.equal(v.feedback_points_count, 2);
  assert.deepEqual(v.feedback_points_without_complete_sbi, []);
  assert.deepEqual(v.feedback_points_targeting_identity, []);
  assert.equal(v.sbi_coverage, "1.0000");
});

test("test_emotion_not_named_fails_preparation_section", () => {
  const m = clone(COMPLETE) as any;
  m.self_awareness.emotion_named = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "CONVERSATION_PREPARATION_INCOMPLETE");
  assert.equal(v.sections["preparation_and_self_regulation"], "fail");
});

test("test_venting_in_writing_fails", () => {
  const m = clone(COMPLETE) as any;
  m.self_management.venting_in_writing_present = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "CONVERSATION_PREPARATION_INCOMPLETE");
  assert.equal(checkStatus(v, "no_venting_in_writing"), "fail");
});

test("test_emotion_suppressed_instead_of_regulated_fails", () => {
  const m = clone(COMPLETE) as any;
  m.self_management.emotion_suppressed_instead_of_regulated_present = true;
  assert.equal(evaluate(m).verdict, "CONVERSATION_PREPARATION_INCOMPLETE");
});

test("test_domains_out_of_order_fail_and_are_reported", () => {
  const m = clone(COMPLETE) as any;
  m.preparation_domains = ["self_management", "self_awareness",
                           "social_awareness", "relationship_management"];
  const v = evaluate(m);
  assert.equal(v.verdict, "CONVERSATION_PREPARATION_INCOMPLETE");
  assert.equal(checkStatus(v, "preparation_domains_cover_all_four_in_stated_order"), "fail");
  assert.deepEqual(v.preparation_domains_missing, []);
  assert.equal(v.preparation_domain_coverage, "1.0000");
  assert.equal(v.computed_status, "outside_stated_limits_on_declared_evidence");
});

test("test_domain_missing_from_list_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.preparation_domains = ["self_awareness", "self_management",
                           "relationship_management"];
  const v = evaluate(m);
  assert.equal(checkStatus(v, "preparation_domains_cover_all_four_in_stated_order"), "fail");
  assert.deepEqual(v.preparation_domains_missing, ["social_awareness"]);
  assert.equal(v.preparation_domain_coverage, "0.7500");
});

test("test_unknown_domain_entry_fails", () => {
  const m = clone(COMPLETE) as any;
  m.preparation_domains = ["self_awareness", "self_management",
                           "social_awareness", "relationship_management",
                           "mind_reading"];
  const v = evaluate(m);
  assert.equal(checkStatus(v, "preparation_domains_cover_all_four_in_stated_order"), "fail");
});

test("test_empty_domains_list_fails", () => {
  const m = clone(COMPLETE) as any;
  m.preparation_domains = [];
  const v = evaluate(m);
  assert.equal(checkStatus(v, "preparation_domains_declared"), "fail");
  assert.equal(v.preparation_domains_count, 0);
  assert.equal(v.preparation_domain_coverage, "0.0000");
  assert.deepEqual(v.preparation_domains_missing,
    ["self_awareness", "self_management", "social_awareness",
     "relationship_management"]);
});

test("test_feedback_point_missing_impact_fails_sbi_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.feedback_points[1].impact_stated = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "CONVERSATION_PREPARATION_INCOMPLETE");
  assert.equal(checkStatus(v, "every_feedback_point_sbi_complete"), "fail");
  assert.deepEqual(v.feedback_points_without_complete_sbi, ["escalation_tone"]);
  assert.equal(v.sbi_coverage, "0.5000");
});

test("test_feedback_point_missing_sbi_field_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.feedback_points[0].impact_stated;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "every_feedback_point_sbi_complete"), "missing");
  assert.deepEqual(v.feedback_points_without_complete_sbi, ["missed_deadline"]);
});

test("test_feedback_point_targeting_identity_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.feedback_points[0].targets_identity = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "CONVERSATION_PREPARATION_INCOMPLETE");
  assert.equal(checkStatus(v, "no_feedback_point_targets_identity"), "fail");
  assert.deepEqual(v.feedback_points_targeting_identity, ["missed_deadline"]);
});

test("test_no_feedback_to_give_passes_feedback_checks_as_na", () => {
  const m = clone(COMPLETE) as any;
  m.feedback.feedback_to_be_given = false;
  delete m.feedback_points;
  const v = evaluate(m);
  assert.equal(v.verdict, "CONVERSATION_PREPARATION_COMPLETE");
  assert.equal(checkStatus(v, "feedback_points_declared_when_feedback_to_be_given"), "pass");
  assert.equal(checkStatus(v, "every_feedback_point_sbi_complete"), "pass");
  assert.equal(v.feedback_points_count, null);
  assert.equal(v.sbi_coverage, null);
});

test("test_feedback_gate_missing_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.feedback;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "every_feedback_point_sbi_complete"), "missing");
});

test("test_hostility_mirroring_fails", () => {
  const m = clone(COMPLETE) as any;
  m.framing.hostility_mirroring_present = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "CONVERSATION_PREPARATION_INCOMPLETE");
  assert.equal(v.sections["framing_and_assertiveness"], "fail");
});

test("test_own_part_not_owned_fails", () => {
  const m = clone(COMPLETE) as any;
  m.structure.own_part_owned = false;
  assert.equal(evaluate(m).verdict, "CONVERSATION_PREPARATION_INCOMPLETE");
});

test("test_no_concrete_next_step_fails", () => {
  const m = clone(COMPLETE) as any;
  m.structure.concrete_next_step_proposed = false;
  assert.equal(evaluate(m).verdict, "CONVERSATION_PREPARATION_INCOMPLETE");
});

test("test_target_on_do_not_respond_list_fails", () => {
  const m = clone(COMPLETE) as any;
  m.safeguards.target_on_do_not_respond_list = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "CONVERSATION_PREPARATION_INCOMPLETE");
  assert.equal(v.sections["safeguards_repair_and_close"], "fail");
});

test("test_repair_move_missing_when_thread_soured", () => {
  const m = clone(COMPLETE) as any;
  delete m.repair.repair_move_planned;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "repair_move_planned_when_thread_soured"), "missing");
});

test("test_repair_move_not_planned_when_thread_soured_fails", () => {
  const m = clone(COMPLETE) as any;
  m.repair.repair_move_planned = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "CONVERSATION_PREPARATION_INCOMPLETE");
  assert.equal(checkStatus(v, "repair_move_planned_when_thread_soured"), "fail");
});

test("test_no_soured_thread_passes_repair_check_as_na", () => {
  const m = clone(COMPLETE) as any;
  m.repair.thread_has_soured = false;
  delete m.repair.repair_move_planned;
  const v = evaluate(m);
  assert.equal(v.verdict, "CONVERSATION_PREPARATION_COMPLETE");
  assert.equal(checkStatus(v, "repair_move_planned_when_thread_soured"), "pass");
});

test("test_winning_argument_losing_relationship_fails", () => {
  const m = clone(COMPLETE) as any;
  m.repair.winning_argument_losing_relationship_present = true;
  assert.equal(evaluate(m).verdict, "CONVERSATION_PREPARATION_INCOMPLETE");
});

test("test_absent_evidence_is_insufficient_not_failed", () => {
  const m = clone(COMPLETE) as any;
  delete m.empathy;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["empathy_and_social_awareness"], "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.ok(v.checks.every((c) => c.status === "missing"));
  assert.equal(v.computed_status, null);
  assert.equal(v.preparation_domains_count, null);
  assert.equal(v.preparation_domains_missing, null);
  assert.equal(v.preparation_domain_coverage, null);
  assert.equal(v.feedback_points_without_complete_sbi, null);
  assert.equal(v.sbi_coverage, null);
});

test("test_stamp_names_the_verdict", () => {
  assert.ok(stamp(evaluate(clone(COMPLETE))).includes("VERDICT: CONVERSATION_PREPARATION_COMPLETE"));
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

test("malformed: string field as number rejected", () => {
  const m = clone(COMPLETE) as any;
  m.conversation_title = 12345;
  assert.throws(() => evaluate(m), fieldError("conversation_title"));
});

test("malformed: object section as string rejected", () => {
  assert.throws(
    () => evaluate({ empathy: "should-be-an-object" }),
    fieldError("empathy"),
  );
});

test("malformed: list field as object rejected", () => {
  assert.throws(
    () => evaluate({ feedback_points: { name: "x" } }),
    fieldError("feedback_points"),
  );
});

test("malformed: list entry as string rejected", () => {
  assert.throws(
    () => evaluate({ feedback_points: ["missed_deadline"] }),
    fieldError("feedback_points[0]"),
  );
});

test("malformed: domains list entry as number rejected", () => {
  assert.throws(
    () => evaluate({ preparation_domains: [42] }),
    fieldError("preparation_domains[0]"),
  );
});

test("malformed: domains as string rejected", () => {
  assert.throws(
    () => evaluate({ preparation_domains: "self_awareness" }),
    fieldError("preparation_domains"),
  );
});

test("malformed: boolean leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.self_awareness.emotion_named = "yes";
  assert.throws(() => evaluate(m), fieldError("self_awareness.emotion_named"));
});

test("malformed: nested list entry string field rejected", () => {
  const m = clone(COMPLETE) as any;
  m.feedback_points[1].name = 42;
  assert.throws(() => evaluate(m), fieldError("feedback_points[1].name"));
});

test("malformed: nested list entry boolean field rejected", () => {
  const m = clone(COMPLETE) as any;
  m.feedback_points[0].targets_identity = "no";
  assert.throws(() => evaluate(m), fieldError("feedback_points[0].targets_identity"));
});

test("malformed: null section rejected", () => {
  const m = clone(COMPLETE) as any;
  m.repair = null;
  assert.throws(() => evaluate(m), fieldError("repair"));
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
  .filter((f) => f.startsWith("difficult-conversation-coaching--") && f.endsWith(".json"))
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
