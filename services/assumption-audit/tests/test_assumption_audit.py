import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from assumption_audit import evaluate, stamp  # noqa: E402

SOUND = {
    "decision": "hire-or-not for the support lead role",
    "framing": {"decision_named": True, "options_listed": True,
                "decision_maker_identified": True,
                "objective_defined": True},
    "preset": {"criteria_set_before_data": True,
               "default_action_set": True,
               "change_threshold_set_before_data": True},
    "loss": {"framed_each_direction": True,
             "threshold_reflects_asymmetry": True},
    "rigor": {"stakes_assessed": True, "reversibility_assessed": True,
              "effort_matched": True},
    "data": {"exploratory_confirmatory_separated": True,
             "conclusion_not_from_inspiring_data": True,
             "evidence_could_change_decision": True, "roles_clear": True},
    "review": {"conducted": True,
               "separates_decision_from_outcome": True},
}


class VerdictTests(unittest.TestCase):
    def test_sound_manifest_is_sound(self):
        v = evaluate(copy.deepcopy(SOUND))
        self.assertEqual(v["verdict"], "SOUND")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))

    def test_criteria_set_after_seeing_data_fails(self):
        m = copy.deepcopy(SOUND)
        m["preset"]["criteria_set_before_data"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "UNSOUND")
        self.assertEqual(v["sections"]["preset_criteria"], "fail")

    def test_no_default_action_fails(self):
        m = copy.deepcopy(SOUND)
        m["preset"]["default_action_set"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "UNSOUND")

    def test_no_change_my_mind_threshold_fails(self):
        m = copy.deepcopy(SOUND)
        m["preset"]["change_threshold_set_before_data"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "UNSOUND")
        self.assertEqual(v["sections"]["preset_criteria"], "fail")

    def test_loss_framed_one_way_only_fails(self):
        m = copy.deepcopy(SOUND)
        m["loss"]["framed_each_direction"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "UNSOUND")
        self.assertEqual(v["sections"]["loss_function"], "fail")

    def test_threshold_ignoring_asymmetric_costs_fails(self):
        m = copy.deepcopy(SOUND)
        m["loss"]["threshold_reflects_asymmetry"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "UNSOUND")

    def test_reversibility_not_assessed_fails_rigor(self):
        m = copy.deepcopy(SOUND)
        m["rigor"]["reversibility_assessed"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "UNSOUND")
        self.assertEqual(v["sections"]["rigor_sizing"], "fail")

    def test_conclusion_from_inspiring_data_fails(self):
        m = copy.deepcopy(SOUND)
        m["data"]["conclusion_not_from_inspiring_data"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "UNSOUND")
        self.assertEqual(v["sections"]["data_discipline"], "fail")

    def test_decorative_evidence_fails(self):
        m = copy.deepcopy(SOUND)
        m["data"]["evidence_could_change_decision"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "UNSOUND")

    def test_analyst_making_the_call_fails_roles(self):
        m = copy.deepcopy(SOUND)
        m["data"]["roles_clear"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "UNSOUND")

    def test_resulting_in_review_fails(self):
        m = copy.deepcopy(SOUND)
        m["review"]["separates_decision_from_outcome"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "UNSOUND")
        self.assertEqual(v["sections"]["review"], "fail")

    def test_single_foregone_option_fails_framing(self):
        m = copy.deepcopy(SOUND)
        m["framing"]["options_listed"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "UNSOUND")
        self.assertEqual(v["sections"]["framing"], "fail")

    def test_absent_evidence_is_insufficient_not_failed(self):
        m = copy.deepcopy(SOUND)
        del m["loss"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["loss_function"],
                         "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(SOUND))
        self.assertIn("VERDICT: SOUND", stamp(v))

    def test_non_object_manifest_rejected(self):
        with self.assertRaises(TypeError):
            evaluate(["not", "a", "manifest"])


class MalformedTypeTests(unittest.TestCase):
    """F1 regression (external verification Wave 1): a documented
    field present with the wrong JSON type is rejected with
    ValueError naming the field — never evaluated into a verdict.
    The first case mirrors the recorded external malformed input."""

    def test_recorded_malformed_case_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"decision": "Malformed test",
                      "framing": "not-an-object",
                      "preset": {"criteria_set_before_data":
                                 "should-be-boolean"}})
        self.assertIn("framing", str(ctx.exception))

    def test_section_as_string_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"framing": "not-an-object"})
        self.assertIn("framing", str(ctx.exception))

    def test_preset_leaf_as_string_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"preset": {"criteria_set_before_data":
                                 "should-be-boolean"}})
        self.assertIn("preset.criteria_set_before_data",
                      str(ctx.exception))

    def test_decision_as_number_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"decision": 42})
        self.assertIn("decision", str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(SOUND)
        m["review"]["conducted"] = "yes"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("review.conducted", str(ctx.exception))

    def test_null_field_rejected(self):
        m = copy.deepcopy(SOUND)
        m["loss"] = None
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("loss", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
