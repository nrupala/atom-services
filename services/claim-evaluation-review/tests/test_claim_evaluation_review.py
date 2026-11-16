import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from claim_evaluation_review import evaluate, stamp  # noqa: E402


def _claim(label, restated=True, supporting=True, refuting=True,
           presence=True):
    return {"label": label, "restated_precisely": restated,
            "supporting_evidence_sought": supporting,
            "refuting_evidence_sought": refuting,
            "evidence_presence_assessed": presence}


COMPLETE = {
    "entity": "Vendor pitch claim set Q4",
    "claims": [_claim("claim_1"), _claim("claim_2"), _claim("claim_3")],
    "hierarchy": {"evidence_ranked_by_hierarchy": True,
                  "conflicts_noted": True,
                  "conflict_reasons_and_incentives_examined": True,
                  "conclusions_from_vibes_or_authority_alone": False},
    "base_rates": {"considered_first": True,
                   "reference_class_identified": True,
                   "used_where_applicable": True,
                   "base_rate_percent": 30},
    "steelman": {"strongest_counterargument_constructed": True,
                 "strongest_counterargument_engaged": True,
                 "straw_manning_in_own_favor": False},
    "fallacy_screen": {"fallacies_checked": [
        "ad_hominem", "straw_man", "false_dilemma",
        "appeal_to_authority", "appeal_to_antiquity",
        "survivorship_stories", "motivated_reasoning",
        "cherry_picked_windows"]},
    "calibration": {"confidence_stated": True,
                    "confidence_percent": 80,
                    "outcomes_reviewed": True,
                    "hit_rate_tracked_by_confidence_band": True,
                    "outcomes_correct": 7,
                    "outcomes_total": 10,
                    "declared_hit_rate_percent": 70,
                    "certainty_outruns_evidence": False},
    "second_order": {"second_order_thinking_applied": True},
    "judgment": {"judgment_written": True,
                 "judgment_includes_key_uncertainties": True,
                 "judgment_checkable_later": True},
}


def check_status(v, name):
    return next(c["status"] for c in v["checks"] if c["check"] == name)


class VerdictTests(unittest.TestCase):
    def test_complete_manifest_is_complete(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(v["verdict"], "CLAIM_EVALUATION_COMPLETE")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(v["computed_status"],
                         "within_stated_limits_on_declared_evidence")
        self.assertEqual(len(v["checks"]), 26)
        self.assertEqual(v["claims_evaluated"], 3)
        self.assertEqual(v["base_rate_percent"], "30.000000")
        self.assertEqual(v["confidence_percent"], "80.000000")
        self.assertEqual(v["computed_hit_rate_percent"], "70.000000")
        self.assertEqual(v["hit_rate_difference"], "0.000000")
        self.assertEqual(v["fallacies_not_checked"], [])

    def test_single_claim_passes_no_minimum_claim_count(self):
        m = copy.deepcopy(COMPLETE)
        m["claims"] = [_claim("only")]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CLAIM_EVALUATION_COMPLETE")
        self.assertEqual(v["claims_evaluated"], 1)

    def test_claim_not_restated_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["claims"][1]["restated_precisely"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CLAIM_EVALUATION_NOT_COMPLETE")
        self.assertEqual(v["sections"]["claim_set_and_evidence"], "fail")
        self.assertEqual(
            check_status(v, "all_claims_restated_precisely"), "fail")
        self.assertEqual(v["computed_status"],
                         "outside_stated_limits_on_declared_evidence")

    def test_refuting_evidence_not_sought_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["claims"][0]["refuting_evidence_sought"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v, "all_claims_supporting_and_refuting_evidence_sought"),
            "fail")

    def test_evidence_presence_not_assessed_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["claims"][2]["evidence_presence_assessed"] = False
        self.assertEqual(
            check_status(evaluate(m),
                         "all_claims_evidence_presence_assessed"),
            "fail")

    def test_missing_claims_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["claims"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "all_claims_restated_precisely"), "missing")
        self.assertEqual(v["claims_evaluated"], 0)
        self.assertIsNone(v["computed_status"])

    def test_empty_claims_list_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        m["claims"] = []
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "claim_entries_complete"), "missing")

    def test_incomplete_claim_entry_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["claims"][1]["refuting_evidence_sought"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "claim_entries_complete"), "missing")
        self.assertEqual(v["claims_evaluated"], 2)

    def test_empty_label_claim_entry_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        m["claims"][0]["label"] = ""
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "claim_entries_complete"), "missing")
        self.assertEqual(v["claims_evaluated"], 2)

    def test_hierarchy_not_ranked_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["hierarchy"]["evidence_ranked_by_hierarchy"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CLAIM_EVALUATION_NOT_COMPLETE")
        self.assertEqual(
            v["sections"]["evidence_hierarchy_and_conflicts"], "fail")

    def test_conflict_incentives_not_examined_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["hierarchy"]["conflict_reasons_and_incentives_examined"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "CLAIM_EVALUATION_NOT_COMPLETE")

    def test_conclusions_from_vibes_or_authority_fails_red_line(self):
        m = copy.deepcopy(COMPLETE)
        m["hierarchy"]["conclusions_from_vibes_or_authority_alone"] = True
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v, "no_conclusions_from_vibes_or_authority_alone"),
            "fail")

    def test_base_rates_not_first_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["base_rates"]["considered_first"] = False
        v = evaluate(m)
        self.assertEqual(v["sections"]["base_rates_and_reference_class"],
                         "fail")

    def test_base_rate_percent_over_100_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["base_rates"]["base_rate_percent"] = 130
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "base_rate_percent_within_percent_range"),
            "fail")
        self.assertEqual(v["base_rate_percent"], "130.000000")

    def test_base_rate_percent_negative_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["base_rates"]["base_rate_percent"] = -5
        self.assertEqual(
            check_status(evaluate(m),
                         "base_rate_percent_within_percent_range"),
            "fail")

    def test_base_rate_at_bounds_passes(self):
        for value in (0, 100):
            m = copy.deepcopy(COMPLETE)
            m["base_rates"]["base_rate_percent"] = value
            self.assertEqual(evaluate(m)["verdict"],
                             "CLAIM_EVALUATION_COMPLETE")

    def test_missing_base_rate_percent_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["base_rates"]["base_rate_percent"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertIsNone(v["base_rate_percent"])

    def test_steelman_not_constructed_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["steelman"]["strongest_counterargument_constructed"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "CLAIM_EVALUATION_NOT_COMPLETE")

    def test_steelman_not_engaged_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["steelman"]["strongest_counterargument_engaged"] = False
        v = evaluate(m)
        self.assertEqual(v["sections"]["steelman_and_fallacy_screen"],
                         "fail")

    def test_straw_manning_in_own_favor_fails_red_line(self):
        m = copy.deepcopy(COMPLETE)
        m["steelman"]["straw_manning_in_own_favor"] = True
        self.assertEqual(
            check_status(evaluate(m), "no_straw_manning_in_own_favor"),
            "fail")

    def test_fallacy_coverage_missing_one_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["fallacy_screen"]["fallacies_checked"] = [
            f for f in m["fallacy_screen"]["fallacies_checked"]
            if f != "cherry_picked_windows"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CLAIM_EVALUATION_NOT_COMPLETE")
        self.assertEqual(v["fallacies_not_checked"],
                         ["cherry_picked_windows"])
        self.assertEqual(
            check_status(v, "fallacy_screen_covers_stated_fallacies"),
            "fail")

    def test_fallacy_empty_list_fails_not_missing(self):
        m = copy.deepcopy(COMPLETE)
        m["fallacy_screen"]["fallacies_checked"] = []
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CLAIM_EVALUATION_NOT_COMPLETE")
        self.assertEqual(len(v["fallacies_not_checked"]), 8)

    def test_fallacy_unknown_entries_do_not_satisfy_coverage(self):
        m = copy.deepcopy(COMPLETE)
        m["fallacy_screen"]["fallacies_checked"] = ["hasty", "tu_quoque"]
        v = evaluate(m)
        self.assertEqual(len(v["fallacies_not_checked"]), 8)

    def test_missing_fallacy_list_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["fallacy_screen"]["fallacies_checked"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertIsNone(v["fallacies_not_checked"])

    def test_confidence_not_stated_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["calibration"]["confidence_stated"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "CLAIM_EVALUATION_NOT_COMPLETE")

    def test_confidence_percent_over_100_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["calibration"]["confidence_percent"] = 101
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "confidence_percent_within_percent_range"),
            "fail")

    def test_confidence_at_other_percent_passes(self):
        m = copy.deepcopy(COMPLETE)
        m["calibration"]["confidence_percent"] = 55
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CLAIM_EVALUATION_COMPLETE")
        self.assertEqual(v["confidence_percent"], "55.000000")

    def test_hit_rate_mismatch_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["calibration"]["declared_hit_rate_percent"] = 60
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CLAIM_EVALUATION_NOT_COMPLETE")
        self.assertEqual(
            check_status(
                v, "declared_hit_rate_matches_correct_divided_by_total"),
            "fail")
        self.assertEqual(v["hit_rate_difference"], "-10.000000")
        self.assertEqual(v["computed_hit_rate_percent"], "70.000000")

    def test_hit_rate_at_other_values_passes(self):
        m = copy.deepcopy(COMPLETE)
        m["calibration"].update(
            {"outcomes_correct": 1, "outcomes_total": 4,
             "declared_hit_rate_percent": 25})
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CLAIM_EVALUATION_COMPLETE")
        self.assertEqual(v["computed_hit_rate_percent"], "25.000000")

    def test_zero_outcomes_total_fails_hit_rate(self):
        m = copy.deepcopy(COMPLETE)
        m["calibration"].update(
            {"outcomes_correct": 0, "outcomes_total": 0,
             "declared_hit_rate_percent": 0})
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CLAIM_EVALUATION_NOT_COMPLETE")
        self.assertIsNone(v["computed_hit_rate_percent"])
        self.assertIsNone(v["hit_rate_difference"])

    def test_missing_hit_rate_number_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["calibration"]["declared_hit_rate_percent"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["computed_hit_rate_percent"], "70.000000")
        self.assertIsNone(v["hit_rate_difference"])

    def test_outcomes_not_reviewed_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["calibration"]["outcomes_reviewed"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "CLAIM_EVALUATION_NOT_COMPLETE")

    def test_certainty_outrunning_evidence_fails_red_line(self):
        m = copy.deepcopy(COMPLETE)
        m["calibration"]["certainty_outruns_evidence"] = True
        v = evaluate(m)
        self.assertEqual(v["sections"]["calibration"], "fail")
        self.assertEqual(
            check_status(v, "certainty_does_not_outrun_evidence"),
            "fail")

    def test_second_order_not_applied_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["second_order"]["second_order_thinking_applied"] = False
        v = evaluate(m)
        self.assertEqual(v["sections"]["second_order_and_judgment"],
                         "fail")

    def test_judgment_not_written_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["judgment"]["judgment_written"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "CLAIM_EVALUATION_NOT_COMPLETE")

    def test_judgment_without_uncertainties_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["judgment"]["judgment_includes_key_uncertainties"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "CLAIM_EVALUATION_NOT_COMPLETE")

    def test_absent_section_is_insufficient_not_failed(self):
        m = copy.deepcopy(COMPLETE)
        del m["fallacy_screen"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["steelman_and_fallacy_screen"],
                         "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertIsNone(v["computed_status"])
        self.assertEqual(v["claims_evaluated"], 0)
        self.assertIsNone(v["base_rate_percent"])
        self.assertIsNone(v["confidence_percent"])
        self.assertIsNone(v["computed_hit_rate_percent"])
        self.assertIsNone(v["fallacies_not_checked"])

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertIn("VERDICT: CLAIM_EVALUATION_COMPLETE", stamp(v))

    def test_non_object_manifest_rejected(self):
        with self.assertRaises(TypeError):
            evaluate(["not", "a", "manifest"])


class MalformedTypeTests(unittest.TestCase):
    """F1 regression: a documented field present with the wrong
    JSON type is rejected with ValueError naming the field."""

    def test_top_level_string_field_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["entity"] = 12345
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("entity", str(ctx.exception))

    def test_section_as_string_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"hierarchy": "should-be-an-object"})
        self.assertIn("hierarchy", str(ctx.exception))

    def test_claims_list_as_object_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["claims"] = {"label": "claim_1"}
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("claims", str(ctx.exception))

    def test_claim_entry_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["claims"][0] = "claim_1"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("claims[0]", str(ctx.exception))

    def test_claim_label_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["claims"][0]["label"] = 1
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("claims[0].label", str(ctx.exception))

    def test_claim_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["claims"][1]["restated_precisely"] = "yes"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("claims[1].restated_precisely", str(ctx.exception))

    def test_list_field_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["fallacy_screen"]["fallacies_checked"] = "ad_hominem"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("fallacy_screen.fallacies_checked",
                      str(ctx.exception))

    def test_list_entry_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["fallacy_screen"]["fallacies_checked"] = ["ad_hominem", 42]
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("fallacy_screen.fallacies_checked[1]",
                      str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["hierarchy"]["conflicts_noted"] = "yes"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("hierarchy.conflicts_noted", str(ctx.exception))

    def test_numeric_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["calibration"]["confidence_percent"] = "80"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("calibration.confidence_percent",
                      str(ctx.exception))

    def test_numeric_leaf_as_boolean_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["base_rates"]["base_rate_percent"] = True
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("base_rates.base_rate_percent", str(ctx.exception))

    def test_null_section_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["calibration"] = None
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("calibration", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
