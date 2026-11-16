import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from pump_conveyor_motor_suitability_check import evaluate, stamp  # noqa: E402

SUITABLE = {
    "asset": "P-101 / CV-201 drive train",
    "equipment_kind": "mixed",
    "duty": {"curve_or_profile_read": True,
             "operating_point_documented": True,
             "operating_point_within_limits": True,
             "operating_modes_defined": True},
    "drives": [
        {"id": "P-101", "kind": "pump",
         "required_power_kw": 75, "motor_rated_power_kw": 90,
         "required_running_torque_nm": 400, "motor_rated_torque_nm": 480,
         "npsh_available_m": 6.5, "npsh_required_m": 4.0,
         "operating_flow_m3h": 120, "minimum_flow_m3h": 30},
        {"id": "CV-201", "kind": "conveyor",
         "required_power_kw": 55, "motor_rated_power_kw": 75,
         "required_running_torque_nm": 300, "motor_rated_torque_nm": 360,
         "required_starting_torque_nm": 850,
         "motor_starting_torque_nm": 1100},
    ],
    "sizing": {"verified_against_curve_or_profile": True,
               "suitable_because_it_runs_only": False},
    "pump": {"minimum_flow_protection_set": True,
             "impeller_wear_trend_checked": True,
             "vfd_soft_start_reviewed": True},
    "conveyor": {"starting_study_considered": True,
                 "loaded_starts_holdback_considered": True,
                 "backstops_brake_interlocks_verified": True,
                 "sequence_interlock_review_done": True,
                 "belt_slip_jam_reviewed": True},
    "baselines": {"recorded_per_operating_mode": True,
                  "flow_head_current_pressure_recorded": True,
                  "compared_at_same_conditions": True},
    "interface": {"mechanical_data_in_asset_record": True,
                  "data_shared_single_source": True,
                  "changes_made": True,
                  "changes_revalidated": True},
    "protection": {"protection_changed_without_engineering_review": False},
}


class VerdictTests(unittest.TestCase):
    def test_suitable_manifest_is_suitable(self):
        v = evaluate(copy.deepcopy(SUITABLE))
        self.assertEqual(v["verdict"], "SUITABLE")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(v["suitability_status"],
                         "suitable_on_declared_values")
        self.assertEqual(len(v["checks"]), 26)

    def test_computed_margins_serialized_at_fixed_4dp(self):
        v = evaluate(copy.deepcopy(SUITABLE))
        self.assertEqual(v["min_power_margin_kw"], "15.0000")
        self.assertEqual(v["min_running_torque_margin_nm"], "60.0000")
        self.assertEqual(v["min_npsh_margin_m"], "2.5000")
        self.assertEqual(v["min_starting_torque_margin_nm"], "250.0000")

    def test_motor_power_below_required_fails(self):
        m = copy.deepcopy(SUITABLE)
        m["drives"][0]["motor_rated_power_kw"] = 70
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_SUITABLE")
        self.assertEqual(v["sections"]["motor_sizing"], "fail")
        self.assertEqual(v["suitability_status"],
                         "not_suitable_on_declared_values")
        self.assertEqual(v["min_power_margin_kw"], "-5.0000")

    def test_motor_torque_below_running_torque_fails(self):
        m = copy.deepcopy(SUITABLE)
        m["drives"][1]["required_running_torque_nm"] = 400
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_SUITABLE")
        self.assertEqual(v["suitability_status"],
                         "not_suitable_on_declared_values")

    def test_power_exactly_at_required_passes(self):
        m = copy.deepcopy(SUITABLE)
        m["drives"][0]["motor_rated_power_kw"] = 75
        v = evaluate(m)
        self.assertEqual(v["verdict"], "SUITABLE")
        self.assertEqual(v["min_power_margin_kw"], "0.0000")

    def test_incomplete_drive_entry_is_missing_not_failed(self):
        m = copy.deepcopy(SUITABLE)
        del m["drives"][0]["motor_rated_power_kw"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertIsNone(v["suitability_status"])
        self.assertIsNone(v["min_power_margin_kw"])

    def test_npsh_available_below_required_fails(self):
        m = copy.deepcopy(SUITABLE)
        m["drives"][0]["npsh_available_m"] = 3.5
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_SUITABLE")
        self.assertEqual(v["sections"]["pump_checks"], "fail")
        self.assertEqual(v["min_npsh_margin_m"], "-0.5000")

    def test_operating_flow_below_minimum_flow_fails(self):
        m = copy.deepcopy(SUITABLE)
        m["drives"][0]["operating_flow_m3h"] = 25
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_SUITABLE")
        self.assertEqual(v["sections"]["pump_checks"], "fail")

    def test_minimum_flow_protection_not_set_fails(self):
        m = copy.deepcopy(SUITABLE)
        m["pump"]["minimum_flow_protection_set"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_SUITABLE")
        self.assertEqual(v["sections"]["pump_checks"], "fail")

    def test_starting_torque_below_required_fails(self):
        m = copy.deepcopy(SUITABLE)
        m["drives"][1]["motor_starting_torque_nm"] = 800
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_SUITABLE")
        self.assertEqual(v["sections"]["conveyor_checks"], "fail")
        self.assertEqual(v["min_starting_torque_margin_nm"], "-50.0000")

    def test_no_starting_study_fails_conveyor(self):
        m = copy.deepcopy(SUITABLE)
        m["conveyor"]["starting_study_considered"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_SUITABLE")
        self.assertEqual(v["sections"]["conveyor_checks"], "fail")

    def test_backstops_not_verified_fails(self):
        m = copy.deepcopy(SUITABLE)
        m["conveyor"]["backstops_brake_interlocks_verified"] = False
        self.assertEqual(evaluate(m)["verdict"], "NOT_SUITABLE")

    def test_pump_only_kind_passes_conveyor_as_not_applicable(self):
        m = copy.deepcopy(SUITABLE)
        m["equipment_kind"] = "pump"
        m["drives"] = [m["drives"][0]]
        del m["conveyor"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "SUITABLE")
        self.assertIsNone(v["min_starting_torque_margin_nm"])
        self.assertEqual(v["suitability_status"],
                         "suitable_on_declared_values")

    def test_conveyor_only_kind_passes_pump_as_not_applicable(self):
        m = copy.deepcopy(SUITABLE)
        m["equipment_kind"] = "conveyor"
        m["drives"] = [m["drives"][1]]
        del m["pump"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "SUITABLE")
        self.assertIsNone(v["min_npsh_margin_m"])

    def test_missing_equipment_kind_is_insufficient(self):
        m = copy.deepcopy(SUITABLE)
        del m["equipment_kind"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertIsNone(v["suitability_status"])

    def test_curve_not_read_fails(self):
        m = copy.deepcopy(SUITABLE)
        m["duty"]["curve_or_profile_read"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_SUITABLE")
        self.assertEqual(v["sections"]["load_and_operating_point"], "fail")

    def test_operating_point_outside_limits_fails(self):
        m = copy.deepcopy(SUITABLE)
        m["duty"]["operating_point_within_limits"] = False
        self.assertEqual(evaluate(m)["verdict"], "NOT_SUITABLE")

    def test_it_runs_so_sizing_is_fine_fails_red_line(self):
        m = copy.deepcopy(SUITABLE)
        m["sizing"]["suitable_because_it_runs_only"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_SUITABLE")
        self.assertEqual(v["sections"]["motor_sizing"], "fail")

    def test_protection_change_without_review_fails_red_line(self):
        m = copy.deepcopy(SUITABLE)
        m["protection"]["protection_changed_without_engineering_review"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_SUITABLE")
        self.assertEqual(v["sections"]["interface_and_protection"], "fail")

    def test_interface_change_without_revalidation_fails(self):
        m = copy.deepcopy(SUITABLE)
        m["interface"]["changes_revalidated"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_SUITABLE")
        self.assertEqual(v["sections"]["interface_and_protection"], "fail")

    def test_no_interface_change_passes_revalidation_as_not_applicable(self):
        m = copy.deepcopy(SUITABLE)
        m["interface"]["changes_made"] = False
        del m["interface"]["changes_revalidated"]
        self.assertEqual(evaluate(m)["verdict"], "SUITABLE")

    def test_baselines_not_recorded_fails(self):
        m = copy.deepcopy(SUITABLE)
        m["baselines"]["recorded_per_operating_mode"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_SUITABLE")
        self.assertEqual(v["sections"]["baselines"], "fail")

    def test_absent_evidence_is_insufficient_not_failed(self):
        m = copy.deepcopy(SUITABLE)
        del m["baselines"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["baselines"],
                         "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertIsNone(v["suitability_status"])
        self.assertIsNone(v["min_power_margin_kw"])

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(SUITABLE))
        self.assertIn("VERDICT: SUITABLE", stamp(v))

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
            evaluate({"asset": "ERR-001", "equipment_kind": 123,
                      "duty": "invalid_string_instead_of_object"})
        self.assertIn("equipment_kind", str(ctx.exception))

    def test_equipment_kind_as_number_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"equipment_kind": 123})
        self.assertIn("equipment_kind", str(ctx.exception))

    def test_section_as_string_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"duty": "invalid_string_instead_of_object"})
        self.assertIn("duty", str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(SUITABLE)
        m["duty"]["curve_or_profile_read"] = "yes"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("duty.curve_or_profile_read", str(ctx.exception))

    def test_drives_as_string_rejected(self):
        m = copy.deepcopy(SUITABLE)
        m["drives"] = "P-101"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("drives", str(ctx.exception))

    def test_drive_entry_as_string_rejected(self):
        m = copy.deepcopy(SUITABLE)
        m["drives"][0] = "P-101"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("drives[0]", str(ctx.exception))

    def test_drive_rating_as_string_rejected(self):
        m = copy.deepcopy(SUITABLE)
        m["drives"][0]["required_power_kw"] = "75"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("drives[0].required_power_kw", str(ctx.exception))

    def test_drive_npsh_as_string_rejected(self):
        m = copy.deepcopy(SUITABLE)
        m["drives"][0]["npsh_available_m"] = "deep"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("drives[0].npsh_available_m", str(ctx.exception))

    def test_null_field_rejected(self):
        m = copy.deepcopy(SUITABLE)
        m["pump"] = None
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("pump", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
