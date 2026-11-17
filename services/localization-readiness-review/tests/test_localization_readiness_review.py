import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from localization_readiness_review import evaluate, stamp  # noqa: E402

COMPLETE = {
    "product": "example-app",
    "externalization": {"all_user_visible_strings_externalized": True,
                        "stable_keys_used": True,
                        "full_sentences_are_translation_units": True,
                        "hardcoded_ui_strings_present": False,
                        "hardcoded_string_lint_catches_them": True},
    "formats": {"dates_via_locale_apis": True,
                "times_via_locale_apis": True,
                "numbers_via_locale_apis": True,
                "currency_via_locale_apis": True,
                "lists_via_locale_apis": True,
                "relative_time_via_locale_apis": True,
                "timestamps_stored_utc_rendered_local": True,
                "hand_rolled_format_masks_present": False},
    "grammar": {"icu_messageformat_used_for_plurals_and_select": True,
                "gender_and_declension_handled_where_required": True},
    "layout": {"layout_allows_language_length_variance": True,
               "fixed_width_text_containers_present": False,
               "buttons_wrap_safely": True},
    "rtl": {"logical_css_properties_used_where_rtl_possible": True,
            "mirrored_icons_reviewed": True,
            "rtl_smoke_locale_tested": True},
    "workflow": {"tms_or_controlled_files_used": True,
                 "glossary_for_product_terms_present": True,
                 "brand_names_kept_untranslated": True,
                 "glossary_respected": True,
                 "context_notes_for_translators_provided": True,
                 "machine_translation_drafts_human_reviewed_before_shipping": True},
    "testing": {"pseudo_localization_pass_done": True,
                "pseudo_localization_pass_in_ci_where_possible": True,
                "layout_survives_long_strings": True},
    "locales": [
        {"name": "english-us", "code": "en-US", "direction": "ltr",
         "format_tests_passed": True, "screenshots_reviewed": True},
        {"name": "french", "code": "fr-FR", "direction": "ltr",
         "format_tests_passed": True, "screenshots_reviewed": True},
        {"name": "arabic", "code": "ar-EG", "direction": "rtl",
         "format_tests_passed": True, "screenshots_reviewed": True},
    ],
    "red_lines": {"string_concatenation_for_grammar_present": False,
                  "raw_machine_translation_shipped_unreviewed_for_legal_or_sensitive_text_present": False},
}


def check_status(v, name):
    return next(c["status"] for c in v["checks"] if c["check"] == name)


class VerdictTests(unittest.TestCase):
    def test_complete_manifest_is_sound(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(v["verdict"], "LOCALIZATION_READINESS_SOUND")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(len(v["checks"]), 37)
        self.assertEqual(v["computed_status"],
                         "within_stated_limits_on_declared_evidence")
        self.assertEqual(v["locales_count"], 3)
        self.assertEqual(v["locales_without_format_tests"], [])
        self.assertEqual(v["format_test_coverage"], "1.000000")
        self.assertEqual(v["locales_with_invalid_direction"], [])
        self.assertEqual(v["valid_direction_coverage"], "1.000000")
        self.assertEqual(v["duplicate_locale_codes"], [])
        self.assertEqual(v["locales_without_screenshots"], [])
        self.assertEqual(v["screenshot_coverage"], "1.000000")

    def test_hardcoded_strings_fail_externalization(self):
        m = copy.deepcopy(COMPLETE)
        m["externalization"]["hardcoded_ui_strings_present"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "LOCALIZATION_READINESS_NOT_SOUND")
        self.assertEqual(v["sections"]["externalized_strings_and_translation_units"], "fail")
        self.assertEqual(check_status(v, "no_hardcoded_ui_strings"), "fail")

    def test_no_lint_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["externalization"]["hardcoded_string_lint_catches_them"] = False
        self.assertEqual(evaluate(m)["verdict"], "LOCALIZATION_READINESS_NOT_SOUND")

    def test_hand_rolled_masks_fail_formats(self):
        m = copy.deepcopy(COMPLETE)
        m["formats"]["hand_rolled_format_masks_present"] = True
        v = evaluate(m)
        self.assertEqual(check_status(v, "no_hand_rolled_format_masks"), "fail")
        self.assertEqual(v["sections"]["locale_formats_plurals_and_grammar"], "fail")

    def test_no_icu_fails_grammar(self):
        m = copy.deepcopy(COMPLETE)
        m["grammar"]["icu_messageformat_used_for_plurals_and_select"] = False
        self.assertEqual(evaluate(m)["verdict"], "LOCALIZATION_READINESS_NOT_SOUND")

    def test_currency_not_via_locale_api_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["formats"]["currency_via_locale_apis"] = False
        self.assertEqual(check_status(evaluate(m), "currency_via_locale_apis"), "fail")

    def test_fixed_width_containers_fail_layout(self):
        m = copy.deepcopy(COMPLETE)
        m["layout"]["fixed_width_text_containers_present"] = True
        v = evaluate(m)
        self.assertEqual(check_status(v, "no_fixed_width_text_containers"), "fail")
        self.assertEqual(v["sections"]["flexible_layout_and_rtl_readiness"], "fail")

    def test_no_logical_css_fails_rtl(self):
        m = copy.deepcopy(COMPLETE)
        m["rtl"]["logical_css_properties_used_where_rtl_possible"] = False
        self.assertEqual(evaluate(m)["verdict"], "LOCALIZATION_READINESS_NOT_SOUND")

    def test_glossary_not_respected_fails_workflow(self):
        m = copy.deepcopy(COMPLETE)
        m["workflow"]["glossary_respected"] = False
        v = evaluate(m)
        self.assertEqual(v["sections"]["content_workflow_and_glossary"], "fail")

    def test_brand_names_translated_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["workflow"]["brand_names_kept_untranslated"] = False
        self.assertEqual(check_status(evaluate(m), "brand_names_kept_untranslated"), "fail")

    def test_locale_without_format_tests_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["locales"][0]["format_tests_passed"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "LOCALIZATION_READINESS_NOT_SOUND")
        self.assertEqual(check_status(v, "every_locale_has_format_tests_passed"), "fail")
        self.assertEqual(v["locales_without_format_tests"], ["english-us"])
        self.assertEqual(v["format_test_coverage"], "0.666667")
        self.assertEqual(v["computed_status"], "outside_stated_limits_on_declared_evidence")

    def test_locale_missing_format_tests_field_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["locales"][0]["format_tests_passed"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(check_status(v, "every_locale_has_format_tests_passed"), "missing")
        self.assertEqual(v["locales_without_format_tests"], [])

    def test_locale_with_invalid_direction_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["locales"][1]["direction"] = "vertical"
        v = evaluate(m)
        self.assertEqual(check_status(v, "every_locale_direction_valid"), "fail")
        self.assertEqual(v["locales_with_invalid_direction"], ["french"])
        self.assertEqual(v["valid_direction_coverage"], "0.666667")

    def test_locale_missing_direction_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["locales"][1]["direction"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(check_status(v, "every_locale_direction_valid"), "missing")
        self.assertEqual(v["locales_with_invalid_direction"], [])

    def test_duplicate_locale_code_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["locales"][2]["code"] = "en-US"
        v = evaluate(m)
        self.assertEqual(check_status(v, "no_locale_code_declared_twice"), "fail")
        self.assertEqual(v["duplicate_locale_codes"], ["en-US"])

    def test_locale_missing_code_is_missing_for_duplicate_check(self):
        m = copy.deepcopy(COMPLETE)
        del m["locales"][2]["code"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(check_status(v, "no_locale_code_declared_twice"), "missing")
        self.assertEqual(v["duplicate_locale_codes"], [])

    def test_locale_without_screenshots_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["locales"][1]["screenshots_reviewed"] = False
        v = evaluate(m)
        self.assertEqual(check_status(v, "every_locale_has_screenshots_reviewed"), "fail")
        self.assertEqual(v["locales_without_screenshots"], ["french"])
        self.assertEqual(v["screenshot_coverage"], "0.666667")

    def test_empty_locales_list_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["locales"] = []
        v = evaluate(m)
        self.assertEqual(check_status(v, "locales_declared"), "fail")
        self.assertEqual(v["locales_count"], 0)
        self.assertIsNone(v["format_test_coverage"])
        self.assertIsNone(v["valid_direction_coverage"])
        self.assertIsNone(v["screenshot_coverage"])
        self.assertEqual(v["duplicate_locale_codes"], [])

    def test_no_pseudo_pass_fails_testing(self):
        m = copy.deepcopy(COMPLETE)
        m["testing"]["pseudo_localization_pass_done"] = False
        v = evaluate(m)
        self.assertEqual(v["sections"]["locale_testing_and_red_lines"], "fail")

    def test_string_concatenation_fails_red_line(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"]["string_concatenation_for_grammar_present"] = True
        v = evaluate(m)
        self.assertEqual(check_status(v, "no_string_concatenation_for_grammar"), "fail")
        self.assertEqual(v["sections"]["locale_testing_and_red_lines"], "fail")

    def test_raw_mt_unreviewed_fails_red_line(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"]["raw_machine_translation_shipped_unreviewed_for_legal_or_sensitive_text_present"] = True
        v = evaluate(m)
        self.assertEqual(check_status(v, "no_raw_machine_translation_shipped_unreviewed_for_legal_or_sensitive_text"), "fail")
        self.assertEqual(v["verdict"], "LOCALIZATION_READINESS_NOT_SOUND")

    def test_absent_evidence_is_insufficient_not_failed(self):
        m = copy.deepcopy(COMPLETE)
        del m["workflow"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["content_workflow_and_glossary"], "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertTrue(all(c["status"] == "missing" for c in v["checks"]))
        self.assertIsNone(v["computed_status"])
        self.assertIsNone(v["locales_count"])
        self.assertIsNone(v["locales_without_format_tests"])
        self.assertIsNone(v["format_test_coverage"])
        self.assertIsNone(v["locales_with_invalid_direction"])
        self.assertIsNone(v["valid_direction_coverage"])
        self.assertIsNone(v["duplicate_locale_codes"])
        self.assertIsNone(v["locales_without_screenshots"])
        self.assertIsNone(v["screenshot_coverage"])

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertIn("VERDICT: LOCALIZATION_READINESS_SOUND", stamp(v))

    def test_non_object_manifest_rejected(self):
        with self.assertRaises(TypeError):
            evaluate(["not", "a", "manifest"])


class MalformedTypeTests(unittest.TestCase):
    def test_string_field_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["product"] = 12345
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("product", str(ctx.exception))

    def test_object_section_as_string_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"formats": "should-be-an-object"})
        self.assertIn("formats", str(ctx.exception))

    def test_list_field_as_object_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"locales": {"name": "french"}})
        self.assertIn("locales", str(ctx.exception))

    def test_list_entry_as_string_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"locales": ["french"]})
        self.assertIn("locales[0]", str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["formats"]["dates_via_locale_apis"] = "yes"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("formats.dates_via_locale_apis", str(ctx.exception))

    def test_nested_list_entry_string_field_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["locales"][0]["name"] = 42
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("locales[0].name", str(ctx.exception))

    def test_nested_list_entry_direction_as_boolean_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["locales"][1]["direction"] = True
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("locales[1].direction", str(ctx.exception))

    def test_null_section_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["workflow"] = None
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("workflow", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
