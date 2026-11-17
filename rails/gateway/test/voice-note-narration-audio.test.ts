import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/voice-note-narration-audio.js";
import { FieldTypeError } from "../src/atoms/validate.js";

const COMPLETE: Record<string, unknown> = {
  production_title: "walk-briefing-audio",
  scoping: { kind_confirmed: true,
             production_kind: "narration",
             audience_noted: true,
             audience_scope: "includes_others",
             voice_confirmed_before_generation: true,
             register_confirmed_before_generation: true,
             target_length_confirmed_before_generation: true,
             confirmations_completed_before_generation: true },
  voice: { voice_kind: "original_synthetic",
           voice_selected_before_generation: true,
           uses_real_person_voice: false,
           real_person_voice_consent_recorded: false,
           voice_consent_declared: true },
  rights: { source_text_reproduction_right_declared: true,
            rights_basis_recorded: true },
  adaptation: { abbreviations_expanded: true,
                long_sentences_broken: true,
                numbers_spelled_out: true,
                links_removed: true,
                tables_and_formatting_removed: true,
                text_adapted_not_read_raw: true,
                adaptation_reviewed_for_meaning_preservation: true },
  chunking: { long_text_chunked_at_natural_breaks_where_long: true,
              narrated_chunk_by_chunk: true },
  segments: [
    { segment_id: "seg-1", section_label: "Opening",
      sequence_position: 1, duration_seconds: 62.5 },
    { segment_id: "seg-2", section_label: "Middle",
      sequence_position: 2, duration_seconds: 120.25 },
    { segment_id: "seg-3", section_label: "Close",
      sequence_position: 3, duration_seconds: 45.25 },
  ],
  audio_spec: { file_format: "mp3" },
  assembly: { audio_generated_through_voice_stack: true,
              opening_spot_checked_for_clarity_and_pace: true,
              middle_spot_checked_for_clarity_and_pace: true,
              chunks_assembled_into_one_file: true,
              assembled_order_verified: true,
              assembly_completeness_verified: true,
              total_duration_seconds_declared: 228 },
  delivery: { audio_file_delivered: true,
              total_duration_stated_in_delivery: true,
              played_through_voice_stack_only_if_requested: true,
              recipient_matches_declared_audience: true,
              ai_voice_disclosure_made: true },
  red_lines: { voice_cloned_or_imitated_without_consent_present: false,
               voice_note_sent_to_other_without_ai_disclosure_present: false,
               text_narrated_without_reproduction_right_present: false,
               generated_audio_presented_as_real_event_recording_present: false,
               source_meaning_changed_in_adaptation_present: false },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function checkStatus(v: ReturnType<typeof evaluate>, name: string) {
  return v.checks.find((c) => c.check === name)?.status;
}

test("test_complete_manifest_is_sound", () => {
  const v = evaluate(clone(COMPLETE));
  assert.equal(v.verdict, "VOICE_NOTE_NARRATION_SOUND");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.checks.length, 46);
  assert.equal(v.computed_status, "within_stated_limits_on_declared_evidence");
  assert.equal(v.voice_note_segments_count, 3);
  assert.deepEqual(v.duplicate_voice_note_segment_ids, []);
  assert.equal(v.voice_note_segment_duration_total, "228.000000");
  assert.equal(v.voice_note_total_duration_declared, "228.000000");
  assert.equal(v.segment_sequence_coverage_ratio, "1.000000");
  assert.equal(v.segment_section_label_ratio, "1.000000");
});

test("test_kind_not_confirmed_fails_section1", () => {
  const m = clone(COMPLETE) as any;
  m.scoping.kind_confirmed = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "VOICE_NOTE_NARRATION_NOT_SOUND");
  assert.equal(v.sections["production_scoping_and_confirmation"], "fail");
  assert.equal(checkStatus(v, "voice_note_narration_kind_confirmed"), "fail");
});

test("test_invalid_production_kind_fails", () => {
  const m = clone(COMPLETE) as any;
  m.scoping.production_kind = "podcast_episode";
  assert.equal(checkStatus(evaluate(m), "voice_note_narration_production_kind_recognised"), "fail");
});

test("test_voice_note_kind_passes", () => {
  const m = clone(COMPLETE) as any;
  m.scoping.production_kind = "voice_note";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "voice_note_narration_production_kind_recognised"), "pass");
  assert.equal(v.verdict, "VOICE_NOTE_NARRATION_SOUND");
});

test("test_invalid_audience_scope_fails", () => {
  const m = clone(COMPLETE) as any;
  m.scoping.audience_scope = "public";
  assert.equal(checkStatus(evaluate(m), "voice_note_narration_audience_scope_recognised"), "fail");
});

test("test_real_person_voice_without_consent_fails_gated", () => {
  const m = clone(COMPLETE) as any;
  m.voice.uses_real_person_voice = true;
  m.voice.voice_kind = "real_person_voice";
  m.voice.real_person_voice_consent_recorded = false;
  assert.equal(checkStatus(evaluate(m), "voice_note_narration_real_person_voice_consent_recorded_where_real_person_voice_used"), "fail");
});

test("test_real_person_voice_with_consent_passes_gated", () => {
  const m = clone(COMPLETE) as any;
  m.voice.uses_real_person_voice = true;
  m.voice.voice_kind = "real_person_voice";
  m.voice.real_person_voice_consent_recorded = true;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "voice_note_narration_real_person_voice_consent_recorded_where_real_person_voice_used"), "pass");
  assert.equal(v.verdict, "VOICE_NOTE_NARRATION_SOUND");
});

test("test_no_real_person_voice_passes_gated_as_na", () => {
  assert.equal(checkStatus(evaluate(clone(COMPLETE)), "voice_note_narration_real_person_voice_consent_recorded_where_real_person_voice_used"), "pass");
});

test("test_missing_voice_consent_declaration_fails_red_line_class", () => {
  const m = clone(COMPLETE) as any;
  delete m.voice.voice_consent_declared;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "voice_note_narration_record_declares_voice_consent"), "fail");
  assert.equal(v.sections["red_lines"], "fail");
  assert.equal(v.verdict, "VOICE_NOTE_NARRATION_NOT_SOUND");
});

test("test_false_voice_consent_declaration_fails", () => {
  const m = clone(COMPLETE) as any;
  m.voice.voice_consent_declared = false;
  assert.equal(checkStatus(evaluate(m), "voice_note_narration_record_declares_voice_consent"), "fail");
});

test("test_numbers_not_spelled_out_fails_section3", () => {
  const m = clone(COMPLETE) as any;
  m.adaptation.numbers_spelled_out = false;
  const v = evaluate(m);
  assert.equal(v.sections["text_adaptation_for_listening"], "fail");
  assert.equal(checkStatus(v, "voice_note_narration_numbers_spelled_out"), "fail");
});

test("test_duplicate_segment_id_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.segments[1].segment_id = "seg-1";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_voice_note_narration_segment_id_unique"), "fail");
  assert.deepEqual(v.duplicate_voice_note_segment_ids, ["seg-1"]);
});

test("test_empty_segments_list_fails", () => {
  const m = clone(COMPLETE) as any;
  m.segments = [];
  m.assembly.total_duration_seconds_declared = 0;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "voice_note_narration_segments_list_declared"), "fail");
  assert.equal(v.voice_note_segments_count, 0);
  assert.equal(v.segment_sequence_coverage_ratio, null);
});

test("test_absent_segments_list_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.segments;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "voice_note_narration_segments_list_declared"), "missing");
  assert.equal(v.voice_note_segments_count, null);
  assert.equal(v.computed_status, null);
  assert.equal(v.voice_note_segment_duration_total, null);
});

test("test_empty_section_label_fails", () => {
  const m = clone(COMPLETE) as any;
  m.segments[1].section_label = "";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_voice_note_narration_segment_section_label_declared"), "fail");
  assert.deepEqual(v.voice_note_segments_without_section_label, ["seg-2"]);
  assert.equal(v.segment_section_label_ratio, "0.666667");
});

test("test_zero_duration_fails", () => {
  const m = clone(COMPLETE) as any;
  m.segments[0].duration_seconds = 0;
  m.assembly.total_duration_seconds_declared = 165.5;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_voice_note_narration_segment_duration_positive"), "fail");
  assert.deepEqual(v.voice_note_segments_with_non_positive_duration, ["seg-1"]);
});

test("test_sequence_gap_fails", () => {
  const m = clone(COMPLETE) as any;
  m.segments[2].sequence_position = 4;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "voice_note_narration_segment_sequence_complete"), "fail");
  assert.deepEqual(v.voice_note_segments_with_invalid_sequence_position, ["seg-3"]);
  assert.equal(v.segment_sequence_coverage_ratio, "0.666667");
});

test("test_sequence_duplicate_fails", () => {
  const m = clone(COMPLETE) as any;
  m.segments[2].sequence_position = 2;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "voice_note_narration_segment_sequence_complete"), "fail");
  assert.deepEqual(v.voice_note_segments_with_invalid_sequence_position, ["seg-3"]);
});

test("test_sequence_reordered_still_passes", () => {
  const m = clone(COMPLETE) as any;
  m.segments[0].sequence_position = 2;
  m.segments[1].sequence_position = 1;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "voice_note_narration_segment_sequence_complete"), "pass");
  assert.equal(v.verdict, "VOICE_NOTE_NARRATION_SOUND");
});

test("test_segment_missing_duration_field_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.segments[0].duration_seconds;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "every_voice_note_narration_segment_duration_positive"), "missing");
});

test("test_invalid_file_format_fails", () => {
  const m = clone(COMPLETE) as any;
  m.audio_spec.file_format = "aiff";
  assert.equal(checkStatus(evaluate(m), "voice_note_narration_audio_file_format_recognised"), "fail");
});

test("test_total_duration_mismatch_fails", () => {
  const m = clone(COMPLETE) as any;
  m.assembly.total_duration_seconds_declared = 230;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "voice_note_narration_total_duration_recomputes_from_segments"), "fail");
  assert.equal(v.voice_note_total_duration_declared, "230.000000");
  assert.equal(v.voice_note_segment_duration_total, "228.000000");
});

test("test_middle_not_spot_checked_fails_section5", () => {
  const m = clone(COMPLETE) as any;
  m.assembly.middle_spot_checked_for_clarity_and_pace = false;
  assert.equal(evaluate(m).sections["audio_spec_and_assembly"], "fail");
});

test("test_disclosure_missing_where_audience_includes_others_fails", () => {
  const m = clone(COMPLETE) as any;
  m.delivery.ai_voice_disclosure_made = false;
  assert.equal(checkStatus(evaluate(m), "voice_note_narration_ai_voice_disclosure_made_where_audience_includes_others"), "fail");
});

test("test_disclosure_not_owed_for_self_only_audience", () => {
  const m = clone(COMPLETE) as any;
  m.scoping.audience_scope = "self_only";
  m.delivery.ai_voice_disclosure_made = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "voice_note_narration_ai_voice_disclosure_made_where_audience_includes_others"), "pass");
  assert.equal(v.verdict, "VOICE_NOTE_NARRATION_SOUND");
});

test("test_clone_without_consent_fails_red_lines", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.voice_cloned_or_imitated_without_consent_present = true;
  const v = evaluate(m);
  assert.equal(v.sections["red_lines"], "fail");
  assert.equal(v.verdict, "VOICE_NOTE_NARRATION_NOT_SOUND");
});

test("test_meaning_changed_fails_red_lines", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.source_meaning_changed_in_adaptation_present = true;
  assert.equal(checkStatus(evaluate(m), "voice_note_narration_free_of_source_meaning_changed_in_adaptation"), "fail");
});

test("test_absent_evidence_is_insufficient_not_failed", () => {
  const m = clone(COMPLETE) as any;
  delete m.adaptation;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["text_adaptation_for_listening"], "insufficient_evidence");
});

test("test_empty_manifest_fails_only_on_consent_red_line_class", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "VOICE_NOTE_NARRATION_NOT_SOUND");
  assert.equal(v.sections["red_lines"], "fail");
  for (const c of v.checks) {
    if (c.check === "voice_note_narration_record_declares_voice_consent") {
      assert.equal(c.status, "fail");
    } else {
      assert.equal(c.status, "missing");
    }
  }
  assert.equal(v.computed_status, null);
  assert.equal(v.voice_note_segments_count, null);
  assert.equal(v.segment_sequence_coverage_ratio, null);
});

test("test_stamp_names_the_verdict", () => {
  assert.ok(stamp(evaluate(clone(COMPLETE))).includes("VERDICT: VOICE_NOTE_NARRATION_SOUND"));
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
  m.production_title = 12345;
  assert.throws(() => evaluate(m), fieldError("production_title"));
});

test("malformed: object section as string rejected", () => {
  assert.throws(() => evaluate({ scoping: "should-be-an-object" }), fieldError("scoping"));
});

test("malformed: list field as object rejected", () => {
  assert.throws(() => evaluate({ segments: { segment_id: "seg-1" } }), fieldError("segments"));
});

test("malformed: list entry as string rejected", () => {
  assert.throws(() => evaluate({ segments: ["seg-1"] }), fieldError("segments[0]"));
});

test("malformed: boolean leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.scoping.kind_confirmed = "yes";
  assert.throws(() => evaluate(m), fieldError("scoping.kind_confirmed"));
});

test("malformed: number leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.segments[0].duration_seconds = "62.5";
  assert.throws(() => evaluate(m), fieldError("segments[0].duration_seconds"));
});

test("malformed: enum leaf as number rejected", () => {
  const m = clone(COMPLETE) as any;
  m.scoping.production_kind = 7;
  assert.throws(() => evaluate(m), fieldError("scoping.production_kind"));
});

test("malformed: total duration as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.assembly.total_duration_seconds_declared = "228";
  assert.throws(() => evaluate(m), fieldError("assembly.total_duration_seconds_declared"));
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
  .filter((f) => f.startsWith("voice-note-narration-audio--") && f.endsWith(".json"))
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
