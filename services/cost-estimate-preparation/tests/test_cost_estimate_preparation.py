import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from cost_estimate_preparation import evaluate, stamp  # noqa: E402

COMPLETE = {
    "entity": "Harbor Pumping Station Upgrade",
    "basis": {"document_present": True,
              "estimate_class": "budget",
              "method": "bottom_up",
              "assumptions_documented": True,
              "exclusions_documented": True,
              "estimator_identified": True},
    "elements": {"breakdown_not_lump_sum": True,
                 "labor_burden_included": True,
                 "hidden_padding_in_rates": False},
    "line_items": [
        {"label": "structural steel", "category": "material",
         "quantity": 10, "unit_rate": 5000, "declared_amount": 50000},
        {"label": "installation labor", "category": "labor",
         "quantity": 200, "unit_rate": 150, "declared_amount": 30000},
        {"label": "crane hire", "category": "equipment",
         "quantity": 5, "unit_rate": 4000, "declared_amount": 20000},
        {"label": "controls subcontract", "category": "subcontract",
         "quantity": 1, "unit_rate": 25000, "declared_amount": 25000},
        {"label": "delivery freight", "category": "freight",
         "quantity": 2, "unit_rate": 2500, "declared_amount": 5000},
        {"label": "site indirects", "category": "indirects",
         "quantity": 1, "unit_rate": 10000, "declared_amount": 10000},
    ],
    "uncertainty": {
        "ranges_stated_for_material_uncertainty": True,
        "items": [
            {"label": "ground conditions", "optimistic": 8000,
             "likely": 10000, "pessimistic": 15000,
             "declared_expected_value": 10500, "declared_spread": 7000},
            {"label": "switchgear lead time", "optimistic": 2000,
             "likely": 3000, "pessimistic": 6000,
             "declared_expected_value": 3500, "declared_spread": 4000},
        ],
        "expected_values_stated": True,
        "single_number_precision_on_uncertain_scope": False},
    "totals": {"declared_subtotal": 140000,
               "contingency_percent": 10,
               "declared_contingency_amount": 14000,
               "escalation_percent": 5,
               "declared_escalation_amount": 7000,
               "declared_grand_total": 161000,
               "escalation_impacts_stated": True,
               "currency_impacts_stated": True,
               "quote_validity_dates_captured": True},
    "should_cost": {"benchmark_built_for_big_items": True,
                    "vendor_quote_amount": 55000,
                    "should_cost_amount": 50000,
                    "declared_variance_percent": 10,
                    "quote_compared_to_benchmark": True,
                    "divergences_explained": True,
                    "quote_exclusions_reviewed": True,
                    "quote_assumptions_reviewed": True,
                    "validity_period_respected": True,
                    "quote_accepted_without_scope_review": False},
    "feedback": {"estimate_vs_actual_tracked_per_item": True,
                 "rates_updated_from_actuals": True,
                 "variance_lessons_published": True},
}


def check_status(v, name):
    return next(c["status"] for c in v["checks"] if c["check"] == name)


class VerdictTests(unittest.TestCase):
    def test_complete_manifest_is_ready(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(v["verdict"], "COST_ESTIMATE_READY")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(v["computed_status"],
                         "within_stated_limits_on_declared_evidence")
        self.assertEqual(len(v["checks"]), 35)
        self.assertEqual(v["line_items_evaluated"], 6)
        self.assertEqual(v["computed_subtotal"], "140000.000000")
        self.assertEqual(v["subtotal_difference"], "0.000000")
        self.assertEqual(v["uncertainty_items_evaluated"], 2)
        self.assertEqual(v["computed_total_spread"], "11000.000000")
        self.assertEqual(v["total_spread_difference"], "0.000000")
        self.assertEqual(v["computed_contingency_amount"], "14000.000000")
        self.assertEqual(v["contingency_difference"], "0.000000")
        self.assertEqual(v["computed_escalation_amount"], "7000.000000")
        self.assertEqual(v["escalation_difference"], "0.000000")
        self.assertEqual(v["computed_grand_total"], "161000.000000")
        self.assertEqual(v["grand_total_difference"], "0.000000")
        self.assertEqual(v["computed_quote_variance_percent"], "10.000000")
        self.assertEqual(v["quote_variance_difference"], "0.000000")

    def test_each_stated_class_passes(self):
        for cls in ("concept_rom", "budget", "definitive"):
            m = copy.deepcopy(COMPLETE)
            m["basis"]["estimate_class"] = cls
            self.assertEqual(evaluate(m)["verdict"], "COST_ESTIMATE_READY")

    def test_unstated_class_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["basis"]["estimate_class"] = "rough_guess"
        v = evaluate(m)
        self.assertEqual(v["verdict"], "COST_ESTIMATE_NOT_READY")
        self.assertEqual(
            check_status(v, "estimate_class_in_stated_classes"), "fail")
        self.assertEqual(v["sections"]["basis_and_class"], "fail")

    def test_each_stated_method_passes(self):
        for meth in ("bottom_up", "parametric", "analogous"):
            m = copy.deepcopy(COMPLETE)
            m["basis"]["method"] = meth
            self.assertEqual(evaluate(m)["verdict"], "COST_ESTIMATE_READY")

    def test_unstated_method_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["basis"]["method"] = "guesswork"
        v = evaluate(m)
        self.assertEqual(v["verdict"], "COST_ESTIMATE_NOT_READY")
        self.assertEqual(check_status(v, "method_in_stated_methods"),
                         "fail")

    def test_missing_class_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["basis"]["estimate_class"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "estimate_class_in_stated_classes"),
            "missing")
        self.assertIsNone(v["computed_status"])

    def test_basis_document_absent_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["basis"]["document_present"] = False
        self.assertEqual(evaluate(m)["verdict"], "COST_ESTIMATE_NOT_READY")

    def test_line_amount_mismatch_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["line_items"][0]["declared_amount"] = 49000
        v = evaluate(m)
        self.assertEqual(v["verdict"], "COST_ESTIMATE_NOT_READY")
        self.assertEqual(
            check_status(
                v, "line_item_amounts_match_quantity_times_rate"),
            "fail")

    def test_line_amount_at_other_values_passes(self):
        m = copy.deepcopy(COMPLETE)
        m["line_items"][1]["quantity"] = 100
        m["line_items"][1]["declared_amount"] = 15000
        m["totals"]["declared_subtotal"] = 125000
        m["totals"]["declared_contingency_amount"] = 12500
        m["totals"]["declared_escalation_amount"] = 6250
        m["totals"]["declared_grand_total"] = 143750
        v = evaluate(m)
        self.assertEqual(v["verdict"], "COST_ESTIMATE_READY")
        self.assertEqual(v["computed_subtotal"], "125000.000000")

    def test_subtotal_mismatch_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["totals"]["declared_subtotal"] = 139000
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "subtotal_matches_sum_of_line_items"),
            "fail")
        self.assertEqual(v["subtotal_difference"], "-1000.000000")
        self.assertEqual(v["computed_status"],
                         "outside_stated_limits_on_declared_evidence")

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
        self.assertEqual(v["line_items_evaluated"], 5)
        self.assertIsNone(v["computed_subtotal"])

    def test_hidden_padding_fails_red_line(self):
        m = copy.deepcopy(COMPLETE)
        m["elements"]["hidden_padding_in_rates"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "COST_ESTIMATE_NOT_READY")
        self.assertEqual(
            check_status(v, "no_hidden_padding_in_rates"), "fail")

    def test_labor_burden_not_included_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["elements"]["labor_burden_included"] = False
        self.assertEqual(evaluate(m)["verdict"], "COST_ESTIMATE_NOT_READY")

    def test_spread_mismatch_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["uncertainty"]["items"][0]["declared_spread"] = 6000
        v = evaluate(m)
        self.assertEqual(v["verdict"], "COST_ESTIMATE_NOT_READY")
        self.assertEqual(
            check_status(
                v,
                "three_point_spreads_match_pessimistic_minus_optimistic"),
            "fail")
        self.assertEqual(v["total_spread_difference"], "-1000.000000")

    def test_three_point_ordering_invalid_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["uncertainty"]["items"][1]["likely"] = 7000
        v = evaluate(m)
        self.assertEqual(v["verdict"], "COST_ESTIMATE_NOT_READY")
        self.assertEqual(
            check_status(v, "three_point_ordering_valid"), "fail")
        # Spread arithmetic is untouched, so it still passes.
        self.assertEqual(
            check_status(
                v,
                "three_point_spreads_match_pessimistic_minus_optimistic"),
            "pass")

    def test_expected_value_is_presence_only(self):
        # The skill states no expected-value formula, so any
        # declared expected value passes as long as it is present.
        m = copy.deepcopy(COMPLETE)
        m["uncertainty"]["items"][0]["declared_expected_value"] = 99999
        self.assertEqual(evaluate(m)["verdict"], "COST_ESTIMATE_READY")

    def test_missing_uncertainty_items_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["uncertainty"]["items"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["uncertainty_items_evaluated"], 0)
        self.assertIsNone(v["computed_total_spread"])

    def test_incomplete_uncertainty_item_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["uncertainty"]["items"][0]["pessimistic"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "uncertainty_entries_complete"), "missing")
        self.assertEqual(v["uncertainty_items_evaluated"], 1)
        self.assertIsNone(v["computed_total_spread"])

    def test_single_number_precision_fails_red_line(self):
        m = copy.deepcopy(COMPLETE)
        m["uncertainty"]["single_number_precision_on_uncertain_scope"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "COST_ESTIMATE_NOT_READY")
        self.assertEqual(
            check_status(
                v, "no_single_number_precision_on_uncertain_scope"),
            "fail")

    def test_contingency_mismatch_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["totals"]["declared_contingency_amount"] = 10000
        v = evaluate(m)
        self.assertEqual(v["verdict"], "COST_ESTIMATE_NOT_READY")
        self.assertEqual(
            check_status(
                v, "contingency_amount_matches_subtotal_times_percent"),
            "fail")
        self.assertEqual(v["contingency_difference"], "-4000.000000")

    def test_contingency_at_other_percent_passes(self):
        # The percent is a declaration, never a pass mark: any
        # percent whose amount arithmetic holds passes.
        m = copy.deepcopy(COMPLETE)
        m["totals"]["contingency_percent"] = 25
        m["totals"]["declared_contingency_amount"] = 35000
        m["totals"]["declared_grand_total"] = 182000
        v = evaluate(m)
        self.assertEqual(v["verdict"], "COST_ESTIMATE_READY")
        self.assertEqual(v["computed_contingency_amount"], "35000.000000")

    def test_escalation_mismatch_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["totals"]["declared_escalation_amount"] = 8000
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v, "escalation_amount_matches_subtotal_times_percent"),
            "fail")
        self.assertEqual(v["escalation_difference"], "1000.000000")

    def test_grand_total_mismatch_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["totals"]["declared_grand_total"] = 160000
        v = evaluate(m)
        self.assertEqual(v["verdict"], "COST_ESTIMATE_NOT_READY")
        self.assertEqual(
            check_status(
                v,
                "grand_total_matches_subtotal_plus_contingency_plus_escalation"),
            "fail")
        self.assertEqual(v["grand_total_difference"], "-1000.000000")

    def test_missing_totals_number_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["totals"]["contingency_percent"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertIsNone(v["computed_contingency_amount"])
        # The grand-total chain does not need the percent.
        self.assertEqual(v["computed_grand_total"], "161000.000000")

    def test_quote_variance_mismatch_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["should_cost"]["declared_variance_percent"] = 5
        v = evaluate(m)
        self.assertEqual(v["verdict"], "COST_ESTIMATE_NOT_READY")
        self.assertEqual(
            check_status(v, "quote_variance_percent_matches_rederived"),
            "fail")
        self.assertEqual(v["quote_variance_difference"], "-5.000000")

    def test_quote_below_benchmark_negative_variance_passes(self):
        m = copy.deepcopy(COMPLETE)
        m["should_cost"]["vendor_quote_amount"] = 45000
        m["should_cost"]["declared_variance_percent"] = -10
        v = evaluate(m)
        self.assertEqual(v["verdict"], "COST_ESTIMATE_READY")
        self.assertEqual(v["computed_quote_variance_percent"],
                         "-10.000000")

    def test_zero_benchmark_fails_variance(self):
        m = copy.deepcopy(COMPLETE)
        m["should_cost"]["should_cost_amount"] = 0
        m["should_cost"]["declared_variance_percent"] = 0
        v = evaluate(m)
        self.assertEqual(v["verdict"], "COST_ESTIMATE_NOT_READY")
        self.assertIsNone(v["computed_quote_variance_percent"])
        self.assertIsNone(v["quote_variance_difference"])

    def test_missing_variance_number_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["should_cost"]["declared_variance_percent"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["computed_quote_variance_percent"], "10.000000")
        self.assertIsNone(v["quote_variance_difference"])

    def test_quote_accepted_without_scope_review_fails_red_line(self):
        m = copy.deepcopy(COMPLETE)
        m["should_cost"]["quote_accepted_without_scope_review"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "COST_ESTIMATE_NOT_READY")
        self.assertEqual(v["sections"]["should_cost_and_quotes"], "fail")

    def test_quote_exclusions_not_reviewed_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["should_cost"]["quote_exclusions_reviewed"] = False
        self.assertEqual(evaluate(m)["verdict"], "COST_ESTIMATE_NOT_READY")

    def test_feedback_not_tracked_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["feedback"]["estimate_vs_actual_tracked_per_item"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "COST_ESTIMATE_NOT_READY")
        self.assertEqual(v["sections"]["feedback_loop"], "fail")

    def test_absent_section_is_insufficient_not_failed(self):
        m = copy.deepcopy(COMPLETE)
        del m["feedback"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["feedback_loop"],
                         "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertIsNone(v["computed_status"])
        self.assertEqual(v["line_items_evaluated"], 0)
        self.assertEqual(v["uncertainty_items_evaluated"], 0)
        self.assertIsNone(v["computed_subtotal"])
        self.assertIsNone(v["computed_grand_total"])
        self.assertIsNone(v["computed_quote_variance_percent"])

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertIn("VERDICT: COST_ESTIMATE_READY", stamp(v))

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

    def test_class_field_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["basis"]["estimate_class"] = 2
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("basis.estimate_class", str(ctx.exception))

    def test_line_items_as_object_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["line_items"] = {"label": "steel"}
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("line_items", str(ctx.exception))

    def test_line_item_entry_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["line_items"][0] = "steel"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("line_items[0]", str(ctx.exception))

    def test_line_item_numeric_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["line_items"][1]["quantity"] = "200"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("line_items[1].quantity", str(ctx.exception))

    def test_line_item_label_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["line_items"][0]["label"] = 7
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("line_items[0].label", str(ctx.exception))

    def test_uncertainty_items_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["uncertainty"]["items"] = "ground conditions"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("uncertainty.items", str(ctx.exception))

    def test_uncertainty_numeric_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["uncertainty"]["items"][0]["optimistic"] = "8000"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("uncertainty.items[0].optimistic",
                      str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["basis"]["assumptions_documented"] = "yes"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("basis.assumptions_documented", str(ctx.exception))

    def test_numeric_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["totals"]["declared_subtotal"] = "140000"
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
