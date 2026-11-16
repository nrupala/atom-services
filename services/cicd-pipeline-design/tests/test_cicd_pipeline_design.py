import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from cicd_pipeline_design import evaluate, stamp  # noqa: E402


def _stages(minutes=(2, 3, 10, 5, 2, 1),
            names=("lint", "typecheck", "test", "build",
                   "package_sign", "publish")):
    return [{"name": n, "minutes": m} for n, m in zip(names, minutes)]


COMPLETE = {
    "entity": "Acme Platform Repo",
    "pipeline": {"stages": _stages(),
                 "declared_total_minutes": 23,
                 "fails_fast": True,
                 "reports_first_real_cause": True,
                 "is_primary_green_gate": True},
    "determinism": {"lockfile_enforced_installs": True,
                    "tool_versions_pinned": True,
                    "byte_exact_checkouts_where_hashes_matter": True,
                    "same_commit_same_artifact_verified": True,
                    "third_party_actions_pinned": True,
                    "unpinned_third_party_actions_present": False},
    "caching": {"dependency_cache_keyed_on_lockfile": True,
                "build_cache_keyed_on_lockfile": True,
                "secrets_cached": False,
                "test_fixtures_cached": False},
    "secrets": {"from_secret_store_only": True,
                "masked_in_logs": True,
                "in_artifacts": False,
                "error_output_scrubbed": True,
                "appeared_in_logs_or_artifacts": False},
    "budget": {"estimated_minutes_per_run": 23,
               "runs_per_month": 100,
               "declared_monthly_minutes": 2300,
               "monthly_minutes_budget": 2500,
               "workflows_minimal_where_constrained": True,
               "heavy_builds_on_owned_hardware": True,
               "duplicates_primary_gate": False},
    "provenance": {"checksums_published": True,
                   "releases_signed": True,
                   "build_outputs_retained": True,
                   "manifest_hashes_retained": True,
                   "release_artifacts_carry_hash_and_signature": True},
    "deploys": {"hitl_approval_required": True,
                "rollback_path_present": True,
                "direct_to_prod_from_laptop": False},
    "gates": {"disabled_to_unblock_merge": False,
              "overrides_logged_with_reason": True},
}


def check_status(v, name):
    return next(c["status"] for c in v["checks"] if c["check"] == name)


class VerdictTests(unittest.TestCase):
    def test_complete_manifest_is_ready(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(v["verdict"], "CICD_PIPELINE_READY")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(v["computed_status"],
                         "within_stated_limits_on_declared_evidence")
        self.assertEqual(len(v["checks"]), 36)
        self.assertEqual(v["stages_evaluated"], 6)
        self.assertEqual(v["computed_total_minutes"], "23.000000")
        self.assertEqual(v["total_minutes_difference"], "0.000000")
        self.assertEqual(v["stated_stages_not_declared"], [])
        self.assertEqual(v["computed_monthly_minutes"], "2300.000000")
        self.assertEqual(v["monthly_minutes_difference"], "0.000000")
        self.assertEqual(v["budget_headroom_minutes"], "200.000000")

    def test_stage_minutes_at_other_values_passes(self):
        m = copy.deepcopy(COMPLETE)
        m["pipeline"]["stages"] = _stages(minutes=(1, 1, 4, 2, 1, 1))
        m["pipeline"]["declared_total_minutes"] = 10
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CICD_PIPELINE_READY")
        self.assertEqual(v["computed_total_minutes"], "10.000000")

    def test_stage_order_swapped_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["pipeline"]["stages"] = _stages(
            names=("test", "lint", "typecheck", "build",
                   "package_sign", "publish"))
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CICD_PIPELINE_NOT_READY")
        self.assertEqual(v["sections"]["stages_and_fail_fast"], "fail")
        self.assertEqual(
            check_status(v, "stage_order_matches_stated_sequence"),
            "fail")
        self.assertEqual(v["stated_stages_not_declared"], [])
        self.assertEqual(v["computed_status"],
                         "outside_stated_limits_on_declared_evidence")

    def test_missing_stage_fails_order_and_reports_it(self):
        m = copy.deepcopy(COMPLETE)
        m["pipeline"]["stages"] = _stages(
            minutes=(2, 3, 10, 5, 2),
            names=("lint", "typecheck", "test", "build",
                   "package_sign"))
        m["pipeline"]["declared_total_minutes"] = 22
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CICD_PIPELINE_NOT_READY")
        self.assertEqual(
            check_status(v, "stage_order_matches_stated_sequence"),
            "fail")
        self.assertEqual(v["stated_stages_not_declared"], ["publish"])
        self.assertEqual(v["stages_evaluated"], 5)

    def test_extra_stage_fails_order(self):
        m = copy.deepcopy(COMPLETE)
        stages = _stages() + [{"name": "notify", "minutes": 1}]
        m["pipeline"]["stages"] = stages
        m["pipeline"]["declared_total_minutes"] = 24
        self.assertEqual(evaluate(m)["verdict"],
                         "CICD_PIPELINE_NOT_READY")

    def test_unknown_stage_names_do_not_satisfy_order(self):
        m = copy.deepcopy(COMPLETE)
        m["pipeline"]["stages"] = _stages(
            names=("a", "b", "c", "d", "e", "f"))
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CICD_PIPELINE_NOT_READY")
        self.assertEqual(len(v["stated_stages_not_declared"]), 6)

    def test_total_minutes_mismatch_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["pipeline"]["declared_total_minutes"] = 20
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CICD_PIPELINE_NOT_READY")
        self.assertEqual(
            check_status(v, "total_minutes_matches_sum_of_stage_minutes"),
            "fail")
        self.assertEqual(v["total_minutes_difference"], "-3.000000")

    def test_missing_stages_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["pipeline"]["stages"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "stage_order_matches_stated_sequence"),
            "missing")
        self.assertEqual(v["stages_evaluated"], 0)
        self.assertIsNone(v["computed_total_minutes"])
        self.assertIsNone(v["stated_stages_not_declared"])
        self.assertIsNone(v["computed_status"])

    def test_empty_stages_list_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        m["pipeline"]["stages"] = []
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "stage_entries_complete"), "missing")

    def test_incomplete_stage_entry_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["pipeline"]["stages"][2]["minutes"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "stage_entries_complete"), "missing")
        self.assertEqual(v["stages_evaluated"], 5)
        self.assertIsNone(v["computed_total_minutes"])
        self.assertEqual(
            check_status(v, "stage_order_matches_stated_sequence"),
            "pass")

    def test_stage_entry_without_name_makes_order_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["pipeline"]["stages"][0]["name"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "stage_order_matches_stated_sequence"),
            "missing")
        self.assertIsNone(v["stated_stages_not_declared"])
        self.assertEqual(v["computed_total_minutes"], "23.000000")

    def test_missing_declared_total_makes_total_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["pipeline"]["declared_total_minutes"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "total_minutes_matches_sum_of_stage_minutes"),
            "missing")
        self.assertIsNone(v["computed_total_minutes"])

    def test_not_fails_fast_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["pipeline"]["fails_fast"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CICD_PIPELINE_NOT_READY")
        self.assertEqual(v["sections"]["stages_and_fail_fast"], "fail")

    def test_monthly_minutes_mismatch_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["budget"]["declared_monthly_minutes"] = 2000
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CICD_PIPELINE_NOT_READY")
        self.assertEqual(
            check_status(v, "monthly_minutes_matches_per_run_times_runs"),
            "fail")
        self.assertEqual(v["monthly_minutes_difference"], "-300.000000")
        self.assertEqual(v["computed_monthly_minutes"], "2300.000000")

    def test_monthly_minutes_at_other_values_passes(self):
        m = copy.deepcopy(COMPLETE)
        m["budget"].update({"estimated_minutes_per_run": 10,
                            "runs_per_month": 50,
                            "declared_monthly_minutes": 500,
                            "monthly_minutes_budget": 500})
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CICD_PIPELINE_READY")
        self.assertEqual(v["budget_headroom_minutes"], "0.000000")

    def test_monthly_minutes_over_declared_budget_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["budget"]["monthly_minutes_budget"] = 2000
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CICD_PIPELINE_NOT_READY")
        self.assertEqual(
            check_status(v, "monthly_minutes_within_declared_budget"),
            "fail")
        self.assertEqual(v["budget_headroom_minutes"], "-300.000000")
        self.assertEqual(
            check_status(v, "monthly_minutes_matches_per_run_times_runs"),
            "pass")

    def test_monthly_minutes_exactly_at_budget_passes(self):
        m = copy.deepcopy(COMPLETE)
        m["budget"]["monthly_minutes_budget"] = 2300
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "monthly_minutes_within_declared_budget"),
            "pass")
        self.assertEqual(v["verdict"], "CICD_PIPELINE_READY")

    def test_missing_budget_number_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["budget"]["runs_per_month"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertIsNone(v["computed_monthly_minutes"])
        self.assertIsNone(v["budget_headroom_minutes"])

    def test_missing_budget_cap_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["budget"]["monthly_minutes_budget"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "monthly_minutes_within_declared_budget"),
            "missing")
        self.assertEqual(v["computed_monthly_minutes"], "2300.000000")
        self.assertIsNone(v["budget_headroom_minutes"])

    def test_missing_declared_monthly_is_missing_but_budget_evaluated(self):
        m = copy.deepcopy(COMPLETE)
        del m["budget"]["declared_monthly_minutes"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "monthly_minutes_within_declared_budget"),
            "pass")
        self.assertIsNone(v["monthly_minutes_difference"])

    def test_duplicate_of_primary_gate_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["budget"]["duplicates_primary_gate"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CICD_PIPELINE_NOT_READY")
        self.assertEqual(v["sections"]["budget_awareness"], "fail")

    def test_unpinned_actions_present_fails_red_line(self):
        m = copy.deepcopy(COMPLETE)
        m["determinism"]["unpinned_third_party_actions_present"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CICD_PIPELINE_NOT_READY")
        self.assertEqual(v["sections"]["determinism_and_pinning"], "fail")
        self.assertEqual(
            check_status(v, "no_unpinned_third_party_actions"), "fail")

    def test_lockfile_not_enforced_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["determinism"]["lockfile_enforced_installs"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "CICD_PIPELINE_NOT_READY")

    def test_secrets_cached_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["caching"]["secrets_cached"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CICD_PIPELINE_NOT_READY")
        self.assertEqual(v["sections"]["caching_and_secrets"], "fail")

    def test_test_fixtures_cached_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["caching"]["test_fixtures_cached"] = True
        self.assertEqual(evaluate(m)["verdict"],
                         "CICD_PIPELINE_NOT_READY")

    def test_secret_in_artifacts_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["secrets"]["in_artifacts"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CICD_PIPELINE_NOT_READY")
        self.assertEqual(
            check_status(v, "secrets_never_in_artifacts"), "fail")

    def test_secret_appeared_in_logs_fails_quality_gate(self):
        m = copy.deepcopy(COMPLETE)
        m["secrets"]["appeared_in_logs_or_artifacts"] = True
        self.assertEqual(evaluate(m)["verdict"],
                         "CICD_PIPELINE_NOT_READY")

    def test_unsigned_releases_fail(self):
        m = copy.deepcopy(COMPLETE)
        m["provenance"]["releases_signed"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CICD_PIPELINE_NOT_READY")
        self.assertEqual(v["sections"]["provenance_and_signing"], "fail")

    def test_direct_to_prod_from_laptop_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["deploys"]["direct_to_prod_from_laptop"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CICD_PIPELINE_NOT_READY")
        self.assertEqual(v["sections"]["deploys_and_gates"], "fail")

    def test_gates_disabled_to_unblock_merge_fails_red_line(self):
        m = copy.deepcopy(COMPLETE)
        m["gates"]["disabled_to_unblock_merge"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CICD_PIPELINE_NOT_READY")
        self.assertEqual(
            check_status(v, "gates_not_disabled_to_unblock_merge"),
            "fail")

    def test_no_rollback_path_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["deploys"]["rollback_path_present"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "CICD_PIPELINE_NOT_READY")

    def test_absent_section_is_insufficient_not_failed(self):
        m = copy.deepcopy(COMPLETE)
        del m["provenance"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["provenance_and_signing"],
                         "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertIsNone(v["computed_status"])
        self.assertEqual(v["stages_evaluated"], 0)
        self.assertIsNone(v["computed_total_minutes"])
        self.assertIsNone(v["computed_monthly_minutes"])
        self.assertIsNone(v["stated_stages_not_declared"])

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertIn("VERDICT: CICD_PIPELINE_READY", stamp(v))

    def test_non_object_manifest_rejected(self):
        with self.assertRaises(TypeError):
            evaluate(["not", "a", "manifest"])


class MalformedTypeTests(unittest.TestCase):
    """F1 regression (external verification Wave 1): a documented
    field present with the wrong JSON type is rejected with
    ValueError naming the field — never evaluated into a verdict."""

    def test_top_level_string_field_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["entity"] = 12345
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("entity", str(ctx.exception))

    def test_section_as_string_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"pipeline": "should-be-an-object"})
        self.assertIn("pipeline", str(ctx.exception))

    def test_stages_list_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["pipeline"]["stages"] = "lint,test"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("pipeline.stages", str(ctx.exception))

    def test_stage_entry_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["pipeline"]["stages"][0] = "lint"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("pipeline.stages[0]", str(ctx.exception))

    def test_stage_name_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["pipeline"]["stages"][0]["name"] = 1
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("pipeline.stages[0].name", str(ctx.exception))

    def test_stage_minutes_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["pipeline"]["stages"][2]["minutes"] = "10"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("pipeline.stages[2].minutes", str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["pipeline"]["fails_fast"] = "yes"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("pipeline.fails_fast", str(ctx.exception))

    def test_numeric_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["budget"]["runs_per_month"] = "100"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("budget.runs_per_month", str(ctx.exception))

    def test_numeric_leaf_as_boolean_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["budget"]["estimated_minutes_per_run"] = True
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("budget.estimated_minutes_per_run",
                      str(ctx.exception))

    def test_null_section_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["secrets"] = None
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("secrets", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
