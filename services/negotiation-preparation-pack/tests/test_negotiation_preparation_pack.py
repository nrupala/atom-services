import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from negotiation_preparation_pack import evaluate, stamp  # noqa: E402

COMPLETE = {
    "negotiation": "vendor-escalation-renewal",
    "batna_and_reservation": {"batna_identified": True,
                              "batna_strengthened": True,
                              "reservation_price_set": True,
                              "counterpart_reservation_estimated": True,
                              "zopa_assessed": True,
                              "walk_away_commitment_declared": True,
                              "fundamentals_prepared_before_negotiation": True},
    "interests": {"own_interests_identified": True,
                  "counterpart_interests_identified": True,
                  "counterpart_why_to_be_asked_planned": True,
                  "interests_not_positions_framing_adopted": True},
    "value_creation": {"value_created_before_claiming_planned": True,
                       "non_zero_sum_opportunities_sought": True,
                       "trade_across_differently_valued_issues_planned": True},
    "issues": [
        {"name": "price", "own_underlying_interest": "predictable-cost",
         "counterpart_underlying_interest": "margin-protection",
         "trade_potential_assessed": True},
        {"name": "term-length", "own_underlying_interest": "flexibility",
         "counterpart_underlying_interest": "revenue-certainty",
         "trade_potential_assessed": True},
        {"name": "support-level", "own_underlying_interest": "uptime",
         "counterpart_underlying_interest": "staffing-cost",
         "trade_potential_assessed": True},
    ],
    "direction": {"sense_of_direction_stated": True,
                  "plan_not_script_approach_adopted": True,
                  "plan_b_prepared": True,
                  "plan_c_prepared": True},
    "presence_and_awareness": {"own_emotional_state_management_planned": True,
                               "composure_commitment_declared": True,
                               "situational_awareness_planned": True},
    "sequence": {"opening_planned": True,
                 "critical_moments_recognition_planned": True,
                 "closing_cleanly_planned": True},
    "anchoring": {"informed_enough_to_anchor_first": True,
                  "anchor_first_planned": True},
    "tactics": {"counterpart_yes_made_easy_planned": True,
                "people_separated_from_problem_declared": True,
                "hard_on_problem_soft_on_person_declared": True,
                "fair_enough_agreement_aim_declared": True},
    "learning": {"debrief_planned_after_negotiation": True,
                 "deliberate_debrief_review_committed": True,
                 "misleading_feedback_caution_acknowledged": True},
    "red_lines": {"no_batna_present": False,
                  "arguing_positions_present": False,
                  "treating_everything_as_zero_sum_present": False,
                  "rigid_script_reliance_present": False,
                  "losing_composure_present": False,
                  "never_debriefing_present": False},
}

UNINFORMED_COMPLETE = copy.deepcopy(COMPLETE)
UNINFORMED_COMPLETE["anchoring"] = {
    "informed_enough_to_anchor_first": False,
    "anchor_first_planned": False,
}


def check_status(v, name):
    return next(c["status"] for c in v["checks"] if c["check"] == name)


class VerdictTests(unittest.TestCase):
    def test_complete_manifest_is_sound(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(v["verdict"], "NEGOTIATION_PREPARATION_SOUND")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(len(v["checks"]), 44)
        self.assertEqual(v["computed_status"],
                         "within_stated_limits_on_declared_evidence")
        self.assertEqual(v["issues_count"], 3)
        self.assertEqual(v["issues_without_own_interest"], [])
        self.assertEqual(v["own_interest_coverage"], "1.000000")
        self.assertEqual(v["issues_without_counterpart_interest"], [])
        self.assertEqual(v["counterpart_interest_coverage"], "1.000000")
        self.assertEqual(v["issues_without_trade_potential_assessed"], [])
        self.assertEqual(v["trade_potential_assessed_coverage"], "1.000000")
        self.assertEqual(v["duplicate_issue_names"], [])

    def test_uninformed_complete_is_sound(self):
        v = evaluate(copy.deepcopy(UNINFORMED_COMPLETE))
        self.assertEqual(v["verdict"], "NEGOTIATION_PREPARATION_SOUND")
        self.assertEqual(
            check_status(v, "anchor_first_planned_when_informed"), "pass")

    def test_no_batna_identified_fails_section1(self):
        m = copy.deepcopy(COMPLETE)
        m["batna_and_reservation"]["batna_identified"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NEGOTIATION_PREPARATION_NOT_SOUND")
        self.assertEqual(
            v["sections"]["batna_reservation_price_and_zopa"], "fail")
        self.assertEqual(check_status(v, "batna_identified"), "fail")

    def test_batna_not_strengthened_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["batna_and_reservation"]["batna_strengthened"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "NEGOTIATION_PREPARATION_NOT_SOUND")

    def test_no_reservation_price_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["batna_and_reservation"]["reservation_price_set"] = False
        self.assertEqual(
            check_status(evaluate(m), "reservation_price_set"), "fail")

    def test_zopa_not_assessed_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["batna_and_reservation"]["zopa_assessed"] = False
        v = evaluate(m)
        self.assertEqual(check_status(v, "zopa_assessed"), "fail")
        self.assertEqual(
            v["sections"]["batna_reservation_price_and_zopa"], "fail")

    def test_positions_framing_fails_section2(self):
        m = copy.deepcopy(COMPLETE)
        m["interests"]["interests_not_positions_framing_adopted"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NEGOTIATION_PREPARATION_NOT_SOUND")
        self.assertEqual(
            v["sections"]["interests_and_value_creation"], "fail")

    def test_claiming_before_creating_value_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["value_creation"]["value_created_before_claiming_planned"] = False
        self.assertEqual(
            check_status(evaluate(m),
                         "value_created_before_claiming_planned"), "fail")

    def test_issue_without_own_interest_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["issues"][0]["own_underlying_interest"] = ""
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NEGOTIATION_PREPARATION_NOT_SOUND")
        self.assertEqual(
            check_status(v, "every_issue_names_own_underlying_interest"),
            "fail")
        self.assertEqual(v["issues_without_own_interest"], ["price"])
        self.assertEqual(v["own_interest_coverage"], "0.666667")
        self.assertEqual(v["computed_status"],
                         "outside_stated_limits_on_declared_evidence")

    def test_issue_missing_own_interest_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["issues"][0]["own_underlying_interest"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "every_issue_names_own_underlying_interest"),
            "missing")
        self.assertEqual(v["issues_without_own_interest"], [])

    def test_issue_without_counterpart_interest_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["issues"][1]["counterpart_underlying_interest"] = ""
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v, "every_issue_names_counterpart_underlying_interest"),
            "fail")
        self.assertEqual(v["issues_without_counterpart_interest"],
                         ["term-length"])
        self.assertEqual(v["counterpart_interest_coverage"], "0.666667")

    def test_issue_without_trade_potential_assessed_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["issues"][2]["trade_potential_assessed"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_issue_trade_potential_assessed"), "fail")
        self.assertEqual(v["issues_without_trade_potential_assessed"],
                         ["support-level"])
        self.assertEqual(v["trade_potential_assessed_coverage"], "0.666667")

    def test_issue_missing_trade_field_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["issues"][2]["trade_potential_assessed"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "every_issue_trade_potential_assessed"),
            "missing")

    def test_duplicate_issue_name_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["issues"][2]["name"] = "price"
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "no_issue_name_duplicated"), "fail")
        self.assertEqual(v["duplicate_issue_names"], ["price"])

    def test_issue_missing_name_is_missing_for_duplicate_check(self):
        m = copy.deepcopy(COMPLETE)
        del m["issues"][2]["name"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "no_issue_name_duplicated"), "missing")
        self.assertEqual(v["duplicate_issue_names"], [])

    def test_empty_issues_list_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["issues"] = []
        v = evaluate(m)
        self.assertEqual(check_status(v, "issues_declared"), "fail")
        self.assertEqual(v["issues_count"], 0)
        self.assertIsNone(v["own_interest_coverage"])
        self.assertIsNone(v["counterpart_interest_coverage"])
        self.assertIsNone(v["trade_potential_assessed_coverage"])
        self.assertEqual(v["duplicate_issue_names"], [])

    def test_no_plan_b_fails_section3(self):
        m = copy.deepcopy(COMPLETE)
        m["direction"]["plan_b_prepared"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NEGOTIATION_PREPARATION_NOT_SOUND")
        self.assertEqual(
            v["sections"]["improvisation_and_adaptation"], "fail")

    def test_no_plan_c_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["direction"]["plan_c_prepared"] = False
        self.assertEqual(check_status(evaluate(m), "plan_c_prepared"), "fail")

    def test_no_situational_awareness_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["presence_and_awareness"]["situational_awareness_planned"] = False
        self.assertEqual(
            check_status(evaluate(m), "situational_awareness_planned"),
            "fail")

    def test_anchor_gate_absent_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["anchoring"]["informed_enough_to_anchor_first"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "anchoring_applicability_declared"), "missing")
        self.assertEqual(
            check_status(v, "anchor_first_planned_when_informed"), "missing")

    def test_informed_without_anchor_first_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["anchoring"]["anchor_first_planned"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "anchor_first_planned_when_informed"), "fail")
        self.assertEqual(v["verdict"], "NEGOTIATION_PREPARATION_NOT_SOUND")

    def test_uninformed_anchor_fields_false_still_pass(self):
        v = evaluate(copy.deepcopy(UNINFORMED_COMPLETE))
        self.assertEqual(
            check_status(v, "anchor_first_planned_when_informed"), "pass")

    def test_anchor_field_absent_with_gate_true_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["anchoring"]["anchor_first_planned"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "anchor_first_planned_when_informed"), "missing")

    def test_no_closing_plan_fails_section4(self):
        m = copy.deepcopy(COMPLETE)
        m["sequence"]["closing_cleanly_planned"] = False
        v = evaluate(m)
        self.assertEqual(
            v["sections"]["openings_moments_closing_and_tactics"], "fail")

    def test_people_merged_with_problem_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["tactics"]["people_separated_from_problem_declared"] = False
        self.assertEqual(
            check_status(evaluate(m),
                         "people_separated_from_problem_declared"), "fail")

    def test_no_debrief_planned_fails_section5(self):
        m = copy.deepcopy(COMPLETE)
        m["learning"]["debrief_planned_after_negotiation"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NEGOTIATION_PREPARATION_NOT_SOUND")
        self.assertEqual(
            v["sections"]["debrief_and_anti_pattern_red_lines"], "fail")

    def test_no_batna_red_line_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"]["no_batna_present"] = True
        v = evaluate(m)
        self.assertEqual(check_status(v, "no_batna"), "fail")
        self.assertEqual(
            v["sections"]["debrief_and_anti_pattern_red_lines"], "fail")

    def test_zero_sum_and_rigid_script_red_lines_fail(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"]["treating_everything_as_zero_sum_present"] = True
        m["red_lines"]["rigid_script_reliance_present"] = True
        v = evaluate(m)
        self.assertEqual(check_status(v, "no_zero_sum_treatment"), "fail")
        self.assertEqual(check_status(v, "no_rigid_script_reliance"), "fail")

    def test_never_debriefing_red_line_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"]["never_debriefing_present"] = True
        v = evaluate(m)
        self.assertEqual(check_status(v, "no_never_debriefing"), "fail")
        self.assertEqual(v["verdict"], "NEGOTIATION_PREPARATION_NOT_SOUND")

    def test_absent_evidence_is_insufficient_not_failed(self):
        m = copy.deepcopy(COMPLETE)
        del m["learning"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            v["sections"]["debrief_and_anti_pattern_red_lines"],
            "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertTrue(
            all(c["status"] == "missing" for c in v["checks"]))
        self.assertIsNone(v["computed_status"])
        self.assertIsNone(v["issues_count"])
        self.assertIsNone(v["issues_without_own_interest"])
        self.assertIsNone(v["own_interest_coverage"])
        self.assertIsNone(v["issues_without_counterpart_interest"])
        self.assertIsNone(v["counterpart_interest_coverage"])
        self.assertIsNone(v["issues_without_trade_potential_assessed"])
        self.assertIsNone(v["trade_potential_assessed_coverage"])
        self.assertIsNone(v["duplicate_issue_names"])

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertIn("VERDICT: NEGOTIATION_PREPARATION_SOUND", stamp(v))

    def test_non_object_manifest_rejected(self):
        with self.assertRaises(TypeError):
            evaluate(["not", "a", "manifest"])


class MalformedTypeTests(unittest.TestCase):
    def test_string_field_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["negotiation"] = 12345
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("negotiation", str(ctx.exception))

    def test_object_section_as_string_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"interests": "should-be-an-object"})
        self.assertIn("interests", str(ctx.exception))

    def test_list_field_as_object_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"issues": {"name": "price"}})
        self.assertIn("issues", str(ctx.exception))

    def test_list_entry_as_string_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"issues": ["price"]})
        self.assertIn("issues[0]", str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["batna_and_reservation"]["batna_identified"] = "yes"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("batna_and_reservation.batna_identified",
                      str(ctx.exception))

    def test_nested_list_entry_string_field_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["issues"][0]["name"] = 42
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("issues[0].name", str(ctx.exception))

    def test_nested_list_entry_boolean_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["issues"][1]["trade_potential_assessed"] = "true"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("issues[1].trade_potential_assessed",
                      str(ctx.exception))

    def test_null_section_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["anchoring"] = None
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("anchoring", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
