import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from data_ml_pipeline_engineering import evaluate, stamp  # noqa: E402


COMPLETE = {
    "entity": "Acme Orders ML Pipeline",
    "sources": {
        "datasets": [{"name": "orders", "rows": 600},
                     {"name": "events", "rows": 400}],
        "declared_total_rows": 1000,
        "schemas_and_expectations_declared_for_all_inputs_and_outputs": True,
        "validation_on_arrival": True,
        "bad_data_refused_loudly": True,
        "silent_coercion_present": False,
    },
    "pipeline": {
        "steps_rerunnable_idempotently": True,
        "exactly_once_effects_at_sinks": True,
        "backfill_tested_once": True,
        "explicit_step_dependencies": True,
        "schedules_documented": True,
        "failures_alert_and_retry": True,
        "unrecorded_manual_reruns_present": False,
    },
    "quality": {
        "row_count_checks_between_stages": True,
        "freshness_checks_between_stages": True,
        "null_uniqueness_distribution_checks_between_stages": True,
        "bad_partitions_quarantined": True,
        "pipeline_health_dashboard_present": True,
    },
    "lineage": {
        "source_to_transform_to_sink_tracked": True,
        "code_versioned": True,
        "config_versioned": True,
        "data_snapshots_versioned": True,
        "same_inputs_produce_same_outputs_verified": True,
    },
    "training": {"reproducible_with_seeds_and_pinned_env": True},
    "features": {
        "feature_definitions_declared": True,
        "label_definition_declared": True,
        "feature_store_only_when_justified": True,
    },
    "splits": {
        "train_rows": 700,
        "eval_rows": 150,
        "test_rows": 150,
        "declared_total_rows": 1000,
        "leakage_checks_cover_time_target_and_cross_splits": True,
        "split_by_time_or_user_when_temporal": True,
        "class_balance_assessed": True,
    },
    "privacy": {"pii_in_training_data_without_lawful_basis": False},
    "lifecycle": {
        "eval_suites_versioned_with_model": True,
        "model_registry_entry_exists": True,
        "model_card_covers_data_metrics_and_limits": True,
        "offline_eval_completed_before_prod": True,
        "rollout_plan_present_before_prod": True,
    },
    "serving": {
        "deployment_pattern_declared": True,
        "estimated_latency_ms": 120,
        "latency_budget_ms": 250,
        "estimated_monthly_cost": 800,
        "monthly_cost_budget": 1000,
    },
    "monitoring": {
        "input_drift_monitored": True,
        "output_drift_monitored": True,
        "performance_decay_monitored_vs_baselines": True,
        "alert_thresholds_set": True,
        "thresholds_tied_to_retraining_policy": True,
        "retraining_is_a_pipeline": True,
    },
}


def check_status(v, name):
    return next(c["status"] for c in v["checks"] if c["check"] == name)


class VerdictTests(unittest.TestCase):
    def test_complete_manifest_is_ready(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(v["verdict"], "DATA_ML_PIPELINE_READY")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(v["computed_status"],
                         "within_stated_limits_on_declared_evidence")
        self.assertEqual(len(v["checks"]), 46)
        self.assertEqual(v["sources_evaluated"], 2)
        self.assertEqual(v["computed_total_rows"], "1000.000000")
        self.assertEqual(v["total_rows_difference"], "0.000000")
        self.assertEqual(v["computed_split_total_rows"], "1000.000000")
        self.assertEqual(v["split_total_difference"], "0.000000")
        self.assertEqual(v["latency_headroom_ms"], "130.000000")
        self.assertEqual(v["monthly_cost_headroom"], "200.000000")

    def test_values_at_other_scales_pass(self):
        m = copy.deepcopy(COMPLETE)
        m["sources"]["datasets"] = [{"name": "a", "rows": 5}]
        m["sources"]["declared_total_rows"] = 5
        m["splits"].update({"train_rows": 3, "eval_rows": 1,
                            "test_rows": 1, "declared_total_rows": 5})
        m["serving"].update({"estimated_latency_ms": 250,
                              "estimated_monthly_cost": 1000})
        v = evaluate(m)
        self.assertEqual(v["verdict"], "DATA_ML_PIPELINE_READY")
        self.assertEqual(v["latency_headroom_ms"], "0.000000")
        self.assertEqual(v["monthly_cost_headroom"], "0.000000")

    def test_source_total_mismatch_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["sources"]["declared_total_rows"] = 900
        v = evaluate(m)
        self.assertEqual(v["verdict"], "DATA_ML_PIPELINE_NOT_READY")
        self.assertEqual(v["sections"]["contracts_and_ingestion"], "fail")
        self.assertEqual(
            check_status(v, "total_rows_matches_sum_of_source_rows"),
            "fail")
        self.assertEqual(v["total_rows_difference"], "-100.000000")
        self.assertEqual(v["computed_status"],
                         "outside_stated_limits_on_declared_evidence")

    def test_missing_datasets_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["sources"]["datasets"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "source_entries_complete"), "missing")
        self.assertEqual(v["sources_evaluated"], 0)
        self.assertIsNone(v["computed_total_rows"])
        self.assertIsNone(v["computed_status"])

    def test_empty_datasets_list_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        m["sources"]["datasets"] = []
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "total_rows_matches_sum_of_source_rows"),
            "missing")

    def test_incomplete_dataset_entry_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["sources"]["datasets"][1]["rows"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "source_entries_complete"), "missing")
        self.assertEqual(v["sources_evaluated"], 1)
        self.assertIsNone(v["computed_total_rows"])

    def test_dataset_entry_without_name_still_totals(self):
        m = copy.deepcopy(COMPLETE)
        del m["sources"]["datasets"][0]["name"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "source_entries_complete"), "missing")
        self.assertEqual(
            check_status(v, "total_rows_matches_sum_of_source_rows"),
            "pass")
        self.assertEqual(v["computed_total_rows"], "1000.000000")

    def test_missing_declared_source_total_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["sources"]["declared_total_rows"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertIsNone(v["computed_total_rows"])

    def test_silent_coercion_fails_red_line(self):
        m = copy.deepcopy(COMPLETE)
        m["sources"]["silent_coercion_present"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "DATA_ML_PIPELINE_NOT_READY")
        self.assertEqual(check_status(v, "no_silent_coercion"), "fail")

    def test_split_total_mismatch_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["splits"]["declared_total_rows"] = 1100
        v = evaluate(m)
        self.assertEqual(v["verdict"], "DATA_ML_PIPELINE_NOT_READY")
        self.assertEqual(
            check_status(v, "split_total_matches_sum_of_split_rows"),
            "fail")
        self.assertEqual(v["split_total_difference"], "100.000000")
        self.assertEqual(v["computed_split_total_rows"], "1000.000000")

    def test_any_split_ratio_passes_when_total_consistent(self):
        m = copy.deepcopy(COMPLETE)
        m["splits"].update({"train_rows": 100, "eval_rows": 400,
                            "test_rows": 500})
        v = evaluate(m)
        self.assertEqual(v["verdict"], "DATA_ML_PIPELINE_READY")

    def test_missing_split_part_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["splits"]["eval_rows"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertIsNone(v["computed_split_total_rows"])
        self.assertIsNone(v["split_total_difference"])

    def test_missing_split_declared_total_is_missing_but_sum_known(self):
        m = copy.deepcopy(COMPLETE)
        del m["splits"]["declared_total_rows"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["computed_split_total_rows"], "1000.000000")
        self.assertIsNone(v["split_total_difference"])

    def test_leakage_checks_absent_section_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["splits"]["leakage_checks_cover_time_target_and_cross_splits"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "DATA_ML_PIPELINE_NOT_READY")
        self.assertEqual(v["sections"]["ml_hygiene_and_splits"], "fail")

    def test_pii_without_lawful_basis_fails_red_line(self):
        m = copy.deepcopy(COMPLETE)
        m["privacy"]["pii_in_training_data_without_lawful_basis"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "DATA_ML_PIPELINE_NOT_READY")
        self.assertEqual(
            check_status(
                v, "no_pii_in_training_data_without_lawful_basis"),
            "fail")

    def test_latency_over_caller_budget_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["serving"]["estimated_latency_ms"] = 300
        v = evaluate(m)
        self.assertEqual(v["verdict"], "DATA_ML_PIPELINE_NOT_READY")
        self.assertEqual(
            check_status(v, "latency_within_caller_declared_budget"),
            "fail")
        self.assertEqual(v["latency_headroom_ms"], "-50.000000")

    def test_latency_exactly_at_budget_passes(self):
        m = copy.deepcopy(COMPLETE)
        m["serving"]["estimated_latency_ms"] = 250
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "latency_within_caller_declared_budget"),
            "pass")
        self.assertEqual(v["verdict"], "DATA_ML_PIPELINE_READY")

    def test_cost_over_caller_budget_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["serving"]["monthly_cost_budget"] = 700
        v = evaluate(m)
        self.assertEqual(v["verdict"], "DATA_ML_PIPELINE_NOT_READY")
        self.assertEqual(
            check_status(v, "cost_within_caller_declared_budget"),
            "fail")
        self.assertEqual(v["monthly_cost_headroom"], "-100.000000")

    def test_missing_latency_budget_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["serving"]["latency_budget_ms"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertIsNone(v["latency_headroom_ms"])
        self.assertEqual(v["monthly_cost_headroom"], "200.000000")

    def test_missing_cost_estimate_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["serving"]["estimated_monthly_cost"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertIsNone(v["monthly_cost_headroom"])

    def test_unrecorded_manual_reruns_fail(self):
        m = copy.deepcopy(COMPLETE)
        m["pipeline"]["unrecorded_manual_reruns_present"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "DATA_ML_PIPELINE_NOT_READY")
        self.assertEqual(
            v["sections"]["idempotency_and_orchestration"], "fail")

    def test_no_offline_eval_fails_red_line(self):
        m = copy.deepcopy(COMPLETE)
        m["lifecycle"]["offline_eval_completed_before_prod"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "DATA_ML_PIPELINE_NOT_READY")
        self.assertEqual(v["sections"]["lifecycle_and_serving"], "fail")

    def test_each_section_can_fail(self):
        # One representative false / must-be-false flip per section.
        cases = {
            "contracts_and_ingestion":
                (("sources", "validation_on_arrival"), False),
            "idempotency_and_orchestration":
                (("pipeline", "steps_rerunnable_idempotently"), False),
            "quality_gates":
                (("quality", "bad_partitions_quarantined"), False),
            "lineage_and_reproducibility":
                (("lineage", "code_versioned"), False),
            "ml_hygiene_and_splits":
                (("splits", "class_balance_assessed"), False),
            "lifecycle_and_serving":
                (("lifecycle", "model_registry_entry_exists"), False),
            "monitoring_and_drift":
                (("monitoring", "input_drift_monitored"), False),
        }
        for section, (path, value) in cases.items():
            with self.subTest(section=section):
                m = copy.deepcopy(COMPLETE)
                m[path[0]][path[1]] = value
                v = evaluate(m)
                self.assertEqual(v["verdict"],
                                 "DATA_ML_PIPELINE_NOT_READY")
                self.assertEqual(v["sections"][section], "fail")

    def test_absent_section_is_insufficient_not_failed(self):
        m = copy.deepcopy(COMPLETE)
        del m["monitoring"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["monitoring_and_drift"],
                         "insufficient_evidence")

    def test_sparse_manifest_is_insufficient_evidence(self):
        v = evaluate({"entity": "Only A Name"})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertTrue(all(
            s == "insufficient_evidence"
            for s in v["sections"].values()))

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertIsNone(v["computed_status"])
        self.assertEqual(v["sources_evaluated"], 0)
        self.assertIsNone(v["computed_total_rows"])
        self.assertIsNone(v["computed_split_total_rows"])
        self.assertIsNone(v["latency_headroom_ms"])
        self.assertIsNone(v["monthly_cost_headroom"])

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertIn("VERDICT: DATA_ML_PIPELINE_READY", stamp(v))

    def test_non_object_manifest_rejected(self):
        with self.assertRaises(TypeError):
            evaluate(["not", "a", "manifest"])


class MalformedTypeTests(unittest.TestCase):
    """F1 regression (external verification Wave 1): a documented
    field present with the wrong JSON type is rejected with
    ValueError naming the field — never evaluated into a verdict."""

    def test_top_level_string_field_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["entity"] = 12345
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("entity", str(ctx.exception))

    def test_section_as_string_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"sources": "should-be-an-object"})
        self.assertIn("sources", str(ctx.exception))

    def test_datasets_list_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["sources"]["datasets"] = "orders,events"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("sources.datasets", str(ctx.exception))

    def test_dataset_entry_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["sources"]["datasets"][0] = "orders"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("sources.datasets[0]", str(ctx.exception))

    def test_dataset_name_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["sources"]["datasets"][0]["name"] = 1
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("sources.datasets[0].name", str(ctx.exception))

    def test_dataset_rows_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["sources"]["datasets"][1]["rows"] = "400"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("sources.datasets[1].rows", str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["sources"]["validation_on_arrival"] = "yes"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("sources.validation_on_arrival",
                      str(ctx.exception))

    def test_numeric_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["splits"]["train_rows"] = "700"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("splits.train_rows", str(ctx.exception))

    def test_numeric_leaf_as_boolean_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["serving"]["estimated_latency_ms"] = True
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("serving.estimated_latency_ms",
                      str(ctx.exception))

    def test_nested_boolean_leaf_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["monitoring"]["alert_thresholds_set"] = 1
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("monitoring.alert_thresholds_set",
                      str(ctx.exception))

    def test_null_section_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["quality"] = None
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("quality", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
