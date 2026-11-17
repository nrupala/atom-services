import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from strict_typescript_engineering_pack import evaluate, stamp  # noqa: E402

COMPLETE = {
    "project": "frontend-tooling-app",
    "tsconfig": {
        "strict_true_enabled": True,
        "no_unchecked_indexed_access_enabled": True,
        "tsc_no_emit_in_development_loop": True,
        "tsc_no_emit_clean_under_strict": True},
    "typing": {
        "unknown_used_and_narrowed_instead_of_any": True,
        "no_any_in_src": True,
        "casts_avoided_or_remaining_justified": True,
        "non_null_assertion_chains_absent": True},
    "boundary_validation": {
        "external_input_validated_with_schema": True,
        "parse_not_trust_at_edges": True},
    "boundaries": [
        {"name": "api-response", "schema_validated": True,
         "schema_tested": True},
        {"name": "local-storage", "schema_validated": True,
         "schema_tested": True},
    ],
    "state_modelling": {
        "discriminated_unions_for_status_machines": True,
        "exhaustive_switch_with_never_check": True,
        "illegal_states_unrepresentable_by_design": True},
    "module_structure": {
        "small_files_kept": True,
        "deep_imports_preferred_over_barrel_files": True,
        "explicit_public_surfaces": True},
    "modules": [
        {"name": "src/orders.ts", "any_free": True,
         "explicit_public_surface": True},
        {"name": "src/billing.ts", "any_free": True,
         "explicit_public_surface": True},
    ],
    "async_practices": {
        "all_promises_awaited_or_handled": True,
        "no_floating_promises": True,
        "promise_handling_lint_rule_enabled": True,
        "abort_controller_for_cancellable_work": True},
    "testing": {
        "unit_tests_for_logic_with_vitest": True,
        "integration_tests_at_module_edges": True,
        "types_tested_by_compilation": True},
    "build_tooling": {
        "tsc_for_types_and_bundler_for_bundling": True,
        "source_maps_enabled": True,
        "dependencies_pinned": True,
        "lint_clean": True},
    "red_lines": {
        "ts_ignore_or_ts_expect_error_without_tracked_reason_present": False,
        "unvalidated_runtime_shapes_assumed_present": False,
        "any_in_src_present": False,
        "floating_promises_present": False},
}


def check_status(v, name):
    return next(c["status"] for c in v["checks"] if c["check"] == name)


class VerdictTests(unittest.TestCase):
    def test_complete_manifest_is_ready(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(
            v["verdict"], "STRICT_TYPESCRIPT_ENGINEERING_PACK_READY")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(len(v["checks"]), 39)
        self.assertEqual(len(v["sections"]), 8)
        self.assertEqual(v["computed_status"],
                         "within_stated_limits_on_declared_evidence")
        self.assertEqual(v["boundaries_count"], 2)
        self.assertEqual(v["modules_count"], 2)
        self.assertEqual(v["boundaries_without_schema_validation"], [])
        self.assertEqual(v["boundaries_without_schema_tests"], [])
        self.assertEqual(v["modules_not_any_free"], [])
        self.assertEqual(v["modules_without_explicit_public_surface"], [])
        self.assertEqual(v["strict_flag_coverage"], "1.000000")
        self.assertEqual(v["schema_validation_coverage"], "1.000000")
        self.assertEqual(v["schema_test_coverage"], "1.000000")
        self.assertEqual(v["any_free_coverage"], "1.000000")
        self.assertEqual(v["explicit_public_surface_coverage"], "1.000000")
        self.assertEqual(v["duplicate_boundary_names"], [])
        self.assertEqual(v["duplicate_module_names"], [])

    def test_empty_row_lists_are_valid_declarations(self):
        m = copy.deepcopy(COMPLETE)
        m["boundaries"] = []
        m["modules"] = []
        v = evaluate(m)
        self.assertEqual(
            v["verdict"], "STRICT_TYPESCRIPT_ENGINEERING_PACK_READY")
        self.assertEqual(v["boundaries_count"], 0)
        self.assertEqual(v["modules_count"], 0)
        self.assertIsNone(v["schema_validation_coverage"])
        self.assertIsNone(v["any_free_coverage"])
        self.assertEqual(check_status(v, "ts_boundaries_declared"), "pass")
        self.assertEqual(check_status(v, "ts_modules_declared"), "pass")

    def test_strict_disabled_fails_and_halves_strict_flag_coverage(self):
        m = copy.deepcopy(COMPLETE)
        m["tsconfig"]["strict_true_enabled"] = False
        v = evaluate(m)
        self.assertEqual(
            v["verdict"], "STRICT_TYPESCRIPT_ENGINEERING_PACK_NOT_READY")
        self.assertEqual(
            v["sections"]["strict_tsconfig_and_compiler_gate"], "fail")
        self.assertEqual(v["strict_flag_coverage"], "0.500000")

    def test_no_unchecked_indexed_access_disabled_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["tsconfig"]["no_unchecked_indexed_access_enabled"] = False
        self.assertEqual(
            check_status(v := evaluate(m),
                         "ts_no_unchecked_indexed_access_enabled"), "fail")
        self.assertEqual(v["strict_flag_coverage"], "0.500000")

    def test_missing_strict_flag_is_missing_and_coverage_null(self):
        m = copy.deepcopy(COMPLETE)
        del m["tsconfig"]["strict_true_enabled"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertIsNone(v["strict_flag_coverage"])

    def test_any_in_src_fails_typing(self):
        m = copy.deepcopy(COMPLETE)
        m["typing"]["no_any_in_src"] = False
        v = evaluate(m)
        self.assertEqual(v["sections"]["typing_discipline_no_any"], "fail")
        self.assertEqual(
            check_status(v, "ts_src_declared_any_free"), "fail")

    def test_unjustified_casts_fail(self):
        m = copy.deepcopy(COMPLETE)
        m["typing"]["casts_avoided_or_remaining_justified"] = False
        self.assertEqual(
            check_status(evaluate(m), "ts_casts_avoided_or_justified"),
            "fail")

    def test_boundary_without_schema_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["boundaries"][0]["schema_validated"] = False
        v = evaluate(m)
        self.assertEqual(
            v["verdict"], "STRICT_TYPESCRIPT_ENGINEERING_PACK_NOT_READY")
        self.assertEqual(
            check_status(v, "every_ts_boundary_schema_validated"), "fail")
        self.assertEqual(v["boundaries_without_schema_validation"],
                         ["api-response"])
        self.assertEqual(v["schema_validation_coverage"], "0.500000")
        self.assertEqual(v["computed_status"],
                         "outside_stated_limits_on_declared_evidence")

    def test_boundary_without_schema_tests_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["boundaries"][1]["schema_tested"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_ts_boundary_schema_tested"), "fail")
        self.assertEqual(v["boundaries_without_schema_tests"],
                         ["local-storage"])
        self.assertEqual(v["schema_test_coverage"], "0.500000")

    def test_boundary_missing_schema_field_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["boundaries"][0]["schema_validated"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "every_ts_boundary_schema_validated"),
            "missing")
        self.assertEqual(v["boundaries_without_schema_validation"], [])

    def test_duplicate_boundary_name_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["boundaries"][1]["name"] = "api-response"
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "no_ts_boundary_name_duplicated"), "fail")
        self.assertEqual(v["duplicate_boundary_names"], ["api-response"])

    def test_absent_boundaries_list_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["boundaries"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(check_status(v, "ts_boundaries_declared"),
                         "missing")
        self.assertIsNone(v["computed_status"])
        self.assertIsNone(v["boundaries_count"])
        self.assertIsNone(v["boundaries_without_schema_validation"])
        self.assertIsNone(v["schema_validation_coverage"])
        self.assertIsNone(v["duplicate_boundary_names"])

    def test_non_union_status_machine_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["state_modelling"][
            "discriminated_unions_for_status_machines"] = False
        v = evaluate(m)
        self.assertEqual(
            v["sections"]["state_modelling_with_discriminated_unions"],
            "fail")

    def test_missing_never_check_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["state_modelling"]["exhaustive_switch_with_never_check"] = False
        self.assertEqual(
            check_status(evaluate(m), "ts_exhaustive_switch_never_check"),
            "fail")

    def test_module_with_any_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["modules"][0]["any_free"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_ts_module_any_free"), "fail")
        self.assertEqual(v["modules_not_any_free"], ["src/orders.ts"])
        self.assertEqual(v["any_free_coverage"], "0.500000")
        self.assertEqual(v["computed_status"],
                         "outside_stated_limits_on_declared_evidence")

    def test_module_without_explicit_surface_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["modules"][1]["explicit_public_surface"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_ts_module_explicit_public_surface"),
            "fail")
        self.assertEqual(v["modules_without_explicit_public_surface"],
                         ["src/billing.ts"])
        self.assertEqual(v["explicit_public_surface_coverage"], "0.500000")

    def test_duplicate_module_name_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["modules"][1]["name"] = "src/orders.ts"
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "no_ts_module_name_duplicated"), "fail")
        self.assertEqual(v["duplicate_module_names"], ["src/orders.ts"])

    def test_module_missing_name_is_missing_for_duplicate_check(self):
        m = copy.deepcopy(COMPLETE)
        del m["modules"][1]["name"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "no_ts_module_name_duplicated"), "missing")
        self.assertEqual(v["duplicate_module_names"], [])

    def test_absent_modules_list_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["modules"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertIsNone(v["modules_count"])
        self.assertIsNone(v["modules_not_any_free"])
        self.assertIsNone(v["duplicate_module_names"])

    def test_floating_promises_fail_async(self):
        m = copy.deepcopy(COMPLETE)
        m["async_practices"]["no_floating_promises"] = False
        v = evaluate(m)
        self.assertEqual(
            v["sections"]["async_and_cancellation_discipline"], "fail")

    def test_no_abort_controller_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["async_practices"]["abort_controller_for_cancellable_work"] = False
        self.assertEqual(
            check_status(
                evaluate(m), "ts_abort_controller_for_cancellable_work"),
            "fail")

    def test_no_vitest_unit_tests_fails_tooling_section(self):
        m = copy.deepcopy(COMPLETE)
        m["testing"]["unit_tests_for_logic_with_vitest"] = False
        v = evaluate(m)
        self.assertEqual(v["sections"]["tests_build_and_tooling"], "fail")

    def test_lint_not_clean_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["build_tooling"]["lint_clean"] = False
        self.assertEqual(
            check_status(evaluate(m), "ts_lint_clean_declared"), "fail")

    def test_untracked_ts_ignore_fails_red_lines(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"][
            "ts_ignore_or_ts_expect_error_without_tracked_reason_present"] = True
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "ts_no_untracked_ts_ignore_or_expect_error"),
            "fail")
        self.assertEqual(v["sections"]["typescript_red_lines"], "fail")

    def test_unvalidated_runtime_shapes_red_line_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"]["unvalidated_runtime_shapes_assumed_present"] = True
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "ts_no_unvalidated_runtime_shape_assumption"),
            "fail")
        self.assertEqual(
            v["verdict"], "STRICT_TYPESCRIPT_ENGINEERING_PACK_NOT_READY")

    def test_any_red_line_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"]["any_in_src_present"] = True
        self.assertEqual(
            check_status(evaluate(m), "ts_red_line_any_absent_from_src"),
            "fail")

    def test_absent_evidence_is_insufficient_not_failed(self):
        m = copy.deepcopy(COMPLETE)
        del m["testing"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["tests_build_and_tooling"],
                         "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertTrue(
            all(c["status"] == "missing" for c in v["checks"]))
        self.assertIsNone(v["computed_status"])
        self.assertIsNone(v["boundaries_count"])
        self.assertIsNone(v["modules_count"])
        self.assertIsNone(v["strict_flag_coverage"])
        self.assertIsNone(v["schema_validation_coverage"])
        self.assertIsNone(v["any_free_coverage"])
        self.assertIsNone(v["duplicate_boundary_names"])
        self.assertIsNone(v["duplicate_module_names"])

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertIn(
            "VERDICT: STRICT_TYPESCRIPT_ENGINEERING_PACK_READY",
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
            evaluate({"tsconfig": "should-be-an-object"})
        self.assertIn("tsconfig", str(ctx.exception))

    def test_list_field_as_object_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"boundaries": {"name": "api-response"}})
        self.assertIn("boundaries", str(ctx.exception))

    def test_list_entry_as_string_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"modules": ["src/orders.ts"]})
        self.assertIn("modules[0]", str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["tsconfig"]["strict_true_enabled"] = "yes"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("tsconfig.strict_true_enabled", str(ctx.exception))

    def test_nested_list_entry_string_field_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["boundaries"][0]["name"] = 42
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("boundaries[0].name", str(ctx.exception))

    def test_nested_list_entry_boolean_field_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["modules"][1]["any_free"] = 7
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("modules[1].any_free", str(ctx.exception))

    def test_null_section_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["testing"] = None
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("testing", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
