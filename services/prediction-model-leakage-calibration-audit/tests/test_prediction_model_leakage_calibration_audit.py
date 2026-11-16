import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from prediction_model_leakage_calibration_audit import evaluate, stamp  # noqa: E402

SOUND = {
    "model": "churn-v3",
    "prediction_time": 100,
    "target": {"defined": True, "horizon_declared": True,
               "decision_defined": True,
               "metric_chosen_from_decision_costs": True},
    "baseline": {"computed": True, "evaluated_on_same_holdout": True},
    "holdout": {"model_score": 0.82, "baseline_score": 0.71,
                "metric_direction": "higher_is_better",
                "untouched": True},
    "validation": {"split_strategy_documented": True,
                   "temporal_data": True, "split_type": "time_based",
                   "peeking_at_validation": False},
    "features": [
        {"name": "tenure_days", "available_at": 90,
         "derived_from_target": False},
        {"name": "last_login_gap", "available_at": 100,
         "derived_from_target": False},
    ],
    "approach": {"simple_model_tried_first": True,
                 "complexity_justified": True,
                 "outputs_probabilities": True,
                 "action_thresholds_from_decision_costs": True},
    "calibration": {
        "reported": True, "max_tolerated_error": 0.05,
        "observations": [
            {"predicted": 0.7, "outcome": 1},
            {"predicted": 0.7, "outcome": 1},
            {"predicted": 0.3, "outcome": 0},
            {"predicted": 0.3, "outcome": 0},
        ],
    },
    "evaluation": {
        "segment_errors_reported": True, "max_segment_error": 0.2,
        "segments": [
            {"name": "new_users", "error": 0.18},
            {"name": "long_tenure", "error": 0.09},
        ],
    },
    "drift": {"monitoring_in_place": True,
              "feedback_loops_identified": True,
              "retraining_policy_defined": True},
    "deployment": {"versioned_model_and_card": True,
                   "rollback_path_defined": True,
                   "silent_updates_in_production": False},
}


class VerdictTests(unittest.TestCase):
    def test_sound_manifest_is_audit_sound(self):
        v = evaluate(copy.deepcopy(SOUND))
        self.assertEqual(v["verdict"], "PREDICTION_AUDIT_SOUND")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(v["holdout_improvement"], "0.1100")
        self.assertEqual(v["mean_predicted"], "0.5000")
        self.assertEqual(v["mean_observed"], "0.5000")
        self.assertEqual(v["calibration_error"], "0.0000")
        self.assertEqual(v["worst_segment"], "new_users")

    def test_model_not_beating_baseline_fails(self):
        m = copy.deepcopy(SOUND)
        m["holdout"]["model_score"] = 0.70
        v = evaluate(m)
        self.assertEqual(v["verdict"], "PREDICTION_AUDIT_UNSOUND")
        self.assertEqual(v["sections"]["baseline_and_holdout"], "fail")
        self.assertEqual(v["holdout_improvement"], "-0.0100")

    def test_equal_scores_do_not_beat_baseline(self):
        m = copy.deepcopy(SOUND)
        m["holdout"]["model_score"] = 0.71
        v = evaluate(m)
        self.assertEqual(v["verdict"], "PREDICTION_AUDIT_UNSOUND")
        self.assertEqual(v["holdout_improvement"], "0.0000")

    def test_lower_is_better_direction(self):
        m = copy.deepcopy(SOUND)
        m["holdout"] = {"model_score": 0.21, "baseline_score": 0.34,
                        "metric_direction": "lower_is_better",
                        "untouched": True}
        v = evaluate(m)
        self.assertEqual(v["verdict"], "PREDICTION_AUDIT_SOUND")
        self.assertEqual(v["holdout_improvement"], "0.1300")

    def test_invalid_metric_direction_fails(self):
        m = copy.deepcopy(SOUND)
        m["holdout"]["metric_direction"] = "sideways"
        v = evaluate(m)
        self.assertEqual(v["verdict"], "PREDICTION_AUDIT_UNSOUND")
        self.assertIsNone(v["holdout_improvement"])

    def test_random_split_for_temporal_data_is_red_line_fail(self):
        m = copy.deepcopy(SOUND)
        m["validation"]["split_type"] = "random"
        v = evaluate(m)
        self.assertEqual(v["verdict"], "PREDICTION_AUDIT_UNSOUND")
        self.assertEqual(v["sections"]["leakage_and_validation"], "fail")

    def test_random_split_for_non_temporal_data_passes(self):
        m = copy.deepcopy(SOUND)
        m["validation"]["temporal_data"] = False
        m["validation"]["split_type"] = "random"
        v = evaluate(m)
        self.assertEqual(v["verdict"], "PREDICTION_AUDIT_SOUND")

    def test_future_feature_is_leakage_fail(self):
        m = copy.deepcopy(SOUND)
        m["features"][0]["available_at"] = 101
        v = evaluate(m)
        self.assertEqual(v["verdict"], "PREDICTION_AUDIT_UNSOUND")
        self.assertEqual(v["sections"]["leakage_and_validation"], "fail")

    def test_feature_at_prediction_time_passes(self):
        m = copy.deepcopy(SOUND)
        m["features"][0]["available_at"] = 100
        v = evaluate(m)
        self.assertEqual(v["verdict"], "PREDICTION_AUDIT_SOUND")

    def test_target_derived_feature_fails(self):
        m = copy.deepcopy(SOUND)
        m["features"][1]["derived_from_target"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "PREDICTION_AUDIT_UNSOUND")

    def test_feature_missing_timestamp_is_missing(self):
        m = copy.deepcopy(SOUND)
        del m["features"][0]["available_at"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["leakage_and_validation"],
                         "insufficient_evidence")

    def test_validation_peeking_fails(self):
        m = copy.deepcopy(SOUND)
        m["validation"]["peeking_at_validation"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "PREDICTION_AUDIT_UNSOUND")

    def test_overconfident_calibration_fails(self):
        m = copy.deepcopy(SOUND)
        m["calibration"]["observations"] = [
            {"predicted": 0.9, "outcome": 0},
            {"predicted": 0.9, "outcome": 0},
            {"predicted": 0.9, "outcome": 1},
            {"predicted": 0.9, "outcome": 0},
        ]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "PREDICTION_AUDIT_UNSOUND")
        self.assertEqual(v["mean_predicted"], "0.9000")
        self.assertEqual(v["mean_observed"], "0.2500")
        self.assertEqual(v["calibration_error"], "0.6500")

    def test_calibration_at_tolerance_boundary_passes(self):
        m = copy.deepcopy(SOUND)
        m["calibration"]["observations"] = [
            {"predicted": 0.5625, "outcome": 1},
            {"predicted": 0.5625, "outcome": 0},
        ]
        m["calibration"]["max_tolerated_error"] = 0.0625
        v = evaluate(m)
        self.assertEqual(v["calibration_error"], "0.0625")
        self.assertEqual(v["verdict"], "PREDICTION_AUDIT_SOUND")

    def test_calibration_probability_out_of_range_fails(self):
        m = copy.deepcopy(SOUND)
        m["calibration"]["observations"][0]["predicted"] = 1.4
        v = evaluate(m)
        self.assertEqual(v["verdict"], "PREDICTION_AUDIT_UNSOUND")

    def test_segment_over_declared_max_fails_and_is_worst(self):
        m = copy.deepcopy(SOUND)
        m["evaluation"]["segments"][1]["error"] = 0.25
        v = evaluate(m)
        self.assertEqual(v["verdict"], "PREDICTION_AUDIT_UNSOUND")
        self.assertEqual(v["worst_segment"], "long_tenure")

    def test_no_baseline_fails(self):
        m = copy.deepcopy(SOUND)
        m["baseline"]["computed"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "PREDICTION_AUDIT_UNSOUND")
        self.assertEqual(v["sections"]["baseline_and_holdout"], "fail")

    def test_metric_not_from_decision_costs_fails(self):
        m = copy.deepcopy(SOUND)
        m["target"]["metric_chosen_from_decision_costs"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "PREDICTION_AUDIT_UNSOUND")
        self.assertEqual(v["sections"]["target_and_decision"], "fail")

    def test_silent_updates_are_red_line_fail(self):
        m = copy.deepcopy(SOUND)
        m["deployment"]["silent_updates_in_production"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "PREDICTION_AUDIT_UNSOUND")
        self.assertEqual(v["sections"]["drift_and_deployment"], "fail")

    def test_no_drift_monitoring_fails(self):
        m = copy.deepcopy(SOUND)
        m["drift"]["monitoring_in_place"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "PREDICTION_AUDIT_UNSOUND")

    def test_absent_evidence_is_insufficient_not_failed(self):
        m = copy.deepcopy(SOUND)
        del m["drift"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["drift_and_deployment"],
                         "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertIsNone(v["holdout_improvement"])
        self.assertIsNone(v["calibration_error"])
        self.assertIsNone(v["worst_segment"])

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(SOUND))
        self.assertIn("VERDICT: PREDICTION_AUDIT_SOUND", stamp(v))

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
            evaluate({"model": 123,
                      "prediction_time": "not-a-number"})
        self.assertIn("model", str(ctx.exception))

    def test_model_as_number_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"model": 123})
        self.assertIn("model", str(ctx.exception))

    def test_prediction_time_as_string_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"prediction_time": "not-a-number"})
        self.assertIn("prediction_time", str(ctx.exception))

    def test_numeric_leaf_as_string_rejected(self):
        m = copy.deepcopy(SOUND)
        m["holdout"]["model_score"] = "high"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("holdout.model_score", str(ctx.exception))

    def test_list_field_as_string_rejected(self):
        m = copy.deepcopy(SOUND)
        m["features"] = "not-a-list"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("features", str(ctx.exception))

    def test_list_entry_field_as_string_rejected(self):
        m = copy.deepcopy(SOUND)
        m["features"][0]["available_at"] = "later"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("features[0].available_at", str(ctx.exception))

    def test_nested_list_entry_field_as_string_rejected(self):
        m = copy.deepcopy(SOUND)
        m["calibration"]["observations"][0]["predicted"] = "likely"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("calibration.observations[0].predicted",
                      str(ctx.exception))

    def test_null_field_rejected(self):
        m = copy.deepcopy(SOUND)
        m["prediction_time"] = None
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("prediction_time", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
