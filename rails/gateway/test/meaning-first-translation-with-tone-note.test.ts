import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/meaning-first-translation-with-tone-note.js";
import { FieldTypeError } from "../src/atoms/validate.js";

const COMPLETE: Record<string, unknown> = {
  document: "cousin-message",
  context: { source_language_identified: true,
             target_language_identified: true,
             purpose_identified: true,
             whole_text_read_before_translation: true,
             translated_for_meaning_not_word_for_word: true,
             everyday_scope_not_software_localisation: true },
  tone: { register_preserved: true,
          tone_and_intent_preserved: true,
          tone_note_provided_for_sends: true,
          tone_variant_offered_only_when_real_choice: true,
          could_offend_or_mislead_phrases_flagged_first: true,
          honorifics_and_family_terms_matched_to_relationship: true,
          voice_preserved: true,
          translation_ready_to_paste_or_speak_for_sends: true },
  handling: { idioms_flagged_and_explained: true,
              ambiguities_named_with_both_readings: true,
              flagged_items_given_short_note_not_lecture: true,
              uncertain_or_illegible_passages_marked_as_uncertain: true,
              source_unclear_uncertainty_and_reason_stated: true },
  segments: [
    { name: "greeting", has_translation: true, meaning_preserved: true,
      idiom_ambiguity_handling_complete: true,
      exact_carryover_checked: true },
    { name: "visit-plan", has_translation: true, meaning_preserved: true,
      idiom_ambiguity_handling_complete: true,
      exact_carryover_checked: true },
    { name: "closing", has_translation: true, meaning_preserved: true,
      idiom_ambiguity_handling_complete: true,
      exact_carryover_checked: true },
  ],
  carryover: { names_numbers_dates_figures_checked_one_by_one: true },
  carryover_items: [
    { name: "sender-name", kind: "name", matches_original_exactly: true },
    { name: "visit-date", kind: "date", matches_original_exactly: true },
    { name: "train-number", kind: "number", matches_original_exactly: true },
  ],
  sensitive: { sensitive_category_identified: true,
               translated_faithfully_and_completely_when_sensitive: true,
               nothing_summarised_away_when_sensitive: true,
               certified_translation_flag_raised_when_sensitive: true },
  red_lines: { draft_upgraded_to_official_present: false,
               idiom_flattened_or_firm_message_softened_silently_present: false,
               illegible_text_guessed_present: false,
               name_number_date_or_figure_changed_present: false,
               meaning_added_beyond_original_present: false },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function checkStatus(v: ReturnType<typeof evaluate>, name: string) {
  return v.checks.find((c) => c.check === name)?.status;
}

test("test_complete_manifest_is_sound", () => {
  const v = evaluate(clone(COMPLETE));
  assert.equal(v.verdict, "MEANING_FIRST_TRANSLATION_SOUND");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.checks.length, 37);
  assert.equal(v.computed_status, "within_stated_limits_on_declared_evidence");
  assert.equal(v.segments_count, 3);
  assert.deepEqual(v.segments_without_translation, []);
  assert.equal(v.translation_coverage, "1.000000");
  assert.deepEqual(v.segments_without_meaning_preserved, []);
  assert.equal(v.meaning_preserved_coverage, "1.000000");
  assert.deepEqual(v.segments_without_idiom_ambiguity_handling, []);
  assert.equal(v.idiom_ambiguity_handling_coverage, "1.000000");
  assert.deepEqual(v.segments_without_exact_carryover_check, []);
  assert.equal(v.exact_carryover_check_coverage, "1.000000");
  assert.equal(v.carryover_items_count, 3);
  assert.deepEqual(v.carryover_items_not_matching, []);
  assert.equal(v.exact_match_coverage, "1.000000");
  assert.deepEqual(v.carryover_items_with_invalid_kind, []);
  assert.equal(v.valid_kind_coverage, "1.000000");
});

test("test_whole_text_not_read_fails_context_section", () => {
  const m = clone(COMPLETE) as any;
  m.context.whole_text_read_before_translation = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "MEANING_FIRST_TRANSLATION_NOT_SOUND");
  assert.equal(v.sections["context_and_meaning_first_method"], "fail");
  assert.equal(checkStatus(v, "whole_text_read_before_translation"), "fail");
});

test("test_word_for_word_fails", () => {
  const m = clone(COMPLETE) as any;
  m.context.translated_for_meaning_not_word_for_word = false;
  assert.equal(checkStatus(evaluate(m), "translated_for_meaning_not_word_for_word"), "fail");
});

test("test_segment_without_meaning_preserved_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.segments[0].meaning_preserved = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "MEANING_FIRST_TRANSLATION_NOT_SOUND");
  assert.equal(checkStatus(v, "every_segment_meaning_preserved"), "fail");
  assert.deepEqual(v.segments_without_meaning_preserved, ["greeting"]);
  assert.equal(v.meaning_preserved_coverage, "0.666667");
  assert.equal(v.computed_status, "outside_stated_limits_on_declared_evidence");
});

test("test_segment_missing_meaning_field_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.segments[0].meaning_preserved;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "every_segment_meaning_preserved"), "missing");
  assert.deepEqual(v.segments_without_meaning_preserved, []);
});

test("test_no_tone_note_fails_tone_section", () => {
  const m = clone(COMPLETE) as any;
  m.tone.tone_note_provided_for_sends = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "MEANING_FIRST_TRANSLATION_NOT_SOUND");
  assert.equal(v.sections["register_tone_and_send_readiness"], "fail");
  assert.equal(checkStatus(v, "tone_note_provided_for_sends"), "fail");
});

test("test_register_not_preserved_fails", () => {
  const m = clone(COMPLETE) as any;
  m.tone.register_preserved = false;
  assert.equal(checkStatus(evaluate(m), "register_preserved"), "fail");
});

test("test_unflagged_offence_risk_fails", () => {
  const m = clone(COMPLETE) as any;
  m.tone.could_offend_or_mislead_phrases_flagged_first = false;
  assert.equal(checkStatus(evaluate(m), "could_offend_or_mislead_phrases_flagged_first"), "fail");
});

test("test_idioms_not_flagged_fails_handling_section", () => {
  const m = clone(COMPLETE) as any;
  m.handling.idioms_flagged_and_explained = false;
  const v = evaluate(m);
  assert.equal(v.sections["idiom_ambiguity_and_uncertainty"], "fail");
  assert.equal(checkStatus(v, "idioms_flagged_and_explained"), "fail");
});

test("test_ambiguity_single_reading_fails", () => {
  const m = clone(COMPLETE) as any;
  m.handling.ambiguities_named_with_both_readings = false;
  assert.equal(checkStatus(evaluate(m), "ambiguities_named_with_both_readings"), "fail");
});

test("test_segment_handling_incomplete_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.segments[1].idiom_ambiguity_handling_complete = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_segment_idiom_ambiguity_handling_complete"), "fail");
  assert.deepEqual(v.segments_without_idiom_ambiguity_handling, ["visit-plan"]);
  assert.equal(v.idiom_ambiguity_handling_coverage, "0.666667");
});

test("test_uncertain_passages_unmarked_fails", () => {
  const m = clone(COMPLETE) as any;
  m.handling.uncertain_or_illegible_passages_marked_as_uncertain = false;
  assert.equal(checkStatus(evaluate(m), "uncertain_or_illegible_passages_marked_as_uncertain"), "fail");
});

test("test_empty_segments_list_fails", () => {
  const m = clone(COMPLETE) as any;
  m.segments = [];
  const v = evaluate(m);
  assert.equal(checkStatus(v, "segments_declared"), "fail");
  assert.equal(v.segments_count, 0);
  assert.equal(v.translation_coverage, null);
  assert.equal(v.meaning_preserved_coverage, null);
  assert.equal(v.idiom_ambiguity_handling_coverage, null);
  assert.equal(v.exact_carryover_check_coverage, null);
});

test("test_segment_without_translation_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.segments[2].has_translation = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_segment_has_translation"), "fail");
  assert.deepEqual(v.segments_without_translation, ["closing"]);
  assert.equal(v.translation_coverage, "0.666667");
});

test("test_segment_missing_translation_field_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.segments[2].has_translation;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "every_segment_has_translation"), "missing");
  assert.deepEqual(v.segments_without_translation, []);
});

test("test_segment_carryover_unchecked_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.segments[0].exact_carryover_checked = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_segment_exact_carryover_checked"), "fail");
  assert.deepEqual(v.segments_without_exact_carryover_check, ["greeting"]);
  assert.equal(v.exact_carryover_check_coverage, "0.666667");
});

test("test_one_by_one_check_skipped_fails_carryover_section", () => {
  const m = clone(COMPLETE) as any;
  m.carryover.names_numbers_dates_figures_checked_one_by_one = false;
  const v = evaluate(m);
  assert.equal(v.sections["exact_carryover_and_segment_coverage"], "fail");
});

test("test_carryover_item_not_matching_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.carryover_items[1].matches_original_exactly = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_carryover_item_matches_exactly"), "fail");
  assert.deepEqual(v.carryover_items_not_matching, ["visit-date"]);
  assert.equal(v.exact_match_coverage, "0.666667");
});

test("test_carryover_item_with_invalid_kind_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.carryover_items[0].kind = "currency";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_carryover_kind_valid"), "fail");
  assert.deepEqual(v.carryover_items_with_invalid_kind, ["sender-name"]);
  assert.equal(v.valid_kind_coverage, "0.666667");
});

test("test_carryover_item_missing_kind_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.carryover_items[0].kind;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "every_carryover_kind_valid"), "missing");
  assert.deepEqual(v.carryover_items_with_invalid_kind, []);
});

test("test_empty_carryover_list_passes_vacuously", () => {
  const m = clone(COMPLETE) as any;
  m.carryover_items = [];
  const v = evaluate(m);
  assert.equal(v.verdict, "MEANING_FIRST_TRANSLATION_SOUND");
  assert.equal(checkStatus(v, "carryover_items_declared"), "pass");
  assert.equal(checkStatus(v, "every_carryover_item_matches_exactly"), "pass");
  assert.equal(v.carryover_items_count, 0);
  assert.equal(v.exact_match_coverage, null);
  assert.equal(v.valid_kind_coverage, null);
});

test("test_absent_carryover_list_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.carryover_items;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "carryover_items_declared"), "missing");
  assert.equal(v.carryover_items_count, null);
  assert.equal(v.carryover_items_not_matching, null);
});

test("test_no_certified_flag_fails_sensitive_section", () => {
  const m = clone(COMPLETE) as any;
  m.sensitive.certified_translation_flag_raised_when_sensitive = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "MEANING_FIRST_TRANSLATION_NOT_SOUND");
  assert.equal(v.sections["sensitive_documents_and_red_lines"], "fail");
  assert.equal(checkStatus(v, "certified_translation_flag_raised_when_sensitive"), "fail");
});

test("test_summarised_away_fails", () => {
  const m = clone(COMPLETE) as any;
  m.sensitive.nothing_summarised_away_when_sensitive = false;
  assert.equal(checkStatus(evaluate(m), "nothing_summarised_away_when_sensitive"), "fail");
});

test("test_draft_upgraded_to_official_fails_red_line", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.draft_upgraded_to_official_present = true;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_draft_upgraded_to_official"), "fail");
  assert.equal(v.sections["sensitive_documents_and_red_lines"], "fail");
});

test("test_silently_softened_firm_message_fails_red_line", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.idiom_flattened_or_firm_message_softened_silently_present = true;
  assert.equal(checkStatus(evaluate(m), "no_idiom_flattened_or_firm_message_softened_silently"), "fail");
});

test("test_guessed_illegible_text_fails_red_line", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.illegible_text_guessed_present = true;
  assert.equal(checkStatus(evaluate(m), "no_illegible_text_guessed"), "fail");
});

test("test_changed_figure_and_added_meaning_fail_red_lines", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.name_number_date_or_figure_changed_present = true;
  m.red_lines.meaning_added_beyond_original_present = true;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_name_number_date_or_figure_changed"), "fail");
  assert.equal(checkStatus(v, "no_meaning_added_beyond_original"), "fail");
  assert.equal(v.verdict, "MEANING_FIRST_TRANSLATION_NOT_SOUND");
});

test("test_absent_evidence_is_insufficient_not_failed", () => {
  const m = clone(COMPLETE) as any;
  delete m.handling;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["idiom_ambiguity_and_uncertainty"], "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.ok(v.checks.every((c) => c.status === "missing"));
  assert.equal(v.computed_status, null);
  assert.equal(v.segments_count, null);
  assert.equal(v.segments_without_translation, null);
  assert.equal(v.translation_coverage, null);
  assert.equal(v.carryover_items_count, null);
  assert.equal(v.carryover_items_not_matching, null);
  assert.equal(v.exact_match_coverage, null);
  assert.equal(v.valid_kind_coverage, null);
});

test("test_stamp_names_the_verdict", () => {
  assert.ok(stamp(evaluate(clone(COMPLETE))).includes("VERDICT: MEANING_FIRST_TRANSLATION_SOUND"));
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
  m.document = 12345;
  assert.throws(() => evaluate(m), fieldError("document"));
});

test("malformed: object section as string rejected", () => {
  assert.throws(() => evaluate({ context: "should-be-an-object" }), fieldError("context"));
});

test("malformed: list field as object rejected", () => {
  assert.throws(() => evaluate({ segments: { name: "greeting" } }), fieldError("segments"));
});

test("malformed: list entry as string rejected", () => {
  assert.throws(() => evaluate({ segments: ["greeting"] }), fieldError("segments[0]"));
});

test("malformed: boolean leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.tone.tone_note_provided_for_sends = "yes";
  assert.throws(() => evaluate(m), fieldError("tone.tone_note_provided_for_sends"));
});

test("malformed: nested list entry string field rejected", () => {
  const m = clone(COMPLETE) as any;
  m.segments[0].name = 42;
  assert.throws(() => evaluate(m), fieldError("segments[0].name"));
});

test("malformed: nested carryover kind as boolean rejected", () => {
  const m = clone(COMPLETE) as any;
  m.carryover_items[1].kind = true;
  assert.throws(() => evaluate(m), fieldError("carryover_items[1].kind"));
});

test("malformed: null section rejected", () => {
  const m = clone(COMPLETE) as any;
  m.sensitive = null;
  assert.throws(() => evaluate(m), fieldError("sensitive"));
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
  .filter((f) => f.startsWith("meaning-first-translation-with-tone-note--") && f.endsWith(".json"))
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
