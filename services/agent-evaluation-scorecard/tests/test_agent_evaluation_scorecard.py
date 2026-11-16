import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from agent_evaluation_scorecard import evaluate, stamp  # noqa: E402

TRUSTED = {
    "agent": "example-agent",
    "suite": {"versioned": True, "criteria_written_before_run": True,
              "acceptance_criteria_per_task": True,
              "versioned_with_agent": True},
    "run": {"model_version_pinned": True, "sampling_settings_pinned": True,
            "tool_state_pinned": True, "fixtures_pinned": True,
            "raw_transcripts_stored": True,
            "same_suite_per_candidate": True},
    "judging": {"deterministic_checks_first": True, "llm_judge_used": True,
                "judge_calibrated_against_human_labels": True,
                "judge_blinded": True, "position_bias_controls": True,
                "model_judges_itself": False},
    "gates": {"eval_runs_before_merge": True, "regressions_block_merge": True,
              "accepted_tradeoffs_written": True},
    "metrics": {"steps_tracked": True, "cost_tracked": True,
                "latency_tracked": True,
                "refusal_error_rates_tracked": True,
                "safety_violations_tracked": True,
                "silent_wrongness_tracked": True},
    "incidents": {"misbehavior_becomes_named_tests": True,
                  "all_production_incidents_replayed": True},
    "scorecard": {"published_per_run": True, "stored": True},
    "hygiene": {"contamination_checked": True, "variance_reported": True,
                "rebaselined_after_model_updates": True},
    "tasks": [
        {"name": "triage-inbox", "passed": True, "cost": 0.04,
         "allowed_cost": 0.10, "latency_ms": 900, "allowed_latency_ms": 2000,
         "safety_violation": False},
        {"name": "draft-reply", "passed": True, "cost": 0.02,
         "allowed_cost": 0.05, "latency_ms": 400, "allowed_latency_ms": 1000,
         "safety_violation": False},
    ],
}


class VerdictTests(unittest.TestCase):
    def test_trusted_manifest_is_trusted(self):
        v = evaluate(copy.deepcopy(TRUSTED))
        self.assertEqual(v["verdict"], "TRUSTED")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(v["scorecard"]["tasks_passing"], 2)

    def test_uncalibrated_llm_judge_fails_judging(self):
        m = copy.deepcopy(TRUSTED)
        m["judging"]["judge_calibrated_against_human_labels"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_TRUSTED")
        self.assertEqual(v["sections"]["judging"], "fail")

    def test_no_llm_judge_passes_judge_controls_as_not_applicable(self):
        m = copy.deepcopy(TRUSTED)
        m["judging"]["llm_judge_used"] = False
        del m["judging"]["judge_calibrated_against_human_labels"]
        del m["judging"]["judge_blinded"]
        del m["judging"]["position_bias_controls"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "TRUSTED")

    def test_uncalibrated_self_judging_is_a_red_line_fail(self):
        m = copy.deepcopy(TRUSTED)
        m["judging"]["model_judges_itself"] = True
        m["judging"]["judge_calibrated_against_human_labels"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_TRUSTED")
        self.assertEqual(v["sections"]["judging"], "fail")

    def test_calibrated_self_judging_passes(self):
        m = copy.deepcopy(TRUSTED)
        m["judging"]["model_judges_itself"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "TRUSTED")

    def test_criteria_written_after_the_run_fails(self):
        m = copy.deepcopy(TRUSTED)
        m["suite"]["criteria_written_before_run"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_TRUSTED")
        self.assertEqual(v["sections"]["task_suite"], "fail")

    def test_regressions_not_blocking_fails_gates(self):
        m = copy.deepcopy(TRUSTED)
        m["gates"]["regressions_block_merge"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_TRUSTED")
        self.assertEqual(v["sections"]["regression_gates"], "fail")

    def test_task_over_cost_allowance_fails_scorecard(self):
        m = copy.deepcopy(TRUSTED)
        m["tasks"][0]["cost"] = 0.50
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_TRUSTED")
        self.assertEqual(v["sections"]["scorecard"], "fail")
        self.assertEqual(v["scorecard"]["tasks_passing"], 1)

    def test_task_safety_violation_fails_scorecard(self):
        m = copy.deepcopy(TRUSTED)
        m["tasks"][1]["safety_violation"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_TRUSTED")
        self.assertEqual(v["scorecard"]["safety_violations"], 1)

    def test_task_over_latency_allowance_fails(self):
        m = copy.deepcopy(TRUSTED)
        m["tasks"][0]["latency_ms"] = 5000
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_TRUSTED")

    def test_failed_task_fails_scorecard(self):
        m = copy.deepcopy(TRUSTED)
        m["tasks"][0]["passed"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_TRUSTED")

    def test_task_missing_acceptance_fields_is_insufficient(self):
        m = copy.deepcopy(TRUSTED)
        del m["tasks"][0]["allowed_cost"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["scorecard"],
                         "insufficient_evidence")

    def test_no_tasks_declared_is_insufficient(self):
        m = copy.deepcopy(TRUSTED)
        del m["tasks"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")

    def test_absent_evidence_is_insufficient_not_failed(self):
        m = copy.deepcopy(TRUSTED)
        del m["hygiene"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["benchmark_hygiene"],
                         "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(TRUSTED))
        self.assertIn("VERDICT: TRUSTED", stamp(v))

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
            evaluate({"agent": 12345, "tasks": "not-a-list"})
        self.assertIn("agent", str(ctx.exception))

    def test_agent_as_number_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"agent": 12345})
        self.assertIn("agent", str(ctx.exception))

    def test_tasks_as_string_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"tasks": "not-a-list"})
        self.assertIn("tasks", str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(TRUSTED)
        m["metrics"]["cost_tracked"] = "yes"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("metrics.cost_tracked", str(ctx.exception))

    def test_task_entry_number_as_string_rejected(self):
        m = copy.deepcopy(TRUSTED)
        m["tasks"][0]["cost"] = "cheap"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("tasks[0].cost", str(ctx.exception))

    def test_task_entry_as_string_rejected(self):
        m = copy.deepcopy(TRUSTED)
        m["tasks"] = ["triage-inbox"]
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("tasks[0]", str(ctx.exception))

    def test_null_field_rejected(self):
        m = copy.deepcopy(TRUSTED)
        m["suite"] = None
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("suite", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
