import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from process_waste_review_coaching import evaluate, stamp  # noqa: E402

COMPLETE = {
    "process": "release-process",
    "define": {"problem_stated": True,
               "goal_measurable_stated": True,
               "scope_stated": True,
               "customer_need_stated": True,
               "whole_system_scope_declared": True},
    "mapping": {"whole_flow_mapped": True,
                "work_made_visible": True,
                "process_defined_before_automation": True},
    "steps": [
        {"name": "build", "duration_minutes": 20, "wait_before_minutes": 5},
        {"name": "review", "duration_minutes": 45, "wait_before_minutes": 120},
        {"name": "deploy", "duration_minutes": 15, "wait_before_minutes": 30},
    ],
    "wastes": [
        {"category": "waiting", "step_name": "review"},
        {"category": "defects", "step_name": "build"},
        {"category": "excess_processing", "step_name": "deploy"},
    ],
    "measure": {"baseline_established_with_data": True,
                "baseline_from_data_not_anecdote": True},
    "metrics": {"leading_indicators_declared": True,
                "lagging_indicators_declared": True,
                "kpis_limited_to_meaningful_declared": True,
                "metrics_made_visible": True},
    "analyze": {"root_cause_analysis_performed": True,
                "pareto_vital_few_identified": True},
    "constraint": {"bottleneck_identified": True,
                   "non_bottleneck_effort_subordinated": True,
                   "bottleneck_step_name": "review"},
    "improve": {"improvement_piloted_before_scaling": True,
                "pdca_cycle_declared": True,
                "verified_against_baseline_before_scaling": True,
                "small_continuous_improvement_declared": True,
                "flow_and_pull_pursued_over_push": True},
    "control": {"win_standardized": True,
                "monitoring_in_place": True,
                "regression_made_visible": True},
    "red_lines": {"automating_broken_process_present": False,
                  "vanity_metrics_present": False,
                  "hero_culture_reliance_present": False,
                  "optimizing_non_constraint_present": False,
                  "tradition_without_data_present": False,
                  "local_optimization_hurting_whole_present": False},
}


def check_status(v, name):
    return next(c["status"] for c in v["checks"] if c["check"] == name)


class VerdictTests(unittest.TestCase):
    def test_complete_manifest_is_ready(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(v["verdict"], "PROCESS_WASTE_REVIEW_READY")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(len(v["checks"]), 40)
        self.assertEqual(v["computed_status"],
                         "within_stated_limits_on_declared_evidence")
        self.assertEqual(v["steps_count"], 3)
        self.assertEqual(v["wastes_count"], 3)
        self.assertEqual(v["total_duration_minutes"], 80)
        self.assertEqual(v["total_wait_minutes"], 155)
        # 155 / (155 + 80) = 0.659574...
        self.assertEqual(v["wait_share"], "0.659574")
        self.assertEqual(v["distinct_waste_categories"],
                         ["waiting", "defects", "excess_processing"])
        self.assertEqual(v["duplicate_step_names"], [])
        self.assertEqual(v["unmatched_waste_step_names"], [])
        self.assertEqual(v["waste_step_coverage"], "1.000000")
        self.assertEqual(v["bottleneck_step_computed"], "review")

    def test_empty_lists_are_valid_declarations(self):
        m = copy.deepcopy(COMPLETE)
        m["steps"] = []
        m["wastes"] = []
        del m["constraint"]["bottleneck_step_name"]
        v = evaluate(m)
        # bottleneck check is missing on an empty step list, so
        # the verdict cannot be READY even though both empty
        # lists pass their own declared checks.
        self.assertEqual(check_status(v, "steps_declared"), "pass")
        self.assertEqual(check_status(v, "wastes_declared"), "pass")
        self.assertEqual(
            check_status(v, "declared_bottleneck_matches_longest_step"),
            "missing")
        self.assertEqual(v["steps_count"], 0)
        self.assertEqual(v["total_duration_minutes"], 0)
        self.assertEqual(v["total_wait_minutes"], 0)
        self.assertIsNone(v["wait_share"])
        self.assertIsNone(v["waste_step_coverage"])
        self.assertIsNone(v["bottleneck_step_computed"])
        self.assertEqual(v["distinct_waste_categories"], [])

    def test_no_measurable_goal_fails_section1(self):
        m = copy.deepcopy(COMPLETE)
        m["define"]["goal_measurable_stated"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "PROCESS_WASTE_REVIEW_NOT_READY")
        self.assertEqual(v["sections"]["define_and_visibility"], "fail")
        self.assertEqual(
            check_status(v, "process_goal_measurable_stated"), "fail")

    def test_automation_before_definition_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["mapping"]["process_defined_before_automation"] = False
        self.assertEqual(
            check_status(evaluate(m), "process_defined_before_automation"),
            "fail")

    def test_negative_wait_fails_and_totals_still_reported(self):
        m = copy.deepcopy(COMPLETE)
        m["steps"][1]["wait_before_minutes"] = -10
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v, "every_step_times_declared_and_nonnegative"), "fail")
        self.assertEqual(v["total_wait_minutes"], 25)
        self.assertEqual(v["computed_status"],
                         "outside_stated_limits_on_declared_evidence")

    def test_step_missing_duration_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["steps"][0]["duration_minutes"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(
                v, "every_step_times_declared_and_nonnegative"), "missing")
        self.assertIsNone(v["total_duration_minutes"])
        self.assertEqual(v["total_wait_minutes"], 155)
        self.assertIsNone(v["wait_share"])
        self.assertIsNone(v["bottleneck_step_computed"])

    def test_duplicate_step_name_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["steps"][2]["name"] = "build"
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "no_step_name_duplicated"), "fail")
        self.assertEqual(v["duplicate_step_names"], ["build"])

    def test_invalid_waste_category_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["wastes"][0]["category"] = "slowness"
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_waste_category_valid_downtime"), "fail")
        self.assertEqual(v["distinct_waste_categories"],
                         ["defects", "excess_processing"])

    def test_waste_on_undeclared_step_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["wastes"][1]["step_name"] = "packaging"
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_waste_step_names_declared_step"), "fail")
        self.assertEqual(v["unmatched_waste_step_names"], ["packaging"])
        self.assertEqual(v["waste_step_coverage"], "0.666667")

    def test_waste_missing_step_name_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["wastes"][0]["step_name"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "every_waste_step_names_declared_step"),
            "missing")
        self.assertEqual(v["unmatched_waste_step_names"], [])

    def test_absent_steps_list_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["steps"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(check_status(v, "steps_declared"), "missing")
        self.assertIsNone(v["computed_status"])
        self.assertIsNone(v["steps_count"])
        self.assertIsNone(v["total_duration_minutes"])
        self.assertIsNone(v["total_wait_minutes"])
        self.assertIsNone(v["wait_share"])
        self.assertIsNone(v["duplicate_step_names"])
        self.assertIsNone(v["unmatched_waste_step_names"])
        self.assertIsNone(v["waste_step_coverage"])
        self.assertIsNone(v["bottleneck_step_computed"])
        self.assertEqual(v["distinct_waste_categories"],
                         ["waiting", "defects", "excess_processing"])

    def test_absent_wastes_list_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["wastes"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(check_status(v, "wastes_declared"), "missing")
        self.assertIsNone(v["wastes_count"])
        self.assertIsNone(v["distinct_waste_categories"])
        self.assertIsNone(v["unmatched_waste_step_names"])
        self.assertIsNone(v["waste_step_coverage"])

    def test_anecdote_baseline_fails_section3(self):
        m = copy.deepcopy(COMPLETE)
        m["measure"]["baseline_from_data_not_anecdote"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "PROCESS_WASTE_REVIEW_NOT_READY")
        self.assertEqual(v["sections"]["measurement_and_metrics"], "fail")

    def test_leading_without_lagging_pair_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["metrics"]["lagging_indicators_declared"] = False
        self.assertEqual(
            check_status(evaluate(m), "lagging_indicators_declared"),
            "fail")

    def test_no_root_cause_fails_section4(self):
        m = copy.deepcopy(COMPLETE)
        m["analyze"]["root_cause_analysis_performed"] = False
        v = evaluate(m)
        self.assertEqual(v["sections"]["analysis_and_constraint"], "fail")

    def test_declared_bottleneck_not_longest_step_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["constraint"]["bottleneck_step_name"] = "build"
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "declared_bottleneck_matches_longest_step"),
            "fail")
        self.assertEqual(v["bottleneck_step_computed"], "review")
        self.assertEqual(v["computed_status"],
                         "outside_stated_limits_on_declared_evidence")

    def test_bottleneck_tie_resolves_to_first_longest_step(self):
        m = copy.deepcopy(COMPLETE)
        m["steps"][0]["duration_minutes"] = 45
        m["constraint"]["bottleneck_step_name"] = "build"
        v = evaluate(m)
        self.assertEqual(v["bottleneck_step_computed"], "build")
        self.assertEqual(
            check_status(v, "declared_bottleneck_matches_longest_step"),
            "pass")

    def test_missing_bottleneck_name_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["constraint"]["bottleneck_step_name"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "declared_bottleneck_matches_longest_step"),
            "missing")
        self.assertEqual(v["bottleneck_step_computed"], "review")

    def test_unsubordinated_effort_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["constraint"]["non_bottleneck_effort_subordinated"] = False
        self.assertEqual(
            check_status(evaluate(m), "non_bottleneck_effort_subordinated"),
            "fail")

    def test_scaling_without_pilot_fails_section5(self):
        m = copy.deepcopy(COMPLETE)
        m["improve"]["improvement_piloted_before_scaling"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "PROCESS_WASTE_REVIEW_NOT_READY")
        self.assertEqual(v["sections"]["improvement_and_control"], "fail")

    def test_unverified_against_baseline_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["improve"]["verified_against_baseline_before_scaling"] = False
        self.assertEqual(
            check_status(
                evaluate(m),
                "improvement_verified_against_baseline_before_scaling"),
            "fail")

    def test_regression_not_visible_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["control"]["regression_made_visible"] = False
        self.assertEqual(
            check_status(evaluate(m), "regression_made_visible"), "fail")

    def test_automating_broken_process_fails_red_lines(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"]["automating_broken_process_present"] = True
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "no_automating_broken_process"), "fail")
        self.assertEqual(v["sections"]["red_lines"], "fail")

    def test_vanity_metrics_red_line_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"]["vanity_metrics_present"] = True
        self.assertEqual(
            check_status(evaluate(m), "no_vanity_metrics"), "fail")

    def test_optimizing_non_constraint_red_line_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"]["optimizing_non_constraint_present"] = True
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "no_optimizing_non_constraint"), "fail")
        self.assertEqual(v["verdict"], "PROCESS_WASTE_REVIEW_NOT_READY")

    def test_tradition_without_data_red_line_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"]["tradition_without_data_present"] = True
        self.assertEqual(
            check_status(evaluate(m), "no_tradition_without_data"), "fail")

    def test_absent_evidence_is_insufficient_not_failed(self):
        m = copy.deepcopy(COMPLETE)
        del m["control"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["improvement_and_control"],
                         "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertTrue(
            all(c["status"] == "missing" for c in v["checks"]))
        self.assertIsNone(v["computed_status"])
        self.assertIsNone(v["steps_count"])
        self.assertIsNone(v["wastes_count"])
        self.assertIsNone(v["distinct_waste_categories"])
        self.assertIsNone(v["duplicate_step_names"])
        self.assertIsNone(v["bottleneck_step_computed"])

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertIn("VERDICT: PROCESS_WASTE_REVIEW_READY", stamp(v))

    def test_non_object_manifest_rejected(self):
        with self.assertRaises(TypeError):
            evaluate(["not", "a", "manifest"])


class MalformedTypeTests(unittest.TestCase):
    def test_string_field_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["process"] = 12345
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("process", str(ctx.exception))

    def test_object_section_as_string_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"define": "should-be-an-object"})
        self.assertIn("define", str(ctx.exception))

    def test_list_field_as_object_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"steps": {"name": "build"}})
        self.assertIn("steps", str(ctx.exception))

    def test_list_entry_as_string_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"steps": ["build"]})
        self.assertIn("steps[0]", str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["measure"]["baseline_from_data_not_anecdote"] = "yes"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("measure.baseline_from_data_not_anecdote",
                      str(ctx.exception))

    def test_number_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["steps"][0]["duration_minutes"] = "20"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("steps[0].duration_minutes", str(ctx.exception))

    def test_number_leaf_as_boolean_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["steps"][0]["wait_before_minutes"] = True
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("steps[0].wait_before_minutes", str(ctx.exception))

    def test_nested_list_entry_string_field_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["wastes"][0]["category"] = 42
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("wastes[0].category", str(ctx.exception))

    def test_bottleneck_name_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["constraint"]["bottleneck_step_name"] = 7
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("constraint.bottleneck_step_name",
                      str(ctx.exception))

    def test_null_section_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["improve"] = None
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("improve", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
