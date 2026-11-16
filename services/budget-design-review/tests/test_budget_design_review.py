import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from budget_design_review import evaluate, stamp  # noqa: E402

COMPLETE = {
    "budget": "FY2027 operating budget — small company",
    "scope": {"budget_type": "operating",
              "entity_named": True,
              "currency_stated": True,
              "governs_stated": True,
              "exclusions_stated": True},
    "lines": [
        {"name": "Engineering headcount", "owner": "Priya",
         "approach": "zero_based", "driver_documented": True,
         "driver_quantity": 10, "driver_unit_cost": 12000,
         "amount": 120000},
        {"name": "Cloud usage", "owner": "Sam",
         "approach": "incremental", "driver_documented": True,
         "driver_quantity": 5000, "driver_unit_cost": 4,
         "amount": 20000},
        {"name": "Contingency", "owner": "Priya",
         "approach": "zero_based", "driver_documented": True,
         "driver_quantity": 1, "driver_unit_cost": 10000,
         "amount": 10000},
    ],
    "totals": {"declared_total": 150000, "expected_income": 200000},
    "revenue": {"linked_to_forecast": True},
    "contingency": {"explicit_line_present": True,
                    "sized_to_identified_risks": True,
                    "hidden_padding_present": False},
    "approval": {"baseline_approved_and_locked": True,
                 "approval_thresholds_documented": True,
                 "revisions_reapproved": True},
    "monitoring": {"monthly_variance_process_running": True,
                   "variance_thresholds_trigger_explanations": True,
                   "variance_actions_tracked": True,
                   "rolling_forecast_cadence_set": True,
                   "rolling_horizon_months": 12},
    "close": {"annual_true_up_done": True,
              "carry_over_rules_decided": True,
              "lessons_carried_to_next_cycle": True,
              "silent_reallocations_made": False,
              "actuals_edited_without_annotation": False},
}


def check_status(v, name):
    return next(c["status"] for c in v["checks"] if c["check"] == name)


class VerdictTests(unittest.TestCase):
    def test_complete_manifest_is_sound(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(v["verdict"], "BUDGET_DESIGN_SOUND")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(v["computed_status"],
                         "within_stated_limits_on_declared_evidence")
        self.assertEqual(len(v["checks"]), 29)
        self.assertEqual(v["lines_evaluated"], 3)
        self.assertEqual(v["ownerless_line_indexes"], [])
        self.assertEqual(v["computed_total"], "150000.00")
        self.assertEqual(v["total_difference"], "0.00")

    def test_capital_and_personal_types_pass(self):
        for kind in ("capital", "personal"):
            m = copy.deepcopy(COMPLETE)
            m["scope"]["budget_type"] = kind
            self.assertEqual(evaluate(m)["verdict"],
                             "BUDGET_DESIGN_SOUND")

    def test_unstated_budget_type_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["scope"]["budget_type"] = "project"
        v = evaluate(m)
        self.assertEqual(v["verdict"], "BUDGET_DESIGN_NOT_SOUND")
        self.assertEqual(
            check_status(v, "budget_type_is_stated_kind"), "fail")
        self.assertEqual(v["computed_status"],
                         "outside_stated_limits_on_declared_evidence")

    def test_missing_budget_type_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["scope"]["budget_type"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "budget_type_is_stated_kind"), "missing")

    def test_currency_not_stated_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["scope"]["currency_stated"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "BUDGET_DESIGN_NOT_SOUND")
        self.assertEqual(v["sections"]["scope"], "fail")

    def test_exclusions_not_stated_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["scope"]["exclusions_stated"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "BUDGET_DESIGN_NOT_SOUND")

    def test_empty_lines_fail(self):
        m = copy.deepcopy(COMPLETE)
        m["lines"] = []
        v = evaluate(m)
        self.assertEqual(v["verdict"], "BUDGET_DESIGN_NOT_SOUND")
        self.assertEqual(check_status(v, "lines_present"), "fail")
        self.assertEqual(v["lines_evaluated"], 0)
        self.assertEqual(v["ownerless_line_indexes"], [])
        self.assertIsNone(v["computed_total"])

    def test_absent_lines_are_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["lines"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(check_status(v, "lines_present"), "missing")
        self.assertIsNone(v["lines_evaluated"])
        self.assertIsNone(v["ownerless_line_indexes"])

    def test_line_without_owner_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["lines"][1]["owner"] = ""
        v = evaluate(m)
        self.assertEqual(v["verdict"], "BUDGET_DESIGN_NOT_SOUND")
        self.assertEqual(
            check_status(v, "every_line_has_named_owner"), "fail")
        self.assertEqual(v["ownerless_line_indexes"], [1])

    def test_line_owner_key_absent_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["lines"][0]["owner"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "every_line_has_named_owner"), "missing")
        self.assertEqual(v["ownerless_line_indexes"], [0])

    def test_unstated_approach_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["lines"][0]["approach"] = "flat_percentage"
        v = evaluate(m)
        self.assertEqual(v["verdict"], "BUDGET_DESIGN_NOT_SOUND")
        self.assertEqual(
            check_status(v, "every_line_approach_is_stated_kind"),
            "fail")

    def test_approach_key_absent_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["lines"][2]["approach"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "every_line_approach_is_stated_kind"),
            "missing")

    def test_driver_not_documented_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["lines"][1]["driver_documented"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "BUDGET_DESIGN_NOT_SOUND")
        self.assertEqual(
            check_status(v, "drivers_documented_for_every_line"),
            "fail")

    def test_amount_disagreeing_with_driver_product_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["lines"][0]["amount"] = 100000
        m["totals"]["declared_total"] = 130000
        v = evaluate(m)
        self.assertEqual(v["verdict"], "BUDGET_DESIGN_NOT_SOUND")
        self.assertEqual(
            check_status(v, "line_amounts_match_driver_products"),
            "fail")
        self.assertEqual(
            check_status(v, "declared_total_matches_line_sum"),
            "pass")

    def test_missing_driver_number_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["lines"][0]["driver_unit_cost"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "line_amounts_match_driver_products"),
            "missing")

    def test_declared_total_disagreeing_with_sum_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["totals"]["declared_total"] = 140000
        v = evaluate(m)
        self.assertEqual(v["verdict"], "BUDGET_DESIGN_NOT_SOUND")
        self.assertEqual(
            check_status(v, "declared_total_matches_line_sum"),
            "fail")
        self.assertEqual(v["computed_total"], "150000.00")
        self.assertEqual(v["total_difference"], "-10000.00")

    def test_missing_declared_total_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["totals"]["declared_total"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "declared_total_matches_line_sum"),
            "missing")
        self.assertEqual(v["computed_total"], "150000.00")
        self.assertIsNone(v["total_difference"])

    def test_total_above_expected_income_fails_balance(self):
        m = copy.deepcopy(COMPLETE)
        m["totals"]["expected_income"] = 100000
        v = evaluate(m)
        self.assertEqual(v["verdict"], "BUDGET_DESIGN_NOT_SOUND")
        self.assertEqual(
            check_status(
                v, "budget_balances_against_expected_income"),
            "fail")

    def test_total_equal_to_expected_income_passes_balance(self):
        m = copy.deepcopy(COMPLETE)
        m["totals"]["expected_income"] = 150000
        self.assertEqual(evaluate(m)["verdict"],
                         "BUDGET_DESIGN_SOUND")

    def test_revenue_not_linked_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["revenue"]["linked_to_forecast"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "BUDGET_DESIGN_NOT_SOUND")
        self.assertEqual(v["sections"]["revenue_and_contingency"],
                         "fail")

    def test_hidden_padding_fails_red_line(self):
        m = copy.deepcopy(COMPLETE)
        m["contingency"]["hidden_padding_present"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "BUDGET_DESIGN_NOT_SOUND")
        self.assertEqual(check_status(v, "no_hidden_padding"), "fail")

    def test_contingency_not_explicit_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["contingency"]["explicit_line_present"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "BUDGET_DESIGN_NOT_SOUND")

    def test_contingency_not_sized_to_risks_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["contingency"]["sized_to_identified_risks"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "BUDGET_DESIGN_NOT_SOUND")

    def test_baseline_not_locked_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["approval"]["baseline_approved_and_locked"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "BUDGET_DESIGN_NOT_SOUND")
        self.assertEqual(v["sections"]["approval_and_baseline"],
                         "fail")

    def test_thresholds_not_documented_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["approval"]["approval_thresholds_documented"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "BUDGET_DESIGN_NOT_SOUND")

    def test_revisions_drifted_fail(self):
        m = copy.deepcopy(COMPLETE)
        m["approval"]["revisions_reapproved"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "BUDGET_DESIGN_NOT_SOUND")

    def test_monthly_variance_not_running_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["monitoring"]["monthly_variance_process_running"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "BUDGET_DESIGN_NOT_SOUND")
        self.assertEqual(v["sections"]["monitoring_and_close"],
                         "fail")

    def test_rolling_horizon_not_twelve_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["monitoring"]["rolling_horizon_months"] = 6
        v = evaluate(m)
        self.assertEqual(v["verdict"], "BUDGET_DESIGN_NOT_SOUND")
        self.assertEqual(
            check_status(v, "rolling_forecast_covers_twelve_months"),
            "fail")

    def test_missing_rolling_horizon_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["monitoring"]["rolling_horizon_months"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "rolling_forecast_covers_twelve_months"),
            "missing")
        self.assertIsNone(v["computed_status"])

    def test_silent_reallocations_fail_red_line(self):
        m = copy.deepcopy(COMPLETE)
        m["close"]["silent_reallocations_made"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "BUDGET_DESIGN_NOT_SOUND")
        self.assertEqual(
            check_status(v, "no_silent_reallocations"), "fail")

    def test_unannotated_actual_edits_fail_red_line(self):
        m = copy.deepcopy(COMPLETE)
        m["close"]["actuals_edited_without_annotation"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "BUDGET_DESIGN_NOT_SOUND")
        self.assertEqual(
            check_status(v, "no_unannotated_actual_edits"), "fail")

    def test_lessons_not_carried_fail(self):
        m = copy.deepcopy(COMPLETE)
        m["close"]["lessons_carried_to_next_cycle"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "BUDGET_DESIGN_NOT_SOUND")

    def test_absent_section_is_insufficient_not_failed(self):
        m = copy.deepcopy(COMPLETE)
        del m["approval"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["approval_and_baseline"],
                         "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertIsNone(v["computed_status"])
        self.assertIsNone(v["lines_evaluated"])
        self.assertIsNone(v["ownerless_line_indexes"])
        self.assertIsNone(v["computed_total"])
        self.assertIsNone(v["total_difference"])

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertIn("VERDICT: BUDGET_DESIGN_SOUND", stamp(v))

    def test_non_object_manifest_rejected(self):
        with self.assertRaises(TypeError):
            evaluate(["not", "a", "manifest"])


class MalformedTypeTests(unittest.TestCase):
    """F1 regression (external verification Wave 1): a documented
    field present with the wrong JSON type is rejected with
    ValueError naming the field — never evaluated into a verdict."""

    def test_top_level_string_field_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["budget"] = 2027
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("budget", str(ctx.exception))

    def test_section_as_string_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"scope": "should-be-an-object"})
        self.assertIn("scope", str(ctx.exception))

    def test_lines_as_object_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["lines"] = {"name": "not-a-list"}
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("lines", str(ctx.exception))

    def test_line_entry_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["lines"] = ["not-an-object"]
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("lines[0]", str(ctx.exception))

    def test_line_string_leaf_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["lines"][0]["owner"] = 42
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("lines[0].owner", str(ctx.exception))

    def test_line_numeric_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["lines"][1]["amount"] = "20000"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("lines[1].amount", str(ctx.exception))

    def test_line_numeric_leaf_as_boolean_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["lines"][0]["driver_quantity"] = True
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("lines[0].driver_quantity", str(ctx.exception))

    def test_line_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["lines"][0]["driver_documented"] = "yes"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("lines[0].driver_documented",
                      str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["scope"]["entity_named"] = "yes"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("scope.entity_named", str(ctx.exception))

    def test_numeric_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["totals"]["declared_total"] = "150000"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("totals.declared_total", str(ctx.exception))

    def test_numeric_leaf_as_boolean_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["monitoring"]["rolling_horizon_months"] = True
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("monitoring.rolling_horizon_months",
                      str(ctx.exception))

    def test_vocabulary_leaf_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["scope"]["budget_type"] = 1
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("scope.budget_type", str(ctx.exception))

    def test_null_section_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["totals"] = None
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("totals", str(ctx.exception))

    def test_null_line_entry_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["lines"][1] = None
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("lines[1]", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
