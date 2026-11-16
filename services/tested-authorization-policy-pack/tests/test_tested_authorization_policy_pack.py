import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from tested_authorization_policy_pack import evaluate, stamp  # noqa: E402


def _tests_for(pid):
    return [{"policy_id": pid, "kind": k}
            for k in ("positive", "negative", "edge")]


READY = {
    "pack": "agent-access pack v3",
    "decision_model": {"decisions_enumerated": True,
                       "input_schema_defined": True,
                       "default_deny": True},
    "policies": [
        {"id": "allow-read-own-docs", "default": "deny"},
        {"id": "allow-write-shared-docs", "default": "deny"},
    ],
    "policy_code": {"rules_small_and_composable": True,
                    "data_separated_from_logic": True,
                    "policy_data_versioned": True,
                    "decision_explanations_available": True},
    "tests": _tests_for("allow-read-own-docs")
    + _tests_for("allow-write-shared-docs"),
    "testing": {"tests_green": True,
                "lint_format_clean": True,
                "key_roles_coverage_declared": True},
    "rollout": {"shadow_completed": True,
                "staged_before_production": True,
                "break_glass_documented_gated_audited": True,
                "break_glass_tested": True,
                "silent_policy_edits": False},
    "decision_logs": {"record_who_decision_version_reason": True,
                      "retained_immutably": True,
                      "full_in_sensitive_flows": True},
    "governance": {"second_pair_of_eyes_on_prs": True,
                   "version_and_changelog": True,
                   "human_summary_in_sync_with_code": True},
    "enforcement": {"points_inventoried": True,
                    "failure_mode_chosen_per_surface": True,
                    "sensitive_surfaces_fail_closed": True,
                    "bypass_paths_present": False},
}


class VerdictTests(unittest.TestCase):
    def test_ready_manifest_is_ready(self):
        v = evaluate(copy.deepcopy(READY))
        self.assertEqual(v["verdict"], "READY")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(v["coverage_status"],
                         "complete_on_declared_tests")
        self.assertEqual(len(v["checks"]), 29)

    def test_coverage_quantities(self):
        v = evaluate(copy.deepcopy(READY))
        self.assertEqual(v["policy_count"], 2)
        self.assertEqual(v["tested_policy_count"], 2)
        self.assertEqual(v["test_count"], 6)
        self.assertEqual(v["test_coverage_ratio"], "1.0000")
        self.assertEqual(v["untested_policy_ids"], [])

    def test_untested_policy_fails_and_is_named(self):
        m = copy.deepcopy(READY)
        m["tests"] = [t for t in m["tests"]
                      if t["policy_id"] != "allow-write-shared-docs"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_READY")
        self.assertEqual(v["sections"]["testing"], "fail")
        self.assertEqual(v["untested_policy_ids"],
                         ["allow-write-shared-docs"])
        self.assertEqual(v["test_coverage_ratio"], "0.5000")
        self.assertEqual(v["coverage_status"],
                         "incomplete_on_declared_tests")
        check = [c for c in v["checks"]
                 if c["check"] == "every_policy_tested"][0]
        self.assertIn("allow-write-shared-docs", check["evidence"])

    def test_missing_edge_test_fails_kind_coverage(self):
        m = copy.deepcopy(READY)
        m["tests"] = [t for t in m["tests"]
                      if not (t["policy_id"] == "allow-read-own-docs"
                              and t["kind"] == "edge")]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_READY")
        self.assertEqual(v["untested_policy_ids"], [])
        self.assertEqual(v["test_coverage_ratio"], "1.0000")
        check = [c for c in v["checks"] if c["check"] ==
                 "positive_negative_edge_tests_per_policy"][0]
        self.assertEqual(check["status"], "fail")
        self.assertIn("allow-read-own-docs", check["evidence"])

    def test_default_allow_policy_fails_red_line(self):
        m = copy.deepcopy(READY)
        m["policies"][1]["default"] = "allow"
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_READY")
        self.assertEqual(v["sections"]["decision_model"], "fail")
        check = [c for c in v["checks"] if c["check"] ==
                 "every_policy_defaults_to_deny"][0]
        self.assertIn("allow-write-shared-docs", check["evidence"])

    def test_default_deny_not_declared_fails(self):
        m = copy.deepcopy(READY)
        m["decision_model"]["default_deny"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_READY")
        self.assertEqual(v["sections"]["decision_model"], "fail")

    def test_bypass_path_fails_red_line(self):
        m = copy.deepcopy(READY)
        m["enforcement"]["bypass_paths_present"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_READY")
        self.assertEqual(v["sections"]["governance_and_enforcement"],
                         "fail")

    def test_silent_policy_edits_fail(self):
        m = copy.deepcopy(READY)
        m["rollout"]["silent_policy_edits"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_READY")
        self.assertEqual(v["sections"]["rollout"], "fail")

    def test_shadow_period_not_completed_fails(self):
        m = copy.deepcopy(READY)
        m["rollout"]["shadow_completed"] = False
        self.assertEqual(evaluate(m)["verdict"], "NOT_READY")

    def test_break_glass_not_tested_fails(self):
        m = copy.deepcopy(READY)
        m["rollout"]["break_glass_tested"] = False
        self.assertEqual(evaluate(m)["verdict"], "NOT_READY")

    def test_tests_not_green_fails(self):
        m = copy.deepcopy(READY)
        m["testing"]["tests_green"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_READY")
        self.assertEqual(v["sections"]["testing"], "fail")

    def test_decision_logs_not_retained_fails(self):
        m = copy.deepcopy(READY)
        m["decision_logs"]["retained_immutably"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_READY")
        self.assertEqual(v["sections"]["decision_logs"], "fail")

    def test_sensitive_surfaces_fail_open_fails(self):
        m = copy.deepcopy(READY)
        m["enforcement"]["sensitive_surfaces_fail_closed"] = False
        self.assertEqual(evaluate(m)["verdict"], "NOT_READY")

    def test_human_summary_out_of_sync_fails(self):
        m = copy.deepcopy(READY)
        m["governance"]["human_summary_in_sync_with_code"] = False
        self.assertEqual(evaluate(m)["verdict"], "NOT_READY")

    def test_no_policies_declared_is_missing(self):
        m = copy.deepcopy(READY)
        del m["policies"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertIsNone(v["policy_count"])
        self.assertIsNone(v["coverage_status"])
        self.assertIsNone(v["test_coverage_ratio"])

    def test_empty_policies_list_is_missing(self):
        m = copy.deepcopy(READY)
        m["policies"] = []
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertIsNone(v["policy_count"])

    def test_policy_missing_default_is_missing(self):
        m = copy.deepcopy(READY)
        del m["policies"][0]["default"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["decision_model"],
                         "insufficient_evidence")

    def test_absent_evidence_is_insufficient_not_failed(self):
        m = copy.deepcopy(READY)
        del m["decision_logs"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["decision_logs"],
                         "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertIsNone(v["coverage_status"])
        self.assertIsNone(v["policy_count"])
        self.assertEqual(v["untested_policy_ids"], [])

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(READY))
        self.assertIn("VERDICT: READY", stamp(v))

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
            evaluate({"pack": "bad-types",
                      "decision_model": "not-an-object",
                      "policies": "not-a-list"})
        self.assertIn("decision_model", str(ctx.exception))

    def test_decision_model_as_string_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"decision_model": "not-an-object"})
        self.assertIn("decision_model", str(ctx.exception))

    def test_policies_as_string_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"policies": "not-a-list"})
        self.assertIn("policies", str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(READY)
        m["testing"]["tests_green"] = "yes"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("testing.tests_green", str(ctx.exception))

    def test_policy_entry_field_as_number_rejected(self):
        m = copy.deepcopy(READY)
        m["policies"][0]["id"] = 42
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("policies[0].id", str(ctx.exception))

    def test_test_entry_as_string_rejected(self):
        m = copy.deepcopy(READY)
        m["tests"][0] = "not-an-object"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("tests[0]", str(ctx.exception))

    def test_null_field_rejected(self):
        m = copy.deepcopy(READY)
        m["rollout"] = None
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("rollout", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
