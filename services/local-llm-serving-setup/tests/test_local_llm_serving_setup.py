import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from local_llm_serving_setup import evaluate, stamp  # noqa: E402

COMPLETE = {
    "setup": "fleet-router-box",
    "workload": {"tasks_defined": True,
                 "context_lengths_defined": True,
                 "concurrency_defined": True,
                 "compute_and_vram_ram_budget_computed": True,
                 "kv_cache_growth_accounted_and_headroom_left": True,
                 "quantization_chosen_deliberately_with_tradeoffs": True},
    "model_selection": {"model_size_matched_to_task": True},
    "models": [
        {"name": "router-7b",
         "vram_ram_and_context_budget_documented": True,
         "version_pinned_and_checksum_recorded": True,
         "license_vetted_for_commercial_use": True,
         "performance_measured_at_realistic_context": True,
         "golden_task_eval_recorded": True},
        {"name": "reasoner-14b",
         "vram_ram_and_context_budget_documented": True,
         "version_pinned_and_checksum_recorded": True,
         "license_vetted_for_commercial_use": True,
         "performance_measured_at_realistic_context": True,
         "golden_task_eval_recorded": True},
        {"name": "summary-3b",
         "vram_ram_and_context_budget_documented": True,
         "version_pinned_and_checksum_recorded": True,
         "license_vetted_for_commercial_use": True,
         "performance_measured_at_realistic_context": True,
         "golden_task_eval_recorded": True},
    ],
    "serving": {"stack_fits_host_and_workload": True,
                "runs_daemonless_under_supervisor_with_auto_restart": True,
                "bound_to_loopback_only_verified": True,
                "remote_access_only_via_authenticated_tunnel": True,
                "unauthenticated_inference_port_exposure_present": False},
    "performance": {
        "tokens_per_second_and_ttft_measured_at_realistic_context": True,
        "offload_layers_and_parallelism_tuned": True,
        "vram_overcommit_present": False},
    "operations": {"health_endpoint_present": True,
                   "structured_logs_present": True,
                   "model_catalog_pinned": True,
                   "disk_space_for_weights_monitored": True,
                   "upgrade_path_backup_swap_verify_rollback_present": True},
    "fallback": {
        "fallback_chain_declared_local_primary_secondary_provider": True,
        "model_swaps_behind_stable_openai_compatible_api": True,
        "each_failover_tested_deliberately_including_primary_failure": True},
    "evaluation": {"golden_task_suite_run_per_model_change": True,
                   "quality_and_speed_recorded_before_promotion": True,
                   "silent_model_swaps_present": False},
}


def check_status(v, name):
    return next(c["status"] for c in v["checks"] if c["check"] == name)


class VerdictTests(unittest.TestCase):
    def test_complete_manifest_is_sound(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(v["verdict"], "LOCAL_LLM_SERVING_SOUND")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(len(v["checks"]), 32)
        self.assertEqual(v["computed_status"],
                         "within_stated_limits_on_declared_evidence")
        self.assertEqual(v["models_count"], 3)
        self.assertEqual(v["models_without_budget_documentation"], [])
        self.assertEqual(v["budget_coverage"], "1.000000")
        self.assertEqual(v["models_without_pinned_version_and_checksum"], [])
        self.assertEqual(v["models_without_vetted_license"], [])
        self.assertEqual(v["models_without_performance_measurement"], [])
        self.assertEqual(v["performance_coverage"], "1.000000")
        self.assertEqual(v["models_without_golden_task_eval"], [])
        self.assertEqual(v["golden_eval_coverage"], "1.000000")

    def test_no_kv_headroom_fails_workload_section(self):
        m = copy.deepcopy(COMPLETE)
        m["workload"]["kv_cache_growth_accounted_and_headroom_left"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "LOCAL_LLM_SERVING_NOT_SOUND")
        self.assertEqual(v["sections"]["workload_and_memory_budget"], "fail")
        self.assertEqual(
            check_status(v, "kv_cache_growth_accounted_and_headroom_left"),
            "fail")

    def test_default_quantization_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["workload"][
            "quantization_chosen_deliberately_with_tradeoffs"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "LOCAL_LLM_SERVING_NOT_SOUND")

    def test_model_without_budget_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["models"][0]["vram_ram_and_context_budget_documented"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "LOCAL_LLM_SERVING_NOT_SOUND")
        self.assertEqual(
            check_status(
                v, "every_model_vram_ram_and_context_budget_documented"),
            "fail")
        self.assertEqual(v["models_without_budget_documentation"],
                         ["router-7b"])
        self.assertEqual(v["budget_coverage"], "0.666667")
        self.assertEqual(v["computed_status"],
                         "outside_stated_limits_on_declared_evidence")

    def test_model_missing_budget_field_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["models"][1]["vram_ram_and_context_budget_documented"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(
                v, "every_model_vram_ram_and_context_budget_documented"),
            "missing")
        self.assertEqual(v["models_without_budget_documentation"], [])

    def test_unpinned_model_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["models"][2]["version_pinned_and_checksum_recorded"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v, "every_model_version_pinned_and_checksum_recorded"),
            "fail")
        self.assertEqual(v["models_without_pinned_version_and_checksum"],
                         ["summary-3b"])

    def test_unvetted_license_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["models"][1]["license_vetted_for_commercial_use"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "LOCAL_LLM_SERVING_NOT_SOUND")
        self.assertEqual(
            v["sections"]["model_selection_and_provenance"], "fail")
        self.assertEqual(
            check_status(
                v, "every_model_license_vetted_for_commercial_use"), "fail")
        self.assertEqual(v["models_without_vetted_license"], ["reasoner-14b"])

    def test_model_size_not_matched_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["model_selection"]["model_size_matched_to_task"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "LOCAL_LLM_SERVING_NOT_SOUND")

    def test_non_loopback_binding_fails_serving_section(self):
        m = copy.deepcopy(COMPLETE)
        m["serving"]["bound_to_loopback_only_verified"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "LOCAL_LLM_SERVING_NOT_SOUND")
        self.assertEqual(v["sections"]["serving_stack_and_exposure"], "fail")

    def test_unauthenticated_exposure_is_red_line_fail(self):
        m = copy.deepcopy(COMPLETE)
        m["serving"]["unauthenticated_inference_port_exposure_present"] = True
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "no_unauthenticated_inference_port_exposure"),
            "fail")
        self.assertEqual(v["sections"]["serving_stack_and_exposure"], "fail")

    def test_no_supervisor_auto_restart_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["serving"][
            "runs_daemonless_under_supervisor_with_auto_restart"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "LOCAL_LLM_SERVING_NOT_SOUND")

    def test_vram_overcommit_fails_performance_section(self):
        m = copy.deepcopy(COMPLETE)
        m["performance"]["vram_overcommit_present"] = True
        v = evaluate(m)
        self.assertEqual(check_status(v, "no_vram_overcommit"), "fail")
        self.assertEqual(
            v["sections"]["performance_and_operations"], "fail")

    def test_model_without_performance_measurement_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["models"][0]["performance_measured_at_realistic_context"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v,
                "every_model_performance_measured_at_realistic_context"),
            "fail")
        self.assertEqual(v["models_without_performance_measurement"],
                         ["router-7b"])
        self.assertEqual(v["performance_coverage"], "0.666667")

    def test_no_health_endpoint_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["operations"]["health_endpoint_present"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "LOCAL_LLM_SERVING_NOT_SOUND")

    def test_no_rollback_path_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["operations"][
            "upgrade_path_backup_swap_verify_rollback_present"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "LOCAL_LLM_SERVING_NOT_SOUND")

    def test_empty_models_list_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["models"] = []
        v = evaluate(m)
        self.assertEqual(check_status(v, "models_declared"), "fail")
        self.assertEqual(v["models_count"], 0)
        self.assertIsNone(v["budget_coverage"])
        self.assertIsNone(v["performance_coverage"])
        self.assertIsNone(v["golden_eval_coverage"])

    def test_untested_fallback_chain_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["fallback"][
            "each_failover_tested_deliberately_including_primary_failure"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v,
                "fallback_chain_tested_by_failing_primary_deliberately"),
            "fail")
        self.assertEqual(
            v["sections"]["fallback_chains_and_evaluation"], "fail")

    def test_silent_model_swaps_is_red_line_fail(self):
        m = copy.deepcopy(COMPLETE)
        m["evaluation"]["silent_model_swaps_present"] = True
        v = evaluate(m)
        self.assertEqual(check_status(v, "no_silent_model_swaps"), "fail")
        self.assertEqual(
            v["sections"]["fallback_chains_and_evaluation"], "fail")

    def test_model_without_golden_eval_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["models"][2]["golden_task_eval_recorded"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_model_golden_task_eval_recorded"),
            "fail")
        self.assertEqual(v["models_without_golden_task_eval"], ["summary-3b"])
        self.assertEqual(v["golden_eval_coverage"], "0.666667")

    def test_model_missing_golden_eval_field_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["models"][2]["golden_task_eval_recorded"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "every_model_golden_task_eval_recorded"),
            "missing")
        self.assertEqual(v["models_without_golden_task_eval"], [])

    def test_absent_evidence_is_insufficient_not_failed(self):
        m = copy.deepcopy(COMPLETE)
        del m["workload"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["workload_and_memory_budget"],
                         "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertTrue(
            all(c["status"] == "missing" for c in v["checks"]))
        self.assertIsNone(v["computed_status"])
        self.assertIsNone(v["models_count"])
        self.assertIsNone(v["models_without_budget_documentation"])
        self.assertIsNone(v["budget_coverage"])
        self.assertIsNone(v["models_without_pinned_version_and_checksum"])
        self.assertIsNone(v["models_without_vetted_license"])
        self.assertIsNone(v["models_without_performance_measurement"])
        self.assertIsNone(v["performance_coverage"])
        self.assertIsNone(v["models_without_golden_task_eval"])
        self.assertIsNone(v["golden_eval_coverage"])

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertIn("VERDICT: LOCAL_LLM_SERVING_SOUND", stamp(v))

    def test_non_object_manifest_rejected(self):
        with self.assertRaises(TypeError):
            evaluate(["not", "a", "manifest"])


class MalformedTypeTests(unittest.TestCase):
    def test_string_field_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["setup"] = 12345
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("setup", str(ctx.exception))

    def test_object_section_as_string_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"workload": "should-be-an-object"})
        self.assertIn("workload", str(ctx.exception))

    def test_list_field_as_object_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"models": {"name": "router-7b"}})
        self.assertIn("models", str(ctx.exception))

    def test_list_entry_as_string_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"models": ["router-7b"]})
        self.assertIn("models[0]", str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["workload"]["tasks_defined"] = "yes"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("workload.tasks_defined", str(ctx.exception))

    def test_nested_list_entry_string_field_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["models"][0]["name"] = 42
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("models[0].name", str(ctx.exception))

    def test_nested_list_entry_boolean_field_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["models"][1]["golden_task_eval_recorded"] = "yes"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("models[1].golden_task_eval_recorded",
                      str(ctx.exception))

    def test_null_section_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["serving"] = None
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("serving", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
