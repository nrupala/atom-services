import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from ml_project_framing_review import evaluate, stamp  # noqa: E402

COMPLETE = {
    "project": "churn-prediction",
    "framing": {"problem_statement_defined": True,
                "ml_necessity_assessed": True,
                "non_ml_rule_or_heuristic_considered": True,
                "decision_and_action_named": True,
                "framing_completed_before_modeling": True},
    "metric": {"primary_metric_named": True,
               "metric_tied_to_decision": True,
               "accuracy_for_its_own_sake_present": False},
    "baseline": {"baseline_value_written_down": True,
                 "baseline_is_rule_or_heuristic_benchmark": True,
                 "baseline_recorded_before_complex_build": True},
    "metrics": [
        {"name": "retention-uplift", "decision_action": "trigger-save-offer",
         "tied_to_decision": True,
         "baseline_recorded_before_modeling": True},
        {"name": "false-alarm-rate", "decision_action": "cap-offer-volume",
         "tied_to_decision": True,
         "baseline_recorded_before_modeling": True},
        {"name": "cost-per-save", "decision_action": "set-offer-budget",
         "tied_to_decision": True,
         "baseline_recorded_before_modeling": True},
    ],
    "data_plan": {"provenance_plan_stated": True,
                  "leakage_risks_identified": True,
                  "split_honesty_strategy_planned": True,
                  "never_tune_on_test_committed": True,
                  "distribution_shift_risk_noted": True},
    "evaluation_plan": {"evaluation_designed_before_modeling": True,
                        "offline_online_gap_acknowledged": True,
                        "online_check_planned": True,
                        "ablation_planned": True},
    "approach": {"start_simple_first_step_named": True,
                 "complexity_must_earn_keep_accepted": True,
                 "reproducibility_plan_stated": True,
                 "uncertainty_reporting_planned": True,
                 "worst_case_failure_analysis_planned": True},
    "llm": {"uses_llm_or_rag": False,
            "retrieval_quality_prioritized_over_model_size": False,
            "golden_set_evaluation_planned": False,
            "grounding_citation_and_idk_required": False,
            "prompts_versioned_with_changelog": False},
    "serving": {"local_first_serving_options_considered": True,
                "latency_and_cost_budget_considered": True},
    "red_lines": {"chasing_sota_without_baseline_present": False,
                  "evaluating_on_training_data_present": False,
                  "demo_driven_development_present": False,
                  "tuning_on_test_present": False,
                  "latency_cost_ignored_present": False,
                  "llm_output_treated_as_correct_present": False},
}

LLM_COMPLETE = copy.deepcopy(COMPLETE)
LLM_COMPLETE["llm"] = {
    "uses_llm_or_rag": True,
    "retrieval_quality_prioritized_over_model_size": True,
    "golden_set_evaluation_planned": True,
    "grounding_citation_and_idk_required": True,
    "prompts_versioned_with_changelog": True,
}


def check_status(v, name):
    return next(c["status"] for c in v["checks"] if c["check"] == name)


class VerdictTests(unittest.TestCase):
    def test_complete_manifest_is_sound(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(v["verdict"], "ML_FRAMING_SOUND")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(len(v["checks"]), 43)
        self.assertEqual(v["computed_status"],
                         "within_stated_limits_on_declared_evidence")
        self.assertEqual(v["metrics_count"], 3)
        self.assertEqual(v["metrics_without_tied_decision"], [])
        self.assertEqual(v["tied_to_decision_coverage"], "1.000000")
        self.assertEqual(v["metrics_without_baseline_recorded"], [])
        self.assertEqual(v["baseline_recorded_coverage"], "1.000000")
        self.assertEqual(v["duplicate_metric_names"], [])

    def test_llm_project_complete_is_sound(self):
        v = evaluate(copy.deepcopy(LLM_COMPLETE))
        self.assertEqual(v["verdict"], "ML_FRAMING_SOUND")
        self.assertEqual(
            check_status(v, "golden_set_evaluation_planned"), "pass")

    def test_no_ml_necessity_fails_section1(self):
        m = copy.deepcopy(COMPLETE)
        m["framing"]["ml_necessity_assessed"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "ML_FRAMING_NOT_SOUND")
        self.assertEqual(
            v["sections"]["ml_necessity_and_decision_framing"], "fail")
        self.assertEqual(check_status(v, "ml_necessity_assessed"), "fail")

    def test_no_non_ml_alternative_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["framing"]["non_ml_rule_or_heuristic_considered"] = False
        self.assertEqual(evaluate(m)["verdict"], "ML_FRAMING_NOT_SOUND")

    def test_framing_after_modeling_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["framing"]["framing_completed_before_modeling"] = False
        self.assertEqual(
            check_status(evaluate(m), "framing_completed_before_modeling"),
            "fail")

    def test_accuracy_for_its_own_sake_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["metric"]["accuracy_for_its_own_sake_present"] = True
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "no_accuracy_for_its_own_sake"), "fail")
        self.assertEqual(
            v["sections"]["metric_and_baseline_framing"], "fail")

    def test_baseline_not_written_down_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["baseline"]["baseline_value_written_down"] = False
        self.assertEqual(evaluate(m)["verdict"], "ML_FRAMING_NOT_SOUND")

    def test_metric_without_tied_decision_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["metrics"][0]["tied_to_decision"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "ML_FRAMING_NOT_SOUND")
        self.assertEqual(
            check_status(v, "every_metric_tied_to_decision"), "fail")
        self.assertEqual(v["metrics_without_tied_decision"],
                         ["retention-uplift"])
        self.assertEqual(v["tied_to_decision_coverage"], "0.666667")
        self.assertEqual(v["computed_status"],
                         "outside_stated_limits_on_declared_evidence")

    def test_metric_missing_tied_field_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["metrics"][0]["tied_to_decision"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "every_metric_tied_to_decision"), "missing")
        self.assertEqual(v["metrics_without_tied_decision"], [])

    def test_metric_without_baseline_recorded_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["metrics"][1]["baseline_recorded_before_modeling"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v, "every_metric_baseline_recorded_before_modeling"),
            "fail")
        self.assertEqual(v["metrics_without_baseline_recorded"],
                         ["false-alarm-rate"])
        self.assertEqual(v["baseline_recorded_coverage"], "0.666667")

    def test_metric_missing_decision_action_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["metrics"][2]["decision_action"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "every_metric_names_decision_action"),
            "missing")

    def test_metric_empty_decision_action_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["metrics"][2]["decision_action"] = ""
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_metric_names_decision_action"), "fail")

    def test_duplicate_metric_name_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["metrics"][2]["name"] = "retention-uplift"
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "no_metric_name_duplicated"), "fail")
        self.assertEqual(v["duplicate_metric_names"], ["retention-uplift"])

    def test_metric_missing_name_is_missing_for_duplicate_check(self):
        m = copy.deepcopy(COMPLETE)
        del m["metrics"][2]["name"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "no_metric_name_duplicated"), "missing")
        self.assertEqual(v["duplicate_metric_names"], [])

    def test_empty_metrics_list_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["metrics"] = []
        v = evaluate(m)
        self.assertEqual(check_status(v, "metrics_declared"), "fail")
        self.assertEqual(v["metrics_count"], 0)
        self.assertIsNone(v["tied_to_decision_coverage"])
        self.assertIsNone(v["baseline_recorded_coverage"])
        self.assertEqual(v["duplicate_metric_names"], [])

    def test_leakage_risks_not_identified_fails_section3(self):
        m = copy.deepcopy(COMPLETE)
        m["data_plan"]["leakage_risks_identified"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "ML_FRAMING_NOT_SOUND")
        self.assertEqual(v["sections"]["data_and_evaluation_plan"], "fail")

    def test_no_online_check_planned_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["evaluation_plan"]["online_check_planned"] = False
        self.assertEqual(
            check_status(evaluate(m), "online_check_planned"), "fail")

    def test_evaluation_after_modeling_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["evaluation_plan"]["evaluation_designed_before_modeling"] = False
        self.assertEqual(evaluate(m)["verdict"], "ML_FRAMING_NOT_SOUND")

    def test_complexity_without_earn_keep_fails_section4(self):
        m = copy.deepcopy(COMPLETE)
        m["approach"]["complexity_must_earn_keep_accepted"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "ML_FRAMING_NOT_SOUND")
        self.assertEqual(
            v["sections"]["approach_reproducibility_and_llm_framing"],
            "fail")

    def test_llm_gate_absent_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["llm"]["uses_llm_or_rag"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "llm_applicability_declared"), "missing")
        self.assertEqual(
            check_status(v, "golden_set_evaluation_planned"), "missing")

    def test_llm_project_without_golden_set_fails(self):
        m = copy.deepcopy(LLM_COMPLETE)
        m["llm"]["golden_set_evaluation_planned"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "golden_set_evaluation_planned"), "fail")
        self.assertEqual(v["verdict"], "ML_FRAMING_NOT_SOUND")

    def test_non_llm_project_llm_fields_false_still_pass(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(
            check_status(v, "retrieval_quality_prioritized_over_model_size"),
            "pass")
        self.assertEqual(
            check_status(v, "prompts_versioned_with_changelog"), "pass")

    def test_llm_field_absent_with_gate_true_is_missing(self):
        m = copy.deepcopy(LLM_COMPLETE)
        del m["llm"]["golden_set_evaluation_planned"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "golden_set_evaluation_planned"), "missing")

    def test_sota_chasing_fails_red_lines(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"]["chasing_sota_without_baseline_present"] = True
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "no_chasing_sota_without_baseline"), "fail")
        self.assertEqual(v["sections"]["anti_pattern_red_lines"], "fail")

    def test_evaluating_on_training_data_fails_red_lines(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"]["evaluating_on_training_data_present"] = True
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "no_evaluating_on_training_data"), "fail")
        self.assertEqual(v["verdict"], "ML_FRAMING_NOT_SOUND")

    def test_demo_driven_and_llm_output_red_lines_fail(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"]["demo_driven_development_present"] = True
        m["red_lines"]["llm_output_treated_as_correct_present"] = True
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "no_demo_driven_development"), "fail")
        self.assertEqual(
            check_status(v, "no_llm_output_treated_as_correct"), "fail")

    def test_absent_evidence_is_insufficient_not_failed(self):
        m = copy.deepcopy(COMPLETE)
        del m["evaluation_plan"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["data_and_evaluation_plan"],
                         "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertTrue(
            all(c["status"] == "missing" for c in v["checks"]))
        self.assertIsNone(v["computed_status"])
        self.assertIsNone(v["metrics_count"])
        self.assertIsNone(v["metrics_without_tied_decision"])
        self.assertIsNone(v["tied_to_decision_coverage"])
        self.assertIsNone(v["metrics_without_baseline_recorded"])
        self.assertIsNone(v["baseline_recorded_coverage"])
        self.assertIsNone(v["duplicate_metric_names"])

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertIn("VERDICT: ML_FRAMING_SOUND", stamp(v))

    def test_non_object_manifest_rejected(self):
        with self.assertRaises(TypeError):
            evaluate(["not", "a", "manifest"])


class MalformedTypeTests(unittest.TestCase):
    def test_string_field_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["project"] = 12345
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("project", str(ctx.exception))

    def test_object_section_as_string_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"framing": "should-be-an-object"})
        self.assertIn("framing", str(ctx.exception))

    def test_list_field_as_object_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"metrics": {"name": "retention-uplift"}})
        self.assertIn("metrics", str(ctx.exception))

    def test_list_entry_as_string_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"metrics": ["retention-uplift"]})
        self.assertIn("metrics[0]", str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["framing"]["ml_necessity_assessed"] = "yes"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("framing.ml_necessity_assessed", str(ctx.exception))

    def test_nested_list_entry_string_field_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["metrics"][0]["name"] = 42
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("metrics[0].name", str(ctx.exception))

    def test_nested_list_entry_boolean_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["metrics"][1]["tied_to_decision"] = "true"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("metrics[1].tied_to_decision", str(ctx.exception))

    def test_null_section_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["llm"] = None
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("llm", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
