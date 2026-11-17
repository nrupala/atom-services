import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from honest_seo_audit_intent_map import evaluate, stamp  # noqa: E402

COMPLETE = {
    "site": "example-site",
    "technical": {"crawlable_robots_and_sitemap": True,
                  "core_web_vitals_targets_addressed": True,
                  "mobile_first": True,
                  "https_enabled": True,
                  "canonical_tags_correct": True,
                  "accidental_noindex_or_blocked_paths_present": False,
                  "clean_url_structure": True,
                  "not_found_404s_handled": True},
    "intent": {"audience_questions_mapped": True,
               "intent_type_assigned_per_question": True,
               "prioritization_by_relevance_and_feasibility": True},
    "on_page": {"titles_and_descriptions_specific_and_honest": True,
                "heading_hierarchy_present": True,
                "internal_links_with_descriptive_anchors": True,
                "clickbait_mismatch_present": False,
                "word_count_padding_present": False},
    "pages": [
        {"name": "pricing-guide", "intent": "pricing-questions",
         "intent_type": "commercial", "has_single_intent": True,
         "fully_answers_question": True},
        {"name": "how-it-works", "intent": "how-it-works-questions",
         "intent_type": "informational", "has_single_intent": True,
         "fully_answers_question": True},
        {"name": "buy", "intent": "purchase",
         "intent_type": "transactional", "has_single_intent": True,
         "fully_answers_question": True},
    ],
    "structured_data": {"schema_org_applied_as_applicable": True,
                        "rich_results_validated": True},
    "entity": {"brand_name_contact_consistent": True,
               "real_author_identity_for_professional_content": True,
               "credentials_carried_where_appropriate": True,
               "public_content_sanitization_applied": True},
    "authority": {"useful_assets_created_to_attract_links": True,
                  "relevant_human_outreach_only": True},
    "measurement": {"search_console_and_analytics_wired": True,
                    "search_console_baseline_captured": True,
                    "impressions_clicks_conversions_tracked": True,
                    "queries_gained_lost_tracked": True,
                    "monthly_iteration_cadence": True,
                    "decaying_pages_refreshed_on_schedule": True},
    "ai_era": {
        "structure_and_canonical_answers_designed_for_extraction": True},
    "red_lines": {"cloaking_present": False,
                  "pbn_present": False,
                  "bought_links_present": False,
                  "link_schemes_present": False,
                  "keyword_spam_present": False,
                  "misleading_metadata_present": False,
                  "fake_urgency_present": False},
}


def check_status(v, name):
    return next(c["status"] for c in v["checks"] if c["check"] == name)


class VerdictTests(unittest.TestCase):
    def test_complete_manifest_is_sound(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(v["verdict"], "HONEST_SEO_MAP_SOUND")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(len(v["checks"]), 43)
        self.assertEqual(v["computed_status"],
                         "within_stated_limits_on_declared_evidence")
        self.assertEqual(v["pages_count"], 3)
        self.assertEqual(v["pages_without_single_intent"], [])
        self.assertEqual(v["single_intent_coverage"], "1.000000")
        self.assertEqual(v["pages_with_invalid_intent_type"], [])
        self.assertEqual(v["valid_intent_type_coverage"], "1.000000")
        self.assertEqual(v["duplicate_intents"], [])
        self.assertEqual(v["pages_not_fully_answering"], [])
        self.assertEqual(v["full_answer_coverage"], "1.000000")

    def test_no_https_fails_technical_section(self):
        m = copy.deepcopy(COMPLETE)
        m["technical"]["https_enabled"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "HONEST_SEO_MAP_NOT_SOUND")
        self.assertEqual(v["sections"]["technical_foundation"], "fail")
        self.assertEqual(check_status(v, "https_enabled"), "fail")

    def test_accidental_noindex_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["technical"]["accidental_noindex_or_blocked_paths_present"] = True
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "no_accidental_noindex_or_blocked_paths"),
            "fail")

    def test_canonicals_wrong_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["technical"]["canonical_tags_correct"] = False
        self.assertEqual(evaluate(m)["verdict"], "HONEST_SEO_MAP_NOT_SOUND")

    def test_vanity_prioritization_fails_intent_section(self):
        m = copy.deepcopy(COMPLETE)
        m["intent"]["prioritization_by_relevance_and_feasibility"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "HONEST_SEO_MAP_NOT_SOUND")
        self.assertEqual(
            v["sections"]["intent_map_and_on_page_craft"], "fail")

    def test_clickbait_mismatch_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["on_page"]["clickbait_mismatch_present"] = True
        v = evaluate(m)
        self.assertEqual(check_status(v, "no_clickbait_mismatch"), "fail")

    def test_word_count_padding_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["on_page"]["word_count_padding_present"] = True
        self.assertEqual(
            check_status(evaluate(m), "no_word_count_padding"), "fail")

    def test_page_without_single_intent_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["pages"][0]["has_single_intent"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "HONEST_SEO_MAP_NOT_SOUND")
        self.assertEqual(
            check_status(v, "every_page_has_single_intent"), "fail")
        self.assertEqual(v["pages_without_single_intent"], ["pricing-guide"])
        self.assertEqual(v["single_intent_coverage"], "0.666667")
        self.assertEqual(v["computed_status"],
                         "outside_stated_limits_on_declared_evidence")

    def test_page_missing_single_intent_field_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["pages"][0]["has_single_intent"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "every_page_has_single_intent"), "missing")
        self.assertEqual(v["pages_without_single_intent"], [])

    def test_page_with_invalid_intent_type_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["pages"][1]["intent_type"] = "navigational"
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_page_intent_type_valid"), "fail")
        self.assertEqual(v["pages_with_invalid_intent_type"],
                         ["how-it-works"])
        self.assertEqual(v["valid_intent_type_coverage"], "0.666667")

    def test_page_missing_intent_type_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["pages"][1]["intent_type"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "every_page_intent_type_valid"), "missing")
        self.assertEqual(v["pages_with_invalid_intent_type"], [])

    def test_duplicate_intent_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["pages"][2]["intent"] = "pricing-questions"
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "no_intent_owned_by_multiple_pages"), "fail")
        self.assertEqual(v["duplicate_intents"], ["pricing-questions"])

    def test_page_missing_intent_is_missing_for_duplicate_check(self):
        m = copy.deepcopy(COMPLETE)
        del m["pages"][2]["intent"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "no_intent_owned_by_multiple_pages"),
            "missing")
        self.assertEqual(v["duplicate_intents"], [])

    def test_page_not_fully_answering_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["pages"][1]["fully_answers_question"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_page_fully_answers_question"), "fail")
        self.assertEqual(v["pages_not_fully_answering"], ["how-it-works"])
        self.assertEqual(v["full_answer_coverage"], "0.666667")

    def test_empty_pages_list_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["pages"] = []
        v = evaluate(m)
        self.assertEqual(check_status(v, "pages_declared"), "fail")
        self.assertEqual(v["pages_count"], 0)
        self.assertIsNone(v["single_intent_coverage"])
        self.assertIsNone(v["valid_intent_type_coverage"])
        self.assertIsNone(v["full_answer_coverage"])
        self.assertEqual(v["duplicate_intents"], [])

    def test_schema_not_applied_fails_structured_section(self):
        m = copy.deepcopy(COMPLETE)
        m["structured_data"]["schema_org_applied_as_applicable"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "HONEST_SEO_MAP_NOT_SOUND")
        self.assertEqual(
            v["sections"]["structured_data_and_entity_clarity"], "fail")

    def test_no_real_author_identity_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["entity"]["real_author_identity_for_professional_content"] = False
        self.assertEqual(evaluate(m)["verdict"], "HONEST_SEO_MAP_NOT_SOUND")

    def test_no_baseline_fails_measurement(self):
        m = copy.deepcopy(COMPLETE)
        m["measurement"]["search_console_baseline_captured"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "search_console_baseline_captured"), "fail")
        self.assertEqual(
            v["sections"]["earned_authority_and_measurement"], "fail")

    def test_extraction_design_missing_fails_ai_era_check(self):
        m = copy.deepcopy(COMPLETE)
        m["ai_era"][
            "structure_and_canonical_answers_designed_for_extraction"
        ] = False
        self.assertEqual(evaluate(m)["verdict"], "HONEST_SEO_MAP_NOT_SOUND")

    def test_cloaking_fails_red_lines(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"]["cloaking_present"] = True
        v = evaluate(m)
        self.assertEqual(check_status(v, "no_cloaking"), "fail")
        self.assertEqual(v["sections"]["white_hat_red_lines"], "fail")

    def test_bought_links_fail_red_lines(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"]["bought_links_present"] = True
        v = evaluate(m)
        self.assertEqual(check_status(v, "no_bought_links"), "fail")
        self.assertEqual(v["verdict"], "HONEST_SEO_MAP_NOT_SOUND")

    def test_pbn_and_keyword_spam_fail_red_lines(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"]["pbn_present"] = True
        m["red_lines"]["keyword_spam_present"] = True
        v = evaluate(m)
        self.assertEqual(check_status(v, "no_pbn"), "fail")
        self.assertEqual(check_status(v, "no_keyword_spam"), "fail")

    def test_fake_urgency_fails_red_lines(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"]["fake_urgency_present"] = True
        self.assertEqual(
            check_status(evaluate(m), "no_fake_urgency"), "fail")

    def test_absent_evidence_is_insufficient_not_failed(self):
        m = copy.deepcopy(COMPLETE)
        del m["measurement"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["earned_authority_and_measurement"],
                         "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertTrue(
            all(c["status"] == "missing" for c in v["checks"]))
        self.assertIsNone(v["computed_status"])
        self.assertIsNone(v["pages_count"])
        self.assertIsNone(v["pages_without_single_intent"])
        self.assertIsNone(v["single_intent_coverage"])
        self.assertIsNone(v["pages_with_invalid_intent_type"])
        self.assertIsNone(v["valid_intent_type_coverage"])
        self.assertIsNone(v["duplicate_intents"])
        self.assertIsNone(v["pages_not_fully_answering"])
        self.assertIsNone(v["full_answer_coverage"])

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertIn("VERDICT: HONEST_SEO_MAP_SOUND", stamp(v))

    def test_non_object_manifest_rejected(self):
        with self.assertRaises(TypeError):
            evaluate(["not", "a", "manifest"])


class MalformedTypeTests(unittest.TestCase):
    def test_string_field_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["site"] = 12345
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("site", str(ctx.exception))

    def test_object_section_as_string_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"technical": "should-be-an-object"})
        self.assertIn("technical", str(ctx.exception))

    def test_list_field_as_object_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"pages": {"name": "pricing-guide"}})
        self.assertIn("pages", str(ctx.exception))

    def test_list_entry_as_string_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"pages": ["pricing-guide"]})
        self.assertIn("pages[0]", str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["technical"]["https_enabled"] = "yes"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("technical.https_enabled", str(ctx.exception))

    def test_nested_list_entry_string_field_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["pages"][0]["name"] = 42
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("pages[0].name", str(ctx.exception))

    def test_nested_list_entry_intent_type_as_boolean_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["pages"][1]["intent_type"] = True
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("pages[1].intent_type", str(ctx.exception))

    def test_null_section_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["entity"] = None
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("entity", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
