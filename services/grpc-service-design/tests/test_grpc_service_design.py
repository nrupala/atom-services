import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from grpc_service_design import evaluate, stamp  # noqa: E402

COMPLETE = {
    "project": "agent-rpc-service",
    "contract": {"proto3_used": True,
                 "removed_fields_reserved": True,
                 "backward_forward_compatibility_rules_documented": True,
                 "buf_lint_in_ci": True,
                 "breaking_change_check_in_ci": True,
                 "codegen_pinned": True,
                 "codegen_generated_in_ci": True,
                 "hand_generated_stubs_present": False,
                 "field_number_reuse_present": False},
    "methods": [
        {"name": "GetJob", "streaming_mode": "unary",
         "deadline_set": True},
        {"name": "StreamLogs", "streaming_mode": "server",
         "deadline_set": True, "stream_bounded": True},
        {"name": "Chat", "streaming_mode": "bidi",
         "deadline_set": True, "stream_bounded": True},
    ],
    "proto_fields": [
        {"message": "JobRequest", "name": "job_id", "number": 1},
        {"message": "JobRequest", "name": "priority", "number": 2},
        {"message": "JobReply", "name": "job_id", "number": 1},
    ],
    "api_shape": {"streaming_choices_documented_by_flow": True,
                  "cancellation_propagation_configured": True,
                  "rich_error_model_used": True,
                  "metadata_limited_to_transport_concerns": True},
    "server": {"health_service_exposed": True,
               "reflection_enabled": True,
               "reflection_restricted_to_dev_or_authenticated": True,
               "interceptors_for_auth_logging_metrics_tracing": True,
               "keepalive_and_pool_tuning_configured": True,
               "explicit_max_message_sizes_set": True},
    "security": {"cross_host_traffic_present": True,
                 "mtls_enabled": True,
                 "per_service_identities_used": True,
                 "plaintext_across_hosts_present": False,
                 "authorization_via_interceptor_or_external_policy": True,
                 "public_surfaces_present": True,
                 "rate_limits_on_public_surfaces": True},
    "observability": {
        "trace_and_request_id_propagation_configured": True,
        "per_method_metrics_collected": True,
        "structured_errors_logged_once": True},
    "testing": {"in_process_integration_tests_present": True,
                "contract_tests_pass_against_clients": True,
                "load_smoke_on_hot_paths_run": True},
    "interop": {"rest_consumers_present": True,
                "gateway_json_adapters_provided": True,
                "browser_clients_present": True,
                "grpc_web_enabled": True,
                "packages_versioned_v1": True,
                "deprecated_fields_announced_then_removed_on_schedule": True},
}


def check_status(v, name):
    return next(c["status"] for c in v["checks"] if c["check"] == name)


class VerdictTests(unittest.TestCase):
    def test_complete_manifest_is_sound(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(v["verdict"], "GRPC_SERVICE_SOUND")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(len(v["checks"]), 39)
        self.assertEqual(v["computed_status"],
                         "within_stated_limits_on_declared_evidence")
        self.assertEqual(v["methods_count"], 3)
        self.assertEqual(v["proto_fields_count"], 3)
        self.assertEqual(v["methods_without_streaming_mode"], [])
        self.assertEqual(v["methods_without_deadline"], [])
        self.assertEqual(v["unbounded_streaming_methods"], [])
        self.assertEqual(v["fields_sharing_a_duplicate_number"], [])
        self.assertEqual(v["deadline_coverage"], "1.000000")
        self.assertEqual(v["streaming_boundedness_coverage"], "1.000000")

    def test_not_proto3_fails_contract_section(self):
        m = copy.deepcopy(COMPLETE)
        m["contract"]["proto3_used"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "GRPC_SERVICE_NOT_SOUND")
        self.assertEqual(
            v["sections"]["contract_and_compatibility"], "fail")

    def test_removed_fields_not_reserved_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["contract"]["removed_fields_reserved"] = False
        self.assertEqual(evaluate(m)["verdict"], "GRPC_SERVICE_NOT_SOUND")

    def test_breaking_change_check_not_in_ci_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["contract"]["breaking_change_check_in_ci"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "breaking_change_check_in_ci"), "fail")

    def test_hand_generated_stubs_fail(self):
        m = copy.deepcopy(COMPLETE)
        m["contract"]["hand_generated_stubs_present"] = True
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "no_hand_generated_stubs"), "fail")
        self.assertEqual(v["verdict"], "GRPC_SERVICE_NOT_SOUND")

    def test_field_number_reuse_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["contract"]["field_number_reuse_present"] = True
        v = evaluate(m)
        self.assertEqual(check_status(v, "no_field_number_reuse"), "fail")

    def test_duplicate_field_number_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["proto_fields"][1]["number"] = 1
        v = evaluate(m)
        self.assertEqual(v["verdict"], "GRPC_SERVICE_NOT_SOUND")
        self.assertEqual(
            check_status(v, "no_duplicate_field_number_within_message"),
            "fail")
        self.assertEqual(v["fields_sharing_a_duplicate_number"],
                         ["job_id", "priority"])
        self.assertEqual(v["computed_status"],
                         "outside_stated_limits_on_declared_evidence")

    def test_same_number_in_different_messages_passes(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(
            check_status(v, "no_duplicate_field_number_within_message"),
            "pass")

    def test_field_missing_number_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["proto_fields"][0]["number"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "no_duplicate_field_number_within_message"),
            "missing")

    def test_empty_proto_fields_list_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["proto_fields"] = []
        v = evaluate(m)
        self.assertEqual(check_status(v, "proto_fields_declared"), "fail")
        self.assertEqual(v["proto_fields_count"], 0)

    def test_empty_methods_list_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["methods"] = []
        v = evaluate(m)
        self.assertEqual(check_status(v, "methods_declared"), "fail")
        self.assertEqual(v["methods_count"], 0)
        self.assertIsNone(v["deadline_coverage"])
        self.assertIsNone(v["streaming_boundedness_coverage"])

    def test_method_without_mode_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["methods"][0]["streaming_mode"] = ""
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_method_names_streaming_mode"), "fail")
        self.assertEqual(v["methods_without_streaming_mode"], ["GetJob"])

    def test_method_missing_mode_field_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["methods"][1]["streaming_mode"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "every_method_names_streaming_mode"),
            "missing")

    def test_method_without_deadline_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["methods"][1]["deadline_set"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "GRPC_SERVICE_NOT_SOUND")
        self.assertEqual(
            check_status(v, "every_method_has_deadline"), "fail")
        self.assertEqual(v["methods_without_deadline"], ["StreamLogs"])
        self.assertEqual(v["deadline_coverage"], "0.666667")

    def test_method_missing_deadline_field_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["methods"][0]["deadline_set"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "every_method_has_deadline"), "missing")
        self.assertEqual(v["methods_without_deadline"], [])

    def test_unbounded_stream_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["methods"][2]["stream_bounded"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "GRPC_SERVICE_NOT_SOUND")
        self.assertEqual(
            check_status(v, "every_streaming_method_bounded"), "fail")
        self.assertEqual(v["unbounded_streaming_methods"], ["Chat"])
        self.assertEqual(v["streaming_boundedness_coverage"], "0.500000")

    def test_streaming_method_missing_bounded_field_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["methods"][1]["stream_bounded"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "every_streaming_method_bounded"), "missing")
        self.assertEqual(v["unbounded_streaming_methods"], [])

    def test_unary_method_needs_no_bounded_declaration(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(
            check_status(v, "every_streaming_method_bounded"), "pass")
        self.assertEqual(v["streaming_boundedness_coverage"], "1.000000")

    def test_no_streaming_methods_coverage_is_none(self):
        m = copy.deepcopy(COMPLETE)
        for row in m["methods"]:
            row["streaming_mode"] = "unary"
            row.pop("stream_bounded", None)
        v = evaluate(m)
        self.assertEqual(v["verdict"], "GRPC_SERVICE_SOUND")
        self.assertIsNone(v["streaming_boundedness_coverage"])

    def test_no_cancellation_propagation_fails_api_section(self):
        m = copy.deepcopy(COMPLETE)
        m["api_shape"]["cancellation_propagation_configured"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "GRPC_SERVICE_NOT_SOUND")
        self.assertEqual(v["sections"]["api_shape_and_deadlines"], "fail")

    def test_health_service_not_exposed_fails_server_section(self):
        m = copy.deepcopy(COMPLETE)
        m["server"]["health_service_exposed"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "GRPC_SERVICE_NOT_SOUND")
        self.assertEqual(v["sections"]["server_hygiene"], "fail")

    def test_unrestricted_reflection_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["server"]["reflection_restricted_to_dev_or_authenticated"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v, "reflection_restricted_to_dev_or_authenticated"),
            "fail")

    def test_reflection_disabled_passes_reflection_check_as_na(self):
        m = copy.deepcopy(COMPLETE)
        m["server"] = {"health_service_exposed": True,
                       "reflection_enabled": False,
                       "interceptors_for_auth_logging_metrics_tracing": True,
                       "keepalive_and_pool_tuning_configured": True,
                       "explicit_max_message_sizes_set": True}
        v = evaluate(m)
        self.assertEqual(v["verdict"], "GRPC_SERVICE_SOUND")
        self.assertEqual(
            check_status(
                v, "reflection_restricted_to_dev_or_authenticated"),
            "pass")

    def test_no_mtls_on_cross_host_fails_security_section(self):
        m = copy.deepcopy(COMPLETE)
        m["security"]["mtls_enabled"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "GRPC_SERVICE_NOT_SOUND")
        self.assertEqual(v["sections"]["security_and_transport"], "fail")
        self.assertEqual(
            check_status(v, "mtls_on_cross_host_paths"), "fail")

    def test_plaintext_across_hosts_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["security"]["plaintext_across_hosts_present"] = True
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "no_plaintext_across_hosts"), "fail")
        self.assertEqual(v["verdict"], "GRPC_SERVICE_NOT_SOUND")

    def test_no_cross_host_passes_security_gates_as_na(self):
        m = copy.deepcopy(COMPLETE)
        m["security"] = {
            "cross_host_traffic_present": False,
            "authorization_via_interceptor_or_external_policy": True,
            "public_surfaces_present": False}
        v = evaluate(m)
        self.assertEqual(v["verdict"], "GRPC_SERVICE_SOUND")
        self.assertEqual(
            check_status(v, "mtls_on_cross_host_paths"), "pass")
        self.assertEqual(
            check_status(v, "no_plaintext_across_hosts"), "pass")
        self.assertEqual(
            check_status(v, "rate_limits_on_public_surfaces"), "pass")

    def test_public_surface_without_rate_limits_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["security"]["rate_limits_on_public_surfaces"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "rate_limits_on_public_surfaces"), "fail")

    def test_cross_host_missing_mtls_field_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["security"]["mtls_enabled"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "mtls_on_cross_host_paths"), "missing")

    def test_contract_tests_not_passing_fails_interop_section(self):
        m = copy.deepcopy(COMPLETE)
        m["testing"]["contract_tests_pass_against_clients"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "GRPC_SERVICE_NOT_SOUND")
        self.assertEqual(
            v["sections"]["observability_testing_and_interop"], "fail")

    def test_rest_consumers_without_gateway_adapter_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["interop"]["gateway_json_adapters_provided"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "gateway_json_adapters_for_rest_consumers"),
            "fail")

    def test_browser_clients_without_grpc_web_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["interop"]["grpc_web_enabled"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "grpc_web_where_browsers_connect"), "fail")

    def test_no_rest_or_browser_clients_passes_interop_gates_as_na(self):
        m = copy.deepcopy(COMPLETE)
        m["interop"] = {
            "rest_consumers_present": False,
            "browser_clients_present": False,
            "packages_versioned_v1": True,
            "deprecated_fields_announced_then_removed_on_schedule": True}
        v = evaluate(m)
        self.assertEqual(v["verdict"], "GRPC_SERVICE_SOUND")
        self.assertEqual(
            check_status(v, "gateway_json_adapters_for_rest_consumers"),
            "pass")
        self.assertEqual(
            check_status(v, "grpc_web_where_browsers_connect"), "pass")

    def test_packages_not_v1_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["interop"]["packages_versioned_v1"] = False
        self.assertEqual(evaluate(m)["verdict"], "GRPC_SERVICE_NOT_SOUND")

    def test_absent_evidence_is_insufficient_not_failed(self):
        m = copy.deepcopy(COMPLETE)
        del m["server"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["server_hygiene"],
                         "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertTrue(
            all(c["status"] == "missing" for c in v["checks"]))
        self.assertIsNone(v["computed_status"])
        self.assertIsNone(v["methods_count"])
        self.assertIsNone(v["proto_fields_count"])
        self.assertIsNone(v["methods_without_streaming_mode"])
        self.assertIsNone(v["methods_without_deadline"])
        self.assertIsNone(v["unbounded_streaming_methods"])
        self.assertIsNone(v["fields_sharing_a_duplicate_number"])
        self.assertIsNone(v["deadline_coverage"])
        self.assertIsNone(v["streaming_boundedness_coverage"])

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertIn("VERDICT: GRPC_SERVICE_SOUND", stamp(v))

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
            evaluate({"contract": "should-be-an-object"})
        self.assertIn("contract", str(ctx.exception))

    def test_list_field_as_object_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"methods": {"name": "GetJob"}})
        self.assertIn("methods", str(ctx.exception))

    def test_list_entry_as_string_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"methods": ["GetJob"]})
        self.assertIn("methods[0]", str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["contract"]["proto3_used"] = "yes"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("contract.proto3_used", str(ctx.exception))

    def test_number_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["proto_fields"][0]["number"] = "1"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("proto_fields[0].number", str(ctx.exception))

    def test_number_leaf_as_boolean_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["proto_fields"][0]["number"] = True
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("proto_fields[0].number", str(ctx.exception))

    def test_nested_list_entry_boolean_field_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["methods"][1]["stream_bounded"] = "yes"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("methods[1].stream_bounded", str(ctx.exception))

    def test_null_section_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["security"] = None
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("security", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
