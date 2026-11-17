import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from production_python_engineering_pack import evaluate, stamp  # noqa: E402

COMPLETE = {
    "project": "conduit-worker",
    "environment": {"virtualenv_per_project_used": True,
                    "dependencies_declared_in_pyproject": True,
                    "dependency_lockfile_present": True,
                    "no_installs_into_system_python": True},
    "dependencies": [
        {"name": "fastapi", "version_pinned": True},
        {"name": "pydantic", "version_pinned": True},
        {"name": "pytest", "version_pinned": True},
    ],
    "typing": {"public_functions_annotated": True,
               "type_checker_run_in_loop": True,
               "typed_models_at_boundaries_for_validation": True},
    "style": {"ruff_linter_configured": True,
              "formatter_ruff_format_or_black_configured": True,
              "no_mutable_default_arguments": True,
              "f_strings_used_for_formatting": True,
              "pathlib_used_over_string_paths": True},
    "errors": {"specific_exceptions_caught": True,
               "errors_fail_loudly_with_context": True,
               "logging_used_not_print_in_libraries": True},
    "resources": {"context_managers_used_for_files_sockets_locks": True,
                  "orphaned_handles_avoided": True},
    "async_practices": {"no_blocking_calls_in_event_loops": True,
                        "timeouts_on_every_network_call": True,
                        "structured_concurrency_used_where_possible": True},
    "testing": {"pytest_suite_present": True,
                "pytest_fixtures_used": True,
                "pytest_parametrize_used": True,
                "error_paths_tested_under_pytest": True,
                "time_and_randomness_frozen_in_tests": True,
                "unit_tests_fast_declared": True,
                "pytest_green_including_error_paths": True},
    "packaging": {"pyproject_metadata_present": True,
                  "console_entry_points_declared": True,
                  "reproducible_builds_declared": True,
                  "production_dependencies_pinned": True,
                  "ruff_and_type_checker_clean_on_diff": True,
                  "virtualenv_reproducible_declared": True},
    "red_lines": {"secrets_in_code_or_notebooks_present": False,
                  "unpinned_pip_install_in_production_paths_present": False,
                  "bare_except_present": False},
}


def check_status(v, name):
    return next(c["status"] for c in v["checks"] if c["check"] == name)


class VerdictTests(unittest.TestCase):
    def test_complete_manifest_is_ready(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(v["verdict"], "PRODUCTION_PYTHON_ENGINEERING_PACK_READY")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(len(v["checks"]), 39)
        self.assertEqual(v["computed_status"],
                         "within_stated_limits_on_declared_evidence")
        self.assertEqual(v["dependencies_count"], 3)
        self.assertEqual(v["dependencies_without_pin"], [])
        self.assertEqual(v["pin_coverage"], "1.000000")
        self.assertEqual(v["duplicate_dependency_names"], [])

    def test_empty_dependencies_list_is_a_valid_declaration(self):
        m = copy.deepcopy(COMPLETE)
        m["dependencies"] = []
        v = evaluate(m)
        self.assertEqual(v["verdict"], "PRODUCTION_PYTHON_ENGINEERING_PACK_READY")
        self.assertEqual(v["dependencies_count"], 0)
        self.assertEqual(v["dependencies_without_pin"], [])
        self.assertIsNone(v["pin_coverage"])
        self.assertEqual(v["duplicate_dependency_names"], [])
        self.assertEqual(check_status(v, "dependencies_declared"), "pass")
        self.assertEqual(
            check_status(v, "every_dependency_version_pinned"), "pass")

    def test_no_virtualenv_fails_section1(self):
        m = copy.deepcopy(COMPLETE)
        m["environment"]["virtualenv_per_project_used"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"],
                         "PRODUCTION_PYTHON_ENGINEERING_PACK_NOT_READY")
        self.assertEqual(
            v["sections"]["environment_and_dependencies"], "fail")
        self.assertEqual(
            check_status(v, "virtualenv_per_project_used"), "fail")

    def test_no_lockfile_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["environment"]["dependency_lockfile_present"] = False
        self.assertEqual(
            check_status(evaluate(m), "dependency_lockfile_present"),
            "fail")

    def test_system_python_installs_fail(self):
        m = copy.deepcopy(COMPLETE)
        m["environment"]["no_installs_into_system_python"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "PRODUCTION_PYTHON_ENGINEERING_PACK_NOT_READY")

    def test_unpinned_dependency_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["dependencies"][0]["version_pinned"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"],
                         "PRODUCTION_PYTHON_ENGINEERING_PACK_NOT_READY")
        self.assertEqual(
            check_status(v, "every_dependency_version_pinned"), "fail")
        self.assertEqual(v["dependencies_without_pin"], ["fastapi"])
        self.assertEqual(v["pin_coverage"], "0.666667")
        self.assertEqual(v["computed_status"],
                         "outside_stated_limits_on_declared_evidence")

    def test_dependency_missing_pin_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["dependencies"][0]["version_pinned"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "every_dependency_version_pinned"),
            "missing")
        self.assertEqual(v["dependencies_without_pin"], [])

    def test_duplicate_dependency_name_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["dependencies"][2]["name"] = "fastapi"
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "no_dependency_name_duplicated"), "fail")
        self.assertEqual(v["duplicate_dependency_names"], ["fastapi"])

    def test_dependency_missing_name_is_missing_for_duplicate_check(self):
        m = copy.deepcopy(COMPLETE)
        del m["dependencies"][2]["name"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "no_dependency_name_duplicated"), "missing")
        self.assertEqual(v["duplicate_dependency_names"], [])

    def test_absent_dependencies_list_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["dependencies"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(check_status(v, "dependencies_declared"),
                         "missing")
        self.assertIsNone(v["computed_status"])
        self.assertIsNone(v["dependencies_count"])
        self.assertIsNone(v["dependencies_without_pin"])
        self.assertIsNone(v["pin_coverage"])
        self.assertIsNone(v["duplicate_dependency_names"])

    def test_unannotated_public_functions_fail_section2(self):
        m = copy.deepcopy(COMPLETE)
        m["typing"]["public_functions_annotated"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"],
                         "PRODUCTION_PYTHON_ENGINEERING_PACK_NOT_READY")
        self.assertEqual(v["sections"]["typing_and_style"], "fail")

    def test_mutable_default_arguments_fail(self):
        m = copy.deepcopy(COMPLETE)
        m["style"]["no_mutable_default_arguments"] = False
        self.assertEqual(
            check_status(evaluate(m), "no_mutable_default_arguments"),
            "fail")

    def test_string_paths_fail(self):
        m = copy.deepcopy(COMPLETE)
        m["style"]["pathlib_used_over_string_paths"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "PRODUCTION_PYTHON_ENGINEERING_PACK_NOT_READY")

    def test_print_in_libraries_fails_section3(self):
        m = copy.deepcopy(COMPLETE)
        m["errors"]["logging_used_not_print_in_libraries"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"],
                         "PRODUCTION_PYTHON_ENGINEERING_PACK_NOT_READY")
        self.assertEqual(v["sections"]["errors_resources_and_async"],
                         "fail")

    def test_no_timeouts_on_network_calls_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["async_practices"]["timeouts_on_every_network_call"] = False
        self.assertEqual(
            check_status(evaluate(m), "timeouts_on_every_network_call"),
            "fail")

    def test_blocking_calls_in_event_loop_fail(self):
        m = copy.deepcopy(COMPLETE)
        m["async_practices"]["no_blocking_calls_in_event_loops"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "PRODUCTION_PYTHON_ENGINEERING_PACK_NOT_READY")

    def test_no_error_path_tests_fail_section4(self):
        m = copy.deepcopy(COMPLETE)
        m["testing"]["error_paths_tested_under_pytest"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"],
                         "PRODUCTION_PYTHON_ENGINEERING_PACK_NOT_READY")
        self.assertEqual(v["sections"]["testing_discipline"], "fail")

    def test_no_parametrize_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["testing"]["pytest_parametrize_used"] = False
        self.assertEqual(
            check_status(evaluate(m), "pytest_parametrize_used"), "fail")

    def test_unfrozen_time_and_randomness_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["testing"]["time_and_randomness_frozen_in_tests"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "PRODUCTION_PYTHON_ENGINEERING_PACK_NOT_READY")

    def test_no_console_entry_points_fail_section5(self):
        m = copy.deepcopy(COMPLETE)
        m["packaging"]["console_entry_points_declared"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"],
                         "PRODUCTION_PYTHON_ENGINEERING_PACK_NOT_READY")
        self.assertEqual(
            v["sections"]["packaging_and_reproducibility"], "fail")

    def test_type_checker_not_clean_on_diff_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["packaging"]["ruff_and_type_checker_clean_on_diff"] = False
        self.assertEqual(
            check_status(
                evaluate(m), "ruff_and_type_checker_clean_on_diff"),
            "fail")

    def test_non_reproducible_builds_fail(self):
        m = copy.deepcopy(COMPLETE)
        m["packaging"]["reproducible_builds_declared"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "PRODUCTION_PYTHON_ENGINEERING_PACK_NOT_READY")

    def test_secrets_in_code_fail_red_lines(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"]["secrets_in_code_or_notebooks_present"] = True
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "no_secrets_in_code_or_notebooks"), "fail")
        self.assertEqual(v["sections"]["red_lines"], "fail")

    def test_unpinned_pip_install_red_line_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"][
            "unpinned_pip_install_in_production_paths_present"] = True
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v, "no_unpinned_pip_install_in_production_paths"),
            "fail")
        self.assertEqual(v["verdict"],
                         "PRODUCTION_PYTHON_ENGINEERING_PACK_NOT_READY")

    def test_bare_except_red_line_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"]["bare_except_present"] = True
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "no_bare_except_clauses"), "fail")

    def test_absent_evidence_is_insufficient_not_failed(self):
        m = copy.deepcopy(COMPLETE)
        del m["testing"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["testing_discipline"],
                         "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertTrue(
            all(c["status"] == "missing" for c in v["checks"]))
        self.assertIsNone(v["computed_status"])
        self.assertIsNone(v["dependencies_count"])
        self.assertIsNone(v["dependencies_without_pin"])
        self.assertIsNone(v["pin_coverage"])
        self.assertIsNone(v["duplicate_dependency_names"])

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertIn(
            "VERDICT: PRODUCTION_PYTHON_ENGINEERING_PACK_READY",
            stamp(v))

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
            evaluate({"environment": "should-be-an-object"})
        self.assertIn("environment", str(ctx.exception))

    def test_list_field_as_object_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"dependencies": {"name": "fastapi"}})
        self.assertIn("dependencies", str(ctx.exception))

    def test_list_entry_as_string_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"dependencies": ["fastapi"]})
        self.assertIn("dependencies[0]", str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["testing"]["error_paths_tested_under_pytest"] = "yes"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("testing.error_paths_tested_under_pytest", str(ctx.exception))

    def test_nested_list_entry_string_field_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["dependencies"][0]["name"] = 42
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("dependencies[0].name", str(ctx.exception))

    def test_nested_list_entry_boolean_pin_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["dependencies"][1]["version_pinned"] = "yes"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("dependencies[1].version_pinned",
                      str(ctx.exception))

    def test_null_section_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["packaging"] = None
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("packaging", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
