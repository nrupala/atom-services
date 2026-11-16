import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from argument_analysis_review import evaluate, stamp  # noqa: E402

COMPLETE = {
    "argument": "expand-the-pilot",
    "anatomy": {"premises_identified": True,
                "conclusion_identified": True,
                "validity_distinguished_from_soundness": True,
                "steelman_stated": True},
    "evidence": {"source_quality_assessed": True,
                 "sample_size_considered": True,
                 "confounders_considered": True,
                 "replication_considered": True,
                 "anecdote_treated_as_data": False},
    "calibration": {"base_rate_stated": True,
                    "diagnosticity_assessed": True,
                    "confidence_percent": 65,
                    "known_vs_believed_separated": True},
    "stress_test": {"inversion_or_premortem_done": True,
                    "second_order_consequences_traced": True,
                    "change_mind_evidence_prestated": True},
    "screening": {
        "fallacies_screened": ["ad_hominem", "straw_man",
                               "false_dichotomy", "appeal_to_authority",
                               "slippery_slope", "correlation_as_causation",
                               "survivorship_bias", "base_rate_neglect",
                               "sunk_cost"],
        "biases_screened": ["confirmation", "anchoring", "availability",
                            "motivated_reasoning", "recency",
                            "overconfidence"]},
    "razors": {"simplest_explanation_preferred": True,
               "malice_not_assumed_without_evidence": True,
               "chestertons_fence_respected": True,
               "map_territory_distinguished": True},
    "countercase": {"key_assumption_named": True,
                    "strongest_countercase_offered": True},
}


def check_status(v, name):
    return next(c["status"] for c in v["checks"] if c["check"] == name)


class VerdictTests(unittest.TestCase):
    def test_complete_manifest_is_analysis_complete(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(v["verdict"], "ARGUMENT_ANALYSIS_COMPLETE")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(v["computed_status"],
                         "within_stated_limits_on_declared_evidence")
        self.assertEqual(len(v["checks"]), 24)
        self.assertEqual(v["missing_fallacies"], [])
        self.assertEqual(v["missing_biases"], [])
        self.assertEqual(v["confidence_percent"], 65)

    def test_extra_screened_tokens_are_ignored(self):
        m = copy.deepcopy(COMPLETE)
        m["screening"]["fallacies_screened"].append("whataboutism")
        self.assertEqual(evaluate(m)["verdict"],
                         "ARGUMENT_ANALYSIS_COMPLETE")

    def test_missing_fallacy_fails_and_is_reported(self):
        m = copy.deepcopy(COMPLETE)
        m["screening"]["fallacies_screened"].remove("sunk_cost")
        v = evaluate(m)
        self.assertEqual(v["verdict"], "ARGUMENT_ANALYSIS_DEFICIENT")
        self.assertEqual(v["sections"]["fallacy_and_bias_screening"],
                         "fail")
        self.assertEqual(v["missing_fallacies"], ["sunk_cost"])
        self.assertEqual(v["computed_status"],
                         "outside_stated_limits_on_declared_evidence")

    def test_missing_bias_fails_and_is_reported(self):
        m = copy.deepcopy(COMPLETE)
        m["screening"]["biases_screened"].remove("recency")
        v = evaluate(m)
        self.assertEqual(v["verdict"], "ARGUMENT_ANALYSIS_DEFICIENT")
        self.assertEqual(v["missing_biases"], ["recency"])

    def test_empty_fallacy_list_fails_not_missing(self):
        m = copy.deepcopy(COMPLETE)
        m["screening"]["fallacies_screened"] = []
        v = evaluate(m)
        self.assertEqual(v["verdict"], "ARGUMENT_ANALYSIS_DEFICIENT")
        self.assertEqual(
            check_status(v, "all_listed_fallacies_screened"), "fail")
        self.assertEqual(len(v["missing_fallacies"]), 9)

    def test_absent_screening_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["screening"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertIsNone(v["missing_fallacies"])
        self.assertIsNone(v["missing_biases"])
        self.assertIsNone(v["computed_status"])

    def test_confidence_at_100_is_binary_certainty_and_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["calibration"]["confidence_percent"] = 100
        v = evaluate(m)
        self.assertEqual(v["verdict"], "ARGUMENT_ANALYSIS_DEFICIENT")
        self.assertEqual(
            check_status(v, "confidence_probabilistic_and_explicit"),
            "fail")

    def test_confidence_at_0_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["calibration"]["confidence_percent"] = 0
        self.assertEqual(evaluate(m)["verdict"],
                         "ARGUMENT_ANALYSIS_DEFICIENT")

    def test_confidence_just_inside_bounds_passes(self):
        m = copy.deepcopy(COMPLETE)
        m["calibration"]["confidence_percent"] = 99.5
        self.assertEqual(evaluate(m)["verdict"],
                         "ARGUMENT_ANALYSIS_COMPLETE")
        m["calibration"]["confidence_percent"] = 0.5
        self.assertEqual(evaluate(m)["verdict"],
                         "ARGUMENT_ANALYSIS_COMPLETE")

    def test_absent_confidence_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["calibration"]["confidence_percent"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertIsNone(v["confidence_percent"])
        self.assertIsNone(v["computed_status"])

    def test_no_steelman_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["anatomy"]["steelman_stated"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "ARGUMENT_ANALYSIS_DEFICIENT")
        self.assertEqual(v["sections"]["anatomy_and_steelman"], "fail")

    def test_validity_soundness_not_distinguished_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["anatomy"]["validity_distinguished_from_soundness"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "ARGUMENT_ANALYSIS_DEFICIENT")

    def test_anecdote_treated_as_data_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["evidence"]["anecdote_treated_as_data"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "ARGUMENT_ANALYSIS_DEFICIENT")
        self.assertEqual(v["sections"]["evidence_weighing"], "fail")

    def test_base_rate_not_stated_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["calibration"]["base_rate_stated"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "ARGUMENT_ANALYSIS_DEFICIENT")

    def test_change_mind_not_prestated_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["stress_test"]["change_mind_evidence_prestated"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "ARGUMENT_ANALYSIS_DEFICIENT")

    def test_countercase_not_offered_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["countercase"]["strongest_countercase_offered"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "ARGUMENT_ANALYSIS_DEFICIENT")

    def test_absent_evidence_is_insufficient_not_failed(self):
        m = copy.deepcopy(COMPLETE)
        del m["evidence"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["evidence_weighing"],
                         "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertIsNone(v["computed_status"])
        self.assertIsNone(v["confidence_percent"])

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertIn("VERDICT: ARGUMENT_ANALYSIS_COMPLETE", stamp(v))

    def test_non_object_manifest_rejected(self):
        with self.assertRaises(TypeError):
            evaluate(["not", "a", "manifest"])


class MalformedTypeTests(unittest.TestCase):
    """F1 regression: a documented field present with the wrong
    JSON type is rejected with ValueError naming the field."""

    def test_string_field_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["argument"] = 12345
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("argument", str(ctx.exception))

    def test_object_section_as_string_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"anatomy": "should-be-an-object"})
        self.assertIn("anatomy", str(ctx.exception))

    def test_list_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["screening"]["fallacies_screened"] = "ad_hominem"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("screening.fallacies_screened",
                      str(ctx.exception))

    def test_list_entry_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["screening"]["biases_screened"] = ["confirmation", 42]
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("screening.biases_screened[1]",
                      str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["anatomy"]["steelman_stated"] = "yes"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("anatomy.steelman_stated", str(ctx.exception))

    def test_numeric_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["calibration"]["confidence_percent"] = "high"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("calibration.confidence_percent",
                      str(ctx.exception))

    def test_numeric_leaf_as_boolean_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["calibration"]["confidence_percent"] = True
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("calibration.confidence_percent",
                      str(ctx.exception))

    def test_null_section_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["evidence"] = None
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("evidence", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
