import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from sourced_visual_reference_search import evaluate, stamp  # noqa: E402


def _row(rid, url, licence="reference_only_no_licence_stated"):
    return {
        "result_id": rid,
        "direct_image_url": url,
        "source_page_url": f"https://example.com/pages/{rid}",
        "source_page_verified": True,
        "matches_brief_by_viewing": True,
        "shows_subject_clearly": True,
        "usable_resolution_declared": True,
        "misleading_cropping_present": False,
        "watermark_present": False,
        "caption_product_mismatch_present": False,
        "depiction_noted": True,
        "publisher_noted": True,
        "caption_date_or_credit_noted": True,
        "licence_status": licence,
        "licence_note_present": True,
        "credit_noted": True,
        "claimed_cleared_for_commercial_use": False,
    }


COMPLETE = {
    "search_title": "compact-wall-mounted-ev-charger-garage",
    "brief": {"target_restated_in_searchable_terms": True,
              "subject_stated": True,
              "setting_stated": True,
              "angle_or_style_stated": True,
              "must_have_and_must_avoid_details_stated": True},
    "search": {"terms_adjusted_when_first_pass_off_topic": True},
    "results": [
        _row("ref-1", "https://example.com/img/charger-1.jpg"),
        _row("ref-2", "https://example.com/img/charger-2.jpg",
             licence="explicitly_licensed"),
        _row("ref-3", "https://example.com/img/charger-3.jpg"),
    ],
    "quality": {"relevance_checked_by_viewing_not_title_alone": True,
                "weak_duplicate_or_misleading_filtered_out": True},
    "selection": {"involves_choice": True,
                  "strongest_match_called_out_first": True,
                  "similar_candidates_grouped": True,
                  "evidence_use_paired_with_facts_where_used_as_evidence": True},
    "licensing": {"licensing_caution_stated_plainly": True},
    "red_lines": {
        "person_identified_in_found_photo_present": False,
        "found_image_presented_as_own_or_generated_present": False,
        "found_image_presented_as_licensed_without_explicit_grant_present": False,
        "unsourced_image_returned_present": False,
        "altered_image_passed_as_original_present": False},
}


def check_status(v, name):
    return next(c["status"] for c in v["checks"] if c["check"] == name)


class VerdictTests(unittest.TestCase):
    def test_complete_manifest_is_sound(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(v["verdict"], "VISUAL_REFERENCE_SET_SOUND")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(len(v["checks"]), 34)
        self.assertEqual(v["computed_status"],
                         "within_stated_limits_on_declared_evidence")
        self.assertEqual(v["visual_reference_results_count"], 3)
        self.assertEqual(v["duplicate_visual_reference_result_ids"], [])
        self.assertEqual(v["duplicate_visual_reference_direct_image_urls"], [])
        self.assertEqual(v["visual_reference_results_missing_source_pair"], [])
        self.assertEqual(
            v["visual_reference_results_with_incomplete_licence_attribution"],
            [])
        self.assertEqual(v["sourced_pair_coverage_ratio"], "1.000000")
        self.assertEqual(v["licence_attribution_coverage_ratio"], "1.000000")
        self.assertEqual(v["visual_reference_match_ratio"], "1.000000")

    def test_subject_not_stated_fails_brief_section(self):
        m = copy.deepcopy(COMPLETE)
        m["brief"]["subject_stated"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "VISUAL_REFERENCE_SET_NOT_SOUND")
        self.assertEqual(v["sections"]["search_brief_and_query"], "fail")
        self.assertEqual(check_status(v, "visual_reference_subject_stated"),
                         "fail")

    def test_terms_not_adjusted_fails_brief_section(self):
        m = copy.deepcopy(COMPLETE)
        m["search"]["terms_adjusted_when_first_pass_off_topic"] = False
        self.assertEqual(
            check_status(
                evaluate(m),
                "visual_reference_search_terms_adjusted_when_first_pass_off_topic"),
            "fail")

    def test_duplicate_result_id_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["results"][2]["result_id"] = "ref-1"
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_visual_reference_result_id_unique"), "fail")
        self.assertEqual(v["duplicate_visual_reference_result_ids"], ["ref-1"])

    def test_duplicate_direct_url_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["results"][2]["direct_image_url"] = m["results"][0]["direct_image_url"]
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_visual_reference_direct_image_url_unique"),
            "fail")
        self.assertEqual(
            v["duplicate_visual_reference_direct_image_urls"],
            ["https://example.com/img/charger-1.jpg"])
        # distinct count drops to 2, so the choice-set check also fails
        self.assertEqual(
            check_status(
                v,
                "visual_reference_choice_set_several_distinct_candidates_when_choice_involved"),
            "fail")

    def test_missing_source_page_url_is_missing_and_named(self):
        m = copy.deepcopy(COMPLETE)
        del m["results"][1]["source_page_url"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(
                v,
                "every_visual_reference_result_has_direct_image_and_source_page_links"),
            "missing")
        self.assertEqual(v["visual_reference_results_missing_source_pair"],
                         ["ref-2"])
        self.assertEqual(v["sourced_pair_coverage_ratio"], "0.666667")

    def test_empty_source_page_url_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["results"][0]["source_page_url"] = ""
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v,
                "every_visual_reference_result_has_direct_image_and_source_page_links"),
            "fail")
        self.assertEqual(v["visual_reference_results_missing_source_pair"],
                         ["ref-1"])

    def test_unverified_source_page_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["results"][0]["source_page_verified"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_visual_reference_result_source_page_verified"),
            "fail")
        self.assertEqual(v["sections"]["source_provenance"], "fail")

    def test_absent_results_list_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["results"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "visual_reference_results_list_declared"),
            "missing")
        self.assertIsNone(v["computed_status"])
        self.assertIsNone(v["visual_reference_results_count"])
        self.assertIsNone(v["duplicate_visual_reference_result_ids"])
        self.assertIsNone(v["sourced_pair_coverage_ratio"])
        self.assertIsNone(v["licence_attribution_coverage_ratio"])
        self.assertIsNone(v["visual_reference_match_ratio"])

    def test_empty_results_list_fails_list_declared(self):
        m = copy.deepcopy(COMPLETE)
        m["results"] = []
        v = evaluate(m)
        self.assertEqual(v["verdict"], "VISUAL_REFERENCE_SET_NOT_SOUND")
        self.assertEqual(
            check_status(v, "visual_reference_results_list_declared"), "fail")
        self.assertEqual(v["visual_reference_results_count"], 0)
        self.assertIsNone(v["sourced_pair_coverage_ratio"])

    def test_non_matching_result_fails_and_lowers_match_ratio(self):
        m = copy.deepcopy(COMPLETE)
        m["results"][1]["matches_brief_by_viewing"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_visual_reference_result_matches_brief_by_viewing"),
            "fail")
        self.assertEqual(v["visual_reference_match_ratio"], "0.666667")
        self.assertEqual(v["sections"]["relevance_and_quality"], "fail")

    def test_watermark_present_fails_defect_check(self):
        m = copy.deepcopy(COMPLETE)
        m["results"][0]["watermark_present"] = True
        self.assertEqual(
            check_status(
                evaluate(m),
                "no_visual_reference_result_misleading_cropping_watermark_or_caption_mismatch"),
            "fail")

    def test_caption_mismatch_present_fails_defect_check(self):
        m = copy.deepcopy(COMPLETE)
        m["results"][2]["caption_product_mismatch_present"] = True
        self.assertEqual(
            check_status(
                evaluate(m),
                "no_visual_reference_result_misleading_cropping_watermark_or_caption_mismatch"),
            "fail")

    def test_row_missing_quality_field_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["results"][0]["shows_subject_clearly"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "every_visual_reference_result_shows_subject_clearly"),
            "missing")

    def test_publisher_not_noted_fails_context(self):
        m = copy.deepcopy(COMPLETE)
        m["results"][1]["publisher_noted"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_visual_reference_result_publisher_noted"),
            "fail")
        self.assertEqual(v["sections"]["context_and_selection"], "fail")

    def test_choice_set_with_two_distinct_fails_when_choice_involved(self):
        m = copy.deepcopy(COMPLETE)
        m["results"] = m["results"][:2]
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v,
                "visual_reference_choice_set_several_distinct_candidates_when_choice_involved"),
            "fail")

    def test_single_result_passes_when_no_choice_involved(self):
        m = copy.deepcopy(COMPLETE)
        m["results"] = m["results"][:1]
        m["selection"]["involves_choice"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v,
                "visual_reference_choice_set_several_distinct_candidates_when_choice_involved"),
            "pass")
        self.assertEqual(v["verdict"], "VISUAL_REFERENCE_SET_SOUND")

    def test_absent_involves_choice_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["selection"]["involves_choice"]
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v,
                "visual_reference_choice_set_several_distinct_candidates_when_choice_involved"),
            "missing")

    def test_strongest_match_not_called_out_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["selection"]["strongest_match_called_out_first"] = False
        self.assertEqual(
            check_status(evaluate(m),
                         "visual_reference_strongest_match_called_out_first"),
            "fail")

    def test_unrecognised_licence_status_fails_and_lowers_coverage(self):
        m = copy.deepcopy(COMPLETE)
        m["results"][0]["licence_status"] = "probably_fine"
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v, "every_visual_reference_result_licence_status_recognised"),
            "fail")
        self.assertEqual(
            v["visual_reference_results_with_incomplete_licence_attribution"],
            ["ref-1"])
        self.assertEqual(v["licence_attribution_coverage_ratio"], "0.666667")

    def test_missing_licence_note_fails_coverage(self):
        m = copy.deepcopy(COMPLETE)
        m["results"][2]["licence_note_present"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_visual_reference_result_licence_note_present"),
            "fail")
        self.assertEqual(v["licence_attribution_coverage_ratio"], "0.666667")

    def test_claimed_cleared_without_explicit_licence_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["results"][0]["claimed_cleared_for_commercial_use"] = True
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v,
                "no_visual_reference_result_claimed_cleared_without_explicit_licence"),
            "fail")
        self.assertEqual(v["sections"]["licensing_and_attribution"], "fail")
        self.assertEqual(v["computed_status"],
                         "outside_stated_limits_on_declared_evidence")

    def test_claimed_cleared_with_explicit_licence_passes(self):
        m = copy.deepcopy(COMPLETE)
        m["results"][1]["claimed_cleared_for_commercial_use"] = True
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v,
                "no_visual_reference_result_claimed_cleared_without_explicit_licence"),
            "pass")
        self.assertEqual(v["verdict"], "VISUAL_REFERENCE_SET_SOUND")

    def test_licensing_caution_not_stated_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["licensing"]["licensing_caution_stated_plainly"] = False
        self.assertEqual(
            check_status(evaluate(m),
                         "visual_reference_licensing_caution_stated_plainly"),
            "fail")

    def test_person_identification_fails_red_lines(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"]["person_identified_in_found_photo_present"] = True
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "visual_reference_free_of_person_identification"),
            "fail")
        self.assertEqual(v["sections"]["red_lines"], "fail")
        self.assertEqual(v["verdict"], "VISUAL_REFERENCE_SET_NOT_SOUND")

    def test_presented_as_own_fails_red_lines(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"]["found_image_presented_as_own_or_generated_present"] = True
        self.assertEqual(
            check_status(
                evaluate(m),
                "visual_reference_free_of_found_image_presented_as_own_or_generated"),
            "fail")

    def test_altered_as_original_fails_red_lines(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"]["altered_image_passed_as_original_present"] = True
        self.assertEqual(
            check_status(
                evaluate(m),
                "visual_reference_free_of_altered_image_passed_as_original"),
            "fail")

    def test_absent_evidence_is_insufficient_not_failed(self):
        m = copy.deepcopy(COMPLETE)
        del m["licensing"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["licensing_and_attribution"],
                         "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertTrue(all(c["status"] == "missing" for c in v["checks"]))
        self.assertIsNone(v["computed_status"])
        self.assertIsNone(v["visual_reference_results_count"])
        self.assertIsNone(v["duplicate_visual_reference_result_ids"])
        self.assertIsNone(v["duplicate_visual_reference_direct_image_urls"])
        self.assertIsNone(v["visual_reference_results_missing_source_pair"])
        self.assertIsNone(
            v["visual_reference_results_with_incomplete_licence_attribution"])
        self.assertIsNone(v["sourced_pair_coverage_ratio"])
        self.assertIsNone(v["licence_attribution_coverage_ratio"])
        self.assertIsNone(v["visual_reference_match_ratio"])

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertIn("VERDICT: VISUAL_REFERENCE_SET_SOUND", stamp(v))

    def test_non_object_manifest_rejected(self):
        with self.assertRaises(TypeError):
            evaluate(["not", "a", "manifest"])


class MalformedTypeTests(unittest.TestCase):
    def test_string_field_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["search_title"] = 12345
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("search_title", str(ctx.exception))

    def test_object_section_as_string_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"brief": "should-be-an-object"})
        self.assertIn("brief", str(ctx.exception))

    def test_list_field_as_object_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"results": {"result_id": "ref-1"}})
        self.assertIn("results", str(ctx.exception))

    def test_list_entry_as_string_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"results": ["ref-1"]})
        self.assertIn("results[0]", str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["brief"]["subject_stated"] = "yes"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("brief.subject_stated", str(ctx.exception))

    def test_nested_list_entry_string_field_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["results"][1]["licence_status"] = 42
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("results[1].licence_status", str(ctx.exception))

    def test_nested_list_entry_boolean_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["results"][0]["source_page_verified"] = "true"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("results[0].source_page_verified", str(ctx.exception))

    def test_null_section_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["licensing"] = None
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("licensing", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
