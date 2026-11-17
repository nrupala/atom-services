#!/usr/bin/env python3
"""Localization readiness review — deterministic core.

Built from the bound skill `i18n-localization`: "Internationalize
properly — external strings, ICU formats, RTL, locale-aware
everything, tested."

This atom is an AUDIT of a declared localization record: it
validates the record a caller declares against the skill's
sections — externalized strings and translation units, locale
formats, plurals and grammar, flexible layout and RTL readiness,
content workflow and glossary, and locale testing with the red
lines. It does not inspect source code, run pseudo-localization,
render a screen, translate text, or verify that a declared
control actually works — it checks that the record the skill
requires is present and internally complete and consistent on
the declared evidence.

The caller submits a localization manifest (a dict, or JSON on
the CLI). Every check reads declared manifest fields:

- field present and true/valid   -> pass
- field present and false/invalid -> fail
- field absent                    -> missing (evidence not provided)

Computed checks use ONLY what the skill itself states, plus the
consistency of the declared rows themselves — no outside
threshold is imported:

- locales: the declared `locales` list must be non-empty, and
  every declared locale row must declare a direction from the
  skill's own distinction (ltr / rtl), pass its per-locale
  format unit tests, and have its key-screen screenshots
  reviewed;
- locale identity: no declared locale code may be declared by
  more than one locale row.

Computed ratios are serialized as strings with exactly six
decimal places, produced in both implementations by the same
fixed rule — round half up to 6dp, floor(v * 1000000 + 0.5) /
1000000, then format with exactly six decimals; comparisons use
the unrounded values. That fixed serialization is what makes the
Python and TypeScript outputs byte-identical. Counts are reported
as integers (exact).

The skill states no numeric threshold — no translation-coverage
percentage, no number of locales, no string count, no test count,
no screenshot count, no expansion percentage to pass — so no
numeric threshold check is invented; those quantities are caller
attestations at most, and quantities here are computed and
reported, with completeness (every declared locale) as the only
bar, exactly as stated above. The skill's stated +30-100%
language length variance is a layout attestation, not a bar this
atom sets.

Verdict:
- any fail             -> LOCALIZATION_READINESS_NOT_SOUND
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> LOCALIZATION_READINESS_SOUND

No model call, no network, no clock dependence: the same manifest
always produces the same verdict. That determinism is the product.
"""
import json
import math
import sys

SECTIONS = (
    "externalized_strings_and_translation_units",
    "locale_formats_plurals_and_grammar",
    "flexible_layout_and_rtl_readiness",
    "content_workflow_and_glossary",
    "locale_testing_and_red_lines",
)

DIRECTIONS = ("ltr", "rtl")

MANIFEST_SPEC = {
    "product": "string",
    "externalization": {
        "all_user_visible_strings_externalized": "boolean",
        "stable_keys_used": "boolean",
        "full_sentences_are_translation_units": "boolean",
        "hardcoded_ui_strings_present": "boolean",
        "hardcoded_string_lint_catches_them": "boolean",
    },
    "formats": {
        "dates_via_locale_apis": "boolean",
        "times_via_locale_apis": "boolean",
        "numbers_via_locale_apis": "boolean",
        "currency_via_locale_apis": "boolean",
        "lists_via_locale_apis": "boolean",
        "relative_time_via_locale_apis": "boolean",
        "timestamps_stored_utc_rendered_local": "boolean",
        "hand_rolled_format_masks_present": "boolean",
    },
    "grammar": {
        "icu_messageformat_used_for_plurals_and_select": "boolean",
        "gender_and_declension_handled_where_required": "boolean",
    },
    "layout": {
        "layout_allows_language_length_variance": "boolean",
        "fixed_width_text_containers_present": "boolean",
        "buttons_wrap_safely": "boolean",
    },
    "rtl": {
        "logical_css_properties_used_where_rtl_possible": "boolean",
        "mirrored_icons_reviewed": "boolean",
        "rtl_smoke_locale_tested": "boolean",
    },
    "workflow": {
        "tms_or_controlled_files_used": "boolean",
        "glossary_for_product_terms_present": "boolean",
        "brand_names_kept_untranslated": "boolean",
        "glossary_respected": "boolean",
        "context_notes_for_translators_provided": "boolean",
        "machine_translation_drafts_human_reviewed_before_shipping": "boolean",
    },
    "testing": {
        "pseudo_localization_pass_done": "boolean",
        "pseudo_localization_pass_in_ci_where_possible": "boolean",
        "layout_survives_long_strings": "boolean",
    },
    "locales": [{
        "name": "string",
        "code": "string",
        "direction": "string",
        "format_tests_passed": "boolean",
        "screenshots_reviewed": "boolean",
    }],
    "red_lines": {
        "string_concatenation_for_grammar_present": "boolean",
        "raw_machine_translation_shipped_unreviewed_for_legal_or_sensitive_text_present": "boolean",
    },
}


def _validate_value(value, spec, path):
    if spec == "any":
        return
    if spec == "string":
        if not isinstance(value, str):
            raise TypeError(f"{path} must be a string")
        return
    if spec == "boolean":
        if not isinstance(value, bool):
            raise TypeError(f"{path} must be a boolean")
        return
    if spec == "number":
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            raise TypeError(f"{path} must be a number")
        return
    if isinstance(spec, list):
        if not isinstance(value, list):
            raise TypeError(f"{path} must be a list")
        for index, entry in enumerate(value):
            _validate_value(entry, spec[0], f"{path}[{index}]")
        return
    if isinstance(spec, dict):
        if not isinstance(value, dict):
            raise TypeError(f"{path} must be an object")
        _validate_fields(value, spec, path)
        return
    raise AssertionError(f"unknown manifest spec at {path}")


def _validate_fields(obj, spec, prefix):
    for field, field_spec in spec.items():
        if field not in obj:
            continue
        value = obj[field]
        path = f"{prefix}.{field}" if prefix else field
        _validate_value(value, field_spec, path)


def _validate_manifest(manifest):
    _validate_fields(manifest, MANIFEST_SPEC, "")


def _get(manifest, *path):
    cur = manifest
    for key in path:
        if not isinstance(cur, dict) or key not in cur:
            return None, False
        cur = cur[key]
    return cur, True


def _check(results, section, name, value, present, ok, evidence):
    if not present:
        status = "missing"
    else:
        status = "pass" if ok else "fail"
    results.append(
        {"section": section, "check": name, "status": status,
         "evidence": evidence}
    )


def _bool_check(results, section, name, manifest, path, evidence):
    value, present = _get(manifest, *path)
    _check(results, section, name, value, present, value is True, evidence)


def _false_check(results, section, name, manifest, path, evidence):
    value, present = _get(manifest, *path)
    _check(results, section, name, value, present, value is False,
           evidence)


def _fmt6(value):
    """Fixed 6dp serialization: round half up, then 6 decimals."""
    if value is None:
        return None
    rounded = math.floor(value * 1000000 + 0.5) / 1000000
    return f"{rounded:.6f}"


def _row_name(entry):
    if isinstance(entry, dict) and isinstance(entry.get("name"), str):
        return entry["name"]
    return "unnamed"


def evaluate(manifest):
    """Return the verdict dict for a localization readiness manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Declared rows, read once for the computed checks ----
    locales, has_locales = _get(manifest, "locales")
    locales_is_list = has_locales and isinstance(locales, list)
    locales_count = len(locales) if locales_is_list else None
    rows = locales if locales_is_list else []

    locales_without_format_tests = (
        [_row_name(c) for c in rows
         if isinstance(c, dict)
         and "format_tests_passed" in c
         and c.get("format_tests_passed") is not True]
        if locales_is_list else None
    )
    locales_with_invalid_direction = (
        [_row_name(c) for c in rows
         if isinstance(c, dict)
         and "direction" in c
         and c.get("direction") not in DIRECTIONS]
        if locales_is_list else None
    )
    locales_without_screenshots = (
        [_row_name(c) for c in rows
         if isinstance(c, dict)
         and "screenshots_reviewed" in c
         and c.get("screenshots_reviewed") is not True]
        if locales_is_list else None
    )
    duplicate_locale_codes = None
    if locales_is_list:
        seen = []
        duplicate_locale_codes = []
        for c in rows:
            if isinstance(c, dict) and isinstance(c.get("code"), str):
                code = c["code"]
                if code in seen and code not in duplicate_locale_codes:
                    duplicate_locale_codes.append(code)
                seen.append(code)
    format_test_coverage = (
        sum(1 for c in rows
            if isinstance(c, dict)
            and c.get("format_tests_passed") is True)
        / locales_count
        if locales_is_list and locales_count > 0 else None
    )
    valid_direction_coverage = (
        sum(1 for c in rows
            if isinstance(c, dict)
            and c.get("direction") in DIRECTIONS)
        / locales_count
        if locales_is_list and locales_count > 0 else None
    )
    screenshot_coverage = (
        sum(1 for c in rows
            if isinstance(c, dict)
            and c.get("screenshots_reviewed") is True)
        / locales_count
        if locales_is_list and locales_count > 0 else None
    )

    # ---- Section 1: externalized_strings_and_translation_units
    #      (skill method 1 and quality gate 1 — all user-visible
    #      strings in resources with stable keys, zero
    #      concatenation, full sentences as translation units, no
    #      hardcoded UI strings and a lint that catches them) ----
    _bool_check(results, "externalized_strings_and_translation_units",
                "all_user_visible_strings_externalized", manifest,
                ("externalization", "all_user_visible_strings_externalized"),
                "externalize everything: all user-visible strings are in resources")
    _bool_check(results, "externalized_strings_and_translation_units",
                "stable_keys_used", manifest,
                ("externalization", "stable_keys_used"),
                "externalize everything: strings carry stable keys")
    _bool_check(results, "externalized_strings_and_translation_units",
                "full_sentences_are_translation_units", manifest,
                ("externalization", "full_sentences_are_translation_units"),
                "externalize everything: full sentences are translation units — word order varies by language")
    _false_check(results, "externalized_strings_and_translation_units",
                 "no_hardcoded_ui_strings", manifest,
                 ("externalization", "hardcoded_ui_strings_present"),
                 "quality gate: no hardcoded UI strings are present")
    _bool_check(results, "externalized_strings_and_translation_units",
                "hardcoded_string_lint_catches_them", manifest,
                ("externalization", "hardcoded_string_lint_catches_them"),
                "quality gate: a lint catches hardcoded UI strings")

    # ---- Section 2: locale_formats_plurals_and_grammar (skill
    #      methods 2-3 — Intl-class formatting for dates, times,
    #      numbers, currency, lists and relative time, never
    #      hand-rolled masks, timestamps in UTC rendered local;
    #      ICU MessageFormat plural/select, gender/declension
    #      handled where the language requires it) ----
    _bool_check(results, "locale_formats_plurals_and_grammar",
                "dates_via_locale_apis", manifest,
                ("formats", "dates_via_locale_apis"),
                "formats via platform APIs: dates are formatted via locale APIs")
    _bool_check(results, "locale_formats_plurals_and_grammar",
                "times_via_locale_apis", manifest,
                ("formats", "times_via_locale_apis"),
                "formats via platform APIs: times are formatted via locale APIs")
    _bool_check(results, "locale_formats_plurals_and_grammar",
                "numbers_via_locale_apis", manifest,
                ("formats", "numbers_via_locale_apis"),
                "formats via platform APIs: numbers are formatted via locale APIs")
    _bool_check(results, "locale_formats_plurals_and_grammar",
                "currency_via_locale_apis", manifest,
                ("formats", "currency_via_locale_apis"),
                "formats via platform APIs: currency is formatted via locale APIs")
    _bool_check(results, "locale_formats_plurals_and_grammar",
                "lists_via_locale_apis", manifest,
                ("formats", "lists_via_locale_apis"),
                "formats via platform APIs: lists are formatted via locale APIs")
    _bool_check(results, "locale_formats_plurals_and_grammar",
                "relative_time_via_locale_apis", manifest,
                ("formats", "relative_time_via_locale_apis"),
                "formats via platform APIs: relative time is formatted via locale APIs")
    _bool_check(results, "locale_formats_plurals_and_grammar",
                "timestamps_stored_utc_rendered_local", manifest,
                ("formats", "timestamps_stored_utc_rendered_local"),
                "formats via platform APIs: timestamps are stored in UTC and rendered local")
    _false_check(results, "locale_formats_plurals_and_grammar",
                 "no_hand_rolled_format_masks", manifest,
                 ("formats", "hand_rolled_format_masks_present"),
                 "formats via platform APIs: no hand-rolled format masks are present — never hand-rolled masks")
    _bool_check(results, "locale_formats_plurals_and_grammar",
                "icu_messageformat_used_for_plurals_and_select", manifest,
                ("grammar", "icu_messageformat_used_for_plurals_and_select"),
                "plurals and grammar: ICU MessageFormat (plural/select) is used")
    _bool_check(results, "locale_formats_plurals_and_grammar",
                "gender_and_declension_handled_where_required", manifest,
                ("grammar", "gender_and_declension_handled_where_required"),
                "plurals and grammar: gender and declension are handled where the language requires it")

    # ---- Section 3: flexible_layout_and_rtl_readiness (skill
    #      methods 4-5 — language length variance, no fixed-width
    #      text containers, buttons wrap safely; logical CSS
    #      properties, mirrored icons reviewed, one RTL smoke
    #      locale if in scope) ----
    _bool_check(results, "flexible_layout_and_rtl_readiness",
                "layout_allows_language_length_variance", manifest,
                ("layout", "layout_allows_language_length_variance"),
                "layout that flexes: layout allows language length variance")
    _false_check(results, "flexible_layout_and_rtl_readiness",
                 "no_fixed_width_text_containers", manifest,
                 ("layout", "fixed_width_text_containers_present"),
                 "layout that flexes: no fixed-width text containers are present")
    _bool_check(results, "flexible_layout_and_rtl_readiness",
                "buttons_wrap_safely", manifest,
                ("layout", "buttons_wrap_safely"),
                "layout that flexes: buttons wrap safely")
    _bool_check(results, "flexible_layout_and_rtl_readiness",
                "logical_css_properties_used_where_rtl_possible", manifest,
                ("rtl", "logical_css_properties_used_where_rtl_possible"),
                "RTL readiness: logical CSS properties — start/end, not left/right — are used where RTL is possible")
    _bool_check(results, "flexible_layout_and_rtl_readiness",
                "mirrored_icons_reviewed", manifest,
                ("rtl", "mirrored_icons_reviewed"),
                "RTL readiness: mirrored icons are reviewed")
    _bool_check(results, "flexible_layout_and_rtl_readiness",
                "rtl_smoke_locale_tested", manifest,
                ("rtl", "rtl_smoke_locale_tested"),
                "RTL readiness: one RTL smoke locale is tested if in scope")

    # ---- Section 4: content_workflow_and_glossary (skill method
    #      6 and quality gate 4 — TMS or controlled files,
    #      glossaries for product terms with brand names
    #      untranslated, context notes, machine translation drafts
    #      human-reviewed for anything shipped; glossary
    #      respected, brand terms protected) ----
    _bool_check(results, "content_workflow_and_glossary",
                "tms_or_controlled_files_used", manifest,
                ("workflow", "tms_or_controlled_files_used"),
                "content workflow: a TMS or controlled files are used")
    _bool_check(results, "content_workflow_and_glossary",
                "glossary_for_product_terms_present", manifest,
                ("workflow", "glossary_for_product_terms_present"),
                "content workflow: a glossary for product terms is present")
    _bool_check(results, "content_workflow_and_glossary",
                "brand_names_kept_untranslated", manifest,
                ("workflow", "brand_names_kept_untranslated"),
                "content workflow: brand names are kept untranslated")
    _bool_check(results, "content_workflow_and_glossary",
                "glossary_respected", manifest,
                ("workflow", "glossary_respected"),
                "quality gate: the glossary is respected and brand terms are protected")
    _bool_check(results, "content_workflow_and_glossary",
                "context_notes_for_translators_provided", manifest,
                ("workflow", "context_notes_for_translators_provided"),
                "content workflow: context notes for translators are provided")
    _bool_check(results, "content_workflow_and_glossary",
                "machine_translation_drafts_human_reviewed_before_shipping", manifest,
                ("workflow", "machine_translation_drafts_human_reviewed_before_shipping"),
                "content workflow: machine translation drafts receive human review for anything shipped")

    # ---- Section 5: locale_testing_and_red_lines (skill method
    #      7, quality gates 2-3 and the red lines — pseudo-loc
    #      pass in CI where possible, per-locale unit tests for
    #      formats, screenshots of key screens per language;
    #      no string concatenation for grammar, no raw machine
    #      translation shipped unreviewed for legal or sensitive
    #      text) ----
    _bool_check(results, "locale_testing_and_red_lines",
                "pseudo_localization_pass_done", manifest,
                ("testing", "pseudo_localization_pass_done"),
                "locale testing: a pseudo-localization pass is done")
    _bool_check(results, "locale_testing_and_red_lines",
                "pseudo_localization_pass_in_ci_where_possible", manifest,
                ("testing", "pseudo_localization_pass_in_ci_where_possible"),
                "locale testing: the pseudo-localization pass runs in CI where possible")
    _bool_check(results, "locale_testing_and_red_lines",
                "layout_survives_long_strings", manifest,
                ("testing", "layout_survives_long_strings"),
                "quality gate: layout survives long strings")
    _check(results, "locale_testing_and_red_lines",
           "locales_declared", locales, locales_is_list,
           locales_is_list and locales_count > 0,
           "the declared record names its locales — the locales list is present and non-empty")
    fmt_present = (
        locales_is_list
        and all(isinstance(c, dict) and "format_tests_passed" in c
                for c in rows)
    )
    _check(results, "locale_testing_and_red_lines",
           "every_locale_has_format_tests_passed", locales, fmt_present,
           locales_is_list and locales_count > 0
           and all(isinstance(c, dict)
                   and c.get("format_tests_passed") is True
                   for c in rows),
           "locale testing: every declared locale row passes its per-locale unit tests for formats")
    dir_present = (
        locales_is_list
        and all(isinstance(c, dict) and "direction" in c
                for c in rows)
    )
    _check(results, "locale_testing_and_red_lines",
           "every_locale_direction_valid", locales, dir_present,
           locales_is_list and locales_count > 0
           and all(isinstance(c, dict)
                   and c.get("direction") in DIRECTIONS
                   for c in rows),
           "locale testing: every declared locale row declares a direction from the skill's distinction — ltr / rtl")
    code_present = (
        locales_is_list
        and all(isinstance(c, dict) and "code" in c for c in rows)
    )
    _check(results, "locale_testing_and_red_lines",
           "no_locale_code_declared_twice", locales,
           code_present,
           locales_is_list and duplicate_locale_codes is not None
           and len(duplicate_locale_codes) == 0,
           "locale testing: no declared locale code is declared by more than one locale row")
    shot_present = (
        locales_is_list
        and all(isinstance(c, dict)
                and "screenshots_reviewed" in c for c in rows)
    )
    _check(results, "locale_testing_and_red_lines",
           "every_locale_has_screenshots_reviewed", locales,
           shot_present,
           locales_is_list and locales_count > 0
           and all(isinstance(c, dict)
                   and c.get("screenshots_reviewed") is True
                   for c in rows),
           "locale testing: every declared locale row has screenshots of key screens reviewed for its language")
    _false_check(results, "locale_testing_and_red_lines",
                 "no_string_concatenation_for_grammar", manifest,
                 ("red_lines", "string_concatenation_for_grammar_present"),
                 "red line: no string concatenation for grammar is present")
    _false_check(results, "locale_testing_and_red_lines",
                 "no_raw_machine_translation_shipped_unreviewed_for_legal_or_sensitive_text", manifest,
                 ("red_lines", "raw_machine_translation_shipped_unreviewed_for_legal_or_sensitive_text_present"),
                 "red line: no raw machine translation is shipped unreviewed for legal or sensitive text")

    sections = {}
    for section in SECTIONS:
        sec_results = [r for r in results if r["section"] == section]
        if any(r["status"] == "fail" for r in sec_results):
            sections[section] = "fail"
        elif any(r["status"] == "missing" for r in sec_results):
            sections[section] = "insufficient_evidence"
        else:
            sections[section] = "pass"

    if any(v == "fail" for v in sections.values()):
        verdict = "LOCALIZATION_READINESS_NOT_SOUND"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "LOCALIZATION_READINESS_SOUND"

    computed_names = (
        "locales_declared",
        "every_locale_has_format_tests_passed",
        "every_locale_direction_valid",
        "no_locale_code_declared_twice",
        "every_locale_has_screenshots_reviewed",
    )
    computed_statuses = [
        r["status"] for r in results if r["check"] in computed_names
    ]
    if any(s == "fail" for s in computed_statuses):
        computed_status = "outside_stated_limits_on_declared_evidence"
    elif all(s == "pass" for s in computed_statuses):
        computed_status = "within_stated_limits_on_declared_evidence"
    else:
        computed_status = None

    return {
        "service": "localization-readiness-review",
        "atom_version": "0.1.0",
        "product": manifest.get("product"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "computed_status": computed_status,
        "locales_count": locales_count,
        "locales_without_format_tests": locales_without_format_tests,
        "format_test_coverage": _fmt6(format_test_coverage),
        "locales_with_invalid_direction": locales_with_invalid_direction,
        "valid_direction_coverage": _fmt6(valid_direction_coverage),
        "duplicate_locale_codes": duplicate_locale_codes,
        "locales_without_screenshots": locales_without_screenshots,
        "screenshot_coverage": _fmt6(screenshot_coverage),
        "summary": (
            f"{sum(1 for r in results if r['status'] == 'pass')} pass, "
            f"{sum(1 for r in results if r['status'] == 'fail')} fail, "
            f"{sum(1 for r in results if r['status'] == 'missing')} missing "
            f"of {len(results)} checks across five sections."
        ),
    }


def stamp(verdict):
    """Human-readable stamp of a verdict dict."""
    lines = [
        "LOCALIZATION READINESS REVIEW",
        f"product: {verdict.get('product')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<36} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: localization_readiness_review.py <manifest.json>",
              file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "LOCALIZATION_READINESS_SOUND" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
