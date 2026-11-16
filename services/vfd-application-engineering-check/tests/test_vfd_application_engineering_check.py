import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from vfd_application_engineering_check import evaluate, stamp  # noqa: E402

SOUND = {
    "asset": "VFD-201 / M-201 drive",
    "application": {"load_torque_type": "variable",
                    "overload_duty_declared": True,
                    "speed_range_declared": True,
                    "starts_per_hour": 6,
                    "environment_declared": True,
                    "selected_to_duty": True},
    "power_quality": {"harmonic_impact_estimated": True,
                      "harmonic_distortion_percent": 4.2,
                      "site_limit_percent": 5.0,
                      "mitigation_declared": True,
                      "capacitor_bank_interaction_reviewed": True,
                      "harmonics_per_site_standard": True},
    "cable": {"cable_length_m": 45, "oem_max_lead_length_m": 100,
              "motor_insulation_within_drive_limits": True,
              "dvdt_reflected_wave_reviewed": True,
              "inverter_duty_motor_assessed": True,
              "shaft_bearing_protection_reviewed": True},
    "drive": {"derated_current_a": 120, "required_load_current_a": 105},
    "protection": {"overload_model_configured": True,
                   "ground_fault_configured": True,
                   "over_under_voltage_configured": True,
                   "stall_configured": True,
                   "bypass_philosophy_documented": True,
                   "estop_interlocks_verified": True},
    "commissioning": {"parameter_sheet_completed_archived": True,
                      "motor_id_run_done": True,
                      "protections_tested_logically": True,
                      "ramps_limits_setpoints_documented": True,
                      "baseline_trends_recorded": True},
    "troubleshooting": {"open": True,
                        "fault_log_reviewed_first": True,
                        "typical_fault_causes_cross_checked": True,
                        "mechanical_causes_cross_checked": True,
                        "findings_documented": True},
    "records": {"parameter_backup_archived": True,
                "commissioning_sheet_archived": True,
                "firmware_version": "v4.2.1",
                "hipot_performed_on_drive_output": False,
                "protections_bypassed_without_documented_approval": False},
}


class VerdictTests(unittest.TestCase):
    def test_sound_manifest_is_sound(self):
        v = evaluate(copy.deepcopy(SOUND))
        self.assertEqual(v["verdict"], "SOUND")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(v["engineering_status"],
                         "sound_on_declared_values")
        self.assertEqual(len(v["checks"]), 37)

    def test_computed_margins_serialized_at_fixed_4dp(self):
        v = evaluate(copy.deepcopy(SOUND))
        self.assertEqual(v["harmonic_margin_percent"], "0.8000")
        self.assertEqual(v["cable_margin_m"], "55.0000")
        self.assertEqual(v["current_margin_a"], "15.0000")

    def test_harmonics_above_site_limit_fails(self):
        m = copy.deepcopy(SOUND)
        m["power_quality"]["harmonic_distortion_percent"] = 6.5
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_SOUND")
        self.assertEqual(v["sections"]["power_quality"], "fail")
        self.assertEqual(v["engineering_status"],
                         "not_sound_on_declared_values")
        self.assertEqual(v["harmonic_margin_percent"], "-1.5000")

    def test_harmonics_exactly_at_site_limit_passes(self):
        m = copy.deepcopy(SOUND)
        m["power_quality"]["harmonic_distortion_percent"] = 5.0
        v = evaluate(m)
        self.assertEqual(v["verdict"], "SOUND")
        self.assertEqual(v["harmonic_margin_percent"], "0.0000")

    def test_cable_length_above_oem_limit_fails(self):
        m = copy.deepcopy(SOUND)
        m["cable"]["cable_length_m"] = 120
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_SOUND")
        self.assertEqual(v["sections"]["motor_cable_drive"], "fail")
        self.assertEqual(v["cable_margin_m"], "-20.0000")

    def test_cable_length_exactly_at_oem_limit_passes(self):
        m = copy.deepcopy(SOUND)
        m["cable"]["cable_length_m"] = 100
        self.assertEqual(evaluate(m)["verdict"], "SOUND")

    def test_derated_current_below_required_fails(self):
        m = copy.deepcopy(SOUND)
        m["drive"]["derated_current_a"] = 100
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_SOUND")
        self.assertEqual(v["sections"]["motor_cable_drive"], "fail")
        self.assertEqual(v["current_margin_a"], "-5.0000")

    def test_derated_current_exactly_at_required_passes(self):
        m = copy.deepcopy(SOUND)
        m["drive"]["derated_current_a"] = 105
        v = evaluate(m)
        self.assertEqual(v["verdict"], "SOUND")
        self.assertEqual(v["current_margin_a"], "0.0000")

    def test_missing_computed_value_is_missing_not_failed(self):
        m = copy.deepcopy(SOUND)
        del m["cable"]["oem_max_lead_length_m"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertIsNone(v["engineering_status"])
        self.assertIsNone(v["cable_margin_m"])

    def test_non_numeric_computed_value_fails(self):
        # F1 correction (coordinator ruling, 2026-11-15): this test
        # previously asserted a NOT_SOUND verdict over a wrong-typed
        # documented field — that assertion encoded the F1 defect
        # itself. A non-numeric cable_length_m is invalid input and
        # is now rejected with ValueError naming the field.
        m = copy.deepcopy(SOUND)
        m["cable"]["cable_length_m"] = "long"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("cable.cable_length_m", str(ctx.exception))

    def test_invalid_torque_type_fails(self):
        m = copy.deepcopy(SOUND)
        m["application"]["load_torque_type"] = "unknown"
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_SOUND")
        self.assertEqual(v["sections"]["application_profile"], "fail")

    def test_constant_torque_type_passes(self):
        m = copy.deepcopy(SOUND)
        m["application"]["load_torque_type"] = "constant"
        self.assertEqual(evaluate(m)["verdict"], "SOUND")

    def test_starts_per_hour_non_numeric_fails(self):
        # F1 correction (coordinator ruling, 2026-11-15): this test
        # previously asserted a NOT_SOUND verdict over a wrong-typed
        # documented field — that assertion encoded the F1 defect
        # itself (it is the recorded external malformed case). A
        # non-numeric starts_per_hour is invalid input and is now
        # rejected with ValueError naming the field.
        m = copy.deepcopy(SOUND)
        m["application"]["starts_per_hour"] = "many"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("application.starts_per_hour", str(ctx.exception))

    def test_not_selected_to_duty_fails(self):
        m = copy.deepcopy(SOUND)
        m["application"]["selected_to_duty"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_SOUND")
        self.assertEqual(v["sections"]["application_profile"], "fail")

    def test_capacitor_interaction_not_reviewed_fails(self):
        m = copy.deepcopy(SOUND)
        m["power_quality"]["capacitor_bank_interaction_reviewed"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_SOUND")
        self.assertEqual(v["sections"]["power_quality"], "fail")

    def test_shaft_bearing_protection_not_reviewed_fails(self):
        m = copy.deepcopy(SOUND)
        m["cable"]["shaft_bearing_protection_reviewed"] = False
        self.assertEqual(evaluate(m)["verdict"], "NOT_SOUND")

    def test_estop_not_verified_fails(self):
        m = copy.deepcopy(SOUND)
        m["protection"]["estop_interlocks_verified"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_SOUND")
        self.assertEqual(v["sections"]["protection_and_control"], "fail")

    def test_protections_set_but_not_tested_fails(self):
        m = copy.deepcopy(SOUND)
        m["commissioning"]["protections_tested_logically"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_SOUND")
        self.assertEqual(v["sections"]["commissioning"], "fail")

    def test_motor_id_run_not_done_fails(self):
        m = copy.deepcopy(SOUND)
        m["commissioning"]["motor_id_run_done"] = False
        self.assertEqual(evaluate(m)["verdict"], "NOT_SOUND")

    def test_troubleshooting_closed_passes_as_not_applicable(self):
        m = copy.deepcopy(SOUND)
        m["troubleshooting"] = {"open": False}
        v = evaluate(m)
        self.assertEqual(v["verdict"], "SOUND")
        self.assertEqual(v["sections"]["troubleshooting"], "pass")

    def test_troubleshooting_open_without_fault_log_fails(self):
        m = copy.deepcopy(SOUND)
        m["troubleshooting"]["fault_log_reviewed_first"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_SOUND")
        self.assertEqual(v["sections"]["troubleshooting"], "fail")

    def test_troubleshooting_gate_absent_is_insufficient(self):
        m = copy.deepcopy(SOUND)
        del m["troubleshooting"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["troubleshooting"],
                         "insufficient_evidence")

    def test_hipot_on_drive_output_fails_red_line(self):
        m = copy.deepcopy(SOUND)
        m["records"]["hipot_performed_on_drive_output"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_SOUND")
        self.assertEqual(v["sections"]["records_and_red_lines"], "fail")

    def test_protection_bypass_without_approval_fails_red_line(self):
        m = copy.deepcopy(SOUND)
        m["records"]["protections_bypassed_without_documented_approval"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_SOUND")
        self.assertEqual(v["sections"]["records_and_red_lines"], "fail")

    def test_firmware_version_empty_fails(self):
        m = copy.deepcopy(SOUND)
        m["records"]["firmware_version"] = ""
        self.assertEqual(evaluate(m)["verdict"], "NOT_SOUND")

    def test_absent_evidence_is_insufficient_not_failed(self):
        m = copy.deepcopy(SOUND)
        del m["commissioning"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["commissioning"],
                         "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertIsNone(v["engineering_status"])
        self.assertIsNone(v["harmonic_margin_percent"])
        self.assertIsNone(v["cable_margin_m"])
        self.assertIsNone(v["current_margin_a"])

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
            evaluate({"asset": "VFD-004",
                      "application": {"starts_per_hour": "not-a-number"}})
        self.assertIn("application.starts_per_hour", str(ctx.exception))

    def test_section_as_string_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"application": "should-be-an-object"})
        self.assertIn("application", str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(SOUND)
        m["protection"]["stall_configured"] = "yes"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("protection.stall_configured", str(ctx.exception))

    def test_numeric_leaf_as_string_rejected(self):
        m = copy.deepcopy(SOUND)
        m["power_quality"]["harmonic_distortion_percent"] = "high"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("power_quality.harmonic_distortion_percent",
                      str(ctx.exception))

    def test_firmware_version_as_number_rejected(self):
        m = copy.deepcopy(SOUND)
        m["records"]["firmware_version"] = 12345
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("records.firmware_version", str(ctx.exception))

    def test_null_field_rejected(self):
        m = copy.deepcopy(SOUND)
        m["drive"] = None
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("drive", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
