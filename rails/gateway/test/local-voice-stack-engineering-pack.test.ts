import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/local-voice-stack-engineering-pack.js";
import { FieldTypeError } from "../src/atoms/validate.js";

const COMPLETE: Record<string, unknown> = {
  stack: "reader-voice",
  pipeline: { tts_stt_or_both_scope_declared: true,
              streaming_vs_file_output_declared: true,
              local_first_by_default: true },
  engine_selection: { quality_latency_footprint_evaluated: true,
                      language_coverage_addressed: true },
  engines: [
    { name: "local-tts", license_cleared_for_commercial_use: true,
      evaluated_on_own_golden_sentences: true, is_voice_cloning: false },
    { name: "cloning-tts", license_cleared_for_commercial_use: true,
      evaluated_on_own_golden_sentences: true, is_voice_cloning: true,
      cloning_consent_recorded: true },
    { name: "local-stt", license_cleared_for_commercial_use: true,
      evaluated_on_own_golden_sentences: true, is_voice_cloning: false },
  ],
  cloning: { impersonation_present: false, covert_recording_present: false,
             synthetic_audio_disclosure_where_required: true,
             voice_profiles_encrypted_at_rest: true, deletion_honored: true },
  audio_engineering: { sample_rate_and_format_choices_declared: true,
                       loudness_normalization_applied: true,
                       chunking_for_long_text_with_pauses: true,
                       caching_synthesized_segments_for_repeat_text: true },
  latency: { time_to_first_audio_budget_stated: true,
             latency_measured_against_stated_budget: true,
             chunked_synthesis: true,
             assistant_interactive_use_present: true,
             interruption_barge_in_handling: true },
  accessibility: { speed_controls_present: true, pitch_controls_present: true,
                   captions_or_transcripts_wired: true,
                   keyboard_operable_players: true },
  testing: { golden_audio_regressions_in_test_loop: true,
             golden_hash_and_human_spot_checks: true,
             noisy_input_stt_tests: true,
             pronunciation_dictionaries_for_names_numbers_code: true },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function checkStatus(v: ReturnType<typeof evaluate>, name: string) {
  return v.checks.find((c) => c.check === name)?.status;
}

test("test_complete_manifest_is_sound", () => {
  const v = evaluate(clone(COMPLETE));
  assert.equal(v.verdict, "LOCAL_VOICE_STACK_SOUND");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.checks.length, 30);
  assert.equal(v.computed_status, "within_stated_limits_on_declared_evidence");
  assert.equal(v.engines_count, 3);
  assert.deepEqual(v.engines_without_license_clearance, []);
  assert.equal(v.license_coverage, "1.000000");
  assert.deepEqual(v.engines_without_golden_sentence_evaluation, []);
  assert.equal(v.golden_evaluation_coverage, "1.000000");
  assert.deepEqual(v.cloning_engines_without_consent_recorded, []);
});

test("test_not_local_first_fails_pipeline_section", () => {
  const m = clone(COMPLETE) as any;
  m.pipeline.local_first_by_default = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "LOCAL_VOICE_STACK_NOT_SOUND");
  assert.equal(v.sections["pipeline_and_engine_selection"], "fail");
  assert.equal(checkStatus(v, "local_first_by_default"), "fail");
});

test("test_language_coverage_not_addressed_fails", () => {
  const m = clone(COMPLETE) as any;
  m.engine_selection.language_coverage_addressed = false;
  assert.equal(evaluate(m).verdict, "LOCAL_VOICE_STACK_NOT_SOUND");
});

test("test_engine_without_license_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.engines[0].license_cleared_for_commercial_use = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "LOCAL_VOICE_STACK_NOT_SOUND");
  assert.equal(checkStatus(v, "every_engine_license_cleared_for_commercial_use"), "fail");
  assert.deepEqual(v.engines_without_license_clearance, ["local-tts"]);
  assert.equal(v.license_coverage, "0.666667");
  assert.equal(v.computed_status, "outside_stated_limits_on_declared_evidence");
});

test("test_engine_missing_license_field_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.engines[0].license_cleared_for_commercial_use;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "every_engine_license_cleared_for_commercial_use"), "missing");
  assert.deepEqual(v.engines_without_license_clearance, []);
});

test("test_engine_evaluated_on_vendor_demos_only_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.engines[2].evaluated_on_own_golden_sentences = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_engine_evaluated_on_own_golden_sentences"), "fail");
  assert.deepEqual(v.engines_without_golden_sentence_evaluation, ["local-stt"]);
  assert.equal(v.golden_evaluation_coverage, "0.666667");
});

test("test_empty_engines_list_fails", () => {
  const m = clone(COMPLETE) as any;
  m.engines = [];
  const v = evaluate(m);
  assert.equal(checkStatus(v, "engines_declared"), "fail");
  assert.equal(v.engines_count, 0);
  assert.equal(v.license_coverage, null);
  assert.equal(v.golden_evaluation_coverage, null);
});

test("test_impersonation_fails_cloning_section", () => {
  const m = clone(COMPLETE) as any;
  m.cloning.impersonation_present = true;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_impersonation"), "fail");
  assert.equal(v.sections["cloning_consent_and_ethics"], "fail");
});

test("test_covert_recording_fails", () => {
  const m = clone(COMPLETE) as any;
  m.cloning.covert_recording_present = true;
  assert.equal(evaluate(m).verdict, "LOCAL_VOICE_STACK_NOT_SOUND");
});

test("test_no_synthetic_audio_disclosure_fails", () => {
  const m = clone(COMPLETE) as any;
  m.cloning.synthetic_audio_disclosure_where_required = false;
  assert.equal(evaluate(m).verdict, "LOCAL_VOICE_STACK_NOT_SOUND");
});

test("test_unencrypted_voice_profiles_fail", () => {
  const m = clone(COMPLETE) as any;
  m.cloning.voice_profiles_encrypted_at_rest = false;
  assert.equal(evaluate(m).verdict, "LOCAL_VOICE_STACK_NOT_SOUND");
});

test("test_cloning_engine_without_consent_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.engines[1].cloning_consent_recorded = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "LOCAL_VOICE_STACK_NOT_SOUND");
  assert.equal(checkStatus(v, "every_cloning_engine_has_consent_recorded"), "fail");
  assert.deepEqual(v.cloning_engines_without_consent_recorded, ["cloning-tts"]);
});

test("test_cloning_engine_missing_consent_field_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.engines[1].cloning_consent_recorded;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "every_cloning_engine_has_consent_recorded"), "missing");
  assert.deepEqual(v.cloning_engines_without_consent_recorded, []);
});

test("test_no_cloning_engines_passes_consent_check_as_na", () => {
  const m = clone(COMPLETE) as any;
  m.engines[1].is_voice_cloning = false;
  delete m.engines[1].cloning_consent_recorded;
  const v = evaluate(m);
  assert.equal(v.verdict, "LOCAL_VOICE_STACK_SOUND");
  assert.equal(checkStatus(v, "every_cloning_engine_has_consent_recorded"), "pass");
});

test("test_no_loudness_normalization_fails_audio_section", () => {
  const m = clone(COMPLETE) as any;
  m.audio_engineering.loudness_normalization_applied = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "LOCAL_VOICE_STACK_NOT_SOUND");
  assert.equal(v.sections["audio_engineering_and_latency"], "fail");
});

test("test_latency_not_measured_against_budget_fails", () => {
  const m = clone(COMPLETE) as any;
  m.latency.latency_measured_against_stated_budget = false;
  assert.equal(evaluate(m).verdict, "LOCAL_VOICE_STACK_NOT_SOUND");
});

test("test_barge_in_missing_when_assistant_present_fails", () => {
  const m = clone(COMPLETE) as any;
  m.latency.interruption_barge_in_handling = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "interruption_barge_in_when_assistant_use"), "fail");
});

test("test_no_assistant_use_passes_barge_in_check_as_na", () => {
  const m = clone(COMPLETE) as any;
  m.latency = { time_to_first_audio_budget_stated: true,
                latency_measured_against_stated_budget: true,
                chunked_synthesis: true,
                assistant_interactive_use_present: false };
  const v = evaluate(m);
  assert.equal(v.verdict, "LOCAL_VOICE_STACK_SOUND");
  assert.equal(checkStatus(v, "interruption_barge_in_when_assistant_use"), "pass");
});

test("test_barge_in_target_missing_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.latency.interruption_barge_in_handling;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "interruption_barge_in_when_assistant_use"), "missing");
});

test("test_no_captions_fails_accessibility_section", () => {
  const m = clone(COMPLETE) as any;
  m.accessibility.captions_or_transcripts_wired = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "captions_or_transcripts_wired"), "fail");
  assert.equal(v.sections["accessibility"], "fail");
});

test("test_non_keyboard_operable_players_fail", () => {
  const m = clone(COMPLETE) as any;
  m.accessibility.keyboard_operable_players = false;
  assert.equal(evaluate(m).verdict, "LOCAL_VOICE_STACK_NOT_SOUND");
});

test("test_no_golden_regressions_fails_testing_section", () => {
  const m = clone(COMPLETE) as any;
  m.testing.golden_audio_regressions_in_test_loop = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "golden_audio_regressions_in_test_loop"), "fail");
  assert.equal(v.sections["testing_and_quality_gates"], "fail");
});

test("test_no_noisy_input_tests_fail", () => {
  const m = clone(COMPLETE) as any;
  m.testing.noisy_input_stt_tests = false;
  assert.equal(evaluate(m).verdict, "LOCAL_VOICE_STACK_NOT_SOUND");
});

test("test_absent_evidence_is_insufficient_not_failed", () => {
  const m = clone(COMPLETE) as any;
  delete m.accessibility;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["accessibility"], "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.ok(v.checks.every((c) => c.status === "missing"));
  assert.equal(v.computed_status, null);
  assert.equal(v.engines_count, null);
  assert.equal(v.engines_without_license_clearance, null);
  assert.equal(v.license_coverage, null);
  assert.equal(v.engines_without_golden_sentence_evaluation, null);
  assert.equal(v.golden_evaluation_coverage, null);
  assert.equal(v.cloning_engines_without_consent_recorded, null);
});

test("test_stamp_names_the_verdict", () => {
  assert.ok(stamp(evaluate(clone(COMPLETE))).includes("VERDICT: LOCAL_VOICE_STACK_SOUND"));
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
  m.stack = 12345;
  assert.throws(() => evaluate(m), fieldError("stack"));
});

test("malformed: object section as string rejected", () => {
  assert.throws(() => evaluate({ latency: "should-be-an-object" }), fieldError("latency"));
});

test("malformed: list field as object rejected", () => {
  assert.throws(() => evaluate({ engines: { name: "local-tts" } }), fieldError("engines"));
});

test("malformed: list entry as string rejected", () => {
  assert.throws(() => evaluate({ engines: ["local-tts"] }), fieldError("engines[0]"));
});

test("malformed: boolean leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.latency.chunked_synthesis = "yes";
  assert.throws(() => evaluate(m), fieldError("latency.chunked_synthesis"));
});

test("malformed: nested list entry string field rejected", () => {
  const m = clone(COMPLETE) as any;
  m.engines[0].name = 42;
  assert.throws(() => evaluate(m), fieldError("engines[0].name"));
});

test("malformed: nested list entry boolean field rejected", () => {
  const m = clone(COMPLETE) as any;
  m.engines[1].is_voice_cloning = "yes";
  assert.throws(() => evaluate(m), fieldError("engines[1].is_voice_cloning"));
});

test("malformed: null section rejected", () => {
  const m = clone(COMPLETE) as any;
  m.cloning = null;
  assert.throws(() => evaluate(m), fieldError("cloning"));
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
  .filter((f) => f.startsWith("local-voice-stack-engineering-pack--") && f.endsWith(".json"))
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
