import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from statistical_study_design_report import evaluate, stamp  # noqa: E402

COMPLETE = {
    "study_title": "widget-retention-two-arm-study",
    "framing": {"decision_stated": True,
                "research_question_stated": True,
                "outcome_defined": True,
                "unit_of_analysis_defined": True,
                "population_defined": True,
                "timeframe_defined": True},
    "design": {"design_type": "randomized_experiment",
               "assignment_mechanism_stated": True,
               "estimand_stated": True,
               "confounders_identified": True},
    "variables": [
        {"variable_id": "retention-30d", "role": "outcome"},
        {"variable_id": "arm", "role": "exposure"},
        {"variable_id": "age", "role": "covariate"},
        {"variable_id": "baseline-usage", "role": "confounder"},
    ],
    "sampling": {"sampling_frame_defined": True,
                 "sampling_method_stated": True,
                 "inclusion_exclusion_criteria_stated": True,
                 "power_analysis_done_before_collection": True,
                 "declared_total_sample_size": 200,
                 "declared_alpha": 0.05,
                 "declared_target_power": 0.8,
                 "declared_effect_size": 0.4},
    "groups": [
        {"group_id": "control", "declared_size": 100},
        {"group_id": "treatment", "declared_size": 100},
    ],
    "analysis": {"plan_written_before_collection": True,
                 "plan_preregistered": True,
                 "primary_method_named": True,
                 "assumption_checks_planned": True,
                 "effect_size_with_uncertainty_planned": True,
                 "multiple_comparison_discipline_planned": True,
                 "deviations_logging_planned": True},
    "validation": {"sensitivity_analyses_planned": True,
                   "robustness_checks_planned": True,
                   "leakage_audit_planned": True,
                   "limitations_section_planned": True,
                   "what_would_change_conclusion_stated": True},
    "delivery": {"executive_summary_planned": True,
                 "methods_memo_planned": True,
                 "reproducible_appendix_planned": True,
                 "pipeline_sealed_for_rerun": True},
    "red_lines": {
        "significance_without_effect_size_and_uncertainty_present": False,
        "p_hacking_or_selective_reporting_present": False,
        "causal_language_from_observational_without_design_present":
            False,
        "unredacted_pii_or_unapproved_reuse_present": False,
        "outcome_guarantee_present": False},
}


def check_status(v, name):
    return next(c["status"] for c in v["checks"] if c["check"] == name)


class VerdictTests(unittest.TestCase):
    def test_complete_manifest_is_ready(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(v["verdict"], "STUDY_DESIGN_READY")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(len(v["checks"]), 46)
        self.assertEqual(v["computed_status"],
                         "within_stated_limits_on_declared_evidence")
        self.assertEqual(v["variables_count"], 4)
        self.assertEqual(v["outcome_variable_count"], 1)
        self.assertEqual(v["duplicate_variable_ids"], [])
        self.assertEqual(v["variables_with_unrecognised_role"], [])
        self.assertEqual(v["groups_count"], 2)
        self.assertEqual(v["duplicate_group_ids"], [])
        self.assertEqual(v["computed_total_sample_size"], 200)
        self.assertEqual(v["declared_total_sample_size"], 200)
        self.assertEqual(v["total_sample_size_difference"], 0)
        self.assertEqual(v["largest_group_share"], "0.500000")
        self.assertEqual(v["declared_alpha"], 0.05)
        self.assertEqual(v["declared_target_power"], 0.8)
        self.assertEqual(v["declared_effect_size"], 0.4)

    def test_decision_not_stated_fails_framing(self):
        m = copy.deepcopy(COMPLETE)
        m["framing"]["decision_stated"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "STUDY_DESIGN_NOT_READY")
        self.assertEqual(v["sections"]["decision_framing"], "fail")
        self.assertEqual(
            check_status(v, "study_design_decision_stated_before_design"),
            "fail")

    def test_unrecognised_design_type_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["design"]["design_type"] = "anecdotal"
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "study_design_type_recognised"), "fail")
        self.assertEqual(v["computed_status"],
                         "outside_stated_limits_on_declared_evidence")

    def test_absent_design_type_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["design"]["design_type"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "study_design_type_recognised"), "missing")

    def test_observational_design_type_passes(self):
        m = copy.deepcopy(COMPLETE)
        m["design"]["design_type"] = "observational"
        self.assertEqual(
            check_status(evaluate(m), "study_design_type_recognised"),
            "pass")

    def test_duplicate_variable_id_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["variables"][1]["variable_id"] = "retention-30d"
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "study_design_every_variable_id_unique"),
            "fail")
        self.assertEqual(v["duplicate_variable_ids"], ["retention-30d"])

    def test_unrecognised_role_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["variables"][2]["role"] = "vibes"
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v, "study_design_every_variable_role_recognised"),
            "fail")
        self.assertEqual(v["variables_with_unrecognised_role"], ["age"])

    def test_no_outcome_variable_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["variables"][0]["role"] = "predictor"
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v,
                "study_design_at_least_one_outcome_variable_declared"),
            "fail")
        self.assertEqual(v["outcome_variable_count"], 0)

    def test_variable_missing_role_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["variables"][1]["role"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(
                v, "study_design_every_variable_role_recognised"),
            "missing")

    def test_absent_variables_list_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["variables"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "study_design_variables_list_declared"),
            "missing")
        self.assertIsNone(v["variables_count"])
        self.assertIsNone(v["duplicate_variable_ids"])
        self.assertIsNone(v["variables_with_unrecognised_role"])
        self.assertIsNone(v["outcome_variable_count"])

    def test_empty_variables_list_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["variables"] = []
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "study_design_variables_list_declared"),
            "fail")
        self.assertEqual(v["variables_count"], 0)

    def test_total_mismatch_fails_and_difference_reported(self):
        m = copy.deepcopy(COMPLETE)
        m["sampling"]["declared_total_sample_size"] = 210
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v, "study_design_total_sample_size_matches_group_sum"),
            "fail")
        self.assertEqual(v["total_sample_size_difference"], 10)
        self.assertEqual(v["computed_status"],
                         "outside_stated_limits_on_declared_evidence")

    def test_absent_total_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["sampling"]["declared_total_sample_size"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(
                v, "study_design_total_sample_size_matches_group_sum"),
            "missing")
        self.assertIsNone(v["total_sample_size_difference"])

    def test_duplicate_group_id_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["groups"][1]["group_id"] = "control"
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "study_design_every_group_id_unique"),
            "fail")
        self.assertEqual(v["duplicate_group_ids"], ["control"])

    def test_zero_group_size_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["groups"][0]["declared_size"] = 0
        m["sampling"]["declared_total_sample_size"] = 100
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v, "study_design_every_group_size_positive_whole"),
            "fail")

    def test_fractional_group_size_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["groups"][0]["declared_size"] = 99.5
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v, "study_design_every_group_size_positive_whole"),
            "fail")

    def test_group_missing_size_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["groups"][0]["declared_size"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(
                v, "study_design_every_group_size_positive_whole"),
            "missing")
        self.assertIsNone(v["computed_total_sample_size"])

    def test_alpha_out_of_range_fails(self):
        for bad in (0, 1, 1.5, -0.1):
            m = copy.deepcopy(COMPLETE)
            m["sampling"]["declared_alpha"] = bad
            self.assertEqual(
                check_status(
                    evaluate(m),
                    "study_design_alpha_in_valid_probability_range"),
                "fail")

    def test_power_out_of_range_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["sampling"]["declared_target_power"] = 1.0
        self.assertEqual(
            check_status(
                evaluate(m),
                "study_design_target_power_in_valid_probability_range"),
            "fail")

    def test_low_power_is_reported_not_failed(self):
        # No adequacy bar is invented: 0.2 target power is a valid
        # probability and passes; the atom reports it verbatim.
        m = copy.deepcopy(COMPLETE)
        m["sampling"]["declared_target_power"] = 0.2
        v = evaluate(m)
        self.assertEqual(v["verdict"], "STUDY_DESIGN_READY")
        self.assertEqual(v["declared_target_power"], 0.2)

    def test_zero_effect_size_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["sampling"]["declared_effect_size"] = 0
        self.assertEqual(
            check_status(evaluate(m), "study_design_effect_size_nonzero"),
            "fail")

    def test_negative_effect_size_passes_nonzero(self):
        m = copy.deepcopy(COMPLETE)
        m["sampling"]["declared_effect_size"] = -0.4
        self.assertEqual(
            check_status(evaluate(m), "study_design_effect_size_nonzero"),
            "pass")

    def test_power_analysis_after_collection_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["sampling"]["power_analysis_done_before_collection"] = False
        v = evaluate(m)
        self.assertEqual(v["sections"]["sampling_and_power"], "fail")

    def test_unpreregistered_plan_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["analysis"]["plan_preregistered"] = False
        v = evaluate(m)
        self.assertEqual(v["sections"]["analysis_plan"], "fail")
        self.assertEqual(
            check_status(v, "study_design_analysis_plan_preregistered"),
            "fail")

    def test_bare_p_value_plan_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["analysis"]["effect_size_with_uncertainty_planned"] = False
        self.assertEqual(
            check_status(
                evaluate(m),
                "study_design_effect_size_with_uncertainty_planned"),
            "fail")

    def test_no_sensitivity_fails_validation(self):
        m = copy.deepcopy(COMPLETE)
        m["validation"]["sensitivity_analyses_planned"] = False
        v = evaluate(m)
        self.assertEqual(
            v["sections"]["validation_and_bias_controls"], "fail")

    def test_no_reproducible_appendix_fails_delivery(self):
        m = copy.deepcopy(COMPLETE)
        m["delivery"]["reproducible_appendix_planned"] = False
        v = evaluate(m)
        self.assertEqual(
            v["sections"]["delivery_and_reproducibility"], "fail")

    def test_p_hacking_fails_red_lines(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"]["p_hacking_or_selective_reporting_present"] = True
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v,
                "study_design_free_of_p_hacking_or_selective_reporting"),
            "fail")
        self.assertEqual(v["sections"]["red_lines"], "fail")
        self.assertEqual(v["verdict"], "STUDY_DESIGN_NOT_READY")

    def test_causal_language_fails_red_lines(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"][
            "causal_language_from_observational_without_design_present"
        ] = True
        self.assertEqual(
            check_status(
                evaluate(m),
                "study_design_free_of_unsupported_causal_language"),
            "fail")

    def test_outcome_guarantee_fails_red_lines(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"]["outcome_guarantee_present"] = True
        self.assertEqual(
            check_status(
                evaluate(m), "study_design_free_of_outcome_guarantees"),
            "fail")

    def test_absent_evidence_is_insufficient_not_failed(self):
        m = copy.deepcopy(COMPLETE)
        del m["analysis"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["analysis_plan"],
                         "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertTrue(
            all(c["status"] == "missing" for c in v["checks"]))
        self.assertIsNone(v["computed_status"])
        self.assertIsNone(v["variables_count"])
        self.assertIsNone(v["groups_count"])
        self.assertIsNone(v["computed_total_sample_size"])
        self.assertIsNone(v["declared_total_sample_size"])
        self.assertIsNone(v["largest_group_share"])
        self.assertIsNone(v["declared_alpha"])

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertIn("VERDICT: STUDY_DESIGN_READY", stamp(v))

    def test_non_object_manifest_rejected(self):
        with self.assertRaises(TypeError):
            evaluate(["not", "a", "manifest"])


class MalformedTypeTests(unittest.TestCase):
    def test_string_field_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["study_title"] = 12345
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("study_title", str(ctx.exception))

    def test_object_section_as_string_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"framing": "should-be-an-object"})
        self.assertIn("framing", str(ctx.exception))

    def test_list_field_as_object_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"variables": {"variable_id": "x"}})
        self.assertIn("variables", str(ctx.exception))

    def test_list_entry_as_string_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"groups": ["control"]})
        self.assertIn("groups[0]", str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["analysis"]["plan_preregistered"] = "yes"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("analysis.plan_preregistered", str(ctx.exception))

    def test_number_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["sampling"]["declared_alpha"] = "0.05"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("sampling.declared_alpha", str(ctx.exception))

    def test_number_leaf_as_boolean_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["groups"][0]["declared_size"] = True
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("groups[0].declared_size", str(ctx.exception))

    def test_nested_list_entry_string_field_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["variables"][1]["role"] = 42
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("variables[1].role", str(ctx.exception))

    def test_null_section_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["delivery"] = None
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("delivery", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
