import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/semantic-html-review.js";
import { FieldTypeError } from "../src/atoms/validate.js";

const COMPLETE: Record<string, unknown> = {
  page: "pricing-page",
  landmarks: { header_landmark_present: true,
               nav_landmark_present: true,
               main_landmark_present: true,
               footer_landmark_present: true,
               exactly_one_main_landmark_declared: true },
  headings: [
    { level: 1, label: "Pricing" },
    { level: 2, label: "Plans" },
    { level: 3, label: "Team plan" },
    { level: 2, label: "FAQ" },
  ],
  semantic_elements: { nav_element_carries_navigation: true,
                       main_element_carries_primary_content: true,
                       article_element_for_self_contained_content: true,
                       section_elements_have_real_meaning: true,
                       figure_elements_have_figcaptions: true,
                       time_elements_for_dates_and_times: true,
                       generic_divs_used_only_when_no_semantic_element_fits: true },
  controls: { button_elements_for_actions: true,
              anchor_elements_for_navigation: true,
              fieldset_legend_group_related_inputs: true,
              keyboard_only_traversal_passed_for_all_interactive_elements: true },
  form_inputs: [
    { input_ref: "email", label_bound: true },
    { input_ref: "plan-tier", label_bound: true },
  ],
  media: { captions_present_for_media_elements: true },
  images: [
    { image_ref: "hero-chart", decorative: false, alt_text: "Bar chart of monthly signups" },
    { image_ref: "bg-swirl", decorative: true, alt_text: "" },
  ],
  data_tables: [
    { table_ref: "plan-comparison", thead_present: true, th_scope_present: true, caption_present: true },
  ],
  document_head: { html_lang_attribute_set: true,
                   viewport_meta_declared: true,
                   charset_meta_first_in_head: true,
                   page_title_descriptive: true },
  aria_practice: { native_semantics_preferred_before_aria: true,
                   aria_used_only_for_real_gaps: true,
                   aria_not_used_to_simulate_controls: true },
  validation: { w3c_validator_reports_clean: true,
                htmlhint_reports_clean: true,
                invalid_nesting_absent_from_markup: true },
  red_lines: { div_span_click_handlers_present: false,
               layout_tables_present: false,
               lang_or_title_missing_present: false },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function checkStatus(v: ReturnType<typeof evaluate>, name: string) {
  return v.checks.find((c) => c.check === name)?.status;
}

test("test_complete_manifest_is_sound", () => {
  const v = evaluate(clone(COMPLETE));
  assert.equal(v.verdict, "SEMANTIC_HTML_REVIEW_SOUND");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.checks.length, 45);
  assert.equal(v.computed_status, "within_stated_limits_on_declared_evidence");
  assert.equal(v.headings_count, 4);
  assert.equal(v.h1_count, 1);
  assert.deepEqual(v.heading_level_skip_positions, []);
  assert.equal(v.form_inputs_count, 2);
  assert.deepEqual(v.form_inputs_without_bound_label, []);
  assert.deepEqual(v.duplicate_form_input_refs, []);
  assert.equal(v.labelled_input_coverage, "1.000000");
  assert.equal(v.images_count, 2);
  assert.deepEqual(v.content_images_without_meaningful_alt, []);
  assert.deepEqual(v.decorative_images_with_nonempty_alt, []);
  assert.deepEqual(v.duplicate_image_refs, []);
  assert.equal(v.appropriate_alt_coverage, "1.000000");
  assert.equal(v.data_tables_count, 1);
  assert.deepEqual(v.data_tables_without_thead, []);
  assert.deepEqual(v.data_tables_without_th_scope, []);
  assert.deepEqual(v.data_tables_without_caption, []);
  assert.deepEqual(v.duplicate_table_refs, []);
  assert.equal(v.fully_structured_table_coverage, "1.000000");
});

test("test_empty_row_lists_are_valid_declarations", () => {
  const m = clone(COMPLETE) as any;
  m.form_inputs = [];
  m.images = [];
  m.data_tables = [];
  const v = evaluate(m);
  assert.equal(v.verdict, "SEMANTIC_HTML_REVIEW_SOUND");
  assert.equal(v.form_inputs_count, 0);
  assert.equal(v.images_count, 0);
  assert.equal(v.data_tables_count, 0);
  assert.equal(v.labelled_input_coverage, null);
  assert.equal(v.appropriate_alt_coverage, null);
  assert.equal(v.fully_structured_table_coverage, null);
  assert.equal(checkStatus(v, "form_input_inventory_declared"), "pass");
  assert.equal(checkStatus(v, "every_declared_form_input_has_a_bound_label"), "pass");
});

test("test_missing_main_landmark_fails_section1", () => {
  const m = clone(COMPLETE) as any;
  m.landmarks.main_landmark_present = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "SEMANTIC_HTML_REVIEW_DEFICIENT");
  assert.equal(v.sections["landmarks_and_heading_outline"], "fail");
  assert.equal(checkStatus(v, "main_landmark_present"), "fail");
});

test("test_two_h1_headings_fail_and_are_counted", () => {
  const m = clone(COMPLETE) as any;
  m.headings.push({ level: 1, label: "Second top heading" });
  const v = evaluate(m);
  assert.equal(v.verdict, "SEMANTIC_HTML_REVIEW_DEFICIENT");
  assert.equal(checkStatus(v, "exactly_one_h1_in_declared_heading_outline"), "fail");
  assert.equal(v.h1_count, 2);
  assert.equal(v.computed_status, "outside_stated_limits_on_declared_evidence");
});

test("test_zero_h1_headings_fail", () => {
  const m = clone(COMPLETE) as any;
  m.headings[0].level = 2;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "exactly_one_h1_in_declared_heading_outline"), "fail");
  assert.equal(v.h1_count, 0);
});

test("test_heading_level_skip_fails_and_is_positioned", () => {
  const m = clone(COMPLETE) as any;
  m.headings[1].level = 3;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "heading_outline_levels_never_skip_a_level"), "fail");
  assert.deepEqual(v.heading_level_skip_positions, [1]);
});

test("test_heading_row_missing_level_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.headings[2].level;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "exactly_one_h1_in_declared_heading_outline"), "missing");
  assert.equal(checkStatus(v, "heading_outline_levels_never_skip_a_level"), "missing");
});

test("test_absent_headings_list_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.headings;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "heading_outline_declared"), "missing");
  assert.equal(v.headings_count, null);
  assert.equal(v.h1_count, null);
  assert.equal(v.heading_level_skip_positions, null);
  assert.equal(v.computed_status, null);
});

test("test_clickable_div_semantics_fail_section2", () => {
  const m = clone(COMPLETE) as any;
  m.semantic_elements.generic_divs_used_only_when_no_semantic_element_fits = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "SEMANTIC_HTML_REVIEW_DEFICIENT");
  assert.equal(v.sections["semantic_elements"], "fail");
});

test("test_unlabelled_input_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.form_inputs[0].label_bound = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "SEMANTIC_HTML_REVIEW_DEFICIENT");
  assert.equal(checkStatus(v, "every_declared_form_input_has_a_bound_label"), "fail");
  assert.deepEqual(v.form_inputs_without_bound_label, ["email"]);
  assert.equal(v.labelled_input_coverage, "0.500000");
});

test("test_input_missing_label_field_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.form_inputs[1].label_bound;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "every_declared_form_input_has_a_bound_label"), "missing");
  assert.deepEqual(v.form_inputs_without_bound_label, []);
});

test("test_duplicate_input_ref_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.form_inputs[1].input_ref = "email";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_declared_form_input_ref_repeated"), "fail");
  assert.deepEqual(v.duplicate_form_input_refs, ["email"]);
});

test("test_keyboard_pass_not_done_fails_section3", () => {
  const m = clone(COMPLETE) as any;
  m.controls.keyboard_only_traversal_passed_for_all_interactive_elements = false;
  assert.equal(evaluate(m).sections["real_controls_and_labels"], "fail");
});

test("test_content_image_empty_alt_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.images[0].alt_text = "";
  const v = evaluate(m);
  assert.equal(v.verdict, "SEMANTIC_HTML_REVIEW_DEFICIENT");
  assert.equal(checkStatus(v, "every_content_image_has_meaningful_alt_text"), "fail");
  assert.deepEqual(v.content_images_without_meaningful_alt, ["hero-chart"]);
  assert.equal(v.appropriate_alt_coverage, "0.500000");
});

test("test_decorative_image_nonempty_alt_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.images[1].alt_text = "swirl decoration";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_decorative_image_has_empty_alt_text"), "fail");
  assert.deepEqual(v.decorative_images_with_nonempty_alt, ["bg-swirl"]);
  assert.equal(v.appropriate_alt_coverage, "0.500000");
});

test("test_image_missing_alt_fields_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.images[0].alt_text;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "every_content_image_has_meaningful_alt_text"), "missing");
  assert.deepEqual(v.content_images_without_meaningful_alt, []);
});

test("test_duplicate_image_ref_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.images[1].image_ref = "hero-chart";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_declared_image_ref_repeated"), "fail");
  assert.deepEqual(v.duplicate_image_refs, ["hero-chart"]);
});

test("test_table_without_caption_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.data_tables[0].caption_present = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "SEMANTIC_HTML_REVIEW_DEFICIENT");
  assert.equal(checkStatus(v, "every_data_table_declares_a_caption"), "fail");
  assert.deepEqual(v.data_tables_without_caption, ["plan-comparison"]);
  assert.equal(v.fully_structured_table_coverage, "0.000000");
});

test("test_table_without_th_scope_fails", () => {
  const m = clone(COMPLETE) as any;
  m.data_tables[0].th_scope_present = false;
  assert.equal(checkStatus(evaluate(m), "every_data_table_declares_th_scope"), "fail");
});

test("test_missing_lang_fails_section6", () => {
  const m = clone(COMPLETE) as any;
  m.document_head.html_lang_attribute_set = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "SEMANTIC_HTML_REVIEW_DEFICIENT");
  assert.equal(v.sections["document_head_hygiene"], "fail");
});

test("test_aria_faking_controls_fails_section7", () => {
  const m = clone(COMPLETE) as any;
  m.aria_practice.aria_not_used_to_simulate_controls = false;
  const v = evaluate(m);
  assert.equal(v.sections["aria_practice"], "fail");
  assert.equal(checkStatus(v, "aria_not_used_to_simulate_controls"), "fail");
});

test("test_invalid_nesting_fails_section8", () => {
  const m = clone(COMPLETE) as any;
  m.validation.invalid_nesting_absent_from_markup = false;
  assert.equal(evaluate(m).sections["validation_and_nesting"], "fail");
});

test("test_validator_not_clean_fails", () => {
  const m = clone(COMPLETE) as any;
  m.validation.w3c_validator_reports_clean = false;
  assert.equal(checkStatus(evaluate(m), "w3c_validator_reports_clean"), "fail");
});

test("test_div_click_handlers_fail_red_lines", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.div_span_click_handlers_present = true;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_div_or_span_click_handlers"), "fail");
  assert.equal(v.sections["red_lines"], "fail");
});

test("test_layout_tables_fail_red_lines", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.layout_tables_present = true;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_layout_tables_in_markup"), "fail");
  assert.equal(v.verdict, "SEMANTIC_HTML_REVIEW_DEFICIENT");
});

test("test_missing_lang_or_title_fails_red_lines", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.lang_or_title_missing_present = true;
  assert.equal(checkStatus(evaluate(m), "no_missing_lang_or_title"), "fail");
});

test("test_absent_evidence_is_insufficient_not_failed", () => {
  const m = clone(COMPLETE) as any;
  delete m.aria_practice;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["aria_practice"], "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.ok(v.checks.every((c) => c.status === "missing"));
  assert.equal(v.computed_status, null);
  assert.equal(v.headings_count, null);
  assert.equal(v.h1_count, null);
  assert.equal(v.heading_level_skip_positions, null);
  assert.equal(v.form_inputs_count, null);
  assert.equal(v.images_count, null);
  assert.equal(v.data_tables_count, null);
  assert.equal(v.labelled_input_coverage, null);
  assert.equal(v.appropriate_alt_coverage, null);
  assert.equal(v.fully_structured_table_coverage, null);
});

test("test_stamp_names_the_verdict", () => {
  assert.ok(stamp(evaluate(clone(COMPLETE))).includes("VERDICT: SEMANTIC_HTML_REVIEW_SOUND"));
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
  m.page = 12345;
  assert.throws(() => evaluate(m), fieldError("page"));
});

test("malformed: object section as string rejected", () => {
  assert.throws(() => evaluate({ landmarks: "should-be-an-object" }), fieldError("landmarks"));
});

test("malformed: list field as object rejected", () => {
  assert.throws(() => evaluate({ images: { image_ref: "hero" } }), fieldError("images"));
});

test("malformed: list entry as string rejected", () => {
  assert.throws(() => evaluate({ images: ["hero"] }), fieldError("images[0]"));
});

test("malformed: boolean leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.validation.w3c_validator_reports_clean = "yes";
  assert.throws(() => evaluate(m), fieldError("validation.w3c_validator_reports_clean"));
});

test("malformed: number leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.headings[0].level = "1";
  assert.throws(() => evaluate(m), fieldError("headings[0].level"));
});

test("malformed: nested list entry string field rejected", () => {
  const m = clone(COMPLETE) as any;
  m.images[0].alt_text = 42;
  assert.throws(() => evaluate(m), fieldError("images[0].alt_text"));
});

test("malformed: nested list entry boolean field rejected", () => {
  const m = clone(COMPLETE) as any;
  m.form_inputs[1].label_bound = 7;
  assert.throws(() => evaluate(m), fieldError("form_inputs[1].label_bound"));
});

test("malformed: null section rejected", () => {
  const m = clone(COMPLETE) as any;
  m.document_head = null;
  assert.throws(() => evaluate(m), fieldError("document_head"));
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
  .filter((f) => f.startsWith("semantic-html-review--") && f.endsWith(".json"))
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
