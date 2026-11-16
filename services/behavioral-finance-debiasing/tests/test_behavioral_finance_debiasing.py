import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from behavioral_finance_debiasing import evaluate, stamp  # noqa: E402

COMPLETE = {
    "decision": "panic-sell-debias-2026-11",
    "context": {"is_big_trade": True},
    "bias_screening": {
        "loss_aversion_screened": True,
        "disposition_effect_screened": True,
        "mental_accounting_screened": True,
        "anchoring_to_purchase_price_screened": True,
        "recency_availability_screened": True,
        "herding_fomo_screened": True,
        "overconfidence_illusion_of_control_screened": True,
        "confirmation_screened": True,
        "sunk_cost_screened": True,
        "home_bias_screened": True,
        "narrative_bias_screened": True},
    "bias_patterns": {"found": [
        {"bias": "loss aversion", "technique_named": True,
         "surfaced_to_user": True},
        {"bias": "disposition effect", "technique_named": True,
         "surfaced_to_user": True}]},
    "prospect_theory": {
        "reference_point_identified": True,
        "framed_vs_reference_not_absolute_wealth": True,
        "loss_asymmetry_acknowledged": True,
        "risk_attitude_by_domain_checked": True,
        "probability_weighting_checked": True},
    "precommitment": {
        "investment_policy_statement_present": True,
        "written_sell_criteria_present": True,
        "rules_decided_before_emotion_arrives": True,
        "rebalancing_target_allocation_percent": 60,
        "rebalancing_current_allocation_percent": 63,
        "rebalancing_band_percent": 5},
    "journal_and_checklists": {
        "decision_journal_reasoning_recorded": True,
        "decisions_reviewed_separately_from_outcomes": True,
        "base_rates_used": True,
        "checklists_used": True,
        "cooling_off_period_taken": True},
    "whole_portfolio": {
        "reframed_in_whole_portfolio_absolute_terms": True,
        "single_position_pnl_framing_used": False,
        "position_value": 5000,
        "whole_portfolio_value": 100000},
    "guardrails": {
        "bias_patterns_surfaced_to_user": True,
        "tool_calculates_user_decides": True,
        "not_advice_line_respected": True,
        "biases_used_to_manipulate": False,
        "trade_nudge_present": False,
        "markets_assumed_perfectly_efficient_or_irrational": False,
        "single_bias_treated_as_whole_story": False},
}


def check_status(v, name):
    return next(c["status"] for c in v["checks"] if c["check"] == name)


class VerdictTests(unittest.TestCase):
    def test_complete_manifest_is_debiased(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(v["verdict"], "DEBIASED")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(v["computed_status"],
                         "within_declared_band_on_declared_evidence")
        self.assertEqual(len(v["checks"]), 36)

    def test_bias_patterns_found_count_reported(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(v["bias_patterns_found_count"], 2)

    def test_drift_over_band_serialized_at_fixed_4dp(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(v["allocation_drift_over_band_percent"],
                         "-2.0000")
        m = copy.deepcopy(COMPLETE)
        m["precommitment"]["rebalancing_current_allocation_percent"] = 72
        self.assertEqual(evaluate(m)["allocation_drift_over_band_percent"],
                         "7.0000")

    def test_position_share_serialized_at_fixed_4dp(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(v["position_share_percent_of_portfolio"],
                         "5.0000")
        m = copy.deepcopy(COMPLETE)
        m["whole_portfolio"]["position_value"] = 3333
        self.assertEqual(evaluate(m)["position_share_percent_of_portfolio"],
                         "3.3330")

    def test_position_share_null_when_portfolio_value_zero(self):
        m = copy.deepcopy(COMPLETE)
        m["whole_portfolio"]["whole_portfolio_value"] = 0
        v = evaluate(m)
        self.assertIsNone(v["position_share_percent_of_portfolio"])
        self.assertEqual(v["verdict"], "DEBIASED")

    def test_allocation_at_band_edge_passes(self):
        m = copy.deepcopy(COMPLETE)
        m["precommitment"]["rebalancing_current_allocation_percent"] = 65
        v = evaluate(m)
        self.assertEqual(v["verdict"], "DEBIASED")
        self.assertEqual(v["allocation_drift_over_band_percent"], "0.0000")

    def test_allocation_below_target_within_band_passes(self):
        m = copy.deepcopy(COMPLETE)
        m["precommitment"]["rebalancing_current_allocation_percent"] = 56
        self.assertEqual(evaluate(m)["verdict"], "DEBIASED")

    def test_allocation_outside_band_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["precommitment"]["rebalancing_current_allocation_percent"] = 78
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_DEBIASED")
        self.assertEqual(v["sections"]["precommitment_rules"], "fail")
        self.assertEqual(v["computed_status"],
                         "outside_declared_band_on_declared_evidence")

    def test_missing_band_value_is_missing_not_failed(self):
        m = copy.deepcopy(COMPLETE)
        del m["precommitment"]["rebalancing_band_percent"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertIsNone(v["allocation_drift_over_band_percent"])
        self.assertIsNone(v["computed_status"])

    def test_found_pattern_without_technique_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["bias_patterns"]["found"][0]["technique_named"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_DEBIASED")
        self.assertEqual(
            check_status(v, "all_found_patterns_have_technique_named"),
            "fail")

    def test_found_pattern_not_surfaced_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["bias_patterns"]["found"][1]["surfaced_to_user"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_DEBIASED")
        self.assertEqual(
            check_status(v, "all_found_patterns_surfaced_to_user"),
            "fail")

    def test_empty_found_list_passes_pattern_checks(self):
        m = copy.deepcopy(COMPLETE)
        m["bias_patterns"]["found"] = []
        v = evaluate(m)
        self.assertEqual(v["verdict"], "DEBIASED")
        self.assertEqual(v["bias_patterns_found_count"], 0)

    def test_missing_found_list_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["bias_patterns"]["found"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertIsNone(v["bias_patterns_found_count"])

    def test_unscreened_bias_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["bias_screening"]["narrative_bias_screened"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_DEBIASED")
        self.assertEqual(v["sections"]["bias_screening"], "fail")

    def test_disposition_effect_not_screened_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["bias_screening"]["disposition_effect_screened"] = False
        self.assertEqual(evaluate(m)["verdict"], "NOT_DEBIASED")

    def test_reference_point_not_identified_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["prospect_theory"]["reference_point_identified"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_DEBIASED")
        self.assertEqual(v["sections"]["prospect_theory_reframing"],
                         "fail")

    def test_loss_asymmetry_not_acknowledged_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["prospect_theory"]["loss_asymmetry_acknowledged"] = False
        self.assertEqual(evaluate(m)["verdict"], "NOT_DEBIASED")

    def test_no_investment_policy_statement_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["precommitment"]["investment_policy_statement_present"] = False
        self.assertEqual(evaluate(m)["verdict"], "NOT_DEBIASED")

    def test_rules_decided_after_emotion_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["precommitment"]["rules_decided_before_emotion_arrives"] = False
        self.assertEqual(evaluate(m)["verdict"], "NOT_DEBIASED")

    def test_big_trade_without_cooling_off_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["journal_and_checklists"]["cooling_off_period_taken"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_DEBIASED")
        self.assertEqual(
            check_status(v, "cooling_off_period_taken_before_big_trade"),
            "fail")

    def test_non_big_trade_passes_cooling_off_as_not_applicable(self):
        m = copy.deepcopy(COMPLETE)
        m["context"]["is_big_trade"] = False
        del m["journal_and_checklists"]["cooling_off_period_taken"]
        self.assertEqual(evaluate(m)["verdict"], "DEBIASED")

    def test_decisions_not_reviewed_separately_from_outcomes_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["journal_and_checklists"][
            "decisions_reviewed_separately_from_outcomes"] = False
        self.assertEqual(evaluate(m)["verdict"], "NOT_DEBIASED")

    def test_base_rates_not_used_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["journal_and_checklists"]["base_rates_used"] = False
        self.assertEqual(evaluate(m)["verdict"], "NOT_DEBIASED")

    def test_single_position_pnl_framing_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["whole_portfolio"]["single_position_pnl_framing_used"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_DEBIASED")
        self.assertEqual(v["sections"]["whole_portfolio_reframing"],
                         "fail")

    def test_not_reframed_in_whole_portfolio_terms_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["whole_portfolio"][
            "reframed_in_whole_portfolio_absolute_terms"] = False
        self.assertEqual(evaluate(m)["verdict"], "NOT_DEBIASED")

    def test_biases_used_to_manipulate_fails_anti_pattern(self):
        m = copy.deepcopy(COMPLETE)
        m["guardrails"]["biases_used_to_manipulate"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_DEBIASED")
        self.assertEqual(v["sections"]["guardrails_and_anti_patterns"],
                         "fail")

    def test_trade_nudge_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["guardrails"]["trade_nudge_present"] = True
        self.assertEqual(evaluate(m)["verdict"], "NOT_DEBIASED")

    def test_single_bias_as_whole_story_fails_anti_pattern(self):
        m = copy.deepcopy(COMPLETE)
        m["guardrails"]["single_bias_treated_as_whole_story"] = True
        self.assertEqual(evaluate(m)["verdict"], "NOT_DEBIASED")

    def test_perfect_efficiency_or_irrationality_assumption_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["guardrails"][
            "markets_assumed_perfectly_efficient_or_irrational"] = True
        self.assertEqual(evaluate(m)["verdict"], "NOT_DEBIASED")

    def test_not_advice_line_not_respected_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["guardrails"]["not_advice_line_respected"] = False
        self.assertEqual(evaluate(m)["verdict"], "NOT_DEBIASED")

    def test_tool_decides_instead_of_user_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["guardrails"]["tool_calculates_user_decides"] = False
        self.assertEqual(evaluate(m)["verdict"], "NOT_DEBIASED")

    def test_absent_evidence_is_insufficient_not_failed(self):
        m = copy.deepcopy(COMPLETE)
        del m["prospect_theory"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["prospect_theory_reframing"],
                         "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertIsNone(v["computed_status"])
        self.assertIsNone(v["bias_patterns_found_count"])
        self.assertIsNone(v["allocation_drift_over_band_percent"])
        self.assertIsNone(v["position_share_percent_of_portfolio"])

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertIn("VERDICT: DEBIASED", stamp(v))

    def test_non_object_manifest_rejected(self):
        with self.assertRaises(TypeError):
            evaluate(["not", "a", "manifest"])


class MalformedTypeTests(unittest.TestCase):
    """F1 regression (external verification Wave 1): a documented
    field present with the wrong JSON type is rejected with
    ValueError naming the field — never evaluated into a verdict."""

    def test_top_level_string_field_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["decision"] = 12345
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("decision", str(ctx.exception))

    def test_section_as_string_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"guardrails": "should-be-an-object"})
        self.assertIn("guardrails", str(ctx.exception))

    def test_list_field_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["bias_patterns"]["found"] = "loss-aversion"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("bias_patterns.found", str(ctx.exception))

    def test_list_entry_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["bias_patterns"]["found"] = ["loss aversion"]
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("bias_patterns.found[0]", str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["bias_screening"]["sunk_cost_screened"] = "yes"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("bias_screening.sunk_cost_screened",
                      str(ctx.exception))

    def test_boolean_leaf_in_list_entry_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["bias_patterns"]["found"][0]["technique_named"] = "yes"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("bias_patterns.found[0].technique_named",
                      str(ctx.exception))

    def test_numeric_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["precommitment"]["rebalancing_band_percent"] = "five"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("precommitment.rebalancing_band_percent",
                      str(ctx.exception))

    def test_null_section_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["guardrails"] = None
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("guardrails", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
