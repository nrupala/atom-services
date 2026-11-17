import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/sourced-visual-reference-search.js";
import { FieldTypeError } from "../src/atoms/validate.js";

function row(rid: string, url: string, licence = "reference_only_no_licence_stated") {
  return {
    result_id: rid,
    direct_image_url: url,
    source_page_url: `https://example.com/pages/${rid}`,
    source_page_verified: true,
    matches_brief_by_viewing: true,
    shows_subject_clearly: true,
    usable_resolution_declared: true,
    misleading_cropping_present: false,
    watermark_present: false,
    caption_product_mismatch_present: false,
    depiction_noted: true,
    publisher_noted: true,
    caption_date_or_credit_noted: true,
    licence_status: licence,
    licence_note_present: true,
    credit_noted: true,
    claimed_cleared_for_commercial_use: false,
  };
}

const COMPLETE: Record<string, unknown> = {
  search_title: "compact-wall-mounted-ev-charger-garage",
  brief: { target_restated_in_searchable_terms: true,
           subject_stated: true,
           setting_stated: true,
           angle_or_style_stated: true,
           must_have_and_must_avoid_details_stated: true },
  search: { terms_adjusted_when_first_pass_off_topic: true },
  results: [
    row("ref-1", "https://example.com/img/charger-1.jpg"),
    row("ref-2", "https://example.com/img/charger-2.jpg", "explicitly_licensed"),
    row("ref-3", "https://example.com/img/charger-3.jpg"),
  ],
  quality: { relevance_checked_by_viewing_not_title_alone: true,
             weak_duplicate_or_misleading_filtered_out: true },
  selection: { involves_choice: true,
               strongest_match_called_out_first: true,
               similar_candidates_grouped: true,
               evidence_use_paired_with_facts_where_used_as_evidence: true },
  licensing: { licensing_caution_stated_plainly: true },
  red_lines: {
    person_identified_in_found_photo_present: false,
    found_image_presented_as_own_or_generated_present: false,
    found_image_presented_as_licensed_without_explicit_grant_present: false,
    unsourced_image_returned_present: false,
    altered_image_passed_as_original_present: false },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function checkStatus(v: ReturnType<typeof evaluate>, name: string) {
  return v.checks.find((c) => c.check === name)?.status;
}

test("test_complete_manifest_is_sound", () => {
  const v = evaluate(clone(COMPLETE));
  assert.equal(v.verdict, "VISUAL_REFERENCE_SET_SOUND");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.checks.length, 34);
  assert.equal(v.computed_status, "within_stated_limits_on_declared_evidence");
  assert.equal(v.visual_reference_results_count, 3);
  assert.deepEqual(v.duplicate_visual_reference_result_ids, []);
  assert.deepEqual(v.duplicate_visual_reference_direct_image_urls, []);
  assert.deepEqual(v.visual_reference_results_missing_source_pair, []);
  assert.deepEqual(v.visual_reference_results_with_incomplete_licence_attribution, []);
  assert.equal(v.sourced_pair_coverage_ratio, "1.000000");
  assert.equal(v.licence_attribution_coverage_ratio, "1.000000");
  assert.equal(v.visual_reference_match_ratio, "1.000000");
});

test("test_subject_not_stated_fails_brief_section", () => {
  const m = clone(COMPLETE) as any;
  m.brief.subject_stated = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "VISUAL_REFERENCE_SET_NOT_SOUND");
  assert.equal(v.sections["search_brief_and_query"], "fail");
  assert.equal(checkStatus(v, "visual_reference_subject_stated"), "fail");
});

test("test_terms_not_adjusted_fails_brief_section", () => {
  const m = clone(COMPLETE) as any;
  m.search.terms_adjusted_when_first_pass_off_topic = false;
  assert.equal(checkStatus(evaluate(m), "visual_reference_search_terms_adjusted_when_first_pass_off_topic"), "fail");
});

test("test_duplicate_result_id_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.results[2].result_id = "ref-1";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_visual_reference_result_id_unique"), "fail");
  assert.deepEqual(v.duplicate_visual_reference_result_ids, ["ref-1"]);
});

test("test_duplicate_direct_url_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.results[2].direct_image_url = m.results[0].direct_image_url;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_visual_reference_direct_image_url_unique"), "fail");
  assert.deepEqual(v.duplicate_visual_reference_direct_image_urls, ["https://example.com/img/charger-1.jpg"]);
  assert.equal(checkStatus(v, "visual_reference_choice_set_several_distinct_candidates_when_choice_involved"), "fail");
});

test("test_missing_source_page_url_is_missing_and_named", () => {
  const m = clone(COMPLETE) as any;
  delete m.results[1].source_page_url;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "every_visual_reference_result_has_direct_image_and_source_page_links"), "missing");
  assert.deepEqual(v.visual_reference_results_missing_source_pair, ["ref-2"]);
  assert.equal(v.sourced_pair_coverage_ratio, "0.666667");
});

test("test_empty_source_page_url_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.results[0].source_page_url = "";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_visual_reference_result_has_direct_image_and_source_page_links"), "fail");
  assert.deepEqual(v.visual_reference_results_missing_source_pair, ["ref-1"]);
});

test("test_unverified_source_page_fails", () => {
  const m = clone(COMPLETE) as any;
  m.results[0].source_page_verified = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_visual_reference_result_source_page_verified"), "fail");
  assert.equal(v.sections["source_provenance"], "fail");
});

test("test_absent_results_list_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.results;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "visual_reference_results_list_declared"), "missing");
  assert.equal(v.computed_status, null);
  assert.equal(v.visual_reference_results_count, null);
  assert.equal(v.duplicate_visual_reference_result_ids, null);
  assert.equal(v.sourced_pair_coverage_ratio, null);
  assert.equal(v.licence_attribution_coverage_ratio, null);
  assert.equal(v.visual_reference_match_ratio, null);
});

test("test_empty_results_list_fails_list_declared", () => {
  const m = clone(COMPLETE) as any;
  m.results = [];
  const v = evaluate(m);
  assert.equal(v.verdict, "VISUAL_REFERENCE_SET_NOT_SOUND");
  assert.equal(checkStatus(v, "visual_reference_results_list_declared"), "fail");
  assert.equal(v.visual_reference_results_count, 0);
  assert.equal(v.sourced_pair_coverage_ratio, null);
});

test("test_non_matching_result_fails_and_lowers_match_ratio", () => {
  const m = clone(COMPLETE) as any;
  m.results[1].matches_brief_by_viewing = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_visual_reference_result_matches_brief_by_viewing"), "fail");
  assert.equal(v.visual_reference_match_ratio, "0.666667");
  assert.equal(v.sections["relevance_and_quality"], "fail");
});

test("test_watermark_present_fails_defect_check", () => {
  const m = clone(COMPLETE) as any;
  m.results[0].watermark_present = true;
  assert.equal(checkStatus(evaluate(m), "no_visual_reference_result_misleading_cropping_watermark_or_caption_mismatch"), "fail");
});

test("test_caption_mismatch_present_fails_defect_check", () => {
  const m = clone(COMPLETE) as any;
  m.results[2].caption_product_mismatch_present = true;
  assert.equal(checkStatus(evaluate(m), "no_visual_reference_result_misleading_cropping_watermark_or_caption_mismatch"), "fail");
});

test("test_row_missing_quality_field_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.results[0].shows_subject_clearly;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "every_visual_reference_result_shows_subject_clearly"), "missing");
});

test("test_publisher_not_noted_fails_context", () => {
  const m = clone(COMPLETE) as any;
  m.results[1].publisher_noted = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_visual_reference_result_publisher_noted"), "fail");
  assert.equal(v.sections["context_and_selection"], "fail");
});

test("test_choice_set_with_two_distinct_fails_when_choice_involved", () => {
  const m = clone(COMPLETE) as any;
  m.results = m.results.slice(0, 2);
  assert.equal(checkStatus(evaluate(m), "visual_reference_choice_set_several_distinct_candidates_when_choice_involved"), "fail");
});

test("test_single_result_passes_when_no_choice_involved", () => {
  const m = clone(COMPLETE) as any;
  m.results = m.results.slice(0, 1);
  m.selection.involves_choice = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "visual_reference_choice_set_several_distinct_candidates_when_choice_involved"), "pass");
  assert.equal(v.verdict, "VISUAL_REFERENCE_SET_SOUND");
});

test("test_absent_involves_choice_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.selection.involves_choice;
  assert.equal(checkStatus(evaluate(m), "visual_reference_choice_set_several_distinct_candidates_when_choice_involved"), "missing");
});

test("test_strongest_match_not_called_out_fails", () => {
  const m = clone(COMPLETE) as any;
  m.selection.strongest_match_called_out_first = false;
  assert.equal(checkStatus(evaluate(m), "visual_reference_strongest_match_called_out_first"), "fail");
});

test("test_unrecognised_licence_status_fails_and_lowers_coverage", () => {
  const m = clone(COMPLETE) as any;
  m.results[0].licence_status = "probably_fine";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_visual_reference_result_licence_status_recognised"), "fail");
  assert.deepEqual(v.visual_reference_results_with_incomplete_licence_attribution, ["ref-1"]);
  assert.equal(v.licence_attribution_coverage_ratio, "0.666667");
});

test("test_missing_licence_note_fails_coverage", () => {
  const m = clone(COMPLETE) as any;
  m.results[2].licence_note_present = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_visual_reference_result_licence_note_present"), "fail");
  assert.equal(v.licence_attribution_coverage_ratio, "0.666667");
});

test("test_claimed_cleared_without_explicit_licence_fails", () => {
  const m = clone(COMPLETE) as any;
  m.results[0].claimed_cleared_for_commercial_use = true;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_visual_reference_result_claimed_cleared_without_explicit_licence"), "fail");
  assert.equal(v.sections["licensing_and_attribution"], "fail");
  assert.equal(v.computed_status, "outside_stated_limits_on_declared_evidence");
});

test("test_claimed_cleared_with_explicit_licence_passes", () => {
  const m = clone(COMPLETE) as any;
  m.results[1].claimed_cleared_for_commercial_use = true;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_visual_reference_result_claimed_cleared_without_explicit_licence"), "pass");
  assert.equal(v.verdict, "VISUAL_REFERENCE_SET_SOUND");
});

test("test_licensing_caution_not_stated_fails", () => {
  const m = clone(COMPLETE) as any;
  m.licensing.licensing_caution_stated_plainly = false;
  assert.equal(checkStatus(evaluate(m), "visual_reference_licensing_caution_stated_plainly"), "fail");
});

test("test_person_identification_fails_red_lines", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.person_identified_in_found_photo_present = true;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "visual_reference_free_of_person_identification"), "fail");
  assert.equal(v.sections["red_lines"], "fail");
  assert.equal(v.verdict, "VISUAL_REFERENCE_SET_NOT_SOUND");
});

test("test_presented_as_own_fails_red_lines", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.found_image_presented_as_own_or_generated_present = true;
  assert.equal(checkStatus(evaluate(m), "visual_reference_free_of_found_image_presented_as_own_or_generated"), "fail");
});

test("test_altered_as_original_fails_red_lines", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.altered_image_passed_as_original_present = true;
  assert.equal(checkStatus(evaluate(m), "visual_reference_free_of_altered_image_passed_as_original"), "fail");
});

test("test_absent_evidence_is_insufficient_not_failed", () => {
  const m = clone(COMPLETE) as any;
  delete m.licensing;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["licensing_and_attribution"], "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.ok(v.checks.every((c) => c.status === "missing"));
  assert.equal(v.computed_status, null);
  assert.equal(v.visual_reference_results_count, null);
  assert.equal(v.duplicate_visual_reference_result_ids, null);
  assert.equal(v.duplicate_visual_reference_direct_image_urls, null);
  assert.equal(v.visual_reference_results_missing_source_pair, null);
  assert.equal(v.visual_reference_results_with_incomplete_licence_attribution, null);
  assert.equal(v.sourced_pair_coverage_ratio, null);
  assert.equal(v.licence_attribution_coverage_ratio, null);
  assert.equal(v.visual_reference_match_ratio, null);
});

test("test_stamp_names_the_verdict", () => {
  assert.ok(stamp(evaluate(clone(COMPLETE))).includes("VERDICT: VISUAL_REFERENCE_SET_SOUND"));
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
  m.search_title = 12345;
  assert.throws(() => evaluate(m), fieldError("search_title"));
});

test("malformed: object section as string rejected", () => {
  assert.throws(() => evaluate({ brief: "should-be-an-object" }), fieldError("brief"));
});

test("malformed: list field as object rejected", () => {
  assert.throws(() => evaluate({ results: { result_id: "ref-1" } }), fieldError("results"));
});

test("malformed: list entry as string rejected", () => {
  assert.throws(() => evaluate({ results: ["ref-1"] }), fieldError("results[0]"));
});

test("malformed: boolean leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.brief.subject_stated = "yes";
  assert.throws(() => evaluate(m), fieldError("brief.subject_stated"));
});

test("malformed: nested list entry string field rejected", () => {
  const m = clone(COMPLETE) as any;
  m.results[1].licence_status = 42;
  assert.throws(() => evaluate(m), fieldError("results[1].licence_status"));
});

test("malformed: nested list entry boolean as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.results[0].source_page_verified = "true";
  assert.throws(() => evaluate(m), fieldError("results[0].source_page_verified"));
});

test("malformed: null section rejected", () => {
  const m = clone(COMPLETE) as any;
  m.licensing = null;
  assert.throws(() => evaluate(m), fieldError("licensing"));
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
  .filter((f) => f.startsWith("sourced-visual-reference-search--") && f.endsWith(".json"))
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
