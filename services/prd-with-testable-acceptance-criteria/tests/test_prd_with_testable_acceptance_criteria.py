import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from prd_with_testable_acceptance_criteria import evaluate, stamp  # noqa: E402

COMPLETE = {
    "product": "vault-mobile",
    "problem": {"statement_declared": True,
                "who_has_it_declared": True,
                "why_now_declared": True,
                "problem_first_before_solution_declared": True,
                "statement_sentence_count": 4},
    "outcome": {"observable_change_defined": True,
                "outcome_is_behavior_or_metric_not_feature_only": True},
    "stories": [
        {"id": "S1", "role": "vault owner",
         "capability": "scan a document into the vault",
         "benefit": "paper records are searchable", "priority": "P0"},
        {"id": "S2", "role": "vault owner",
         "capability": "unlock the vault with biometrics",
         "benefit": "access is fast without a password",
         "priority": "P0"},
        {"id": "S3", "role": "family member",
         "capability": "receive a sync alert",
         "benefit": "shared records stay current", "priority": "P1"},
    ],
    "acceptance_criteria": [
        {"id": "AC1", "story_id": "S1", "testable_declared": True,
         "binary_declared": True},
        {"id": "AC2", "story_id": "S1", "testable_declared": True,
         "binary_declared": True},
        {"id": "AC3", "story_id": "S2", "testable_declared": True,
         "binary_declared": True},
        {"id": "AC4", "story_id": "S3", "testable_declared": True,
         "binary_declared": True},
    ],
    "out_of_scope_items": ["video editing", "desktop client"],
    "scope": {"explicit_out_of_scope_list_declared": True,
              "explicit_scope_boundaries_declared": True,
              "deferrals_placed_in_later_list": True,
              "deferrals_not_silently_inside_scope": True},
    "priorities": {"priority_scheme_p0_p1_p2_applied": True,
                   "priority_tiers_applied_in_shipping_order": True,
                   "p0_items_shippable_alone_declared": True,
                   "priority_conflicts_resolved_with_decision_owner": True},
    "decisions": {"decision_owner_named": True,
                  "key_decisions_logged_in_prd": True},
    "open_questions": [
        {"id": "Q1", "architecture_changing": True,
         "blocks_build": True},
        {"id": "Q2", "architecture_changing": False,
         "blocks_build": False},
    ],
    "open_question_tracking": {
        "tracked_explicitly": True,
        "architecture_changing_questions_block_build": True,
        "non_architecture_questions_do_not_block_build": True},
    "approval": {"approved_spec_declared": True},
    "red_lines": {
        "build_started_before_approved_spec_present": False,
        "unlabeled_spike_treated_as_approved_spec_present": False,
        "scope_widened_mid_phase_without_prd_update_and_reapproval_present": False},
}


def check_status(v, name):
    return next(c["status"] for c in v["checks"] if c["check"] == name)


class VerdictTests(unittest.TestCase):
    def test_complete_manifest_is_ready(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(
            v["verdict"], "PRD_WITH_TESTABLE_ACCEPTANCE_CRITERIA_READY")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(len(v["checks"]), 38)
        self.assertEqual(v["computed_status"],
                         "within_stated_limits_on_declared_evidence")
        self.assertEqual(v["problem_statement_sentence_count"], 4)
        self.assertEqual(v["stories_count"], 3)
        self.assertEqual(v["acceptance_criteria_count"], 4)
        self.assertEqual(v["p0_story_count"], 2)
        self.assertEqual(v["stories_without_criteria"], [])
        self.assertEqual(v["criteria_without_declared_story"], [])
        self.assertEqual(v["duplicate_story_ids"], [])
        self.assertEqual(v["duplicate_criterion_ids"], [])
        self.assertEqual(v["story_criteria_coverage"], "1.000000")
        self.assertEqual(v["testable_criteria_coverage"], "1.000000")
        self.assertEqual(v["binary_criteria_coverage"], "1.000000")
        self.assertEqual(v["out_of_scope_items_count"], 2)
        self.assertEqual(v["misc_bucket_items"], [])
        self.assertEqual(v["open_questions_count"], 2)
        self.assertEqual(
            v["architecture_changing_open_questions_count"], 1)
        self.assertEqual(v["blocking_open_questions_count"], 1)

    def test_empty_open_questions_list_is_a_valid_declaration(self):
        m = copy.deepcopy(COMPLETE)
        m["open_questions"] = []
        v = evaluate(m)
        self.assertEqual(
            v["verdict"], "PRD_WITH_TESTABLE_ACCEPTANCE_CRITERIA_READY")
        self.assertEqual(v["open_questions_count"], 0)
        self.assertEqual(
            v["architecture_changing_open_questions_count"], 0)
        self.assertEqual(v["blocking_open_questions_count"], 0)
        self.assertEqual(check_status(v, "open_questions_declared"),
                         "pass")
        self.assertEqual(
            check_status(
                v,
                "every_open_question_block_flag_matches_architecture_impact"),
            "pass")

    def test_problem_over_five_sentences_fails_section1(self):
        m = copy.deepcopy(COMPLETE)
        m["problem"]["statement_sentence_count"] = 6
        v = evaluate(m)
        self.assertEqual(
            v["verdict"],
            "PRD_WITH_TESTABLE_ACCEPTANCE_CRITERIA_NOT_READY")
        self.assertEqual(v["sections"]["problem_and_outcome"], "fail")
        self.assertEqual(
            check_status(v, "problem_statement_within_five_sentences"),
            "fail")

    def test_problem_at_exactly_five_sentences_passes(self):
        m = copy.deepcopy(COMPLETE)
        m["problem"]["statement_sentence_count"] = 5
        self.assertEqual(
            check_status(
                evaluate(m), "problem_statement_within_five_sentences"),
            "pass")

    def test_problem_sentence_count_absent_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["problem"]["statement_sentence_count"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "problem_statement_within_five_sentences"),
            "missing")
        self.assertIsNone(v["problem_statement_sentence_count"])

    def test_outcome_as_feature_only_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["outcome"][
            "outcome_is_behavior_or_metric_not_feature_only"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "PRD_WITH_TESTABLE_ACCEPTANCE_CRITERIA_NOT_READY")

    def test_story_missing_benefit_fails_and_is_a_form_failure(self):
        m = copy.deepcopy(COMPLETE)
        m["stories"][0]["benefit"] = ""
        v = evaluate(m)
        self.assertEqual(
            v["verdict"],
            "PRD_WITH_TESTABLE_ACCEPTANCE_CRITERIA_NOT_READY")
        self.assertEqual(
            check_status(
                v,
                "every_prd_story_states_role_capability_and_benefit"),
            "fail")

    def test_story_missing_role_field_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["stories"][1]["role"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(
                v,
                "every_prd_story_states_role_capability_and_benefit"),
            "missing")

    def test_duplicate_story_id_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["stories"][2]["id"] = "S1"
        m["acceptance_criteria"][3]["story_id"] = "S1"
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_prd_story_id_unique_and_nonempty"),
            "fail")
        self.assertEqual(v["duplicate_story_ids"], ["S1"])

    def test_story_priority_outside_p0_p1_p2_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["stories"][2]["priority"] = "P9"
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_prd_story_priority_is_p0_p1_or_p2"),
            "fail")

    def test_story_without_criteria_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        del m["acceptance_criteria"][3]
        v = evaluate(m)
        self.assertEqual(
            v["verdict"],
            "PRD_WITH_TESTABLE_ACCEPTANCE_CRITERIA_NOT_READY")
        self.assertEqual(
            check_status(v, "every_story_has_acceptance_criteria"),
            "fail")
        self.assertEqual(v["stories_without_criteria"], ["S3"])
        self.assertEqual(v["story_criteria_coverage"], "0.666667")
        self.assertEqual(v["computed_status"],
                         "outside_stated_limits_on_declared_evidence")

    def test_criterion_tracing_to_undeclared_story_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["acceptance_criteria"][3]["story_id"] = "S99"
        m["acceptance_criteria"].append(
            {"id": "AC5", "story_id": "S3", "testable_declared": True,
             "binary_declared": True})
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v,
                "every_acceptance_criterion_traces_to_declared_story"),
            "fail")
        self.assertEqual(v["criteria_without_declared_story"], ["AC4"])

    def test_criterion_missing_story_id_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["acceptance_criteria"][0]["story_id"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(
                v,
                "every_acceptance_criterion_traces_to_declared_story"),
            "missing")
        self.assertEqual(v["criteria_without_declared_story"], [])

    def test_untestable_criterion_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["acceptance_criteria"][1]["testable_declared"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v, "every_acceptance_criterion_declared_testable"),
            "fail")
        self.assertEqual(v["testable_criteria_coverage"], "0.750000")

    def test_non_binary_criterion_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["acceptance_criteria"][2]["binary_declared"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v, "every_acceptance_criterion_declared_binary"),
            "fail")
        self.assertEqual(v["binary_criteria_coverage"], "0.750000")

    def test_duplicate_criterion_id_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["acceptance_criteria"][3]["id"] = "AC1"
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v,
                "every_acceptance_criterion_id_unique_and_nonempty"),
            "fail")
        self.assertEqual(v["duplicate_criterion_ids"], ["AC1"])

    def test_absent_stories_list_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["stories"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(check_status(v, "prd_stories_declared"),
                         "missing")
        self.assertIsNone(v["computed_status"])
        self.assertIsNone(v["stories_count"])
        self.assertIsNone(v["p0_story_count"])
        self.assertIsNone(v["stories_without_criteria"])
        self.assertIsNone(v["criteria_without_declared_story"])
        self.assertIsNone(v["duplicate_story_ids"])
        self.assertIsNone(v["story_criteria_coverage"])

    def test_empty_stories_list_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["stories"] = []
        v = evaluate(m)
        self.assertEqual(
            v["verdict"],
            "PRD_WITH_TESTABLE_ACCEPTANCE_CRITERIA_NOT_READY")
        self.assertEqual(check_status(v, "prd_stories_declared"),
                         "fail")
        self.assertEqual(v["stories_count"], 0)

    def test_misc_bucket_in_out_of_scope_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["out_of_scope_items"] = ["video editing", "Misc"]
        v = evaluate(m)
        self.assertEqual(v["sections"]["scope_fences"], "fail")
        self.assertEqual(
            check_status(v, "no_misc_bucket_in_out_of_scope_items"),
            "fail")
        self.assertEqual(v["misc_bucket_items"], ["Misc"])

    def test_deferrals_silently_inside_scope_fails_section3(self):
        m = copy.deepcopy(COMPLETE)
        m["scope"]["deferrals_not_silently_inside_scope"] = False
        v = evaluate(m)
        self.assertEqual(
            v["verdict"],
            "PRD_WITH_TESTABLE_ACCEPTANCE_CRITERIA_NOT_READY")
        self.assertEqual(v["sections"]["scope_fences"], "fail")

    def test_p0_not_shippable_alone_fails_section4(self):
        m = copy.deepcopy(COMPLETE)
        m["priorities"]["p0_items_shippable_alone_declared"] = False
        v = evaluate(m)
        self.assertEqual(
            v["verdict"],
            "PRD_WITH_TESTABLE_ACCEPTANCE_CRITERIA_NOT_READY")
        self.assertEqual(
            v["sections"]["priorities_and_decisions"], "fail")
        self.assertEqual(
            check_status(v, "p0_stories_shippable_alone"), "fail")

    def test_key_decisions_not_recorded_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["decisions"]["key_decisions_logged_in_prd"] = False
        self.assertEqual(
            check_status(evaluate(m), "prd_key_decisions_recorded"),
            "fail")

    def test_non_architecture_question_blocking_build_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["open_questions"][1]["blocks_build"] = True
        v = evaluate(m)
        self.assertEqual(
            v["verdict"],
            "PRD_WITH_TESTABLE_ACCEPTANCE_CRITERIA_NOT_READY")
        self.assertEqual(
            check_status(
                v,
                "every_open_question_block_flag_matches_architecture_impact"),
            "fail")
        self.assertEqual(v["blocking_open_questions_count"], 2)

    def test_architecture_question_not_blocking_build_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["open_questions"][0]["blocks_build"] = False
        self.assertEqual(
            check_status(
                evaluate(m),
                "every_open_question_block_flag_matches_architecture_impact"),
            "fail")

    def test_open_question_missing_block_flag_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["open_questions"][0]["blocks_build"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(
                v,
                "every_open_question_block_flag_matches_architecture_impact"),
            "missing")

    def test_unapproved_spec_fails_section5(self):
        m = copy.deepcopy(COMPLETE)
        m["approval"]["approved_spec_declared"] = False
        v = evaluate(m)
        self.assertEqual(v["sections"]["open_questions_and_approval"],
                         "fail")
        self.assertEqual(
            check_status(v, "spec_approved_for_build"), "fail")

    def test_build_before_approved_spec_fails_red_lines(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"][
            "build_started_before_approved_spec_present"] = True
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "no_build_before_approved_spec"), "fail")
        self.assertEqual(v["sections"]["red_lines"], "fail")

    def test_unlabeled_spike_red_line_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"][
            "unlabeled_spike_treated_as_approved_spec_present"] = True
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "no_unlabeled_spike_as_spec_exception"),
            "fail")
        self.assertEqual(
            v["verdict"],
            "PRD_WITH_TESTABLE_ACCEPTANCE_CRITERIA_NOT_READY")

    def test_scope_widened_without_reapproval_red_line_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"][
            "scope_widened_mid_phase_without_prd_update_and_reapproval_present"] = True
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v,
                "no_scope_widening_without_prd_update_and_reapproval"),
            "fail")

    def test_absent_evidence_is_insufficient_not_failed(self):
        m = copy.deepcopy(COMPLETE)
        del m["scope"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["scope_fences"],
                         "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertTrue(
            all(c["status"] == "missing" for c in v["checks"]))
        self.assertIsNone(v["computed_status"])
        self.assertIsNone(v["problem_statement_sentence_count"])
        self.assertIsNone(v["stories_count"])
        self.assertIsNone(v["acceptance_criteria_count"])
        self.assertIsNone(v["stories_without_criteria"])
        self.assertIsNone(v["story_criteria_coverage"])
        self.assertIsNone(v["testable_criteria_coverage"])
        self.assertIsNone(v["binary_criteria_coverage"])
        self.assertIsNone(v["out_of_scope_items_count"])
        self.assertIsNone(v["misc_bucket_items"])
        self.assertIsNone(v["open_questions_count"])

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertIn(
            "VERDICT: PRD_WITH_TESTABLE_ACCEPTANCE_CRITERIA_READY",
            stamp(v))

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
            evaluate({"problem": "should-be-an-object"})
        self.assertIn("problem", str(ctx.exception))

    def test_list_field_as_object_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"stories": {"id": "S1"}})
        self.assertIn("stories", str(ctx.exception))

    def test_list_entry_as_string_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"stories": ["S1"]})
        self.assertIn("stories[0]", str(ctx.exception))

    def test_number_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["problem"]["statement_sentence_count"] = "four"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("problem.statement_sentence_count",
                      str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["approval"]["approved_spec_declared"] = "yes"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("approval.approved_spec_declared",
                      str(ctx.exception))

    def test_nested_list_entry_string_field_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["stories"][0]["priority"] = 0
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("stories[0].priority", str(ctx.exception))

    def test_nested_list_entry_boolean_field_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["acceptance_criteria"][1]["testable_declared"] = 7
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("acceptance_criteria[1].testable_declared",
                      str(ctx.exception))

    def test_string_list_entry_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["out_of_scope_items"] = [42]
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("out_of_scope_items[0]", str(ctx.exception))

    def test_null_section_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["scope"] = None
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("scope", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
