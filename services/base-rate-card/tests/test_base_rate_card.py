import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from base_rate_card import evaluate, stamp  # noqa: E402

COMPLETE = {
    "claim": "This startup will reach profitability within a year",
    "evidence": {"claim_restated_precisely": True,
                 "supporting_evidence_sought": True,
                 "refuting_evidence_sought": True,
                 "hierarchy_applied": True,
                 "conflicts_noted_with_reasons": True},
    "base_rate": {"reference_class_defined": True,
                  "considered_first": True,
                  "reference_class_size": 100,
                  "reference_class_successes": 23,
                  "stated": 0.23},
    "steelman": {"strongest_counterargument_built": True,
                 "counterargument_engaged": True,
                 "opposing_view_strawmanned": False},
    "fallacies": {"spot_check_performed": True,
                  "checked": ["ad_hominem", "straw_man",
                              "false_dilemma",
                              "appeal_to_authority_or_antiquity",
                              "survivorship", "motivated_reasoning",
                              "cherry_picked_windows"]},
    "calibration": {"confidence_stated": True,
                    "confidence_value": 0.8,
                    "outcomes_reviewed": True,
                    "hit_rate_tracked_by_confidence_band": True},
    "judgment": {"second_order_effects_considered": True,
                 "written": True,
                 "includes_confidence": True,
                 "includes_key_uncertainties": True,
                 "conclusion_from_vibes_or_authority_alone": False,
                 "certainty_outruns_evidence": False},
}


def check_status(v, name):
    return next(c["status"] for c in v["checks"] if c["check"] == name)


class VerdictTests(unittest.TestCase):
    def test_complete_manifest_is_card_complete(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(v["verdict"], "CARD_COMPLETE")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(v["computed_status"],
                         "within_stated_limits_on_declared_evidence")
        self.assertEqual(len(v["checks"]), 23)
        self.assertEqual(v["reference_rate"], "0.230000")
        self.assertEqual(v["base_rate_difference"], "0.000000")
        self.assertEqual(v["fallacies_not_checked"], [])

    def test_stated_rate_matching_counts_at_other_values_passes(self):
        m = copy.deepcopy(COMPLETE)
        m["base_rate"] = {"reference_class_defined": True,
                          "considered_first": True,
                          "reference_class_size": 40,
                          "reference_class_successes": 10,
                          "stated": 0.25}
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CARD_COMPLETE")
        self.assertEqual(v["reference_rate"], "0.250000")

    def test_stated_rate_disagreeing_with_counts_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["base_rate"]["stated"] = 0.5
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CARD_NOT_COMPLETE")
        self.assertEqual(v["sections"]["base_rates"], "fail")
        self.assertEqual(
            check_status(v, "base_rate_consistent_with_reference_counts"),
            "fail")
        self.assertEqual(v["base_rate_difference"], "0.270000")
        self.assertEqual(v["computed_status"],
                         "outside_stated_limits_on_declared_evidence")

    def test_successes_above_size_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["base_rate"]["reference_class_successes"] = 120
        m["base_rate"]["stated"] = 1.0
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CARD_NOT_COMPLETE")
        self.assertEqual(
            check_status(v, "base_rate_consistent_with_reference_counts"),
            "fail")

    def test_zero_reference_class_size_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["base_rate"]["reference_class_size"] = 0
        m["base_rate"]["reference_class_successes"] = 0
        m["base_rate"]["stated"] = 0
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CARD_NOT_COMPLETE")
        self.assertIsNone(v["reference_rate"])
        self.assertIsNone(v["base_rate_difference"])

    def test_stated_rate_above_one_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["base_rate"]["stated"] = 1.2
        self.assertEqual(evaluate(m)["verdict"], "CARD_NOT_COMPLETE")

    def test_missing_base_rate_numbers_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["base_rate"]["stated"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "base_rate_consistent_with_reference_counts"),
            "missing")
        self.assertIsNone(v["computed_status"])
        self.assertEqual(v["reference_rate"], "0.230000")
        self.assertIsNone(v["base_rate_difference"])

    def test_reference_class_not_defined_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["base_rate"]["reference_class_defined"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CARD_NOT_COMPLETE")
        self.assertEqual(v["sections"]["base_rates"], "fail")

    def test_base_rate_not_considered_first_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["base_rate"]["considered_first"] = False
        self.assertEqual(evaluate(m)["verdict"], "CARD_NOT_COMPLETE")

    def test_refuting_evidence_not_sought_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["evidence"]["refuting_evidence_sought"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CARD_NOT_COMPLETE")
        self.assertEqual(v["sections"]["claim_and_evidence"], "fail")

    def test_claim_not_restated_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["evidence"]["claim_restated_precisely"] = False
        self.assertEqual(evaluate(m)["verdict"], "CARD_NOT_COMPLETE")

    def test_strawmanned_opposition_fails_red_line(self):
        m = copy.deepcopy(COMPLETE)
        m["steelman"]["opposing_view_strawmanned"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CARD_NOT_COMPLETE")
        self.assertEqual(v["sections"]["steelman"], "fail")

    def test_counterargument_not_engaged_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["steelman"]["counterargument_engaged"] = False
        self.assertEqual(evaluate(m)["verdict"], "CARD_NOT_COMPLETE")

    def test_fallacy_coverage_missing_one_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["fallacies"]["checked"] = [
            f for f in m["fallacies"]["checked"]
            if f != "survivorship"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CARD_NOT_COMPLETE")
        self.assertEqual(v["fallacies_not_checked"], ["survivorship"])
        self.assertEqual(
            check_status(v, "all_stated_fallacies_checked"), "fail")

    def test_fallacy_empty_list_fails_not_missing(self):
        m = copy.deepcopy(COMPLETE)
        m["fallacies"]["checked"] = []
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CARD_NOT_COMPLETE")
        self.assertEqual(v["fallacies_not_checked"],
                         ["ad_hominem", "straw_man", "false_dilemma",
                          "appeal_to_authority_or_antiquity",
                          "survivorship", "motivated_reasoning",
                          "cherry_picked_windows"])

    def test_fallacy_unknown_entries_do_not_satisfy_coverage(self):
        m = copy.deepcopy(COMPLETE)
        m["fallacies"]["checked"] = ["bandwagon", "slippery_slope"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CARD_NOT_COMPLETE")
        self.assertEqual(len(v["fallacies_not_checked"]), 7)

    def test_missing_fallacy_list_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["fallacies"]["checked"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertIsNone(v["fallacies_not_checked"])

    def test_confidence_above_one_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["calibration"]["confidence_value"] = 1.4
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CARD_NOT_COMPLETE")
        self.assertEqual(
            check_status(v, "confidence_within_probability_bounds"),
            "fail")

    def test_confidence_at_bounds_passes(self):
        for value in (0, 1):
            m = copy.deepcopy(COMPLETE)
            m["calibration"]["confidence_value"] = value
            self.assertEqual(evaluate(m)["verdict"], "CARD_COMPLETE")

    def test_confidence_negative_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["calibration"]["confidence_value"] = -0.1
        self.assertEqual(evaluate(m)["verdict"], "CARD_NOT_COMPLETE")

    def test_outcomes_not_reviewed_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["calibration"]["outcomes_reviewed"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CARD_NOT_COMPLETE")
        self.assertEqual(v["sections"]["calibration"], "fail")

    def test_conclusion_from_authority_alone_fails_red_line(self):
        m = copy.deepcopy(COMPLETE)
        m["judgment"]["conclusion_from_vibes_or_authority_alone"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CARD_NOT_COMPLETE")
        self.assertEqual(v["sections"]["second_order_and_judgment"],
                         "fail")

    def test_certainty_outrunning_evidence_fails_red_line(self):
        m = copy.deepcopy(COMPLETE)
        m["judgment"]["certainty_outruns_evidence"] = True
        self.assertEqual(evaluate(m)["verdict"], "CARD_NOT_COMPLETE")

    def test_judgment_without_uncertainties_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["judgment"]["includes_key_uncertainties"] = False
        self.assertEqual(evaluate(m)["verdict"], "CARD_NOT_COMPLETE")

    def test_absent_evidence_is_insufficient_not_failed(self):
        m = copy.deepcopy(COMPLETE)
        del m["steelman"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["steelman"],
                         "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertIsNone(v["computed_status"])
        self.assertIsNone(v["reference_rate"])
        self.assertIsNone(v["base_rate_difference"])
        self.assertIsNone(v["fallacies_not_checked"])

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertIn("VERDICT: CARD_COMPLETE", stamp(v))

    def test_non_object_manifest_rejected(self):
        with self.assertRaises(TypeError):
            evaluate(["not", "a", "manifest"])


class MalformedTypeTests(unittest.TestCase):
    """F1 regression (external verification Wave 1): a documented
    field present with the wrong JSON type is rejected with
    ValueError naming the field — never evaluated into a verdict."""

    def test_top_level_string_field_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["claim"] = 12345
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("claim", str(ctx.exception))

    def test_section_as_string_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"evidence": "should-be-an-object"})
        self.assertIn("evidence", str(ctx.exception))

    def test_list_field_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["fallacies"]["checked"] = "ad_hominem"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("fallacies.checked", str(ctx.exception))

    def test_list_entry_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["fallacies"]["checked"] = ["ad_hominem", 42]
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("fallacies.checked[1]", str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["evidence"]["claim_restated_precisely"] = "yes"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("evidence.claim_restated_precisely",
                      str(ctx.exception))

    def test_numeric_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["base_rate"]["stated"] = "23%"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("base_rate.stated", str(ctx.exception))

    def test_numeric_leaf_as_boolean_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["calibration"]["confidence_value"] = True
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("calibration.confidence_value",
                      str(ctx.exception))

    def test_null_section_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["base_rate"] = None
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("base_rate", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
