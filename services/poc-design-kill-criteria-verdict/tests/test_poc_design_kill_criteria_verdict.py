import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from poc_design_kill_criteria_verdict import evaluate, stamp  # noqa: E402

COMPLETE = {
    "poc": "offline-sync-spike",
    "design": {"uncertainty_to_reduce_named": True,
               "answer_changes_plan_declared": True,
               "uncertainty_reduction_purpose_declared": True,
               "design_record_completed_before_run": True,
               "evaluates_vendor_or_tool": False},
    "criteria": [
        {"name": "sync-latency-bar", "kind": "success",
         "condition_stated": True, "declared_before_run": True,
         "assesses_house_stack_fit": False},
        {"name": "data-loss-limit", "kind": "success",
         "condition_stated": True, "declared_before_run": True,
         "assesses_house_stack_fit": False},
        {"name": "sync-engine-dead-end", "kind": "kill",
         "condition_stated": True, "declared_before_run": True,
         "assesses_house_stack_fit": False},
        {"name": "battery-drain-limit", "kind": "kill",
         "condition_stated": True, "declared_before_run": True,
         "assesses_house_stack_fit": False},
    ],
    "timebox": {"window_set_before_run": True,
                "start_date": "2027-01-05", "end_date": "2027-01-16"},
    "scope_items": [
        {"name": "sync-engine-prototype", "on_critical_path": True},
        {"name": "conflict-resolution-probe", "on_critical_path": True},
        {"name": "single-device-harness", "on_critical_path": True},
    ],
    "red_lines": {
        "poc_code_planned_for_direct_production_use_present": False,
        "open_ended_design_present": False,
        "poc_success_planned_as_production_readiness_present": False},
}

VENDOR_COMPLETE = copy.deepcopy(COMPLETE)
VENDOR_COMPLETE["design"]["evaluates_vendor_or_tool"] = True
VENDOR_COMPLETE["criteria"][0]["assesses_house_stack_fit"] = True


def check_status(v, name):
    return next(c["status"] for c in v["checks"] if c["check"] == name)


class VerdictTests(unittest.TestCase):
    def test_complete_manifest_is_sound(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(v["verdict"], "POC_DESIGN_SOUND")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(len(v["checks"]), 22)
        self.assertEqual(v["computed_status"],
                         "within_stated_limits_on_declared_evidence")
        self.assertEqual(v["criteria_count"], 4)
        self.assertEqual(v["success_criteria_count"], 2)
        self.assertEqual(v["kill_criteria_count"], 2)
        self.assertEqual(v["criteria_without_condition"], [])
        self.assertEqual(v["condition_stated_coverage"], "1.000000")
        self.assertEqual(v["criteria_not_declared_before_run"], [])
        self.assertEqual(v["declared_before_run_coverage"], "1.000000")
        self.assertEqual(v["criteria_with_invalid_kind"], [])
        self.assertEqual(v["duplicate_criterion_names"], [])
        self.assertEqual(v["timebox_start_date"], "2027-01-05")
        self.assertEqual(v["timebox_end_date"], "2027-01-16")
        self.assertEqual(v["timebox_duration_days"], 11)
        self.assertEqual(v["scope_items_count"], 3)
        self.assertEqual(v["scope_items_off_critical_path"], [])
        self.assertEqual(v["critical_path_coverage"], "1.000000")
        self.assertEqual(v["duplicate_scope_item_names"], [])

    def test_vendor_project_complete_is_sound(self):
        v = evaluate(copy.deepcopy(VENDOR_COMPLETE))
        self.assertEqual(v["verdict"], "POC_DESIGN_SOUND")
        self.assertEqual(
            check_status(
                v, "house_stack_fit_criterion_when_evaluating_vendor"),
            "pass")

    def test_uncertainty_not_named_fails_section1(self):
        m = copy.deepcopy(COMPLETE)
        m["design"]["uncertainty_to_reduce_named"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "POC_DESIGN_NOT_SOUND")
        self.assertEqual(v["sections"]["design_premise"], "fail")
        self.assertEqual(
            check_status(v, "uncertainty_to_reduce_named"), "fail")

    def test_answer_not_changing_plan_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["design"]["answer_changes_plan_declared"] = False
        self.assertEqual(evaluate(m)["verdict"], "POC_DESIGN_NOT_SOUND")

    def test_design_record_after_run_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["design"]["design_record_completed_before_run"] = False
        self.assertEqual(
            check_status(evaluate(m), "design_record_completed_before_run"),
            "fail")

    def test_no_kill_criterion_row_fails(self):
        m = copy.deepcopy(COMPLETE)
        for row in m["criteria"]:
            row["kind"] = "success"
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "at_least_one_kill_criterion_declared"),
            "fail")
        self.assertEqual(v["kill_criteria_count"], 0)
        self.assertEqual(
            v["sections"]["criteria_row_consistency"], "fail")

    def test_no_success_criterion_row_fails(self):
        m = copy.deepcopy(COMPLETE)
        for row in m["criteria"]:
            row["kind"] = "kill"
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "at_least_one_success_criterion_declared"),
            "fail")
        self.assertEqual(v["success_criteria_count"], 0)

    def test_invalid_criterion_kind_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["criteria"][1]["kind"] = "aspirational"
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_criterion_kind_is_success_or_kill"),
            "fail")
        self.assertEqual(v["criteria_with_invalid_kind"],
                         ["data-loss-limit"])

    def test_criterion_missing_kind_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["criteria"][0]["kind"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "every_criterion_kind_is_success_or_kill"),
            "missing")
        self.assertEqual(v["criteria_with_invalid_kind"], [])

    def test_criterion_without_condition_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["criteria"][0]["condition_stated"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "POC_DESIGN_NOT_SOUND")
        self.assertEqual(
            check_status(v, "every_criterion_condition_stated"), "fail")
        self.assertEqual(v["criteria_without_condition"],
                         ["sync-latency-bar"])
        self.assertEqual(v["condition_stated_coverage"], "0.750000")
        self.assertEqual(v["computed_status"],
                         "outside_stated_limits_on_declared_evidence")

    def test_criterion_missing_condition_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["criteria"][2]["condition_stated"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "every_criterion_condition_stated"),
            "missing")
        self.assertEqual(v["criteria_without_condition"], [])

    def test_criterion_not_before_run_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["criteria"][3]["declared_before_run"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_criterion_declared_before_run"),
            "fail")
        self.assertEqual(v["criteria_not_declared_before_run"],
                         ["battery-drain-limit"])
        self.assertEqual(v["declared_before_run_coverage"], "0.750000")

    def test_duplicate_criterion_name_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["criteria"][3]["name"] = "sync-latency-bar"
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "no_criterion_name_duplicated"), "fail")
        self.assertEqual(v["duplicate_criterion_names"],
                         ["sync-latency-bar"])

    def test_criterion_missing_name_is_missing_for_duplicate_check(self):
        m = copy.deepcopy(COMPLETE)
        del m["criteria"][3]["name"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "no_criterion_name_duplicated"), "missing")
        self.assertEqual(v["duplicate_criterion_names"], [])

    def test_empty_criteria_list_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["criteria"] = []
        v = evaluate(m)
        self.assertEqual(check_status(v, "criteria_declared"), "fail")
        self.assertEqual(v["criteria_count"], 0)
        self.assertEqual(v["success_criteria_count"], 0)
        self.assertEqual(v["kill_criteria_count"], 0)
        self.assertIsNone(v["condition_stated_coverage"])
        self.assertIsNone(v["declared_before_run_coverage"])
        self.assertEqual(v["duplicate_criterion_names"], [])

    def test_vendor_gate_absent_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["design"]["evaluates_vendor_or_tool"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "vendor_evaluation_applicability_declared"),
            "missing")
        self.assertEqual(
            check_status(
                v, "house_stack_fit_criterion_when_evaluating_vendor"),
            "missing")

    def test_vendor_project_without_house_stack_fit_row_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["design"]["evaluates_vendor_or_tool"] = True
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v, "house_stack_fit_criterion_when_evaluating_vendor"),
            "fail")
        self.assertEqual(v["verdict"], "POC_DESIGN_NOT_SOUND")

    def test_non_vendor_project_fit_fields_false_still_pass(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(
            check_status(
                v, "house_stack_fit_criterion_when_evaluating_vendor"),
            "pass")

    def test_timebox_not_set_before_run_fails_section3(self):
        m = copy.deepcopy(COMPLETE)
        m["timebox"]["window_set_before_run"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "POC_DESIGN_NOT_SOUND")
        self.assertEqual(v["sections"]["timebox_window"], "fail")

    def test_timebox_impossible_date_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["timebox"]["end_date"] = "2027-02-30"
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "timebox_window_dates_valid"), "fail")
        self.assertEqual(check_status(v, "timebox_end_after_start"),
                         "fail")
        self.assertIsNone(v["timebox_duration_days"])

    def test_timebox_malformed_date_string_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["timebox"]["start_date"] = "Jan 5 2027"
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "timebox_window_dates_valid"), "fail")

    def test_timebox_end_before_start_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["timebox"]["end_date"] = "2027-01-02"
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "timebox_window_dates_valid"), "pass")
        self.assertEqual(check_status(v, "timebox_end_after_start"),
                         "fail")
        self.assertEqual(v["timebox_duration_days"], -3)

    def test_timebox_end_equal_start_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["timebox"]["end_date"] = "2027-01-05"
        v = evaluate(m)
        self.assertEqual(check_status(v, "timebox_end_after_start"),
                         "fail")
        self.assertEqual(v["timebox_duration_days"], 0)

    def test_timebox_missing_date_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["timebox"]["end_date"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "timebox_window_dates_valid"), "missing")
        self.assertIsNone(v["timebox_duration_days"])
        self.assertIsNone(v["timebox_end_date"])

    def test_scope_item_off_critical_path_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["scope_items"][1]["on_critical_path"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "POC_DESIGN_NOT_SOUND")
        self.assertEqual(
            check_status(v, "every_scope_item_on_critical_path"),
            "fail")
        self.assertEqual(v["scope_items_off_critical_path"],
                         ["conflict-resolution-probe"])
        self.assertEqual(v["critical_path_coverage"], "0.666667")
        self.assertEqual(
            v["sections"]["scope_row_consistency"], "fail")

    def test_scope_item_missing_path_field_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["scope_items"][0]["on_critical_path"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "every_scope_item_on_critical_path"),
            "missing")
        self.assertEqual(v["scope_items_off_critical_path"], [])

    def test_duplicate_scope_item_name_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["scope_items"][2]["name"] = "sync-engine-prototype"
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "no_scope_item_name_duplicated"), "fail")
        self.assertEqual(v["duplicate_scope_item_names"],
                         ["sync-engine-prototype"])

    def test_empty_scope_list_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["scope_items"] = []
        v = evaluate(m)
        self.assertEqual(check_status(v, "scope_items_declared"), "fail")
        self.assertEqual(v["scope_items_count"], 0)
        self.assertIsNone(v["critical_path_coverage"])
        self.assertEqual(v["duplicate_scope_item_names"], [])

    def test_direct_production_use_plan_fails_red_lines(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"][
            "poc_code_planned_for_direct_production_use_present"] = True
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v, "no_poc_code_planned_for_direct_production_use"),
            "fail")
        self.assertEqual(
            v["sections"]["production_boundary_by_design"], "fail")

    def test_open_ended_and_readiness_red_lines_fail(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"]["open_ended_design_present"] = True
        m["red_lines"][
            "poc_success_planned_as_production_readiness_present"] = True
        v = evaluate(m)
        self.assertEqual(check_status(v, "no_open_ended_design"), "fail")
        self.assertEqual(
            check_status(
                v, "no_poc_success_planned_as_production_readiness"),
            "fail")
        self.assertEqual(v["verdict"], "POC_DESIGN_NOT_SOUND")

    def test_absent_evidence_is_insufficient_not_failed(self):
        m = copy.deepcopy(COMPLETE)
        del m["timebox"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["timebox_window"],
                         "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertTrue(
            all(c["status"] == "missing" for c in v["checks"]))
        self.assertIsNone(v["computed_status"])
        self.assertIsNone(v["criteria_count"])
        self.assertIsNone(v["success_criteria_count"])
        self.assertIsNone(v["kill_criteria_count"])
        self.assertIsNone(v["criteria_without_condition"])
        self.assertIsNone(v["condition_stated_coverage"])
        self.assertIsNone(v["criteria_not_declared_before_run"])
        self.assertIsNone(v["declared_before_run_coverage"])
        self.assertIsNone(v["criteria_with_invalid_kind"])
        self.assertIsNone(v["duplicate_criterion_names"])
        self.assertIsNone(v["timebox_start_date"])
        self.assertIsNone(v["timebox_end_date"])
        self.assertIsNone(v["timebox_duration_days"])
        self.assertIsNone(v["scope_items_count"])
        self.assertIsNone(v["scope_items_off_critical_path"])
        self.assertIsNone(v["critical_path_coverage"])
        self.assertIsNone(v["duplicate_scope_item_names"])

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertIn("VERDICT: POC_DESIGN_SOUND", stamp(v))

    def test_non_object_manifest_rejected(self):
        with self.assertRaises(TypeError):
            evaluate(["not", "a", "manifest"])


class MalformedTypeTests(unittest.TestCase):
    def test_string_field_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["poc"] = 12345
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("poc", str(ctx.exception))

    def test_object_section_as_string_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"design": "should-be-an-object"})
        self.assertIn("design", str(ctx.exception))

    def test_list_field_as_object_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"criteria": {"name": "sync-latency-bar"}})
        self.assertIn("criteria", str(ctx.exception))

    def test_list_entry_as_string_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"criteria": ["sync-latency-bar"]})
        self.assertIn("criteria[0]", str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["design"]["uncertainty_to_reduce_named"] = "yes"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("design.uncertainty_to_reduce_named",
                      str(ctx.exception))

    def test_nested_list_entry_string_field_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["criteria"][0]["name"] = 42
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("criteria[0].name", str(ctx.exception))

    def test_nested_list_entry_boolean_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["criteria"][1]["condition_stated"] = "true"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("criteria[1].condition_stated", str(ctx.exception))

    def test_date_field_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["timebox"]["start_date"] = 20270105
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("timebox.start_date", str(ctx.exception))

    def test_null_section_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"] = None
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("red_lines", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
