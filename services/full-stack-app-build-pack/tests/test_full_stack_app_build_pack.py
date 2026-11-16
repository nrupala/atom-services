import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from full_stack_app_build_pack import evaluate, stamp  # noqa: E402

COMPLETE = {
    "project": "booking-app",
    "approach": {"problem_and_data_flow_understood": True,
                 "user_visible_outcome_defined": True,
                 "source_of_truth_identified": True,
                 "contract_defined_first": True,
                 "data_shape_defined_first": True,
                 "vertical_slice_before_widening": True},
    "slices": [
        {"name": "book-a-slot", "end_to_end_complete": True},
        {"name": "list-bookings", "end_to_end_complete": True},
    ],
    "frontend": {"vanilla_ts_web_components_used": True,
                 "progressive_enhancement_applied": True,
                 "dependency_tree_kept_small": True,
                 "mobile_first_responsive": True,
                 "viewport_configured": True,
                 "touch_targets_at_least_44px": True,
                 "semantic_html_used": True,
                 "keyboard_navigation_supported": True,
                 "aria_only_where_needed": True,
                 "sufficient_contrast": True,
                 "boundaries_typed_no_any": True,
                 "undefined_fields_guarded_when_rendering": True,
                 "framework_bloat_present": False},
    "backend": {"api_contracts_versioned": True,
                "input_validated_at_boundary": True,
                "handlers_stateless": True,
                "idempotency_for_retried_writes": True,
                "error_taxonomy_defined": True,
                "structured_error_responses": True,
                "bare_500_responses_present": False,
                "health_endpoint_present": True},
    "data": {"schema_is_source_of_truth": True,
             "migrations_forward_only": True,
             "migrations_backward_compatible": True,
             "parametrized_queries_only": True,
             "string_concatenated_sql_present": False},
    "security": {"authn_authz_separated": True,
                 "least_privilege_enforced": True,
                 "secrets_via_env_or_secret_store": True,
                 "secrets_rotatable": True,
                 "secrets_in_repo_present": False,
                 "owasp_top10_reviewed": True,
                 "zero_knowledge_required": True,
                 "client_side_encryption_applied": True,
                 "user_held_keys": True},
    "testing": {"unit_tests_for_logic": True,
                "integration_tests_for_boundaries": True,
                "e2e_critical_path_tested": True,
                "tests_target_contract_not_implementation": True,
                "tests_deferred_present": False,
                "observability_in_place": True,
                "graceful_degradation": True,
                "stranger_readable_code": True},
    "deploy": {"docker_used_present": False,
               "uses_direct_or_platform_native_deploy": True,
               "staging_deployed_first": True,
               "direct_to_production_used": False,
               "github_repo_in_sync_with_deployed": True,
               "big_bang_release_present": False,
               "premature_optimization_present": False},
}


def check_status(v, name):
    return next(c["status"] for c in v["checks"] if c["check"] == name)


class VerdictTests(unittest.TestCase):
    def test_complete_manifest_is_sound(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(v["verdict"], "FULL_STACK_BUILD_SOUND")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(len(v["checks"]), 57)
        self.assertEqual(v["computed_status"],
                         "within_stated_limits_on_declared_evidence")
        self.assertEqual(v["slices_count"], 2)
        self.assertEqual(v["slices_not_end_to_end"], [])
        self.assertEqual(v["slice_end_to_end_coverage"], "1.000000")

    def test_contract_not_defined_first_fails_approach_section(self):
        m = copy.deepcopy(COMPLETE)
        m["approach"]["contract_defined_first"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "FULL_STACK_BUILD_NOT_SOUND")
        self.assertEqual(v["sections"]["approach_and_contracts"], "fail")

    def test_slice_not_end_to_end_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["slices"][1]["end_to_end_complete"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "FULL_STACK_BUILD_NOT_SOUND")
        self.assertEqual(check_status(v, "every_slice_end_to_end"), "fail")
        self.assertEqual(v["slices_not_end_to_end"], ["list-bookings"])
        self.assertEqual(v["slice_end_to_end_coverage"], "0.500000")
        self.assertEqual(v["computed_status"],
                         "outside_stated_limits_on_declared_evidence")

    def test_slice_missing_e2e_field_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["slices"][0]["end_to_end_complete"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(check_status(v, "every_slice_end_to_end"),
                         "missing")
        self.assertEqual(v["slices_not_end_to_end"], [])

    def test_empty_slices_list_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["slices"] = []
        v = evaluate(m)
        self.assertEqual(check_status(v, "slices_declared"), "fail")
        self.assertEqual(v["slices_count"], 0)
        self.assertIsNone(v["slice_end_to_end_coverage"])
        self.assertEqual(v["slices_not_end_to_end"], [])

    def test_framework_bloat_fails_frontend_section(self):
        m = copy.deepcopy(COMPLETE)
        m["frontend"]["framework_bloat_present"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "FULL_STACK_BUILD_NOT_SOUND")
        self.assertEqual(v["sections"]["frontend"], "fail")
        self.assertEqual(check_status(v, "no_framework_bloat"), "fail")

    def test_touch_targets_below_44px_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["frontend"]["touch_targets_at_least_44px"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "FULL_STACK_BUILD_NOT_SOUND")

    def test_bare_500_responses_fail_backend_section(self):
        m = copy.deepcopy(COMPLETE)
        m["backend"]["bare_500_responses_present"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "FULL_STACK_BUILD_NOT_SOUND")
        self.assertEqual(v["sections"]["backend_and_data"], "fail")
        self.assertEqual(check_status(v, "no_bare_500_responses"), "fail")

    def test_no_health_endpoint_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["backend"]["health_endpoint_present"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "FULL_STACK_BUILD_NOT_SOUND")

    def test_string_concatenated_sql_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["data"]["string_concatenated_sql_present"] = True
        v = evaluate(m)
        self.assertEqual(check_status(v, "no_string_concatenated_sql"),
                         "fail")
        self.assertEqual(v["verdict"], "FULL_STACK_BUILD_NOT_SOUND")

    def test_non_parametrized_queries_fail(self):
        m = copy.deepcopy(COMPLETE)
        m["data"]["parametrized_queries_only"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "FULL_STACK_BUILD_NOT_SOUND")

    def test_secrets_in_repo_fail_security_section(self):
        m = copy.deepcopy(COMPLETE)
        m["security"]["secrets_in_repo_present"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "FULL_STACK_BUILD_NOT_SOUND")
        self.assertEqual(v["sections"]["security"], "fail")
        self.assertEqual(check_status(v, "no_secrets_in_repo"), "fail")

    def test_zero_knowledge_required_but_no_client_encryption_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["security"]["client_side_encryption_applied"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "client_side_encryption_applied"), "fail")
        self.assertEqual(v["verdict"], "FULL_STACK_BUILD_NOT_SOUND")

    def test_zero_knowledge_not_required_passes_gated_checks_as_na(self):
        m = copy.deepcopy(COMPLETE)
        m["security"]["zero_knowledge_required"] = False
        del m["security"]["client_side_encryption_applied"]
        del m["security"]["user_held_keys"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "FULL_STACK_BUILD_SOUND")
        self.assertEqual(
            check_status(v, "client_side_encryption_applied"), "pass")
        self.assertEqual(check_status(v, "user_held_keys"), "pass")

    def test_zero_knowledge_missing_target_field_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["security"]["user_held_keys"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(check_status(v, "user_held_keys"), "missing")

    def test_tests_deferred_fails_testing_section(self):
        m = copy.deepcopy(COMPLETE)
        m["testing"]["tests_deferred_present"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "FULL_STACK_BUILD_NOT_SOUND")
        self.assertEqual(v["sections"]["testing_and_quality"], "fail")
        self.assertEqual(check_status(v, "no_tests_deferred"), "fail")

    def test_no_e2e_critical_path_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["testing"]["e2e_critical_path_tested"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "FULL_STACK_BUILD_NOT_SOUND")

    def test_docker_used_fails_deploy_section(self):
        m = copy.deepcopy(COMPLETE)
        m["deploy"]["docker_used_present"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "FULL_STACK_BUILD_NOT_SOUND")
        self.assertEqual(v["sections"]["deploy_and_delivery"], "fail")
        self.assertEqual(check_status(v, "no_docker_used"), "fail")

    def test_direct_to_prod_without_named_bridge_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["deploy"]["direct_to_production_used"] = True
        m["deploy"]["direct_to_prod_named_bridge_with_end_date"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "direct_to_prod_named_bridge_with_end_date"),
            "fail")
        self.assertEqual(v["verdict"], "FULL_STACK_BUILD_NOT_SOUND")

    def test_direct_to_prod_with_named_bridge_passes(self):
        m = copy.deepcopy(COMPLETE)
        m["deploy"]["direct_to_production_used"] = True
        m["deploy"]["direct_to_prod_named_bridge_with_end_date"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "FULL_STACK_BUILD_SOUND")
        self.assertEqual(
            check_status(v, "direct_to_prod_named_bridge_with_end_date"),
            "pass")

    def test_no_direct_to_prod_passes_gated_check_as_na(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(
            check_status(v, "direct_to_prod_named_bridge_with_end_date"),
            "pass")

    def test_big_bang_release_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["deploy"]["big_bang_release_present"] = True
        v = evaluate(m)
        self.assertEqual(check_status(v, "no_big_bang_release"), "fail")
        self.assertEqual(v["verdict"], "FULL_STACK_BUILD_NOT_SOUND")

    def test_absent_evidence_is_insufficient_not_failed(self):
        m = copy.deepcopy(COMPLETE)
        del m["backend"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["backend_and_data"],
                         "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertTrue(
            all(c["status"] == "missing" for c in v["checks"]))
        self.assertIsNone(v["computed_status"])
        self.assertIsNone(v["slices_count"])
        self.assertIsNone(v["slices_not_end_to_end"])
        self.assertIsNone(v["slice_end_to_end_coverage"])

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertIn("VERDICT: FULL_STACK_BUILD_SOUND", stamp(v))

    def test_non_object_manifest_rejected(self):
        with self.assertRaises(TypeError):
            evaluate(["not", "a", "manifest"])


class MalformedTypeTests(unittest.TestCase):
    """F1 regression: a documented field present with the wrong
    JSON type is rejected with TypeError naming the field."""

    def test_string_field_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["project"] = 12345
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("project", str(ctx.exception))

    def test_object_section_as_string_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"backend": "should-be-an-object"})
        self.assertIn("backend", str(ctx.exception))

    def test_list_field_as_object_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"slices": {"name": "book-a-slot"}})
        self.assertIn("slices", str(ctx.exception))

    def test_list_entry_as_string_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"slices": ["book-a-slot"]})
        self.assertIn("slices[0]", str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["backend"]["api_contracts_versioned"] = "yes"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("backend.api_contracts_versioned",
                      str(ctx.exception))

    def test_nested_list_entry_string_field_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["slices"][0]["name"] = 42
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("slices[0].name", str(ctx.exception))

    def test_nested_list_entry_boolean_field_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["slices"][1]["end_to_end_complete"] = "yes"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("slices[1].end_to_end_complete",
                      str(ctx.exception))

    def test_null_section_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["security"] = None
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("security", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
