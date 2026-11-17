import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from personal_web_presence_audit import evaluate, stamp  # noqa: E402

COMPLETE = {
    "person": "example-person",
    "hub": {"primary_domain_designated": True,
            "single_canonical_hub": True,
            "redirect_map_in_version_control": True,
            "spoke_redirects_tested": True},
    "spokes": [
        {"domain": "exampleperson.com",
         "redirects_to_hub_or_purpose_page": True,
         "title_description_consistent_with_hub": True},
        {"domain": "example-person.ca",
         "redirects_to_hub_or_purpose_page": True,
         "title_description_consistent_with_hub": True},
        {"domain": "eperson.example",
         "redirects_to_hub_or_purpose_page": True,
         "title_description_consistent_with_hub": True},
    ],
    "identity": {"canonical_bio_defined": True,
                 "canonical_facts_defined": True,
                 "bio_reused_byte_for_byte": True,
                 "bio_consistent_across_hub_profiles_signatures": True},
    "structured_data": {"json_ld_person_present": True,
                        "json_ld_validates": True,
                        "json_ld_same_as_lists_profiles": True,
                        "opengraph_cards_present_per_page": True,
                        "opengraph_cards_render_on_major_platforms": True},
    "profiles": [
        {"platform": "linkedin", "bio_matches_canonical": True,
         "links_to_hub": True},
        {"platform": "github", "bio_matches_canonical": True,
         "links_to_hub": True},
        {"platform": "substack", "bio_matches_canonical": True,
         "links_to_hub": True},
    ],
    "content": {"content_sections_present": True,
                "claims_verifiable": True,
                "claims_dated": True,
                "claims_linked": True},
    "name_seo": {"first_page_for_name_owned": True,
                 "disambiguation_against_similar_names": True,
                 "profiles_linked_reciprocally": True,
                 "rel_me_declared_where_supported": True},
    "cadence": {"quarterly_refresh_of_bio_and_projects": True,
                "prior_versions_archived_publicly": True},
    "contact": {"stable_contact_path_present": True,
                "contact_path_works": True,
                "alias_strategy_defined": True,
                "forms_preferred_over_raw_email": True,
                "spam_controls_present": True},
    "measurement": {"periodic_name_search_check_performed": True,
                    "referrer_review_performed": True,
                    "vanity_metrics_ignored": True,
                    "impersonation_and_typosquat_watch": True},
    "red_lines": {"unverifiable_claims_present": False,
                  "impersonation_confusable_profiles_unfixed_present": False,
                  "family_privacy_boundaries_violated_present": False,
                  "brand_domain_lapsed_present": False,
                  "inflated_titles_present": False,
                  "borrowed_prestige_present": False},
}


def check_status(v, name):
    return next(c["status"] for c in v["checks"] if c["check"] == name)


class VerdictTests(unittest.TestCase):
    def test_complete_manifest_is_consistent(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(v["verdict"], "PERSONAL_PRESENCE_CONSISTENT")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(len(v["checks"]), 46)
        self.assertEqual(v["computed_status"],
                         "within_stated_limits_on_declared_evidence")
        self.assertEqual(v["spokes_count"], 3)
        self.assertEqual(v["spokes_without_redirect"], [])
        self.assertEqual(v["redirect_coverage"], "1.000000")
        self.assertEqual(
            v["spokes_without_consistent_title_description"], [])
        self.assertEqual(
            v["title_description_consistency_coverage"], "1.000000")
        self.assertEqual(v["duplicate_spoke_domains"], [])
        self.assertEqual(v["profiles_count"], 3)
        self.assertEqual(v["profiles_without_matching_bio"], [])
        self.assertEqual(v["bio_match_coverage"], "1.000000")
        self.assertEqual(v["profiles_without_hub_link"], [])
        self.assertEqual(v["hub_link_coverage"], "1.000000")
        self.assertEqual(v["duplicate_profile_platforms"], [])

    def test_no_single_hub_fails_section1(self):
        m = copy.deepcopy(COMPLETE)
        m["hub"]["single_canonical_hub"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "PERSONAL_PRESENCE_INCONSISTENT")
        self.assertEqual(v["sections"]["hub_and_spokes"], "fail")
        self.assertEqual(check_status(v, "single_canonical_hub"), "fail")

    def test_spoke_without_redirect_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["spokes"][0]["redirects_to_hub_or_purpose_page"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "PERSONAL_PRESENCE_INCONSISTENT")
        self.assertEqual(
            check_status(
                v, "every_spoke_redirects_to_hub_or_purpose_page"),
            "fail")
        self.assertEqual(v["spokes_without_redirect"], ["exampleperson.com"])
        self.assertEqual(v["redirect_coverage"], "0.666667")
        self.assertEqual(v["computed_status"],
                         "outside_stated_limits_on_declared_evidence")

    def test_spoke_missing_redirect_field_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["spokes"][0]["redirects_to_hub_or_purpose_page"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(
                v, "every_spoke_redirects_to_hub_or_purpose_page"),
            "missing")
        self.assertEqual(v["spokes_without_redirect"], [])

    def test_spoke_inconsistent_title_description_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["spokes"][1]["title_description_consistent_with_hub"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v,
                "every_spoke_title_description_consistent_with_hub"),
            "fail")
        self.assertEqual(
            v["spokes_without_consistent_title_description"],
            ["example-person.ca"])
        self.assertEqual(
            v["title_description_consistency_coverage"], "0.666667")

    def test_duplicate_spoke_domain_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["spokes"][2]["domain"] = "exampleperson.com"
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "no_spoke_domain_duplicated"), "fail")
        self.assertEqual(v["duplicate_spoke_domains"],
                         ["exampleperson.com"])

    def test_spoke_missing_domain_is_missing_for_duplicate_check(self):
        m = copy.deepcopy(COMPLETE)
        del m["spokes"][2]["domain"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "no_spoke_domain_duplicated"), "missing")
        self.assertEqual(v["duplicate_spoke_domains"], [])

    def test_empty_spokes_list_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["spokes"] = []
        v = evaluate(m)
        self.assertEqual(check_status(v, "spokes_declared"), "fail")
        self.assertEqual(v["spokes_count"], 0)
        self.assertIsNone(v["redirect_coverage"])
        self.assertIsNone(v["title_description_consistency_coverage"])
        self.assertEqual(v["duplicate_spoke_domains"], [])

    def test_bio_not_reused_fails_section2(self):
        m = copy.deepcopy(COMPLETE)
        m["identity"]["bio_reused_byte_for_byte"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "PERSONAL_PRESENCE_INCONSISTENT")
        self.assertEqual(
            v["sections"]["identity_facts_and_structured_data"], "fail")

    def test_json_ld_not_validating_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["structured_data"]["json_ld_validates"] = False
        self.assertEqual(
            check_status(evaluate(m), "json_ld_validates"), "fail")

    def test_profile_bio_mismatch_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["profiles"][0]["bio_matches_canonical"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_profile_bio_matches_canonical"),
            "fail")
        self.assertEqual(v["profiles_without_matching_bio"], ["linkedin"])
        self.assertEqual(v["bio_match_coverage"], "0.666667")

    def test_profile_without_hub_link_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["profiles"][1]["links_to_hub"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_profile_links_to_hub"), "fail")
        self.assertEqual(v["profiles_without_hub_link"], ["github"])
        self.assertEqual(v["hub_link_coverage"], "0.666667")

    def test_profile_missing_bio_field_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["profiles"][2]["bio_matches_canonical"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "every_profile_bio_matches_canonical"),
            "missing")
        self.assertEqual(v["profiles_without_matching_bio"], [])

    def test_duplicate_profile_platform_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["profiles"][2]["platform"] = "linkedin"
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "no_profile_platform_duplicated"), "fail")
        self.assertEqual(v["duplicate_profile_platforms"], ["linkedin"])

    def test_empty_profiles_list_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["profiles"] = []
        v = evaluate(m)
        self.assertEqual(check_status(v, "profiles_declared"), "fail")
        self.assertEqual(v["profiles_count"], 0)
        self.assertIsNone(v["bio_match_coverage"])
        self.assertIsNone(v["hub_link_coverage"])

    def test_undated_claims_fail_section3(self):
        m = copy.deepcopy(COMPLETE)
        m["content"]["claims_dated"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "PERSONAL_PRESENCE_INCONSISTENT")
        self.assertEqual(
            v["sections"]["content_standards_and_name_seo"], "fail")

    def test_no_rel_me_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["name_seo"]["rel_me_declared_where_supported"] = False
        self.assertEqual(
            check_status(evaluate(m), "rel_me_declared_where_supported"),
            "fail")

    def test_no_quarterly_refresh_fails_section4(self):
        m = copy.deepcopy(COMPLETE)
        m["cadence"]["quarterly_refresh_of_bio_and_projects"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "PERSONAL_PRESENCE_INCONSISTENT")
        self.assertEqual(
            v["sections"]["cadence_contact_and_measurement"], "fail")

    def test_contact_path_not_working_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["contact"]["contact_path_works"] = False
        self.assertEqual(
            check_status(evaluate(m), "contact_path_works"), "fail")

    def test_no_impersonation_watch_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["measurement"]["impersonation_and_typosquat_watch"] = False
        self.assertEqual(
            check_status(
                evaluate(m), "impersonation_and_typosquat_watch"),
            "fail")

    def test_unverifiable_claims_fail_red_lines(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"]["unverifiable_claims_present"] = True
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "no_unverifiable_claims"), "fail")
        self.assertEqual(v["sections"]["red_lines"], "fail")
        self.assertEqual(v["verdict"], "PERSONAL_PRESENCE_INCONSISTENT")

    def test_domain_lapsed_and_impersonation_red_lines_fail(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"]["brand_domain_lapsed_present"] = True
        m["red_lines"][
            "impersonation_confusable_profiles_unfixed_present"] = True
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "no_brand_domain_lapsed"), "fail")
        self.assertEqual(
            check_status(
                v, "no_impersonation_confusable_profiles_unfixed"),
            "fail")

    def test_borrowed_prestige_and_inflated_titles_fail(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"]["borrowed_prestige_present"] = True
        m["red_lines"]["inflated_titles_present"] = True
        v = evaluate(m)
        self.assertEqual(check_status(v, "no_borrowed_prestige"), "fail")
        self.assertEqual(check_status(v, "no_inflated_titles"), "fail")

    def test_absent_evidence_is_insufficient_not_failed(self):
        m = copy.deepcopy(COMPLETE)
        del m["contact"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["cadence_contact_and_measurement"],
                         "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertTrue(
            all(c["status"] == "missing" for c in v["checks"]))
        self.assertIsNone(v["computed_status"])
        self.assertIsNone(v["spokes_count"])
        self.assertIsNone(v["spokes_without_redirect"])
        self.assertIsNone(v["redirect_coverage"])
        self.assertIsNone(v["spokes_without_consistent_title_description"])
        self.assertIsNone(v["title_description_consistency_coverage"])
        self.assertIsNone(v["duplicate_spoke_domains"])
        self.assertIsNone(v["profiles_count"])
        self.assertIsNone(v["profiles_without_matching_bio"])
        self.assertIsNone(v["bio_match_coverage"])
        self.assertIsNone(v["profiles_without_hub_link"])
        self.assertIsNone(v["hub_link_coverage"])
        self.assertIsNone(v["duplicate_profile_platforms"])

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertIn("VERDICT: PERSONAL_PRESENCE_CONSISTENT", stamp(v))

    def test_non_object_manifest_rejected(self):
        with self.assertRaises(TypeError):
            evaluate(["not", "a", "manifest"])


class MalformedTypeTests(unittest.TestCase):
    def test_string_field_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["person"] = 12345
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("person", str(ctx.exception))

    def test_object_section_as_string_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"hub": "should-be-an-object"})
        self.assertIn("hub", str(ctx.exception))

    def test_list_field_as_object_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"spokes": {"domain": "exampleperson.com"}})
        self.assertIn("spokes", str(ctx.exception))

    def test_list_entry_as_string_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"spokes": ["exampleperson.com"]})
        self.assertIn("spokes[0]", str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["hub"]["single_canonical_hub"] = "yes"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("hub.single_canonical_hub", str(ctx.exception))

    def test_nested_list_entry_string_field_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["spokes"][0]["domain"] = 42
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("spokes[0].domain", str(ctx.exception))

    def test_nested_list_entry_boolean_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["profiles"][1]["bio_matches_canonical"] = "true"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("profiles[1].bio_matches_canonical",
                      str(ctx.exception))

    def test_null_section_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["identity"] = None
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("identity", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
