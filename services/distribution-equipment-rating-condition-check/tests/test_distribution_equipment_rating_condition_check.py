import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from distribution_equipment_rating_condition_check import evaluate, stamp  # noqa: E402

SOUND = {
    "lineup": "MSB-1 lineup",
    "ratings": {"fault_study_current": True, "gaps_documented": True},
    "equipment": [
        {"id": "MSB-1", "interrupting_rating_ka": 65,
         "available_fault_current_ka": 42,
         "continuous_current_rating_a": 2000, "load_current_a": 1450},
        {"id": "MCC-1", "interrupting_rating_ka": 42,
         "available_fault_current_ka": 38,
         "continuous_current_rating_a": 1200, "load_current_a": 900},
    ],
    "mcc": {"section_bus_rating_verified": True,
            "starter_types_recorded": True,
            "segregation_and_barriers_verified": True,
            "heat_load_assessed": True,
            "planned_spare_capacity_recorded": True,
            "labeling_matches_lineup_drawing": True},
    "switchgear": {"breaker_relay_schemes_verified": True,
                   "ct_ratios_and_wiring_checked": True,
                   "trip_tests_per_plan": True,
                   "interlock_function_tests_done": True,
                   "torque_checks_per_oem": True},
    "transformers": [
        {"id": "TX-1", "nameplate_kva": 1500, "load_kva": 1100,
         "top_oil_temp_c": 68, "top_oil_limit_c": 85,
         "winding_temp_c": 84, "winding_limit_c": 105,
         "paralleled": True, "vector_group_match": True,
         "ratio_match": True, "impedance_match": True},
        {"id": "TX-2", "nameplate_kva": 1500, "load_kva": 950,
         "top_oil_temp_c": 61, "top_oil_limit_c": 85,
         "winding_temp_c": 77, "winding_limit_c": 105,
         "paralleled": True, "vector_group_match": True,
         "ratio_match": True, "impedance_match": True},
    ],
    "transformer": {"tap_positions_recorded": True,
                    "harmonic_rich_load": True,
                    "k_factor_assessed": True},
    "condition": {"oil_dga_screening_on_schedule": True,
                  "ir_scans_done": True,
                  "audible_corona_logged_vs_baseline": True},
    "coordination": {"settings_labels_study_aligned": True,
                     "equipment_changed": True,
                     "study_refresh_flagged": True,
                     "test_records_complete_with_instruments_and_calibration": True,
                     "energized_work_outside_permit_system": False},
}


class VerdictTests(unittest.TestCase):
    def test_sound_manifest_is_sound(self):
        v = evaluate(copy.deepcopy(SOUND))
        self.assertEqual(v["verdict"], "RATING_CONDITION_SOUND")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(v["rating_status"], "within_declared_ratings")
        self.assertEqual(len(v["checks"]), 27)

    def test_interrupting_rating_below_fault_current_fails(self):
        m = copy.deepcopy(SOUND)
        m["equipment"][0]["interrupting_rating_ka"] = 40
        v = evaluate(m)
        self.assertEqual(v["verdict"], "RATING_CONDITION_UNSOUND")
        self.assertEqual(v["sections"]["ratings_vs_fault_study"], "fail")
        self.assertEqual(v["rating_status"], "exceeded")

    def test_continuous_rating_below_load_fails(self):
        m = copy.deepcopy(SOUND)
        m["equipment"][1]["load_current_a"] = 1300
        v = evaluate(m)
        self.assertEqual(v["verdict"], "RATING_CONDITION_UNSOUND")
        self.assertEqual(v["rating_status"], "exceeded")

    def test_incomplete_equipment_entry_is_missing_not_failed(self):
        m = copy.deepcopy(SOUND)
        del m["equipment"][0]["interrupting_rating_ka"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertIsNone(v["rating_status"])

    def test_mcc_labeling_mismatch_fails(self):
        m = copy.deepcopy(SOUND)
        m["mcc"]["labeling_matches_lineup_drawing"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "RATING_CONDITION_UNSOUND")
        self.assertEqual(v["sections"]["mcc_specifics"], "fail")

    def test_torque_not_per_oem_fails_switchgear(self):
        m = copy.deepcopy(SOUND)
        m["switchgear"]["torque_checks_per_oem"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "RATING_CONDITION_UNSOUND")
        self.assertEqual(v["sections"]["switchgear_specifics"], "fail")

    def test_transformer_overload_fails(self):
        m = copy.deepcopy(SOUND)
        m["transformers"][0]["load_kva"] = 1600
        v = evaluate(m)
        self.assertEqual(v["verdict"], "RATING_CONDITION_UNSOUND")
        self.assertEqual(v["sections"]["transformers"], "fail")
        self.assertEqual(v["rating_status"], "exceeded")

    def test_transformer_temperature_over_declared_limit_fails(self):
        m = copy.deepcopy(SOUND)
        m["transformers"][1]["winding_temp_c"] = 110
        v = evaluate(m)
        self.assertEqual(v["verdict"], "RATING_CONDITION_UNSOUND")
        self.assertEqual(v["rating_status"], "exceeded")

    def test_paralleling_impedance_mismatch_fails(self):
        m = copy.deepcopy(SOUND)
        m["transformers"][0]["impedance_match"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "RATING_CONDITION_UNSOUND")
        self.assertEqual(v["sections"]["transformers"], "fail")

    def test_not_paralleled_passes_paralleling_check(self):
        m = copy.deepcopy(SOUND)
        for entry in m["transformers"]:
            entry["paralleled"] = False
            del entry["vector_group_match"]
            del entry["ratio_match"]
            del entry["impedance_match"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "RATING_CONDITION_SOUND")

    def test_harmonic_load_without_k_factor_fails(self):
        m = copy.deepcopy(SOUND)
        m["transformer"]["k_factor_assessed"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "RATING_CONDITION_UNSOUND")

    def test_no_harmonic_load_passes_k_factor_as_not_applicable(self):
        m = copy.deepcopy(SOUND)
        m["transformer"]["harmonic_rich_load"] = False
        del m["transformer"]["k_factor_assessed"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "RATING_CONDITION_SOUND")

    def test_dga_off_schedule_fails_condition(self):
        m = copy.deepcopy(SOUND)
        m["condition"]["oil_dga_screening_on_schedule"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "RATING_CONDITION_UNSOUND")
        self.assertEqual(v["sections"]["condition_awareness"], "fail")

    def test_equipment_change_without_study_refresh_fails(self):
        m = copy.deepcopy(SOUND)
        m["coordination"]["study_refresh_flagged"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "RATING_CONDITION_UNSOUND")
        self.assertEqual(v["sections"]["coordination_and_safety"], "fail")

    def test_energized_work_outside_permit_fails(self):
        m = copy.deepcopy(SOUND)
        m["coordination"]["energized_work_outside_permit_system"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "RATING_CONDITION_UNSOUND")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertIsNone(v["rating_status"])

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(SOUND))
        self.assertIn("VERDICT: RATING_CONDITION_SOUND", stamp(v))

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
            evaluate({"lineup": "Malformed-Input",
                      "ratings": "invalid_string_instead_of_object"})
        self.assertIn("ratings", str(ctx.exception))

    def test_ratings_as_string_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"ratings": "invalid_string_instead_of_object"})
        self.assertIn("ratings", str(ctx.exception))

    def test_lineup_as_number_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"lineup": 12345})
        self.assertIn("lineup", str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(SOUND)
        m["ratings"]["fault_study_current"] = "yes"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("ratings.fault_study_current", str(ctx.exception))

    def test_list_field_as_string_rejected(self):
        m = copy.deepcopy(SOUND)
        m["equipment"] = "not-a-list"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("equipment", str(ctx.exception))

    def test_equipment_entry_number_as_string_rejected(self):
        m = copy.deepcopy(SOUND)
        m["equipment"][0]["interrupting_rating_ka"] = "65"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("equipment[0].interrupting_rating_ka",
                      str(ctx.exception))

    def test_transformer_entry_number_as_string_rejected(self):
        m = copy.deepcopy(SOUND)
        m["transformers"][0]["load_kva"] = "1100"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("transformers[0].load_kva", str(ctx.exception))

    def test_null_field_rejected(self):
        m = copy.deepcopy(SOUND)
        m["ratings"] = None
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("ratings", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
