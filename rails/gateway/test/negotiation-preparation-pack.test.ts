import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/negotiation-preparation-pack.js";
import { FieldTypeError } from "../src/atoms/validate.js";

const COMPLETE: Record<string, unknown> = {
  negotiation: "vendor-escalation-renewal",
  batna_and_reservation: { batna_identified: true,
                           batna_strengthened: true,
                           reservation_price_set: true,
                           counterpart_reservation_estimated: true,
                           zopa_assessed: true,
                           walk_away_commitment_declared: true,
                           fundamentals_prepared_before_negotiation: true },
  interests: { own_interests_identified: true,
               counterpart_interests_identified: true,
               counterpart_why_to_be_asked_planned: true,
               interests_not_positions_framing_adopted: true },
  value_creation: { value_created_before_claiming_planned: true,
                    non_zero_sum_opportunities_sought: true,
                    trade_across_differently_valued_issues_planned: true },
  issues: [
    { name: "price", own_underlying_interest: "predictable-cost",
      counterpart_underlying_interest: "margin-protection",
      trade_potential_assessed: true },
    { name: "term-length", own_underlying_interest: "flexibility",
      counterpart_underlying_interest: "revenue-certainty",
      trade_potential_assessed: true },
    { name: "support-level", own_underlying_interest: "uptime",
      counterpart_underlying_interest: "staffing-cost",
      trade_potential_assessed: true },
  ],
  direction: { sense_of_direction_stated: true,
               plan_not_script_approach_adopted: true,
               plan_b_prepared: true,
               plan_c_prepared: true },
  presence_and_awareness: { own_emotional_state_management_planned: true,
                            composure_commitment_declared: true,
                            situational_awareness_planned: true },
  sequence: { opening_planned: true,
              critical_moments_recognition_planned: true,
              closing_cleanly_planned: true },
  anchoring: { informed_enough_to_anchor_first: true,
               anchor_first_planned: true },
  tactics: { counterpart_yes_made_easy_planned: true,
             people_separated_from_problem_declared: true,
             hard_on_problem_soft_on_person_declared: true,
             fair_enough_agreement_aim_declared: true },
  learning: { debrief_planned_after_negotiation: true,
              deliberate_debrief_review_committed: true,
              misleading_feedback_caution_acknowledged: true },
  red_lines: { no_batna_present: false,
               arguing_positions_present: false,
               treating_everything_as_zero_sum_present: false,
               rigid_script_reliance_present: false,
               losing_composure_present: false,
               never_debriefing_present: false },
};

const UNINFORMED_COMPLETE: Record<string, unknown> = (() => {
  const m = clone(COMPLETE) as any;
  m.anchoring = { informed_enough_to_anchor_first: false,
                  anchor_first_planned: false };
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
  assert.equal(v.verdict, "NEGOTIATION_PREPARATION_SOUND");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.checks.length, 44);
  assert.equal(v.computed_status, "within_stated_limits_on_declared_evidence");
  assert.equal(v.issues_count, 3);
  assert.deepEqual(v.issues_without_own_interest, []);
  assert.equal(v.own_interest_coverage, "1.000000");
  assert.deepEqual(v.issues_without_counterpart_interest, []);
  assert.equal(v.counterpart_interest_coverage, "1.000000");
  assert.deepEqual(v.issues_without_trade_potential_assessed, []);
  assert.equal(v.trade_potential_assessed_coverage, "1.000000");
  assert.deepEqual(v.duplicate_issue_names, []);
});

test("test_uninformed_complete_is_sound", () => {
  const v = evaluate(clone(UNINFORMED_COMPLETE));
  assert.equal(v.verdict, "NEGOTIATION_PREPARATION_SOUND");
  assert.equal(checkStatus(v, "anchor_first_planned_when_informed"), "pass");
});

test("test_no_batna_identified_fails_section1", () => {
  const m = clone(COMPLETE) as any;
  m.batna_and_reservation.batna_identified = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "NEGOTIATION_PREPARATION_NOT_SOUND");
  assert.equal(v.sections["batna_reservation_price_and_zopa"], "fail");
  assert.equal(checkStatus(v, "batna_identified"), "fail");
});

test("test_batna_not_strengthened_fails", () => {
  const m = clone(COMPLETE) as any;
  m.batna_and_reservation.batna_strengthened = false;
  assert.equal(evaluate(m).verdict, "NEGOTIATION_PREPARATION_NOT_SOUND");
});

test("test_no_reservation_price_fails", () => {
  const m = clone(COMPLETE) as any;
  m.batna_and_reservation.reservation_price_set = false;
  assert.equal(checkStatus(evaluate(m), "reservation_price_set"), "fail");
});

test("test_zopa_not_assessed_fails", () => {
  const m = clone(COMPLETE) as any;
  m.batna_and_reservation.zopa_assessed = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "zopa_assessed"), "fail");
  assert.equal(v.sections["batna_reservation_price_and_zopa"], "fail");
});

test("test_positions_framing_fails_section2", () => {
  const m = clone(COMPLETE) as any;
  m.interests.interests_not_positions_framing_adopted = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "NEGOTIATION_PREPARATION_NOT_SOUND");
  assert.equal(v.sections["interests_and_value_creation"], "fail");
});

test("test_claiming_before_creating_value_fails", () => {
  const m = clone(COMPLETE) as any;
  m.value_creation.value_created_before_claiming_planned = false;
  assert.equal(checkStatus(evaluate(m), "value_created_before_claiming_planned"), "fail");
});

test("test_issue_without_own_interest_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.issues[0].own_underlying_interest = "";
  const v = evaluate(m);
  assert.equal(v.verdict, "NEGOTIATION_PREPARATION_NOT_SOUND");
  assert.equal(checkStatus(v, "every_issue_names_own_underlying_interest"), "fail");
  assert.deepEqual(v.issues_without_own_interest, ["price"]);
  assert.equal(v.own_interest_coverage, "0.666667");
  assert.equal(v.computed_status, "outside_stated_limits_on_declared_evidence");
});

test("test_issue_missing_own_interest_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.issues[0].own_underlying_interest;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "every_issue_names_own_underlying_interest"), "missing");
  assert.deepEqual(v.issues_without_own_interest, []);
});

test("test_issue_without_counterpart_interest_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.issues[1].counterpart_underlying_interest = "";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_issue_names_counterpart_underlying_interest"), "fail");
  assert.deepEqual(v.issues_without_counterpart_interest, ["term-length"]);
  assert.equal(v.counterpart_interest_coverage, "0.666667");
});

test("test_issue_without_trade_potential_assessed_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.issues[2].trade_potential_assessed = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_issue_trade_potential_assessed"), "fail");
  assert.deepEqual(v.issues_without_trade_potential_assessed, ["support-level"]);
  assert.equal(v.trade_potential_assessed_coverage, "0.666667");
});

test("test_issue_missing_trade_field_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.issues[2].trade_potential_assessed;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "every_issue_trade_potential_assessed"), "missing");
});

test("test_duplicate_issue_name_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.issues[2].name = "price";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_issue_name_duplicated"), "fail");
  assert.deepEqual(v.duplicate_issue_names, ["price"]);
});

test("test_issue_missing_name_is_missing_for_duplicate_check", () => {
  const m = clone(COMPLETE) as any;
  delete m.issues[2].name;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "no_issue_name_duplicated"), "missing");
  assert.deepEqual(v.duplicate_issue_names, []);
});

test("test_empty_issues_list_fails", () => {
  const m = clone(COMPLETE) as any;
  m.issues = [];
  const v = evaluate(m);
  assert.equal(checkStatus(v, "issues_declared"), "fail");
  assert.equal(v.issues_count, 0);
  assert.equal(v.own_interest_coverage, null);
  assert.equal(v.counterpart_interest_coverage, null);
  assert.equal(v.trade_potential_assessed_coverage, null);
  assert.deepEqual(v.duplicate_issue_names, []);
});

test("test_no_plan_b_fails_section3", () => {
  const m = clone(COMPLETE) as any;
  m.direction.plan_b_prepared = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "NEGOTIATION_PREPARATION_NOT_SOUND");
  assert.equal(v.sections["improvisation_and_adaptation"], "fail");
});

test("test_no_plan_c_fails", () => {
  const m = clone(COMPLETE) as any;
  m.direction.plan_c_prepared = false;
  assert.equal(checkStatus(evaluate(m), "plan_c_prepared"), "fail");
});

test("test_no_situational_awareness_fails", () => {
  const m = clone(COMPLETE) as any;
  m.presence_and_awareness.situational_awareness_planned = false;
  assert.equal(checkStatus(evaluate(m), "situational_awareness_planned"), "fail");
});

test("test_anchor_gate_absent_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.anchoring.informed_enough_to_anchor_first;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "anchoring_applicability_declared"), "missing");
  assert.equal(checkStatus(v, "anchor_first_planned_when_informed"), "missing");
});

test("test_informed_without_anchor_first_fails", () => {
  const m = clone(COMPLETE) as any;
  m.anchoring.anchor_first_planned = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "anchor_first_planned_when_informed"), "fail");
  assert.equal(v.verdict, "NEGOTIATION_PREPARATION_NOT_SOUND");
});

test("test_uninformed_anchor_fields_false_still_pass", () => {
  const v = evaluate(clone(UNINFORMED_COMPLETE));
  assert.equal(checkStatus(v, "anchor_first_planned_when_informed"), "pass");
});

test("test_anchor_field_absent_with_gate_true_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.anchoring.anchor_first_planned;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "anchor_first_planned_when_informed"), "missing");
});

test("test_no_closing_plan_fails_section4", () => {
  const m = clone(COMPLETE) as any;
  m.sequence.closing_cleanly_planned = false;
  const v = evaluate(m);
  assert.equal(v.sections["openings_moments_closing_and_tactics"], "fail");
});

test("test_people_merged_with_problem_fails", () => {
  const m = clone(COMPLETE) as any;
  m.tactics.people_separated_from_problem_declared = false;
  assert.equal(checkStatus(evaluate(m), "people_separated_from_problem_declared"), "fail");
});

test("test_no_debrief_planned_fails_section5", () => {
  const m = clone(COMPLETE) as any;
  m.learning.debrief_planned_after_negotiation = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "NEGOTIATION_PREPARATION_NOT_SOUND");
  assert.equal(v.sections["debrief_and_anti_pattern_red_lines"], "fail");
});

test("test_no_batna_red_line_fails", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.no_batna_present = true;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_batna"), "fail");
  assert.equal(v.sections["debrief_and_anti_pattern_red_lines"], "fail");
});

test("test_zero_sum_and_rigid_script_red_lines_fail", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.treating_everything_as_zero_sum_present = true;
  m.red_lines.rigid_script_reliance_present = true;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_zero_sum_treatment"), "fail");
  assert.equal(checkStatus(v, "no_rigid_script_reliance"), "fail");
});

test("test_never_debriefing_red_line_fails", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.never_debriefing_present = true;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_never_debriefing"), "fail");
  assert.equal(v.verdict, "NEGOTIATION_PREPARATION_NOT_SOUND");
});

test("test_absent_evidence_is_insufficient_not_failed", () => {
  const m = clone(COMPLETE) as any;
  delete m.learning;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["debrief_and_anti_pattern_red_lines"], "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.ok(v.checks.every((c) => c.status === "missing"));
  assert.equal(v.computed_status, null);
  assert.equal(v.issues_count, null);
  assert.equal(v.issues_without_own_interest, null);
  assert.equal(v.own_interest_coverage, null);
  assert.equal(v.issues_without_counterpart_interest, null);
  assert.equal(v.counterpart_interest_coverage, null);
  assert.equal(v.issues_without_trade_potential_assessed, null);
  assert.equal(v.trade_potential_assessed_coverage, null);
  assert.equal(v.duplicate_issue_names, null);
});

test("test_stamp_names_the_verdict", () => {
  assert.ok(stamp(evaluate(clone(COMPLETE))).includes("VERDICT: NEGOTIATION_PREPARATION_SOUND"));
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
  m.negotiation = 12345;
  assert.throws(() => evaluate(m), fieldError("negotiation"));
});

test("malformed: object section as string rejected", () => {
  assert.throws(() => evaluate({ interests: "should-be-an-object" }), fieldError("interests"));
});

test("malformed: list field as object rejected", () => {
  assert.throws(() => evaluate({ issues: { name: "price" } }), fieldError("issues"));
});

test("malformed: list entry as string rejected", () => {
  assert.throws(() => evaluate({ issues: ["price"] }), fieldError("issues[0]"));
});

test("malformed: boolean leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.batna_and_reservation.batna_identified = "yes";
  assert.throws(() => evaluate(m), fieldError("batna_and_reservation.batna_identified"));
});

test("malformed: nested list entry string field rejected", () => {
  const m = clone(COMPLETE) as any;
  m.issues[0].name = 42;
  assert.throws(() => evaluate(m), fieldError("issues[0].name"));
});

test("malformed: nested list entry boolean as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.issues[1].trade_potential_assessed = "true";
  assert.throws(() => evaluate(m), fieldError("issues[1].trade_potential_assessed"));
});

test("malformed: null section rejected", () => {
  const m = clone(COMPLETE) as any;
  m.anchoring = null;
  assert.throws(() => evaluate(m), fieldError("anchoring"));
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
  .filter((f) => f.startsWith("negotiation-preparation-pack--") && f.endsWith(".json"))
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
