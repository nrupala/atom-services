import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from agent_safety_guardrail_audit import evaluate, stamp  # noqa: E402

GUARDED = {
    "system": "example-agent",
    "version": "2.1.0",
    "guardrails_disabled": False,
    "injection_defense": {
        "external_content_treated_as_data": True,
        "suspicious_imperatives_flagged": True,
        "test_suite": {"present": True, "passing": True},
    },
    "tool_access": {
        "scoped_to_job": True,
        "read_write_separated": True,
        "destructive_tools_gated": True,
        "shell_access": True,
        "shell_sandboxed": True,
    },
    "approvals": {
        "destructive_actions_require_approval": True,
        "verified": True,
        "covered_actions": ["deploys", "payments", "deletions",
                            "external_sends", "credential_changes"],
        "bypassable_by_agent": False,
    },
    "sandbox": {
        "enabled": True,
        "filesystem_scope_minimal": True,
        "egress_restricted": True,
        "resource_caps_enforced": True,
        "abuse_test_passed": True,
    },
    "budgets": {"caps_set": True, "alert_before_cap": True},
    "circuit_breakers": {"loop_detection_enabled": True},
    "kill_switch": {"present": True, "tested": True},
    "output_validation": {
        "schema_checked": True,
        "model_output_evaled": False,
        "downstream_parameterized": True,
    },
    "secrets": {
        "values_in_context": False,
        "pii_in_context": False,
        "credential_handles_only": True,
        "exfiltration_paths_tested": True,
    },
    "red_team": {
        "injection_suite_run": True,
        "jailbreak_tested": True,
        "canary_tokens_used": True,
        "findings_become_regression_tests": True,
    },
}


class AuditTests(unittest.TestCase):
    def test_guarded_manifest_is_guarded(self):
        v = evaluate(copy.deepcopy(GUARDED))
        self.assertEqual(v["verdict"], "GUARDED")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(len(v["checks"]), 34)

    def test_secrets_in_context_is_a_red_line_fail(self):
        m = copy.deepcopy(GUARDED)
        m["secrets"]["values_in_context"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_GUARDED")
        self.assertEqual(v["sections"]["secrets_hygiene"], "fail")

    def test_pii_in_context_is_a_red_line_fail(self):
        m = copy.deepcopy(GUARDED)
        m["secrets"]["pii_in_context"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_GUARDED")
        self.assertEqual(v["sections"]["secrets_hygiene"], "fail")

    def test_guardrails_disabled_is_a_red_line_fail(self):
        m = copy.deepcopy(GUARDED)
        m["guardrails_disabled"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_GUARDED")
        self.assertEqual(v["sections"]["approval_gates"], "fail")

    def test_agent_bypassable_approval_fails(self):
        m = copy.deepcopy(GUARDED)
        m["approvals"]["bypassable_by_agent"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_GUARDED")
        self.assertEqual(v["sections"]["approval_gates"], "fail")

    def test_approval_missing_a_sensitive_action_fails(self):
        m = copy.deepcopy(GUARDED)
        m["approvals"]["covered_actions"] = ["deploys", "payments",
                                             "deletions", "external_sends"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_GUARDED")
        self.assertEqual(v["sections"]["approval_gates"], "fail")

    def test_unsandboxed_shell_access_fails(self):
        m = copy.deepcopy(GUARDED)
        m["tool_access"]["shell_sandboxed"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_GUARDED")
        self.assertEqual(v["sections"]["tool_least_privilege"], "fail")

    def test_no_shell_access_passes_shell_check(self):
        m = copy.deepcopy(GUARDED)
        m["tool_access"]["shell_access"] = False
        del m["tool_access"]["shell_sandboxed"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "GUARDED")

    def test_evaled_model_output_fails(self):
        m = copy.deepcopy(GUARDED)
        m["output_validation"]["model_output_evaled"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_GUARDED")
        self.assertEqual(v["sections"]["output_validation"], "fail")

    def test_untested_kill_switch_fails(self):
        m = copy.deepcopy(GUARDED)
        m["kill_switch"]["tested"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_GUARDED")
        self.assertEqual(v["sections"]["budgets_and_circuit_breakers"], "fail")

    def test_failing_injection_suite_fails(self):
        m = copy.deepcopy(GUARDED)
        m["injection_defense"]["test_suite"]["passing"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_GUARDED")
        self.assertEqual(v["sections"]["injection_defense"], "fail")

    def test_absent_evidence_is_insufficient_not_failed(self):
        m = copy.deepcopy(GUARDED)
        del m["sandbox"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["sandboxing"], "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertTrue(
            all(c["status"] == "missing" for c in v["checks"]))

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(GUARDED))
        s = stamp(v)
        self.assertIn("VERDICT: GUARDED", s)
        self.assertIn("injection_defense", s)
        self.assertIn("34 checks across eight sections", s)

    def test_non_object_manifest_rejected(self):
        with self.assertRaises(TypeError):
            evaluate(["not", "a", "manifest"])


class MalformedTypeTests(unittest.TestCase):
    """F1 regression (external verification Wave 1): a documented
    field present with the wrong JSON type is rejected with
    ValueError naming the field — never evaluated into a verdict.
    The first case mirrors the recorded external malformed input."""

    def test_recorded_malformed_case_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"guardrails_disabled": "not-a-boolean",
                      "tool_access": "should-be-an-object"})
        self.assertIn("guardrails_disabled", str(ctx.exception))

    def test_section_as_string_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"tool_access": "should-be-an-object"})
        self.assertIn("tool_access", str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(GUARDED)
        m["secrets"]["values_in_context"] = "no"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("secrets.values_in_context", str(ctx.exception))

    def test_list_field_as_string_rejected(self):
        m = copy.deepcopy(GUARDED)
        m["approvals"]["covered_actions"] = "deploys"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("approvals.covered_actions", str(ctx.exception))

    def test_list_entry_as_number_rejected(self):
        m = copy.deepcopy(GUARDED)
        m["approvals"]["covered_actions"] = ["deploys", 42]
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("approvals.covered_actions[1]", str(ctx.exception))

    def test_nested_object_as_string_rejected(self):
        m = copy.deepcopy(GUARDED)
        m["injection_defense"]["test_suite"] = "present"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("injection_defense.test_suite", str(ctx.exception))

    def test_null_field_rejected(self):
        m = copy.deepcopy(GUARDED)
        m["sandbox"] = None
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("sandbox", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
