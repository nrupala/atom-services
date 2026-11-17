import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from production_python_engineering_pack_expert import evaluate, stamp  # noqa: E402

COMPLETE = {
    "project": "expert-svc",
    "expert_typing": {
        "type_hints_cover_all_functions_expert": True,
        "strict_type_checker_mode_where_feasible_expert": True,
        "types_used_as_executable_documentation_expert": True},
    "expert_idioms": {
        "structured_data_modelled_with_dataclasses_or_pydantic_expert": True,
        "pathlib_preferred_over_os_path_expert": True,
        "f_strings_used_for_formatting_expert": True,
        "context_managers_used_for_resources_expert": True,
        "enumerate_and_zip_used_over_manual_indexing_expert": True,
        "comprehensions_preferred_over_manual_loops_expert": True},
    "expert_packaging": {
        "venv_pip_pythonpath_environment_declared_expert": True,
        "pyproject_toml_declares_project_expert": True,
        "requirements_pinned_expert": True,
        "reproducible_environment_without_containers_expert": True,
        "src_layout_used_expert": True,
        "clear_module_boundaries_declared_expert": True,
        "no_circular_imports_declared_expert": True,
        "main_guard_on_entry_modules_expert": True},
    "expert_async": {
        "asyncio_used_for_async_paths_expert": True,
        "taskgroup_structured_concurrency_used_expert": True,
        "no_blocking_calls_in_async_paths_expert": True,
        "blocking_work_offloaded_to_thread_or_process_pool_expert": True,
        "async_http_via_httpx_or_aiohttp_expert": True},
    "expert_performance": {
        "profiling_before_optimizing_declared_expert": True,
        "profiler_tooling_cprofile_or_py_spy_declared_expert": True,
        "numpy_vectorization_applied_where_data_parallel_expert": True,
        "cold_code_left_un_micro_optimized_expert": True},
    "hot_paths": [
        {"name": "tokenizer-loop",
         "profiled_before_optimizing_expert": True,
         "acceleration_route_expert": "rust_pyo3"},
        {"name": "matrix-grade",
         "profiled_before_optimizing_expert": True,
         "acceleration_route_expert": "numpy_vectorization"},
        {"name": "parser-core",
         "profiled_before_optimizing_expert": True,
         "acceleration_route_expert": "c_extension"},
    ],
    "expert_surfaces": {
        "fastapi_used_for_typed_services_expert": True,
        "pydantic_contracts_on_api_boundaries_expert": True,
        "api_health_endpoint_provided_expert": True,
        "cli_built_with_argparse_or_typer_expert": True,
        "cli_sane_exit_codes_declared_expert": True,
        "cli_pipe_friendly_output_declared_expert": True},
    "expert_testing": {
        "pytest_fixtures_and_parametrize_used_expert": True,
        "hypothesis_property_tests_on_core_logic_expert": True,
        "coverage_measured_on_critical_path_expert": True,
        "ruff_lint_and_format_applied_expert": True,
        "mypy_run_as_tooling_gate_expert": True,
        "pre_commit_hooks_configured_expert": True,
        "failures_loud_in_development_expert": True},
    "red_lines": {
        "untyped_sprawling_script_present": False,
        "mutable_default_arguments_present": False,
        "bare_except_present": False,
        "hidden_global_state_present": False,
        "docker_used_to_paper_over_venv_problem_present": False},
}

READY = "PRODUCTION_PYTHON_ENGINEERING_PACK_EXPERT_READY"
NOT_READY = "PRODUCTION_PYTHON_ENGINEERING_PACK_EXPERT_NOT_READY"


def check_status(v, name):
    return next(c["status"] for c in v["checks"] if c["check"] == name)


class VerdictTests(unittest.TestCase):
    def test_complete_manifest_is_ready(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(v["verdict"], READY)
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(len(v["checks"]), 48)
        self.assertEqual(len(v["sections"]), 7)
        self.assertEqual(v["computed_status"],
                         "within_stated_limits_on_declared_evidence")
        self.assertEqual(v["hot_paths_count"], 3)
        self.assertEqual(v["hot_paths_not_profiled_first"], [])
        self.assertEqual(v["hot_paths_with_non_skill_route"], [])
        self.assertEqual(v["profiled_first_coverage"], "1.000000")
        self.assertEqual(v["skill_route_coverage"], "1.000000")
        self.assertEqual(v["duplicate_hot_path_names"], [])

    def test_empty_hot_paths_list_is_a_valid_declaration(self):
        m = copy.deepcopy(COMPLETE)
        m["hot_paths"] = []
        v = evaluate(m)
        self.assertEqual(v["verdict"], READY)
        self.assertEqual(v["hot_paths_count"], 0)
        self.assertEqual(v["hot_paths_not_profiled_first"], [])
        self.assertEqual(v["hot_paths_with_non_skill_route"], [])
        self.assertIsNone(v["profiled_first_coverage"])
        self.assertIsNone(v["skill_route_coverage"])
        self.assertEqual(v["duplicate_hot_path_names"], [])
        self.assertEqual(check_status(v, "expert_hot_paths_declared"), "pass")
        self.assertEqual(
            check_status(
                v, "expert_every_hot_path_profiled_before_optimizing"),
            "pass")

    def test_no_strict_typing_fails_section1(self):
        m = copy.deepcopy(COMPLETE)
        m["expert_typing"][
            "strict_type_checker_mode_where_feasible_expert"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], NOT_READY)
        self.assertEqual(
            v["sections"]["expert_typing_and_idiomatic_style"], "fail")
        self.assertEqual(
            check_status(
                v, "expert_strict_type_checker_mode_where_feasible"),
            "fail")

    def test_manual_loops_over_comprehensions_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["expert_idioms"][
            "comprehensions_preferred_over_manual_loops_expert"] = False
        self.assertEqual(
            check_status(
                evaluate(m),
                "expert_comprehensions_preferred_over_manual_loops"),
            "fail")

    def test_circular_imports_fail_section2(self):
        m = copy.deepcopy(COMPLETE)
        m["expert_packaging"]["no_circular_imports_declared_expert"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], NOT_READY)
        self.assertEqual(
            v["sections"]["expert_packaging_and_module_boundaries"],
            "fail")

    def test_container_dependent_environment_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["expert_packaging"][
            "reproducible_environment_without_containers_expert"] = False
        self.assertEqual(evaluate(m)["verdict"], NOT_READY)

    def test_no_main_guard_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["expert_packaging"]["main_guard_on_entry_modules_expert"] = False
        self.assertEqual(
            check_status(evaluate(m), "expert_main_guard_on_entry_modules"),
            "fail")

    def test_blocking_in_async_path_fails_section3(self):
        m = copy.deepcopy(COMPLETE)
        m["expert_async"]["no_blocking_calls_in_async_paths_expert"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], NOT_READY)
        self.assertEqual(v["sections"]["expert_async_concurrency"], "fail")

    def test_no_taskgroup_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["expert_async"][
            "taskgroup_structured_concurrency_used_expert"] = False
        self.assertEqual(
            check_status(
                evaluate(m), "expert_taskgroup_structured_concurrency_used"),
            "fail")

    def test_blocking_not_offloaded_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["expert_async"][
            "blocking_work_offloaded_to_thread_or_process_pool_expert"] = False
        self.assertEqual(evaluate(m)["verdict"], NOT_READY)

    def test_hot_path_not_profiled_first_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["hot_paths"][0]["profiled_before_optimizing_expert"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], NOT_READY)
        self.assertEqual(
            check_status(
                v, "expert_every_hot_path_profiled_before_optimizing"),
            "fail")
        self.assertEqual(v["hot_paths_not_profiled_first"],
                         ["tokenizer-loop"])
        self.assertEqual(v["profiled_first_coverage"], "0.666667")
        self.assertEqual(v["computed_status"],
                         "outside_stated_limits_on_declared_evidence")

    def test_hot_path_missing_profiling_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["hot_paths"][0]["profiled_before_optimizing_expert"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(
                v, "expert_every_hot_path_profiled_before_optimizing"),
            "missing")
        self.assertEqual(v["hot_paths_not_profiled_first"], [])

    def test_hot_path_non_skill_route_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["hot_paths"][1]["acceleration_route_expert"] = "pure_python_tweaks"
        v = evaluate(m)
        self.assertEqual(v["verdict"], NOT_READY)
        self.assertEqual(
            check_status(
                v,
                "expert_every_hot_path_uses_skill_named_acceleration_route"),
            "fail")
        self.assertEqual(v["hot_paths_with_non_skill_route"],
                         ["matrix-grade"])
        self.assertEqual(v["skill_route_coverage"], "0.666667")

    def test_hot_path_empty_route_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["hot_paths"][2]["acceleration_route_expert"] = ""
        v = evaluate(m)
        self.assertEqual(v["hot_paths_with_non_skill_route"], ["parser-core"])
        self.assertEqual(
            check_status(
                v,
                "expert_every_hot_path_uses_skill_named_acceleration_route"),
            "fail")

    def test_hot_path_missing_route_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["hot_paths"][1]["acceleration_route_expert"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(
                v,
                "expert_every_hot_path_uses_skill_named_acceleration_route"),
            "missing")
        self.assertEqual(v["hot_paths_with_non_skill_route"], [])

    def test_duplicate_hot_path_name_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["hot_paths"][2]["name"] = "tokenizer-loop"
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "expert_no_hot_path_name_duplicated"), "fail")
        self.assertEqual(v["duplicate_hot_path_names"], ["tokenizer-loop"])

    def test_hot_path_missing_name_is_missing_for_duplicate_check(self):
        m = copy.deepcopy(COMPLETE)
        del m["hot_paths"][2]["name"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "expert_no_hot_path_name_duplicated"),
            "missing")
        self.assertEqual(v["duplicate_hot_path_names"], [])

    def test_absent_hot_paths_list_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["hot_paths"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "expert_hot_paths_declared"), "missing")
        self.assertIsNone(v["computed_status"])
        self.assertIsNone(v["hot_paths_count"])
        self.assertIsNone(v["hot_paths_not_profiled_first"])
        self.assertIsNone(v["hot_paths_with_non_skill_route"])
        self.assertIsNone(v["profiled_first_coverage"])
        self.assertIsNone(v["skill_route_coverage"])
        self.assertIsNone(v["duplicate_hot_path_names"])

    def test_cold_code_micro_optimized_fails_section4(self):
        m = copy.deepcopy(COMPLETE)
        m["expert_performance"][
            "cold_code_left_un_micro_optimized_expert"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], NOT_READY)
        self.assertEqual(
            v["sections"]["expert_performance_and_profiling"], "fail")

    def test_no_health_endpoint_fails_section5(self):
        m = copy.deepcopy(COMPLETE)
        m["expert_surfaces"]["api_health_endpoint_provided_expert"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], NOT_READY)
        self.assertEqual(
            v["sections"]["expert_api_and_cli_surfaces"], "fail")
        self.assertEqual(
            check_status(v, "expert_api_health_endpoint_provided"), "fail")

    def test_cli_not_pipe_friendly_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["expert_surfaces"][
            "cli_pipe_friendly_output_declared_expert"] = False
        self.assertEqual(evaluate(m)["verdict"], NOT_READY)

    def test_no_hypothesis_fails_section6(self):
        m = copy.deepcopy(COMPLETE)
        m["expert_testing"][
            "hypothesis_property_tests_on_core_logic_expert"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], NOT_READY)
        self.assertEqual(v["sections"]["expert_testing_and_tooling"], "fail")

    def test_no_pre_commit_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["expert_testing"]["pre_commit_hooks_configured_expert"] = False
        self.assertEqual(
            check_status(evaluate(m), "expert_pre_commit_hooks_configured"),
            "fail")

    def test_untyped_sprawling_script_fails_red_lines(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"]["untyped_sprawling_script_present"] = True
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "expert_no_untyped_sprawling_scripts"), "fail")
        self.assertEqual(v["sections"]["red_lines"], "fail")

    def test_mutable_defaults_fail_red_lines(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"]["mutable_default_arguments_present"] = True
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "expert_no_mutable_default_arguments"), "fail")
        self.assertEqual(v["verdict"], NOT_READY)

    def test_bare_except_fails_red_lines(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"]["bare_except_present"] = True
        self.assertEqual(
            check_status(evaluate(m), "expert_no_bare_except_clauses"),
            "fail")

    def test_hidden_global_state_fails_red_lines(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"]["hidden_global_state_present"] = True
        self.assertEqual(
            check_status(evaluate(m), "expert_no_hidden_global_state"),
            "fail")

    def test_docker_for_venv_problem_fails_red_lines(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"][
            "docker_used_to_paper_over_venv_problem_present"] = True
        self.assertEqual(
            check_status(
                evaluate(m), "expert_no_docker_substitute_for_venv_fix"),
            "fail")

    def test_absent_evidence_is_insufficient_not_failed(self):
        m = copy.deepcopy(COMPLETE)
        del m["expert_testing"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["expert_testing_and_tooling"],
                         "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertTrue(
            all(c["status"] == "missing" for c in v["checks"]))
        self.assertIsNone(v["computed_status"])
        self.assertIsNone(v["hot_paths_count"])
        self.assertIsNone(v["hot_paths_not_profiled_first"])
        self.assertIsNone(v["hot_paths_with_non_skill_route"])
        self.assertIsNone(v["profiled_first_coverage"])
        self.assertIsNone(v["skill_route_coverage"])
        self.assertIsNone(v["duplicate_hot_path_names"])

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertIn(f"VERDICT: {READY}", stamp(v))

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
            evaluate({"expert_typing": "should-be-an-object"})
        self.assertIn("expert_typing", str(ctx.exception))

    def test_list_field_as_object_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"hot_paths": {"name": "tokenizer-loop"}})
        self.assertIn("hot_paths", str(ctx.exception))

    def test_list_entry_as_string_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"hot_paths": ["tokenizer-loop"]})
        self.assertIn("hot_paths[0]", str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["expert_async"][
            "no_blocking_calls_in_async_paths_expert"] = "yes"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn(
            "expert_async.no_blocking_calls_in_async_paths_expert",
            str(ctx.exception))

    def test_nested_list_entry_string_field_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["hot_paths"][0]["name"] = 42
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("hot_paths[0].name", str(ctx.exception))

    def test_nested_list_entry_boolean_field_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["hot_paths"][1]["profiled_before_optimizing_expert"] = "yes"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn(
            "hot_paths[1].profiled_before_optimizing_expert",
            str(ctx.exception))

    def test_nested_list_entry_route_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["hot_paths"][1]["acceleration_route_expert"] = 7
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("hot_paths[1].acceleration_route_expert",
                      str(ctx.exception))

    def test_null_section_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["expert_packaging"] = None
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("expert_packaging", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
