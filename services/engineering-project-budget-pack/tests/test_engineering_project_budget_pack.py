import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from engineering_project_budget_pack import evaluate, stamp  # noqa: E402

COMPLETE = {
    "entity": "Substation 12kV Switchgear Replacement",
    "basis": {"document_present": True,
              "scope_of_estimate_stated": True,
              "assumptions_stated": True,
              "exclusions_stated": True,
              "quote_validity_stated": True,
              "fx_escalation_stated": True,
              "estimator_named": True},
    "build": {"labor_costed_rate_times_hours": True,
              "indirects_included": True},
    "line_items": [
        {"label": "feeder cable", "category": "material",
         "pricing_basis": "quote_based",
         "quantity": 1000, "unit_rate": 12, "declared_amount": 12000},
        {"label": "installation labor", "category": "labor",
         "pricing_basis": "allowance",
         "quantity": 400, "unit_rate": 95, "declared_amount": 38000},
        {"label": "testing subcontract", "category": "subcontract",
         "pricing_basis": "quote_based",
         "quantity": 1, "unit_rate": 25000, "declared_amount": 25000},
        {"label": "crane rental", "category": "rentals",
         "pricing_basis": "allowance",
         "quantity": 4, "unit_rate": 3000, "declared_amount": 12000},
        {"label": "freight and permits", "category": "indirects",
         "pricing_basis": "allowance",
         "quantity": 1, "unit_rate": 8000, "declared_amount": 8000},
    ],
    "contingency": {"risks_listed_for_contingency": True,
                    "management_reserve_held_separately": True,
                    "padding_buried_in_estimate": False},
    "totals": {"declared_subtotal": 95000,
               "contingency_percent": 10,
               "declared_contingency_amount": 9500,
               "declared_management_reserve_amount": 5000,
               "declared_total_budget": 109500,
               "declared_total_change_impact": 4500,
               "declared_revised_budget": 114000},
    "approval": {"approval_recorded": True,
                 "baseline_from_approved_amount": True,
                 "revisions_reapproved": True,
                 "work_without_approved_estimate_or_po": False},
    "changes": {"log_maintained": True,
                "verbal_change_orders_used": False},
    "change_entries": [
        {"label": "added cable tray scope", "cost_impact": 6000,
         "impact_statement_present": True,
         "approved_before_work": True},
        {"label": "descoped spare breaker", "cost_impact": -1500,
         "impact_statement_present": True,
         "approved_before_work": True},
    ],
    "tracking": {"commitments_vs_actuals_tracked": True,
                 "invoice_reconciliation_against_delivery": True,
                 "monthly_report_issued": True,
                 "variance_reported_with_reasons": True,
                 "commitments_amount": 80000,
                 "actuals_amount": 70000,
                 "forecast_to_complete_amount": 38000,
                 "declared_total_forecast_amount": 108000,
                 "declared_forecast_variance_amount": -6000},
    "closeout": {"final_cost_reconciled": True,
                 "variance_explained": True,
                 "lessons_captured": True,
                 "contingency_disposition_stated": True,
                 "unspent_contingency_released_explicitly": True,
                 "declared_final_cost": 112000,
                 "declared_final_variance_amount": -2000,
                 "contingency_used_amount": 7000,
                 "declared_unspent_contingency_amount": 2500},
}


def check_status(v, name):
    return next(c["status"] for c in v["checks"] if c["check"] == name)


class VerdictTests(unittest.TestCase):
    def test_complete_manifest_is_ready(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(v["verdict"], "BUDGET_PACK_READY")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(v["computed_status"],
                         "within_stated_limits_on_declared_evidence")
        self.assertEqual(len(v["checks"]), 42)
        self.assertEqual(v["line_items_evaluated"], 5)
        self.assertEqual(v["computed_subtotal"], "95000.000000")
        self.assertEqual(v["subtotal_difference"], "0.000000")
        self.assertEqual(v["change_entries_evaluated"], 2)
        self.assertEqual(v["computed_change_impact_total"], "4500.000000")
        self.assertEqual(v["change_impact_difference"], "0.000000")
        self.assertEqual(v["computed_contingency_amount"], "9500.000000")
        self.assertEqual(v["contingency_difference"], "0.000000")
        self.assertEqual(v["computed_total_budget"], "109500.000000")
        self.assertEqual(v["total_budget_difference"], "0.000000")
        self.assertEqual(v["computed_revised_budget"], "114000.000000")
        self.assertEqual(v["revised_budget_difference"], "0.000000")
        self.assertEqual(v["computed_total_forecast"], "108000.000000")
        self.assertEqual(v["total_forecast_difference"], "0.000000")
        self.assertEqual(v["computed_forecast_variance"], "-6000.000000")
        self.assertEqual(v["forecast_variance_difference"], "0.000000")
        self.assertEqual(v["computed_final_variance"], "-2000.000000")
        self.assertEqual(v["final_variance_difference"], "0.000000")
        self.assertEqual(v["computed_unspent_contingency"], "2500.000000")
        self.assertEqual(v["unspent_contingency_difference"], "0.000000")

    def test_basis_document_absent_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["basis"]["document_present"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "BUDGET_PACK_NOT_READY")
        self.assertEqual(v["sections"]["basis_document"], "fail")

    def test_basis_estimator_not_named_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["basis"]["estimator_named"] = False
        self.assertEqual(evaluate(m)["verdict"], "BUDGET_PACK_NOT_READY")

    def test_line_amount_mismatch_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["line_items"][0]["declared_amount"] = 11000
        v = evaluate(m)
        self.assertEqual(v["verdict"], "BUDGET_PACK_NOT_READY")
        self.assertEqual(
            check_status(
                v, "line_item_amounts_match_quantity_times_rate"),
            "fail")

    def test_subtotal_mismatch_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["totals"]["declared_subtotal"] = 94000
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "subtotal_matches_sum_of_line_items"),
            "fail")
        self.assertEqual(v["subtotal_difference"], "-1000.000000")
        self.assertEqual(v["computed_status"],
                         "outside_stated_limits_on_declared_evidence")

    def test_unstated_pricing_basis_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["line_items"][1]["pricing_basis"] = "guess"
        v = evaluate(m)
        self.assertEqual(v["verdict"], "BUDGET_PACK_NOT_READY")
        self.assertEqual(
            check_status(v, "line_item_pricing_basis_marked"), "fail")

    def test_each_stated_pricing_basis_passes(self):
        for basis in ("quote_based", "allowance"):
            m = copy.deepcopy(COMPLETE)
            for item in m["line_items"]:
                item["pricing_basis"] = basis
            self.assertEqual(evaluate(m)["verdict"], "BUDGET_PACK_READY")

    def test_missing_line_items_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["line_items"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["line_items_evaluated"], 0)
        self.assertIsNone(v["computed_subtotal"])
        self.assertEqual(
            check_status(v, "subtotal_matches_sum_of_line_items"),
            "missing")

    def test_empty_line_items_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        m["line_items"] = []
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "line_item_entries_complete"), "missing")

    def test_incomplete_line_item_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["line_items"][2]["unit_rate"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "line_item_entries_complete"), "missing")
        self.assertEqual(v["line_items_evaluated"], 4)
        self.assertIsNone(v["computed_subtotal"])

    def test_contingency_mismatch_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["totals"]["declared_contingency_amount"] = 9000
        v = evaluate(m)
        self.assertEqual(v["verdict"], "BUDGET_PACK_NOT_READY")
        self.assertEqual(
            check_status(
                v, "contingency_amount_matches_subtotal_times_percent"),
            "fail")
        self.assertEqual(v["contingency_difference"], "-500.000000")

    def test_contingency_at_other_percent_passes(self):
        # The percent is a declaration, never a pass mark: any
        # percent whose amount arithmetic holds passes.
        m = copy.deepcopy(COMPLETE)
        m["totals"]["contingency_percent"] = 20
        m["totals"]["declared_contingency_amount"] = 19000
        m["totals"]["declared_total_budget"] = 119000
        m["totals"]["declared_revised_budget"] = 123500
        m["tracking"]["declared_forecast_variance_amount"] = -15500
        m["closeout"]["declared_final_variance_amount"] = -11500
        m["closeout"]["contingency_used_amount"] = 17000
        m["closeout"]["declared_unspent_contingency_amount"] = 2000
        v = evaluate(m)
        self.assertEqual(v["verdict"], "BUDGET_PACK_READY")
        self.assertEqual(v["computed_contingency_amount"], "19000.000000")

    def test_total_budget_mismatch_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["totals"]["declared_total_budget"] = 109000
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v,
                "total_budget_matches_subtotal_plus_contingency_plus_reserve"),
            "fail")
        self.assertEqual(v["total_budget_difference"], "-500.000000")

    def test_buried_padding_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["contingency"]["padding_buried_in_estimate"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "BUDGET_PACK_NOT_READY")
        self.assertEqual(
            check_status(v, "no_padding_buried_in_estimate"), "fail")

    def test_reserve_not_separate_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["contingency"]["management_reserve_held_separately"] = False
        self.assertEqual(evaluate(m)["verdict"], "BUDGET_PACK_NOT_READY")

    def test_work_without_approval_fails_red_line(self):
        m = copy.deepcopy(COMPLETE)
        m["approval"]["work_without_approved_estimate_or_po"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "BUDGET_PACK_NOT_READY")
        self.assertEqual(
            check_status(
                v, "no_work_without_approved_estimate_or_po"), "fail")
        self.assertEqual(v["sections"]["approval_and_baseline"], "fail")

    def test_revisions_drifted_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["approval"]["revisions_reapproved"] = False
        self.assertEqual(evaluate(m)["verdict"], "BUDGET_PACK_NOT_READY")

    def test_change_without_impact_statement_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["change_entries"][0]["impact_statement_present"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "BUDGET_PACK_NOT_READY")
        self.assertEqual(
            check_status(v, "all_changes_have_impact_statements"),
            "fail")

    def test_change_not_approved_before_work_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["change_entries"][1]["approved_before_work"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "BUDGET_PACK_NOT_READY")
        self.assertEqual(
            check_status(v, "all_changes_approved_before_work"), "fail")

    def test_change_total_mismatch_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["totals"]["declared_total_change_impact"] = 4000
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v, "change_impact_total_matches_sum_of_entries"),
            "fail")
        self.assertEqual(v["change_impact_difference"], "-500.000000")

    def test_revised_budget_mismatch_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["totals"]["declared_revised_budget"] = 113000
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v,
                "revised_budget_matches_total_budget_plus_change_impact"),
            "fail")
        self.assertEqual(v["revised_budget_difference"], "-1000.000000")

    def test_verbal_change_orders_fail_red_line(self):
        m = copy.deepcopy(COMPLETE)
        m["changes"]["verbal_change_orders_used"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "BUDGET_PACK_NOT_READY")
        self.assertEqual(
            check_status(v, "no_verbal_change_orders"), "fail")

    def test_missing_change_entries_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["change_entries"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["change_entries_evaluated"], 0)
        self.assertIsNone(v["computed_change_impact_total"])
        # The revised-budget chain needs only the declared totals.
        self.assertEqual(v["computed_revised_budget"], "114000.000000")

    def test_incomplete_change_entry_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["change_entries"][0]["cost_impact"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "change_entries_complete"), "missing")
        self.assertEqual(v["change_entries_evaluated"], 1)
        self.assertIsNone(v["computed_change_impact_total"])

    def test_total_forecast_mismatch_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["tracking"]["declared_total_forecast_amount"] = 107000
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v,
                "total_forecast_matches_actuals_plus_forecast_to_complete"),
            "fail")
        self.assertEqual(v["total_forecast_difference"], "-1000.000000")

    def test_forecast_variance_mismatch_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["tracking"]["declared_forecast_variance_amount"] = -5000
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v,
                "forecast_variance_matches_total_forecast_minus_revised_budget"),
            "fail")
        self.assertEqual(v["forecast_variance_difference"], "1000.000000")

    def test_variance_without_reasons_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["tracking"]["variance_reported_with_reasons"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "BUDGET_PACK_NOT_READY")
        self.assertEqual(
            v["sections"]["change_control_and_tracking"], "fail")

    def test_missing_tracking_number_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["tracking"]["actuals_amount"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertIsNone(v["computed_total_forecast"])
        # The forecast variance needs only the declared forecast.
        self.assertEqual(v["computed_forecast_variance"], "-6000.000000")

    def test_final_variance_mismatch_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["closeout"]["declared_final_variance_amount"] = -1000
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v,
                "final_variance_matches_final_cost_minus_revised_budget"),
            "fail")
        self.assertEqual(v["final_variance_difference"], "1000.000000")

    def test_unspent_contingency_mismatch_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["closeout"]["declared_unspent_contingency_amount"] = 2000
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v, "unspent_contingency_matches_contingency_minus_used"),
            "fail")
        self.assertEqual(
            v["unspent_contingency_difference"], "-500.000000")

    def test_unspent_not_released_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["closeout"]["unspent_contingency_released_explicitly"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "BUDGET_PACK_NOT_READY")
        self.assertEqual(
            v["sections"]["closeout_and_contingency_disposition"],
            "fail")

    def test_absent_section_is_insufficient_not_failed(self):
        m = copy.deepcopy(COMPLETE)
        del m["closeout"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            v["sections"]["closeout_and_contingency_disposition"],
            "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertIsNone(v["computed_status"])
        self.assertEqual(v["line_items_evaluated"], 0)
        self.assertEqual(v["change_entries_evaluated"], 0)
        self.assertIsNone(v["computed_subtotal"])
        self.assertIsNone(v["computed_total_budget"])
        self.assertIsNone(v["computed_revised_budget"])
        self.assertIsNone(v["computed_unspent_contingency"])

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertIn("VERDICT: BUDGET_PACK_READY", stamp(v))

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
            evaluate({"basis": "should-be-an-object"})
        self.assertIn("basis", str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["basis"]["assumptions_stated"] = "yes"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("basis.assumptions_stated", str(ctx.exception))

    def test_line_items_as_object_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["line_items"] = {"label": "cable"}
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("line_items", str(ctx.exception))

    def test_line_item_entry_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["line_items"][0] = "cable"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("line_items[0]", str(ctx.exception))

    def test_line_item_numeric_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["line_items"][1]["quantity"] = "400"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("line_items[1].quantity", str(ctx.exception))

    def test_line_item_pricing_basis_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["line_items"][0]["pricing_basis"] = 7
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("line_items[0].pricing_basis", str(ctx.exception))

    def test_change_entries_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["change_entries"] = "added tray scope"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("change_entries", str(ctx.exception))

    def test_change_entry_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["change_entries"][0]["approved_before_work"] = "yes"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("change_entries[0].approved_before_work",
                      str(ctx.exception))

    def test_numeric_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["totals"]["declared_subtotal"] = "95000"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("totals.declared_subtotal", str(ctx.exception))

    def test_numeric_leaf_as_boolean_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["totals"]["contingency_percent"] = True
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("totals.contingency_percent", str(ctx.exception))

    def test_null_section_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["totals"] = None
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("totals", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
