import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from portfolio_risk_analytics_report import (  # noqa: E402
    evaluate, stamp, _fmt,
)

FULL = {
    "portfolio": "test-portfolio",
    "returns": [0.03, -0.02, 0.05, 0.01, -0.04, 0.02, 0.06, -0.01],
    "benchmark_returns": [0.02, -0.01, 0.04, 0.005, -0.03, 0.015,
                          0.05, -0.005],
    "periods_per_year": 12,
    "risk_free_per_period": 0.001,
    "var_confidence": 0.95,
    "holdings": [
        {"id": "A", "weight": 50, "currency": "USD"},
        {"id": "B", "weight": 30, "currency": "USD"},
        {"id": "C", "weight": 20, "currency": "CAD", "leveraged": True,
         "income_per_period": 0.03, "financing_per_period": 0.01},
    ],
    "factors": [
        {"name": "market",
         "returns": [0.02, -0.015, 0.04, 0.008, -0.03, 0.012, 0.045,
                     -0.006]},
        {"name": "value",
         "returns": [0.005, 0.002, -0.003, 0.001, 0.004, -0.002,
                     0.006, 0.003]},
    ],
    "holding_returns": [
        {"id": "A",
         "returns": [0.04, -0.01, 0.06, 0.02, -0.03, 0.01, 0.07,
                     -0.02]},
        {"id": "B",
         "returns": [0.02, -0.03, 0.04, 0.00, -0.05, 0.03, 0.05,
                     0.00]},
    ],
    "correlation_window": 4,
    "stress_scenarios": [
        {"name": "gfc-like", "portfolio_return": -0.35},
        {"name": "shock-ab",
         "shocks": [{"holding_id": "A", "return": -0.2},
                    {"holding_id": "B", "return": -0.1},
                    {"holding_id": "C", "return": 0.05}]},
    ],
    "decision_journal": [
        {"confidence": 0.7, "correct": True},
        {"confidence": 0.6, "correct": False},
        {"confidence": 0.8, "correct": True},
    ],
}

PARAMS = {"periods_per_year": 12, "risk_free_per_period": 0.001,
          "var_confidence": 0.95}


def _with_params(manifest):
    out = dict(manifest)
    out.update(PARAMS)
    return out


class RiskAnalyticsTests(unittest.TestCase):
    def test_full_manifest_is_complete_with_no_gaps(self):
        v = evaluate(copy.deepcopy(FULL))
        self.assertEqual(v["status"], "complete")
        self.assertEqual(v["gaps"], [])
        self.assertEqual(v["layers"], {
            "holdings": "present", "risk_metrics": "present",
            "factor_exposures": "present", "concentration": "present",
            "decisions": "present"})

    def test_total_and_mean_return(self):
        v = evaluate(copy.deepcopy(FULL))
        rm = v["risk_metrics"]
        self.assertEqual(rm["mean_return_per_period"], "0.012500")
        self.assertEqual(rm["total_return"], "0.099984")
        self.assertEqual(rm["best_period_return"], "0.060000")
        self.assertEqual(rm["worst_period_return"], "-0.040000")
        self.assertEqual(rm["positive_period_fraction"], "0.625000")

    def test_volatility_and_annualization(self):
        rm = evaluate(copy.deepcopy(FULL))["risk_metrics"]
        self.assertEqual(rm["volatility_per_period"], "0.034538")
        self.assertEqual(rm["annualized_volatility"], "0.119642")
        self.assertEqual(rm["annualized_return"], "0.153665")

    def test_drawdown_path(self):
        rm = evaluate(copy.deepcopy(FULL))["risk_metrics"]
        self.assertEqual(rm["max_drawdown"], "-0.040000")
        self.assertEqual(rm["max_drawdown_peak_period"], 3)
        self.assertEqual(rm["max_drawdown_trough_period"], 4)
        self.assertEqual(rm["current_drawdown"], "-0.010000")
        self.assertEqual(rm["longest_underwater_periods"], 2)

    def test_drawdown_from_initial_capital(self):
        v = evaluate(_with_params(
            {"returns": [0.10, -0.05, 0.02, 0.03, -0.01, 0.04]}))
        rm = v["risk_metrics"]
        self.assertEqual(rm["max_drawdown"], "-0.050000")
        self.assertEqual(rm["max_drawdown_peak_period"], 0)
        self.assertEqual(rm["max_drawdown_trough_period"], 1)
        self.assertEqual(rm["longest_underwater_periods"], 4)
        self.assertEqual(rm["total_return"], "0.130374")

    def test_sharpe_and_sortino(self):
        rm = evaluate(copy.deepcopy(FULL))["risk_metrics"]
        self.assertEqual(rm["downside_deviation_per_period"],
                         "0.016744")
        self.assertEqual(rm["sharpe_per_period"], "0.332969")
        self.assertEqual(rm["sharpe_annualized"], "1.153438")
        self.assertEqual(rm["sortino_per_period"], "0.686797")
        self.assertEqual(rm["sortino_annualized"], "2.379134")

    def test_historical_var_cvar_nearest_rank(self):
        v = evaluate({"returns": [0.10, -0.05, 0.02, 0.03, -0.01,
                                  0.04],
                      "var_confidence": 0.8})
        rm = v["risk_metrics"]
        self.assertEqual(rm["var_confidence"], "0.800000")
        # Sorted: [-0.05, -0.01, 0.02, 0.03, 0.04, 0.10];
        # idx = ceil(0.2*6)-1 = 1 -> VaR = 0.01, CVaR = 0.03.
        self.assertEqual(rm["historical_var"], "0.010000")
        self.assertEqual(rm["historical_cvar"], "0.030000")

    def test_missing_parameters_are_labeled_gaps_not_defaults(self):
        v = evaluate({"returns": [0.02, -0.01, 0.03]})
        self.assertEqual(v["status"], "partial")
        rm = v["risk_metrics"]
        self.assertIsNone(rm["sharpe_per_period"])
        self.assertIsNone(rm["annualized_volatility"])
        self.assertIsNone(rm["historical_var"])
        self.assertEqual(len(v["gaps"]), 3)

    def test_invalid_var_confidence_is_a_gap(self):
        manifest = _with_params({"returns": [0.02, -0.01, 0.03]})
        manifest["var_confidence"] = 1.0
        v = evaluate(manifest)
        self.assertEqual(v["status"], "partial")
        self.assertIsNone(v["risk_metrics"]["historical_var"])

    def test_non_numeric_return_entries_excluded(self):
        v = evaluate(_with_params(
            {"returns": [0.02, "bad", -0.01, None, 0.03, True]}))
        self.assertEqual(v["status"], "partial")
        self.assertEqual(v["counts"]["periods"], 3)
        self.assertEqual(v["counts"]["invalid_return_entries"], 3)

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["status"], "insufficient_evidence")
        self.assertIsNone(v["risk_metrics"])
        self.assertEqual(v["layers"]["risk_metrics"], "absent")

    def test_single_observation_is_insufficient_evidence(self):
        v = evaluate({"returns": [0.05]})
        self.assertEqual(v["status"], "insufficient_evidence")

    def test_non_list_returns_rejected(self):
        # F1 test correction (coordinator ruling, 2026-11-15): the
        # single-observation test previously also asserted an
        # insufficient_evidence verdict over returns as a string —
        # a wrong-typed documented field (the field itself, not an
        # entry; invalid ENTRIES remain counted-and-excluded per
        # SERVICE.md). That assertion encoded the F1 defect itself:
        # returns is documented as a list, so the manifest is
        # rejected with ValueError naming the field.
        with self.assertRaises(ValueError) as ctx:
            evaluate({"returns": "not-a-series"})
        self.assertIn("returns", str(ctx.exception))

    def test_benchmark_beta_and_correlation_exact(self):
        v = evaluate(_with_params({
            "returns": [0.02, 0.04, -0.02, 0.00],
            "benchmark_returns": [0.01, 0.02, -0.01, 0.00]}))
        b = v["benchmark"]
        self.assertTrue(b["aligned"])
        self.assertEqual(b["beta"], "2.000000")
        self.assertEqual(b["correlation"], "1.000000")
        self.assertEqual(v["status"], "complete")

    def test_benchmark_misalignment_is_a_gap(self):
        v = evaluate(_with_params({
            "returns": [0.02, 0.04, -0.02, 0.00],
            "benchmark_returns": [0.01, 0.02]}))
        self.assertEqual(v["status"], "partial")
        self.assertFalse(v["benchmark"]["aligned"])
        self.assertIsNone(v["benchmark"]["beta"])

    def test_concentration_hhi_and_currency_shares(self):
        c = evaluate(copy.deepcopy(FULL))["concentration"]
        self.assertEqual(c["weight_sum"], "100.000000")
        self.assertEqual(c["hhi"], "0.380000")
        self.assertEqual(c["effective_holdings"], "2.631579")
        self.assertEqual(c["largest_holding_id"], "A")
        self.assertEqual(c["largest_holding_share"], "0.500000")
        self.assertEqual(c["currency_shares"], [
            {"currency": "CAD", "share": "0.200000"},
            {"currency": "USD", "share": "0.800000"}])

    def test_zero_weight_sum_is_a_gap(self):
        v = evaluate(_with_params({
            "returns": [0.02, -0.01, 0.03],
            "holdings": [{"id": "A", "weight": 10},
                         {"id": "B", "weight": -10}]}))
        self.assertEqual(v["status"], "partial")
        self.assertIsNone(v["concentration"]["hhi"])

    def test_negative_carry_is_flagged_plainly(self):
        v = evaluate(_with_params({
            "returns": [0.02, -0.01, 0.03],
            "holdings": [
                {"id": "L", "weight": 100, "leveraged": True,
                 "income_per_period": 0.02,
                 "financing_per_period": 0.05}]}))
        carry = v["carry"]
        self.assertEqual(carry["rows"][0]["net_carry_per_period"],
                         "-0.030000")
        self.assertTrue(carry["rows"][0]["negative_carry"])
        self.assertTrue(carry["any_negative_carry"])
        self.assertEqual(v["status"], "complete")

    def test_missing_carry_inputs_are_a_gap(self):
        v = evaluate(_with_params({
            "returns": [0.02, -0.01, 0.03],
            "holdings": [
                {"id": "L", "weight": 100, "leveraged": True,
                 "income_per_period": 0.02}]}))
        self.assertEqual(v["status"], "partial")
        self.assertIsNone(
            v["carry"]["rows"][0]["net_carry_per_period"])
        self.assertIsNone(v["carry"]["rows"][0]["negative_carry"])

    def test_factor_ols_recovers_known_coefficients(self):
        f1 = [0.01, -0.02, 0.03, 0.005, -0.01, 0.02]
        f2 = [0.002, 0.001, -0.004, 0.003, 0.0005, -0.002]
        returns = [0.001 + 1.5 * a - 0.5 * b for a, b in zip(f1, f2)]
        v = evaluate(_with_params({
            "returns": returns,
            "factors": [{"name": "f1", "returns": f1},
                        {"name": "f2", "returns": f2}]}))
        d = v["factor_decomposition"]
        self.assertTrue(d["computable"])
        self.assertEqual(d["intercept_alpha_per_period"], "0.001000")
        self.assertEqual(d["coefficients"], [
            {"factor": "f1", "coefficient": "1.500000"},
            {"factor": "f2", "coefficient": "-0.500000"}])
        self.assertEqual(d["r_squared"], "1.000000")
        self.assertEqual(d["residual_volatility_per_period"],
                         "0.000000")

    def test_singular_factors_are_a_gap(self):
        f1 = [0.01, -0.02, 0.03, 0.005, -0.01, 0.02]
        f2 = [2 * a for a in f1]
        v = evaluate(_with_params({
            "returns": [0.02, -0.01, 0.03, 0.00, -0.02, 0.01],
            "factors": [{"name": "f1", "returns": f1},
                        {"name": "f2", "returns": f2}]}))
        self.assertEqual(v["status"], "partial")
        self.assertFalse(v["factor_decomposition"]["computable"])

    def test_misaligned_factor_series_is_a_gap(self):
        v = evaluate(_with_params({
            "returns": [0.02, -0.01, 0.03],
            "factors": [{"name": "mkt", "returns": [0.01, 0.02]}]}))
        self.assertEqual(v["status"], "partial")
        self.assertFalse(v["factor_decomposition"]["computable"])

    def test_stress_portfolio_return_and_weighted_shocks(self):
        v = evaluate(copy.deepcopy(FULL))
        self.assertEqual(v["stress_tests"], [
            {"name": "gfc-like", "scenario_return": "-0.350000",
             "basis": "portfolio_return"},
            {"name": "shock-ab", "scenario_return": "-0.120000",
             "basis": "holding_shocks"}])

    def test_stress_missing_shock_is_a_gap(self):
        v = evaluate(_with_params({
            "returns": [0.02, -0.01, 0.03],
            "holdings": [{"id": "A", "weight": 60},
                         {"id": "B", "weight": 40}],
            "stress_scenarios": [
                {"name": "partial-shock",
                 "shocks": [{"holding_id": "A", "return": -0.2}]}]}))
        self.assertEqual(v["status"], "partial")
        self.assertIsNone(v["stress_tests"][0]["scenario_return"])
        self.assertEqual(v["stress_tests"][0]["basis"],
                         "not_computable")

    def test_journal_calibration(self):
        v = evaluate(_with_params({
            "returns": [0.02, -0.01, 0.03],
            "decision_journal": [
                {"confidence": 0.7, "correct": True},
                {"confidence": 0.7, "correct": True},
                {"confidence": 0.7, "correct": True},
                {"confidence": 0.7, "correct": False}]}))
        j = v["decision_journal"]
        self.assertEqual(j["mean_confidence"], "0.700000")
        self.assertEqual(j["hit_rate"], "0.750000")
        self.assertEqual(j["calibration_gap"], "0.050000")
        self.assertEqual(j["brier_score"], "0.190000")

    def test_journal_invalid_entries_counted(self):
        v = evaluate(_with_params({
            "returns": [0.02, -0.01, 0.03],
            "decision_journal": [
                {"confidence": 0.7, "correct": True},
                {"confidence": 1.5, "correct": True},
                {"confidence": 0.5},
                "not-an-entry"]}))
        self.assertEqual(v["status"], "partial")
        self.assertEqual(v["counts"]["journal_entries"], 1)
        self.assertEqual(v["counts"]["invalid_journal_entries"], 3)

    def test_holding_correlations_and_max_pair(self):
        v = evaluate(copy.deepcopy(FULL))
        hc = v["holding_correlations"]
        self.assertEqual(hc["series_count"], 2)
        self.assertEqual(hc["pairs"][0]["correlation"], "0.867874")
        self.assertEqual(hc["max_pair"]["correlation"], "0.867874")
        self.assertEqual(hc["window"], 4)
        self.assertEqual(hc["window_pairs"][0]["correlation"],
                         "0.864331")

    def test_constant_holding_series_correlation_is_a_gap(self):
        v = evaluate(_with_params({
            "returns": [0.02, -0.01, 0.03, 0.01],
            "holding_returns": [
                {"id": "A", "returns": [0.01, 0.01, 0.01, 0.01]},
                {"id": "B", "returns": [0.02, -0.01, 0.03, 0.00]}]}))
        self.assertEqual(v["status"], "partial")
        self.assertIsNone(
            v["holding_correlations"]["pairs"][0]["correlation"])
        self.assertIsNone(v["holding_correlations"]["max_pair"])

    def test_invalid_correlation_window_is_a_gap(self):
        v = evaluate(_with_params({
            "returns": [0.02, -0.01, 0.03],
            "holding_returns": [
                {"id": "A", "returns": [0.02, -0.01, 0.03]}],
            "correlation_window": 99}))
        self.assertEqual(v["status"], "partial")
        self.assertIsNone(v["holding_correlations"]["window"])

    def test_constant_returns_zero_volatility(self):
        v = evaluate(_with_params({"returns": [0.01, 0.01, 0.01]}))
        rm = v["risk_metrics"]
        self.assertEqual(v["status"], "partial")
        self.assertEqual(rm["volatility_per_period"], "0.000000")
        self.assertIsNone(rm["sharpe_per_period"])
        self.assertIsNone(rm["sortino_per_period"])
        self.assertEqual(rm["max_drawdown"], "0.000000")
        self.assertEqual(rm["historical_var"], "-0.010000")

    def test_fmt_serialization_rule(self):
        self.assertEqual(_fmt(0.1234567), "0.123457")
        self.assertEqual(_fmt(-2.5), "-2.500000")
        self.assertEqual(_fmt(0), "0.000000")
        self.assertEqual(_fmt(-0.0000001), "0.000000")
        self.assertIsNone(_fmt(None))

    def test_disclaimer_and_stamp(self):
        v = evaluate(copy.deepcopy(FULL))
        self.assertIn("not financial advice", v["disclaimer"])
        text = stamp(v)
        self.assertIn("STATUS: complete", text)
        self.assertIn("portfolio: test-portfolio", text)
        self.assertIn("user decides", text)

    def test_non_object_manifest_rejected(self):
        with self.assertRaises(TypeError):
            evaluate(["not", "a", "manifest"])


class MalformedTypeTests(unittest.TestCase):
    """F1 regression (external verification Wave 1): a documented
    field present with the wrong JSON type is rejected with
    ValueError naming the field — never evaluated into a report.
    The first case mirrors the recorded external malformed input.
    (List entries of the counted-invalid fields stay unvalidated
    per SERVICE.md — see MANIFEST_SPEC; the containers and the
    scalar fields are what this class pins.)"""

    def test_recorded_malformed_case_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"portfolio": 12345, "returns": "not_a_list",
                      "holdings": "should_be_a_list"})
        self.assertIn("portfolio", str(ctx.exception))

    def test_portfolio_as_number_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"portfolio": 12345})
        self.assertIn("portfolio", str(ctx.exception))

    def test_returns_as_string_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"returns": "not_a_list"})
        self.assertIn("returns", str(ctx.exception))

    def test_holdings_as_string_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"holdings": "should_be_a_list"})
        self.assertIn("holdings", str(ctx.exception))

    def test_benchmark_returns_as_string_rejected(self):
        m = _with_params({"returns": [0.02, -0.01, 0.03],
                          "benchmark_returns": "not-a-list"})
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("benchmark_returns", str(ctx.exception))

    def test_parameter_as_string_rejected(self):
        m = _with_params({"returns": [0.02, -0.01, 0.03]})
        m["periods_per_year"] = "12"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("periods_per_year", str(ctx.exception))

    def test_factor_name_as_number_rejected(self):
        m = _with_params({
            "returns": [0.02, -0.01, 0.03],
            "factors": [{"name": 42, "returns": [0.01, 0.02, 0.0]}]})
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("factors[0].name", str(ctx.exception))

    def test_factor_returns_as_string_rejected(self):
        m = _with_params({
            "returns": [0.02, -0.01, 0.03],
            "factors": [{"name": "mkt", "returns": "not-a-list"}]})
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("factors[0].returns", str(ctx.exception))

    def test_null_field_rejected(self):
        m = _with_params({"returns": [0.02, -0.01, 0.03]})
        m["var_confidence"] = None
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("var_confidence", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
