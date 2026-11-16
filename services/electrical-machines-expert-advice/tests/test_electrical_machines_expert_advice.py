import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from electrical_machines_expert_advice import evaluate, stamp  # noqa: E402

SOUND = {
    "advice_id": "advice-2026-041",
    "engagement": {"question_or_problem_stated": True,
                   "operating_context_stated": True,
                   "assumptions_stated_explicitly": True,
                   "protection_and_safety_not_handwaved": True},
    "machine": {"machine_family": "induction",
                "full_load_current_a": 100,
                "starting_current_a": 620,
                "induction_slip_or_equivalent_circuit_addressed": True,
                "induction_torque_speed_addressed": True,
                "induction_losses_or_efficiency_addressed": True},
    "drives": {"vfd_involved": True,
               "control_mode": "sensorless_vector",
               "harmonics_addressed": True,
               "reflected_wave_dvdt_addressed": True,
               "bearing_currents_addressed": True,
               "cable_charging_addressed": True},
    "protection": {"protection_in_scope": True,
                   "selectivity_coordination_addressed": True,
                   "primary_and_backup_addressed": True,
                   "ansi_device_numbers": ["50", "51", "49"],
                   "ct_pt_selection_saturation_burden_addressed": True,
                   "idmt_curves_and_grading_addressed": True,
                   "final_settings_deferred_to_study": True,
                   "settings_published_as_fact": False},
    "standards": {"applicable_standards_named": True,
                  "standards_applicability_reasons_stated": True,
                  "hazardous_area_involved": True,
                  "hazloc_zone_or_division_stated": True,
                  "hazloc_gas_group_and_temp_class_stated": True,
                  "hazloc_ex_method_and_certification_stated": True},
    "calculations": {"calculations_relied_upon": True,
                     "short_circuit_addressed": True,
                     "motor_starting_voltage_dip_addressed": True,
                     "grounding_addressed": True,
                     "load_flow_addressed": True,
                     "arc_flash_addressed": True},
    "documents": {"document_review_in_scope": True,
                  "sow_addressed": True,
                  "sdrl_addressed": True,
                  "sqrl_addressed": True,
                  "supplier_qualification_addressed": True,
                  "going_public": True,
                  "public_sanitization_applied": True},
}


class VerdictTests(unittest.TestCase):
    def test_sound_manifest_is_sound(self):
        v = evaluate(copy.deepcopy(SOUND))
        self.assertEqual(v["verdict"], "SOUND")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(len(v["checks"]), 44)

    def test_starting_multiple_recorded_not_graded(self):
        # 6.200000 x FLA in the evidence; a very different multiple
        # still passes — the skill states ~6x with no tolerance.
        m = copy.deepcopy(SOUND)
        m["machine"]["starting_current_a"] = 300
        v = evaluate(m)
        self.assertEqual(v["verdict"], "SOUND")
        chk = [c for c in v["checks"]
               if c["check"] ==
               "induction_starting_current_multiple_recorded"][0]
        self.assertIn("3.000000 x FLA", chk["evidence"])

    def test_unknown_machine_family_fails_machine_analysis(self):
        m = copy.deepcopy(SOUND)
        m["machine"]["machine_family"] = "permanent_magnet"
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_SOUND")
        self.assertEqual(v["sections"]["machine_analysis"], "fail")

    def test_transformer_record_passes_with_own_family_checks(self):
        m = copy.deepcopy(SOUND)
        m["machine"] = {
            "machine_family": "transformer",
            "transformer_vector_group_or_impedance_addressed": True,
            "transformer_inrush_tap_cooling_addressed": True,
            "transformer_thermal_aging_addressed": True,
        }
        v = evaluate(m)
        self.assertEqual(v["verdict"], "SOUND")
        self.assertEqual(v["sections"]["machine_analysis"], "pass")

    def test_dc_record_with_unknown_excitation_fails(self):
        m = copy.deepcopy(SOUND)
        m["machine"] = {
            "machine_family": "dc",
            "dc_excitation_type": "compound",
            "dc_retrofit_or_legacy_context_addressed": True,
        }
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_SOUND")
        self.assertEqual(v["sections"]["machine_analysis"], "fail")

    def test_unknown_control_mode_fails_drives(self):
        m = copy.deepcopy(SOUND)
        m["drives"]["control_mode"] = "direct_torque"
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_SOUND")
        self.assertEqual(v["sections"]["drives"], "fail")

    def test_no_vfd_passes_drives_as_na(self):
        m = copy.deepcopy(SOUND)
        m["drives"] = {"vfd_involved": False}
        v = evaluate(m)
        self.assertEqual(v["verdict"], "SOUND")
        self.assertEqual(v["sections"]["drives"], "pass")

    def test_ansi_number_outside_skill_list_fails_protection(self):
        m = copy.deepcopy(SOUND)
        m["protection"]["ansi_device_numbers"] = ["50", "67"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_SOUND")
        self.assertEqual(v["sections"]["protection"], "fail")

    def test_empty_ansi_list_fails_protection(self):
        m = copy.deepcopy(SOUND)
        m["protection"]["ansi_device_numbers"] = []
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_SOUND")
        self.assertEqual(v["sections"]["protection"], "fail")

    def test_settings_published_as_fact_fails_protection(self):
        m = copy.deepcopy(SOUND)
        m["protection"]["settings_published_as_fact"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_SOUND")
        self.assertEqual(v["sections"]["protection"], "fail")

    def test_settings_not_deferred_to_study_fails_protection(self):
        m = copy.deepcopy(SOUND)
        m["protection"]["final_settings_deferred_to_study"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_SOUND")
        self.assertEqual(v["sections"]["protection"], "fail")

    def test_protection_out_of_scope_still_binds_deferral_rules(self):
        m = copy.deepcopy(SOUND)
        m["protection"] = {"protection_in_scope": False,
                            "final_settings_deferred_to_study": True,
                            "settings_published_as_fact": False}
        v = evaluate(m)
        self.assertEqual(v["verdict"], "SOUND")
        self.assertEqual(v["sections"]["protection"], "pass")

    def test_missing_assumptions_is_insufficient_not_failed(self):
        m = copy.deepcopy(SOUND)
        del m["engagement"]["assumptions_stated_explicitly"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["engagement"],
                         "insufficient_evidence")

    def test_hazloc_involved_without_gas_group_is_insufficient(self):
        m = copy.deepcopy(SOUND)
        del m["standards"]["hazloc_gas_group_and_temp_class_stated"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["standards_and_hazloc"],
                         "insufficient_evidence")

    def test_no_hazardous_area_passes_hazloc_as_na(self):
        m = copy.deepcopy(SOUND)
        m["standards"] = {"applicable_standards_named": True,
                          "standards_applicability_reasons_stated": True,
                          "hazardous_area_involved": False}
        v = evaluate(m)
        self.assertEqual(v["verdict"], "SOUND")
        self.assertEqual(v["sections"]["standards_and_hazloc"], "pass")

    def test_going_public_without_sanitization_fails(self):
        m = copy.deepcopy(SOUND)
        m["documents"]["public_sanitization_applied"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_SOUND")
        self.assertEqual(v["sections"]["documents_and_disclosure"],
                         "fail")

    def test_absent_evidence_is_insufficient_not_failed(self):
        m = copy.deepcopy(SOUND)
        del m["calculations"]["short_circuit_addressed"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["calculations"],
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
    ValueError naming the field — never evaluated into a verdict."""

    def test_section_as_string_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"advice_id": "advice-1",
                      "engagement": "invalid_string_instead_of_object"})
        self.assertIn("engagement", str(ctx.exception))

    def test_number_leaf_as_string_rejected(self):
        m = copy.deepcopy(SOUND)
        m["machine"]["full_load_current_a"] = "one hundred"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("machine.full_load_current_a",
                      str(ctx.exception))

    def test_boolean_leaf_as_number_rejected(self):
        m = copy.deepcopy(SOUND)
        m["drives"]["harmonics_addressed"] = 1
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("drives.harmonics_addressed", str(ctx.exception))

    def test_ansi_list_entry_as_number_rejected(self):
        m = copy.deepcopy(SOUND)
        m["protection"]["ansi_device_numbers"] = [50, "51"]
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("protection.ansi_device_numbers[0]",
                      str(ctx.exception))

    def test_ansi_field_as_string_rejected(self):
        m = copy.deepcopy(SOUND)
        m["protection"]["ansi_device_numbers"] = "50/51"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("protection.ansi_device_numbers",
                      str(ctx.exception))

    def test_null_section_rejected(self):
        m = copy.deepcopy(SOUND)
        m["protection"] = None
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("protection", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
