import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/honest-seo-audit-intent-map.js";
import { FieldTypeError } from "../src/atoms/validate.js";

const COMPLETE: Record<string, unknown> = {
  site: "example-site",
  technical: { crawlable_robots_and_sitemap: true,
               core_web_vitals_targets_addressed: true,
               mobile_first: true, https_enabled: true,
               canonical_tags_correct: true,
               accidental_noindex_or_blocked_paths_present: false,
               clean_url_structure: true, not_found_404s_handled: true },
  intent: { audience_questions_mapped: true,
            intent_type_assigned_per_question: true,
            prioritization_by_relevance_and_feasibility: true },
  on_page: { titles_and_descriptions_specific_and_honest: true,
             heading_hierarchy_present: true,
             internal_links_with_descriptive_anchors: true,
             clickbait_mismatch_present: false,
             word_count_padding_present: false },
  pages: [
    { name: "pricing-guide", intent: "pricing-questions",
      intent_type: "commercial", has_single_intent: true,
      fully_answers_question: true },
    { name: "how-it-works", intent: "how-it-works-questions",
      intent_type: "informational", has_single_intent: true,
      fully_answers_question: true },
    { name: "buy", intent: "purchase",
      intent_type: "transactional", has_single_intent: true,
      fully_answers_question: true },
  ],
  structured_data: { schema_org_applied_as_applicable: true,
                     rich_results_validated: true },
  entity: { brand_name_contact_consistent: true,
            real_author_identity_for_professional_content: true,
            credentials_carried_where_appropriate: true,
            public_content_sanitization_applied: true },
  authority: { useful_assets_created_to_attract_links: true,
               relevant_human_outreach_only: true },
  measurement: { search_console_and_analytics_wired: true,
                 search_console_baseline_captured: true,
                 impressions_clicks_conversions_tracked: true,
                 queries_gained_lost_tracked: true,
                 monthly_iteration_cadence: true,
                 decaying_pages_refreshed_on_schedule: true },
  ai_era: { structure_and_canonical_answers_designed_for_extraction: true },
  red_lines: { cloaking_present: false, pbn_present: false,
               bought_links_present: false, link_schemes_present: false,
               keyword_spam_present: false,
               misleading_metadata_present: false,
               fake_urgency_present: false },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function checkStatus(v: ReturnType<typeof evaluate>, name: string) {
  return v.checks.find((c) => c.check === name)?.status;
}

test("test_complete_manifest_is_sound", () => {
  const v = evaluate(clone(COMPLETE));
  assert.equal(v.verdict, "HONEST_SEO_MAP_SOUND");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.checks.length, 43);
  assert.equal(v.computed_status, "within_stated_limits_on_declared_evidence");
  assert.equal(v.pages_count, 3);
  assert.deepEqual(v.pages_without_single_intent, []);
  assert.equal(v.single_intent_coverage, "1.000000");
  assert.deepEqual(v.pages_with_invalid_intent_type, []);
  assert.equal(v.valid_intent_type_coverage, "1.000000");
  assert.deepEqual(v.duplicate_intents, []);
  assert.deepEqual(v.pages_not_fully_answering, []);
  assert.equal(v.full_answer_coverage, "1.000000");
});

test("test_no_https_fails_technical_section", () => {
  const m = clone(COMPLETE) as any;
  m.technical.https_enabled = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "HONEST_SEO_MAP_NOT_SOUND");
  assert.equal(v.sections["technical_foundation"], "fail");
  assert.equal(checkStatus(v, "https_enabled"), "fail");
});

test("test_accidental_noindex_fails", () => {
  const m = clone(COMPLETE) as any;
  m.technical.accidental_noindex_or_blocked_paths_present = true;
  assert.equal(checkStatus(evaluate(m), "no_accidental_noindex_or_blocked_paths"), "fail");
});

test("test_canonicals_wrong_fails", () => {
  const m = clone(COMPLETE) as any;
  m.technical.canonical_tags_correct = false;
  assert.equal(evaluate(m).verdict, "HONEST_SEO_MAP_NOT_SOUND");
});

test("test_vanity_prioritization_fails_intent_section", () => {
  const m = clone(COMPLETE) as any;
  m.intent.prioritization_by_relevance_and_feasibility = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "HONEST_SEO_MAP_NOT_SOUND");
  assert.equal(v.sections["intent_map_and_on_page_craft"], "fail");
});

test("test_clickbait_mismatch_fails", () => {
  const m = clone(COMPLETE) as any;
  m.on_page.clickbait_mismatch_present = true;
  assert.equal(checkStatus(evaluate(m), "no_clickbait_mismatch"), "fail");
});

test("test_word_count_padding_fails", () => {
  const m = clone(COMPLETE) as any;
  m.on_page.word_count_padding_present = true;
  assert.equal(checkStatus(evaluate(m), "no_word_count_padding"), "fail");
});

test("test_page_without_single_intent_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.pages[0].has_single_intent = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "HONEST_SEO_MAP_NOT_SOUND");
  assert.equal(checkStatus(v, "every_page_has_single_intent"), "fail");
  assert.deepEqual(v.pages_without_single_intent, ["pricing-guide"]);
  assert.equal(v.single_intent_coverage, "0.666667");
  assert.equal(v.computed_status, "outside_stated_limits_on_declared_evidence");
});

test("test_page_missing_single_intent_field_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.pages[0].has_single_intent;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "every_page_has_single_intent"), "missing");
  assert.deepEqual(v.pages_without_single_intent, []);
});

test("test_page_with_invalid_intent_type_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.pages[1].intent_type = "navigational";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_page_intent_type_valid"), "fail");
  assert.deepEqual(v.pages_with_invalid_intent_type, ["how-it-works"]);
  assert.equal(v.valid_intent_type_coverage, "0.666667");
});

test("test_page_missing_intent_type_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.pages[1].intent_type;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "every_page_intent_type_valid"), "missing");
  assert.deepEqual(v.pages_with_invalid_intent_type, []);
});

test("test_duplicate_intent_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.pages[2].intent = "pricing-questions";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_intent_owned_by_multiple_pages"), "fail");
  assert.deepEqual(v.duplicate_intents, ["pricing-questions"]);
});

test("test_page_missing_intent_is_missing_for_duplicate_check", () => {
  const m = clone(COMPLETE) as any;
  delete m.pages[2].intent;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "no_intent_owned_by_multiple_pages"), "missing");
  assert.deepEqual(v.duplicate_intents, []);
});

test("test_page_not_fully_answering_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.pages[1].fully_answers_question = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_page_fully_answers_question"), "fail");
  assert.deepEqual(v.pages_not_fully_answering, ["how-it-works"]);
  assert.equal(v.full_answer_coverage, "0.666667");
});

test("test_empty_pages_list_fails", () => {
  const m = clone(COMPLETE) as any;
  m.pages = [];
  const v = evaluate(m);
  assert.equal(checkStatus(v, "pages_declared"), "fail");
  assert.equal(v.pages_count, 0);
  assert.equal(v.single_intent_coverage, null);
  assert.equal(v.valid_intent_type_coverage, null);
  assert.equal(v.full_answer_coverage, null);
  assert.deepEqual(v.duplicate_intents, []);
});

test("test_schema_not_applied_fails_structured_section", () => {
  const m = clone(COMPLETE) as any;
  m.structured_data.schema_org_applied_as_applicable = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "HONEST_SEO_MAP_NOT_SOUND");
  assert.equal(v.sections["structured_data_and_entity_clarity"], "fail");
});

test("test_no_real_author_identity_fails", () => {
  const m = clone(COMPLETE) as any;
  m.entity.real_author_identity_for_professional_content = false;
  assert.equal(evaluate(m).verdict, "HONEST_SEO_MAP_NOT_SOUND");
});

test("test_no_baseline_fails_measurement", () => {
  const m = clone(COMPLETE) as any;
  m.measurement.search_console_baseline_captured = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "search_console_baseline_captured"), "fail");
  assert.equal(v.sections["earned_authority_and_measurement"], "fail");
});

test("test_extraction_design_missing_fails_ai_era_check", () => {
  const m = clone(COMPLETE) as any;
  m.ai_era.structure_and_canonical_answers_designed_for_extraction = false;
  assert.equal(evaluate(m).verdict, "HONEST_SEO_MAP_NOT_SOUND");
});

test("test_cloaking_fails_red_lines", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.cloaking_present = true;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_cloaking"), "fail");
  assert.equal(v.sections["white_hat_red_lines"], "fail");
});

test("test_bought_links_fail_red_lines", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.bought_links_present = true;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_bought_links"), "fail");
  assert.equal(v.verdict, "HONEST_SEO_MAP_NOT_SOUND");
});

test("test_pbn_and_keyword_spam_fail_red_lines", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.pbn_present = true;
  m.red_lines.keyword_spam_present = true;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_pbn"), "fail");
  assert.equal(checkStatus(v, "no_keyword_spam"), "fail");
});

test("test_fake_urgency_fails_red_lines", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.fake_urgency_present = true;
  assert.equal(checkStatus(evaluate(m), "no_fake_urgency"), "fail");
});

test("test_absent_evidence_is_insufficient_not_failed", () => {
  const m = clone(COMPLETE) as any;
  delete m.measurement;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["earned_authority_and_measurement"], "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.ok(v.checks.every((c) => c.status === "missing"));
  assert.equal(v.computed_status, null);
  assert.equal(v.pages_count, null);
  assert.equal(v.pages_without_single_intent, null);
  assert.equal(v.single_intent_coverage, null);
  assert.equal(v.pages_with_invalid_intent_type, null);
  assert.equal(v.valid_intent_type_coverage, null);
  assert.equal(v.duplicate_intents, null);
  assert.equal(v.pages_not_fully_answering, null);
  assert.equal(v.full_answer_coverage, null);
});

test("test_stamp_names_the_verdict", () => {
  assert.ok(stamp(evaluate(clone(COMPLETE))).includes("VERDICT: HONEST_SEO_MAP_SOUND"));
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
  m.site = 12345;
  assert.throws(() => evaluate(m), fieldError("site"));
});

test("malformed: object section as string rejected", () => {
  assert.throws(() => evaluate({ technical: "should-be-an-object" }), fieldError("technical"));
});

test("malformed: list field as object rejected", () => {
  assert.throws(() => evaluate({ pages: { name: "pricing-guide" } }), fieldError("pages"));
});

test("malformed: list entry as string rejected", () => {
  assert.throws(() => evaluate({ pages: ["pricing-guide"] }), fieldError("pages[0]"));
});

test("malformed: boolean leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.technical.https_enabled = "yes";
  assert.throws(() => evaluate(m), fieldError("technical.https_enabled"));
});

test("malformed: nested list entry string field rejected", () => {
  const m = clone(COMPLETE) as any;
  m.pages[0].name = 42;
  assert.throws(() => evaluate(m), fieldError("pages[0].name"));
});

test("malformed: nested list entry intent_type as boolean rejected", () => {
  const m = clone(COMPLETE) as any;
  m.pages[1].intent_type = true;
  assert.throws(() => evaluate(m), fieldError("pages[1].intent_type"));
});

test("malformed: null section rejected", () => {
  const m = clone(COMPLETE) as any;
  m.entity = null;
  assert.throws(() => evaluate(m), fieldError("entity"));
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
  .filter((f) => f.startsWith("honest-seo-audit-intent-map--") && f.endsWith(".json"))
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
