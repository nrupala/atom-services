import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from forecast_confidence_scoreboard import evaluate, stamp  # noqa: E402

# Hand-computed from the ledger below:
# ana: n=4, mean_p=0.625, hit=0.75, gap=0.125, brier=0.1125, rank 1
# bo:  n=4, mean_p=0.7,   hit=0.5,  gap=0.2,   brier=0.465,  rank 3
# cy:  n=2, mean_p=0.5,   hit=0.5,  gap=0.0,   brier=0.25,   rank 2
# overall: n=10, mean_p=0.63, hit=0.6, gap=0.03, brier=0.281,
# direction overconfident, worst calibrated = bo
COMPLETE = {
    "subject": "product-forecasters-2026",
    "record": {"resolution_criteria_predeclared": True,
               "forecasts_recorded_before_resolution": True,
               "unresolved_forecasts_excluded": True},
    "forecasts": [
        {"forecaster": "ana", "claim": "launch ships in March",
         "stated_probability": 0.8, "outcome": 1},
        {"forecaster": "ana", "claim": "churn stays under 5 percent",
         "stated_probability": 0.6, "outcome": 1},
        {"forecaster": "ana", "claim": "enterprise deal closes",
         "stated_probability": 0.4, "outcome": 0},
        {"forecaster": "ana", "claim": "beta fills in two weeks",
         "stated_probability": 0.7, "outcome": 1},
        {"forecaster": "bo", "claim": "revenue target is met",
         "stated_probability": 0.9, "outcome": 0},
        {"forecaster": "bo", "claim": "hire is made by June",
         "stated_probability": 0.8, "outcome": 0},
        {"forecaster": "bo", "claim": "pilot converts",
         "stated_probability": 0.6, "outcome": 1},
        {"forecaster": "bo", "claim": "grant is awarded",
         "stated_probability": 0.5, "outcome": 1},
        {"forecaster": "cy", "claim": "release slips past May",
         "stated_probability": 0.5, "outcome": 1},
        {"forecaster": "cy", "claim": "partner signs the LOI",
         "stated_probability": 0.5, "outcome": 0},
    ],
    "scoreboard": [
        {"forecaster": "ana", "forecasts_count": 4,
         "mean_stated_probability": 0.625, "hit_rate": 0.75,
         "calibration_gap": 0.125, "brier_score": 0.1125, "rank": 1},
        {"forecaster": "bo", "forecasts_count": 4,
         "mean_stated_probability": 0.7, "hit_rate": 0.5,
         "calibration_gap": 0.2, "brier_score": 0.465, "rank": 3},
        {"forecaster": "cy", "forecasts_count": 2,
         "mean_stated_probability": 0.5, "hit_rate": 0.5,
         "calibration_gap": 0.0, "brier_score": 0.25, "rank": 2},
    ],
    "confidence_reporting": {
        "calibration_reported_per_forecaster": True,
        "outputs_are_probabilities": True,
        "calibration_reported_not_just_ranking": True,
        "worst_forecaster_surfaced": True},
    "scoreboard_use": {"decision_stated": True,
                       "decision_costs_considered": True},
    "honesty": {"metric_chosen_to_flatter_present": False,
                "silent_score_rewrites_present": False,
                "scores_refreshed_as_outcomes_resolve": True},
}


def check_status(v, name):
    return next(c["status"] for c in v["checks"] if c["check"] == name)


class VerdictTests(unittest.TestCase):
    def test_complete_manifest_is_sound(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(v["verdict"], "CONFIDENCE_SCOREBOARD_SOUND")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(len(v["checks"]), 26)
        self.assertEqual(v["computed_status"],
                         "within_stated_limits_on_declared_evidence")
        self.assertEqual(v["forecasts_count"], 10)
        self.assertEqual(v["forecasters_count"], 3)
        self.assertEqual(v["overall_mean_stated_probability"], "0.630000")
        self.assertEqual(v["overall_hit_rate"], "0.600000")
        self.assertEqual(v["overall_calibration_gap"], "0.030000")
        self.assertEqual(v["overall_brier_score"], "0.281000")
        self.assertEqual(v["calibration_direction"], "overconfident")
        self.assertEqual(v["worst_calibrated_forecaster"], "bo")
        self.assertEqual(v["forecasters_without_scoreboard_row"], [])
        self.assertEqual(v["scoreboard_rows_without_forecasts"], [])
        self.assertEqual(v["mismatched_scoreboard_rows"], [])
        self.assertEqual(v["forecasters_with_wrong_rank"], [])

    def test_resolution_criteria_not_predeclared_fails_ledger_section(self):
        m = copy.deepcopy(COMPLETE)
        m["record"]["resolution_criteria_predeclared"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CONFIDENCE_SCOREBOARD_NOT_SOUND")
        self.assertEqual(v["sections"]["ledger_and_resolution"], "fail")

    def test_forecast_recorded_after_resolution_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["record"]["forecasts_recorded_before_resolution"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "CONFIDENCE_SCOREBOARD_NOT_SOUND")

    def test_probability_out_of_range_fails_and_is_not_scored(self):
        m = copy.deepcopy(COMPLETE)
        m["forecasts"][0]["stated_probability"] = 1.5
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CONFIDENCE_SCOREBOARD_NOT_SOUND")
        self.assertEqual(
            check_status(v, "every_forecast_probability_in_range"),
            "fail")
        # the invalid entry drops out of the overall aggregates:
        # remaining 9 entries, mean (6.3-0.8)/9, hit (6-1)/9
        self.assertEqual(v["overall_mean_stated_probability"], "0.611111")
        self.assertEqual(v["overall_hit_rate"], "0.555556")

    def test_nonbinary_outcome_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["forecasts"][1]["outcome"] = 2
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_forecast_outcome_binary"), "fail")
        self.assertEqual(v["verdict"], "CONFIDENCE_SCOREBOARD_NOT_SOUND")

    def test_forecast_without_forecaster_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["forecasts"][0]["forecaster"] = ""
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_forecast_names_forecaster"), "fail")

    def test_forecast_missing_claim_field_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["forecasts"][0]["claim"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "every_forecast_states_claim"), "missing")

    def test_empty_forecasts_list_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["forecasts"] = []
        v = evaluate(m)
        self.assertEqual(check_status(v, "forecasts_declared"), "fail")
        self.assertEqual(v["forecasts_count"], 0)
        self.assertEqual(v["forecasters_count"], 0)
        self.assertIsNone(v["overall_mean_stated_probability"])
        self.assertIsNone(v["calibration_direction"])
        self.assertIsNone(v["worst_calibrated_forecaster"])

    def test_scoreboard_missing_a_forecaster_fails_coverage(self):
        m = copy.deepcopy(COMPLETE)
        del m["scoreboard"][2]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CONFIDENCE_SCOREBOARD_NOT_SOUND")
        self.assertEqual(
            check_status(v, "scoreboard_covers_every_forecaster"), "fail")
        self.assertEqual(v["forecasters_without_scoreboard_row"], ["cy"])

    def test_scoreboard_row_without_forecasts_fails_coverage(self):
        m = copy.deepcopy(COMPLETE)
        m["scoreboard"].append(
            {"forecaster": "di", "forecasts_count": 0,
             "mean_stated_probability": 0.5, "hit_rate": 0.5,
             "calibration_gap": 0.0, "brier_score": 0.25, "rank": 4})
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "scoreboard_covers_every_forecaster"), "fail")
        self.assertEqual(v["scoreboard_rows_without_forecasts"], ["di"])

    def test_wrong_forecast_count_fails_and_row_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["scoreboard"][0]["forecasts_count"] = 5
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v, "every_scoreboard_forecast_count_matches_ledger"),
            "fail")
        self.assertEqual(v["mismatched_scoreboard_rows"], ["ana"])
        self.assertEqual(v["computed_status"],
                         "outside_stated_limits_on_declared_evidence")

    def test_wrong_mean_probability_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["scoreboard"][1]["mean_stated_probability"] = 0.65
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_scoreboard_mean_probability_matches"),
            "fail")
        self.assertEqual(v["mismatched_scoreboard_rows"], ["bo"])

    def test_wrong_hit_rate_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["scoreboard"][0]["hit_rate"] = 0.5
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_scoreboard_hit_rate_matches"), "fail")

    def test_wrong_brier_score_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["scoreboard"][2]["brier_score"] = 0.2
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_scoreboard_brier_score_matches"),
            "fail")

    def test_wrong_calibration_gap_fails_calibration_section(self):
        m = copy.deepcopy(COMPLETE)
        m["scoreboard"][1]["calibration_gap"] = 0.05
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CONFIDENCE_SCOREBOARD_NOT_SOUND")
        self.assertEqual(v["sections"]["calibration_reporting"], "fail")
        self.assertEqual(
            check_status(v, "every_scoreboard_calibration_gap_matches"),
            "fail")

    def test_aggregate_missing_field_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["scoreboard"][0]["brier_score"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "every_scoreboard_brier_score_matches"),
            "missing")

    def test_duplicate_ranks_fail(self):
        m = copy.deepcopy(COMPLETE)
        m["scoreboard"][2]["rank"] = 1
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "scoreboard_ranks_complete_and_unique"),
            "fail")

    def test_ranking_not_matching_brier_order_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["scoreboard"][1]["rank"] = 2
        m["scoreboard"][2]["rank"] = 3
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CONFIDENCE_SCOREBOARD_NOT_SOUND")
        self.assertEqual(v["sections"]["ranking_integrity"], "fail")
        self.assertEqual(
            check_status(v, "scoreboard_ranking_matches_brier_order"),
            "fail")
        self.assertEqual(v["forecasters_with_wrong_rank"], ["bo", "cy"])

    def test_calibration_not_reported_per_forecaster_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["confidence_reporting"]["calibration_reported_per_forecaster"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "calibration_reported_per_forecaster"),
            "fail")
        self.assertEqual(v["verdict"], "CONFIDENCE_SCOREBOARD_NOT_SOUND")

    def test_worst_forecaster_not_surfaced_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["confidence_reporting"]["worst_forecaster_surfaced"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "CONFIDENCE_SCOREBOARD_NOT_SOUND")

    def test_metric_chosen_to_flatter_fails_honesty_section(self):
        m = copy.deepcopy(COMPLETE)
        m["honesty"]["metric_chosen_to_flatter_present"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CONFIDENCE_SCOREBOARD_NOT_SOUND")
        self.assertEqual(v["sections"]["honesty_and_live_use"], "fail")
        self.assertEqual(
            check_status(v, "no_metric_chosen_to_flatter"), "fail")

    def test_silent_score_rewrites_fail(self):
        m = copy.deepcopy(COMPLETE)
        m["honesty"]["silent_score_rewrites_present"] = True
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "no_silent_score_rewrites"), "fail")
        self.assertEqual(v["verdict"], "CONFIDENCE_SCOREBOARD_NOT_SOUND")

    def test_scores_not_refreshed_fail(self):
        m = copy.deepcopy(COMPLETE)
        m["honesty"]["scores_refreshed_as_outcomes_resolve"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "CONFIDENCE_SCOREBOARD_NOT_SOUND")

    def test_decision_not_stated_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["scoreboard_use"]["decision_stated"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "CONFIDENCE_SCOREBOARD_NOT_SOUND")

    def test_exact_calibration_direction(self):
        m = copy.deepcopy(COMPLETE)
        m["forecasts"] = [
            {"forecaster": "cy", "claim": "a",
             "stated_probability": 0.5, "outcome": 1},
            {"forecaster": "cy", "claim": "b",
             "stated_probability": 0.5, "outcome": 0},
        ]
        m["scoreboard"] = [
            {"forecaster": "cy", "forecasts_count": 2,
             "mean_stated_probability": 0.5, "hit_rate": 0.5,
             "calibration_gap": 0.0, "brier_score": 0.25, "rank": 1},
        ]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CONFIDENCE_SCOREBOARD_SOUND")
        self.assertEqual(v["calibration_direction"], "exact")
        self.assertEqual(v["worst_calibrated_forecaster"], "cy")

    def test_underconfident_direction_is_reported_not_failed(self):
        m = copy.deepcopy(COMPLETE)
        m["forecasts"][4]["stated_probability"] = 0.1
        m["forecasts"][5]["stated_probability"] = 0.2
        # bo: mean (0.1+0.2+0.6+0.5)/4=0.35, hit 0.5, gap 0.15,
        # brier (0.01+0.04+0.16+0.25)/4=0.115 -> rank 2;
        # ana brier 0.1125 rank 1; cy rank 3
        m["scoreboard"][1].update(
            {"mean_stated_probability": 0.35, "calibration_gap": 0.15,
             "brier_score": 0.115, "rank": 2})
        m["scoreboard"][2]["rank"] = 3
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CONFIDENCE_SCOREBOARD_SOUND")
        self.assertEqual(v["calibration_direction"], "underconfident")
        self.assertEqual(v["worst_calibrated_forecaster"], "bo")

    def test_absent_evidence_is_insufficient_not_failed(self):
        m = copy.deepcopy(COMPLETE)
        del m["confidence_reporting"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["calibration_reporting"],
                         "insufficient_evidence")

    def test_sparse_manifest_is_insufficient_evidence(self):
        v = evaluate({"subject": "thin-board",
                      "forecasts": [
                          {"forecaster": "ana", "claim": "x",
                           "stated_probability": 0.5, "outcome": 1}]})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["forecasts_count"], 1)
        self.assertEqual(v["overall_brier_score"], "0.250000")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertTrue(
            all(c["status"] == "missing" for c in v["checks"]))
        self.assertIsNone(v["computed_status"])
        self.assertIsNone(v["forecasts_count"])
        self.assertIsNone(v["forecasters_count"])
        self.assertIsNone(v["overall_mean_stated_probability"])
        self.assertIsNone(v["overall_hit_rate"])
        self.assertIsNone(v["overall_calibration_gap"])
        self.assertIsNone(v["overall_brier_score"])
        self.assertIsNone(v["calibration_direction"])
        self.assertIsNone(v["worst_calibrated_forecaster"])
        self.assertIsNone(v["forecasters_without_scoreboard_row"])
        self.assertIsNone(v["scoreboard_rows_without_forecasts"])
        self.assertIsNone(v["mismatched_scoreboard_rows"])
        self.assertIsNone(v["forecasters_with_wrong_rank"])

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertIn("VERDICT: CONFIDENCE_SCOREBOARD_SOUND", stamp(v))

    def test_non_object_manifest_rejected(self):
        with self.assertRaises(TypeError):
            evaluate(["not", "a", "manifest"])


class MalformedTypeTests(unittest.TestCase):
    """F1 regression: a documented field present with the wrong
    JSON type is rejected with TypeError naming the field."""

    def test_string_field_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["subject"] = 12345
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("subject", str(ctx.exception))

    def test_object_section_as_string_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"record": "should-be-an-object"})
        self.assertIn("record", str(ctx.exception))

    def test_list_field_as_object_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"forecasts": {"forecaster": "ana"}})
        self.assertIn("forecasts", str(ctx.exception))

    def test_list_entry_as_string_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"forecasts": ["ana"]})
        self.assertIn("forecasts[0]", str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["record"]["resolution_criteria_predeclared"] = "yes"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("record.resolution_criteria_predeclared",
                      str(ctx.exception))

    def test_number_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["forecasts"][0]["stated_probability"] = "0.8"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("forecasts[0].stated_probability",
                      str(ctx.exception))

    def test_nested_list_entry_number_field_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["scoreboard"][1]["rank"] = "first"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("scoreboard[1].rank", str(ctx.exception))

    def test_boolean_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["forecasts"][0]["outcome"] = True
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("forecasts[0].outcome", str(ctx.exception))

    def test_null_section_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["honesty"] = None
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("honesty", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
