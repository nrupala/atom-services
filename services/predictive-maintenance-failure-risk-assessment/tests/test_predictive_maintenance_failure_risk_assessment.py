import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from predictive_maintenance_failure_risk_assessment import (  # noqa: E402
    evaluate,
    stamp,
)

SOUND = {
    "asset": "main air compressor motor, plant 2",
    "strategy": {"asset_criticality_assessed": True,
                 "failure_cost_assessed": True,
                 "matched_to_criticality_and_failure_cost": True,
                 "pdm_justified_for_asset": True},
    "pf_curve": {"detectable_point_identified": True,
                 "detection_early_in_window": True,
                 "planning_runway_sufficient": True},
    "monitoring": {"techniques_matched_to_failure_modes": True,
                   "sensor_coverage_covers_failure_modes": True,
                   "operating_parameters_monitored": True},
    "prediction": {"healthy_baseline_established": True,
                   "anomaly_detection_or_rul_in_place": True,
                   "fault_labels_available_or_imbalance_handled": True,
                   "uncertainty_reported": True,
                   "thresholds_tuned_to_missed_failure_vs_false_alarm_cost":
                   True},
    "reliability": {"fmea_completed": True,
                    "prioritised_by_severity_occurrence_detectability": True,
                    "rcm_strategy_per_failure_mode": True,
                    "mtbf_mttr_tracked": True,
                    "fmea_and_engineering_judgement_not_replaced": True},
    "integration": {"sensor_quality_and_calibration_verified": True,
                    "leakage_label_scarcity_and_drift_watched": True,
                    "edge_vs_cloud_inference_decided": True,
                    "work_orders_closed_into_cmms": True},
}


class VerdictTests(unittest.TestCase):
    def test_sound_manifest_is_assessment_sound(self):
        v = evaluate(copy.deepcopy(SOUND))
        self.assertEqual(v["verdict"], "ASSESSMENT_SOUND")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(len(v["checks"]), 24)

    def test_criticality_not_assessed_fails_strategy(self):
        m = copy.deepcopy(SOUND)
        m["strategy"]["asset_criticality_assessed"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "ASSESSMENT_UNSOUND")
        self.assertEqual(v["sections"]["strategy_fit"], "fail")

    def test_pdm_on_unjustified_asset_fails(self):
        m = copy.deepcopy(SOUND)
        m["strategy"]["pdm_justified_for_asset"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "ASSESSMENT_UNSOUND")
        self.assertEqual(v["sections"]["strategy_fit"], "fail")

    def test_strategy_not_matched_to_failure_cost_fails(self):
        m = copy.deepcopy(SOUND)
        m["strategy"]["matched_to_criticality_and_failure_cost"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "ASSESSMENT_UNSOUND")

    def test_detectable_point_not_identified_fails_pf_window(self):
        m = copy.deepcopy(SOUND)
        m["pf_curve"]["detectable_point_identified"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "ASSESSMENT_UNSOUND")
        self.assertEqual(v["sections"]["pf_window"], "fail")

    def test_detection_late_in_window_fails(self):
        m = copy.deepcopy(SOUND)
        m["pf_curve"]["detection_early_in_window"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "ASSESSMENT_UNSOUND")
        self.assertEqual(v["sections"]["pf_window"], "fail")

    def test_techniques_not_matched_to_failure_modes_fails(self):
        m = copy.deepcopy(SOUND)
        m["monitoring"]["techniques_matched_to_failure_modes"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "ASSESSMENT_UNSOUND")
        self.assertEqual(v["sections"]["condition_monitoring"], "fail")

    def test_operating_parameters_not_monitored_fails(self):
        m = copy.deepcopy(SOUND)
        m["monitoring"]["operating_parameters_monitored"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "ASSESSMENT_UNSOUND")

    def test_no_healthy_baseline_fails_prediction(self):
        m = copy.deepcopy(SOUND)
        m["prediction"]["healthy_baseline_established"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "ASSESSMENT_UNSOUND")
        self.assertEqual(v["sections"]["prediction"], "fail")

    def test_fault_classification_without_labels_fails(self):
        m = copy.deepcopy(SOUND)
        m["prediction"]["fault_labels_available_or_imbalance_handled"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "ASSESSMENT_UNSOUND")
        self.assertEqual(v["sections"]["prediction"], "fail")

    def test_thresholds_ignoring_false_alarm_cost_fails(self):
        m = copy.deepcopy(SOUND)
        m["prediction"][
            "thresholds_tuned_to_missed_failure_vs_false_alarm_cost"
        ] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "ASSESSMENT_UNSOUND")

    def test_uncertainty_not_reported_fails(self):
        m = copy.deepcopy(SOUND)
        m["prediction"]["uncertainty_reported"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "ASSESSMENT_UNSOUND")

    def test_no_fmea_fails_reliability(self):
        m = copy.deepcopy(SOUND)
        m["reliability"]["fmea_completed"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "ASSESSMENT_UNSOUND")
        self.assertEqual(v["sections"]["reliability_frame"], "fail")

    def test_no_rpn_prioritisation_fails(self):
        m = copy.deepcopy(SOUND)
        m["reliability"][
            "prioritised_by_severity_occurrence_detectability"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "ASSESSMENT_UNSOUND")

    def test_black_box_replacing_judgement_fails(self):
        m = copy.deepcopy(SOUND)
        m["reliability"][
            "fmea_and_engineering_judgement_not_replaced"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "ASSESSMENT_UNSOUND")
        self.assertEqual(v["sections"]["reliability_frame"], "fail")

    def test_uncalibrated_sensors_fail_integration(self):
        m = copy.deepcopy(SOUND)
        m["integration"]["sensor_quality_and_calibration_verified"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "ASSESSMENT_UNSOUND")
        self.assertEqual(v["sections"]["data_and_integration"], "fail")

    def test_open_loop_work_orders_fail(self):
        m = copy.deepcopy(SOUND)
        m["integration"]["work_orders_closed_into_cmms"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "ASSESSMENT_UNSOUND")

    def test_absent_evidence_is_insufficient_not_failed(self):
        m = copy.deepcopy(SOUND)
        del m["reliability"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["reliability_frame"],
                         "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(SOUND))
        self.assertIn("VERDICT: ASSESSMENT_SOUND", stamp(v))

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
            evaluate({"asset": 12345,
                      "strategy": "invalid_string_instead_of_object"})
        self.assertIn("asset", str(ctx.exception))

    def test_asset_as_number_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"asset": 12345})
        self.assertIn("asset", str(ctx.exception))

    def test_section_as_string_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"strategy": "invalid_string_instead_of_object"})
        self.assertIn("strategy", str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(SOUND)
        m["reliability"]["fmea_completed"] = "yes"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("reliability.fmea_completed", str(ctx.exception))

    def test_boolean_leaf_as_number_rejected(self):
        m = copy.deepcopy(SOUND)
        m["prediction"]["uncertainty_reported"] = 1
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("prediction.uncertainty_reported",
                      str(ctx.exception))

    def test_null_section_rejected(self):
        m = copy.deepcopy(SOUND)
        m["integration"] = None
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("integration", str(ctx.exception))

    def test_null_leaf_rejected(self):
        m = copy.deepcopy(SOUND)
        m["strategy"]["failure_cost_assessed"] = None
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("strategy.failure_cost_assessed",
                      str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
