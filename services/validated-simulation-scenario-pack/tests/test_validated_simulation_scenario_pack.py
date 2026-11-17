import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from validated_simulation_scenario_pack import evaluate, stamp  # noqa: E402

COMPLETE = {
    "pack_title": "thermal-training-pack",
    "purpose": {"purpose_declared": True,
                "fidelity_level_declared": True,
                "modeled_scope_declared": True,
                "abstractions_declared": True,
                "limits_stated_upfront": True},
    "core": {"deterministic_core_declared": True,
             "units_explicit_si_declared": True,
             "domain_equations_referenced": True,
             "no_magic_numbers_declared": True},
    "parameters": [
        {"parameter_id": "par-1", "parameter_name": "Flow velocity",
         "unit": "m/s", "value": 2.5,
         "basis_note": "Pump curve datasheet rev 3"},
        {"parameter_id": "par-2", "parameter_name": "Ambient temperature",
         "unit": "K", "value": 293,
         "basis_note": "Reference case table 2"},
    ],
    "randomness": {"stochastic_elements_present": True,
                   "seeds_logged": True,
                   "reproducibility_from_seed_log_declared": True,
                   "stochastic_runs_reported_as_distributions": True,
                   "distribution_bands_and_run_counts_reported": True},
    "scenarios": [
        {"scenario_id": "scn-1", "scenario_name": "Flow sweep",
         "scenario_type": "parameter_sweep",
         "expected_outcome": "Pressure rises monotonically with flow",
         "seed_value": 42},
        {"scenario_id": "scn-2", "scenario_name": "Zero flow boundary",
         "scenario_type": "boundary_case",
         "expected_outcome": "System settles at ambient temperature",
         "seed_value": 7},
        {"scenario_id": "scn-3", "scenario_name": "Textbook golden case",
         "scenario_type": "golden",
         "expected_outcome": "Matches textbook worked example",
         "seed_value": 11},
        {"scenario_id": "scn-4", "scenario_name": "Progressive fouling",
         "scenario_type": "evolving_fault",
         "expected_outcome": "Efficiency degrades across the run",
         "seed_value": 13},
    ],
    "scenario_library": {
        "golden_scenarios_used_as_regression_tests": True,
        "scenario_expected_outcomes_recorded": True,
        "evolving_faults_applicable": True},
    "model_version": "2.1.0",
    "validation": {"validation_cases_cited": True,
                   "errors_reported_honestly": True,
                   "model_changes_versioned_without_silent_edits": True},
    "validation_cases": [
        {"case_id": "val-1", "case_name": "Textbook case A",
         "reference_source": "Textbook worked example 4.2",
         "expected_value": 100, "simulated_value": 102.5,
         "absolute_error_declared": 2.5},
        {"case_id": "val-2", "case_name": "Field case B",
         "reference_source": "Field trial report 2024-11",
         "expected_value": 50, "simulated_value": 49,
         "absolute_error_declared": 1},
    ],
    "interaction": {"sane_defaults_declared": True,
                    "step_pause_rewind_controls_declared": True,
                    "explanatory_overlays_declared": True,
                    "run_logs_exportable": True,
                    "live_interactive_ui_present": True},
    "performance": {"heavy_compute_present": True,
                    "heavy_compute_chunked_behind_workers": True,
                    "interactive_frame_budget_declared": True},
    "red_lines": {"sim_output_presented_as_field_truth_present": False,
                  "hidden_model_edits_present": False,
                  "safety_critical_training_without_warning_labels_present": False,
                  "single_stochastic_outcome_presented_as_certain_present": False,
                  "unseeded_randomness_present": False},
}


def check_status(v, name):
    return next(c["status"] for c in v["checks"] if c["check"] == name)


class VerdictTests(unittest.TestCase):
    def test_complete_manifest_is_sound(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(v["verdict"], "SIMULATION_SCENARIO_PACK_SOUND")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(len(v["checks"]), 52)
        self.assertEqual(v["computed_status"],
                         "within_stated_limits_on_declared_evidence")
        self.assertEqual(v["simulation_parameters_count"], 2)
        self.assertEqual(v["simulation_scenarios_count"], 4)
        self.assertEqual(v["simulation_validation_cases_count"], 2)
        self.assertEqual(v["duplicate_simulation_parameter_ids"], [])
        self.assertEqual(v["duplicate_simulation_scenario_ids"], [])
        self.assertEqual(v["simulation_scenario_golden_present"], True)
        self.assertEqual(
            v["simulation_validation_max_declared_absolute_error"], "2.500000")
        self.assertEqual(v["parameter_basis_note_ratio"], "1.000000")
        self.assertEqual(v["scenario_seed_coverage_ratio"], "1.000000")
        self.assertEqual(v["validation_error_match_ratio"], "1.000000")

    def test_limits_not_stated_fails_section1(self):
        m = copy.deepcopy(COMPLETE)
        m["purpose"]["limits_stated_upfront"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "SIMULATION_SCENARIO_PACK_NOT_SOUND")
        self.assertEqual(v["sections"]["purpose_and_fidelity"], "fail")
        self.assertEqual(
            check_status(v, "sim_scenario_pack_limits_stated_upfront"),
            "fail")

    def test_duplicate_parameter_id_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["parameters"][1]["parameter_id"] = "par-1"
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_sim_scenario_pack_parameter_id_unique"),
            "fail")
        self.assertEqual(v["duplicate_simulation_parameter_ids"], ["par-1"])

    def test_empty_parameters_list_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["parameters"] = []
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "sim_scenario_pack_parameters_list_declared"),
            "fail")
        self.assertEqual(v["simulation_parameters_count"], 0)
        self.assertIsNone(v["parameter_basis_note_ratio"])

    def test_absent_parameters_list_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["parameters"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "sim_scenario_pack_parameters_list_declared"),
            "missing")
        self.assertIsNone(v["simulation_parameters_count"])
        self.assertIsNone(v["computed_status"])

    def test_non_si_unit_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["parameters"][0]["unit"] = "rpm"
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v, "every_sim_scenario_pack_parameter_unit_recognised_si"),
            "fail")
        self.assertEqual(v["simulation_parameters_with_invalid_unit"],
                         ["par-1"])

    def test_empty_basis_note_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["parameters"][1]["basis_note"] = ""
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v, "every_sim_scenario_pack_parameter_basis_note_declared"),
            "fail")
        self.assertEqual(v["simulation_parameters_without_basis_note"],
                         ["par-2"])
        self.assertEqual(v["parameter_basis_note_ratio"], "0.500000")

    def test_missing_parameter_value_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["parameters"][0]["value"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(
                v, "every_sim_scenario_pack_parameter_value_declared"),
            "missing")

    def test_stochastic_single_outcome_reporting_fails_gated(self):
        m = copy.deepcopy(COMPLETE)
        m["randomness"]["stochastic_runs_reported_as_distributions"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v,
                "sim_scenario_pack_stochastic_runs_reported_as_distributions_where_stochastic"),
            "fail")

    def test_no_stochastic_elements_passes_gated_as_na(self):
        m = copy.deepcopy(COMPLETE)
        m["randomness"]["stochastic_elements_present"] = False
        m["randomness"]["stochastic_runs_reported_as_distributions"] = False
        m["randomness"]["distribution_bands_and_run_counts_reported"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v,
                "sim_scenario_pack_stochastic_runs_reported_as_distributions_where_stochastic"),
            "pass")
        self.assertEqual(v["verdict"], "SIMULATION_SCENARIO_PACK_SOUND")

    def test_scenario_without_seed_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["scenarios"][0]["seed_value"]
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_sim_scenario_pack_scenario_seed_declared"),
            "missing")
        self.assertEqual(v["scenario_seed_coverage_ratio"], "0.750000")

    def test_single_scenario_fails_library(self):
        m = copy.deepcopy(COMPLETE)
        m["scenarios"] = m["scenarios"][:1]
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "sim_scenario_pack_scenarios_list_declared"),
            "fail")

    def test_invalid_scenario_type_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["scenarios"][0]["scenario_type"] = "free_play"
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v, "every_sim_scenario_pack_scenario_type_recognised"),
            "fail")
        self.assertEqual(
            v["simulation_scenarios_with_invalid_scenario_type"], ["scn-1"])

    def test_no_golden_scenario_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["scenarios"][2]["scenario_type"] = "nominal_case"
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "sim_scenario_pack_golden_scenario_present"),
            "fail")
        self.assertEqual(v["simulation_scenario_golden_present"], False)

    def test_no_boundary_case_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["scenarios"][1]["scenario_type"] = "nominal_case"
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v, "sim_scenario_pack_boundary_case_scenario_present"),
            "fail")

    def test_evolving_fault_applicable_but_absent_fails_gated(self):
        m = copy.deepcopy(COMPLETE)
        m["scenarios"][3]["scenario_type"] = "nominal_case"
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v,
                "sim_scenario_pack_evolving_fault_scenario_present_where_applicable"),
            "fail")

    def test_evolving_fault_not_applicable_passes_gated_as_na(self):
        m = copy.deepcopy(COMPLETE)
        m["scenario_library"]["evolving_faults_applicable"] = False
        m["scenarios"][3]["scenario_type"] = "nominal_case"
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v,
                "sim_scenario_pack_evolving_fault_scenario_present_where_applicable"),
            "pass")
        self.assertEqual(v["verdict"], "SIMULATION_SCENARIO_PACK_SOUND")

    def test_empty_expected_outcome_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["scenarios"][2]["expected_outcome"] = ""
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v,
                "every_sim_scenario_pack_scenario_expected_outcome_declared"),
            "fail")
        self.assertEqual(v["simulation_scenarios_without_expected_outcome"],
                         ["scn-3"])
        self.assertEqual(v["scenario_expected_outcome_ratio"], "0.750000")

    def test_empty_model_version_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["model_version"] = ""
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "sim_scenario_pack_model_version_declared"),
            "fail")

    def test_absent_model_version_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["model_version"]
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "sim_scenario_pack_model_version_declared"),
            "missing")
        self.assertIsNone(v["computed_status"])

    def test_absolute_error_mismatch_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["validation_cases"][0]["absolute_error_declared"] = 3
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v,
                "every_sim_scenario_pack_validation_case_absolute_error_recomputes"),
            "fail")
        self.assertEqual(
            v["simulation_validation_cases_with_error_mismatch"], ["val-1"])
        self.assertEqual(v["validation_error_match_ratio"], "0.500000")

    def test_negative_difference_uses_absolute_error(self):
        m = copy.deepcopy(COMPLETE)
        m["validation_cases"][1]["simulated_value"] = 47.5
        m["validation_cases"][1]["absolute_error_declared"] = 2.5
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v,
                "every_sim_scenario_pack_validation_case_absolute_error_recomputes"),
            "pass")

    def test_empty_reference_source_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["validation_cases"][0]["reference_source"] = ""
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v,
                "every_sim_scenario_pack_validation_case_reference_source_declared"),
            "fail")
        self.assertEqual(
            v["simulation_validation_cases_without_reference_source"],
            ["val-1"])
        self.assertEqual(v["validation_case_reference_ratio"], "0.500000")

    def test_live_ui_without_frame_budget_fails_gated(self):
        m = copy.deepcopy(COMPLETE)
        m["performance"]["interactive_frame_budget_declared"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v,
                "sim_scenario_pack_interactive_frame_budget_declared_where_live_ui"),
            "fail")

    def test_no_live_ui_passes_frame_budget_gated_as_na(self):
        m = copy.deepcopy(COMPLETE)
        m["interaction"]["live_interactive_ui_present"] = False
        m["performance"]["interactive_frame_budget_declared"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v,
                "sim_scenario_pack_interactive_frame_budget_declared_where_live_ui"),
            "pass")
        self.assertEqual(v["verdict"], "SIMULATION_SCENARIO_PACK_SOUND")

    def test_heavy_compute_not_chunked_fails_gated(self):
        m = copy.deepcopy(COMPLETE)
        m["performance"]["heavy_compute_chunked_behind_workers"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v,
                "sim_scenario_pack_heavy_compute_chunked_behind_workers_where_heavy"),
            "fail")

    def test_run_logs_not_exportable_fails_section6(self):
        m = copy.deepcopy(COMPLETE)
        m["interaction"]["run_logs_exportable"] = False
        v = evaluate(m)
        self.assertEqual(v["sections"]["interaction_logs_and_performance"],
                         "fail")

    def test_sim_output_as_field_truth_fails_red_lines(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"]["sim_output_presented_as_field_truth_present"] = True
        v = evaluate(m)
        self.assertEqual(v["sections"]["red_lines"], "fail")
        self.assertEqual(v["verdict"], "SIMULATION_SCENARIO_PACK_NOT_SOUND")

    def test_unseeded_randomness_fails_red_lines(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"]["unseeded_randomness_present"] = True
        self.assertEqual(
            check_status(
                evaluate(m),
                "sim_scenario_pack_free_of_unseeded_randomness"),
            "fail")

    def test_absent_evidence_is_insufficient_not_failed(self):
        m = copy.deepcopy(COMPLETE)
        del m["validation"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["validation_against_reality"],
                         "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertTrue(all(c["status"] == "missing" for c in v["checks"]))
        self.assertIsNone(v["computed_status"])
        self.assertIsNone(v["simulation_scenarios_count"])
        self.assertIsNone(v["simulation_scenario_golden_present"])
        self.assertIsNone(v["validation_error_match_ratio"])

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertIn("VERDICT: SIMULATION_SCENARIO_PACK_SOUND", stamp(v))

    def test_non_object_manifest_rejected(self):
        with self.assertRaises(TypeError):
            evaluate(["not", "a", "manifest"])


class MalformedTypeTests(unittest.TestCase):
    def test_string_field_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["pack_title"] = 12345
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("pack_title", str(ctx.exception))

    def test_object_section_as_string_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"purpose": "should-be-an-object"})
        self.assertIn("purpose", str(ctx.exception))

    def test_list_field_as_object_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"scenarios": {"scenario_id": "scn-1"}})
        self.assertIn("scenarios", str(ctx.exception))

    def test_list_entry_as_string_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"parameters": ["par-1"]})
        self.assertIn("parameters[0]", str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["purpose"]["purpose_declared"] = "yes"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("purpose.purpose_declared", str(ctx.exception))

    def test_number_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["parameters"][0]["value"] = "2.5"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("parameters[0].value", str(ctx.exception))

    def test_nested_seed_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["scenarios"][0]["seed_value"] = "42"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("scenarios[0].seed_value", str(ctx.exception))

    def test_model_version_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["model_version"] = 210
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("model_version", str(ctx.exception))

    def test_null_section_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"] = None
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("red_lines", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
