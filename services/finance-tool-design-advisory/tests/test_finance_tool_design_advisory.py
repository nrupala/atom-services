import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from finance_tool_design_advisory import evaluate, stamp  # noqa: E402

COMPLETE = {
    "tool": "savings-teacher",
    "compliance": {"tool_calculates_user_decides": True,
                   "recommendation_language_present": False,
                   "disclaimers_carried": True,
                   "finra_2214_and_csa_framing_addressed": True,
                   "advice_like_language_redesigned_to_scenarios": True},
    "margin": {"margin_features_present": True,
               "margin_disclosure_carried": True},
    "quant": {"risk_and_return_presented_together": True,
              "diversification_and_correlation_addressed": True,
              "mpt_limits_disclosed": True,
              "factor_thinking_addressed": True,
              "regime_awareness_addressed": True,
              "tax_and_fee_aware_returns": True},
    "features": [
        {"name": "scenario-explorer",
         "shows_scenarios_and_tradeoffs": True,
         "implies_advice_present": False,
         "figures_traceable": True,
         "is_backtest": False},
        {"name": "backtest-viewer",
         "shows_scenarios_and_tradeoffs": True,
         "implies_advice_present": False,
         "figures_traceable": True,
         "is_backtest": True,
         "overfit_and_survivorship_addressed": True},
        {"name": "risk-dashboard",
         "shows_scenarios_and_tradeoffs": True,
         "implies_advice_present": False,
         "figures_traceable": True,
         "is_backtest": False},
    ],
    "open_building_blocks": {"open_data_sources_used": True,
                             "open_source_analytics_used": True,
                             "every_number_reproducible_and_auditable": True},
    "privacy": {"zero_knowledge_design": True,
                "user_held_keys": True,
                "data_selling_present": False},
    "business_model": {
        "monetization_via_certification_membership_or_developer_licenses": True,
        "core_features_gated_present": False},
    "behavioral": {"biases_accounted_for": True,
                   "decision_history_used_as_insight": True},
    "anti_patterns": {
        "guaranteed_or_return_promising_language_present": False,
        "black_box_risk_numbers_present": False,
        "fees_taxes_slippage_ignored_present": False,
        "overfit_backtests_present": False,
        "survivorship_bias_present": False},
}


def check_status(v, name):
    return next(c["status"] for c in v["checks"] if c["check"] == name)


class VerdictTests(unittest.TestCase):
    def test_complete_manifest_is_sound(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(v["verdict"], "FINANCE_TOOL_DESIGN_SOUND")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(len(v["checks"]), 32)
        self.assertEqual(v["computed_status"],
                         "within_stated_limits_on_declared_evidence")
        self.assertEqual(v["features_count"], 3)
        self.assertEqual(v["features_without_scenarios_and_tradeoffs"], [])
        self.assertEqual(v["scenario_coverage"], "1.000000")
        self.assertEqual(v["features_implying_advice"], [])
        self.assertEqual(v["features_without_traceable_figures"], [])
        self.assertEqual(v["traceability_coverage"], "1.000000")
        self.assertEqual(
            v["backtest_features_without_overfit_survivorship_address"], [])

    def test_recommendation_language_fails_compliance_section(self):
        m = copy.deepcopy(COMPLETE)
        m["compliance"]["recommendation_language_present"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "FINANCE_TOOL_DESIGN_NOT_SOUND")
        self.assertEqual(
            v["sections"]["compliance_and_advice_boundary"], "fail")
        self.assertEqual(
            check_status(v, "no_recommendation_language"), "fail")

    def test_tool_deciding_for_user_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["compliance"]["tool_calculates_user_decides"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "FINANCE_TOOL_DESIGN_NOT_SOUND")

    def test_no_disclaimers_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["compliance"]["disclaimers_carried"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "FINANCE_TOOL_DESIGN_NOT_SOUND")

    def test_margin_disclosure_missing_when_margin_present_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["margin"]["margin_disclosure_carried"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "margin_disclosure_when_margin_features"),
            "fail")

    def test_no_margin_features_passes_margin_check_as_na(self):
        m = copy.deepcopy(COMPLETE)
        m["margin"] = {"margin_features_present": False}
        v = evaluate(m)
        self.assertEqual(v["verdict"], "FINANCE_TOOL_DESIGN_SOUND")
        self.assertEqual(
            check_status(v, "margin_disclosure_when_margin_features"),
            "pass")

    def test_margin_target_missing_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["margin"]["margin_disclosure_carried"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "margin_disclosure_when_margin_features"),
            "missing")

    def test_mpt_limits_not_disclosed_fails_quant_section(self):
        m = copy.deepcopy(COMPLETE)
        m["quant"]["mpt_limits_disclosed"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "FINANCE_TOOL_DESIGN_NOT_SOUND")
        self.assertEqual(v["sections"]["quant_fundamentals"], "fail")

    def test_gross_only_returns_fail(self):
        m = copy.deepcopy(COMPLETE)
        m["quant"]["tax_and_fee_aware_returns"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "FINANCE_TOOL_DESIGN_NOT_SOUND")

    def test_feature_without_scenarios_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["features"][0]["shows_scenarios_and_tradeoffs"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "FINANCE_TOOL_DESIGN_NOT_SOUND")
        self.assertEqual(
            check_status(v, "every_feature_shows_scenarios_and_tradeoffs"),
            "fail")
        self.assertEqual(v["features_without_scenarios_and_tradeoffs"],
                         ["scenario-explorer"])
        self.assertEqual(v["scenario_coverage"], "0.666667")
        self.assertEqual(v["computed_status"],
                         "outside_stated_limits_on_declared_evidence")

    def test_feature_missing_scenarios_field_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["features"][0]["shows_scenarios_and_tradeoffs"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "every_feature_shows_scenarios_and_tradeoffs"),
            "missing")
        self.assertEqual(v["features_without_scenarios_and_tradeoffs"], [])

    def test_feature_implying_advice_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["features"][2]["implies_advice_present"] = True
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "no_feature_implies_advice"), "fail")
        self.assertEqual(v["features_implying_advice"], ["risk-dashboard"])

    def test_feature_without_traceable_figures_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["features"][1]["figures_traceable"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_feature_figures_traceable"), "fail")
        self.assertEqual(v["features_without_traceable_figures"],
                         ["backtest-viewer"])
        self.assertEqual(v["traceability_coverage"], "0.666667")

    def test_empty_features_list_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["features"] = []
        v = evaluate(m)
        self.assertEqual(check_status(v, "features_declared"), "fail")
        self.assertEqual(v["features_count"], 0)
        self.assertIsNone(v["scenario_coverage"])
        self.assertIsNone(v["traceability_coverage"])

    def test_data_selling_fails_privacy(self):
        m = copy.deepcopy(COMPLETE)
        m["privacy"]["data_selling_present"] = True
        v = evaluate(m)
        self.assertEqual(check_status(v, "no_data_selling"), "fail")
        self.assertEqual(
            v["sections"]["reproducibility_privacy_and_open_finance"],
            "fail")

    def test_non_zero_knowledge_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["privacy"]["zero_knowledge_design"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "FINANCE_TOOL_DESIGN_NOT_SOUND")

    def test_core_features_gated_fails_business_section(self):
        m = copy.deepcopy(COMPLETE)
        m["business_model"]["core_features_gated_present"] = True
        v = evaluate(m)
        self.assertEqual(check_status(v, "no_core_features_gated"), "fail")
        self.assertEqual(
            v["sections"]["business_model_and_behavioral_design"], "fail")

    def test_biases_not_accounted_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["behavioral"]["biases_accounted_for"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "FINANCE_TOOL_DESIGN_NOT_SOUND")

    def test_guaranteed_language_fails_anti_patterns(self):
        m = copy.deepcopy(COMPLETE)
        m["anti_patterns"][
            "guaranteed_or_return_promising_language_present"] = True
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v, "no_guaranteed_or_return_promising_language"), "fail")
        self.assertEqual(v["sections"]["anti_patterns"], "fail")

    def test_black_box_risk_numbers_fail(self):
        m = copy.deepcopy(COMPLETE)
        m["anti_patterns"]["black_box_risk_numbers_present"] = True
        self.assertEqual(evaluate(m)["verdict"],
                         "FINANCE_TOOL_DESIGN_NOT_SOUND")

    def test_backtest_without_address_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["features"][1]["overfit_and_survivorship_addressed"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "FINANCE_TOOL_DESIGN_NOT_SOUND")
        self.assertEqual(
            check_status(
                v,
                "every_backtest_feature_addresses_overfit_and_survivorship"),
            "fail")
        self.assertEqual(
            v["backtest_features_without_overfit_survivorship_address"],
            ["backtest-viewer"])

    def test_backtest_missing_address_field_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["features"][1]["overfit_and_survivorship_addressed"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(
                v,
                "every_backtest_feature_addresses_overfit_and_survivorship"),
            "missing")
        self.assertEqual(
            v["backtest_features_without_overfit_survivorship_address"], [])

    def test_no_backtest_features_passes_backtest_check_as_na(self):
        m = copy.deepcopy(COMPLETE)
        m["features"][1]["is_backtest"] = False
        del m["features"][1]["overfit_and_survivorship_addressed"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "FINANCE_TOOL_DESIGN_SOUND")
        self.assertEqual(
            check_status(
                v,
                "every_backtest_feature_addresses_overfit_and_survivorship"),
            "pass")

    def test_absent_evidence_is_insufficient_not_failed(self):
        m = copy.deepcopy(COMPLETE)
        del m["quant"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["quant_fundamentals"],
                         "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertTrue(
            all(c["status"] == "missing" for c in v["checks"]))
        self.assertIsNone(v["computed_status"])
        self.assertIsNone(v["features_count"])
        self.assertIsNone(v["features_without_scenarios_and_tradeoffs"])
        self.assertIsNone(v["scenario_coverage"])
        self.assertIsNone(v["features_implying_advice"])
        self.assertIsNone(v["features_without_traceable_figures"])
        self.assertIsNone(v["traceability_coverage"])
        self.assertIsNone(
            v["backtest_features_without_overfit_survivorship_address"])

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertIn("VERDICT: FINANCE_TOOL_DESIGN_SOUND", stamp(v))

    def test_non_object_manifest_rejected(self):
        with self.assertRaises(TypeError):
            evaluate(["not", "a", "manifest"])


class MalformedTypeTests(unittest.TestCase):
    def test_string_field_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["tool"] = 12345
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("tool", str(ctx.exception))

    def test_object_section_as_string_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"quant": "should-be-an-object"})
        self.assertIn("quant", str(ctx.exception))

    def test_list_field_as_object_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"features": {"name": "scenario-explorer"}})
        self.assertIn("features", str(ctx.exception))

    def test_list_entry_as_string_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"features": ["scenario-explorer"]})
        self.assertIn("features[0]", str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["quant"]["mpt_limits_disclosed"] = "yes"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("quant.mpt_limits_disclosed", str(ctx.exception))

    def test_nested_list_entry_string_field_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["features"][0]["name"] = 42
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("features[0].name", str(ctx.exception))

    def test_nested_list_entry_boolean_field_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["features"][1]["is_backtest"] = "yes"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("features[1].is_backtest", str(ctx.exception))

    def test_null_section_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["privacy"] = None
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("privacy", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
