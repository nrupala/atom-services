import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from decision_trap_sweep import evaluate, stamp  # noqa: E402

CLEAR = {
    "decision": "adopt the new routing vendor",
    "framing": {"decision_stated": True, "decide_by_named": True,
                "constraints_named": True, "out_of_scope_named": True,
                "classification": "irreversible",
                "stakes_assessed": True},
    "options": {"list": ["adopt vendor A", "build in-house",
                         "do nothing / wait"],
                "includes_status_quo": True,
                "includes_smaller_reversible_step": True},
    "criteria": {"criteria_listed": True,
                 "defined_before_scoring": True,
                 "weights_assigned_before_scoring": True},
    "evaluation": {"method_named": True, "uncertainty_flagged": True,
                   "probabilities_estimable": True,
                   "expected_value_used": True},
    "premortem": {"decision_is_material": True, "conducted": True,
                  "top_risks_hedged": True},
    "rush": {"made_in_rush": False, "made_in_a_mood": False},
    "log": {"choice_recorded": True, "rationale_recorded": True,
            "assumptions_recorded": True, "review_date_set": True,
            "communicated_with_why": True},
}


class VerdictTests(unittest.TestCase):
    def test_clear_record_is_trap_clear(self):
        v = evaluate(copy.deepcopy(CLEAR))
        self.assertEqual(v["verdict"], "TRAP_CLEAR")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(len(v["checks"]), 24)

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(CLEAR))
        self.assertIn("VERDICT: TRAP_CLEAR", stamp(v))

    def test_non_object_manifest_rejected(self):
        with self.assertRaises(TypeError):
            evaluate(["not", "a", "manifest"])

    def test_false_binary_two_options_fails(self):
        m = copy.deepcopy(CLEAR)
        m["options"]["list"] = ["adopt vendor A", "build in-house"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "TRAPS_PRESENT")
        self.assertEqual(v["sections"]["options"], "fail")

    def test_options_not_a_list_is_rejected(self):
        # Corrected under the coordinator's F1 ruling (was
        # test_options_not_a_list_fails, asserting a TRAPS_PRESENT
        # verdict over a wrong-typed documented field): a non-list
        # options.list is a type violation, rejected before any
        # verdict is computed.
        m = copy.deepcopy(CLEAR)
        m["options"]["list"] = "adopt vendor A"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("options.list", str(ctx.exception))

    def test_missing_status_quo_option_fails(self):
        m = copy.deepcopy(CLEAR)
        m["options"]["includes_status_quo"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "TRAPS_PRESENT")
        self.assertEqual(v["sections"]["options"], "fail")

    def test_missing_smaller_reversible_step_fails(self):
        m = copy.deepcopy(CLEAR)
        m["options"]["includes_smaller_reversible_step"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "TRAPS_PRESENT")

    def test_criteria_defined_after_scores_fails(self):
        m = copy.deepcopy(CLEAR)
        m["criteria"]["defined_before_scoring"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "TRAPS_PRESENT")
        self.assertEqual(v["sections"]["criteria_before_evaluation"],
                         "fail")

    def test_weights_fitted_after_scoring_fails(self):
        m = copy.deepcopy(CLEAR)
        m["criteria"]["weights_assigned_before_scoring"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "TRAPS_PRESENT")
        self.assertEqual(v["sections"]["criteria_before_evaluation"],
                         "fail")

    def test_unflagged_uncertainty_fails(self):
        m = copy.deepcopy(CLEAR)
        m["evaluation"]["uncertainty_flagged"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "TRAPS_PRESENT")
        self.assertEqual(v["sections"]["evaluation_and_uncertainty"],
                         "fail")

    def test_estimable_probabilities_without_expected_value_fails(self):
        m = copy.deepcopy(CLEAR)
        m["evaluation"]["expected_value_used"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "TRAPS_PRESENT")
        self.assertEqual(v["sections"]["evaluation_and_uncertainty"],
                         "fail")

    def test_non_estimable_probabilities_pass_ev_check_as_not_applicable(
            self):
        m = copy.deepcopy(CLEAR)
        m["evaluation"]["probabilities_estimable"] = False
        del m["evaluation"]["expected_value_used"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "TRAP_CLEAR")

    def test_material_decision_without_premortem_fails(self):
        m = copy.deepcopy(CLEAR)
        m["premortem"]["conducted"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "TRAPS_PRESENT")
        self.assertEqual(v["sections"]["pre_mortem"], "fail")

    def test_immaterial_decision_passes_premortem_as_not_applicable(self):
        m = copy.deepcopy(CLEAR)
        m["premortem"]["decision_is_material"] = False
        del m["premortem"]["conducted"]
        del m["premortem"]["top_risks_hedged"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "TRAP_CLEAR")

    def test_irreversible_decision_in_a_rush_fails(self):
        m = copy.deepcopy(CLEAR)
        m["rush"]["made_in_rush"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "TRAPS_PRESENT")
        self.assertEqual(v["sections"]["rush_and_mood_trap"], "fail")

    def test_irreversible_decision_in_a_mood_fails(self):
        m = copy.deepcopy(CLEAR)
        m["rush"]["made_in_a_mood"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "TRAPS_PRESENT")
        self.assertEqual(v["sections"]["rush_and_mood_trap"], "fail")

    def test_reversible_decision_passes_rush_trap_as_not_applicable(self):
        m = copy.deepcopy(CLEAR)
        m["framing"]["classification"] = "reversible"
        m["rush"]["made_in_rush"] = True
        m["rush"]["made_in_a_mood"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "TRAP_CLEAR")
        self.assertEqual(v["sections"]["rush_and_mood_trap"], "pass")

    def test_invalid_classification_fails(self):
        m = copy.deepcopy(CLEAR)
        m["framing"]["classification"] = "permanent-ish"
        v = evaluate(m)
        self.assertEqual(v["verdict"], "TRAPS_PRESENT")
        self.assertEqual(v["sections"]["framing_and_classification"],
                         "fail")

    def test_absent_log_is_insufficient_not_failed(self):
        m = copy.deepcopy(CLEAR)
        del m["log"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["decision_log_and_review"],
                         "insufficient_evidence")


class MalformedTypeTests(unittest.TestCase):
    """F1 regression (external verification Wave 1): a documented
    field present with the wrong JSON type is rejected with
    ValueError naming the field — never evaluated into a verdict.
    The first case mirrors the recorded external malformed input."""

    def test_recorded_malformed_case_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"decision": "Malformed input",
                      "framing": {"classification": 123},
                      "options": "not-a-list"})
        self.assertIn("framing.classification", str(ctx.exception))

    def test_options_as_string_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"decision": "Malformed input",
                      "options": "not-a-list"})
        self.assertIn("options", str(ctx.exception))

    def test_option_entry_as_number_rejected(self):
        m = copy.deepcopy(CLEAR)
        m["options"]["list"] = ["adopt vendor A", 42, "do nothing"]
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("options.list[1]", str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(CLEAR)
        m["rush"]["made_in_rush"] = "no"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("rush.made_in_rush", str(ctx.exception))

    def test_null_section_rejected(self):
        m = copy.deepcopy(CLEAR)
        m["log"] = None
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("log", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
