import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from applied_ml_validation import evaluate, stamp  # noqa: E402

VALIDATED = {
    "model": "churn intervention ranker v3",
    "framing": {"decision_named": True,
                "error_costs_stated": True,
                "alternatives_considered": True},
    "baseline": {"defined": True,
                 "baseline_score": 0.30,
                 "model_score": 0.22,
                 "metric_direction": "lower_is_better",
                 "project_stopped_because_baseline_not_beaten": False},
    "data": {"provenance_documented": True,
             "licensing_and_consent_confirmed": True,
             "label_quality_checked": True,
             "edge_cases_covered": True,
             "leakage_audited": True,
             "training_without_rights_or_consent": False},
    "validation": {"temporal_data": True,
                   "grouped_data": True,
                   "split_type": "time_and_group"},
    "ladder": {"baseline_rung_evaluated": True,
               "data_and_splits_held_fixed": True,
               "complexity_justified_by_evaluation": True,
               "selected_model_rung": "boosted_trees",
               "rungs_evaluated": ["majority_heuristic", "linear",
                                   "boosted_trees"]},
    "evaluation": {"decision_aligned_metrics_used": True,
                   "slice_performance_reported": True,
                   "calibration_reported": True,
                   "uncertainty_via_resampling_reported": True,
                   "conclusion_change_condition_stated": True,
                   "imbalanced_or_high_stakes": True,
                   "accuracy_only_reporting": False},
    "robustness": {"distribution_shift_evaluated": True,
                   "adversarial_inputs_evaluated": True,
                   "known_failure_modes_documented": True,
                   "data_limitations_documented": True,
                   "cherry_picked_examples_presented": False,
                   "claims_exceed_measured_capability": False},
    "deployment": {"data_code_model_versioned_together": True,
                   "drift_monitoring_planned": True,
                   "live_performance_monitoring_planned": True,
                   "feedback_loops_monitored": True,
                   "rollback_path_defined": True,
                   "regular_revalidation_planned": True},
    "documentation": {"model_card_written_and_versioned": True},
}


def check_status(v, name):
    return next(c["status"] for c in v["checks"] if c["check"] == name)


class VerdictTests(unittest.TestCase):
    def test_validated_manifest_is_validated(self):
        v = evaluate(copy.deepcopy(VALIDATED))
        self.assertEqual(v["verdict"], "VALIDATED")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(len(v["checks"]), 35)
        self.assertEqual(v["baseline_status"],
                         "beaten_on_declared_evidence")
        self.assertEqual(v["baseline_improvement"], "0.0800")
        self.assertEqual(v["selected_rung_index"], 2)

    def test_baseline_improvement_higher_is_better(self):
        m = copy.deepcopy(VALIDATED)
        m["baseline"]["metric_direction"] = "higher_is_better"
        m["baseline"]["baseline_score"] = 0.70
        m["baseline"]["model_score"] = 0.82
        v = evaluate(m)
        self.assertEqual(v["verdict"], "VALIDATED")
        self.assertEqual(v["baseline_improvement"], "0.1200")

    def test_baseline_improvement_serialized_at_fixed_4dp(self):
        m = copy.deepcopy(VALIDATED)
        m["baseline"]["baseline_score"] = 0.30003
        m["baseline"]["model_score"] = 0.2
        v = evaluate(m)
        self.assertEqual(v["baseline_improvement"], "0.1000")

    def test_baseline_tied_does_not_beat(self):
        m = copy.deepcopy(VALIDATED)
        m["baseline"]["model_score"] = 0.30
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_VALIDATED")
        self.assertEqual(v["sections"]["framing_and_baseline"], "fail")
        self.assertEqual(v["baseline_status"],
                         "not_beaten_on_declared_evidence")
        self.assertEqual(v["baseline_improvement"], "0.0000")

    def test_baseline_worse_than_baseline_fails(self):
        m = copy.deepcopy(VALIDATED)
        m["baseline"]["model_score"] = 0.35
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_VALIDATED")
        self.assertEqual(v["baseline_improvement"], "-0.0500")

    def test_project_rightly_stopped_passes_without_scores(self):
        m = copy.deepcopy(VALIDATED)
        m["baseline"]["project_stopped_because_baseline_not_beaten"] = True
        del m["baseline"]["baseline_score"]
        del m["baseline"]["model_score"]
        del m["baseline"]["metric_direction"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "VALIDATED")
        self.assertEqual(v["baseline_status"], "project_rightly_stopped")
        self.assertIsNone(v["baseline_improvement"])

    def test_project_rightly_stopped_still_reports_improvement(self):
        m = copy.deepcopy(VALIDATED)
        m["baseline"]["project_stopped_because_baseline_not_beaten"] = True
        v = evaluate(m)
        self.assertEqual(v["baseline_status"], "project_rightly_stopped")
        self.assertEqual(v["baseline_improvement"], "0.0800")

    def test_missing_baseline_scores_is_missing_not_failed(self):
        m = copy.deepcopy(VALIDATED)
        del m["baseline"]["model_score"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertIsNone(v["baseline_status"])
        self.assertIsNone(v["baseline_improvement"])
        self.assertEqual(
            check_status(
                v, "baseline_meaningfully_beaten_or_project_stopped"),
            "missing")

    def test_invalid_metric_direction_fails(self):
        m = copy.deepcopy(VALIDATED)
        m["baseline"]["metric_direction"] = "sideways"
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_VALIDATED")
        self.assertEqual(v["baseline_status"],
                         "not_beaten_on_declared_evidence")
        self.assertIsNone(v["baseline_improvement"])

    def test_non_numeric_baseline_score_is_missing(self):
        # Corrected under the F1 ruling: previously expected a
        # verdict over a wrong-typed documented field (the F1
        # defect). A non-numeric score is now rejected with
        # ValueError naming the field.
        m = copy.deepcopy(VALIDATED)
        m["baseline"]["model_score"] = "low"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("baseline.model_score", str(ctx.exception))

    def test_boolean_baseline_score_is_missing(self):
        # Corrected under the F1 ruling: a boolean is not a
        # number — previously expected a verdict over the
        # wrong-typed field (the F1 defect); now rejected.
        m = copy.deepcopy(VALIDATED)
        m["baseline"]["model_score"] = True
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("baseline.model_score", str(ctx.exception))

    def test_decision_not_named_fails(self):
        m = copy.deepcopy(VALIDATED)
        m["framing"]["decision_named"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_VALIDATED")
        self.assertEqual(v["sections"]["framing_and_baseline"], "fail")

    def test_training_without_consent_fails_red_line(self):
        m = copy.deepcopy(VALIDATED)
        m["data"]["training_without_rights_or_consent"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_VALIDATED")
        self.assertEqual(v["sections"]["data_audit_and_leakage"], "fail")

    def test_leakage_not_audited_fails(self):
        m = copy.deepcopy(VALIDATED)
        m["data"]["leakage_audited"] = False
        self.assertEqual(evaluate(m)["verdict"], "NOT_VALIDATED")

    def test_random_split_for_temporal_data_fails(self):
        m = copy.deepcopy(VALIDATED)
        m["validation"]["split_type"] = "random"
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_VALIDATED")
        self.assertEqual(
            check_status(v, "splits_by_time_and_group_where_applicable"),
            "fail")

    def test_time_split_alone_fails_for_grouped_data(self):
        m = copy.deepcopy(VALIDATED)
        m["validation"]["split_type"] = "time"
        self.assertEqual(evaluate(m)["verdict"], "NOT_VALIDATED")

    def test_group_split_alone_fails_for_temporal_data(self):
        m = copy.deepcopy(VALIDATED)
        m["validation"]["split_type"] = "group"
        self.assertEqual(evaluate(m)["verdict"], "NOT_VALIDATED")

    def test_random_split_passes_when_neither_temporal_nor_grouped(self):
        m = copy.deepcopy(VALIDATED)
        m["validation"] = {"temporal_data": False, "grouped_data": False,
                           "split_type": "random"}
        self.assertEqual(evaluate(m)["verdict"], "VALIDATED")

    def test_time_split_passes_for_temporal_only(self):
        m = copy.deepcopy(VALIDATED)
        m["validation"] = {"temporal_data": True, "grouped_data": False,
                           "split_type": "time"}
        self.assertEqual(evaluate(m)["verdict"], "VALIDATED")

    def test_unknown_split_type_fails(self):
        m = copy.deepcopy(VALIDATED)
        m["validation"]["split_type"] = "kfold"
        self.assertEqual(evaluate(m)["verdict"], "NOT_VALIDATED")

    def test_missing_split_evidence_is_missing(self):
        m = copy.deepcopy(VALIDATED)
        del m["validation"]["split_type"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "splits_by_time_and_group_where_applicable"),
            "missing")

    def test_non_boolean_temporal_flag_fails_split_check(self):
        # Corrected under the F1 ruling: previously expected a
        # verdict over a wrong-typed documented field (the F1
        # defect). A non-boolean flag is now rejected with
        # ValueError naming the field.
        m = copy.deepcopy(VALIDATED)
        m["validation"]["temporal_data"] = "yes"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("validation.temporal_data", str(ctx.exception))

    def test_ladder_skipping_a_rung_fails(self):
        m = copy.deepcopy(VALIDATED)
        m["ladder"]["rungs_evaluated"] = ["majority_heuristic",
                                          "boosted_trees"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_VALIDATED")
        self.assertEqual(v["sections"]["model_ladder"], "fail")
        self.assertEqual(v["selected_rung_index"], 2)

    def test_ladder_out_of_order_fails(self):
        m = copy.deepcopy(VALIDATED)
        m["ladder"]["rungs_evaluated"] = ["linear", "majority_heuristic",
                                          "boosted_trees"]
        self.assertEqual(evaluate(m)["verdict"], "NOT_VALIDATED")

    def test_ladder_repeated_rung_fails(self):
        m = copy.deepcopy(VALIDATED)
        m["ladder"]["selected_model_rung"] = "linear"
        m["ladder"]["rungs_evaluated"] = ["majority_heuristic", "linear",
                                          "linear"]
        self.assertEqual(evaluate(m)["verdict"], "NOT_VALIDATED")

    def test_ladder_climbing_past_selected_fails(self):
        m = copy.deepcopy(VALIDATED)
        m["ladder"]["rungs_evaluated"] = ["majority_heuristic", "linear",
                                          "boosted_trees", "deep"]
        self.assertEqual(evaluate(m)["verdict"], "NOT_VALIDATED")

    def test_ladder_first_rung_only_passes(self):
        m = copy.deepcopy(VALIDATED)
        m["ladder"]["selected_model_rung"] = "majority_heuristic"
        m["ladder"]["rungs_evaluated"] = ["majority_heuristic"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "VALIDATED")
        self.assertEqual(v["selected_rung_index"], 0)

    def test_ladder_full_climb_to_deep_passes(self):
        m = copy.deepcopy(VALIDATED)
        m["ladder"]["selected_model_rung"] = "deep"
        m["ladder"]["rungs_evaluated"] = ["majority_heuristic", "linear",
                                          "boosted_trees", "deep"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "VALIDATED")
        self.assertEqual(v["selected_rung_index"], 3)

    def test_unknown_selected_rung_fails_and_index_is_none(self):
        m = copy.deepcopy(VALIDATED)
        m["ladder"]["selected_model_rung"] = "transformer"
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_VALIDATED")
        self.assertIsNone(v["selected_rung_index"])

    def test_missing_ladder_record_is_missing(self):
        m = copy.deepcopy(VALIDATED)
        del m["ladder"]["rungs_evaluated"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(check_status(v, "ladder_climbed_in_order"),
                         "missing")
        self.assertEqual(v["selected_rung_index"], 2)

    def test_empty_rungs_evaluated_is_missing(self):
        m = copy.deepcopy(VALIDATED)
        m["ladder"]["rungs_evaluated"] = []
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")

    def test_accuracy_only_on_high_stakes_fails_red_line(self):
        m = copy.deepcopy(VALIDATED)
        m["evaluation"]["accuracy_only_reporting"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_VALIDATED")
        self.assertEqual(v["sections"]["evaluation_and_honesty"], "fail")

    def test_accuracy_only_passes_as_not_applicable_when_low_stakes(self):
        m = copy.deepcopy(VALIDATED)
        m["evaluation"]["imbalanced_or_high_stakes"] = False
        del m["evaluation"]["accuracy_only_reporting"]
        self.assertEqual(evaluate(m)["verdict"], "VALIDATED")

    def test_accuracy_only_missing_evidence_when_high_stakes(self):
        m = copy.deepcopy(VALIDATED)
        del m["evaluation"]["accuracy_only_reporting"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(
                v, "no_accuracy_only_reporting_where_it_matters"),
            "missing")

    def test_slice_performance_not_reported_fails(self):
        m = copy.deepcopy(VALIDATED)
        m["evaluation"]["slice_performance_reported"] = False
        self.assertEqual(evaluate(m)["verdict"], "NOT_VALIDATED")

    def test_calibration_not_reported_fails(self):
        m = copy.deepcopy(VALIDATED)
        m["evaluation"]["calibration_reported"] = False
        self.assertEqual(evaluate(m)["verdict"], "NOT_VALIDATED")

    def test_cherry_picked_examples_fail(self):
        m = copy.deepcopy(VALIDATED)
        m["robustness"]["cherry_picked_examples_presented"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_VALIDATED")
        self.assertEqual(v["sections"]["robustness_and_limits"], "fail")

    def test_claims_beyond_measured_capability_fail_red_line(self):
        m = copy.deepcopy(VALIDATED)
        m["robustness"]["claims_exceed_measured_capability"] = True
        self.assertEqual(evaluate(m)["verdict"], "NOT_VALIDATED")

    def test_failure_modes_not_documented_fails(self):
        m = copy.deepcopy(VALIDATED)
        m["robustness"]["known_failure_modes_documented"] = False
        self.assertEqual(evaluate(m)["verdict"], "NOT_VALIDATED")

    def test_no_rollback_path_fails(self):
        m = copy.deepcopy(VALIDATED)
        m["deployment"]["rollback_path_defined"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_VALIDATED")
        self.assertEqual(
            v["sections"]["deployment_monitoring_and_card"], "fail")

    def test_no_monitoring_plan_fails(self):
        m = copy.deepcopy(VALIDATED)
        m["deployment"]["drift_monitoring_planned"] = False
        self.assertEqual(evaluate(m)["verdict"], "NOT_VALIDATED")

    def test_model_card_not_written_fails(self):
        m = copy.deepcopy(VALIDATED)
        m["documentation"]["model_card_written_and_versioned"] = False
        self.assertEqual(evaluate(m)["verdict"], "NOT_VALIDATED")

    def test_absent_evidence_is_insufficient_not_failed(self):
        m = copy.deepcopy(VALIDATED)
        del m["deployment"]
        del m["documentation"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            v["sections"]["deployment_monitoring_and_card"],
            "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertIsNone(v["baseline_status"])
        self.assertIsNone(v["baseline_improvement"])
        self.assertIsNone(v["selected_rung_index"])
        self.assertEqual(len(v["checks"]), 35)

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(VALIDATED))
        self.assertIn("VERDICT: VALIDATED", stamp(v))
        self.assertIn("model: churn intervention ranker v3", stamp(v))

    def test_non_object_manifest_rejected(self):
        with self.assertRaises(TypeError):
            evaluate(["not", "a", "manifest"])


class MalformedTypeTests(unittest.TestCase):
    """F1 regression (external verification Wave 1): a documented
    field present with the wrong JSON type is rejected with
    ValueError naming the field — never evaluated into a verdict."""

    def test_top_level_string_field_as_number_rejected(self):
        m = copy.deepcopy(VALIDATED)
        m["model"] = 12345
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("model", str(ctx.exception))

    def test_section_as_string_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"baseline": "should-be-an-object"})
        self.assertIn("baseline", str(ctx.exception))

    def test_list_field_as_string_rejected(self):
        m = copy.deepcopy(VALIDATED)
        m["ladder"]["rungs_evaluated"] = "linear"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("ladder.rungs_evaluated", str(ctx.exception))

    def test_list_entry_as_number_rejected(self):
        m = copy.deepcopy(VALIDATED)
        m["ladder"]["rungs_evaluated"] = ["majority_heuristic", 42]
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("ladder.rungs_evaluated[1]", str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(VALIDATED)
        m["validation"]["temporal_data"] = "yes"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("validation.temporal_data", str(ctx.exception))

    def test_numeric_leaf_as_string_rejected(self):
        m = copy.deepcopy(VALIDATED)
        m["baseline"]["model_score"] = "low"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("baseline.model_score", str(ctx.exception))

    def test_null_section_rejected(self):
        m = copy.deepcopy(VALIDATED)
        m["evaluation"] = None
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("evaluation", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
