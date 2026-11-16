import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from agent_interoperability_design import evaluate, stamp  # noqa: E402

SOUND = {
    "design": "fleet handoff design v2",
    "integrations": [
        {"name": "tool host", "counterparty_type": "tools_for_models",
         "protocol": "mcp", "rationale_documented": True},
        {"name": "editor session", "counterparty_type": "editor_agent_session",
         "protocol": "acp_stdio", "rationale_documented": True},
        {"name": "peer agent", "counterparty_type": "agent_to_agent",
         "protocol": "a2a", "rationale_documented": True},
        {"name": "operator scripts", "counterparty_type": "human_or_script",
         "protocol": "rest_cli_web", "rationale_documented": True},
    ],
    "architecture": {"single_core": True,
                     "protocol_adapters": True,
                     "business_logic_per_protocol": False},
    "gateway": {"remote_or_untrusted_agents_present": True,
                "single_authenticated_broker": True,
                "broker_authenticated": True,
                "broker_audited": True,
                "broker_rate_limited": True,
                "direct_doors_to_remote_agents": False},
    "handoff": {"contracts_used_for_non_trivial_coordination": True,
                "contract_states_goal": True,
                "contract_states_constraints": True,
                "contract_states_acceptance_criteria": True,
                "contract_states_report_back_location": True},
    "identity": {"each_agent_own_credential": True,
                 "credentials_least_privilege": True,
                 "credentials_short_lived": True,
                 "credentials_revocable": True,
                 "shared_forever_keys_present": False},
    "discovery": {"capabilities_published": True,
                  "version_published": True,
                  "negotiation_supported": True,
                  "graceful_degradation_declared": True},
    "audit": {"message_log_kept": True,
              "log_records_who_asked": True,
              "log_records_what_ran": True,
              "log_records_what_changed": True},
    "testing": {"handshake_tests_exist": True,
                "handshake_tests_pass": True,
                "handshake_tests_both_directions": True,
                "handshake_tests_per_protocol": True},
    "red_lines": {"unsandboxed_third_party_agents_present": False,
                  "secrets_or_private_data_in_messages_by_default": False},
}


def check_status(verdict, name):
    for r in verdict["checks"]:
        if r["check"] == name:
            return r["status"]
    raise AssertionError(f"no check named {name}")


class VerdictTests(unittest.TestCase):
    def test_sound_manifest_is_design_sound(self):
        v = evaluate(copy.deepcopy(SOUND))
        self.assertEqual(v["verdict"], "DESIGN_SOUND")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(v["protocol_status"],
                         "sound_on_declared_evidence")
        self.assertEqual(v["integration_count"], 4)
        self.assertEqual(len(v["checks"]), 36)

    def test_agent_to_agent_accepts_acp_rest_as_well_as_a2a(self):
        m = copy.deepcopy(SOUND)
        m["integrations"][2]["protocol"] = "acp_rest"
        self.assertEqual(evaluate(m)["verdict"], "DESIGN_SOUND")

    def test_wrong_protocol_for_counterparty_fails(self):
        for ctype, protocol in (("tools_for_models", "a2a"),
                                ("editor_agent_session", "mcp"),
                                ("agent_to_agent", "mcp"),
                                ("human_or_script", "acp_stdio")):
            m = copy.deepcopy(SOUND)
            m["integrations"] = [
                {"counterparty_type": ctype, "protocol": protocol,
                 "rationale_documented": True}]
            v = evaluate(m)
            self.assertEqual(v["verdict"], "DESIGN_NOT_SOUND",
                             (ctype, protocol))
            self.assertEqual(v["sections"]["protocol_selection"], "fail")
            self.assertEqual(v["protocol_status"],
                             "not_sound_on_declared_evidence")

    def test_counterparty_outside_vocabulary_fails(self):
        m = copy.deepcopy(SOUND)
        m["integrations"][0]["counterparty_type"] = "carrier_pigeon"
        v = evaluate(m)
        self.assertEqual(v["verdict"], "DESIGN_NOT_SOUND")
        self.assertEqual(
            check_status(v, "counterparty_types_in_skill_vocabulary"),
            "fail")
        self.assertEqual(v["protocol_status"],
                         "not_sound_on_declared_evidence")

    def test_missing_counterparty_type_is_missing_not_failed(self):
        m = copy.deepcopy(SOUND)
        del m["integrations"][0]["counterparty_type"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "counterparty_types_in_skill_vocabulary"),
            "missing")
        self.assertIsNone(v["protocol_status"])

    def test_missing_protocol_is_missing_not_failed(self):
        m = copy.deepcopy(SOUND)
        del m["integrations"][1]["protocol"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "protocols_match_counterparty_per_skill"),
            "missing")
        self.assertIsNone(v["protocol_status"])

    def test_undocumented_rationale_fails_quality_gate(self):
        m = copy.deepcopy(SOUND)
        m["integrations"][0]["rationale_documented"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "DESIGN_NOT_SOUND")
        self.assertEqual(
            check_status(
                v, "protocol_choice_documented_with_why_per_integration"),
            "fail")

    def test_missing_rationale_is_missing(self):
        m = copy.deepcopy(SOUND)
        del m["integrations"][0]["rationale_documented"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(
                v, "protocol_choice_documented_with_why_per_integration"),
            "missing")

    def test_empty_integration_list_fails(self):
        m = copy.deepcopy(SOUND)
        m["integrations"] = []
        v = evaluate(m)
        self.assertEqual(v["verdict"], "DESIGN_NOT_SOUND")
        self.assertEqual(v["integration_count"], 0)
        self.assertEqual(check_status(v, "integrations_declared"), "fail")

    def test_absent_integrations_is_insufficient_evidence(self):
        m = copy.deepcopy(SOUND)
        del m["integrations"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertIsNone(v["integration_count"])
        self.assertIsNone(v["protocol_status"])

    def test_non_list_integrations_is_missing(self):
        # Corrected under the F1 ruling: previously expected a
        # verdict over a wrong-typed documented field (the F1
        # defect). A non-list integrations value is now rejected
        # with ValueError naming the field.
        m = copy.deepcopy(SOUND)
        m["integrations"] = "mcp everywhere"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("integrations", str(ctx.exception))

    def test_business_logic_per_protocol_fails(self):
        m = copy.deepcopy(SOUND)
        m["architecture"]["business_logic_per_protocol"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "DESIGN_NOT_SOUND")
        self.assertEqual(v["sections"]["bridge_architecture"], "fail")

    def test_no_single_core_fails(self):
        m = copy.deepcopy(SOUND)
        m["architecture"]["single_core"] = False
        self.assertEqual(evaluate(m)["verdict"], "DESIGN_NOT_SOUND")

    def test_remote_agents_without_broker_fails(self):
        m = copy.deepcopy(SOUND)
        m["gateway"]["single_authenticated_broker"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "DESIGN_NOT_SOUND")
        self.assertEqual(v["sections"]["gateway_and_remote_access"],
                         "fail")

    def test_direct_doors_to_remote_agents_fails(self):
        m = copy.deepcopy(SOUND)
        m["gateway"]["direct_doors_to_remote_agents"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "DESIGN_NOT_SOUND")
        self.assertEqual(
            check_status(v, "no_direct_doors_to_remote_agents"), "fail")

    def test_unauthenticated_or_unaudited_or_unlimited_broker_fails(self):
        for field in ("broker_authenticated", "broker_audited",
                      "broker_rate_limited"):
            m = copy.deepcopy(SOUND)
            m["gateway"][field] = False
            self.assertEqual(evaluate(m)["verdict"], "DESIGN_NOT_SOUND",
                             field)

    def test_no_remote_agents_passes_gateway_as_not_applicable(self):
        m = copy.deepcopy(SOUND)
        m["gateway"] = {"remote_or_untrusted_agents_present": False}
        self.assertEqual(evaluate(m)["verdict"], "DESIGN_SOUND")

    def test_remote_gate_absent_is_insufficient_evidence(self):
        m = copy.deepcopy(SOUND)
        del m["gateway"]["remote_or_untrusted_agents_present"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["gateway_and_remote_access"],
                         "insufficient_evidence")

    def test_remote_agents_with_broker_property_missing_is_missing(self):
        m = copy.deepcopy(SOUND)
        del m["gateway"]["broker_audited"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(check_status(v, "broker_audited"), "missing")

    def test_handoff_contract_missing_field_fails(self):
        for field in ("contract_states_goal",
                      "contract_states_constraints",
                      "contract_states_acceptance_criteria",
                      "contract_states_report_back_location"):
            m = copy.deepcopy(SOUND)
            m["handoff"][field] = False
            v = evaluate(m)
            self.assertEqual(v["verdict"], "DESIGN_NOT_SOUND", field)
            self.assertEqual(v["sections"]["handoff_contracts"], "fail")

    def test_contracts_not_used_for_non_trivial_coordination_fails(self):
        m = copy.deepcopy(SOUND)
        m["handoff"]["contracts_used_for_non_trivial_coordination"] = False
        self.assertEqual(evaluate(m)["verdict"], "DESIGN_NOT_SOUND")

    def test_shared_forever_keys_fail(self):
        m = copy.deepcopy(SOUND)
        m["identity"]["shared_forever_keys_present"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "DESIGN_NOT_SOUND")
        self.assertEqual(v["sections"]["identity_and_credentials"],
                         "fail")

    def test_non_revocable_or_long_lived_credentials_fail(self):
        for field in ("each_agent_own_credential",
                      "credentials_least_privilege",
                      "credentials_short_lived",
                      "credentials_revocable"):
            m = copy.deepcopy(SOUND)
            m["identity"][field] = False
            self.assertEqual(evaluate(m)["verdict"], "DESIGN_NOT_SOUND",
                             field)

    def test_unpublished_capabilities_or_no_degradation_fails(self):
        for field in ("capabilities_published", "version_published",
                      "negotiation_supported",
                      "graceful_degradation_declared"):
            m = copy.deepcopy(SOUND)
            m["discovery"][field] = False
            v = evaluate(m)
            self.assertEqual(v["verdict"], "DESIGN_NOT_SOUND", field)
            self.assertEqual(v["sections"]["versioning_and_discovery"],
                             "fail")

    def test_audit_log_without_provenance_fails(self):
        for field in ("message_log_kept", "log_records_who_asked",
                      "log_records_what_ran", "log_records_what_changed"):
            m = copy.deepcopy(SOUND)
            m["audit"][field] = False
            v = evaluate(m)
            self.assertEqual(v["verdict"], "DESIGN_NOT_SOUND", field)
            self.assertEqual(v["sections"]["audit_and_provenance"],
                             "fail")

    def test_handshake_tests_missing_or_failing_fails(self):
        for field in ("handshake_tests_exist", "handshake_tests_pass",
                      "handshake_tests_both_directions",
                      "handshake_tests_per_protocol"):
            m = copy.deepcopy(SOUND)
            m["testing"][field] = False
            v = evaluate(m)
            self.assertEqual(v["verdict"], "DESIGN_NOT_SOUND", field)
            self.assertEqual(
                v["sections"]["handshake_testing_and_red_lines"], "fail")

    def test_unsandboxed_third_party_agents_fail_red_line(self):
        m = copy.deepcopy(SOUND)
        m["red_lines"]["unsandboxed_third_party_agents_present"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "DESIGN_NOT_SOUND")
        self.assertEqual(
            check_status(v, "no_unsandboxed_third_party_agents"), "fail")

    def test_secrets_in_messages_fail_red_line(self):
        m = copy.deepcopy(SOUND)
        m["red_lines"]["secrets_or_private_data_in_messages_by_default"] = \
            True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "DESIGN_NOT_SOUND")
        self.assertEqual(
            check_status(
                v, "no_secrets_or_private_data_in_messages_by_default"),
            "fail")

    def test_absent_section_is_insufficient_not_failed(self):
        m = copy.deepcopy(SOUND)
        del m["audit"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["audit_and_provenance"],
                         "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertIsNone(v["protocol_status"])
        self.assertIsNone(v["integration_count"])

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(SOUND))
        self.assertIn("VERDICT: DESIGN_SOUND", stamp(v))

    def test_non_object_manifest_rejected(self):
        with self.assertRaises(TypeError):
            evaluate(["not", "a", "manifest"])


class MalformedTypeTests(unittest.TestCase):
    """F1 regression (external verification Wave 1): a documented
    field present with the wrong JSON type is rejected with
    ValueError naming the field — never evaluated into a verdict."""

    def test_top_level_string_field_as_number_rejected(self):
        m = copy.deepcopy(SOUND)
        m["design"] = 12345
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("design", str(ctx.exception))

    def test_section_as_string_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"architecture": "should-be-an-object"})
        self.assertIn("architecture", str(ctx.exception))

    def test_list_field_as_string_rejected(self):
        m = copy.deepcopy(SOUND)
        m["integrations"] = "mcp everywhere"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("integrations", str(ctx.exception))

    def test_list_entry_as_string_rejected(self):
        m = copy.deepcopy(SOUND)
        m["integrations"][0] = "tool host"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("integrations[0]", str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(SOUND)
        m["gateway"]["broker_audited"] = "yes"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("gateway.broker_audited", str(ctx.exception))

    def test_boolean_leaf_in_list_entry_as_string_rejected(self):
        m = copy.deepcopy(SOUND)
        m["integrations"][0]["rationale_documented"] = "yes"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("integrations[0].rationale_documented",
                      str(ctx.exception))

    def test_null_section_rejected(self):
        m = copy.deepcopy(SOUND)
        m["audit"] = None
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("audit", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
