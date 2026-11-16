import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from decision_process_design import evaluate, stamp  # noqa: E402

COMPLETE = {
    "decision": "hire-or-not-senior-engineer",
    "framing": {"decision_named": True,
                "decision_maker_identified": True,
                "objective_stated": True,
                "decision_maker_defines_what_matters": True,
                "analyst_informs_not_decides": True,
                "analysis_makes_the_call_present": False},
    "options": [
        {"name": "hire", "viable": True},
        {"name": "do_not_hire", "viable": True},
    ],
    "criteria": [
        {"name": "work_sample_score", "set_before_data": True,
         "threshold_declared": True},
        {"name": "reference_strength", "set_before_data": True,
         "threshold_declared": True},
    ],
    "precommitment": {"default_action": "do_not_hire",
                      "change_my_mind_threshold_stated": True,
                      "criteria_and_thresholds_set_before_data_seen": True,
                      "data_seen_before_criteria_set_present": False},
    "loss": {"loss_function_framed": True,
             "cost_of_being_wrong_in_each_direction_stated": True,
             "cost_of_false_action": 40000,
             "cost_of_false_inaction": 10000,
             "asymmetric_costs_declared": True,
             "threshold_adjusted_for_asymmetric_costs": True},
    "rigor": {"stakes_assessed": True,
              "reversibility_assessed": True,
              "effort_matched_to_stakes_and_reversibility": True,
              "data_gathering_worth_assessed": True,
              "irreversible_declared": False,
              "slowed_down_and_more_evidence_for_irreversible": False,
              "reversible_declared": True,
              "default_to_action_for_reversible": True},
    "evidence": {"exploratory_and_confirmatory_distinguished": True,
                 "confirmatory_analysis_used": True,
                 "hypothesis_preregistered": True,
                 "conclusion_drawn_from_inspiring_data_present": False,
                 "evidence_has_power_to_change_decision": True,
                 "data_is_decoration_present": False,
                 "acted_per_preset_criteria_after_gathering": True},
    "review": {"decision_quality_reviewed_separately_from_outcome": True,
               "decision_judged_by_process_and_information_at_time": True,
               "outcome_used_alone_to_judge_present": False},
}


def check_status(v, name):
    return next(c["status"] for c in v["checks"] if c["check"] == name)


class VerdictTests(unittest.TestCase):
    def test_complete_manifest_is_sound(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(v["verdict"], "DECISION_PROCESS_SOUND")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(len(v["checks"]), 36)
        self.assertEqual(v["computed_status"],
                         "within_stated_limits_on_declared_evidence")
        self.assertEqual(v["options_count"], 2)
        self.assertEqual(v["options_without_name"], [])
        self.assertEqual(v["options_not_declared_viable"], [])
        self.assertEqual(v["option_name_coverage"], "1.0000")
        self.assertEqual(v["criteria_count"], 2)
        self.assertEqual(v["criteria_without_name"], [])
        self.assertEqual(v["criteria_not_set_before_data"], [])
        self.assertEqual(v["criteria_without_threshold"], [])
        self.assertEqual(v["criterion_set_before_data_coverage"],
                         "1.0000")
        self.assertEqual(v["criterion_threshold_coverage"], "1.0000")
        self.assertEqual(v["default_action"], "do_not_hire")
        self.assertEqual(v["loss_cost_ratio"], "4.0000")

    def test_decision_not_named_fails_framing_section(self):
        m = copy.deepcopy(COMPLETE)
        m["framing"]["decision_named"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "DECISION_PROCESS_NOT_SOUND")
        self.assertEqual(v["sections"]["framing_and_roles"], "fail")

    def test_option_without_name_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["options"][1]["name"] = ""
        v = evaluate(m)
        # default no longer matches a named option either
        self.assertEqual(v["verdict"], "DECISION_PROCESS_NOT_SOUND")
        self.assertEqual(check_status(v, "every_option_named"), "fail")
        self.assertEqual(v["options_without_name"], [""])
        self.assertEqual(v["option_name_coverage"], "0.5000")
        self.assertEqual(v["computed_status"],
                         "outside_stated_limits_on_declared_evidence")

    def test_option_missing_name_field_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["options"][0]["name"]
        v = evaluate(m)
        self.assertEqual(check_status(v, "every_option_named"),
                         "missing")
        self.assertEqual(v["options_without_name"], ["unnamed"])

    def test_option_not_viable_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["options"][0]["viable"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "DECISION_PROCESS_NOT_SOUND")
        self.assertEqual(v["options_not_declared_viable"], ["hire"])

    def test_empty_options_list_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["options"] = []
        v = evaluate(m)
        self.assertEqual(check_status(v, "options_declared"), "fail")
        self.assertEqual(v["options_count"], 0)
        self.assertIsNone(v["option_name_coverage"])

    def test_analysis_makes_call_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["framing"]["analysis_makes_the_call_present"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "DECISION_PROCESS_NOT_SOUND")
        self.assertEqual(v["sections"]["framing_and_roles"], "fail")

    def test_criterion_not_set_before_data_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["criteria"][1]["set_before_data"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "DECISION_PROCESS_NOT_SOUND")
        self.assertEqual(
            check_status(v, "every_criterion_set_before_data"), "fail")
        self.assertEqual(v["criteria_not_set_before_data"],
                         ["reference_strength"])
        self.assertEqual(v["criterion_set_before_data_coverage"],
                         "0.5000")

    def test_criterion_without_threshold_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["criteria"][0]["threshold_declared"] = False
        v = evaluate(m)
        self.assertEqual(v["criteria_without_threshold"],
                         ["work_sample_score"])
        self.assertEqual(v["criterion_threshold_coverage"], "0.5000")

    def test_criterion_missing_threshold_field_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["criteria"][0]["threshold_declared"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "every_criterion_threshold_declared"),
            "missing")

    def test_default_action_not_a_declared_option_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["precommitment"]["default_action"] = "defer_forever"
        v = evaluate(m)
        self.assertEqual(v["verdict"], "DECISION_PROCESS_NOT_SOUND")
        self.assertEqual(
            check_status(v, "default_action_matches_declared_option"),
            "fail")
        self.assertEqual(v["computed_status"],
                         "outside_stated_limits_on_declared_evidence")

    def test_default_action_missing_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["precommitment"]["default_action"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "default_action_matches_declared_option"),
            "missing")
        self.assertIsNone(v["default_action"])

    def test_data_seen_before_criteria_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["precommitment"]["data_seen_before_criteria_set_present"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "DECISION_PROCESS_NOT_SOUND")
        self.assertEqual(v["sections"]["precommitment_before_data"],
                         "fail")

    def test_negative_loss_cost_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["loss"]["cost_of_false_action"] = -5
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "loss_costs_both_directions_declared"),
            "fail")

    def test_loss_cost_missing_is_missing_and_ratio_null(self):
        m = copy.deepcopy(COMPLETE)
        del m["loss"]["cost_of_false_inaction"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "loss_costs_both_directions_declared"),
            "missing")
        self.assertIsNone(v["loss_cost_ratio"])

    def test_zero_inaction_cost_ratio_is_null_but_check_passes(self):
        m = copy.deepcopy(COMPLETE)
        m["loss"]["cost_of_false_inaction"] = 0
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "loss_costs_both_directions_declared"),
            "pass")
        self.assertIsNone(v["loss_cost_ratio"])

    def test_threshold_not_adjusted_when_asymmetric_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["loss"]["threshold_adjusted_for_asymmetric_costs"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "DECISION_PROCESS_NOT_SOUND")
        self.assertEqual(
            check_status(v, "threshold_adjusted_when_costs_asymmetric"),
            "fail")

    def test_no_asymmetry_passes_threshold_check_as_na(self):
        m = copy.deepcopy(COMPLETE)
        m["loss"]["asymmetric_costs_declared"] = False
        del m["loss"]["threshold_adjusted_for_asymmetric_costs"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "DECISION_PROCESS_SOUND")
        self.assertEqual(
            check_status(v, "threshold_adjusted_when_costs_asymmetric"),
            "pass")

    def test_irreversible_without_slowing_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["rigor"]["irreversible_declared"] = True
        m["rigor"]["slowed_down_and_more_evidence_for_irreversible"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "DECISION_PROCESS_NOT_SOUND")
        self.assertEqual(
            check_status(v, "slowed_down_when_irreversible"), "fail")

    def test_reversible_without_default_to_action_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["rigor"]["default_to_action_for_reversible"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "default_to_action_when_reversible"),
            "fail")

    def test_no_reversible_passes_default_to_action_as_na(self):
        m = copy.deepcopy(COMPLETE)
        m["rigor"]["reversible_declared"] = False
        del m["rigor"]["default_to_action_for_reversible"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "DECISION_PROCESS_SOUND")

    def test_conclusion_from_inspiring_data_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["evidence"]["conclusion_drawn_from_inspiring_data_present"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "DECISION_PROCESS_NOT_SOUND")
        self.assertEqual(
            v["sections"]["evidence_discipline_and_review"], "fail")

    def test_data_decoration_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["evidence"]["data_is_decoration_present"] = True
        self.assertEqual(evaluate(m)["verdict"],
                         "DECISION_PROCESS_NOT_SOUND")

    def test_hypothesis_missing_when_confirmatory(self):
        m = copy.deepcopy(COMPLETE)
        del m["evidence"]["hypothesis_preregistered"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "hypothesis_preregistered_when_confirmatory"),
            "missing")

    def test_no_confirmatory_passes_preregistration_as_na(self):
        m = copy.deepcopy(COMPLETE)
        m["evidence"]["confirmatory_analysis_used"] = False
        del m["evidence"]["hypothesis_preregistered"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "DECISION_PROCESS_SOUND")

    def test_outcome_alone_judgment_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["review"]["outcome_used_alone_to_judge_present"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "DECISION_PROCESS_NOT_SOUND")
        self.assertEqual(
            v["sections"]["evidence_discipline_and_review"], "fail")

    def test_absent_evidence_is_insufficient_not_failed(self):
        m = copy.deepcopy(COMPLETE)
        del m["review"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            v["sections"]["evidence_discipline_and_review"],
            "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertTrue(
            all(c["status"] == "missing" for c in v["checks"]))
        self.assertIsNone(v["computed_status"])
        self.assertIsNone(v["options_count"])
        self.assertIsNone(v["options_without_name"])
        self.assertIsNone(v["option_name_coverage"])
        self.assertIsNone(v["criteria_count"])
        self.assertIsNone(v["loss_cost_ratio"])
        self.assertIsNone(v["default_action"])

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertIn("VERDICT: DECISION_PROCESS_SOUND", stamp(v))

    def test_non_object_manifest_rejected(self):
        with self.assertRaises(TypeError):
            evaluate(["not", "a", "manifest"])


class MalformedTypeTests(unittest.TestCase):
    """F1 regression: a documented field present with the wrong
    JSON type is rejected with ValueError naming the field."""

    def test_string_field_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["decision"] = 12345
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("decision", str(ctx.exception))

    def test_object_section_as_string_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"framing": "should-be-an-object"})
        self.assertIn("framing", str(ctx.exception))

    def test_list_field_as_object_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"options": {"name": "hire"}})
        self.assertIn("options", str(ctx.exception))

    def test_list_entry_as_string_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"options": ["hire"]})
        self.assertIn("options[0]", str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["framing"]["decision_named"] = "yes"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("framing.decision_named", str(ctx.exception))

    def test_nested_list_entry_string_field_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["options"][1]["name"] = 42
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("options[1].name", str(ctx.exception))

    def test_nested_list_entry_boolean_field_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["criteria"][0]["set_before_data"] = "yes"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("criteria[0].set_before_data", str(ctx.exception))

    def test_number_field_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["loss"]["cost_of_false_action"] = "40000"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("loss.cost_of_false_action", str(ctx.exception))

    def test_number_field_as_boolean_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["loss"]["cost_of_false_inaction"] = True
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("loss.cost_of_false_inaction",
                      str(ctx.exception))

    def test_default_action_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["precommitment"]["default_action"] = 7
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("precommitment.default_action",
                      str(ctx.exception))

    def test_null_section_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["review"] = None
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("review", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
