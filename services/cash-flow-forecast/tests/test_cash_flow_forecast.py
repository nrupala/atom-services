import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from cash_flow_forecast import evaluate, stamp  # noqa: E402


def _weeks(count=13, net=5000, opening=100000):
    weeks = []
    balance = opening
    for i in range(count):
        balance += net
        weeks.append({"label": f"week_{i + 1}", "inflows": 20000,
                      "outflows": 20000 - net,
                      "closing_balance": balance})
    return weeks


COMPLETE = {
    "entity": "Acme Operations",
    "flows": {"recurring_inflows_mapped": True,
              "recurring_outflows_mapped": True,
              "seasonal_patterns_mapped": True,
              "one_offs_mapped": True,
              "lag_assumptions_documented": True},
    "forecast": {"opening_balance": 100000,
                 "weeks": _weeks(),
                 "rolling_maintained_weekly": True,
                 "monthly_annual_planning_present": True},
    "reserves": {"target_set": True,
                 "monthly_fixed_costs": 20000,
                 "target_months": 3,
                 "declared_target_amount": 60000,
                 "held_separately": True,
                 "breach_requires_explicit_decision": True,
                 "put_at_risk": False},
    "working_capital": {"ar_aging_reviewed_on_cadence": True,
                        "chase_ladder_applied": True,
                        "ap_calendar_maintained": True,
                        "inventory_only_where_it_pays": True},
    "levers": {"inflow_acceleration_applied": True,
               "outflows_phased": True,
               "vendors_used_as_silent_financing": False},
    "runway": {"cash_on_hand": 150000,
               "burn": 10000,
               "declared_runway_months": 15,
               "alert_thresholds_at_6_and_3_months_set": True},
    "stress": {"cases_run": ["revenue_minus_20_percent",
                             "collections_plus_30_days_late",
                             "surprise_capex"],
               "answers_recorded": True,
               "responses_predecided": True},
    "reporting": {"weekly_position_and_forecast_reported": True,
                  "monthly_summary_drivers_annotated": True},
    "commitments": {"committed_against_unlanded_receivables": False},
}


def check_status(v, name):
    return next(c["status"] for c in v["checks"] if c["check"] == name)


class VerdictTests(unittest.TestCase):
    def test_complete_manifest_is_ready(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(v["verdict"], "CASH_FLOW_FORECAST_READY")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(v["computed_status"],
                         "within_stated_limits_on_declared_evidence")
        self.assertEqual(len(v["checks"]), 30)
        self.assertEqual(v["weeks_evaluated"], 13)
        self.assertEqual(v["computed_final_balance"], "165000.000000")
        self.assertEqual(v["final_balance_difference"], "0.000000")
        self.assertEqual(v["computed_reserve_target"], "60000.000000")
        self.assertEqual(v["reserve_target_difference"], "0.000000")
        self.assertEqual(v["computed_runway_months"], "15.000000")
        self.assertEqual(v["runway_difference"], "0.000000")
        self.assertEqual(v["stress_cases_not_run"], [])

    def test_balances_match_at_other_values_passes(self):
        m = copy.deepcopy(COMPLETE)
        m["forecast"]["weeks"] = _weeks(net=-2000)
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CASH_FLOW_FORECAST_READY")
        self.assertEqual(v["computed_final_balance"], "74000.000000")

    def test_closing_balance_disagreeing_with_flows_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["forecast"]["weeks"][12]["closing_balance"] = 160000
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CASH_FLOW_FORECAST_NOT_READY")
        self.assertEqual(v["sections"]["thirteen_week_forecast"], "fail")
        self.assertEqual(
            check_status(v, "weekly_closing_balances_match_rederived"),
            "fail")
        self.assertEqual(v["final_balance_difference"], "-5000.000000")
        self.assertEqual(v["computed_status"],
                         "outside_stated_limits_on_declared_evidence")

    def test_mid_forecast_balance_error_fails_even_if_final_matches(self):
        m = copy.deepcopy(COMPLETE)
        m["forecast"]["weeks"][5]["closing_balance"] += 1
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "weekly_closing_balances_match_rederived"),
            "fail")
        self.assertEqual(v["final_balance_difference"], "0.000000")

    def test_twelve_weeks_fails_thirteen_week_coverage(self):
        m = copy.deepcopy(COMPLETE)
        m["forecast"]["weeks"] = _weeks(count=12)
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CASH_FLOW_FORECAST_NOT_READY")
        self.assertEqual(
            check_status(v, "forecast_covers_thirteen_weeks"), "fail")
        self.assertEqual(v["weeks_evaluated"], 12)
        self.assertEqual(v["computed_final_balance"], "160000.000000")

    def test_fourteen_weeks_also_fails_coverage(self):
        m = copy.deepcopy(COMPLETE)
        m["forecast"]["weeks"] = _weeks(count=14)
        self.assertEqual(evaluate(m)["verdict"],
                         "CASH_FLOW_FORECAST_NOT_READY")

    def test_missing_weeks_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["forecast"]["weeks"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "weekly_closing_balances_match_rederived"),
            "missing")
        self.assertEqual(v["weeks_evaluated"], 0)
        self.assertIsNone(v["computed_final_balance"])
        self.assertIsNone(v["computed_status"])

    def test_empty_weeks_list_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        m["forecast"]["weeks"] = []
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "forecast_covers_thirteen_weeks"), "missing")

    def test_incomplete_week_entry_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["forecast"]["weeks"][3]["inflows"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "forecast_week_entries_complete"), "missing")
        self.assertEqual(v["weeks_evaluated"], 12)
        self.assertIsNone(v["computed_final_balance"])

    def test_missing_opening_balance_makes_balances_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["forecast"]["opening_balance"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "weekly_closing_balances_match_rederived"),
            "missing")
        self.assertEqual(
            check_status(v, "forecast_covers_thirteen_weeks"), "pass")

    def test_reserve_target_mismatch_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["reserves"]["declared_target_amount"] = 50000
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CASH_FLOW_FORECAST_NOT_READY")
        self.assertEqual(
            check_status(
                v,
                "reserve_target_amount_matches_months_times_fixed_costs"),
            "fail")
        self.assertEqual(v["reserve_target_difference"], "-10000.000000")

    def test_reserve_target_at_other_months_passes(self):
        m = copy.deepcopy(COMPLETE)
        m["reserves"]["target_months"] = 6
        m["reserves"]["declared_target_amount"] = 120000
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CASH_FLOW_FORECAST_READY")
        self.assertEqual(v["computed_reserve_target"], "120000.000000")

    def test_missing_reserve_number_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["reserves"]["target_months"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertIsNone(v["computed_reserve_target"])

    def test_reserve_put_at_risk_fails_red_line(self):
        m = copy.deepcopy(COMPLETE)
        m["reserves"]["put_at_risk"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CASH_FLOW_FORECAST_NOT_READY")
        self.assertEqual(v["sections"]["reserves_and_runway"], "fail")

    def test_reserve_not_held_separately_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["reserves"]["held_separately"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "CASH_FLOW_FORECAST_NOT_READY")

    def test_runway_mismatch_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["runway"]["declared_runway_months"] = 12
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CASH_FLOW_FORECAST_NOT_READY")
        self.assertEqual(
            check_status(v, "runway_matches_cash_divided_by_burn"),
            "fail")
        self.assertEqual(v["runway_difference"], "-3.000000")

    def test_runway_at_other_values_passes(self):
        m = copy.deepcopy(COMPLETE)
        m["runway"] = {"cash_on_hand": 90000, "burn": 12000,
                       "declared_runway_months": 7.5,
                       "alert_thresholds_at_6_and_3_months_set": True}
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CASH_FLOW_FORECAST_READY")
        self.assertEqual(v["computed_runway_months"], "7.500000")

    def test_zero_burn_fails_runway(self):
        m = copy.deepcopy(COMPLETE)
        m["runway"]["burn"] = 0
        m["runway"]["declared_runway_months"] = 0
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CASH_FLOW_FORECAST_NOT_READY")
        self.assertIsNone(v["computed_runway_months"])
        self.assertIsNone(v["runway_difference"])

    def test_missing_runway_number_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["runway"]["declared_runway_months"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["computed_runway_months"], "15.000000")
        self.assertIsNone(v["runway_difference"])

    def test_alert_thresholds_not_set_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["runway"]["alert_thresholds_at_6_and_3_months_set"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "CASH_FLOW_FORECAST_NOT_READY")

    def test_lag_assumptions_not_documented_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["flows"]["lag_assumptions_documented"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CASH_FLOW_FORECAST_NOT_READY")
        self.assertEqual(v["sections"]["flows_and_lags"], "fail")

    def test_rolling_forecast_not_maintained_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["forecast"]["rolling_maintained_weekly"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "CASH_FLOW_FORECAST_NOT_READY")

    def test_ar_aging_not_reviewed_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["working_capital"]["ar_aging_reviewed_on_cadence"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CASH_FLOW_FORECAST_NOT_READY")
        self.assertEqual(v["sections"]["working_capital_and_levers"],
                         "fail")

    def test_vendors_as_silent_financing_fails_red_line(self):
        m = copy.deepcopy(COMPLETE)
        m["levers"]["vendors_used_as_silent_financing"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CASH_FLOW_FORECAST_NOT_READY")
        self.assertEqual(
            check_status(v, "vendors_not_used_as_silent_financing"),
            "fail")

    def test_stress_coverage_missing_one_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["stress"]["cases_run"] = [
            c for c in m["stress"]["cases_run"] if c != "surprise_capex"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CASH_FLOW_FORECAST_NOT_READY")
        self.assertEqual(v["stress_cases_not_run"], ["surprise_capex"])
        self.assertEqual(
            check_status(v, "stress_cases_cover_stated_cases"), "fail")

    def test_stress_empty_list_fails_not_missing(self):
        m = copy.deepcopy(COMPLETE)
        m["stress"]["cases_run"] = []
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CASH_FLOW_FORECAST_NOT_READY")
        self.assertEqual(v["stress_cases_not_run"],
                         ["revenue_minus_20_percent",
                          "collections_plus_30_days_late",
                          "surprise_capex"])

    def test_stress_unknown_entries_do_not_satisfy_coverage(self):
        m = copy.deepcopy(COMPLETE)
        m["stress"]["cases_run"] = ["recession", "rate_hike"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CASH_FLOW_FORECAST_NOT_READY")
        self.assertEqual(len(v["stress_cases_not_run"]), 3)

    def test_missing_stress_list_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["stress"]["cases_run"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertIsNone(v["stress_cases_not_run"])

    def test_stress_responses_not_predecided_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["stress"]["responses_predecided"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "CASH_FLOW_FORECAST_NOT_READY")

    def test_commitments_against_unlanded_receivables_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["commitments"]["committed_against_unlanded_receivables"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CASH_FLOW_FORECAST_NOT_READY")
        self.assertEqual(v["sections"]["reporting_and_commitments"],
                         "fail")

    def test_monthly_summary_without_drivers_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["reporting"]["monthly_summary_drivers_annotated"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "CASH_FLOW_FORECAST_NOT_READY")

    def test_absent_section_is_insufficient_not_failed(self):
        m = copy.deepcopy(COMPLETE)
        del m["stress"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["stress_tests"],
                         "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertIsNone(v["computed_status"])
        self.assertEqual(v["weeks_evaluated"], 0)
        self.assertIsNone(v["computed_final_balance"])
        self.assertIsNone(v["computed_reserve_target"])
        self.assertIsNone(v["computed_runway_months"])
        self.assertIsNone(v["stress_cases_not_run"])

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertIn("VERDICT: CASH_FLOW_FORECAST_READY", stamp(v))

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
            evaluate({"flows": "should-be-an-object"})
        self.assertIn("flows", str(ctx.exception))

    def test_list_field_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["stress"]["cases_run"] = "surprise_capex"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("stress.cases_run", str(ctx.exception))

    def test_list_entry_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["stress"]["cases_run"] = ["surprise_capex", 42]
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("stress.cases_run[1]", str(ctx.exception))

    def test_weeks_list_as_object_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["forecast"]["weeks"] = {"label": "week_1"}
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("forecast.weeks", str(ctx.exception))

    def test_week_entry_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["forecast"]["weeks"][0] = "week_1"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("forecast.weeks[0]", str(ctx.exception))

    def test_week_numeric_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["forecast"]["weeks"][2]["inflows"] = "20000"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("forecast.weeks[2].inflows", str(ctx.exception))

    def test_week_label_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["forecast"]["weeks"][0]["label"] = 1
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("forecast.weeks[0].label", str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["flows"]["lag_assumptions_documented"] = "yes"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("flows.lag_assumptions_documented",
                      str(ctx.exception))

    def test_numeric_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["runway"]["burn"] = "10000"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("runway.burn", str(ctx.exception))

    def test_numeric_leaf_as_boolean_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["reserves"]["target_months"] = True
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("reserves.target_months", str(ctx.exception))

    def test_null_section_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["reserves"] = None
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("reserves", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
