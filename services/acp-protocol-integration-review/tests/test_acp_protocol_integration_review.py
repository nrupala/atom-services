import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from acp_protocol_integration_review import evaluate, stamp  # noqa: E402

SOUND_CLIENT = {
    "implementation": "editor ACP agent adapter",
    "protocol": {"flavor": "ACP-client",
                 "disambiguated_naming": True,
                 "spec_version_documented": True,
                 "supported_subset_documented": True},
    "adapter": {"thin": True,
                "single_core_protocol_at_edge": True,
                "business_logic_in_wire_layer": False},
    "surface": {"client_flow_complete": True,
                "client_permissions_handled": True},
    "lifecycle": {"unknown_sessions_or_runs_handled": True,
                  "cancels_handled": True,
                  "errors_handled": True,
                  "reconnects_handled": True,
                  "state_leaks_across_sessions": False},
    "streaming": {"updates_ordered": True,
                  "chunk_sizes_bounded": True,
                  "backpressure_addressed": True,
                  "terminal_states_clear": True},
    "security": {"remote_endpoints_present": True,
                 "remote_endpoints_authenticated": True,
                 "inputs_validated": True,
                 "output_sizes_capped": True,
                 "tool_execution_sandboxed": True},
    "honesty": {"unimplemented_modes_noted": True,
                "unsupported_features_faked": False},
    "tests": {"scripted_client_handshake_covered": True,
              "lifecycle_happy_error_cancel_covered": True,
              "contract_tests_in_ci_per_protocol": True},
    "upgrade": {"sdk_upgrade_path_documented": True,
                "adapter_tests_kept_for_sdk_swap": True},
}

SOUND_COMM = copy.deepcopy(SOUND_CLIENT)
SOUND_COMM["implementation"] = "agent-to-agent run service"
SOUND_COMM["protocol"]["flavor"] = "ACP-comm"
SOUND_COMM["surface"] = {"comm_endpoints_complete": True,
                         "comm_message_parts_typed": True}


def check(v, name):
    return next(c for c in v["checks"] if c["check"] == name)


class VerdictTests(unittest.TestCase):
    def test_sound_client_manifest_is_integration_sound(self):
        v = evaluate(copy.deepcopy(SOUND_CLIENT))
        self.assertEqual(v["verdict"], "INTEGRATION_SOUND")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(v["flavor_status"], "acp_client")
        self.assertEqual(len(v["checks"]), 31)

    def test_sound_comm_manifest_is_integration_sound(self):
        v = evaluate(copy.deepcopy(SOUND_COMM))
        self.assertEqual(v["verdict"], "INTEGRATION_SOUND")
        self.assertEqual(v["flavor_status"], "acp_comm")
        self.assertEqual(
            check(v, "comm_endpoints_complete_when_comm_flavor")["status"],
            "pass")
        self.assertEqual(
            check(v, "client_flow_complete_when_client_flavor")["evidence"],
            "not an ACP-client integration")

    def test_client_surface_not_applicable_for_comm(self):
        v = evaluate(copy.deepcopy(SOUND_COMM))
        self.assertEqual(
            check(v, "client_permissions_handled_when_client_flavor")["status"],
            "pass")

    def test_comm_surface_not_applicable_for_client(self):
        v = evaluate(copy.deepcopy(SOUND_CLIENT))
        self.assertEqual(
            check(v, "comm_message_parts_typed_when_comm_flavor")["status"],
            "pass")

    def test_unrecognized_flavor_fails(self):
        for bad in ("ACP", "acp-client", "ACP-Client", "", "MCP"):
            m = copy.deepcopy(SOUND_CLIENT)
            m["protocol"]["flavor"] = bad
            v = evaluate(m)
            self.assertEqual(v["verdict"], "INTEGRATION_NOT_SOUND", bad)
            self.assertEqual(v["flavor_status"], "unrecognized", bad)
            self.assertEqual(
                v["sections"]["disambiguation_and_scope"], "fail", bad)

    def test_non_string_flavor_fails_as_unrecognized(self):
        # Corrected under the F1 ruling: this assertion previously
        # expected a verdict over a wrong-typed documented field,
        # which encodes the F1 defect itself. A non-string flavor
        # is now rejected with ValueError naming the field.
        m = copy.deepcopy(SOUND_CLIENT)
        m["protocol"]["flavor"] = 42
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("protocol.flavor", str(ctx.exception))

    def test_missing_flavor_is_missing_not_failed(self):
        m = copy.deepcopy(SOUND_CLIENT)
        del m["protocol"]["flavor"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertIsNone(v["flavor_status"])
        self.assertEqual(check(v, "flavor_recognized")["status"], "missing")
        # Gated surface checks are missing too (gate itself absent).
        self.assertEqual(
            check(v, "client_flow_complete_when_client_flavor")["status"],
            "missing")

    def test_client_flow_incomplete_fails(self):
        m = copy.deepcopy(SOUND_CLIENT)
        m["surface"]["client_flow_complete"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INTEGRATION_NOT_SOUND")
        self.assertEqual(v["sections"]["protocol_surface"], "fail")

    def test_client_permissions_not_handled_fails(self):
        m = copy.deepcopy(SOUND_CLIENT)
        m["surface"]["client_permissions_handled"] = False
        self.assertEqual(evaluate(m)["verdict"], "INTEGRATION_NOT_SOUND")

    def test_comm_endpoints_incomplete_fails(self):
        m = copy.deepcopy(SOUND_COMM)
        m["surface"]["comm_endpoints_complete"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INTEGRATION_NOT_SOUND")
        self.assertEqual(v["sections"]["protocol_surface"], "fail")

    def test_comm_message_parts_untyped_fails(self):
        m = copy.deepcopy(SOUND_COMM)
        m["surface"]["comm_message_parts_typed"] = False
        self.assertEqual(evaluate(m)["verdict"], "INTEGRATION_NOT_SOUND")

    def test_client_surface_fields_ignored_for_comm_flavor(self):
        # Declaring the other flavour's surface badly does not fail a
        # comm integration: those checks are not applicable.
        m = copy.deepcopy(SOUND_COMM)
        m["surface"]["client_flow_complete"] = False
        self.assertEqual(evaluate(m)["verdict"], "INTEGRATION_SOUND")

    def test_disambiguated_naming_absent_fails(self):
        m = copy.deepcopy(SOUND_CLIENT)
        m["protocol"]["disambiguated_naming"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INTEGRATION_NOT_SOUND")
        self.assertEqual(
            v["sections"]["disambiguation_and_scope"], "fail")

    def test_spec_version_not_documented_fails(self):
        m = copy.deepcopy(SOUND_CLIENT)
        m["protocol"]["spec_version_documented"] = False
        self.assertEqual(evaluate(m)["verdict"], "INTEGRATION_NOT_SOUND")

    def test_supported_subset_not_documented_fails(self):
        m = copy.deepcopy(SOUND_CLIENT)
        m["protocol"]["supported_subset_documented"] = False
        self.assertEqual(evaluate(m)["verdict"], "INTEGRATION_NOT_SOUND")

    def test_business_logic_in_wire_layer_fails(self):
        m = copy.deepcopy(SOUND_CLIENT)
        m["adapter"]["business_logic_in_wire_layer"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INTEGRATION_NOT_SOUND")
        self.assertEqual(v["sections"]["adapter_architecture"], "fail")

    def test_adapter_not_thin_fails(self):
        m = copy.deepcopy(SOUND_CLIENT)
        m["adapter"]["thin"] = False
        self.assertEqual(evaluate(m)["verdict"], "INTEGRATION_NOT_SOUND")

    def test_state_leak_across_sessions_fails(self):
        m = copy.deepcopy(SOUND_CLIENT)
        m["lifecycle"]["state_leaks_across_sessions"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INTEGRATION_NOT_SOUND")
        self.assertEqual(v["sections"]["lifecycle_correctness"], "fail")

    def test_cancels_not_handled_fails(self):
        m = copy.deepcopy(SOUND_CLIENT)
        m["lifecycle"]["cancels_handled"] = False
        self.assertEqual(evaluate(m)["verdict"], "INTEGRATION_NOT_SOUND")

    def test_unknown_sessions_not_handled_fails(self):
        m = copy.deepcopy(SOUND_CLIENT)
        m["lifecycle"]["unknown_sessions_or_runs_handled"] = False
        self.assertEqual(evaluate(m)["verdict"], "INTEGRATION_NOT_SOUND")

    def test_unordered_updates_fail(self):
        m = copy.deepcopy(SOUND_CLIENT)
        m["streaming"]["updates_ordered"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INTEGRATION_NOT_SOUND")
        self.assertEqual(v["sections"]["streaming_discipline"], "fail")

    def test_unclear_terminal_states_fail(self):
        m = copy.deepcopy(SOUND_CLIENT)
        m["streaming"]["terminal_states_clear"] = False
        self.assertEqual(evaluate(m)["verdict"], "INTEGRATION_NOT_SOUND")

    def test_unauthenticated_remote_endpoints_fail_red_line(self):
        m = copy.deepcopy(SOUND_CLIENT)
        m["security"]["remote_endpoints_authenticated"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INTEGRATION_NOT_SOUND")
        self.assertEqual(v["sections"]["security"], "fail")

    def test_remote_auth_missing_when_remote_present_is_missing(self):
        m = copy.deepcopy(SOUND_CLIENT)
        del m["security"]["remote_endpoints_authenticated"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check(v, "remote_endpoints_authenticated_when_remote")["status"],
            "missing")

    def test_no_remote_endpoints_passes_auth_as_not_applicable(self):
        m = copy.deepcopy(SOUND_CLIENT)
        m["security"]["remote_endpoints_present"] = False
        del m["security"]["remote_endpoints_authenticated"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INTEGRATION_SOUND")
        self.assertEqual(
            check(v, "remote_endpoints_authenticated_when_remote")["evidence"],
            "no remote endpoints declared")

    def test_inputs_not_validated_fails(self):
        m = copy.deepcopy(SOUND_CLIENT)
        m["security"]["inputs_validated"] = False
        self.assertEqual(evaluate(m)["verdict"], "INTEGRATION_NOT_SOUND")

    def test_unsandboxed_tool_execution_fails(self):
        m = copy.deepcopy(SOUND_CLIENT)
        m["security"]["tool_execution_sandboxed"] = False
        self.assertEqual(evaluate(m)["verdict"], "INTEGRATION_NOT_SOUND")

    def test_faked_unsupported_features_fail_red_line(self):
        m = copy.deepcopy(SOUND_CLIENT)
        m["honesty"]["unsupported_features_faked"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INTEGRATION_NOT_SOUND")
        self.assertEqual(
            v["sections"]["honesty_tests_and_upgrade_path"], "fail")

    def test_unimplemented_modes_not_noted_fails(self):
        m = copy.deepcopy(SOUND_CLIENT)
        m["honesty"]["unimplemented_modes_noted"] = False
        self.assertEqual(evaluate(m)["verdict"], "INTEGRATION_NOT_SOUND")

    def test_lifecycle_tests_not_covering_cancel_fail(self):
        m = copy.deepcopy(SOUND_CLIENT)
        m["tests"]["lifecycle_happy_error_cancel_covered"] = False
        self.assertEqual(evaluate(m)["verdict"], "INTEGRATION_NOT_SOUND")

    def test_contract_tests_not_in_ci_fail(self):
        m = copy.deepcopy(SOUND_CLIENT)
        m["tests"]["contract_tests_in_ci_per_protocol"] = False
        self.assertEqual(evaluate(m)["verdict"], "INTEGRATION_NOT_SOUND")

    def test_adapter_tests_not_kept_for_swap_fails(self):
        m = copy.deepcopy(SOUND_CLIENT)
        m["upgrade"]["adapter_tests_kept_for_sdk_swap"] = False
        self.assertEqual(evaluate(m)["verdict"], "INTEGRATION_NOT_SOUND")

    def test_absent_evidence_is_insufficient_not_failed(self):
        m = copy.deepcopy(SOUND_CLIENT)
        del m["streaming"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["streaming_discipline"],
                         "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertIsNone(v["flavor_status"])
        self.assertEqual(len(v["checks"]), 31)

    def test_truthy_non_boolean_is_fail_not_pass(self):
        # Corrected under the F1 ruling: previously expected a
        # verdict over a wrong-typed documented field (the F1
        # defect). A non-boolean value is now rejected with
        # ValueError naming the field.
        m = copy.deepcopy(SOUND_CLIENT)
        m["streaming"]["updates_ordered"] = "yes"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("streaming.updates_ordered", str(ctx.exception))

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(SOUND_CLIENT))
        self.assertIn("VERDICT: INTEGRATION_SOUND", stamp(v))

    def test_non_object_manifest_rejected(self):
        with self.assertRaises(TypeError):
            evaluate(["not", "a", "manifest"])


class MalformedTypeTests(unittest.TestCase):
    """F1 regression (external verification Wave 1): a documented
    field present with the wrong JSON type is rejected with
    ValueError naming the field — never evaluated into a verdict."""

    def test_top_level_string_field_as_number_rejected(self):
        m = copy.deepcopy(SOUND_CLIENT)
        m["implementation"] = 12345
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("implementation", str(ctx.exception))

    def test_section_as_string_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"protocol": "should-be-an-object"})
        self.assertIn("protocol", str(ctx.exception))

    def test_string_leaf_as_number_rejected(self):
        m = copy.deepcopy(SOUND_CLIENT)
        m["protocol"]["flavor"] = 42
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("protocol.flavor", str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(SOUND_CLIENT)
        m["streaming"]["updates_ordered"] = "yes"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("streaming.updates_ordered", str(ctx.exception))

    def test_null_section_rejected(self):
        m = copy.deepcopy(SOUND_CLIENT)
        m["streaming"] = None
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("streaming", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
