import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from mcp_server_design_and_review import evaluate, stamp  # noqa: E402

COMPLETE = {
    "server": "filings-server",
    "tool_design": {"names_are_verb_noun": True,
                    "typed_json_schemas": True,
                    "descriptions_state_when_to_use": True,
                    "errors_teach_fix": True,
                    "one_job_per_tool": True,
                    "god_tools_present": False},
    "budget": {"smallest_set_covers_job": True,
               "related_operations_grouped": True},
    "tools": [
        {"name": "get_filing", "operation": "read",
         "has_typed_schema": True, "single_job": True,
         "has_negative_test": True,
         "approval_or_scope_gate_present": False},
        {"name": "create_filing", "operation": "write",
         "has_typed_schema": True, "single_job": True,
         "has_negative_test": True,
         "approval_or_scope_gate_present": False},
        {"name": "delete_filing", "operation": "destructive",
         "has_typed_schema": True, "single_job": True,
         "has_negative_test": True,
         "approval_or_scope_gate_present": True},
    ],
    "transport": {"transport_matches_deployment": True,
                  "handlers_stateless_where_possible": True,
                  "boundary_validation_applied": True},
    "auth": {"remote_transports_authenticated": True,
             "remote_tls_present": True,
             "least_privilege_tokens_per_server": True},
    "safety": {"destructive_actions_gated_by_approval_or_scope": True,
               "read_and_write_separated": True},
    "injection": {"tool_results_treated_as_untrusted": True,
                  "fetched_text_never_treated_as_instructions": True,
                  "response_sizes_capped": True,
                  "outputs_sanitized_before_echoing": True},
    "versioning": {"capabilities_negotiated": True,
                   "changes_additive": True,
                   "deprecations_announced_loudly": True,
                   "protocol_versions_pinned": True},
    "tests": {"handshake_smoke_in_ci": True,
              "per_tool_happy_and_error_cases_covered": True,
              "malformed_input_tests_present": True,
              "schema_valid_tool_definitions": True},
    "observability": {"calls_logged_with_tool_duration_outcome": True,
                      "error_rate_spike_alerts_present": True,
                      "secrets_or_sensitive_payloads_logged_present": False},
    "red_lines": {"shell_passthrough_without_sandboxing_present": False,
                  "secrets_echoed_back_present": False,
                  "unbounded_resource_reads_present": False},
}


def check_status(v, name):
    return next(c["status"] for c in v["checks"] if c["check"] == name)


class VerdictTests(unittest.TestCase):
    def test_complete_manifest_is_sound(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(v["verdict"], "MCP_SERVER_SOUND")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(len(v["checks"]), 41)
        self.assertEqual(v["computed_status"],
                         "within_stated_limits_on_declared_evidence")
        self.assertEqual(v["tools_count"], 3)
        self.assertEqual(v["tools_without_typed_schema"], [])
        self.assertEqual(v["typed_schema_coverage"], "1.000000")
        self.assertEqual(v["tools_not_single_job"], [])
        self.assertEqual(v["single_job_coverage"], "1.000000")
        self.assertEqual(v["tools_with_invalid_operation"], [])
        self.assertEqual(v["valid_operation_coverage"], "1.000000")
        self.assertEqual(v["duplicate_tool_names"], [])
        self.assertEqual(v["destructive_tools_without_gate"], [])
        self.assertEqual(v["destructive_gate_coverage"], "1.000000")
        self.assertEqual(v["tools_without_negative_test"], [])
        self.assertEqual(v["negative_test_coverage"], "1.000000")

    def test_god_tool_fails_tool_design_section(self):
        m = copy.deepcopy(COMPLETE)
        m["tool_design"]["god_tools_present"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "MCP_SERVER_NOT_SOUND")
        self.assertEqual(v["sections"]["tool_design_and_budget"], "fail")
        self.assertEqual(check_status(v, "no_god_tools"), "fail")

    def test_tool_without_typed_schema_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["tools"][0]["has_typed_schema"] = False
        v = evaluate(m)
        self.assertEqual(check_status(v, "every_tool_has_typed_schema"),
                         "fail")
        self.assertEqual(v["tools_without_typed_schema"], ["get_filing"])
        self.assertEqual(v["typed_schema_coverage"], "0.666667")
        self.assertEqual(v["computed_status"],
                         "outside_stated_limits_on_declared_evidence")

    def test_tool_missing_schema_field_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["tools"][0]["has_typed_schema"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(check_status(v, "every_tool_has_typed_schema"),
                         "missing")
        self.assertEqual(v["tools_without_typed_schema"], [])

    def test_tool_not_single_job_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["tools"][1]["single_job"] = False
        v = evaluate(m)
        self.assertEqual(check_status(v, "every_tool_single_job"), "fail")
        self.assertEqual(v["tools_not_single_job"], ["create_filing"])
        self.assertEqual(v["single_job_coverage"], "0.666667")

    def test_tool_with_invalid_operation_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["tools"][1]["operation"] = "execute"
        v = evaluate(m)
        self.assertEqual(check_status(v, "every_tool_operation_valid"),
                         "fail")
        self.assertEqual(v["tools_with_invalid_operation"],
                         ["create_filing"])
        self.assertEqual(v["valid_operation_coverage"], "0.666667")

    def test_tool_missing_operation_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["tools"][1]["operation"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(check_status(v, "every_tool_operation_valid"),
                         "missing")
        self.assertEqual(v["tools_with_invalid_operation"], [])

    def test_duplicate_tool_name_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["tools"][2]["name"] = "get_filing"
        v = evaluate(m)
        self.assertEqual(check_status(v, "no_tool_name_duplicated"), "fail")
        self.assertEqual(v["duplicate_tool_names"], ["get_filing"])

    def test_tool_missing_name_is_missing_for_duplicate_check(self):
        m = copy.deepcopy(COMPLETE)
        del m["tools"][2]["name"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(check_status(v, "no_tool_name_duplicated"),
                         "missing")
        self.assertEqual(v["duplicate_tool_names"], [])

    def test_empty_tools_list_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["tools"] = []
        v = evaluate(m)
        self.assertEqual(check_status(v, "tools_declared"), "fail")
        self.assertEqual(v["tools_count"], 0)
        self.assertIsNone(v["typed_schema_coverage"])
        self.assertIsNone(v["single_job_coverage"])
        self.assertIsNone(v["valid_operation_coverage"])
        self.assertIsNone(v["destructive_gate_coverage"])
        self.assertIsNone(v["negative_test_coverage"])
        self.assertEqual(v["duplicate_tool_names"], [])
        self.assertEqual(v["destructive_tools_without_gate"], [])

    def test_no_remote_auth_fails_transports_section(self):
        m = copy.deepcopy(COMPLETE)
        m["auth"]["remote_transports_authenticated"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "MCP_SERVER_NOT_SOUND")
        self.assertEqual(v["sections"]["transports_and_auth"], "fail")
        self.assertEqual(
            check_status(v, "remote_transports_authenticated"), "fail")

    def test_no_boundary_validation_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["transport"]["boundary_validation_applied"] = False
        self.assertEqual(evaluate(m)["verdict"], "MCP_SERVER_NOT_SOUND")

    def test_destructive_tool_without_gate_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["tools"][2]["approval_or_scope_gate_present"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_destructive_tool_gated"), "fail")
        self.assertEqual(v["destructive_tools_without_gate"],
                         ["delete_filing"])
        self.assertEqual(v["destructive_gate_coverage"], "0.000000")
        self.assertEqual(
            v["sections"]["safety_rails_and_injection_awareness"], "fail")

    def test_destructive_tool_missing_gate_field_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["tools"][2]["approval_or_scope_gate_present"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "every_destructive_tool_gated"), "missing")
        self.assertEqual(v["destructive_tools_without_gate"], [])
        self.assertEqual(v["destructive_gate_coverage"], "0.000000")

    def test_no_destructive_tools_passes_gate_check_vacuously(self):
        m = copy.deepcopy(COMPLETE)
        m["tools"][2]["operation"] = "write"
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_destructive_tool_gated"), "pass")
        self.assertIsNone(v["destructive_gate_coverage"])
        self.assertEqual(v["destructive_tools_without_gate"], [])
        self.assertEqual(v["verdict"], "MCP_SERVER_SOUND")

    def test_fetched_text_as_instructions_fails_safety_section(self):
        m = copy.deepcopy(COMPLETE)
        m["injection"]["fetched_text_never_treated_as_instructions"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "MCP_SERVER_NOT_SOUND")
        self.assertEqual(
            v["sections"]["safety_rails_and_injection_awareness"], "fail")

    def test_uncapped_responses_fail(self):
        m = copy.deepcopy(COMPLETE)
        m["injection"]["response_sizes_capped"] = False
        self.assertEqual(
            check_status(evaluate(m), "response_sizes_capped"), "fail")

    def test_breaking_changes_fail_versioning_section(self):
        m = copy.deepcopy(COMPLETE)
        m["versioning"]["changes_additive"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "MCP_SERVER_NOT_SOUND")
        self.assertEqual(
            v["sections"]["versioning_contract_tests_and_observability"],
            "fail")

    def test_no_handshake_smoke_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["tests"]["handshake_smoke_in_ci"] = False
        self.assertEqual(
            check_status(evaluate(m), "handshake_smoke_in_ci"), "fail")

    def test_tool_without_negative_test_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["tools"][0]["has_negative_test"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_tool_has_negative_test"), "fail")
        self.assertEqual(v["tools_without_negative_test"], ["get_filing"])
        self.assertEqual(v["negative_test_coverage"], "0.666667")

    def test_secrets_logged_fails_observability_check(self):
        m = copy.deepcopy(COMPLETE)
        m["observability"][
            "secrets_or_sensitive_payloads_logged_present"] = True
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "no_secrets_or_sensitive_payloads_logged"),
            "fail")
        self.assertEqual(v["verdict"], "MCP_SERVER_NOT_SOUND")

    def test_shell_passthrough_without_sandboxing_fails_red_lines(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"][
            "shell_passthrough_without_sandboxing_present"] = True
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "no_shell_passthrough_without_sandboxing"),
            "fail")
        self.assertEqual(v["sections"]["red_lines"], "fail")

    def test_secrets_echoed_and_unbounded_reads_fail_red_lines(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"]["secrets_echoed_back_present"] = True
        m["red_lines"]["unbounded_resource_reads_present"] = True
        v = evaluate(m)
        self.assertEqual(check_status(v, "no_secrets_echoed_back"), "fail")
        self.assertEqual(
            check_status(v, "no_unbounded_resource_reads"), "fail")

    def test_absent_evidence_is_insufficient_not_failed(self):
        m = copy.deepcopy(COMPLETE)
        del m["observability"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            v["sections"]["versioning_contract_tests_and_observability"],
            "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertTrue(
            all(c["status"] == "missing" for c in v["checks"]))
        self.assertIsNone(v["computed_status"])
        self.assertIsNone(v["tools_count"])
        self.assertIsNone(v["tools_without_typed_schema"])
        self.assertIsNone(v["typed_schema_coverage"])
        self.assertIsNone(v["tools_not_single_job"])
        self.assertIsNone(v["single_job_coverage"])
        self.assertIsNone(v["tools_with_invalid_operation"])
        self.assertIsNone(v["valid_operation_coverage"])
        self.assertIsNone(v["duplicate_tool_names"])
        self.assertIsNone(v["destructive_tools_without_gate"])
        self.assertIsNone(v["destructive_gate_coverage"])
        self.assertIsNone(v["tools_without_negative_test"])
        self.assertIsNone(v["negative_test_coverage"])

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertIn("VERDICT: MCP_SERVER_SOUND", stamp(v))

    def test_non_object_manifest_rejected(self):
        with self.assertRaises(TypeError):
            evaluate(["not", "a", "manifest"])


class MalformedTypeTests(unittest.TestCase):
    def test_string_field_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["server"] = 12345
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("server", str(ctx.exception))

    def test_object_section_as_string_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"transport": "should-be-an-object"})
        self.assertIn("transport", str(ctx.exception))

    def test_list_field_as_object_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"tools": {"name": "get_filing"}})
        self.assertIn("tools", str(ctx.exception))

    def test_list_entry_as_string_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"tools": ["get_filing"]})
        self.assertIn("tools[0]", str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["auth"]["remote_tls_present"] = "yes"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("auth.remote_tls_present", str(ctx.exception))

    def test_nested_list_entry_string_field_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["tools"][0]["name"] = 42
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("tools[0].name", str(ctx.exception))

    def test_nested_list_entry_operation_as_boolean_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["tools"][1]["operation"] = True
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("tools[1].operation", str(ctx.exception))

    def test_null_section_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["injection"] = None
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("injection", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
