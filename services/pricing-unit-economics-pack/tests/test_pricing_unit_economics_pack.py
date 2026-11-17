import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from pricing_unit_economics_pack import evaluate, stamp  # noqa: E402

COMPLETE = {
    "product": "widget-suite",
    "revenue_model": {
        "model_kind": "subscription",
        "bookings_billings_and_recognized_revenue_kept_distinct": True,
        "recognition_timing_documented": True,
        "accountant_alignment_on_recognition_declared": True},
    "pricing": {"value_based_anchor_documented": True,
                "good_better_best_tiers_declared": True,
                "price_change_grandfathering_plan_present": True,
                "pricing_reviewed_annually_declared": True},
    "tiers": [
        {"name": "basic", "price": 50, "variable_cost_per_unit": 20,
         "units": 100, "declared_revenue": 5000,
         "declared_contribution": 3000},
        {"name": "pro", "price": 100, "variable_cost_per_unit": 35,
         "units": 40, "declared_revenue": 4000,
         "declared_contribution": 2600},
        {"name": "enterprise", "price": 250,
         "variable_cost_per_unit": 90, "units": 10,
         "declared_revenue": 2500, "declared_contribution": 1600},
    ],
    "discount_policy": {"approval_matrix_present": True,
                        "floor_prices_set": True,
                        "deal_desk_for_exceptions_present": True,
                        "refund_and_credit_policy_present": True,
                        "failed_payment_dunning_process_present": True,
                        "fraud_and_dispute_basics_present": True},
    "discounts": [
        {"label": "launch-10", "reason": "launch promotion"},
        {"label": "annual-prepay", "reason": "prepayment"},
    ],
    "unit_economics": {
        "assumptions_stated": True,
        "assumptions_conservative_declared": True,
        "unit_economics_updated_quarterly_declared": True,
        "price_per_unit": 100, "variable_cost_per_unit": 40,
        "fixed_costs": 12000, "units_sold": 500,
        "declared_contribution_margin_ratio": 0.6,
        "declared_break_even_units": 200,
        "declared_total_contribution": 30000},
    "churn": {"gross_and_net_churn_kept_distinct": True,
              "cohort_curves_used_not_single_period_averages": True,
              "expansion_revenue_tracked": True},
    "mrr_bridge": {"opening_mrr": 10000, "new_mrr": 2000,
                   "expansion_mrr": 500, "contraction_mrr": 300,
                   "churned_mrr": 200, "declared_closing_mrr": 12000},
    "reporting": {
        "cash_collection_and_recognized_revenue_kept_distinct": True,
        "forecast_inputs_handed_over_with_ranges_declared": True},
    "red_lines": {"bookings_presented_as_revenue_present": False,
                  "unrecorded_discounts_present": False,
                  "improvised_recognition_decisions_present": False},
}


def check_status(v, name):
    return next(c["status"] for c in v["checks"] if c["check"] == name)


class VerdictTests(unittest.TestCase):
    def test_complete_manifest_is_ready(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(v["verdict"], "PRICING_UNIT_ECONOMICS_PACK_READY")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(len(v["checks"]), 37)
        self.assertEqual(v["computed_status"],
                         "within_stated_limits_on_declared_evidence")
        self.assertEqual(v["tiers_count"], 3)
        self.assertEqual(v["duplicate_tier_names"], [])
        self.assertEqual(v["tiers_mismatching_revenue"], [])
        self.assertEqual(v["tiers_mismatching_contribution"], [])
        self.assertEqual(v["total_declared_tier_revenue"], "11500.000000")
        self.assertEqual(v["total_declared_tier_contribution"],
                         "7200.000000")
        self.assertEqual(v["tier_contribution_margin"], "0.626087")
        self.assertEqual(v["discounts_count"], 2)
        self.assertEqual(v["discounts_without_reason"], [])
        self.assertEqual(v["duplicate_discount_labels"], [])
        self.assertEqual(v["discount_reason_coverage"], "1.000000")
        self.assertEqual(v["computed_contribution_margin_ratio"],
                         "0.600000")
        self.assertEqual(v["contribution_margin_difference"], "0.000000")
        self.assertEqual(v["computed_break_even_units"], "200.000000")
        self.assertEqual(v["break_even_difference"], "0.000000")
        self.assertEqual(v["computed_total_contribution"], "30000.000000")
        self.assertEqual(v["total_contribution_difference"], "0.000000")
        self.assertEqual(v["computed_closing_mrr"], "12000.000000")
        self.assertEqual(v["closing_mrr_difference"], "0.000000")

    def test_empty_tier_and_discount_lists_are_valid_declarations(self):
        m = copy.deepcopy(COMPLETE)
        m["tiers"] = []
        m["discounts"] = []
        v = evaluate(m)
        self.assertEqual(v["verdict"], "PRICING_UNIT_ECONOMICS_PACK_READY")
        self.assertEqual(v["tiers_count"], 0)
        self.assertEqual(v["total_declared_tier_revenue"], "0.000000")
        self.assertEqual(v["total_declared_tier_contribution"], "0.000000")
        self.assertIsNone(v["tier_contribution_margin"])
        self.assertEqual(v["discounts_count"], 0)
        self.assertIsNone(v["discount_reason_coverage"])
        self.assertEqual(check_status(v, "price_tiers_declared"), "pass")
        self.assertEqual(
            check_status(v, "every_discount_names_reason"), "pass")

    def test_unstated_model_kind_fails_section1(self):
        m = copy.deepcopy(COMPLETE)
        m["revenue_model"]["model_kind"] = "freemium"
        v = evaluate(m)
        self.assertEqual(v["verdict"],
                         "PRICING_UNIT_ECONOMICS_PACK_NOT_READY")
        self.assertEqual(
            v["sections"]["revenue_model_and_recognition"], "fail")
        self.assertEqual(
            check_status(v, "revenue_model_kind_is_stated_kind"), "fail")

    def test_each_stated_model_kind_passes(self):
        for kind in ("one_time", "subscription", "usage", "hybrid"):
            m = copy.deepcopy(COMPLETE)
            m["revenue_model"]["model_kind"] = kind
            self.assertEqual(
                check_status(
                    evaluate(m), "revenue_model_kind_is_stated_kind"),
                "pass")

    def test_bookings_conflated_with_revenue_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["revenue_model"][
            "bookings_billings_and_recognized_revenue_kept_distinct"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "PRICING_UNIT_ECONOMICS_PACK_NOT_READY")

    def test_no_value_anchor_fails_section2(self):
        m = copy.deepcopy(COMPLETE)
        m["pricing"]["value_based_anchor_documented"] = False
        v = evaluate(m)
        self.assertEqual(v["sections"]["pricing_and_packaging"], "fail")

    def test_tier_revenue_mismatch_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["tiers"][0]["declared_revenue"] = 5001
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "tier_revenue_matches_price_times_units"),
            "fail")
        self.assertEqual(v["tiers_mismatching_revenue"], ["basic"])
        self.assertEqual(v["computed_status"],
                         "outside_stated_limits_on_declared_evidence")

    def test_tier_contribution_mismatch_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["tiers"][1]["declared_contribution"] = 2500
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v,
                "tier_contribution_matches_unit_contribution_times_units"),
            "fail")
        self.assertEqual(v["tiers_mismatching_contribution"], ["pro"])

    def test_tier_missing_field_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["tiers"][0]["declared_revenue"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "every_price_tier_entry_complete"), "missing")
        self.assertEqual(
            check_status(v, "tier_revenue_matches_price_times_units"),
            "missing")
        self.assertIsNone(v["total_declared_tier_revenue"])

    def test_tier_empty_name_fails_completeness(self):
        m = copy.deepcopy(COMPLETE)
        m["tiers"][0]["name"] = ""
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_price_tier_entry_complete"), "fail")

    def test_duplicate_tier_name_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["tiers"][2]["name"] = "basic"
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "no_price_tier_name_duplicated"), "fail")
        self.assertEqual(v["duplicate_tier_names"], ["basic"])

    def test_absent_tiers_list_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["tiers"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(check_status(v, "price_tiers_declared"),
                         "missing")
        self.assertIsNone(v["computed_status"])
        self.assertIsNone(v["tiers_count"])
        self.assertIsNone(v["duplicate_tier_names"])
        self.assertIsNone(v["tiers_mismatching_revenue"])
        self.assertIsNone(v["total_declared_tier_revenue"])
        self.assertIsNone(v["tier_contribution_margin"])

    def test_no_floor_prices_fails_section3(self):
        m = copy.deepcopy(COMPLETE)
        m["discount_policy"]["floor_prices_set"] = False
        v = evaluate(m)
        self.assertEqual(
            v["sections"]["discount_and_payment_guardrails"], "fail")

    def test_discount_without_reason_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["discounts"][0]["reason"] = ""
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_discount_names_reason"), "fail")
        self.assertEqual(v["discounts_without_reason"], ["launch-10"])
        self.assertEqual(v["discount_reason_coverage"], "0.500000")

    def test_discount_missing_reason_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["discounts"][0]["reason"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "every_discount_names_reason"), "missing")
        self.assertEqual(v["discounts_without_reason"], [])

    def test_duplicate_discount_label_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["discounts"][1]["label"] = "launch-10"
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "no_discount_label_duplicated"), "fail")
        self.assertEqual(v["duplicate_discount_labels"], ["launch-10"])

    def test_margin_ratio_mismatch_fails_section4(self):
        m = copy.deepcopy(COMPLETE)
        m["unit_economics"]["declared_contribution_margin_ratio"] = 0.5
        v = evaluate(m)
        self.assertEqual(v["sections"]["unit_economics"], "fail")
        self.assertEqual(
            check_status(
                v,
                "contribution_margin_ratio_matches_price_and_variable_cost"),
            "fail")
        self.assertEqual(v["contribution_margin_difference"], "-0.100000")

    def test_break_even_mismatch_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["unit_economics"]["declared_break_even_units"] = 201
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v,
                "break_even_units_matches_fixed_costs_over_unit_contribution"),
            "fail")
        self.assertEqual(v["break_even_difference"], "1.000000")

    def test_total_contribution_mismatch_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["unit_economics"]["declared_total_contribution"] = 29999
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v,
                "total_contribution_matches_units_sold_times_unit_contribution"),
            "fail")
        self.assertEqual(v["total_contribution_difference"], "-1.000000")

    def test_zero_price_makes_ratio_check_fail_not_missing(self):
        m = copy.deepcopy(COMPLETE)
        m["unit_economics"]["price_per_unit"] = 0
        m["unit_economics"]["variable_cost_per_unit"] = 0
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v,
                "contribution_margin_ratio_matches_price_and_variable_cost"),
            "fail")
        self.assertIsNone(v["computed_contribution_margin_ratio"])

    def test_zero_unit_contribution_makes_break_even_fail(self):
        m = copy.deepcopy(COMPLETE)
        m["unit_economics"]["variable_cost_per_unit"] = 100
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v,
                "break_even_units_matches_fixed_costs_over_unit_contribution"),
            "fail")
        self.assertIsNone(v["computed_break_even_units"])

    def test_missing_unit_economics_figure_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["unit_economics"]["fixed_costs"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertIsNone(v["computed_break_even_units"])
        self.assertIsNone(v["break_even_difference"])

    def test_mrr_bridge_not_closing_fails_section5(self):
        m = copy.deepcopy(COMPLETE)
        m["mrr_bridge"]["declared_closing_mrr"] = 11999
        v = evaluate(m)
        self.assertEqual(
            v["sections"]["churn_retention_and_reporting"], "fail")
        self.assertEqual(
            check_status(v, "mrr_bridge_closes_on_declared_figures"),
            "fail")
        self.assertEqual(v["closing_mrr_difference"], "-1.000000")
        self.assertEqual(v["computed_closing_mrr"], "12000.000000")

    def test_partial_mrr_bridge_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["mrr_bridge"]["churned_mrr"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "mrr_bridge_closes_on_declared_figures"),
            "missing")
        self.assertIsNone(v["computed_closing_mrr"])

    def test_single_period_average_churn_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["churn"]["cohort_curves_used_not_single_period_averages"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "PRICING_UNIT_ECONOMICS_PACK_NOT_READY")

    def test_bookings_presented_as_revenue_fails_red_lines(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"]["bookings_presented_as_revenue_present"] = True
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "no_bookings_presented_as_revenue"), "fail")
        self.assertEqual(v["sections"]["red_lines"], "fail")

    def test_unrecorded_discounts_red_line_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"]["unrecorded_discounts_present"] = True
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "no_unrecorded_discounts"), "fail")
        self.assertEqual(v["verdict"],
                         "PRICING_UNIT_ECONOMICS_PACK_NOT_READY")

    def test_improvised_recognition_red_line_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"]["improvised_recognition_decisions_present"] = True
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "no_improvised_recognition_decisions"),
            "fail")

    def test_absent_evidence_is_insufficient_not_failed(self):
        m = copy.deepcopy(COMPLETE)
        del m["churn"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["churn_retention_and_reporting"],
                         "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertTrue(
            all(c["status"] == "missing" for c in v["checks"]))
        self.assertIsNone(v["computed_status"])
        self.assertIsNone(v["tiers_count"])
        self.assertIsNone(v["discounts_count"])
        self.assertIsNone(v["computed_closing_mrr"])

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertIn(
            "VERDICT: PRICING_UNIT_ECONOMICS_PACK_READY", stamp(v))

    def test_non_object_manifest_rejected(self):
        with self.assertRaises(TypeError):
            evaluate(["not", "a", "manifest"])


class MalformedTypeTests(unittest.TestCase):
    def test_string_field_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["product"] = 12345
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("product", str(ctx.exception))

    def test_object_section_as_string_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"revenue_model": "should-be-an-object"})
        self.assertIn("revenue_model", str(ctx.exception))

    def test_list_field_as_object_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"tiers": {"name": "basic"}})
        self.assertIn("tiers", str(ctx.exception))

    def test_list_entry_as_string_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"tiers": ["basic"]})
        self.assertIn("tiers[0]", str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["churn"]["expansion_revenue_tracked"] = "yes"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("churn.expansion_revenue_tracked",
                      str(ctx.exception))

    def test_number_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["mrr_bridge"]["opening_mrr"] = "10000"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("mrr_bridge.opening_mrr", str(ctx.exception))

    def test_nested_list_entry_number_field_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["tiers"][0]["price"] = "50"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("tiers[0].price", str(ctx.exception))

    def test_null_section_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["unit_economics"] = None
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("unit_economics", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
