import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from long_form_authoring_pipeline import evaluate, stamp  # noqa: E402

COMPLETE = {
    "work": "example-book",
    "outline": {"toc_approved_before_drafting": True,
                "chapters_or_modules_defined": True,
                "scope_fences_defined": True},
    "units": [
        {"name": "ch-1", "point_or_outcome": "reader can frame the problem",
         "has_single_point": True},
        {"name": "ch-2", "point_or_outcome": "reader can run the method",
         "has_single_point": True},
        {"name": "ch-3", "point_or_outcome": "reader can check results",
         "has_single_point": True},
    ],
    "drafting": {"small_units_used": True,
                 "examples_before_abstractions": True,
                 "style_sheet_maintained": True,
                 "glossary_maintained": True},
    "review": {"comments_triaged_not_blind_applied": True},
    "review_passes": [
        {"name": "pass-structure", "pass_type": "structure",
         "recorded": True},
        {"name": "pass-technical", "pass_type": "technical_accuracy",
         "recorded": True},
        {"name": "pass-style", "pass_type": "style_read_aloud",
         "recorded": True},
        {"name": "pass-facts", "pass_type": "facts_attribution",
         "recorded": True},
    ],
    "versioning": {"sources_in_git_markdown": True,
                   "research_kept_separate_from_prose": True,
                   "editions_tagged": True,
                   "changelog_per_edition": True},
    "builds": {"deterministic_pipeline": True,
               "templates_pinned": True,
               "preview_builds_for_reviewers": True,
               "artifacts_hashed": True,
               "artifacts_signed": True},
    "publishing": {"distribution_channels_defined": True,
                   "metadata_or_platform_setup_complete": True,
                   "launch_checklist_completed": True,
                   "sample_and_errata_pages_published": True},
    "feedback": {"reader_learner_feedback_collected": True,
                 "corrections_list_maintained": True,
                 "corrections_feed_next_edition": True,
                 "errata_visible": True,
                 "drop_off_analytics_reviewed": True},
    "red_lines": {"published_without_accuracy_pass_present": False,
                  "silent_edition_edits_present": False,
                  "unverified_quotes_or_attributions_present": False},
}


def check_status(v, name):
    return next(c["status"] for c in v["checks"] if c["check"] == name)


class VerdictTests(unittest.TestCase):
    def test_complete_manifest_is_sound(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(v["verdict"], "AUTHORING_PIPELINE_SOUND")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(len(v["checks"]), 36)
        self.assertEqual(v["computed_status"],
                         "within_stated_limits_on_declared_evidence")
        self.assertEqual(v["units_count"], 3)
        self.assertEqual(v["units_without_single_point"], [])
        self.assertEqual(v["single_point_coverage"], "1.000000")
        self.assertEqual(v["units_without_point_or_outcome"], [])
        self.assertEqual(v["point_or_outcome_coverage"], "1.000000")
        self.assertEqual(v["review_passes_count"], 4)
        self.assertEqual(v["review_passes_without_record"], [])
        self.assertEqual(v["recorded_review_pass_coverage"], "1.000000")
        self.assertEqual(v["review_passes_with_invalid_type"], [])
        self.assertEqual(v["valid_review_pass_type_coverage"], "1.000000")
        self.assertEqual(v["missing_review_pass_types"], [])

    def test_unapproved_outline_fails_outline_section(self):
        m = copy.deepcopy(COMPLETE)
        m["outline"]["toc_approved_before_drafting"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "AUTHORING_PIPELINE_NOT_SOUND")
        self.assertEqual(v["sections"]["outline_as_contract"], "fail")
        self.assertEqual(
            check_status(v, "toc_approved_before_drafting"), "fail")

    def test_no_scope_fences_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["outline"]["scope_fences_defined"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "AUTHORING_PIPELINE_NOT_SOUND")

    def test_unit_without_single_point_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["units"][0]["has_single_point"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_unit_has_single_point"), "fail")
        self.assertEqual(v["units_without_single_point"], ["ch-1"])
        self.assertEqual(v["single_point_coverage"], "0.666667")
        self.assertEqual(v["computed_status"],
                         "outside_stated_limits_on_declared_evidence")

    def test_unit_missing_single_point_field_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["units"][0]["has_single_point"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "every_unit_has_single_point"), "missing")
        self.assertEqual(v["units_without_single_point"], [])

    def test_unit_with_empty_outcome_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["units"][1]["point_or_outcome"] = ""
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_unit_point_or_outcome_declared"),
            "fail")
        self.assertEqual(v["units_without_point_or_outcome"], ["ch-2"])
        self.assertEqual(v["point_or_outcome_coverage"], "0.666667")

    def test_unit_missing_outcome_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["units"][1]["point_or_outcome"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "every_unit_point_or_outcome_declared"),
            "missing")
        self.assertEqual(v["units_without_point_or_outcome"], [])

    def test_empty_units_list_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["units"] = []
        v = evaluate(m)
        self.assertEqual(check_status(v, "units_declared"), "fail")
        self.assertEqual(v["units_count"], 0)
        self.assertIsNone(v["single_point_coverage"])
        self.assertIsNone(v["point_or_outcome_coverage"])
        self.assertEqual(v["units_without_single_point"], [])

    def test_no_style_sheet_fails_drafting_section(self):
        m = copy.deepcopy(COMPLETE)
        m["drafting"]["style_sheet_maintained"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "AUTHORING_PIPELINE_NOT_SOUND")
        self.assertEqual(v["sections"]["drafting_loop"], "fail")

    def test_blind_applied_comments_fail_review_section(self):
        m = copy.deepcopy(COMPLETE)
        m["review"]["comments_triaged_not_blind_applied"] = False
        v = evaluate(m)
        self.assertEqual(v["sections"]["review_passes"], "fail")

    def test_unrecorded_pass_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["review_passes"][1]["recorded"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_review_pass_recorded"), "fail")
        self.assertEqual(v["review_passes_without_record"],
                         ["pass-technical"])
        self.assertEqual(v["recorded_review_pass_coverage"], "0.750000")

    def test_pass_missing_recorded_field_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["review_passes"][1]["recorded"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "every_review_pass_recorded"), "missing")
        self.assertEqual(v["review_passes_without_record"], [])

    def test_pass_with_invalid_type_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["review_passes"][2]["pass_type"] = "copyedit"
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_review_pass_type_valid"), "fail")
        self.assertEqual(v["review_passes_with_invalid_type"],
                         ["pass-style"])
        self.assertEqual(v["valid_review_pass_type_coverage"], "0.750000")
        self.assertEqual(v["missing_review_pass_types"],
                         ["style_read_aloud"])

    def test_missing_required_pass_type_fails(self):
        m = copy.deepcopy(COMPLETE)
        del m["review_passes"][3]
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "all_required_review_pass_types_present"),
            "fail")
        self.assertEqual(v["missing_review_pass_types"],
                         ["facts_attribution"])
        self.assertEqual(v["review_passes_count"], 3)

    def test_pass_missing_type_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["review_passes"][0]["pass_type"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "every_review_pass_type_valid"), "missing")
        self.assertEqual(
            check_status(v, "all_required_review_pass_types_present"),
            "missing")
        self.assertEqual(v["review_passes_with_invalid_type"], [])

    def test_empty_review_passes_list_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["review_passes"] = []
        v = evaluate(m)
        self.assertEqual(check_status(v, "review_passes_declared"), "fail")
        self.assertEqual(v["review_passes_count"], 0)
        self.assertIsNone(v["recorded_review_pass_coverage"])
        self.assertIsNone(v["valid_review_pass_type_coverage"])
        self.assertEqual(v["missing_review_pass_types"],
                         ["structure", "technical_accuracy",
                          "style_read_aloud", "facts_attribution"])

    def test_research_mixed_with_prose_fails_versioning(self):
        m = copy.deepcopy(COMPLETE)
        m["versioning"]["research_kept_separate_from_prose"] = False
        v = evaluate(m)
        self.assertEqual(v["sections"]["versioning_and_builds"], "fail")

    def test_unsigned_artifacts_fail_builds(self):
        m = copy.deepcopy(COMPLETE)
        m["builds"]["artifacts_signed"] = False
        v = evaluate(m)
        self.assertEqual(check_status(v, "artifacts_signed"), "fail")
        self.assertEqual(v["sections"]["versioning_and_builds"], "fail")

    def test_no_changelog_fails_versioning(self):
        m = copy.deepcopy(COMPLETE)
        m["versioning"]["changelog_per_edition"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "AUTHORING_PIPELINE_NOT_SOUND")

    def test_incomplete_metadata_fails_publishing(self):
        m = copy.deepcopy(COMPLETE)
        m["publishing"]["metadata_or_platform_setup_complete"] = False
        v = evaluate(m)
        self.assertEqual(v["sections"]["publishing"], "fail")

    def test_no_errata_pages_fails_publishing(self):
        m = copy.deepcopy(COMPLETE)
        m["publishing"]["sample_and_errata_pages_published"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "AUTHORING_PIPELINE_NOT_SOUND")

    def test_hidden_errata_fails_feedback_section(self):
        m = copy.deepcopy(COMPLETE)
        m["feedback"]["errata_visible"] = False
        v = evaluate(m)
        self.assertEqual(
            v["sections"]["feedback_loop_and_red_lines"], "fail")

    def test_publishing_without_accuracy_pass_fails_red_line(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"]["published_without_accuracy_pass_present"] = True
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "no_publishing_without_accuracy_pass"),
            "fail")
        self.assertEqual(
            v["sections"]["feedback_loop_and_red_lines"], "fail")

    def test_silent_edition_edits_fail_red_line(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"]["silent_edition_edits_present"] = True
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "no_silent_edition_edits"), "fail")
        self.assertEqual(v["verdict"], "AUTHORING_PIPELINE_NOT_SOUND")

    def test_unverified_quotes_fail_red_line(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"]["unverified_quotes_or_attributions_present"] = True
        self.assertEqual(
            check_status(evaluate(m),
                         "no_unverified_quotes_or_attributions"), "fail")

    def test_absent_evidence_is_insufficient_not_failed(self):
        m = copy.deepcopy(COMPLETE)
        del m["publishing"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["publishing"],
                         "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertTrue(
            all(c["status"] == "missing" for c in v["checks"]))
        self.assertIsNone(v["computed_status"])
        self.assertIsNone(v["units_count"])
        self.assertIsNone(v["units_without_single_point"])
        self.assertIsNone(v["single_point_coverage"])
        self.assertIsNone(v["units_without_point_or_outcome"])
        self.assertIsNone(v["point_or_outcome_coverage"])
        self.assertIsNone(v["review_passes_count"])
        self.assertIsNone(v["review_passes_without_record"])
        self.assertIsNone(v["recorded_review_pass_coverage"])
        self.assertIsNone(v["review_passes_with_invalid_type"])
        self.assertIsNone(v["valid_review_pass_type_coverage"])
        self.assertIsNone(v["missing_review_pass_types"])

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertIn("VERDICT: AUTHORING_PIPELINE_SOUND", stamp(v))

    def test_non_object_manifest_rejected(self):
        with self.assertRaises(TypeError):
            evaluate(["not", "a", "manifest"])


class MalformedTypeTests(unittest.TestCase):
    def test_string_field_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["work"] = 12345
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("work", str(ctx.exception))

    def test_object_section_as_string_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"outline": "should-be-an-object"})
        self.assertIn("outline", str(ctx.exception))

    def test_list_field_as_object_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"units": {"name": "ch-1"}})
        self.assertIn("units", str(ctx.exception))

    def test_list_entry_as_string_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"units": ["ch-1"]})
        self.assertIn("units[0]", str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["outline"]["toc_approved_before_drafting"] = "yes"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("outline.toc_approved_before_drafting",
                      str(ctx.exception))

    def test_nested_list_entry_string_field_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["units"][0]["name"] = 42
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("units[0].name", str(ctx.exception))

    def test_nested_list_entry_pass_type_as_boolean_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["review_passes"][1]["pass_type"] = True
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("review_passes[1].pass_type", str(ctx.exception))

    def test_null_section_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["feedback"] = None
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("feedback", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
