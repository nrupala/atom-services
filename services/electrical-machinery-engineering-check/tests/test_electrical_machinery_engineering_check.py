import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from electrical_machinery_engineering_check import evaluate, stamp  # noqa: E402

SOUND = {
    "machine": "pump-motor-P101",
    "duty": {"load_torque_profile": "constant", "starts_per_hour": 6,
             "ambient_c": 40, "altitude_m": 1000,
             "worst_case_identified": True},
    "sizing": {"worst_case_torque_nm": 850, "rated_torque_nm": 1000,
               "worst_case_power_kw": 140, "rated_power_kw": 160,
               "service_factor": 1.15, "starting_current_a": 900,
               "supply_capability_a": 1200,
               "efficiency_at_actual_load_percent": 95.2},
    "specification": {"machine_type": "induction",
                      "insulation_class": "F", "enclosure": "TEFC",
                      "bearings_specified": True,
                      "space_heaters_specified": True,
                      "rtds_specified": True,
                      "vibration_limits_specified": True,
                      "standards_cited": True},
    "tests": {"criteria_defined_before_tests": True,
              "criteria_from_standards_and_oem": True,
              "insulation_resistance_tested": True,
              "pi_dar_trends_recorded": True,
              "winding_resistance_balance_checked": True,
              "surge_comparison_done": True,
              "no_load_and_load_runs_done": True,
              "results_recorded_with_units": True,
              "instruments_and_calibration_recorded": True},
    "failure": {"investigation_open": True,
                "evidence_organized_into_timeline": True,
                "operating_history_included": True,
                "typical_failure_modes_considered": True},
    "trending": {"per_asset_baseline_exists": True,
                 "like_for_like_comparison": True,
                 "deltas_compared": True},
    "records": {"nameplate_and_serial_verified": True,
                "re_energized_after_insulation_or_winding_anomaly_without_review": False,
                "anomalies_flagged": True,
                "asset_records_updated": True,
                "deviations_logged_with_actions": True},
}


class VerdictTests(unittest.TestCase):
    def test_sound_manifest_is_sound(self):
        v = evaluate(copy.deepcopy(SOUND))
        self.assertEqual(v["verdict"], "SOUND")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(len(v["checks"]), 38)

    def test_worst_case_torque_above_rating_fails_sizing(self):
        m = copy.deepcopy(SOUND)
        m["sizing"]["worst_case_torque_nm"] = 1200
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_SOUND")
        self.assertEqual(v["sections"]["sizing"], "fail")

    def test_worst_case_power_above_rating_fails_sizing(self):
        m = copy.deepcopy(SOUND)
        m["sizing"]["worst_case_power_kw"] = 200
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_SOUND")
        self.assertEqual(v["sections"]["sizing"], "fail")

    def test_starting_current_above_supply_capability_fails(self):
        m = copy.deepcopy(SOUND)
        m["sizing"]["starting_current_a"] = 1500
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_SOUND")
        self.assertEqual(v["sections"]["sizing"], "fail")

    def test_unknown_torque_profile_fails_duty(self):
        m = copy.deepcopy(SOUND)
        m["duty"]["load_torque_profile"] = "steady"
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_SOUND")
        self.assertEqual(v["sections"]["duty"], "fail")

    def test_unknown_machine_type_fails_specification(self):
        m = copy.deepcopy(SOUND)
        m["specification"]["machine_type"] = "dc"
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_SOUND")
        self.assertEqual(v["sections"]["specification"], "fail")

    def test_unknown_enclosure_fails_specification(self):
        m = copy.deepcopy(SOUND)
        m["specification"]["enclosure"] = "open"
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_SOUND")
        self.assertEqual(v["sections"]["specification"], "fail")

    def test_missing_service_factor_is_insufficient_not_failed(self):
        m = copy.deepcopy(SOUND)
        del m["sizing"]["service_factor"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["sizing"],
                         "insufficient_evidence")

    def test_non_numeric_torque_is_rejected(self):
        # Corrected under the coordinator's F1 ruling (was
        # test_non_numeric_torque_fails_the_computed_check,
        # asserting a NOT_SOUND verdict over a wrong-typed
        # documented field): a non-numeric worst_case_torque_nm
        # is a type violation, rejected before any verdict is
        # computed.
        m = copy.deepcopy(SOUND)
        m["sizing"]["worst_case_torque_nm"] = "high"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("sizing.worst_case_torque_nm",
                      str(ctx.exception))

    def test_criteria_defined_after_tests_fail_acceptance(self):
        m = copy.deepcopy(SOUND)
        m["tests"]["criteria_defined_before_tests"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_SOUND")
        self.assertEqual(v["sections"]["acceptance_tests"], "fail")

    def test_open_investigation_without_timeline_is_insufficient(self):
        m = copy.deepcopy(SOUND)
        del m["failure"]["evidence_organized_into_timeline"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["failure_analysis"],
                         "insufficient_evidence")

    def test_no_investigation_passes_failure_analysis_as_na(self):
        m = copy.deepcopy(SOUND)
        m["failure"] = {"investigation_open": False}
        v = evaluate(m)
        self.assertEqual(v["verdict"], "SOUND")
        self.assertEqual(v["sections"]["failure_analysis"], "pass")

    def test_reenergize_after_anomaly_without_review_fails(self):
        m = copy.deepcopy(SOUND)
        m["records"][
            "re_energized_after_insulation_or_winding_anomaly_without_review"
        ] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_SOUND")
        self.assertEqual(v["sections"]["records_and_safety"], "fail")

    def test_unverified_nameplate_fails_records_and_safety(self):
        m = copy.deepcopy(SOUND)
        m["records"]["nameplate_and_serial_verified"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_SOUND")
        self.assertEqual(v["sections"]["records_and_safety"], "fail")

    def test_absent_evidence_is_insufficient_not_failed(self):
        m = copy.deepcopy(SOUND)
        del m["trending"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["trending"],
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
            evaluate({"machine": "Motor-004",
                      "duty": "invalid_string_instead_of_object"})
        self.assertIn("duty", str(ctx.exception))

    def test_number_leaf_as_string_rejected(self):
        m = copy.deepcopy(SOUND)
        m["duty"]["starts_per_hour"] = "six"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("duty.starts_per_hour", str(ctx.exception))

    def test_boolean_leaf_as_number_rejected(self):
        m = copy.deepcopy(SOUND)
        m["records"]["anomalies_flagged"] = 1
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("records.anomalies_flagged", str(ctx.exception))

    def test_null_section_rejected(self):
        m = copy.deepcopy(SOUND)
        m["sizing"] = None
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("sizing", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
