import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/localization-readiness-review.js";
import { FieldTypeError } from "../src/atoms/validate.js";

const COMPLETE: Record<string, unknown> = {
  product: "example-app",
  externalization: { all_user_visible_strings_externalized: true,
                     stable_keys_used: true,
                     full_sentences_are_translation_units: true,
                     hardcoded_ui_strings_present: false,
                     hardcoded_string_lint_catches_them: true },
  formats: { dates_via_locale_apis: true, times_via_locale_apis: true,
             numbers_via_locale_apis: true, currency_via_locale_apis: true,
             lists_via_locale_apis: true,
             relative_time_via_locale_apis: true,
             timestamps_stored_utc_rendered_local: true,
             hand_rolled_format_masks_present: false },
  grammar: { icu_messageformat_used_for_plurals_and_select: true,
             gender_and_declension_handled_where_required: true },
  layout: { layout_allows_language_length_variance: true,
            fixed_width_text_containers_present: false,
            buttons_wrap_safely: true },
  rtl: { logical_css_properties_used_where_rtl_possible: true,
         mirrored_icons_reviewed: true, rtl_smoke_locale_tested: true },
  workflow: { tms_or_controlled_files_used: true,
              glossary_for_product_terms_present: true,
              brand_names_kept_untranslated: true,
              glossary_respected: true,
              context_notes_for_translators_provided: true,
              machine_translation_drafts_human_reviewed_before_shipping: true },
  testing: { pseudo_localization_pass_done: true,
             pseudo_localization_pass_in_ci_where_possible: true,
             layout_survives_long_strings: true },
  locales: [
    { name: "english-us", code: "en-US", direction: "ltr",
      format_tests_passed: true, screenshots_reviewed: true },
    { name: "french", code: "fr-FR", direction: "ltr",
      format_tests_passed: true, screenshots_reviewed: true },
    { name: "arabic", code: "ar-EG", direction: "rtl",
      format_tests_passed: true, screenshots_reviewed: true },
  ],
  red_lines: { string_concatenation_for_grammar_present: false,
               raw_machine_translation_shipped_unreviewed_for_legal_or_sensitive_text_present: false },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function checkStatus(v: ReturnType<typeof evaluate>, name: string) {
  return v.checks.find((c) => c.check === name)?.status;
}

test("test_complete_manifest_is_sound", () => {
  const v = evaluate(clone(COMPLETE));
  assert.equal(v.verdict, "LOCALIZATION_READINESS_SOUND");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.checks.length, 37);
  assert.equal(v.computed_status, "within_stated_limits_on_declared_evidence");
  assert.equal(v.locales_count, 3);
  assert.deepEqual(v.locales_without_format_tests, []);
  assert.equal(v.format_test_coverage, "1.000000");
  assert.deepEqual(v.locales_with_invalid_direction, []);
  assert.equal(v.valid_direction_coverage, "1.000000");
  assert.deepEqual(v.duplicate_locale_codes, []);
  assert.deepEqual(v.locales_without_screenshots, []);
  assert.equal(v.screenshot_coverage, "1.000000");
});

test("test_hardcoded_strings_fail_externalization", () => {
  const m = clone(COMPLETE) as any;
  m.externalization.hardcoded_ui_strings_present = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "LOCALIZATION_READINESS_NOT_SOUND");
  assert.equal(v.sections["externalized_strings_and_translation_units"], "fail");
  assert.equal(checkStatus(v, "no_hardcoded_ui_strings"), "fail");
});

test("test_no_lint_fails", () => {
  const m = clone(COMPLETE) as any;
  m.externalization.hardcoded_string_lint_catches_them = false;
  assert.equal(evaluate(m).verdict, "LOCALIZATION_READINESS_NOT_SOUND");
});

test("test_hand_rolled_masks_fail_formats", () => {
  const m = clone(COMPLETE) as any;
  m.formats.hand_rolled_format_masks_present = true;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_hand_rolled_format_masks"), "fail");
  assert.equal(v.sections["locale_formats_plurals_and_grammar"], "fail");
});

test("test_no_icu_fails_grammar", () => {
  const m = clone(COMPLETE) as any;
  m.grammar.icu_messageformat_used_for_plurals_and_select = false;
  assert.equal(evaluate(m).verdict, "LOCALIZATION_READINESS_NOT_SOUND");
});

test("test_currency_not_via_locale_api_fails", () => {
  const m = clone(COMPLETE) as any;
  m.formats.currency_via_locale_apis = false;
  assert.equal(checkStatus(evaluate(m), "currency_via_locale_apis"), "fail");
});

test("test_fixed_width_containers_fail_layout", () => {
  const m = clone(COMPLETE) as any;
  m.layout.fixed_width_text_containers_present = true;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_fixed_width_text_containers"), "fail");
  assert.equal(v.sections["flexible_layout_and_rtl_readiness"], "fail");
});

test("test_no_logical_css_fails_rtl", () => {
  const m = clone(COMPLETE) as any;
  m.rtl.logical_css_properties_used_where_rtl_possible = false;
  assert.equal(evaluate(m).verdict, "LOCALIZATION_READINESS_NOT_SOUND");
});

test("test_glossary_not_respected_fails_workflow", () => {
  const m = clone(COMPLETE) as any;
  m.workflow.glossary_respected = false;
  const v = evaluate(m);
  assert.equal(v.sections["content_workflow_and_glossary"], "fail");
});

test("test_brand_names_translated_fails", () => {
  const m = clone(COMPLETE) as any;
  m.workflow.brand_names_kept_untranslated = false;
  assert.equal(checkStatus(evaluate(m), "brand_names_kept_untranslated"), "fail");
});

test("test_locale_without_format_tests_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.locales[0].format_tests_passed = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "LOCALIZATION_READINESS_NOT_SOUND");
  assert.equal(checkStatus(v, "every_locale_has_format_tests_passed"), "fail");
  assert.deepEqual(v.locales_without_format_tests, ["english-us"]);
  assert.equal(v.format_test_coverage, "0.666667");
  assert.equal(v.computed_status, "outside_stated_limits_on_declared_evidence");
});

test("test_locale_missing_format_tests_field_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.locales[0].format_tests_passed;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "every_locale_has_format_tests_passed"), "missing");
  assert.deepEqual(v.locales_without_format_tests, []);
});

test("test_locale_with_invalid_direction_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.locales[1].direction = "vertical";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_locale_direction_valid"), "fail");
  assert.deepEqual(v.locales_with_invalid_direction, ["french"]);
  assert.equal(v.valid_direction_coverage, "0.666667");
});

test("test_locale_missing_direction_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.locales[1].direction;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "every_locale_direction_valid"), "missing");
  assert.deepEqual(v.locales_with_invalid_direction, []);
});

test("test_duplicate_locale_code_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.locales[2].code = "en-US";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_locale_code_declared_twice"), "fail");
  assert.deepEqual(v.duplicate_locale_codes, ["en-US"]);
});

test("test_locale_missing_code_is_missing_for_duplicate_check", () => {
  const m = clone(COMPLETE) as any;
  delete m.locales[2].code;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "no_locale_code_declared_twice"), "missing");
  assert.deepEqual(v.duplicate_locale_codes, []);
});

test("test_locale_without_screenshots_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.locales[1].screenshots_reviewed = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_locale_has_screenshots_reviewed"), "fail");
  assert.deepEqual(v.locales_without_screenshots, ["french"]);
  assert.equal(v.screenshot_coverage, "0.666667");
});

test("test_empty_locales_list_fails", () => {
  const m = clone(COMPLETE) as any;
  m.locales = [];
  const v = evaluate(m);
  assert.equal(checkStatus(v, "locales_declared"), "fail");
  assert.equal(v.locales_count, 0);
  assert.equal(v.format_test_coverage, null);
  assert.equal(v.valid_direction_coverage, null);
  assert.equal(v.screenshot_coverage, null);
  assert.deepEqual(v.duplicate_locale_codes, []);
});

test("test_no_pseudo_pass_fails_testing", () => {
  const m = clone(COMPLETE) as any;
  m.testing.pseudo_localization_pass_done = false;
  const v = evaluate(m);
  assert.equal(v.sections["locale_testing_and_red_lines"], "fail");
});

test("test_string_concatenation_fails_red_line", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.string_concatenation_for_grammar_present = true;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_string_concatenation_for_grammar"), "fail");
  assert.equal(v.sections["locale_testing_and_red_lines"], "fail");
});

test("test_raw_mt_unreviewed_fails_red_line", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.raw_machine_translation_shipped_unreviewed_for_legal_or_sensitive_text_present = true;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_raw_machine_translation_shipped_unreviewed_for_legal_or_sensitive_text"), "fail");
  assert.equal(v.verdict, "LOCALIZATION_READINESS_NOT_SOUND");
});

test("test_absent_evidence_is_insufficient_not_failed", () => {
  const m = clone(COMPLETE) as any;
  delete m.workflow;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["content_workflow_and_glossary"], "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.ok(v.checks.every((c) => c.status === "missing"));
  assert.equal(v.computed_status, null);
  assert.equal(v.locales_count, null);
  assert.equal(v.locales_without_format_tests, null);
  assert.equal(v.format_test_coverage, null);
  assert.equal(v.locales_with_invalid_direction, null);
  assert.equal(v.valid_direction_coverage, null);
  assert.equal(v.duplicate_locale_codes, null);
  assert.equal(v.locales_without_screenshots, null);
  assert.equal(v.screenshot_coverage, null);
});

test("test_stamp_names_the_verdict", () => {
  assert.ok(stamp(evaluate(clone(COMPLETE))).includes("VERDICT: LOCALIZATION_READINESS_SOUND"));
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
  m.product = 12345;
  assert.throws(() => evaluate(m), fieldError("product"));
});

test("malformed: object section as string rejected", () => {
  assert.throws(() => evaluate({ formats: "should-be-an-object" }), fieldError("formats"));
});

test("malformed: list field as object rejected", () => {
  assert.throws(() => evaluate({ locales: { name: "french" } }), fieldError("locales"));
});

test("malformed: list entry as string rejected", () => {
  assert.throws(() => evaluate({ locales: ["french"] }), fieldError("locales[0]"));
});

test("malformed: boolean leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.formats.dates_via_locale_apis = "yes";
  assert.throws(() => evaluate(m), fieldError("formats.dates_via_locale_apis"));
});

test("malformed: nested list entry string field rejected", () => {
  const m = clone(COMPLETE) as any;
  m.locales[0].name = 42;
  assert.throws(() => evaluate(m), fieldError("locales[0].name"));
});

test("malformed: nested list entry direction as boolean rejected", () => {
  const m = clone(COMPLETE) as any;
  m.locales[1].direction = true;
  assert.throws(() => evaluate(m), fieldError("locales[1].direction"));
});

test("malformed: null section rejected", () => {
  const m = clone(COMPLETE) as any;
  m.workflow = null;
  assert.throws(() => evaluate(m), fieldError("workflow"));
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
  .filter((f) => f.startsWith("localization-readiness-review--") && f.endsWith(".json"))
  .sort();

assert.ok(fixtureFiles.length > 0, "no golden fixtures found for this atom");

for (const file of fixtureFiles) {
  const fixture = JSON.parse(
    readFileSync(path.join(fixturesDir, file), "utf-8"),
  ) as Fixture;
  test(`golden fixture parity: ${fixture.name}`, () => {
    assert.deepStrictEqual(evaluate(fixture.manifest), fixture.expected);
  });
  test(`golden fixture JSON byte parity: ${fixture.name}`, () => {
    const v = evaluate(fixture.manifest);
    assert.equal(JSON.stringify(v), JSON.stringify(fixture.expected));
    assert.ok(stamp(v).includes(`VERDICT: ${v.verdict}`));
  });
}
