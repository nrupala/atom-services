import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from code_review_service import evaluate, stamp  # noqa: E402


COMPLETE = {
    "entity": "PR #42 — add export button",
    "pr": {"changed_lines": 250,
           "description_what_present": True,
           "description_why_present": True,
           "description_how_to_test_present": True,
           "spec_or_issue_linked": True,
           "screenshots_included_for_ui_changes": True},
    "checklist": {"covered_items": ["correctness", "security", "tests",
                                    "readability", "docs"],
                  "correctness_edge_cases_checked": True,
                  "security_inputs_secrets_dependencies_checked": True,
                  "tests_coverage_and_determinism_checked": True,
                  "readability_names_and_structure_checked": True},
    "feedback": {"total_comments": 8,
                 "labeled_comments": 8,
                 "labels_use_must_nit_q_scheme": True,
                 "why_explained": True,
                 "proposes_not_dictates": True},
    "resolution": {"total_comments": 8,
                   "answered_comments": 8,
                   "resolved_only_when_addressed": True,
                   "resolved_nits_not_relitigated": True},
    "gates": {"ci_green_before_approval": True,
              "change_nontrivial": True,
              "reviewer_count": 2,
              "reviewer_sign_off_recorded": True,
              "unresolved_comments": 0,
              "behavior_changing": True,
              "docs_and_changelog_updated": True,
              "approver_would_ship": True},
    "red_lines": {"force_push_over_review_without_telling": False,
                  "rubber_stamped": False,
                  "unexplained_blocking": False},
    "merge": {"self_merged_unreviewed": False,
              "emergency_hotfix": False,
              "hotfix_post_review_completed": False},
}


def check_status(v, name):
    return next(c["status"] for c in v["checks"] if c["check"] == name)


class VerdictTests(unittest.TestCase):
    def test_complete_manifest_is_ready(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(v["verdict"], "CODE_REVIEW_READY")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(v["computed_status"],
                         "within_stated_limits_on_declared_evidence")
        self.assertEqual(len(v["checks"]), 29)
        self.assertEqual(v["computed_changed_lines"], "250.000000")
        self.assertEqual(v["changed_lines_over_stated_aim"], "-150.000000")
        self.assertEqual(v["checklist_items_not_covered"], [])
        self.assertEqual(v["labeled_comment_difference"], "0.000000")
        self.assertEqual(v["answered_comment_difference"], "0.000000")
        self.assertEqual(v["computed_reviewer_count"], "2.000000")
        self.assertEqual(v["computed_unresolved_comments"], "0.000000")

    def test_pr_at_exactly_400_lines_passes(self):
        m = copy.deepcopy(COMPLETE)
        m["pr"]["changed_lines"] = 400
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CODE_REVIEW_READY")
        self.assertEqual(v["changed_lines_over_stated_aim"], "0.000000")

    def test_pr_over_400_lines_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["pr"]["changed_lines"] = 850
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CODE_REVIEW_NOT_READY")
        self.assertEqual(v["sections"]["pr_size_and_description"], "fail")
        self.assertEqual(check_status(v, "pr_size_within_stated_aim"),
                         "fail")
        self.assertEqual(v["changed_lines_over_stated_aim"], "450.000000")
        self.assertEqual(v["computed_status"],
                         "outside_stated_limits_on_declared_evidence")

    def test_missing_changed_lines_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["pr"]["changed_lines"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(check_status(v, "pr_size_within_stated_aim"),
                         "missing")
        self.assertIsNone(v["computed_changed_lines"])
        self.assertIsNone(v["computed_status"])

    def test_description_why_missing_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["pr"]["description_why_present"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CODE_REVIEW_NOT_READY")
        self.assertEqual(v["sections"]["pr_size_and_description"], "fail")

    def test_spec_not_linked_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["pr"]["spec_or_issue_linked"] = False
        self.assertEqual(evaluate(m)["verdict"], "CODE_REVIEW_NOT_READY")

    def test_checklist_coverage_missing_one_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["checklist"]["covered_items"] = [
            c for c in m["checklist"]["covered_items"] if c != "security"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CODE_REVIEW_NOT_READY")
        self.assertEqual(v["checklist_items_not_covered"], ["security"])
        self.assertEqual(
            check_status(v, "checklist_items_cover_stated_checklist"),
            "fail")

    def test_checklist_empty_list_fails_not_missing(self):
        m = copy.deepcopy(COMPLETE)
        m["checklist"]["covered_items"] = []
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CODE_REVIEW_NOT_READY")
        self.assertEqual(v["checklist_items_not_covered"],
                         ["correctness", "security", "tests",
                          "readability", "docs"])

    def test_checklist_unknown_entries_do_not_satisfy_coverage(self):
        m = copy.deepcopy(COMPLETE)
        m["checklist"]["covered_items"] = ["style", "performance"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CODE_REVIEW_NOT_READY")
        self.assertEqual(len(v["checklist_items_not_covered"]), 5)

    def test_missing_checklist_list_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["checklist"]["covered_items"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertIsNone(v["checklist_items_not_covered"])

    def test_security_not_checked_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["checklist"]["security_inputs_secrets_dependencies_checked"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CODE_REVIEW_NOT_READY")
        self.assertEqual(v["sections"]["review_checklist"], "fail")

    def test_unlabeled_comments_fail(self):
        m = copy.deepcopy(COMPLETE)
        m["feedback"]["labeled_comments"] = 5
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CODE_REVIEW_NOT_READY")
        self.assertEqual(
            check_status(v, "feedback_comments_all_labeled"), "fail")
        self.assertEqual(v["labeled_comment_difference"], "-3.000000")

    def test_labeled_over_total_also_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["feedback"]["labeled_comments"] = 9
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "feedback_comments_all_labeled"), "fail")
        self.assertEqual(v["labeled_comment_difference"], "1.000000")

    def test_missing_feedback_count_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["feedback"]["labeled_comments"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertIsNone(v["labeled_comment_difference"])

    def test_zero_comments_labeled_passes(self):
        m = copy.deepcopy(COMPLETE)
        m["feedback"]["total_comments"] = 0
        m["feedback"]["labeled_comments"] = 0
        m["resolution"]["total_comments"] = 0
        m["resolution"]["answered_comments"] = 0
        self.assertEqual(evaluate(m)["verdict"], "CODE_REVIEW_READY")

    def test_labels_scheme_not_used_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["feedback"]["labels_use_must_nit_q_scheme"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CODE_REVIEW_NOT_READY")
        self.assertEqual(v["sections"]["feedback_etiquette"], "fail")

    def test_unanswered_comments_fail(self):
        m = copy.deepcopy(COMPLETE)
        m["resolution"]["answered_comments"] = 6
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CODE_REVIEW_NOT_READY")
        self.assertEqual(
            check_status(v, "authors_answer_every_comment"), "fail")
        self.assertEqual(v["answered_comment_difference"], "-2.000000")

    def test_missing_answered_count_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["resolution"]["answered_comments"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertIsNone(v["answered_comment_difference"])

    def test_resolved_before_addressed_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["resolution"]["resolved_only_when_addressed"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CODE_REVIEW_NOT_READY")
        self.assertEqual(v["sections"]["response_and_resolution"], "fail")

    def test_ci_not_green_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["gates"]["ci_green_before_approval"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CODE_REVIEW_NOT_READY")
        self.assertEqual(v["sections"]["approval_gates"], "fail")

    def test_nontrivial_with_no_reviewer_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["gates"]["reviewer_count"] = 0
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CODE_REVIEW_NOT_READY")
        self.assertEqual(
            check_status(
                v, "at_least_one_reviewer_for_nontrivial_change"),
            "fail")

    def test_nontrivial_with_one_reviewer_passes(self):
        m = copy.deepcopy(COMPLETE)
        m["gates"]["reviewer_count"] = 1
        self.assertEqual(evaluate(m)["verdict"], "CODE_REVIEW_READY")

    def test_trivial_with_no_reviewer_passes_reviewer_gate(self):
        m = copy.deepcopy(COMPLETE)
        m["gates"]["change_nontrivial"] = False
        m["gates"]["reviewer_count"] = 0
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CODE_REVIEW_READY")
        self.assertEqual(
            check_status(
                v, "at_least_one_reviewer_for_nontrivial_change"),
            "pass")

    def test_missing_reviewer_gate_input_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["gates"]["reviewer_count"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(
                v, "at_least_one_reviewer_for_nontrivial_change"),
            "missing")
        self.assertIsNone(v["computed_reviewer_count"])

    def test_unresolved_comments_at_approval_fail(self):
        m = copy.deepcopy(COMPLETE)
        m["gates"]["unresolved_comments"] = 3
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CODE_REVIEW_NOT_READY")
        self.assertEqual(
            check_status(v, "no_unresolved_comments_before_approval"),
            "fail")
        self.assertEqual(v["computed_unresolved_comments"], "3.000000")

    def test_behavior_change_without_docs_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["gates"]["docs_and_changelog_updated"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CODE_REVIEW_NOT_READY")
        self.assertEqual(
            check_status(
                v,
                "docs_and_changelog_updated_for_behavior_changing_change"),
            "fail")

    def test_non_behavior_change_without_docs_passes_docs_gate(self):
        m = copy.deepcopy(COMPLETE)
        m["gates"]["behavior_changing"] = False
        m["gates"]["docs_and_changelog_updated"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CODE_REVIEW_READY")
        self.assertEqual(
            check_status(
                v,
                "docs_and_changelog_updated_for_behavior_changing_change"),
            "pass")

    def test_missing_docs_gate_input_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["gates"]["behavior_changing"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(
                v,
                "docs_and_changelog_updated_for_behavior_changing_change"),
            "missing")

    def test_no_sign_off_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["gates"]["reviewer_sign_off_recorded"] = False
        self.assertEqual(evaluate(m)["verdict"], "CODE_REVIEW_NOT_READY")

    def test_force_push_without_telling_fails_red_line(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"]["force_push_over_review_without_telling"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CODE_REVIEW_NOT_READY")
        self.assertEqual(
            v["sections"]["red_lines_and_merge_discipline"], "fail")
        self.assertEqual(
            check_status(
                v, "no_force_push_over_review_without_telling"), "fail")

    def test_rubber_stamping_fails_red_line(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"]["rubber_stamped"] = True
        self.assertEqual(evaluate(m)["verdict"], "CODE_REVIEW_NOT_READY")

    def test_unexplained_blocking_fails_red_line(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"]["unexplained_blocking"] = True
        self.assertEqual(evaluate(m)["verdict"], "CODE_REVIEW_NOT_READY")

    def test_self_merged_unreviewed_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["merge"]["self_merged_unreviewed"] = True
        self.assertEqual(evaluate(m)["verdict"], "CODE_REVIEW_NOT_READY")

    def test_hotfix_without_post_review_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["merge"]["emergency_hotfix"] = True
        m["merge"]["hotfix_post_review_completed"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CODE_REVIEW_NOT_READY")
        self.assertEqual(
            check_status(
                v, "emergency_hotfix_post_reviewed_if_applicable"),
            "fail")

    def test_hotfix_with_post_review_passes(self):
        m = copy.deepcopy(COMPLETE)
        m["merge"]["emergency_hotfix"] = True
        m["merge"]["hotfix_post_review_completed"] = True
        self.assertEqual(evaluate(m)["verdict"], "CODE_REVIEW_READY")

    def test_non_hotfix_without_post_review_passes_hotfix_gate(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(
            check_status(
                v, "emergency_hotfix_post_reviewed_if_applicable"),
            "pass")

    def test_missing_hotfix_gate_input_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["merge"]["emergency_hotfix"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(
                v, "emergency_hotfix_post_reviewed_if_applicable"),
            "missing")

    def test_absent_section_is_insufficient_not_failed(self):
        m = copy.deepcopy(COMPLETE)
        del m["feedback"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["feedback_etiquette"],
                         "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertIsNone(v["computed_status"])
        self.assertIsNone(v["computed_changed_lines"])
        self.assertIsNone(v["checklist_items_not_covered"])
        self.assertIsNone(v["labeled_comment_difference"])
        self.assertIsNone(v["computed_reviewer_count"])

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertIn("VERDICT: CODE_REVIEW_READY", stamp(v))

    def test_non_object_manifest_rejected(self):
        with self.assertRaises(TypeError):
            evaluate(["not", "a", "manifest"])


class MalformedTypeTests(unittest.TestCase):
    """F1 regression (external verification Wave 1): a documented
    field present with the wrong JSON type is rejected with
    ValueError naming the field — never evaluated into a verdict."""

    def test_top_level_string_field_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["entity"] = 12345
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("entity", str(ctx.exception))

    def test_section_as_string_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"pr": "should-be-an-object"})
        self.assertIn("pr", str(ctx.exception))

    def test_list_field_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["checklist"]["covered_items"] = "correctness"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("checklist.covered_items", str(ctx.exception))

    def test_list_entry_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["checklist"]["covered_items"] = ["correctness", 42]
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("checklist.covered_items[1]", str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["gates"]["ci_green_before_approval"] = "yes"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("gates.ci_green_before_approval",
                      str(ctx.exception))

    def test_numeric_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["pr"]["changed_lines"] = "250"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("pr.changed_lines", str(ctx.exception))

    def test_numeric_leaf_as_boolean_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["gates"]["reviewer_count"] = True
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("gates.reviewer_count", str(ctx.exception))

    def test_conditional_boolean_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["gates"]["change_nontrivial"] = 1
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("gates.change_nontrivial", str(ctx.exception))

    def test_null_section_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["gates"] = None
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("gates", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
