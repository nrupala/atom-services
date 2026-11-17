import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/sourced-podcast-episode-production.js";
import { FieldTypeError } from "../src/atoms/validate.js";

const COMPLETE: Record<string, unknown> = {
  episode_title: "grid-reliability-briefing",
  scoping: { topic_scoped: true, audience_scoped: true,
             target_length_scoped: true, main_point_scoped: true,
             distribution_intent_confirmed: true, scoped_before_writing: true },
  episode_sections: [
    { section_id: "sec-1", purpose: "Open with the reliability point",
      supports_main_point: true },
    { section_id: "sec-2", purpose: "Evidence on outage causes",
      supports_main_point: true },
  ],
  source_work: { sources_collected_before_writing: true,
                 source_list_kept_beside_draft: true,
                 script_checked_claim_by_claim_against_sources: true,
                 unsupported_claims_cut_or_softened: true },
  sources: [
    { source_id: "src-1", citation: "EIA reliability report, link recorded" },
    { source_id: "src-2", citation: "Utility reliability study, citation recorded" },
  ],
  claims: [
    { claim_id: "claim-1", claim_kind: "quote", source_id: "src-1",
      source_marked_in_script: true },
    { claim_id: "claim-2", claim_kind: "statistic", source_id: "src-2",
      source_marked_in_script: true },
  ],
  script: { written_for_the_ear: true, uses_short_sentences: true,
            uses_signposts: true, has_no_visual_references: true,
            opens_with_main_point: true, supports_point_in_order: true,
            closes_with_what_matters: true, approved_before_narration: true },
  narration: { voice_confirmed: true, pace_confirmed: true,
               long_script_chunked_at_section_breaks_where_long: true,
               audio_assembled: true, opening_listen_back_checked: true,
               section_joins_listen_back_checked: true,
               misreads_and_awkward_joins_fixed: true, ai_narrated: true },
  show_notes: { summary_included: true, main_points_included: true,
                complete_source_list_included: true,
                source_ids_included: ["src-1", "src-2"] },
  rights: { copyrighted_audio_or_music_used: true,
            right_to_copyrighted_audio_or_music_cleared: true },
  guests: { guest_voices_present: true,
            releases_recorded_for_all_guests: true },
  publishing: { publishing_or_scheduling_planned: true,
                authorization_recorded_for_this_episode: true,
                destination_matches_authorized_scope: true,
                timing_matches_authorized_scope: true,
                ai_narration_disclosure_made: true },
  red_lines: { fabricated_quote_statistic_or_source_present: false,
               words_attributed_beyond_source_present: false,
               publishing_beyond_authorized_scope_present: false,
               ai_narration_presented_as_human_without_disclosure_present: false,
               copyrighted_audio_without_clear_right_present: false },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function checkStatus(v: ReturnType<typeof evaluate>, name: string) {
  return v.checks.find((c) => c.check === name)?.status;
}

test("test_complete_manifest_is_sound", () => {
  const v = evaluate(clone(COMPLETE));
  assert.equal(v.verdict, "EPISODE_PRODUCTION_SOUND");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.checks.length, 52);
  assert.equal(v.computed_status, "within_stated_limits_on_declared_evidence");
  assert.equal(v.episode_outline_sections_count, 2);
  assert.equal(v.podcast_sources_count, 2);
  assert.equal(v.podcast_claims_count, 2);
  assert.deepEqual(v.duplicate_episode_outline_section_ids, []);
  assert.deepEqual(v.duplicate_podcast_source_ids, []);
  assert.deepEqual(v.duplicate_podcast_claim_ids, []);
  assert.equal(v.traced_claim_ratio, "1.000000");
  assert.equal(v.source_citation_ratio, "1.000000");
  assert.equal(v.outline_section_support_ratio, "1.000000");
  assert.equal(v.show_notes_source_coverage_ratio, "1.000000");
});

test("test_topic_not_scoped_fails_section1", () => {
  const m = clone(COMPLETE) as any;
  m.scoping.topic_scoped = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "EPISODE_PRODUCTION_NOT_SOUND");
  assert.equal(v.sections["episode_scoping_and_outline"], "fail");
  assert.equal(checkStatus(v, "podcast_episode_topic_scoped"), "fail");
});

test("test_duplicate_section_id_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.episode_sections[1].section_id = "sec-1";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_podcast_episode_outline_section_id_unique"), "fail");
  assert.deepEqual(v.duplicate_episode_outline_section_ids, ["sec-1"]);
});

test("test_empty_section_purpose_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.episode_sections[0].purpose = "";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_podcast_episode_outline_section_purpose_declared"), "fail");
  assert.deepEqual(v.episode_outline_sections_without_purpose, ["sec-1"]);
});

test("test_section_not_supporting_fails", () => {
  const m = clone(COMPLETE) as any;
  m.episode_sections[1].supports_main_point = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_podcast_episode_outline_section_supports_main_point"), "fail");
  assert.deepEqual(v.episode_outline_sections_not_supporting_main_point, ["sec-2"]);
  assert.equal(v.outline_section_support_ratio, "0.500000");
});

test("test_absent_sections_list_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.episode_sections;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "podcast_episode_outline_sections_list_declared"), "missing");
  assert.equal(v.episode_outline_sections_count, null);
  assert.equal(v.computed_status, null);
});

test("test_empty_sources_list_fails", () => {
  const m = clone(COMPLETE) as any;
  m.sources = [];
  const v = evaluate(m);
  assert.equal(checkStatus(v, "podcast_episode_sources_list_declared"), "fail");
  assert.equal(v.podcast_sources_count, 0);
});

test("test_claim_with_unknown_source_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.claims[0].source_id = "src-99";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_podcast_claim_traced_to_declared_source"), "fail");
  assert.deepEqual(v.podcast_claims_with_unknown_source_reference, ["claim-1"]);
  assert.equal(v.traced_claim_ratio, "0.500000");
});

test("test_claim_unmarked_fails", () => {
  const m = clone(COMPLETE) as any;
  m.claims[1].source_marked_in_script = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_podcast_claim_source_marked_in_script"), "fail");
  assert.deepEqual(v.podcast_claims_with_unmarked_source, ["claim-2"]);
});

test("test_claim_invalid_kind_fails", () => {
  const m = clone(COMPLETE) as any;
  m.claims[0].claim_kind = "anecdote";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_podcast_claim_kind_recognised"), "fail");
  assert.deepEqual(v.podcast_claims_with_invalid_kind, ["claim-1"]);
});

test("test_source_without_citation_fails", () => {
  const m = clone(COMPLETE) as any;
  m.sources[0].citation = "";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_podcast_source_citation_recorded"), "fail");
  assert.deepEqual(v.podcast_sources_without_citation, ["src-1"]);
  assert.equal(v.source_citation_ratio, "0.500000");
});

test("test_claim_missing_source_id_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.claims[0].source_id;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "every_podcast_claim_traced_to_declared_source"), "missing");
});

test("test_script_visual_references_fail_section3", () => {
  const m = clone(COMPLETE) as any;
  m.script.has_no_visual_references = false;
  assert.equal(evaluate(m).sections["script_for_listening"], "fail");
});

test("test_joins_not_checked_fails_section4", () => {
  const m = clone(COMPLETE) as any;
  m.narration.section_joins_listen_back_checked = false;
  const v = evaluate(m);
  assert.equal(v.sections["narration_and_assembly_qc"], "fail");
  assert.equal(checkStatus(v, "podcast_episode_section_joins_listen_back_checked"), "fail");
});

test("test_show_notes_missing_source_fails_match", () => {
  const m = clone(COMPLETE) as any;
  m.show_notes.source_ids_included = ["src-1"];
  const v = evaluate(m);
  assert.equal(checkStatus(v, "podcast_episode_show_notes_source_ids_match_declared_sources"), "fail");
  assert.deepEqual(v.podcast_sources_missing_from_show_notes, ["src-2"]);
  assert.equal(v.show_notes_source_coverage_ratio, "0.500000");
});

test("test_show_notes_extra_source_fails_match", () => {
  const m = clone(COMPLETE) as any;
  m.show_notes.source_ids_included = ["src-1", "src-2", "src-9"];
  const v = evaluate(m);
  assert.equal(checkStatus(v, "podcast_episode_show_notes_source_ids_match_declared_sources"), "fail");
  assert.deepEqual(v.show_notes_source_ids_not_declared_as_sources, ["src-9"]);
});

test("test_copyrighted_use_without_right_fails_gated", () => {
  const m = clone(COMPLETE) as any;
  m.rights.right_to_copyrighted_audio_or_music_cleared = false;
  assert.equal(checkStatus(evaluate(m), "podcast_episode_copyrighted_audio_rights_cleared_where_used"), "fail");
});

test("test_no_copyrighted_use_passes_gated_as_na", () => {
  const m = clone(COMPLETE) as any;
  m.rights.copyrighted_audio_or_music_used = false;
  m.rights.right_to_copyrighted_audio_or_music_cleared = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "podcast_episode_copyrighted_audio_rights_cleared_where_used"), "pass");
  assert.equal(v.verdict, "EPISODE_PRODUCTION_SOUND");
});

test("test_guest_without_release_fails_gated", () => {
  const m = clone(COMPLETE) as any;
  m.guests.releases_recorded_for_all_guests = false;
  assert.equal(checkStatus(evaluate(m), "podcast_episode_guest_releases_recorded_where_guests_present"), "fail");
});

test("test_no_publishing_planned_passes_publishing_gates", () => {
  const m = clone(COMPLETE) as any;
  m.publishing.publishing_or_scheduling_planned = false;
  m.publishing.authorization_recorded_for_this_episode = false;
  m.publishing.destination_matches_authorized_scope = false;
  m.publishing.timing_matches_authorized_scope = false;
  assert.equal(evaluate(m).sections["publishing_and_disclosure"], "pass");
});

test("test_publishing_without_authorization_fails", () => {
  const m = clone(COMPLETE) as any;
  m.publishing.authorization_recorded_for_this_episode = false;
  assert.equal(checkStatus(evaluate(m), "podcast_episode_publishing_authorization_recorded_where_planned"), "fail");
});

test("test_ai_narration_without_disclosure_fails", () => {
  const m = clone(COMPLETE) as any;
  m.publishing.ai_narration_disclosure_made = false;
  assert.equal(checkStatus(evaluate(m), "podcast_episode_ai_narration_disclosed_where_ai_narrated"), "fail");
});

test("test_human_narration_passes_disclosure_gate", () => {
  const m = clone(COMPLETE) as any;
  m.narration.ai_narrated = false;
  m.publishing.ai_narration_disclosure_made = false;
  assert.equal(checkStatus(evaluate(m), "podcast_episode_ai_narration_disclosed_where_ai_narrated"), "pass");
});

test("test_fabricated_source_fails_red_lines", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.fabricated_quote_statistic_or_source_present = true;
  const v = evaluate(m);
  assert.equal(v.sections["red_lines"], "fail");
  assert.equal(v.verdict, "EPISODE_PRODUCTION_NOT_SOUND");
});

test("test_publishing_beyond_scope_fails_red_lines", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.publishing_beyond_authorized_scope_present = true;
  assert.equal(checkStatus(evaluate(m), "podcast_episode_free_of_publishing_beyond_authorized_scope"), "fail");
});

test("test_absent_evidence_is_insufficient_not_failed", () => {
  const m = clone(COMPLETE) as any;
  delete m.script;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["script_for_listening"], "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.ok(v.checks.every((c) => c.status === "missing"));
  assert.equal(v.computed_status, null);
  assert.equal(v.podcast_sources_count, null);
  assert.equal(v.traced_claim_ratio, null);
});

test("test_stamp_names_the_verdict", () => {
  assert.ok(stamp(evaluate(clone(COMPLETE))).includes("VERDICT: EPISODE_PRODUCTION_SOUND"));
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
  m.episode_title = 12345;
  assert.throws(() => evaluate(m), fieldError("episode_title"));
});

test("malformed: object section as string rejected", () => {
  assert.throws(() => evaluate({ scoping: "should-be-an-object" }), fieldError("scoping"));
});

test("malformed: list field as object rejected", () => {
  assert.throws(() => evaluate({ sources: { source_id: "src-1" } }), fieldError("sources"));
});

test("malformed: list entry as string rejected", () => {
  assert.throws(() => evaluate({ claims: ["claim-1"] }), fieldError("claims[0]"));
});

test("malformed: boolean leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.script.written_for_the_ear = "yes";
  assert.throws(() => evaluate(m), fieldError("script.written_for_the_ear"));
});

test("malformed: string list entry as number rejected", () => {
  const m = clone(COMPLETE) as any;
  m.show_notes.source_ids_included = [42];
  assert.throws(() => evaluate(m), fieldError("show_notes.source_ids_included[0]"));
});

test("malformed: nested list entry bool field rejected", () => {
  const m = clone(COMPLETE) as any;
  m.claims[0].source_marked_in_script = "true";
  assert.throws(() => evaluate(m), fieldError("claims[0].source_marked_in_script"));
});

test("malformed: null section rejected", () => {
  const m = clone(COMPLETE) as any;
  m.narration = null;
  assert.throws(() => evaluate(m), fieldError("narration"));
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
  .filter((f) => f.startsWith("sourced-podcast-episode-production--") && f.endsWith(".json"))
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
