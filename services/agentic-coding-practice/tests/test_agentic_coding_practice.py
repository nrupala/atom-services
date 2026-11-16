import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from agentic_coding_practice import evaluate, stamp  # noqa: E402

RELIABLE = {
    "practice": "small-feature build workflow",
    "spec": {"spec_written_first": True,
             "small_vertical_slices": True,
             "diffs_reviewed": True},
    "hooks": {"wired_as_guardrails": True,
              "events_and_payloads_known": True,
              "protected_paths_blocked": True,
              "formatters_auto_run": True,
              "secrets_denied": True},
    "feedback": {"tests_run_after_edit": True,
                 "tests_wired_into_hooks": True,
                 "linters_wired_into_hooks": True},
    "guardrails": {"protected_paths_declared": True,
                   "no_secrets": True,
                   "docker_used": False,
                   "staging_first": True,
                   "human_in_loop_on_irreversible": True,
                   "autonomous_only_safe_reversible": True,
                   "agent_run_unbounded": False},
    "context": {"only_what_agent_needs": True,
                "whole_repo_dumped": False,
                "files_pulled_into_workspace": True},
    "tools": {"mcp_tools_typed": True,
              "mcp_tools_narrowly_scoped": True},
    "delegation": {"subagent_tasks_bounded": True,
                   "subagent_context_narrow": True,
                   "planner_worker_reviewer_pattern": True},
    "access": {"broad_write_access": True,
               "guardrails_present": True},
}


class VerdictTests(unittest.TestCase):
    def test_reliable_manifest_is_reliable_practice(self):
        v = evaluate(copy.deepcopy(RELIABLE))
        self.assertEqual(v["verdict"], "RELIABLE_PRACTICE")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(len(v["checks"]), 27)
        self.assertEqual(v["practice"], "small-feature build workflow")

    def test_no_spec_first_fails(self):
        m = copy.deepcopy(RELIABLE)
        m["spec"]["spec_written_first"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_RELIABLE_PRACTICE")
        self.assertEqual(v["sections"]["spec_and_slicing"], "fail")

    def test_not_small_vertical_slices_fails(self):
        m = copy.deepcopy(RELIABLE)
        m["spec"]["small_vertical_slices"] = False
        self.assertEqual(evaluate(m)["verdict"], "NOT_RELIABLE_PRACTICE")

    def test_rubber_stamped_diffs_fail(self):
        m = copy.deepcopy(RELIABLE)
        m["spec"]["diffs_reviewed"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_RELIABLE_PRACTICE")
        self.assertEqual(v["sections"]["spec_and_slicing"], "fail")

    def test_hooks_not_wired_as_guardrails_fails(self):
        m = copy.deepcopy(RELIABLE)
        m["hooks"]["wired_as_guardrails"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_RELIABLE_PRACTICE")
        self.assertEqual(v["sections"]["hooks_and_events"], "fail")

    def test_hook_events_and_payloads_unknown_fails(self):
        m = copy.deepcopy(RELIABLE)
        m["hooks"]["events_and_payloads_known"] = False
        self.assertEqual(evaluate(m)["verdict"], "NOT_RELIABLE_PRACTICE")

    def test_protected_paths_not_blocked_by_hooks_fails(self):
        m = copy.deepcopy(RELIABLE)
        m["hooks"]["protected_paths_blocked"] = False
        self.assertEqual(evaluate(m)["verdict"], "NOT_RELIABLE_PRACTICE")

    def test_formatters_not_auto_run_fails(self):
        m = copy.deepcopy(RELIABLE)
        m["hooks"]["formatters_auto_run"] = False
        self.assertEqual(evaluate(m)["verdict"], "NOT_RELIABLE_PRACTICE")

    def test_secrets_not_denied_by_hooks_fails(self):
        m = copy.deepcopy(RELIABLE)
        m["hooks"]["secrets_denied"] = False
        self.assertEqual(evaluate(m)["verdict"], "NOT_RELIABLE_PRACTICE")

    def test_tests_not_run_after_edit_fails(self):
        m = copy.deepcopy(RELIABLE)
        m["feedback"]["tests_run_after_edit"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_RELIABLE_PRACTICE")
        self.assertEqual(v["sections"]["feedback_loop"], "fail")

    def test_no_automated_tests_in_loop_fails(self):
        m = copy.deepcopy(RELIABLE)
        m["feedback"]["tests_wired_into_hooks"] = False
        self.assertEqual(evaluate(m)["verdict"], "NOT_RELIABLE_PRACTICE")

    def test_linters_not_wired_fails(self):
        m = copy.deepcopy(RELIABLE)
        m["feedback"]["linters_wired_into_hooks"] = False
        self.assertEqual(evaluate(m)["verdict"], "NOT_RELIABLE_PRACTICE")

    def test_protected_paths_not_declared_fails(self):
        m = copy.deepcopy(RELIABLE)
        m["guardrails"]["protected_paths_declared"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_RELIABLE_PRACTICE")
        self.assertEqual(v["sections"]["guardrails"], "fail")

    def test_secrets_used_fails(self):
        m = copy.deepcopy(RELIABLE)
        m["guardrails"]["no_secrets"] = False
        self.assertEqual(evaluate(m)["verdict"], "NOT_RELIABLE_PRACTICE")

    def test_docker_used_fails_house_rule(self):
        m = copy.deepcopy(RELIABLE)
        m["guardrails"]["docker_used"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_RELIABLE_PRACTICE")
        self.assertEqual(v["sections"]["guardrails"], "fail")

    def test_not_staging_first_fails(self):
        m = copy.deepcopy(RELIABLE)
        m["guardrails"]["staging_first"] = False
        self.assertEqual(evaluate(m)["verdict"], "NOT_RELIABLE_PRACTICE")

    def test_no_human_in_loop_on_irreversible_fails(self):
        m = copy.deepcopy(RELIABLE)
        m["guardrails"]["human_in_loop_on_irreversible"] = False
        self.assertEqual(evaluate(m)["verdict"], "NOT_RELIABLE_PRACTICE")

    def test_autonomous_on_irreversible_fails(self):
        m = copy.deepcopy(RELIABLE)
        m["guardrails"]["autonomous_only_safe_reversible"] = False
        self.assertEqual(evaluate(m)["verdict"], "NOT_RELIABLE_PRACTICE")

    def test_unbounded_agent_run_fails(self):
        m = copy.deepcopy(RELIABLE)
        m["guardrails"]["agent_run_unbounded"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_RELIABLE_PRACTICE")
        self.assertEqual(v["sections"]["guardrails"], "fail")

    def test_context_not_limited_fails(self):
        m = copy.deepcopy(RELIABLE)
        m["context"]["only_what_agent_needs"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_RELIABLE_PRACTICE")
        self.assertEqual(v["sections"]["context_and_tools"], "fail")

    def test_whole_repo_dumped_fails(self):
        m = copy.deepcopy(RELIABLE)
        m["context"]["whole_repo_dumped"] = True
        self.assertEqual(evaluate(m)["verdict"], "NOT_RELIABLE_PRACTICE")

    def test_files_not_pulled_into_workspace_fails(self):
        m = copy.deepcopy(RELIABLE)
        m["context"]["files_pulled_into_workspace"] = False
        self.assertEqual(evaluate(m)["verdict"], "NOT_RELIABLE_PRACTICE")

    def test_untyped_mcp_tools_fail(self):
        m = copy.deepcopy(RELIABLE)
        m["tools"]["mcp_tools_typed"] = False
        self.assertEqual(evaluate(m)["verdict"], "NOT_RELIABLE_PRACTICE")

    def test_broadly_scoped_mcp_tools_fail(self):
        m = copy.deepcopy(RELIABLE)
        m["tools"]["mcp_tools_narrowly_scoped"] = False
        self.assertEqual(evaluate(m)["verdict"], "NOT_RELIABLE_PRACTICE")

    def test_unbounded_subagent_tasks_fail(self):
        m = copy.deepcopy(RELIABLE)
        m["delegation"]["subagent_tasks_bounded"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_RELIABLE_PRACTICE")
        self.assertEqual(v["sections"]["delegation_and_access"], "fail")

    def test_wide_subagent_context_fails(self):
        m = copy.deepcopy(RELIABLE)
        m["delegation"]["subagent_context_narrow"] = False
        self.assertEqual(evaluate(m)["verdict"], "NOT_RELIABLE_PRACTICE")

    def test_no_planner_worker_reviewer_orchestration_fails(self):
        m = copy.deepcopy(RELIABLE)
        m["delegation"]["planner_worker_reviewer_pattern"] = False
        self.assertEqual(evaluate(m)["verdict"], "NOT_RELIABLE_PRACTICE")

    def test_broad_write_access_without_guardrails_fails(self):
        m = copy.deepcopy(RELIABLE)
        m["access"]["guardrails_present"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_RELIABLE_PRACTICE")
        self.assertEqual(v["sections"]["delegation_and_access"], "fail")

    def test_broad_write_access_guardrails_missing_is_missing(self):
        m = copy.deepcopy(RELIABLE)
        del m["access"]["guardrails_present"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["delegation_and_access"],
                         "insufficient_evidence")

    def test_no_broad_write_access_passes_as_not_applicable(self):
        m = copy.deepcopy(RELIABLE)
        m["access"]["broad_write_access"] = False
        del m["access"]["guardrails_present"]
        self.assertEqual(evaluate(m)["verdict"], "RELIABLE_PRACTICE")

    def test_absent_broad_write_access_gate_is_missing(self):
        m = copy.deepcopy(RELIABLE)
        del m["access"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["delegation_and_access"],
                         "insufficient_evidence")

    def test_absent_evidence_is_insufficient_not_failed(self):
        m = copy.deepcopy(RELIABLE)
        del m["feedback"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["feedback_loop"],
                         "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertIsNone(v["practice"])
        self.assertEqual(len(v["checks"]), 27)

    def test_non_boolean_truthy_value_fails_bool_check(self):
        # Corrected under the F1 ruling: previously expected a
        # verdict over a wrong-typed documented field (the F1
        # defect). A non-boolean value is now rejected with
        # ValueError naming the field.
        m = copy.deepcopy(RELIABLE)
        m["spec"]["spec_written_first"] = "yes"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("spec.spec_written_first", str(ctx.exception))

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(RELIABLE))
        self.assertIn("VERDICT: RELIABLE_PRACTICE", stamp(v))
        self.assertIn("spec_and_slicing", stamp(v))

    def test_non_object_manifest_rejected(self):
        with self.assertRaises(TypeError):
            evaluate(["not", "a", "manifest"])
        with self.assertRaises(TypeError):
            evaluate("not a manifest")
        with self.assertRaises(TypeError):
            evaluate(None)


class MalformedTypeTests(unittest.TestCase):
    """F1 regression (external verification Wave 1): a documented
    field present with the wrong JSON type is rejected with
    ValueError naming the field — never evaluated into a verdict."""

    def test_top_level_string_field_as_number_rejected(self):
        m = copy.deepcopy(RELIABLE)
        m["practice"] = 12345
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("practice", str(ctx.exception))

    def test_section_as_string_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"spec": "should-be-an-object"})
        self.assertIn("spec", str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(RELIABLE)
        m["spec"]["spec_written_first"] = "yes"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("spec.spec_written_first", str(ctx.exception))

    def test_null_section_rejected(self):
        m = copy.deepcopy(RELIABLE)
        m["guardrails"] = None
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("guardrails", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
