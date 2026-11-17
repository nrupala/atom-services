import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from technical_documentation_pack import evaluate, stamp  # noqa: E402

COMPLETE = {
    "product_name": "grid-gateway",
    "product_version": "2.4.0",
    "readme": {"what_it_is_one_paragraph_declared": True,
               "quickstart_present": True, "quickstart_copy_paste_ready": True,
               "usage_present": True, "operations_present": True,
               "troubleshooting_present": True,
               "where_to_change_things_present": True},
    "documents": [
        {"doc_id": "doc-readme", "doc_kind": "readme",
         "source_location": "README.md",
         "source_of_truth": "product source tree"},
        {"doc_id": "doc-api", "doc_kind": "api_doc",
         "source_location": "docs/api.md",
         "source_of_truth": "OpenAPI contract"},
        {"doc_id": "doc-adr", "doc_kind": "decision_record",
         "source_location": "docs/adr/0001.md",
         "source_of_truth": "decision record in repo"},
    ],
    "source_of_truth": {"docs_live_with_source_they_describe": True,
                        "no_wiki_only_oracle_docs": True},
    "config_options": [
        {"option_id": "opt-port", "default_value": "8080", "documented": True},
        {"option_id": "opt-mode", "default_value": "auto", "documented": True},
    ],
    "api_docs": {"generated_from_or_verified_against_contracts": True},
    "endpoints": [
        {"endpoint_id": "ep-get-status", "documented_in_doc_id": "doc-api",
         "has_working_example": True, "example_verified_against_contract": True},
        {"endpoint_id": "ep-post-job", "documented_in_doc_id": "doc-api",
         "has_working_example": True, "example_verified_against_contract": True},
    ],
    "decision_work": {"adrs_cross_linked_from_code_where_surprising": True},
    "decision_records": [
        {"adr_id": "adr-1", "documented_in_doc_id": "doc-adr",
         "cross_linked_from_code": True},
    ],
    "review_verification": {"docs_reviewed_like_code": True,
                             "docs_updated_in_same_change_as_behavior_changes": True,
                             "quickstart_run_from_clean_environment": True,
                             "quickstart_works_verbatim_from_clean_state": True,
                             "worked_examples_tested": True,
                             "screenshots_or_commands_present": True,
                             "screenshots_and_commands_verified_current": True},
    "plain_language": {"short_sentences_used": True,
                       "jargon_defined_on_first_use": True,
                       "steps_presented_as_lists": True,
                       "examples_preferred_over_adjectives": True},
    "changelog": {"kept_continuously": True,
                  "not_retrofitted_at_release_time": True,
                  "entry_for_current_version_present": True},
    "versioning": {"doc_set_version": "2.4.0",
                   "doc_set_versioned_with_product": True},
    "red_lines": {"private_contact_or_financial_data_published_in_docs_present": False,
                  "silent_todo_document_present": False},
}


def check_status(v, name):
    return next(c["status"] for c in v["checks"] if c["check"] == name)


class VerdictTests(unittest.TestCase):
    def test_complete_manifest_is_sound(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(v["verdict"], "TECHNICAL_DOCUMENTATION_SOUND")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(len(v["checks"]), 46)
        self.assertEqual(v["computed_status"],
                         "within_stated_limits_on_declared_evidence")
        self.assertEqual(v["documentation_set_docs_count"], 3)
        self.assertEqual(v["documentation_config_options_count"], 2)
        self.assertEqual(v["documentation_endpoints_count"], 2)
        self.assertEqual(v["documentation_decision_records_count"], 1)
        self.assertEqual(v["duplicate_technical_documentation_doc_ids"], [])
        self.assertEqual(v["doc_source_of_truth_ratio"], "1.000000")
        self.assertEqual(v["config_option_documentation_ratio"], "1.000000")
        self.assertEqual(v["endpoint_worked_example_ratio"], "1.000000")
        self.assertEqual(v["decision_record_cross_link_ratio"], "1.000000")

    def test_readme_quickstart_missing_fails_section1(self):
        m = copy.deepcopy(COMPLETE)
        m["readme"]["quickstart_present"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "TECHNICAL_DOCUMENTATION_NOT_SOUND")
        self.assertEqual(v["sections"]["readme_and_doc_set_structure"], "fail")
        self.assertEqual(check_status(
            v, "technical_documentation_readme_quickstart_present"), "fail")

    def test_duplicate_doc_id_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["documents"][1]["doc_id"] = "doc-readme"
        v = evaluate(m)
        self.assertEqual(check_status(
            v, "every_technical_documentation_doc_id_unique"), "fail")
        self.assertEqual(v["duplicate_technical_documentation_doc_ids"],
                         ["doc-readme"])

    def test_invalid_doc_kind_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["documents"][0]["doc_kind"] = "blog_post"
        v = evaluate(m)
        self.assertEqual(check_status(
            v, "every_technical_documentation_doc_kind_recognised"), "fail")
        self.assertEqual(v["technical_documentation_docs_with_invalid_kind"],
                         ["doc-readme"])

    def test_doc_without_source_of_truth_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["documents"][1]["source_of_truth"] = ""
        v = evaluate(m)
        self.assertEqual(check_status(
            v, "every_technical_documentation_doc_source_of_truth_declared"),
            "fail")
        self.assertEqual(
            v["technical_documentation_docs_without_source_of_truth"],
            ["doc-api"])
        self.assertEqual(v["doc_source_of_truth_ratio"], "0.666667")

    def test_absent_documents_list_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["documents"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(check_status(
            v, "technical_documentation_doc_set_list_declared"), "missing")
        self.assertIsNone(v["documentation_set_docs_count"])
        self.assertIsNone(v["computed_status"])

    def test_empty_config_options_list_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["config_options"] = []
        v = evaluate(m)
        self.assertEqual(check_status(
            v, "technical_documentation_config_options_list_declared"), "fail")
        self.assertEqual(v["documentation_config_options_count"], 0)

    def test_config_option_without_default_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["config_options"][0]["default_value"] = ""
        v = evaluate(m)
        self.assertEqual(check_status(
            v, "every_technical_documentation_config_option_default_declared"),
            "fail")
        self.assertEqual(
            v["technical_documentation_config_options_without_default"],
            ["opt-port"])
        self.assertEqual(v["config_option_documentation_ratio"], "0.500000")

    def test_config_option_not_documented_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["config_options"][1]["documented"] = False
        v = evaluate(m)
        self.assertEqual(check_status(
            v, "every_technical_documentation_config_option_documented"),
            "fail")
        self.assertEqual(
            v["technical_documentation_config_options_not_documented"],
            ["opt-mode"])

    def test_endpoint_unknown_doc_reference_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["endpoints"][0]["documented_in_doc_id"] = "doc-99"
        v = evaluate(m)
        self.assertEqual(check_status(
            v,
            "every_technical_documentation_endpoint_documented_in_declared_doc"),
            "fail")
        self.assertEqual(
            v["technical_documentation_endpoints_with_unknown_doc_reference"],
            ["ep-get-status"])

    def test_endpoint_without_example_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["endpoints"][1]["has_working_example"] = False
        v = evaluate(m)
        self.assertEqual(check_status(
            v,
            "every_technical_documentation_endpoint_working_example_declared"),
            "fail")
        self.assertEqual(
            v["technical_documentation_endpoints_without_working_example"],
            ["ep-post-job"])
        self.assertEqual(v["endpoint_worked_example_ratio"], "0.500000")

    def test_endpoint_unverified_example_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["endpoints"][0]["example_verified_against_contract"] = False
        self.assertEqual(check_status(
            evaluate(m),
            "every_technical_documentation_endpoint_example_verified_against_contract"),
            "fail")

    def test_adr_not_cross_linked_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["decision_records"][0]["cross_linked_from_code"] = False
        v = evaluate(m)
        self.assertEqual(check_status(
            v,
            "every_technical_documentation_decision_record_cross_linked_from_code"),
            "fail")
        self.assertEqual(
            v["technical_documentation_decision_records_not_cross_linked"],
            ["adr-1"])
        self.assertEqual(v["decision_record_cross_link_ratio"], "0.000000")

    def test_adr_unknown_doc_reference_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["decision_records"][0]["documented_in_doc_id"] = "doc-99"
        v = evaluate(m)
        self.assertEqual(check_status(
            v,
            "every_technical_documentation_decision_record_documented_in_declared_doc"),
            "fail")
        self.assertEqual(
            v["technical_documentation_decision_records_with_unknown_doc_reference"],
            ["adr-1"])

    def test_endpoint_missing_doc_reference_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["endpoints"][0]["documented_in_doc_id"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(check_status(
            v,
            "every_technical_documentation_endpoint_documented_in_declared_doc"),
            "missing")

    def test_quickstart_not_working_fails_section5(self):
        m = copy.deepcopy(COMPLETE)
        m["review_verification"]["quickstart_works_verbatim_from_clean_state"] = False
        v = evaluate(m)
        self.assertEqual(v["sections"]["review_verification_and_testing"],
                         "fail")

    def test_stale_screenshots_fail_gated(self):
        m = copy.deepcopy(COMPLETE)
        m["review_verification"]["screenshots_and_commands_verified_current"] = False
        self.assertEqual(check_status(
            evaluate(m),
            "technical_documentation_screenshots_and_commands_current_where_present"),
            "fail")

    def test_no_screenshots_passes_gated_as_na(self):
        m = copy.deepcopy(COMPLETE)
        m["review_verification"]["screenshots_or_commands_present"] = False
        m["review_verification"]["screenshots_and_commands_verified_current"] = False
        v = evaluate(m)
        self.assertEqual(check_status(
            v,
            "technical_documentation_screenshots_and_commands_current_where_present"),
            "pass")
        self.assertEqual(v["verdict"], "TECHNICAL_DOCUMENTATION_SOUND")

    def test_jargon_not_defined_fails_section6(self):
        m = copy.deepcopy(COMPLETE)
        m["plain_language"]["jargon_defined_on_first_use"] = False
        self.assertEqual(evaluate(m)["sections"]["plain_language_and_examples"],
                         "fail")

    def test_version_mismatch_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["versioning"]["doc_set_version"] = "2.3.0"
        v = evaluate(m)
        self.assertEqual(check_status(
            v, "technical_documentation_doc_set_version_matches_product_version"),
            "fail")
        self.assertEqual(v["computed_status"],
                         "outside_stated_limits_on_declared_evidence")

    def test_absent_product_version_is_missing_for_match(self):
        m = copy.deepcopy(COMPLETE)
        del m["product_version"]
        v = evaluate(m)
        self.assertEqual(check_status(
            v, "technical_documentation_doc_set_version_matches_product_version"),
            "missing")
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")

    def test_retrofitted_changelog_fails_section7(self):
        m = copy.deepcopy(COMPLETE)
        m["changelog"]["not_retrofitted_at_release_time"] = False
        self.assertEqual(evaluate(m)["sections"]["changelog_and_versioning"],
                         "fail")

    def test_private_data_in_docs_fails_red_lines(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"]["private_contact_or_financial_data_published_in_docs_present"] = True
        v = evaluate(m)
        self.assertEqual(v["sections"]["red_lines"], "fail")
        self.assertEqual(v["verdict"], "TECHNICAL_DOCUMENTATION_NOT_SOUND")

    def test_silent_todo_fails_red_lines(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"]["silent_todo_document_present"] = True
        self.assertEqual(check_status(
            evaluate(m), "technical_documentation_free_of_silent_todo_document"),
            "fail")

    def test_absent_evidence_is_insufficient_not_failed(self):
        m = copy.deepcopy(COMPLETE)
        del m["plain_language"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["plain_language_and_examples"],
                         "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertTrue(all(c["status"] == "missing" for c in v["checks"]))
        self.assertIsNone(v["computed_status"])
        self.assertIsNone(v["documentation_set_docs_count"])
        self.assertIsNone(v["doc_source_of_truth_ratio"])

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertIn("VERDICT: TECHNICAL_DOCUMENTATION_SOUND", stamp(v))

    def test_non_object_manifest_rejected(self):
        with self.assertRaises(TypeError):
            evaluate(["not", "a", "manifest"])


class MalformedTypeTests(unittest.TestCase):
    def test_string_field_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["product_name"] = 12345
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("product_name", str(ctx.exception))

    def test_object_section_as_string_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"readme": "should-be-an-object"})
        self.assertIn("readme", str(ctx.exception))

    def test_list_field_as_object_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"documents": {"doc_id": "doc-1"}})
        self.assertIn("documents", str(ctx.exception))

    def test_list_entry_as_string_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"endpoints": ["ep-1"]})
        self.assertIn("endpoints[0]", str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["plain_language"]["short_sentences_used"] = "yes"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("plain_language.short_sentences_used",
                      str(ctx.exception))

    def test_nested_list_entry_bool_field_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["config_options"][0]["documented"] = "true"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("config_options[0].documented", str(ctx.exception))

    def test_version_string_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["versioning"]["doc_set_version"] = 240
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("versioning.doc_set_version", str(ctx.exception))

    def test_null_section_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["changelog"] = None
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("changelog", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
