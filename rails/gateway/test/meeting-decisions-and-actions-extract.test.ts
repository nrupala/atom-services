import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/meeting-decisions-and-actions-extract.js";
import { FieldTypeError } from "../src/atoms/validate.js";

const COMPLETE: Record<string, unknown> = {
  meeting: "weekly-ops-2026-11-10",
  source: { read_in_full: true, attendees_recorded: true,
            meeting_date_recorded: true, meeting_identity_confirmed: true,
            absent_attendees_named_when_relevant: true,
            speaker_attribution_kept_where_it_matters: true,
            numbers_dates_amounts_copied_exactly: true,
            names_spelled_as_in_source_or_contacts: true },
  decisions_record: { decisions_stated_close_to_source_wording: true,
                      inferred_items_labelled_as_inferred: true },
  decisions: [
    { name: "ship-date", source_anchor: "notes p.1",
      faithful_to_source: true, is_inferred: false,
      inference_marked: false },
    { name: "budget-cap", source_anchor: "transcript 12:40",
      faithful_to_source: true, is_inferred: true,
      inference_marked: true },
  ],
  actions_record: { owners_and_due_dates_drawn_from_source: true,
                    loose_deadlines_flagged_not_guessed: true },
  actions: [
    { name: "send-quote", owner: "Priya", due_date: "2026-11-14",
      source_anchor: "notes p.2" },
    { name: "book-site-visit", owner: "Omar", due_date: "2026-11-17",
      source_anchor: "transcript 31:05" },
  ],
  open_questions_record: {
    unresolved_items_collected_separately: true,
    ownerless_we_should_listed_as_open_questions: true,
    prior_open_items_carried_forward_visibly: true },
  open_questions: [
    { name: "hire-contractor", source_anchor: "notes p.3" },
  ],
  recap: { decisions_first_then_actions_then_open_questions: true,
           concise_enough_to_be_read: true,
           shown_as_draft_before_any_send: true },
  handoff: {
    confirmed_actions_handed_off_with_owners_and_dates_on_approval: true,
    recap_sent_only_through_directed_channel_on_approval: true },
  red_lines: {
    inferred_decision_presented_as_made_present: false,
    invented_owner_or_due_date_present: false,
    recap_sent_without_approval_present: false,
    unresolved_question_dropped_for_cleanliness_present: false,
    meeting_contents_disclosed_beyond_named_attendees_present: false },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function checkStatus(v: ReturnType<typeof evaluate>, name: string) {
  return v.checks.find((c) => c.check === name)?.status;
}

test("test_complete_manifest_is_sound", () => {
  const v = evaluate(clone(COMPLETE));
  assert.equal(v.verdict, "MEETING_EXTRACTION_SOUND");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.checks.length, 35);
  assert.equal(v.computed_status, "within_stated_limits_on_declared_evidence");
  assert.equal(v.decisions_count, 2);
  assert.deepEqual(v.decisions_without_source_anchor, []);
  assert.equal(v.decision_anchor_coverage, "1.000000");
  assert.deepEqual(v.decisions_not_faithful, []);
  assert.equal(v.decision_faithful_coverage, "1.000000");
  assert.deepEqual(v.inferred_decisions_unmarked, []);
  assert.equal(v.inferred_marking_coverage, "1.000000");
  assert.equal(v.actions_count, 2);
  assert.deepEqual(v.actions_without_owner, []);
  assert.equal(v.action_owner_coverage, "1.000000");
  assert.deepEqual(v.actions_without_due_date, []);
  assert.equal(v.action_due_date_coverage, "1.000000");
  assert.deepEqual(v.actions_without_source_anchor, []);
  assert.equal(v.action_anchor_coverage, "1.000000");
  assert.equal(v.open_questions_count, 1);
  assert.deepEqual(v.open_questions_without_source_anchor, []);
  assert.equal(v.open_question_anchor_coverage, "1.000000");
});

test("test_source_not_read_in_full_fails_source_section", () => {
  const m = clone(COMPLETE) as any;
  m.source.read_in_full = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "MEETING_EXTRACTION_NOT_SOUND");
  assert.equal(v.sections["source_and_meeting_identity"], "fail");
  assert.equal(checkStatus(v, "source_read_in_full"), "fail");
});

test("test_attendees_not_recorded_fails", () => {
  const m = clone(COMPLETE) as any;
  m.source.attendees_recorded = false;
  assert.equal(checkStatus(evaluate(m), "attendees_recorded"), "fail");
});

test("test_numbers_not_copied_exactly_fails", () => {
  const m = clone(COMPLETE) as any;
  m.source.numbers_dates_amounts_copied_exactly = false;
  assert.equal(evaluate(m).verdict, "MEETING_EXTRACTION_NOT_SOUND");
});

test("test_decisions_not_close_to_wording_fails_decisions_section", () => {
  const m = clone(COMPLETE) as any;
  m.decisions_record.decisions_stated_close_to_source_wording = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "MEETING_EXTRACTION_NOT_SOUND");
  assert.equal(v.sections["decisions_fidelity"], "fail");
});

test("test_decision_with_empty_anchor_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.decisions[0].source_anchor = "";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_decision_has_source_anchor"), "fail");
  assert.deepEqual(v.decisions_without_source_anchor, ["ship-date"]);
  assert.equal(v.decision_anchor_coverage, "0.500000");
  assert.equal(v.computed_status, "outside_stated_limits_on_declared_evidence");
});

test("test_decision_missing_anchor_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.decisions[0].source_anchor;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "every_decision_has_source_anchor"), "missing");
  assert.deepEqual(v.decisions_without_source_anchor, []);
});

test("test_decision_not_faithful_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.decisions[1].faithful_to_source = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_decision_faithful_to_source"), "fail");
  assert.deepEqual(v.decisions_not_faithful, ["budget-cap"]);
  assert.equal(v.decision_faithful_coverage, "0.500000");
});

test("test_inferred_decision_unmarked_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.decisions[1].inference_marked = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_inferred_decision_marked"), "fail");
  assert.deepEqual(v.inferred_decisions_unmarked, ["budget-cap"]);
  assert.equal(v.inferred_marking_coverage, "0.000000");
});

test("test_inferred_decision_missing_mark_field_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.decisions[1].inference_marked;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "every_inferred_decision_marked"), "missing");
  assert.deepEqual(v.inferred_decisions_unmarked, []);
});

test("test_no_inferred_decisions_marking_coverage_is_null", () => {
  const m = clone(COMPLETE) as any;
  m.decisions[1].is_inferred = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "MEETING_EXTRACTION_SOUND");
  assert.equal(v.inferred_marking_coverage, null);
  assert.equal(checkStatus(v, "every_inferred_decision_marked"), "pass");
});

test("test_empty_decisions_list_fails", () => {
  const m = clone(COMPLETE) as any;
  m.decisions = [];
  const v = evaluate(m);
  assert.equal(checkStatus(v, "decisions_declared"), "fail");
  assert.equal(v.decisions_count, 0);
  assert.equal(v.decision_anchor_coverage, null);
  assert.equal(v.inferred_marking_coverage, null);
});

test("test_action_with_empty_owner_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.actions[0].owner = "";
  const v = evaluate(m);
  assert.equal(v.verdict, "MEETING_EXTRACTION_NOT_SOUND");
  assert.equal(v.sections["action_ownership_and_dates"], "fail");
  assert.equal(checkStatus(v, "every_action_has_named_owner"), "fail");
  assert.deepEqual(v.actions_without_owner, ["send-quote"]);
  assert.equal(v.action_owner_coverage, "0.500000");
});

test("test_action_missing_owner_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.actions[0].owner;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "every_action_has_named_owner"), "missing");
  assert.deepEqual(v.actions_without_owner, []);
});

test("test_action_with_empty_due_date_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.actions[1].due_date = "";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_action_has_due_date"), "fail");
  assert.deepEqual(v.actions_without_due_date, ["book-site-visit"]);
  assert.equal(v.action_due_date_coverage, "0.500000");
});

test("test_action_with_empty_anchor_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.actions[1].source_anchor = "";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_action_has_source_anchor"), "fail");
  assert.deepEqual(v.actions_without_source_anchor, ["book-site-visit"]);
  assert.equal(v.action_anchor_coverage, "0.500000");
});

test("test_loose_deadlines_guessed_fails_actions_section", () => {
  const m = clone(COMPLETE) as any;
  m.actions_record.loose_deadlines_flagged_not_guessed = false;
  assert.equal(evaluate(m).sections["action_ownership_and_dates"], "fail");
});

test("test_empty_actions_list_fails", () => {
  const m = clone(COMPLETE) as any;
  m.actions = [];
  const v = evaluate(m);
  assert.equal(checkStatus(v, "actions_declared"), "fail");
  assert.equal(v.actions_count, 0);
  assert.equal(v.action_owner_coverage, null);
});

test("test_ownerless_we_should_not_listed_fails_open_section", () => {
  const m = clone(COMPLETE) as any;
  m.open_questions_record.ownerless_we_should_listed_as_open_questions = false;
  assert.equal(evaluate(m).sections["open_questions_and_carry_forward"], "fail");
});

test("test_open_question_with_empty_anchor_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.open_questions[0].source_anchor = "";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_open_question_has_source_anchor"), "fail");
  assert.deepEqual(v.open_questions_without_source_anchor, ["hire-contractor"]);
  assert.equal(v.open_question_anchor_coverage, "0.000000");
});

test("test_empty_open_questions_list_passes_declared", () => {
  const m = clone(COMPLETE) as any;
  m.open_questions = [];
  const v = evaluate(m);
  assert.equal(v.verdict, "MEETING_EXTRACTION_SOUND");
  assert.equal(checkStatus(v, "open_questions_declared"), "pass");
  assert.equal(checkStatus(v, "every_open_question_has_source_anchor"), "pass");
  assert.equal(v.open_questions_count, 0);
  assert.equal(v.open_question_anchor_coverage, null);
});

test("test_recap_not_shown_as_draft_fails_recap_section", () => {
  const m = clone(COMPLETE) as any;
  m.recap.shown_as_draft_before_any_send = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "MEETING_EXTRACTION_NOT_SOUND");
  assert.equal(v.sections["recap_draft_and_handoff"], "fail");
  assert.equal(checkStatus(v, "recap_shown_as_draft_before_any_send"), "fail");
});

test("test_handoff_without_owners_dates_fails", () => {
  const m = clone(COMPLETE) as any;
  m.handoff.confirmed_actions_handed_off_with_owners_and_dates_on_approval = false;
  assert.equal(checkStatus(evaluate(m), "confirmed_actions_handed_off_on_approval"), "fail");
});

test("test_inferred_presented_as_made_fails_red_lines", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.inferred_decision_presented_as_made_present = true;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_inferred_decision_presented_as_made"), "fail");
  assert.equal(v.sections["red_lines"], "fail");
});

test("test_invented_owner_fails_red_lines", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.invented_owner_or_due_date_present = true;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_invented_owner_or_due_date"), "fail");
  assert.equal(v.verdict, "MEETING_EXTRACTION_NOT_SOUND");
});

test("test_recap_sent_without_approval_fails_red_lines", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.recap_sent_without_approval_present = true;
  assert.equal(checkStatus(evaluate(m), "no_recap_sent_without_approval"), "fail");
});

test("test_dropped_question_and_disclosure_fail_red_lines", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.unresolved_question_dropped_for_cleanliness_present = true;
  m.red_lines.meeting_contents_disclosed_beyond_named_attendees_present = true;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_unresolved_question_dropped_for_cleanliness"), "fail");
  assert.equal(checkStatus(v, "no_disclosure_beyond_named_attendees"), "fail");
});

test("test_absent_evidence_is_insufficient_not_failed", () => {
  const m = clone(COMPLETE) as any;
  delete m.recap;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["recap_draft_and_handoff"], "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.ok(v.checks.every((c) => c.status === "missing"));
  assert.equal(v.computed_status, null);
  assert.equal(v.decisions_count, null);
  assert.equal(v.decisions_without_source_anchor, null);
  assert.equal(v.decision_anchor_coverage, null);
  assert.equal(v.inferred_marking_coverage, null);
  assert.equal(v.actions_count, null);
  assert.equal(v.actions_without_owner, null);
  assert.equal(v.action_owner_coverage, null);
  assert.equal(v.open_questions_count, null);
  assert.equal(v.open_question_anchor_coverage, null);
});

test("test_stamp_names_the_verdict", () => {
  assert.ok(stamp(evaluate(clone(COMPLETE))).includes("VERDICT: MEETING_EXTRACTION_SOUND"));
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
  m.meeting = 12345;
  assert.throws(() => evaluate(m), fieldError("meeting"));
});

test("malformed: object section as string rejected", () => {
  assert.throws(() => evaluate({ source: "should-be-an-object" }), fieldError("source"));
});

test("malformed: list field as object rejected", () => {
  assert.throws(() => evaluate({ decisions: { name: "ship-date" } }), fieldError("decisions"));
});

test("malformed: list entry as string rejected", () => {
  assert.throws(() => evaluate({ actions: ["send-quote"] }), fieldError("actions[0]"));
});

test("malformed: boolean leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.source.read_in_full = "yes";
  assert.throws(() => evaluate(m), fieldError("source.read_in_full"));
});

test("malformed: nested list entry string field rejected", () => {
  const m = clone(COMPLETE) as any;
  m.actions[0].owner = 42;
  assert.throws(() => evaluate(m), fieldError("actions[0].owner"));
});

test("malformed: nested list entry boolean as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.decisions[1].is_inferred = "true";
  assert.throws(() => evaluate(m), fieldError("decisions[1].is_inferred"));
});

test("malformed: null section rejected", () => {
  const m = clone(COMPLETE) as any;
  m.recap = null;
  assert.throws(() => evaluate(m), fieldError("recap"));
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
  .filter((f) => f.startsWith("meeting-decisions-and-actions-extract--") && f.endsWith(".json"))
  .sort();

assert.ok(fixtureFiles.length > 0, "no golden fixtures found for this atom");

for (const file of fixtureFiles) {
  const fixture = JSON.parse(
    readFileSync(path.join(fixturesDir, file), "utf-8"),
  ) as Fixture;
  test(`golden fixture parity: ${fixture.name}`, () => {
    const actual = evaluate(fixture.manifest);
    assert.deepStrictEqual(actual, fixture.expected);
    assert.equal(
      JSON.stringify(actual),
      JSON.stringify(fixture.expected),
    );
    assert.equal(typeof stamp(actual), "string");
  });
}
