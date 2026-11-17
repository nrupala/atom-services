# Localization readiness review — user guide

Full documentation: [DOCUMENTATION.md](DOCUMENTATION.md)

## What it does

You are internationalizing a product properly — external strings, ICU formats, RTL, locale-aware everything, tested — and you have a record of your product's localization readiness. This atom reads one declared manifest and returns one deterministic verdict across five sections: **LOCALIZATION_READINESS_SOUND**, **LOCALIZATION_READINESS_NOT_SOUND**, or **INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing — the verdict names exactly which). It audits the declared record's completeness and consistency only — it inspects no source code, runs no lint or pseudo-localization, renders no screen, executes no format test, and does not verify that a declared control actually works. A record is sound *on your declared evidence*: it never judges whether a translation is accurate or idiomatic, whether a format renders correctly for a locale, whether a layout truly survives a language, or whether a glossary term is the right term. Computed checks: the declared `locales` list must be present and non-empty; every declared locale row must pass its format tests, must declare a `direction` from the skill's own distinction (`ltr`, `rtl`), and must have screenshots reviewed; and no declared `code` string may appear on more than one locale row. No numeric threshold is imposed — no translation-coverage or string-externalization percentage, no number of locales or languages a product must support, no number of externalized strings or stable keys, no format-test count or test-coverage percentage, no screenshot or key-screen count, no text-expansion percentage to pass, no pseudo-localization elongation percentage, no number of RTL locales beyond the skill's stated one RTL smoke locale if in scope, no glossary term count, no translation-quality, machine-translation-quality or human-review turnaround score, and no coverage percentage below completeness. Same manifest in → same verdict out.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "localization-readiness-review"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/localization-readiness-review` — tool name `localization_readiness_review`; `tools/call` arguments = the manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/localization-readiness-review` — body = the manifest object; same `Authorization` header.

## Input — the localization readiness manifest

| Field | Meaning |
|---|---|
| `product` | product name (string; carried into the output, not checked) |
| `externalization.all_user_visible_strings_externalized` | externalization evidence: all user-visible strings are externalized |
| `externalization.stable_keys_used` | externalization evidence: strings carry stable keys |
| `externalization.full_sentences_are_translation_units` | externalization evidence: full sentences are translation units |
| `externalization.hardcoded_ui_strings_present` | must be `false` to pass (quality gate: no hardcoded UI strings) |
| `externalization.hardcoded_string_lint_catches_them` | externalization evidence: the hardcoded-string lint catches them |
| `formats.dates_via_locale_apis` | format evidence: dates go via locale APIs |
| `formats.times_via_locale_apis` | format evidence: times go via locale APIs |
| `formats.numbers_via_locale_apis` | format evidence: numbers go via locale APIs |
| `formats.currency_via_locale_apis` | format evidence: currency goes via locale APIs |
| `formats.lists_via_locale_apis` | format evidence: lists go via locale APIs |
| `formats.relative_time_via_locale_apis` | format evidence: relative time goes via locale APIs |
| `formats.timestamps_stored_utc_rendered_local` | format evidence: timestamps are stored in UTC and rendered local |
| `formats.hand_rolled_format_masks_present` | must be `false` to pass (format line: no hand-rolled format masks) |
| `grammar.icu_messageformat_used_for_plurals_and_select` | grammar evidence: ICU MessageFormat is used for plurals and select |
| `grammar.gender_and_declension_handled_where_required` | grammar evidence: gender and declension are handled where required |
| `layout.layout_allows_language_length_variance` | layout evidence: the layout allows language length variance |
| `layout.fixed_width_text_containers_present` | must be `false` to pass (layout line: no fixed-width text containers) |
| `layout.buttons_wrap_safely` | layout evidence: buttons wrap safely |
| `rtl.logical_css_properties_used_where_rtl_possible` | RTL evidence: logical CSS properties are used where RTL is possible |
| `rtl.mirrored_icons_reviewed` | RTL evidence: mirrored icons are reviewed |
| `rtl.rtl_smoke_locale_tested` | RTL evidence: an RTL smoke locale is tested |
| `workflow.tms_or_controlled_files_used` | workflow evidence: a TMS or controlled files are used |
| `workflow.glossary_for_product_terms_present` | workflow evidence: a glossary for product terms is present |
| `workflow.brand_names_kept_untranslated` | workflow evidence: brand names are kept untranslated |
| `workflow.glossary_respected` | workflow evidence: the glossary is respected |
| `workflow.context_notes_for_translators_provided` | workflow evidence: context notes for translators are provided |
| `workflow.machine_translation_drafts_human_reviewed_before_shipping` | workflow evidence: machine-translation drafts are human-reviewed before shipping |
| `testing.pseudo_localization_pass_done` | testing evidence: the pseudo-localization pass is done |
| `testing.pseudo_localization_pass_in_ci_where_possible` | testing evidence: the pseudo-localization pass runs in CI where possible |
| `testing.layout_survives_long_strings` | testing evidence: the layout survives long strings |
| `locales` (list of locale-row objects) | computed: must be present and non-empty; reported as `locales_count` |
| `locales[].name` (string) | names the row in the computed outputs |
| `locales[].code` (string) | the locale code the row declares; computed: no code string may appear on more than one row (reported in `duplicate_locale_codes`) |
| `locales[].direction` (string) | computed: must be one of `ltr`, `rtl`; rows declaring any other value are reported in `locales_with_invalid_direction` |
| `locales[].format_tests_passed` | computed: every row must declare `true`; rows with the field present but not `true` are reported in `locales_without_format_tests` |
| `locales[].screenshots_reviewed` | computed: every row must declare `true`; rows with the field present but not `true` are reported in `locales_without_screenshots` |
| `red_lines.string_concatenation_for_grammar_present` | must be `false` to pass (red line: no string concatenation for grammar) |
| `red_lines.raw_machine_translation_shipped_unreviewed_for_legal_or_sensitive_text_present` | must be `false` to pass (red line: no raw machine translation shipped unreviewed for legal or sensitive text) |

A field **absent** = evidence missing (counts toward INSUFFICIENT_EVIDENCE). A field present but false/invalid = the check fails (counts toward LOCALIZATION_READINESS_NOT_SOUND). All fields are booleans unless noted.

## Worked example (real request + real response, from external testing 2026-11-16)

Request — `POST /v1/localization-readiness-review`:

```json
{
  "product": "TestApp",
  "externalization": {
    "all_user_visible_strings_externalized": true,
    "stable_keys_used": true,
    "full_sentences_are_translation_units": true,
    "hardcoded_ui_strings_present": false,
    "hardcoded_string_lint_catches_them": true
  },
  "formats": {
    "dates_via_locale_apis": true,
    "times_via_locale_apis": true,
    "numbers_via_locale_apis": true,
    "currency_via_locale_apis": true,
    "lists_via_locale_apis": true,
    "relative_time_via_locale_apis": true,
    "timestamps_stored_utc_rendered_local": true,
    "hand_rolled_format_masks_present": false
  },
  "grammar": {
    "icu_messageformat_used_for_plurals_and_select": true,
    "gender_and_declension_handled_where_required": true
  },
  "layout": {
    "layout_allows_language_length_variance": true,
    "fixed_width_text_containers_present": false,
    "buttons_wrap_safely": true
  },
  "rtl": {
    "logical_css_properties_used_where_rtl_possible": true,
    "mirrored_icons_reviewed": true,
    "rtl_smoke_locale_tested": true
  },
  "workflow": {
    "tms_or_controlled_files_used": true,
    "glossary_for_product_terms_present": true,
    "brand_names_kept_untranslated": true,
    "glossary_respected": true,
    "context_notes_for_translators_provided": true,
    "machine_translation_drafts_human_reviewed_before_shipping": true
  },
  "testing": {
    "pseudo_localization_pass_done": true,
    "pseudo_localization_pass_in_ci_where_possible": true,
    "layout_survives_long_strings": true
  },
  "locales": [
    {
      "name": "French",
      "code": "fr-FR",
      "direction": "ltr",
      "format_tests_passed": true,
      "screenshots_reviewed": true
    }
  ],
  "red_lines": {
    "string_concatenation_for_grammar_present": false,
    "raw_machine_translation_shipped_unreviewed_for_legal_or_sensitive_text_present": false
  }
}
```

Response — HTTP 200 (trimmed; the full response carries all 37 checks and a text stamp of the verdict):

```json
{
  "service": "localization-readiness-review",
  "atom_version": "0.1.0",
  "product": "TestApp",
  "verdict": "LOCALIZATION_READINESS_SOUND",
  "sections": {
    "externalized_strings_and_translation_units": "pass",
    "locale_formats_plurals_and_grammar": "pass",
    "flexible_layout_and_rtl_readiness": "pass",
    "content_workflow_and_glossary": "pass",
    "locale_testing_and_red_lines": "pass"
  },
  "computed_status": "within_stated_limits_on_declared_evidence",
  "locales_count": 1,
  "locales_without_format_tests": [],
  "format_test_coverage": "1.000000",
  "locales_with_invalid_direction": [],
  "valid_direction_coverage": "1.000000",
  "duplicate_locale_codes": [],
  "locales_without_screenshots": [],
  "screenshot_coverage": "1.000000",
  "summary": "37 pass, 0 fail, 0 missing of 37 checks across five sections."
}
```

## Verdicts

- **LOCALIZATION_READINESS_SOUND** — every check passes; the declared localization record is complete and consistent with the skill's checklist and red lines.
- **LOCALIZATION_READINESS_NOT_SOUND** — at least one check fails; the failing checks name the breached requirement and the evidence against it.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

The response also reports `locales_count` (the declared list length as an integer, or null when the list is not declared), the row-name lists `locales_without_format_tests`, `locales_with_invalid_direction` and `locales_without_screenshots` and the code list `duplicate_locale_codes` (null when the `locales` list is not declared; a locale with the relevant field absent is missing evidence and does not appear in the first, second and fourth lists), the coverage values `format_test_coverage`, `valid_direction_coverage` and `screenshot_coverage` (ratios as strings with exactly six decimal places; a ratio is null when its denominator list is absent or empty), and `computed_status` (`within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null when any of the five primary computed checks cannot be completed).

Errors: `401` missing/invalid key · `403` key lacks this atom's scope · `422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
