import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from uat_scenario_sign_off_pack import evaluate, stamp  # noqa: E402

COMPLETE = {
    "uat_round_title": "checkout-release-uat-round-3",
    "scope": {"criteria_source_recorded": True,
              "scope_defined_before_execution": True,
              "no_silent_scope_edits_during_uat": True},
    "acceptance_criteria": [
        {"criterion_id": "crit-1", "description": "Buyer can check out end to end"},
        {"criterion_id": "crit-2", "description": "Buyer receives an order confirmation"},
    ],
    "scenarios": [
        {"scenario_id": "scen-1", "criterion_ids": ["crit-1"],
         "steps_recorded": True, "expected_outcome": "Checkout completes",
         "timeboxed": True, "result": "passed"},
        {"scenario_id": "scen-2", "criterion_ids": ["crit-1", "crit-2"],
         "steps_recorded": True, "expected_outcome": "Confirmation is received",
         "timeboxed": True, "result": "passed"},
    ],
    "environment": {"staging_mirrors_production": True,
                    "test_data_realistic": True,
                    "production_data_used": True,
                    "test_data_anonymized": True},
    "people": {"business_owner_owns_uat": True,
               "business_owner_executes_uat": True,
               "supporting_team_assigned": True, "scribe_assigned": True},
    "execution": {"execution_window_completed": True,
                  "deviations_logged_as_defects": True},
    "defects": [
        {"defect_id": "def-1", "scenario_id": "scen-2", "severity": "minor",
         "disposition": "accept_with_note",
         "disposition_note": "Accepted: confirmation wording noted",
         "defer_until": "", "resolved": True},
        {"defect_id": "def-2", "scenario_id": "scen-1", "severity": "blocker",
         "disposition": "fix_now", "disposition_note": "",
         "defer_until": "", "resolved": True},
    ],
    "triage": {"triage_held_daily": True},
    "required_sign_off_roles": ["business_owner", "product_owner"],
    "sign_offs": [
        {"role": "business_owner", "signer_name": "A. Buyer", "signed": True},
        {"role": "product_owner", "signer_name": "P. Owner", "signed": True},
    ],
    "sign_off": {"outcome": "pass", "conditional_open_items_listed": False,
                 "conditional_owner_named": False},
    "retest": {"uat_fixes_made": True, "changed_scenarios_retested": True,
               "touched_flows_regression_completed": True,
               "retest_results_recorded": True},
    "declared_totals": {"acceptance_criteria_count": 2, "scenarios_count": 2,
                        "executed_scenarios_count": 2, "defects_count": 2,
                        "sign_off_roles_count": 2},
    "red_lines": {"production_data_used_without_anonymization_present": False,
                  "passed_while_blocker_defects_open_present": False},
}


def check_status(v, name):
    return next(c["status"] for c in v["checks"] if c["check"] == name)


class VerdictTests(unittest.TestCase):
    def test_complete_manifest_is_sound(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(v["verdict"], "UAT_SIGN_OFF_SOUND")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(len(v["checks"]), 56)
        self.assertEqual(v["computed_status"],
                         "within_stated_limits_on_declared_evidence")
        self.assertEqual(v["uat_acceptance_criteria_count"], 2)
        self.assertEqual(v["uat_scenarios_count"], 2)
        self.assertEqual(v["uat_executed_scenarios_count"], 2)
        self.assertEqual(v["uat_defects_count"], 2)
        self.assertEqual(v["uat_required_sign_off_roles_count"], 2)
        self.assertEqual(v["uat_criterion_coverage_ratio"], "1.000000")
        self.assertEqual(v["uat_scenario_execution_ratio"], "1.000000")
        self.assertEqual(v["uat_scenario_pass_ratio"], "1.000000")
        self.assertEqual(v["uat_defect_disposition_ratio"], "1.000000")
        self.assertEqual(v["uat_sign_off_completion_ratio"], "1.000000")
        self.assertEqual(v["uat_open_blocker_defect_ids"], [])

    def test_uncovered_criterion_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["scenarios"][1]["criterion_ids"] = ["crit-1"]
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_uat_acceptance_criterion_covered_by_scenario"),
            "fail")
        self.assertEqual(v["uat_criteria_not_covered_by_any_scenario"], ["crit-2"])
        self.assertEqual(v["uat_criterion_coverage_ratio"], "0.500000")

    def test_duplicate_scenario_id_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["scenarios"][1]["scenario_id"] = "scen-1"
        v = evaluate(m)
        self.assertEqual(check_status(v, "every_uat_scenario_id_unique"), "fail")
        self.assertEqual(v["duplicate_uat_scenario_ids"], ["scen-1"])

    def test_scenario_unknown_criterion_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["scenarios"][0]["criterion_ids"] = ["crit-99"]
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v, "every_uat_scenario_criterion_reference_declared_criterion"),
            "fail")
        self.assertEqual(
            v["uat_scenarios_with_unknown_criterion_reference"], ["scen-1"])

    def test_absent_criteria_list_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["acceptance_criteria"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "uat_acceptance_criteria_list_declared"), "missing")
        self.assertIsNone(v["uat_acceptance_criteria_count"])
        self.assertIsNone(v["computed_status"])

    def test_empty_criteria_list_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["acceptance_criteria"] = []
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "uat_acceptance_criteria_list_declared"), "fail")

    def test_declared_count_mismatch_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["declared_totals"]["scenarios_count"] = 5
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "uat_declared_scenarios_count_matches_rows"), "fail")

    def test_production_data_without_anonymization_fails_gated(self):
        m = copy.deepcopy(COMPLETE)
        m["environment"]["test_data_anonymized"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v, "uat_production_data_anonymized_where_production_data_used"),
            "fail")

    def test_no_production_data_passes_gated_as_na(self):
        m = copy.deepcopy(COMPLETE)
        m["environment"]["production_data_used"] = False
        m["environment"]["test_data_anonymized"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v, "uat_production_data_anonymized_where_production_data_used"),
            "pass")
        self.assertEqual(v["verdict"], "UAT_SIGN_OFF_SOUND")

    def test_scenario_not_run_fails_execution(self):
        m = copy.deepcopy(COMPLETE)
        m["scenarios"][1]["result"] = "not_run"
        m["declared_totals"]["executed_scenarios_count"] = 1
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_uat_scenario_result_recorded_as_executed"),
            "fail")
        self.assertEqual(v["uat_scenarios_not_executed"], ["scen-2"])
        self.assertEqual(v["uat_scenario_execution_ratio"], "0.500000")

    def test_scenario_invalid_result_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["scenarios"][0]["result"] = "mostly_ok"
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_uat_scenario_result_recognised"), "fail")
        self.assertEqual(v["uat_scenarios_with_invalid_result"], ["scen-1"])

    def test_failed_scenario_without_defect_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["scenarios"][0]["result"] = "failed"
        m["defects"] = [d for d in m["defects"] if d["scenario_id"] != "scen-1"]
        m["declared_totals"]["defects_count"] = 1
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v, "every_uat_failed_or_blocked_scenario_has_defect_record"),
            "fail")
        self.assertEqual(
            v["uat_failed_or_blocked_scenarios_without_defect"], ["scen-1"])

    def test_empty_defects_list_passes_when_no_failures(self):
        m = copy.deepcopy(COMPLETE)
        m["defects"] = []
        m["declared_totals"]["defects_count"] = 0
        v = evaluate(m)
        self.assertEqual(check_status(v, "uat_defects_list_declared"), "pass")
        self.assertEqual(v["verdict"], "UAT_SIGN_OFF_SOUND")
        self.assertIsNone(v["uat_defect_disposition_ratio"])

    def test_defect_invalid_disposition_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["defects"][0]["disposition"] = "ignore"
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_uat_defect_disposition_recognised"), "fail")
        self.assertEqual(v["uat_defects_with_invalid_disposition"], ["def-1"])

    def test_accepted_defect_without_note_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["defects"][0]["disposition_note"] = ""
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v, "every_uat_accepted_defect_disposition_note_declared"),
            "fail")
        self.assertEqual(v["uat_accepted_defects_without_note"], ["def-1"])

    def test_deferred_defect_without_date_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["defects"][0]["disposition"] = "defer_with_date"
        m["defects"][0]["defer_until"] = ""
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v, "every_uat_deferred_defect_disposition_date_declared"),
            "fail")
        self.assertEqual(v["uat_deferred_defects_without_date"], ["def-1"])

    def test_defect_unknown_scenario_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["defects"][0]["scenario_id"] = "scen-99"
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v, "every_uat_defect_scenario_reference_declared_scenario"),
            "fail")

    def test_unsigned_required_role_fails_sign_off(self):
        m = copy.deepcopy(COMPLETE)
        m["sign_offs"][1]["signed"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_uat_required_role_signed_off"), "fail")
        self.assertEqual(
            v["uat_required_roles_without_signed_sign_off"], ["product_owner"])
        self.assertEqual(v["uat_sign_off_completion_ratio"], "0.500000")

    def test_sign_off_unknown_role_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["sign_offs"][0]["role"] = "observer"
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_uat_sign_off_role_declared_required"), "fail")
        self.assertEqual(v["uat_sign_offs_with_unknown_role"], ["observer"])

    def test_invalid_sign_off_outcome_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["sign_off"]["outcome"] = "verbal_ok"
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "uat_sign_off_outcome_recognised"), "fail")

    def test_conditional_pass_without_open_items_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["sign_off"]["outcome"] = "conditional_pass"
        m["sign_off"]["conditional_open_items_listed"] = False
        m["sign_off"]["conditional_owner_named"] = True
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v,
                "uat_conditional_sign_off_open_items_listed_where_conditional"),
            "fail")

    def test_conditional_pass_complete_is_sound(self):
        m = copy.deepcopy(COMPLETE)
        m["sign_off"]["outcome"] = "conditional_pass"
        m["sign_off"]["conditional_open_items_listed"] = True
        m["sign_off"]["conditional_owner_named"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "UAT_SIGN_OFF_SOUND")

    def test_pass_while_blocker_open_fails_computed(self):
        m = copy.deepcopy(COMPLETE)
        m["defects"][1]["resolved"] = False
        m["defects"][1]["disposition"] = "accept_with_note"
        m["defects"][1]["disposition_note"] = "Noted"
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "uat_sign_off_not_pass_while_blocker_defect_open"),
            "fail")
        self.assertEqual(v["uat_open_blocker_defect_ids"], ["def-2"])

    def test_fix_now_unresolved_fails_retest_section(self):
        m = copy.deepcopy(COMPLETE)
        m["defects"][1]["resolved"] = False
        m["sign_off"]["outcome"] = "conditional_pass"
        m["sign_off"]["conditional_open_items_listed"] = True
        m["sign_off"]["conditional_owner_named"] = True
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_uat_fix_now_defect_marked_resolved"), "fail")
        self.assertEqual(v["uat_fix_now_defects_unresolved"], ["def-2"])

    def test_no_fixes_passes_retest_gates_as_na(self):
        m = copy.deepcopy(COMPLETE)
        m["retest"]["uat_fixes_made"] = False
        m["retest"]["changed_scenarios_retested"] = False
        m["retest"]["touched_flows_regression_completed"] = False
        m["retest"]["retest_results_recorded"] = False
        m["defects"] = []
        m["declared_totals"]["defects_count"] = 0
        v = evaluate(m)
        self.assertEqual(
            v["sections"]["retest_and_regression_after_fixes"], "pass")

    def test_fixes_without_regression_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["retest"]["touched_flows_regression_completed"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v, "uat_touched_flows_regression_completed_where_fixes_made"),
            "fail")

    def test_red_line_production_data_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"]["production_data_used_without_anonymization_present"] = True
        v = evaluate(m)
        self.assertEqual(v["sections"]["red_lines"], "fail")
        self.assertEqual(v["verdict"], "UAT_SIGN_OFF_NOT_SOUND")

    def test_red_line_passed_with_blockers_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"]["passed_while_blocker_defects_open_present"] = True
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "uat_free_of_passed_while_blockers_open"), "fail")

    def test_absent_evidence_is_insufficient_not_failed(self):
        m = copy.deepcopy(COMPLETE)
        del m["sign_offs"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["sign_off_record"],
                         "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertTrue(all(c["status"] == "missing" for c in v["checks"]))
        self.assertIsNone(v["computed_status"])
        self.assertIsNone(v["uat_scenarios_count"])
        self.assertIsNone(v["uat_criterion_coverage_ratio"])

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertIn("VERDICT: UAT_SIGN_OFF_SOUND", stamp(v))

    def test_non_object_manifest_rejected(self):
        with self.assertRaises(TypeError):
            evaluate(["not", "a", "manifest"])


class MalformedTypeTests(unittest.TestCase):
    def test_string_field_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["uat_round_title"] = 12345
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("uat_round_title", str(ctx.exception))

    def test_object_section_as_string_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"scope": "should-be-an-object"})
        self.assertIn("scope", str(ctx.exception))

    def test_list_field_as_object_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"scenarios": {"scenario_id": "scen-1"}})
        self.assertIn("scenarios", str(ctx.exception))

    def test_list_entry_as_string_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"defects": ["def-1"]})
        self.assertIn("defects[0]", str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["people"]["scribe_assigned"] = "yes"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("people.scribe_assigned", str(ctx.exception))

    def test_string_list_entry_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["scenarios"][0]["criterion_ids"] = [42]
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("scenarios[0].criterion_ids[0]", str(ctx.exception))

    def test_number_field_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["declared_totals"]["defects_count"] = "2"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("declared_totals.defects_count", str(ctx.exception))

    def test_number_field_as_bool_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["declared_totals"]["defects_count"] = True
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("declared_totals.defects_count", str(ctx.exception))

    def test_null_section_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["sign_off"] = None
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("sign_off", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
