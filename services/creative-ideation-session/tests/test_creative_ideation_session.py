import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from creative_ideation_session import evaluate, stamp  # noqa: E402

COMPLETE = {
    "session_title": "Ten fresh angles for a workshop title",
    "brief": {"written": True,
              "goal_or_question_stated": True,
              "constraints_declared": True},
    "preparation": {"scheduled_in_advance": True,
                    "prepared_with_inputs_ready": True},
    "capture": {"capture_system_used": True,
                "all_ideas_captured": True,
                "no_judging_at_capture": True},
    "generation": {"editing_separated_from_generating": True,
                   "small_reps_or_low_start_bar_used": True},
    "divergence": {"diverged_before_converging": True,
                   "methods_used": ["brainstorm", "scamper", "what_if"],
                   "constraints_used_as_prompt": True},
    "idea_pool": {"target_idea_count": 20,
                  "total_ideas_captured": 26,
                  "dedup_performed": True,
                  "duplicates_removed": 6,
                  "unique_ideas_after_dedup": 20,
                  "ideas_clustered_or_grouped": True},
    "selection": {"criteria_written_before_scoring": True,
                  "criteria_applied_to_all_unique_ideas": True,
                  "scoring_only_after_divergence_complete": True},
    "shortlist": {"shortlist_count": 5,
                  "rationale_written": True,
                  "rationale_references_criteria": True},
    "outcome": {"shared_for_feedback": True},
}


def check_status(v, name):
    return next(c["status"] for c in v["checks"] if c["check"] == name)


class VerdictTests(unittest.TestCase):
    def test_complete_manifest_is_session_complete(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(v["verdict"], "SESSION_COMPLETE")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(v["computed_status"],
                         "within_stated_limits_on_declared_evidence")
        self.assertEqual(len(v["checks"]), 24)
        self.assertEqual(v["target_idea_count"], 20)
        self.assertEqual(v["total_ideas_captured"], 26)
        self.assertEqual(v["volume_gap_ideas"], "6.000000")
        self.assertEqual(v["duplicates_removed"], 6)
        self.assertEqual(v["unique_ideas_after_dedup"], 20)
        self.assertEqual(v["dedup_discrepancy_ideas"], "0.000000")
        self.assertEqual(v["shortlist_count"], 5)
        self.assertEqual(v["methods_used_count"], 3)
        self.assertEqual(v["methods_used"],
                         ["brainstorm", "scamper", "what_if"])

    def test_volume_exactly_at_target_passes(self):
        m = copy.deepcopy(COMPLETE)
        m["idea_pool"]["total_ideas_captured"] = 20
        m["idea_pool"]["duplicates_removed"] = 0
        m["idea_pool"]["unique_ideas_after_dedup"] = 20
        v = evaluate(m)
        self.assertEqual(v["verdict"], "SESSION_COMPLETE")
        self.assertEqual(v["volume_gap_ideas"], "0.000000")

    def test_volume_below_declared_target_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["idea_pool"]["total_ideas_captured"] = 12
        m["idea_pool"]["duplicates_removed"] = 2
        m["idea_pool"]["unique_ideas_after_dedup"] = 10
        v = evaluate(m)
        self.assertEqual(v["verdict"], "SESSION_NOT_COMPLETE")
        self.assertEqual(v["sections"]["idea_pool_and_volume"], "fail")
        self.assertEqual(
            check_status(v, "volume_meets_declared_target"), "fail")
        self.assertEqual(v["volume_gap_ideas"], "-8.000000")
        self.assertEqual(v["computed_status"],
                         "outside_stated_limits_on_declared_evidence")

    def test_zero_target_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["idea_pool"]["target_idea_count"] = 0
        v = evaluate(m)
        self.assertEqual(v["verdict"], "SESSION_NOT_COMPLETE")
        self.assertEqual(
            check_status(v, "volume_meets_declared_target"), "fail")

    def test_negative_captured_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["idea_pool"]["total_ideas_captured"] = -1
        self.assertEqual(evaluate(m)["verdict"], "SESSION_NOT_COMPLETE")

    def test_missing_volume_numbers_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["idea_pool"]["total_ideas_captured"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "volume_meets_declared_target"), "missing")
        self.assertEqual(
            check_status(v, "dedup_arithmetic_consistent"), "missing")
        self.assertIsNone(v["computed_status"])
        self.assertEqual(v["target_idea_count"], 20)
        self.assertIsNone(v["total_ideas_captured"])
        self.assertIsNone(v["volume_gap_ideas"])
        self.assertIsNone(v["dedup_discrepancy_ideas"])

    def test_large_target_not_capped_by_invented_threshold(self):
        # The skill states no number for "many" ideas; a large
        # caller-declared target met by the captured count passes
        # on its own terms.
        m = copy.deepcopy(COMPLETE)
        m["idea_pool"]["target_idea_count"] = 200
        m["idea_pool"]["total_ideas_captured"] = 210
        m["idea_pool"]["duplicates_removed"] = 10
        m["idea_pool"]["unique_ideas_after_dedup"] = 200
        self.assertEqual(evaluate(m)["verdict"], "SESSION_COMPLETE")

    def test_dedup_arithmetic_mismatch_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["idea_pool"]["unique_ideas_after_dedup"] = 19
        v = evaluate(m)
        self.assertEqual(v["verdict"], "SESSION_NOT_COMPLETE")
        self.assertEqual(
            check_status(v, "dedup_arithmetic_consistent"), "fail")
        self.assertEqual(v["dedup_discrepancy_ideas"], "-1.000000")

    def test_duplicates_above_total_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["idea_pool"]["duplicates_removed"] = 30
        m["idea_pool"]["unique_ideas_after_dedup"] = -4
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "dedup_arithmetic_consistent"), "fail")

    def test_shortlist_above_unique_pool_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["shortlist"]["shortlist_count"] = 21
        v = evaluate(m)
        self.assertEqual(v["verdict"], "SESSION_NOT_COMPLETE")
        self.assertEqual(v["sections"]["selection_and_convergence"],
                         "fail")
        self.assertEqual(
            check_status(v, "shortlist_within_unique_pool"), "fail")

    def test_shortlist_exactly_unique_pool_passes(self):
        m = copy.deepcopy(COMPLETE)
        m["shortlist"]["shortlist_count"] = 20
        self.assertEqual(evaluate(m)["verdict"], "SESSION_COMPLETE")

    def test_zero_shortlist_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["shortlist"]["shortlist_count"] = 0
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "shortlist_within_unique_pool"), "fail")

    def test_missing_shortlist_count_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["shortlist"]["shortlist_count"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "shortlist_within_unique_pool"), "missing")

    def test_each_stated_method_passes(self):
        for method in ("brainstorm", "scamper", "analogies",
                       "combining_distant_domains", "what_if"):
            m = copy.deepcopy(COMPLETE)
            m["divergence"]["methods_used"] = [method]
            self.assertEqual(evaluate(m)["verdict"], "SESSION_COMPLETE")

    def test_unstated_method_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["divergence"]["methods_used"] = ["brainstorm", "mind_palace"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "SESSION_NOT_COMPLETE")
        self.assertEqual(
            check_status(v, "methods_used_are_stated_methods"), "fail")
        self.assertEqual(v["computed_status"],
                         "outside_stated_limits_on_declared_evidence")

    def test_empty_methods_list_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["divergence"]["methods_used"] = []
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "methods_used_are_stated_methods"), "fail")
        self.assertEqual(v["methods_used_count"], 0)

    def test_missing_methods_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["divergence"]["methods_used"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "methods_used_are_stated_methods"),
            "missing")
        self.assertIsNone(v["methods_used"])
        self.assertIsNone(v["methods_used_count"])

    def test_brief_not_written_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["brief"]["written"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "SESSION_NOT_COMPLETE")
        self.assertEqual(v["sections"]["brief_and_preparation"], "fail")

    def test_constraints_not_declared_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["brief"]["constraints_declared"] = False
        self.assertEqual(evaluate(m)["verdict"], "SESSION_NOT_COMPLETE")

    def test_not_scheduled_waiting_for_inspiration_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["preparation"]["scheduled_in_advance"] = False
        self.assertEqual(evaluate(m)["verdict"], "SESSION_NOT_COMPLETE")

    def test_judging_at_capture_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["capture"]["no_judging_at_capture"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "SESSION_NOT_COMPLETE")
        self.assertEqual(v["sections"]["capture_and_generation"], "fail")

    def test_editing_while_generating_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["generation"]["editing_separated_from_generating"] = False
        self.assertEqual(evaluate(m)["verdict"], "SESSION_NOT_COMPLETE")

    def test_converging_before_diverging_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["divergence"]["diverged_before_converging"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "SESSION_NOT_COMPLETE")
        self.assertEqual(v["sections"]["divergence_and_methods"], "fail")

    def test_dedup_not_performed_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["idea_pool"]["dedup_performed"] = False
        self.assertEqual(evaluate(m)["verdict"], "SESSION_NOT_COMPLETE")

    def test_not_clustered_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["idea_pool"]["ideas_clustered_or_grouped"] = False
        self.assertEqual(evaluate(m)["verdict"], "SESSION_NOT_COMPLETE")

    def test_criteria_written_after_scoring_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["selection"]["criteria_written_before_scoring"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "SESSION_NOT_COMPLETE")
        self.assertEqual(v["sections"]["selection_and_convergence"],
                         "fail")

    def test_criteria_not_applied_to_all_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["selection"]["criteria_applied_to_all_unique_ideas"] = False
        self.assertEqual(evaluate(m)["verdict"], "SESSION_NOT_COMPLETE")

    def test_scoring_before_divergence_complete_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["selection"]["scoring_only_after_divergence_complete"] = False
        self.assertEqual(evaluate(m)["verdict"], "SESSION_NOT_COMPLETE")

    def test_shortlist_rationale_missing_content_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["shortlist"]["rationale_written"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "SESSION_NOT_COMPLETE")
        self.assertEqual(v["sections"]["shortlist_and_ship"], "fail")

    def test_rationale_not_referencing_criteria_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["shortlist"]["rationale_references_criteria"] = False
        self.assertEqual(evaluate(m)["verdict"], "SESSION_NOT_COMPLETE")

    def test_not_shared_for_feedback_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["outcome"]["shared_for_feedback"] = False
        self.assertEqual(evaluate(m)["verdict"], "SESSION_NOT_COMPLETE")

    def test_absent_section_is_insufficient_not_failed(self):
        m = copy.deepcopy(COMPLETE)
        del m["capture"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["capture_and_generation"],
                         "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertIsNone(v["computed_status"])
        self.assertIsNone(v["target_idea_count"])
        self.assertIsNone(v["total_ideas_captured"])
        self.assertIsNone(v["volume_gap_ideas"])
        self.assertIsNone(v["duplicates_removed"])
        self.assertIsNone(v["unique_ideas_after_dedup"])
        self.assertIsNone(v["dedup_discrepancy_ideas"])
        self.assertIsNone(v["shortlist_count"])
        self.assertIsNone(v["methods_used"])
        self.assertIsNone(v["methods_used_count"])
        self.assertIsNone(v["session_title"])

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertIn("VERDICT: SESSION_COMPLETE", stamp(v))

    def test_non_object_manifest_rejected(self):
        with self.assertRaises(TypeError):
            evaluate(["not", "a", "manifest"])


class MalformedTypeTests(unittest.TestCase):
    """F1 regression (external verification Wave 1): a documented
    field present with the wrong JSON type is rejected with
    ValueError naming the field — never evaluated into a verdict."""

    def test_top_level_string_field_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["session_title"] = 12345
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("session_title", str(ctx.exception))

    def test_section_as_string_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"brief": "should-be-an-object"})
        self.assertIn("brief", str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["brief"]["written"] = "yes"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("brief.written", str(ctx.exception))

    def test_boolean_leaf_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["capture"]["no_judging_at_capture"] = 1
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("capture.no_judging_at_capture",
                      str(ctx.exception))

    def test_numeric_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["idea_pool"]["target_idea_count"] = "20 ideas"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("idea_pool.target_idea_count", str(ctx.exception))

    def test_numeric_leaf_as_boolean_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["shortlist"]["shortlist_count"] = True
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("shortlist.shortlist_count", str(ctx.exception))

    def test_methods_list_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["divergence"]["methods_used"] = "brainstorm"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("divergence.methods_used", str(ctx.exception))

    def test_methods_list_entry_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["divergence"]["methods_used"] = ["brainstorm", 42]
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("divergence.methods_used[1]", str(ctx.exception))

    def test_null_section_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["selection"] = None
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("selection", str(ctx.exception))

    def test_null_leaf_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["outcome"]["shared_for_feedback"] = None
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("outcome.shared_for_feedback", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
