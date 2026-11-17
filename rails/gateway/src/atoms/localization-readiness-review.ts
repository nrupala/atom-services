// Localization readiness review — deterministic core.
// Faithful TypeScript port of the Python implementation in
// services/localization-readiness-review/src/localization_readiness_review.py
// (evaluate() + stamp()). No logic changes: every verdict, section
// outcome, per-check status, evidence string, computed field and
// the summary string are byte-identical to the Python output for
// the same input. Computed ratios use the shared fixed
// serialization: round half up to 6dp —
// floor(v * 1000000 + 0.5) / 1000000 — then format with exactly six
// decimals; comparisons use the unrounded values.

import { pyStr } from "./release-readiness.js";
import { validateManifest, type FieldSpec } from "./validate.js";

const MANIFEST_SPEC: { [field: string]: FieldSpec } = {
  product: "string",
  externalization: {
    all_user_visible_strings_externalized: "boolean",
    stable_keys_used: "boolean",
    full_sentences_are_translation_units: "boolean",
    hardcoded_ui_strings_present: "boolean",
    hardcoded_string_lint_catches_them: "boolean",
  },
  formats: {
    dates_via_locale_apis: "boolean",
    times_via_locale_apis: "boolean",
    numbers_via_locale_apis: "boolean",
    currency_via_locale_apis: "boolean",
    lists_via_locale_apis: "boolean",
    relative_time_via_locale_apis: "boolean",
    timestamps_stored_utc_rendered_local: "boolean",
    hand_rolled_format_masks_present: "boolean",
  },
  grammar: {
    icu_messageformat_used_for_plurals_and_select: "boolean",
    gender_and_declension_handled_where_required: "boolean",
  },
  layout: {
    layout_allows_language_length_variance: "boolean",
    fixed_width_text_containers_present: "boolean",
    buttons_wrap_safely: "boolean",
  },
  rtl: {
    logical_css_properties_used_where_rtl_possible: "boolean",
    mirrored_icons_reviewed: "boolean",
    rtl_smoke_locale_tested: "boolean",
  },
  workflow: {
    tms_or_controlled_files_used: "boolean",
    glossary_for_product_terms_present: "boolean",
    brand_names_kept_untranslated: "boolean",
    glossary_respected: "boolean",
    context_notes_for_translators_provided: "boolean",
    machine_translation_drafts_human_reviewed_before_shipping: "boolean",
  },
  testing: {
    pseudo_localization_pass_done: "boolean",
    pseudo_localization_pass_in_ci_where_possible: "boolean",
    layout_survives_long_strings: "boolean",
  },
  locales: [{
    name: "string",
    code: "string",
    direction: "string",
    format_tests_passed: "boolean",
    screenshots_reviewed: "boolean",
  }],
  red_lines: {
    string_concatenation_for_grammar_present: "boolean",
    raw_machine_translation_shipped_unreviewed_for_legal_or_sensitive_text_present: "boolean",
  },
};

export const SECTIONS = [
  "externalized_strings_and_translation_units",
  "locale_formats_plurals_and_grammar",
  "flexible_layout_and_rtl_readiness",
  "content_workflow_and_glossary",
  "locale_testing_and_red_lines",
] as const;

const DIRECTIONS = ["ltr", "rtl"];

export type CheckStatus = "pass" | "fail" | "missing";

export interface CheckResult {
  section: string;
  check: string;
  status: CheckStatus;
  evidence: string;
}

export interface Verdict {
  service: string;
  atom_version: string;
  product: unknown;
  verdict: string;
  sections: Record<string, string>;
  checks: CheckResult[];
  computed_status: string | null;
  locales_count: number | null;
  locales_without_format_tests: string[] | null;
  format_test_coverage: string | null;
  locales_with_invalid_direction: string[] | null;
  valid_direction_coverage: string | null;
  duplicate_locale_codes: string[] | null;
  locales_without_screenshots: string[] | null;
  screenshot_coverage: string | null;
  summary: string;
}

function isPyDict(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getPath(
  manifest: Record<string, unknown>,
  ...path: string[]
): [unknown, boolean] {
  let cur: unknown = manifest;
  for (const key of path) {
    if (!isPyDict(cur) || !Object.prototype.hasOwnProperty.call(cur, key)) {
      return [null, false];
    }
    cur = cur[key];
  }
  return [cur, true];
}

function hasField(entry: unknown, field: string): boolean {
  return isPyDict(entry) &&
    Object.prototype.hasOwnProperty.call(entry, field);
}

function check(
  results: CheckResult[],
  section: string,
  name: string,
  _value: unknown,
  present: boolean,
  ok: boolean,
  evidence: string,
): void {
  const status: CheckStatus = !present ? "missing" : ok ? "pass" : "fail";
  results.push({ section, check: name, status, evidence });
}

function boolCheck(
  results: CheckResult[],
  section: string,
  name: string,
  manifest: Record<string, unknown>,
  path: string[],
  evidence: string,
): void {
  const [value, present] = getPath(manifest, ...path);
  check(results, section, name, value, present, value === true, evidence);
}

function falseCheck(
  results: CheckResult[],
  section: string,
  name: string,
  manifest: Record<string, unknown>,
  path: string[],
  evidence: string,
): void {
  const [value, present] = getPath(manifest, ...path);
  check(results, section, name, value, present, value === false, evidence);
}

function fmt6(value: number | null): string | null {
  if (value === null) return null;
  const rounded = Math.floor(value * 1000000 + 0.5) / 1000000;
  return rounded.toFixed(6);
}

function rowName(entry: unknown): string {
  if (isPyDict(entry) && typeof entry["name"] === "string") {
    return entry["name"] as string;
  }
  return "unnamed";
}

export function evaluate(manifest: unknown): Verdict {
  if (!isPyDict(manifest)) {
    throw new TypeError("manifest must be a JSON object");
  }
  validateManifest(manifest, MANIFEST_SPEC);
  const results: CheckResult[] = [];

  const [localesRaw, hasLocales] = getPath(manifest, "locales");
  const localesIsList = hasLocales && Array.isArray(localesRaw);
  const rows: unknown[] = localesIsList ? (localesRaw as unknown[]) : [];
  const localesCount: number | null = localesIsList ? rows.length : null;

  const localesWithoutFormatTests: string[] | null = localesIsList
    ? rows.filter((c) => hasField(c, "format_tests_passed") &&
        (c as Record<string, unknown>)["format_tests_passed"] !== true)
        .map(rowName)
    : null;
  const localesWithInvalidDirection: string[] | null = localesIsList
    ? rows.filter((c) => hasField(c, "direction") &&
        !DIRECTIONS.includes(
          (c as Record<string, unknown>)["direction"] as string))
        .map(rowName)
    : null;
  const localesWithoutScreenshots: string[] | null = localesIsList
    ? rows.filter((c) => hasField(c, "screenshots_reviewed") &&
        (c as Record<string, unknown>)["screenshots_reviewed"] !== true)
        .map(rowName)
    : null;
  let duplicateLocaleCodes: string[] | null = null;
  if (localesIsList) {
    const seen: string[] = [];
    duplicateLocaleCodes = [];
    for (const c of rows) {
      if (isPyDict(c) && typeof c["code"] === "string") {
        const code = c["code"] as string;
        if (seen.includes(code) && !duplicateLocaleCodes.includes(code)) {
          duplicateLocaleCodes.push(code);
        }
        seen.push(code);
      }
    }
  }
  const formatTestCoverage: number | null =
    localesIsList && localesCount !== null && localesCount > 0
      ? rows.filter((c) => isPyDict(c) &&
          c["format_tests_passed"] === true).length / localesCount
      : null;
  const validDirectionCoverage: number | null =
    localesIsList && localesCount !== null && localesCount > 0
      ? rows.filter((c) => isPyDict(c) &&
          DIRECTIONS.includes(c["direction"] as string)).length / localesCount
      : null;
  const screenshotCoverage: number | null =
    localesIsList && localesCount !== null && localesCount > 0
      ? rows.filter((c) => isPyDict(c) &&
          c["screenshots_reviewed"] === true).length / localesCount
      : null;

  // ---- Section 1: externalized_strings_and_translation_units ----
  boolCheck(results, "externalized_strings_and_translation_units",
    "all_user_visible_strings_externalized", manifest,
    ["externalization", "all_user_visible_strings_externalized"],
    "externalize everything: all user-visible strings are in resources");
  boolCheck(results, "externalized_strings_and_translation_units",
    "stable_keys_used", manifest,
    ["externalization", "stable_keys_used"],
    "externalize everything: strings carry stable keys");
  boolCheck(results, "externalized_strings_and_translation_units",
    "full_sentences_are_translation_units", manifest,
    ["externalization", "full_sentences_are_translation_units"],
    "externalize everything: full sentences are translation units — word order varies by language");
  falseCheck(results, "externalized_strings_and_translation_units",
    "no_hardcoded_ui_strings", manifest,
    ["externalization", "hardcoded_ui_strings_present"],
    "quality gate: no hardcoded UI strings are present");
  boolCheck(results, "externalized_strings_and_translation_units",
    "hardcoded_string_lint_catches_them", manifest,
    ["externalization", "hardcoded_string_lint_catches_them"],
    "quality gate: a lint catches hardcoded UI strings");

  // ---- Section 2: locale_formats_plurals_and_grammar ----
  boolCheck(results, "locale_formats_plurals_and_grammar",
    "dates_via_locale_apis", manifest,
    ["formats", "dates_via_locale_apis"],
    "formats via platform APIs: dates are formatted via locale APIs");
  boolCheck(results, "locale_formats_plurals_and_grammar",
    "times_via_locale_apis", manifest,
    ["formats", "times_via_locale_apis"],
    "formats via platform APIs: times are formatted via locale APIs");
  boolCheck(results, "locale_formats_plurals_and_grammar",
    "numbers_via_locale_apis", manifest,
    ["formats", "numbers_via_locale_apis"],
    "formats via platform APIs: numbers are formatted via locale APIs");
  boolCheck(results, "locale_formats_plurals_and_grammar",
    "currency_via_locale_apis", manifest,
    ["formats", "currency_via_locale_apis"],
    "formats via platform APIs: currency is formatted via locale APIs");
  boolCheck(results, "locale_formats_plurals_and_grammar",
    "lists_via_locale_apis", manifest,
    ["formats", "lists_via_locale_apis"],
    "formats via platform APIs: lists are formatted via locale APIs");
  boolCheck(results, "locale_formats_plurals_and_grammar",
    "relative_time_via_locale_apis", manifest,
    ["formats", "relative_time_via_locale_apis"],
    "formats via platform APIs: relative time is formatted via locale APIs");
  boolCheck(results, "locale_formats_plurals_and_grammar",
    "timestamps_stored_utc_rendered_local", manifest,
    ["formats", "timestamps_stored_utc_rendered_local"],
    "formats via platform APIs: timestamps are stored in UTC and rendered local");
  falseCheck(results, "locale_formats_plurals_and_grammar",
    "no_hand_rolled_format_masks", manifest,
    ["formats", "hand_rolled_format_masks_present"],
    "formats via platform APIs: no hand-rolled format masks are present — never hand-rolled masks");
  boolCheck(results, "locale_formats_plurals_and_grammar",
    "icu_messageformat_used_for_plurals_and_select", manifest,
    ["grammar", "icu_messageformat_used_for_plurals_and_select"],
    "plurals and grammar: ICU MessageFormat (plural/select) is used");
  boolCheck(results, "locale_formats_plurals_and_grammar",
    "gender_and_declension_handled_where_required", manifest,
    ["grammar", "gender_and_declension_handled_where_required"],
    "plurals and grammar: gender and declension are handled where the language requires it");

  // ---- Section 3: flexible_layout_and_rtl_readiness ----
  boolCheck(results, "flexible_layout_and_rtl_readiness",
    "layout_allows_language_length_variance", manifest,
    ["layout", "layout_allows_language_length_variance"],
    "layout that flexes: layout allows language length variance");
  falseCheck(results, "flexible_layout_and_rtl_readiness",
    "no_fixed_width_text_containers", manifest,
    ["layout", "fixed_width_text_containers_present"],
    "layout that flexes: no fixed-width text containers are present");
  boolCheck(results, "flexible_layout_and_rtl_readiness",
    "buttons_wrap_safely", manifest,
    ["layout", "buttons_wrap_safely"],
    "layout that flexes: buttons wrap safely");
  boolCheck(results, "flexible_layout_and_rtl_readiness",
    "logical_css_properties_used_where_rtl_possible", manifest,
    ["rtl", "logical_css_properties_used_where_rtl_possible"],
    "RTL readiness: logical CSS properties — start/end, not left/right — are used where RTL is possible");
  boolCheck(results, "flexible_layout_and_rtl_readiness",
    "mirrored_icons_reviewed", manifest,
    ["rtl", "mirrored_icons_reviewed"],
    "RTL readiness: mirrored icons are reviewed");
  boolCheck(results, "flexible_layout_and_rtl_readiness",
    "rtl_smoke_locale_tested", manifest,
    ["rtl", "rtl_smoke_locale_tested"],
    "RTL readiness: one RTL smoke locale is tested if in scope");

  // ---- Section 4: content_workflow_and_glossary ----
  boolCheck(results, "content_workflow_and_glossary",
    "tms_or_controlled_files_used", manifest,
    ["workflow", "tms_or_controlled_files_used"],
    "content workflow: a TMS or controlled files are used");
  boolCheck(results, "content_workflow_and_glossary",
    "glossary_for_product_terms_present", manifest,
    ["workflow", "glossary_for_product_terms_present"],
    "content workflow: a glossary for product terms is present");
  boolCheck(results, "content_workflow_and_glossary",
    "brand_names_kept_untranslated", manifest,
    ["workflow", "brand_names_kept_untranslated"],
    "content workflow: brand names are kept untranslated");
  boolCheck(results, "content_workflow_and_glossary",
    "glossary_respected", manifest,
    ["workflow", "glossary_respected"],
    "quality gate: the glossary is respected and brand terms are protected");
  boolCheck(results, "content_workflow_and_glossary",
    "context_notes_for_translators_provided", manifest,
    ["workflow", "context_notes_for_translators_provided"],
    "content workflow: context notes for translators are provided");
  boolCheck(results, "content_workflow_and_glossary",
    "machine_translation_drafts_human_reviewed_before_shipping", manifest,
    ["workflow", "machine_translation_drafts_human_reviewed_before_shipping"],
    "content workflow: machine translation drafts receive human review for anything shipped");

  // ---- Section 5: locale_testing_and_red_lines ----
  boolCheck(results, "locale_testing_and_red_lines",
    "pseudo_localization_pass_done", manifest,
    ["testing", "pseudo_localization_pass_done"],
    "locale testing: a pseudo-localization pass is done");
  boolCheck(results, "locale_testing_and_red_lines",
    "pseudo_localization_pass_in_ci_where_possible", manifest,
    ["testing", "pseudo_localization_pass_in_ci_where_possible"],
    "locale testing: the pseudo-localization pass runs in CI where possible");
  boolCheck(results, "locale_testing_and_red_lines",
    "layout_survives_long_strings", manifest,
    ["testing", "layout_survives_long_strings"],
    "quality gate: layout survives long strings");
  check(results, "locale_testing_and_red_lines",
    "locales_declared", localesRaw, localesIsList,
    localesIsList && (localesCount as number) > 0,
    "the declared record names its locales — the locales list is present and non-empty");
  const fmtPresent = localesIsList &&
    rows.every((c) => hasField(c, "format_tests_passed"));
  check(results, "locale_testing_and_red_lines",
    "every_locale_has_format_tests_passed", localesRaw, fmtPresent,
    localesIsList && (localesCount as number) > 0 &&
      rows.every((c) => isPyDict(c) && c["format_tests_passed"] === true),
    "locale testing: every declared locale row passes its per-locale unit tests for formats");
  const dirPresent = localesIsList &&
    rows.every((c) => hasField(c, "direction"));
  check(results, "locale_testing_and_red_lines",
    "every_locale_direction_valid", localesRaw, dirPresent,
    localesIsList && (localesCount as number) > 0 &&
      rows.every((c) => isPyDict(c) &&
        DIRECTIONS.includes(c["direction"] as string)),
    "locale testing: every declared locale row declares a direction from the skill's distinction — ltr / rtl");
  const codePresent = localesIsList &&
    rows.every((c) => hasField(c, "code"));
  check(results, "locale_testing_and_red_lines",
    "no_locale_code_declared_twice", localesRaw, codePresent,
    localesIsList && duplicateLocaleCodes !== null &&
      duplicateLocaleCodes.length === 0,
    "locale testing: no declared locale code is declared by more than one locale row");
  const shotPresent = localesIsList &&
    rows.every((c) => hasField(c, "screenshots_reviewed"));
  check(results, "locale_testing_and_red_lines",
    "every_locale_has_screenshots_reviewed", localesRaw, shotPresent,
    localesIsList && (localesCount as number) > 0 &&
      rows.every((c) => isPyDict(c) &&
        c["screenshots_reviewed"] === true),
    "locale testing: every declared locale row has screenshots of key screens reviewed for its language");
  falseCheck(results, "locale_testing_and_red_lines",
    "no_string_concatenation_for_grammar", manifest,
    ["red_lines", "string_concatenation_for_grammar_present"],
    "red line: no string concatenation for grammar is present");
  falseCheck(results, "locale_testing_and_red_lines",
    "no_raw_machine_translation_shipped_unreviewed_for_legal_or_sensitive_text", manifest,
    ["red_lines", "raw_machine_translation_shipped_unreviewed_for_legal_or_sensitive_text_present"],
    "red line: no raw machine translation is shipped unreviewed for legal or sensitive text");

  const sections: Record<string, string> = {};
  for (const section of SECTIONS) {
    const secResults = results.filter((r) => r.section === section);
    if (secResults.some((r) => r.status === "fail")) {
      sections[section] = "fail";
    } else if (secResults.some((r) => r.status === "missing")) {
      sections[section] = "insufficient_evidence";
    } else {
      sections[section] = "pass";
    }
  }

  let verdict: string;
  if (Object.values(sections).some((v) => v === "fail")) {
    verdict = "LOCALIZATION_READINESS_NOT_SOUND";
  } else if (Object.values(sections).some((v) => v === "insufficient_evidence")) {
    verdict = "INSUFFICIENT_EVIDENCE";
  } else {
    verdict = "LOCALIZATION_READINESS_SOUND";
  }

  const computedNames = [
    "locales_declared",
    "every_locale_has_format_tests_passed",
    "every_locale_direction_valid",
    "no_locale_code_declared_twice",
    "every_locale_has_screenshots_reviewed",
  ];
  const computedStatuses = results
    .filter((r) => computedNames.includes(r.check))
    .map((r) => r.status);
  let computedStatus: string | null;
  if (computedStatuses.some((s) => s === "fail")) {
    computedStatus = "outside_stated_limits_on_declared_evidence";
  } else if (computedStatuses.every((s) => s === "pass")) {
    computedStatus = "within_stated_limits_on_declared_evidence";
  } else {
    computedStatus = null;
  }

  const count = (status: CheckStatus) =>
    results.filter((r) => r.status === status).length;

  return {
    service: "localization-readiness-review",
    atom_version: "0.1.0",
    product: manifest["product"] ?? null,
    verdict,
    sections,
    checks: results,
    computed_status: computedStatus,
    locales_count: localesCount,
    locales_without_format_tests: localesWithoutFormatTests,
    format_test_coverage: fmt6(formatTestCoverage),
    locales_with_invalid_direction: localesWithInvalidDirection,
    valid_direction_coverage: fmt6(validDirectionCoverage),
    duplicate_locale_codes: duplicateLocaleCodes,
    locales_without_screenshots: localesWithoutScreenshots,
    screenshot_coverage: fmt6(screenshotCoverage),
    summary:
      `${count("pass")} pass, ` +
      `${count("fail")} fail, ` +
      `${count("missing")} missing ` +
      `of ${results.length} checks across five sections.`,
  };
}

export function stamp(verdict: Verdict): string {
  const lines: string[] = [
    "LOCALIZATION READINESS REVIEW",
    `product: ${pyStr(verdict.product ?? null)}`,
    `VERDICT: ${verdict.verdict}`,
  ];
  for (const section of SECTIONS) {
    lines.push(`  ${section.padEnd(36)} ${verdict.sections[section]}`);
  }
  lines.push(verdict.summary);
  return lines.join("\n");
}
