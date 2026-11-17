import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from semantic_html_review import evaluate, stamp  # noqa: E402

COMPLETE = {
    "page": "pricing-page",
    "landmarks": {"header_landmark_present": True,
                  "nav_landmark_present": True,
                  "main_landmark_present": True,
                  "footer_landmark_present": True,
                  "exactly_one_main_landmark_declared": True},
    "headings": [
        {"level": 1, "label": "Pricing"},
        {"level": 2, "label": "Plans"},
        {"level": 3, "label": "Team plan"},
        {"level": 2, "label": "FAQ"},
    ],
    "semantic_elements": {
        "nav_element_carries_navigation": True,
        "main_element_carries_primary_content": True,
        "article_element_for_self_contained_content": True,
        "section_elements_have_real_meaning": True,
        "figure_elements_have_figcaptions": True,
        "time_elements_for_dates_and_times": True,
        "generic_divs_used_only_when_no_semantic_element_fits": True},
    "controls": {"button_elements_for_actions": True,
                 "anchor_elements_for_navigation": True,
                 "fieldset_legend_group_related_inputs": True,
                 "keyboard_only_traversal_passed_for_all_interactive_elements": True},
    "form_inputs": [
        {"input_ref": "email", "label_bound": True},
        {"input_ref": "plan-tier", "label_bound": True},
    ],
    "media": {"captions_present_for_media_elements": True},
    "images": [
        {"image_ref": "hero-chart", "decorative": False,
         "alt_text": "Bar chart of monthly signups"},
        {"image_ref": "bg-swirl", "decorative": True, "alt_text": ""},
    ],
    "data_tables": [
        {"table_ref": "plan-comparison", "thead_present": True,
         "th_scope_present": True, "caption_present": True},
    ],
    "document_head": {"html_lang_attribute_set": True,
                      "viewport_meta_declared": True,
                      "charset_meta_first_in_head": True,
                      "page_title_descriptive": True},
    "aria_practice": {"native_semantics_preferred_before_aria": True,
                      "aria_used_only_for_real_gaps": True,
                      "aria_not_used_to_simulate_controls": True},
    "validation": {"w3c_validator_reports_clean": True,
                   "htmlhint_reports_clean": True,
                   "invalid_nesting_absent_from_markup": True},
    "red_lines": {"div_span_click_handlers_present": False,
                  "layout_tables_present": False,
                  "lang_or_title_missing_present": False},
}


def check_status(v, name):
    return next(c["status"] for c in v["checks"] if c["check"] == name)


class VerdictTests(unittest.TestCase):
    def test_complete_manifest_is_sound(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(v["verdict"], "SEMANTIC_HTML_REVIEW_SOUND")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(len(v["checks"]), 45)
        self.assertEqual(v["computed_status"],
                         "within_stated_limits_on_declared_evidence")
        self.assertEqual(v["headings_count"], 4)
        self.assertEqual(v["h1_count"], 1)
        self.assertEqual(v["heading_level_skip_positions"], [])
        self.assertEqual(v["form_inputs_count"], 2)
        self.assertEqual(v["form_inputs_without_bound_label"], [])
        self.assertEqual(v["duplicate_form_input_refs"], [])
        self.assertEqual(v["labelled_input_coverage"], "1.000000")
        self.assertEqual(v["images_count"], 2)
        self.assertEqual(v["content_images_without_meaningful_alt"], [])
        self.assertEqual(v["decorative_images_with_nonempty_alt"], [])
        self.assertEqual(v["duplicate_image_refs"], [])
        self.assertEqual(v["appropriate_alt_coverage"], "1.000000")
        self.assertEqual(v["data_tables_count"], 1)
        self.assertEqual(v["data_tables_without_thead"], [])
        self.assertEqual(v["data_tables_without_th_scope"], [])
        self.assertEqual(v["data_tables_without_caption"], [])
        self.assertEqual(v["duplicate_table_refs"], [])
        self.assertEqual(v["fully_structured_table_coverage"], "1.000000")

    def test_empty_row_lists_are_valid_declarations(self):
        m = copy.deepcopy(COMPLETE)
        m["form_inputs"] = []
        m["images"] = []
        m["data_tables"] = []
        v = evaluate(m)
        self.assertEqual(v["verdict"], "SEMANTIC_HTML_REVIEW_SOUND")
        self.assertEqual(v["form_inputs_count"], 0)
        self.assertEqual(v["images_count"], 0)
        self.assertEqual(v["data_tables_count"], 0)
        self.assertIsNone(v["labelled_input_coverage"])
        self.assertIsNone(v["appropriate_alt_coverage"])
        self.assertIsNone(v["fully_structured_table_coverage"])
        self.assertEqual(check_status(v, "form_input_inventory_declared"),
                         "pass")
        self.assertEqual(
            check_status(v, "every_declared_form_input_has_a_bound_label"),
            "pass")

    def test_missing_main_landmark_fails_section1(self):
        m = copy.deepcopy(COMPLETE)
        m["landmarks"]["main_landmark_present"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "SEMANTIC_HTML_REVIEW_DEFICIENT")
        self.assertEqual(v["sections"]["landmarks_and_heading_outline"],
                         "fail")
        self.assertEqual(check_status(v, "main_landmark_present"), "fail")

    def test_two_h1_headings_fail_and_are_counted(self):
        m = copy.deepcopy(COMPLETE)
        m["headings"].append({"level": 1, "label": "Second top heading"})
        v = evaluate(m)
        self.assertEqual(v["verdict"], "SEMANTIC_HTML_REVIEW_DEFICIENT")
        self.assertEqual(
            check_status(v, "exactly_one_h1_in_declared_heading_outline"),
            "fail")
        self.assertEqual(v["h1_count"], 2)
        self.assertEqual(v["computed_status"],
                         "outside_stated_limits_on_declared_evidence")

    def test_zero_h1_headings_fail(self):
        m = copy.deepcopy(COMPLETE)
        m["headings"][0]["level"] = 2
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "exactly_one_h1_in_declared_heading_outline"),
            "fail")
        self.assertEqual(v["h1_count"], 0)

    def test_heading_level_skip_fails_and_is_positioned(self):
        m = copy.deepcopy(COMPLETE)
        m["headings"][1]["level"] = 3
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "heading_outline_levels_never_skip_a_level"),
            "fail")
        self.assertEqual(v["heading_level_skip_positions"], [1])

    def test_heading_row_missing_level_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["headings"][2]["level"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "exactly_one_h1_in_declared_heading_outline"),
            "missing")
        self.assertEqual(
            check_status(v, "heading_outline_levels_never_skip_a_level"),
            "missing")

    def test_absent_headings_list_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["headings"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(check_status(v, "heading_outline_declared"),
                         "missing")
        self.assertIsNone(v["headings_count"])
        self.assertIsNone(v["h1_count"])
        self.assertIsNone(v["heading_level_skip_positions"])
        self.assertIsNone(v["computed_status"])

    def test_clickable_div_semantics_fail_section2(self):
        m = copy.deepcopy(COMPLETE)
        m["semantic_elements"][
            "generic_divs_used_only_when_no_semantic_element_fits"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "SEMANTIC_HTML_REVIEW_DEFICIENT")
        self.assertEqual(v["sections"]["semantic_elements"], "fail")

    def test_unlabelled_input_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["form_inputs"][0]["label_bound"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "SEMANTIC_HTML_REVIEW_DEFICIENT")
        self.assertEqual(
            check_status(v, "every_declared_form_input_has_a_bound_label"),
            "fail")
        self.assertEqual(v["form_inputs_without_bound_label"], ["email"])
        self.assertEqual(v["labelled_input_coverage"], "0.500000")

    def test_input_missing_label_field_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["form_inputs"][1]["label_bound"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "every_declared_form_input_has_a_bound_label"),
            "missing")
        self.assertEqual(v["form_inputs_without_bound_label"], [])

    def test_duplicate_input_ref_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["form_inputs"][1]["input_ref"] = "email"
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "no_declared_form_input_ref_repeated"), "fail")
        self.assertEqual(v["duplicate_form_input_refs"], ["email"])

    def test_keyboard_pass_not_done_fails_section3(self):
        m = copy.deepcopy(COMPLETE)
        m["controls"][
            "keyboard_only_traversal_passed_for_all_interactive_elements"
        ] = False
        v = evaluate(m)
        self.assertEqual(v["sections"]["real_controls_and_labels"], "fail")

    def test_content_image_empty_alt_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["images"][0]["alt_text"] = ""
        v = evaluate(m)
        self.assertEqual(v["verdict"], "SEMANTIC_HTML_REVIEW_DEFICIENT")
        self.assertEqual(
            check_status(v, "every_content_image_has_meaningful_alt_text"),
            "fail")
        self.assertEqual(v["content_images_without_meaningful_alt"],
                         ["hero-chart"])
        self.assertEqual(v["appropriate_alt_coverage"], "0.500000")

    def test_decorative_image_nonempty_alt_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["images"][1]["alt_text"] = "swirl decoration"
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_decorative_image_has_empty_alt_text"),
            "fail")
        self.assertEqual(v["decorative_images_with_nonempty_alt"],
                         ["bg-swirl"])
        self.assertEqual(v["appropriate_alt_coverage"], "0.500000")

    def test_image_missing_alt_fields_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["images"][0]["alt_text"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "every_content_image_has_meaningful_alt_text"),
            "missing")
        self.assertEqual(v["content_images_without_meaningful_alt"], [])

    def test_duplicate_image_ref_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["images"][1]["image_ref"] = "hero-chart"
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "no_declared_image_ref_repeated"), "fail")
        self.assertEqual(v["duplicate_image_refs"], ["hero-chart"])

    def test_table_without_caption_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["data_tables"][0]["caption_present"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "SEMANTIC_HTML_REVIEW_DEFICIENT")
        self.assertEqual(
            check_status(v, "every_data_table_declares_a_caption"), "fail")
        self.assertEqual(v["data_tables_without_caption"],
                         ["plan-comparison"])
        self.assertEqual(v["fully_structured_table_coverage"], "0.000000")

    def test_table_without_th_scope_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["data_tables"][0]["th_scope_present"] = False
        self.assertEqual(
            check_status(evaluate(m), "every_data_table_declares_th_scope"),
            "fail")

    def test_missing_lang_fails_section6(self):
        m = copy.deepcopy(COMPLETE)
        m["document_head"]["html_lang_attribute_set"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "SEMANTIC_HTML_REVIEW_DEFICIENT")
        self.assertEqual(v["sections"]["document_head_hygiene"], "fail")

    def test_aria_faking_controls_fails_section7(self):
        m = copy.deepcopy(COMPLETE)
        m["aria_practice"]["aria_not_used_to_simulate_controls"] = False
        v = evaluate(m)
        self.assertEqual(v["sections"]["aria_practice"], "fail")
        self.assertEqual(
            check_status(v, "aria_not_used_to_simulate_controls"), "fail")

    def test_invalid_nesting_fails_section8(self):
        m = copy.deepcopy(COMPLETE)
        m["validation"]["invalid_nesting_absent_from_markup"] = False
        v = evaluate(m)
        self.assertEqual(v["sections"]["validation_and_nesting"], "fail")

    def test_validator_not_clean_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["validation"]["w3c_validator_reports_clean"] = False
        self.assertEqual(
            check_status(evaluate(m), "w3c_validator_reports_clean"),
            "fail")

    def test_div_click_handlers_fail_red_lines(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"]["div_span_click_handlers_present"] = True
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "no_div_or_span_click_handlers"), "fail")
        self.assertEqual(v["sections"]["red_lines"], "fail")

    def test_layout_tables_fail_red_lines(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"]["layout_tables_present"] = True
        v = evaluate(m)
        self.assertEqual(check_status(v, "no_layout_tables_in_markup"),
                         "fail")
        self.assertEqual(v["verdict"], "SEMANTIC_HTML_REVIEW_DEFICIENT")

    def test_missing_lang_or_title_fails_red_lines(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"]["lang_or_title_missing_present"] = True
        self.assertEqual(
            check_status(evaluate(m), "no_missing_lang_or_title"), "fail")

    def test_absent_evidence_is_insufficient_not_failed(self):
        m = copy.deepcopy(COMPLETE)
        del m["aria_practice"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["aria_practice"],
                         "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertTrue(
            all(c["status"] == "missing" for c in v["checks"]))
        self.assertIsNone(v["computed_status"])
        self.assertIsNone(v["headings_count"])
        self.assertIsNone(v["h1_count"])
        self.assertIsNone(v["heading_level_skip_positions"])
        self.assertIsNone(v["form_inputs_count"])
        self.assertIsNone(v["images_count"])
        self.assertIsNone(v["data_tables_count"])
        self.assertIsNone(v["labelled_input_coverage"])
        self.assertIsNone(v["appropriate_alt_coverage"])
        self.assertIsNone(v["fully_structured_table_coverage"])

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertIn("VERDICT: SEMANTIC_HTML_REVIEW_SOUND", stamp(v))

    def test_non_object_manifest_rejected(self):
        with self.assertRaises(TypeError):
            evaluate(["not", "a", "manifest"])


class MalformedTypeTests(unittest.TestCase):
    def test_string_field_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["page"] = 12345
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("page", str(ctx.exception))

    def test_object_section_as_string_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"landmarks": "should-be-an-object"})
        self.assertIn("landmarks", str(ctx.exception))

    def test_list_field_as_object_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"images": {"image_ref": "hero"}})
        self.assertIn("images", str(ctx.exception))

    def test_list_entry_as_string_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"images": ["hero"]})
        self.assertIn("images[0]", str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["validation"]["w3c_validator_reports_clean"] = "yes"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("validation.w3c_validator_reports_clean",
                      str(ctx.exception))

    def test_number_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["headings"][0]["level"] = "1"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("headings[0].level", str(ctx.exception))

    def test_nested_list_entry_string_field_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["images"][0]["alt_text"] = 42
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("images[0].alt_text", str(ctx.exception))

    def test_nested_list_entry_boolean_field_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["form_inputs"][1]["label_bound"] = 7
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("form_inputs[1].label_bound", str(ctx.exception))

    def test_null_section_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["document_head"] = None
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("document_head", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
