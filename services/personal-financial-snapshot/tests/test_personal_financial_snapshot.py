import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from personal_financial_snapshot import evaluate, stamp  # noqa: E402

COMPLETE = {
    "subject": "household-a",
    "snapshot": {"as_of_date_stated": True,
                 "currency_stated": True,
                 "net_worth_stated": True,
                 "allocation_stated": True,
                 "cash_flow_stated": True,
                 "cash_flow_period_stated": True},
    "figures": {"total_assets": 500000,
                "total_liabilities": 200000,
                "net_worth": 300000,
                "period_income": 12000,
                "period_expenses": 9000,
                "net_cash_flow": 3000,
                "annual_fees_and_drag_total": 1200},
    "assets": [
        {"name": "savings-account", "category": "cash", "amount": 50000},
        {"name": "investment-account", "category": "investments",
         "amount": 350000},
        {"name": "home", "category": "property", "amount": 100000},
    ],
    "liabilities": [
        {"name": "mortgage", "amount": 180000},
        {"name": "car-loan", "amount": 20000},
    ],
    "fees": [
        {"name": "account-fees", "amount": 200},
        {"name": "fund-fees", "amount": 1000},
    ],
    "lenses": {"risk_lens_stated": True,
               "liquidity_lens_stated": True,
               "tax_efficiency_lens_stated": True,
               "time_horizon_lens_stated": True},
    "costs": {"fees_and_drag_surfaced": True,
              "fees_and_drag_total_stated": True},
    "traceability": {"math_shown": True,
                     "every_claim_traces_to_a_number": True,
                     "educational_only_boundary_stated": True},
    "red_lines": {"buy_or_sell_recommendation_present": False,
                  "personalised_financial_advice_present": False,
                  "projection_or_scenario_present": False,
                  "ranked_action_recommendations_present": False,
                  "claim_without_traced_number_present": False},
}

NO_LIABILITIES_NO_FEES = copy.deepcopy(COMPLETE)
NO_LIABILITIES_NO_FEES["liabilities"] = []
NO_LIABILITIES_NO_FEES["fees"] = []
NO_LIABILITIES_NO_FEES["figures"]["total_liabilities"] = 0
NO_LIABILITIES_NO_FEES["figures"]["net_worth"] = 500000
NO_LIABILITIES_NO_FEES["figures"]["annual_fees_and_drag_total"] = 0


def check_status(v, name):
    return next(c["status"] for c in v["checks"] if c["check"] == name)


class VerdictTests(unittest.TestCase):
    def test_complete_manifest_is_sound(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(v["verdict"], "SNAPSHOT_SOUND")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(len(v["checks"]), 34)
        self.assertEqual(v["computed_status"],
                         "within_stated_limits_on_declared_evidence")
        self.assertEqual(v["assets_count"], 3)
        self.assertEqual(v["computed_asset_total"], "500000.000000")
        self.assertEqual(v["asset_total_difference"], "0.000000")
        self.assertEqual(v["duplicate_asset_names"], [])
        self.assertEqual(v["liabilities_count"], 2)
        self.assertEqual(v["computed_liability_total"], "200000.000000")
        self.assertEqual(v["net_worth_difference"], "0.000000")
        self.assertEqual(v["computed_net_cash_flow"], "3000.000000")
        self.assertEqual(v["fees_count"], 2)
        self.assertEqual(v["computed_fees_total"], "1200.000000")

    def test_declared_zero_liabilities_and_fees_pass(self):
        v = evaluate(copy.deepcopy(NO_LIABILITIES_NO_FEES))
        self.assertEqual(v["verdict"], "SNAPSHOT_SOUND")
        self.assertEqual(check_status(v, "liabilities_declared"), "pass")
        self.assertEqual(check_status(v, "fees_declared"), "pass")
        self.assertEqual(v["computed_liability_total"], "0.000000")
        self.assertEqual(v["computed_fees_total"], "0.000000")

    def test_no_as_of_date_fails_section1(self):
        m = copy.deepcopy(COMPLETE)
        m["snapshot"]["as_of_date_stated"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "SNAPSHOT_NOT_SOUND")
        self.assertEqual(v["sections"]["snapshot_completeness"], "fail")
        self.assertEqual(check_status(v, "as_of_date_stated"), "fail")

    def test_net_worth_not_stated_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["snapshot"]["net_worth_stated"] = False
        self.assertEqual(evaluate(m)["verdict"], "SNAPSHOT_NOT_SOUND")

    def test_asset_sum_mismatch_fails_and_reports_difference(self):
        m = copy.deepcopy(COMPLETE)
        m["assets"][0]["amount"] = 40000
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v, "asset_rows_sum_matches_declared_total_assets"),
            "fail")
        self.assertEqual(v["computed_asset_total"], "490000.000000")
        self.assertEqual(v["asset_total_difference"], "10000.000000")
        self.assertEqual(v["computed_status"],
                         "outside_stated_limits_on_declared_evidence")

    def test_asset_missing_amount_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["assets"][0]["amount"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(
                v, "asset_rows_sum_matches_declared_total_assets"),
            "missing")
        self.assertIsNone(v["computed_asset_total"])

    def test_asset_empty_name_fails_row_complete(self):
        m = copy.deepcopy(COMPLETE)
        m["assets"][1]["name"] = ""
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_asset_row_complete"), "fail")

    def test_asset_missing_category_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["assets"][1]["category"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "every_asset_row_complete"), "missing")

    def test_duplicate_asset_name_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["assets"][2]["name"] = "savings-account"
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "no_asset_name_duplicated"), "fail")
        self.assertEqual(v["duplicate_asset_names"], ["savings-account"])

    def test_empty_assets_list_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["assets"] = []
        v = evaluate(m)
        self.assertEqual(check_status(v, "assets_declared"), "fail")
        self.assertEqual(v["assets_count"], 0)
        self.assertEqual(v["duplicate_asset_names"], [])

    def test_liability_sum_mismatch_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["liabilities"][0]["amount"] = 170000
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v,
                "liability_rows_sum_matches_declared_total_liabilities"),
            "fail")
        self.assertEqual(v["liability_total_difference"], "10000.000000")

    def test_duplicate_liability_name_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["liabilities"][1]["name"] = "mortgage"
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "no_liability_name_duplicated"), "fail")
        self.assertEqual(v["duplicate_liability_names"], ["mortgage"])

    def test_net_worth_figure_mismatch_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["figures"]["net_worth"] = 290000
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v,
                "declared_net_worth_matches_assets_minus_liabilities"),
            "fail")
        self.assertEqual(v["net_worth_difference"], "-10000.000000")

    def test_net_worth_figure_absent_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["figures"]["net_worth"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertIsNone(v["net_worth_difference"])

    def test_net_cash_flow_mismatch_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["figures"]["net_cash_flow"] = 2500
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v,
                "declared_net_cash_flow_matches_income_minus_expenses"),
            "fail")
        self.assertEqual(v["computed_net_cash_flow"], "3000.000000")
        self.assertEqual(v["net_cash_flow_difference"], "-500.000000")
        self.assertEqual(
            v["sections"]["cash_flow_and_fees_arithmetic"], "fail")

    def test_fee_sum_mismatch_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["fees"][1]["amount"] = 900
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "fee_rows_sum_matches_declared_fees_total"),
            "fail")
        self.assertEqual(v["fees_total_difference"], "100.000000")

    def test_duplicate_fee_name_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["fees"][1]["name"] = "account-fees"
        v = evaluate(m)
        self.assertEqual(check_status(v, "no_fee_name_duplicated"), "fail")
        self.assertEqual(v["duplicate_fee_names"], ["account-fees"])

    def test_risk_lens_not_stated_fails_section4(self):
        m = copy.deepcopy(COMPLETE)
        m["lenses"]["risk_lens_stated"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "SNAPSHOT_NOT_SOUND")
        self.assertEqual(v["sections"]["lenses_and_costs"], "fail")

    def test_fees_not_surfaced_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["costs"]["fees_and_drag_surfaced"] = False
        self.assertEqual(
            check_status(evaluate(m), "fees_and_drag_surfaced"), "fail")

    def test_math_not_shown_fails_section5(self):
        m = copy.deepcopy(COMPLETE)
        m["traceability"]["math_shown"] = False
        v = evaluate(m)
        self.assertEqual(
            v["sections"]["traceability_and_advice_boundary"], "fail")

    def test_buy_sell_recommendation_fails_red_lines(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"]["buy_or_sell_recommendation_present"] = True
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "no_buy_or_sell_recommendation"), "fail")
        self.assertEqual(
            v["sections"]["traceability_and_advice_boundary"], "fail")
        self.assertEqual(v["verdict"], "SNAPSHOT_NOT_SOUND")

    def test_projection_and_ranked_actions_fail_red_lines(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"]["projection_or_scenario_present"] = True
        m["red_lines"]["ranked_action_recommendations_present"] = True
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "no_projection_or_scenario"), "fail")
        self.assertEqual(
            check_status(v, "no_ranked_action_recommendations"), "fail")

    def test_personalised_advice_and_untraced_claim_fail(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"]["personalised_financial_advice_present"] = True
        m["red_lines"]["claim_without_traced_number_present"] = True
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "no_personalised_financial_advice"), "fail")
        self.assertEqual(
            check_status(v, "no_claim_without_traced_number"), "fail")

    def test_absent_evidence_is_insufficient_not_failed(self):
        m = copy.deepcopy(COMPLETE)
        del m["lenses"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["lenses_and_costs"],
                         "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertTrue(
            all(c["status"] == "missing" for c in v["checks"]))
        self.assertIsNone(v["computed_status"])
        self.assertIsNone(v["assets_count"])
        self.assertIsNone(v["computed_asset_total"])
        self.assertIsNone(v["duplicate_asset_names"])
        self.assertIsNone(v["computed_net_cash_flow"])
        self.assertIsNone(v["duplicate_fee_names"])

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertIn("VERDICT: SNAPSHOT_SOUND", stamp(v))

    def test_non_object_manifest_rejected(self):
        with self.assertRaises(TypeError):
            evaluate(["not", "a", "manifest"])


class MalformedTypeTests(unittest.TestCase):
    def test_string_field_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["subject"] = 12345
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("subject", str(ctx.exception))

    def test_object_section_as_string_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"snapshot": "should-be-an-object"})
        self.assertIn("snapshot", str(ctx.exception))

    def test_list_field_as_object_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"assets": {"name": "savings-account"}})
        self.assertIn("assets", str(ctx.exception))

    def test_list_entry_as_string_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"assets": ["savings-account"]})
        self.assertIn("assets[0]", str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["snapshot"]["net_worth_stated"] = "yes"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("snapshot.net_worth_stated", str(ctx.exception))

    def test_number_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["figures"]["total_assets"] = "500000"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("figures.total_assets", str(ctx.exception))

    def test_nested_list_entry_number_field_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["assets"][0]["amount"] = "50000"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("assets[0].amount", str(ctx.exception))

    def test_boolean_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["figures"]["net_worth"] = True
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("figures.net_worth", str(ctx.exception))

    def test_null_section_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["lenses"] = None
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("lenses", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
