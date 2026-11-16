import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from difficult_conversation_coaching import evaluate, stamp  # noqa: E402

COMPLETE = {
    "conversation_title": "vendor-escalation-call",
    "preparation_domains": ["self_awareness", "self_management",
                            "social_awareness",
                            "relationship_management"],
    "self_awareness": {"emotion_named": True,
                       "pause_before_reacting_planned": True},
    "self_management": {"firm_not_hot_stance_declared": True,
                        "regulation_approach_declared": True,
                        "venting_in_writing_present": False,
                        "emotion_suppressed_instead_of_regulated_present": False},
    "rehearsal": {"rehearsal_completed": True},
    "empathy": {"counterpart_emotion_considered": True,
                "emotion_separated_from_position": True,
                "acknowledgement_before_redirect_planned": True,
                "strongest_reasonable_version_identified": True},
    "framing": {"facts_led_with": True,
                "specifics_prepared": True,
                "ask_stated_clearly": True,
                "boundary_stated_clearly": True,
                "firm_on_substance_warm_on_tone_declared": True,
                "hostility_mirroring_present": False},
    "structure": {"own_part_owned": True,
                  "other_view_invited": True,
                  "concrete_next_step_proposed": True},
    "feedback": {"feedback_to_be_given": True},
    "feedback_points": [
        {"name": "missed_deadline", "situation_stated": True,
         "behavior_described": True, "impact_stated": True,
         "targets_identity": False},
        {"name": "escalation_tone", "situation_stated": True,
         "behavior_described": True, "impact_stated": True,
         "targets_identity": False},
    ],
    "safeguards": {"do_not_respond_list_checked": True,
                   "target_on_do_not_respond_list": False,
                   "register_appropriate_to_relationship_declared": True},
    "repair": {"thread_has_soured": True,
               "repair_move_planned": True,
               "relationship_and_outcome_protected_over_point_scoring_declared": True,
               "winning_argument_losing_relationship_present": False},
}


def check_status(v, name):
    return next(c["status"] for c in v["checks"] if c["check"] == name)


class VerdictTests(unittest.TestCase):
    def test_complete_manifest_is_complete(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(v["verdict"], "CONVERSATION_PREPARATION_COMPLETE")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(len(v["checks"]), 31)
        self.assertEqual(v["computed_status"],
                         "within_stated_limits_on_declared_evidence")
        self.assertEqual(v["preparation_domains_count"], 4)
        self.assertEqual(v["preparation_domains_missing"], [])
        self.assertEqual(v["preparation_domain_coverage"], "1.0000")
        self.assertEqual(v["feedback_points_count"], 2)
        self.assertEqual(v["feedback_points_without_complete_sbi"], [])
        self.assertEqual(v["feedback_points_targeting_identity"], [])
        self.assertEqual(v["sbi_coverage"], "1.0000")

    def test_emotion_not_named_fails_preparation_section(self):
        m = copy.deepcopy(COMPLETE)
        m["self_awareness"]["emotion_named"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CONVERSATION_PREPARATION_INCOMPLETE")
        self.assertEqual(v["sections"]["preparation_and_self_regulation"],
                         "fail")

    def test_venting_in_writing_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["self_management"]["venting_in_writing_present"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CONVERSATION_PREPARATION_INCOMPLETE")
        self.assertEqual(check_status(v, "no_venting_in_writing"), "fail")

    def test_emotion_suppressed_instead_of_regulated_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["self_management"][
            "emotion_suppressed_instead_of_regulated_present"] = True
        self.assertEqual(evaluate(m)["verdict"],
                         "CONVERSATION_PREPARATION_INCOMPLETE")

    def test_domains_out_of_order_fail_and_are_reported(self):
        m = copy.deepcopy(COMPLETE)
        m["preparation_domains"] = ["self_management", "self_awareness",
                                    "social_awareness",
                                    "relationship_management"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CONVERSATION_PREPARATION_INCOMPLETE")
        self.assertEqual(
            check_status(
                v, "preparation_domains_cover_all_four_in_stated_order"),
            "fail")
        self.assertEqual(v["preparation_domains_missing"], [])
        self.assertEqual(v["preparation_domain_coverage"], "1.0000")
        self.assertEqual(v["computed_status"],
                         "outside_stated_limits_on_declared_evidence")

    def test_domain_missing_from_list_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["preparation_domains"] = ["self_awareness", "self_management",
                                    "relationship_management"]
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v, "preparation_domains_cover_all_four_in_stated_order"),
            "fail")
        self.assertEqual(v["preparation_domains_missing"],
                         ["social_awareness"])
        self.assertEqual(v["preparation_domain_coverage"], "0.7500")

    def test_unknown_domain_entry_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["preparation_domains"] = ["self_awareness", "self_management",
                                    "social_awareness",
                                    "relationship_management", "mind_reading"]
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v, "preparation_domains_cover_all_four_in_stated_order"),
            "fail")

    def test_empty_domains_list_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["preparation_domains"] = []
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "preparation_domains_declared"), "fail")
        self.assertEqual(v["preparation_domains_count"], 0)
        self.assertEqual(v["preparation_domain_coverage"], "0.0000")
        self.assertEqual(v["preparation_domains_missing"],
                         ["self_awareness", "self_management",
                          "social_awareness", "relationship_management"])

    def test_feedback_point_missing_impact_fails_sbi_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["feedback_points"][1]["impact_stated"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CONVERSATION_PREPARATION_INCOMPLETE")
        self.assertEqual(
            check_status(v, "every_feedback_point_sbi_complete"), "fail")
        self.assertEqual(v["feedback_points_without_complete_sbi"],
                         ["escalation_tone"])
        self.assertEqual(v["sbi_coverage"], "0.5000")

    def test_feedback_point_missing_sbi_field_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["feedback_points"][0]["impact_stated"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "every_feedback_point_sbi_complete"),
            "missing")
        self.assertEqual(v["feedback_points_without_complete_sbi"],
                         ["missed_deadline"])

    def test_feedback_point_targeting_identity_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["feedback_points"][0]["targets_identity"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CONVERSATION_PREPARATION_INCOMPLETE")
        self.assertEqual(
            check_status(v, "no_feedback_point_targets_identity"), "fail")
        self.assertEqual(v["feedback_points_targeting_identity"],
                         ["missed_deadline"])

    def test_no_feedback_to_give_passes_feedback_checks_as_na(self):
        m = copy.deepcopy(COMPLETE)
        m["feedback"]["feedback_to_be_given"] = False
        del m["feedback_points"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CONVERSATION_PREPARATION_COMPLETE")
        self.assertEqual(
            check_status(
                v, "feedback_points_declared_when_feedback_to_be_given"),
            "pass")
        self.assertEqual(
            check_status(v, "every_feedback_point_sbi_complete"), "pass")
        self.assertIsNone(v["feedback_points_count"])
        self.assertIsNone(v["sbi_coverage"])

    def test_feedback_gate_missing_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["feedback"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "every_feedback_point_sbi_complete"),
            "missing")

    def test_hostility_mirroring_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["framing"]["hostility_mirroring_present"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CONVERSATION_PREPARATION_INCOMPLETE")
        self.assertEqual(v["sections"]["framing_and_assertiveness"], "fail")

    def test_own_part_not_owned_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["structure"]["own_part_owned"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "CONVERSATION_PREPARATION_INCOMPLETE")

    def test_no_concrete_next_step_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["structure"]["concrete_next_step_proposed"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "CONVERSATION_PREPARATION_INCOMPLETE")

    def test_target_on_do_not_respond_list_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["safeguards"]["target_on_do_not_respond_list"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CONVERSATION_PREPARATION_INCOMPLETE")
        self.assertEqual(v["sections"]["safeguards_repair_and_close"],
                         "fail")

    def test_repair_move_missing_when_thread_soured(self):
        m = copy.deepcopy(COMPLETE)
        del m["repair"]["repair_move_planned"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "repair_move_planned_when_thread_soured"),
            "missing")

    def test_repair_move_not_planned_when_thread_soured_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["repair"]["repair_move_planned"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CONVERSATION_PREPARATION_INCOMPLETE")
        self.assertEqual(
            check_status(v, "repair_move_planned_when_thread_soured"),
            "fail")

    def test_no_soured_thread_passes_repair_check_as_na(self):
        m = copy.deepcopy(COMPLETE)
        m["repair"]["thread_has_soured"] = False
        del m["repair"]["repair_move_planned"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CONVERSATION_PREPARATION_COMPLETE")
        self.assertEqual(
            check_status(v, "repair_move_planned_when_thread_soured"),
            "pass")

    def test_winning_argument_losing_relationship_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["repair"]["winning_argument_losing_relationship_present"] = True
        self.assertEqual(evaluate(m)["verdict"],
                         "CONVERSATION_PREPARATION_INCOMPLETE")

    def test_absent_evidence_is_insufficient_not_failed(self):
        m = copy.deepcopy(COMPLETE)
        del m["empathy"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["empathy_and_social_awareness"],
                         "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertTrue(
            all(c["status"] == "missing" for c in v["checks"]))
        self.assertIsNone(v["computed_status"])
        self.assertIsNone(v["preparation_domains_count"])
        self.assertIsNone(v["preparation_domains_missing"])
        self.assertIsNone(v["preparation_domain_coverage"])
        self.assertIsNone(v["feedback_points_without_complete_sbi"])
        self.assertIsNone(v["sbi_coverage"])

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertIn("VERDICT: CONVERSATION_PREPARATION_COMPLETE",
                      stamp(v))

    def test_non_object_manifest_rejected(self):
        with self.assertRaises(TypeError):
            evaluate(["not", "a", "manifest"])


class MalformedTypeTests(unittest.TestCase):
    """F1 regression: a documented field present with the wrong
    JSON type is rejected with ValueError naming the field."""

    def test_string_field_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["conversation_title"] = 12345
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("conversation_title", str(ctx.exception))

    def test_object_section_as_string_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"empathy": "should-be-an-object"})
        self.assertIn("empathy", str(ctx.exception))

    def test_list_field_as_object_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"feedback_points": {"name": "x"}})
        self.assertIn("feedback_points", str(ctx.exception))

    def test_list_entry_as_string_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"feedback_points": ["missed_deadline"]})
        self.assertIn("feedback_points[0]", str(ctx.exception))

    def test_domains_list_entry_as_number_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"preparation_domains": [42]})
        self.assertIn("preparation_domains[0]", str(ctx.exception))

    def test_domains_as_string_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"preparation_domains": "self_awareness"})
        self.assertIn("preparation_domains", str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["self_awareness"]["emotion_named"] = "yes"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("self_awareness.emotion_named", str(ctx.exception))

    def test_nested_list_entry_string_field_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["feedback_points"][1]["name"] = 42
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("feedback_points[1].name", str(ctx.exception))

    def test_nested_list_entry_boolean_field_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["feedback_points"][0]["targets_identity"] = "no"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("feedback_points[0].targets_identity",
                      str(ctx.exception))

    def test_null_section_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["repair"] = None
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("repair", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
