import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from testing_strategy_regression_pack import evaluate, stamp  # noqa: E402

COMPLETE = {
    "plan_title": "checkout-service-testing-strategy",
    "scoping": {"scope_declared": True,
                "risks_identified_before_planning": True,
                "p0_flows_identified": True,
                "test_plan_document_present": True,
                "test_plan_states_exclusions": True},
    "risk_rows": [
        {"risk_id": "risk-1", "description": "Payment journey breaks",
         "is_p0": True},
        {"risk_id": "risk-2", "description": "Cart totals miscalculated",
         "is_p0": False},
        {"risk_id": "risk-3", "description": "Session expiry mishandled",
         "is_p0": False},
    ],
    "level_planning": {"pyramid_applied": True,
                       "logic_tested_at_unit_level": True,
                       "boundaries_tested_at_integration_level": True,
                       "critical_journeys_tested_at_e2e_level": True,
                       "tricky_edge_cases_tested_at_unit_level": True},
    "test_level_rows": [
        {"level_row_id": "lr-1", "risk_id": "risk-1", "test_level": "unit"},
        {"level_row_id": "lr-2", "risk_id": "risk-1",
         "test_level": "integration"},
        {"level_row_id": "lr-3", "risk_id": "risk-1", "test_level": "e2e"},
        {"level_row_id": "lr-4", "risk_id": "risk-2", "test_level": "unit"},
        {"level_row_id": "lr-5", "risk_id": "risk-2",
         "test_level": "integration"},
        {"level_row_id": "lr-6", "risk_id": "risk-3", "test_level": "unit"},
    ],
    "regression_planning": {
        "regression_test_written_before_defect_fix": True,
        "regression_tests_kept_permanently": True,
        "every_fixed_bug_has_regression_test": True},
    "declared_changes": [
        {"change_id": "ch-1", "change_kind": "feature",
         "description": "Add saved payment method"},
        {"change_id": "ch-2", "change_kind": "defect_fix",
         "description": "Fix double-charge on retry"},
        {"change_id": "ch-3", "change_kind": "refactor",
         "description": "Extract pricing module"},
    ],
    "regression_rows": [
        {"regression_id": "reg-1", "change_id": "ch-1",
         "kept_permanently": True},
        {"regression_id": "reg-2", "change_id": "ch-2",
         "kept_permanently": True},
        {"regression_id": "reg-3", "change_id": "ch-3",
         "kept_permanently": True},
    ],
    "fixtures": {"no_shared_mutable_state": True,
                 "explicit_seed_data_used": True, "time_controlled": True,
                 "randomness_controlled": True,
                 "fixtures_declared_for_suites": True},
    "flake_policy": {"known_flakes_present": True,
                     "flakes_quarantined_immediately": True,
                     "flakes_fixed_within_a_week_or_deleted_consciously": True,
                     "no_quarantined_test_without_tracked_ticket": True,
                     "quarantine_ticket_recorded": True},
    "negative_testing": {"invalid_input_tested": True,
                         "timeouts_tested": True,
                         "partial_failures_tested": True,
                         "retries_tested": True,
                         "sane_failure_asserted": True},
    "entry_exit_and_reporting": {
        "entry_criteria_declared": True, "exit_criteria_declared": True,
        "full_suite_green_before_handoff": True,
        "report_states_what_ran": True, "report_states_what_passed": True,
        "report_states_what_not_covered": True,
        "coverage_gaps_stated_explicitly": True},
    "red_lines": {"tests_depend_on_production_systems_present": False,
                  "tests_depend_on_live_data_present": False,
                  "assertion_weakened_to_fix_test_present": False},
}


def check_status(v, name):
    return next(c["status"] for c in v["checks"] if c["check"] == name)


class VerdictTests(unittest.TestCase):
    def test_complete_manifest_is_sound(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(v["verdict"], "TESTING_STRATEGY_SOUND")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(len(v["checks"]), 58)
        self.assertEqual(v["computed_status"],
                         "within_stated_limits_on_declared_evidence")
        self.assertEqual(v["risk_rows_count"], 3)
        self.assertEqual(v["test_level_rows_count"], 6)
        self.assertEqual(v["declared_changes_count"], 3)
        self.assertEqual(v["regression_rows_count"], 3)
        self.assertEqual(v["unit_level_row_count"], 3)
        self.assertEqual(v["integration_level_row_count"], 2)
        self.assertEqual(v["e2e_level_row_count"], 1)
        self.assertEqual(v["duplicate_risk_ids"], [])
        self.assertEqual(v["risk_level_coverage_ratio"], "1.000000")
        self.assertEqual(v["p0_e2e_coverage_ratio"], "1.000000")
        self.assertEqual(v["change_regression_coverage_ratio"], "1.000000")
        self.assertEqual(v["defect_regression_coverage_ratio"], "1.000000")

    def test_scope_not_declared_fails_section1(self):
        m = copy.deepcopy(COMPLETE)
        m["scoping"]["scope_declared"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "TESTING_STRATEGY_NOT_SOUND")
        self.assertEqual(v["sections"]["scope_and_risk_declaration"], "fail")
        self.assertEqual(
            check_status(v, "testing_strategy_scope_declared"), "fail")

    def test_duplicate_risk_id_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["risk_rows"][1]["risk_id"] = "risk-1"
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_testing_strategy_risk_id_unique"), "fail")
        self.assertEqual(v["duplicate_risk_ids"], ["risk-1"])

    def test_empty_risk_description_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["risk_rows"][0]["description"] = ""
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v, "every_testing_strategy_risk_description_declared"),
            "fail")
        self.assertEqual(v["risks_without_description"], ["risk-1"])

    def test_risk_missing_p0_status_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["risk_rows"][0]["is_p0"]
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v, "every_testing_strategy_risk_p0_status_declared"),
            "missing")
        self.assertEqual(v["risks_without_p0_status"], ["risk-1"])

    def test_absent_risk_list_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["risk_rows"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "testing_strategy_risk_rows_list_declared"),
            "missing")
        self.assertIsNone(v["risk_rows_count"])
        self.assertIsNone(v["computed_status"])

    def test_empty_level_list_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["test_level_rows"] = []
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v, "testing_strategy_test_level_rows_list_declared"), "fail")
        self.assertEqual(v["test_level_rows_count"], 0)

    def test_level_row_unknown_risk_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["test_level_rows"][0]["risk_id"] = "risk-99"
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v,
                "every_testing_strategy_test_level_row_risk_reference_resolves"),
            "fail")
        self.assertEqual(
            v["test_level_rows_with_unknown_risk_reference"], ["lr-1"])

    def test_risk_without_level_row_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["test_level_rows"] = [
            r for r in m["test_level_rows"] if r["risk_id"] != "risk-3"]
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v,
                "every_testing_strategy_declared_risk_covered_by_level_row"),
            "fail")
        self.assertEqual(v["declared_risks_without_test_level_row"],
                         ["risk-3"])
        self.assertEqual(v["risk_level_coverage_ratio"], "0.666667")

    def test_p0_risk_without_e2e_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["test_level_rows"][2]["test_level"] = "unit"
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v, "every_testing_strategy_p0_risk_covered_by_e2e_row"),
            "fail")
        self.assertEqual(v["p0_risks_without_e2e_row"], ["risk-1"])
        self.assertEqual(v["p0_e2e_coverage_ratio"], "0.000000")

    def test_invalid_level_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["test_level_rows"][0]["test_level"] = "manual"
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v,
                "every_testing_strategy_test_level_row_level_recognised"),
            "fail")
        self.assertEqual(v["test_level_rows_with_invalid_level"], ["lr-1"])

    def test_pyramid_inverted_fails(self):
        m = copy.deepcopy(COMPLETE)
        # Make e2e the largest level: counts become unit 1, int 2, e2e 3.
        for row, lvl in zip(m["test_level_rows"],
                            ["e2e", "e2e", "e2e", "unit",
                             "integration", "integration"]):
            row["test_level"] = lvl
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v,
                "testing_strategy_pyramid_level_counts_in_declared_order"),
            "fail")

    def test_change_without_regression_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["regression_rows"] = [
            r for r in m["regression_rows"] if r["change_id"] != "ch-2"]
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v,
                "every_regression_pack_declared_change_covered_by_regression_row"),
            "fail")
        self.assertEqual(v["declared_changes_without_regression_row"],
                         ["ch-2"])
        self.assertEqual(
            v["defect_changes_without_regression_row"], ["ch-2"])
        self.assertEqual(v["defect_regression_coverage_ratio"], "0.000000")
        self.assertEqual(v["change_regression_coverage_ratio"], "0.666667")

    def test_regression_row_unknown_change_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["regression_rows"][0]["change_id"] = "ch-99"
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v,
                "every_regression_pack_regression_row_change_reference_resolves"),
            "fail")
        self.assertEqual(
            v["regression_rows_with_unknown_change_reference"], ["reg-1"])

    def test_regression_row_not_permanent_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["regression_rows"][1]["kept_permanently"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v,
                "every_regression_pack_regression_row_kept_permanently"),
            "fail")
        self.assertEqual(v["regression_rows_not_declared_permanent"],
                         ["reg-2"])

    def test_change_invalid_kind_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["declared_changes"][0]["change_kind"] = "spike"
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v, "every_regression_pack_change_kind_recognised"), "fail")
        self.assertEqual(v["declared_changes_with_invalid_kind"], ["ch-1"])

    def test_duplicate_change_id_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["declared_changes"][1]["change_id"] = "ch-1"
        v = evaluate(m)
        self.assertEqual(v["duplicate_change_ids"], ["ch-1"])

    def test_fixtures_shared_state_fails_section4(self):
        m = copy.deepcopy(COMPLETE)
        m["fixtures"]["no_shared_mutable_state"] = False
        v = evaluate(m)
        self.assertEqual(v["sections"]["fixtures_and_determinism"], "fail")

    def test_flake_not_quarantined_fails_section5(self):
        m = copy.deepcopy(COMPLETE)
        m["flake_policy"]["flakes_quarantined_immediately"] = False
        v = evaluate(m)
        self.assertEqual(v["sections"]["flake_policy"], "fail")

    def test_flakes_present_without_ticket_fails_gated(self):
        m = copy.deepcopy(COMPLETE)
        m["flake_policy"]["quarantine_ticket_recorded"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v,
                "testing_strategy_quarantine_ticket_recorded_where_flakes_present"),
            "fail")

    def test_no_flakes_passes_gated_as_na(self):
        m = copy.deepcopy(COMPLETE)
        m["flake_policy"]["known_flakes_present"] = False
        m["flake_policy"]["quarantine_ticket_recorded"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v,
                "testing_strategy_quarantine_ticket_recorded_where_flakes_present"),
            "pass")
        self.assertEqual(v["verdict"], "TESTING_STRATEGY_SOUND")

    def test_negative_retries_not_tested_fails_section6(self):
        m = copy.deepcopy(COMPLETE)
        m["negative_testing"]["retries_tested"] = False
        v = evaluate(m)
        self.assertEqual(v["sections"]["negative_testing"], "fail")

    def test_suite_not_green_fails_section7(self):
        m = copy.deepcopy(COMPLETE)
        m["entry_exit_and_reporting"]["full_suite_green_before_handoff"] = False
        v = evaluate(m)
        self.assertEqual(
            v["sections"]["entry_exit_and_reporting"], "fail")

    def test_production_dependency_fails_red_lines(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"]["tests_depend_on_production_systems_present"] = True
        v = evaluate(m)
        self.assertEqual(v["sections"]["red_lines"], "fail")
        self.assertEqual(v["verdict"], "TESTING_STRATEGY_NOT_SOUND")

    def test_weakened_assertion_fails_red_lines(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"]["assertion_weakened_to_fix_test_present"] = True
        self.assertEqual(
            check_status(
                evaluate(m),
                "testing_strategy_free_of_assertion_weakened_to_fix_test"),
            "fail")

    def test_absent_evidence_is_insufficient_not_failed(self):
        m = copy.deepcopy(COMPLETE)
        del m["negative_testing"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["negative_testing"],
                         "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertTrue(all(c["status"] == "missing" for c in v["checks"]))
        self.assertIsNone(v["computed_status"])
        self.assertIsNone(v["risk_rows_count"])
        self.assertIsNone(v["risk_level_coverage_ratio"])

    def test_no_p0_risks_p0_ratio_is_null_and_check_passes(self):
        m = copy.deepcopy(COMPLETE)
        for r in m["risk_rows"]:
            r["is_p0"] = False
        v = evaluate(m)
        self.assertIsNone(v["p0_e2e_coverage_ratio"])
        self.assertEqual(
            check_status(
                v, "every_testing_strategy_p0_risk_covered_by_e2e_row"),
            "pass")

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertIn("VERDICT: TESTING_STRATEGY_SOUND", stamp(v))

    def test_non_object_manifest_rejected(self):
        with self.assertRaises(TypeError):
            evaluate(["not", "a", "manifest"])


class MalformedTypeTests(unittest.TestCase):
    def test_string_field_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["plan_title"] = 12345
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("plan_title", str(ctx.exception))

    def test_object_section_as_string_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"scoping": "should-be-an-object"})
        self.assertIn("scoping", str(ctx.exception))

    def test_list_field_as_object_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"risk_rows": {"risk_id": "risk-1"}})
        self.assertIn("risk_rows", str(ctx.exception))

    def test_list_entry_as_string_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"declared_changes": ["ch-1"]})
        self.assertIn("declared_changes[0]", str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["fixtures"]["time_controlled"] = "yes"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("fixtures.time_controlled", str(ctx.exception))

    def test_nested_list_entry_bool_field_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["risk_rows"][0]["is_p0"] = "true"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("risk_rows[0].is_p0", str(ctx.exception))

    def test_null_section_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["flake_policy"] = None
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("flake_policy", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
