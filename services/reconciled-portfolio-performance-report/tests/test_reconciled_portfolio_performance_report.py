import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from reconciled_portfolio_performance_report import (  # noqa: E402
    evaluate, stamp, _fmt,
)

# Beginning 10000; period returns are exactly
# [0.03, -0.064815, 0.038462, 0.056604] (to 6dp) by construction:
# 10300/10000-1, 10100/(10300+500)-1, 10600/10100-1 (wait: base is
# 10100+0), 11200/10600-1. Holdings sum to the final value 11200
# and the ledger transactions net to the declared flows (500).
FULL = {
    "portfolio": "test-portfolio",
    "beginning_value": 10000,
    "period_end_values": [10300, 10100, 10600, 11200],
    "external_flows": [0, 500, 0, 0],
    "benchmark_name": "blend-60-40",
    "benchmark_returns": [0.02, -0.05, 0.04, 0.03],
    "holdings": [
        {"id": "A", "quantity": 10, "price": 600},
        {"id": "B", "quantity": 20, "price": 260},
    ],
    "transactions": [
        {"kind": "contribution", "amount": 500},
    ],
}

SIMPLE = {
    "beginning_value": 1000,
    "period_end_values": [1100, 1210],
    "external_flows": [0, 0],
}


class ReconciledPerformanceTests(unittest.TestCase):
    def test_simple_twr_and_irr_agree_without_flows(self):
        v = evaluate(copy.deepcopy(SIMPLE))
        self.assertEqual(v["status"], "complete")
        p = v["performance"]
        self.assertEqual(p["period_returns"], ["0.100000", "0.100000"])
        self.assertEqual(p["time_weighted_return"], "0.210000")
        # 1000 * 1.1^2 = 1210 exactly at r = 0.1.
        self.assertEqual(p["money_weighted_return_per_period"],
                         "0.100000")
        self.assertEqual(p["twr_irr_difference"], "0.110000")
        self.assertEqual(p["mean_period_return"], "0.100000")
        self.assertEqual(p["net_external_flows"], "0.000000")
        self.assertEqual(p["total_gain_after_flows"], "210.000000")
        self.assertEqual(p["value_change"], "210.000000")

    def test_flow_at_period_beginning_is_excluded_from_return(self):
        v = evaluate({
            "beginning_value": 1000,
            "period_end_values": [1100, 1320],
            "external_flows": [0, 100],
        })
        p = v["performance"]
        # 1100/1000 - 1 = 0.1; 1320/(1100+100) - 1 = 0.1.
        self.assertEqual(p["period_returns"], ["0.100000", "0.100000"])
        self.assertEqual(p["time_weighted_return"], "0.210000")
        # 1000*1.1^2 + 100*1.1 = 1320 at r = 0.1.
        self.assertEqual(p["money_weighted_return_per_period"],
                         "0.100000")
        self.assertEqual(p["net_external_flows"], "100.000000")
        self.assertEqual(p["total_gain_after_flows"], "220.000000")
        self.assertEqual(v["status"], "complete")

    def test_full_manifest_is_complete_with_no_gaps(self):
        manifest = copy.deepcopy(FULL)
        computed = evaluate(copy.deepcopy(FULL))["performance"]
        manifest["declared_returns"] = [
            float(x) for x in computed["period_returns"]]
        v = evaluate(manifest)
        # A declared-vs-computed difference below the 6dp report
        # precision is not a gap (discrepancies are findings).
        self.assertEqual(v["status"], "complete")
        self.assertEqual(v["layers"], {
            "values": "present", "performance": "present",
            "reconciliation": "present", "benchmark": "present",
            "holdings": "present"})
        recon = v["reconciliation"]
        self.assertEqual(
            recon["flows_vs_ledger"]["difference"], "0.000000")
        self.assertEqual(
            recon["holdings_vs_declared_value"]["difference"],
            "0.000000")

    def test_full_holdings_and_benchmark(self):
        v = evaluate(copy.deepcopy(FULL))
        h = v["holdings"]
        self.assertEqual(h["total_value"], "11200.000000")
        self.assertEqual(h["largest_holding_id"], "A")
        self.assertEqual(h["largest_holding_share"], "0.535714")
        self.assertEqual(h["rows"][1]["value"], "5200.000000")
        self.assertEqual(h["rows"][1]["share_of_holdings"],
                         "0.464286")
        b = v["benchmark"]
        self.assertTrue(b["aligned"])
        self.assertEqual(b["name"], "blend-60-40")
        # 1.02 * 0.95 * 1.04 * 1.03 - 1 = 0.037993 (chain product)
        self.assertEqual(b["total_return"], "0.037993")
        self.assertEqual(b["mean_return_per_period"], "0.010000")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["status"], "insufficient_evidence")
        self.assertIsNone(v["performance"])
        self.assertEqual(v["layers"]["performance"], "absent")
        self.assertEqual(len(v["gaps"]), 2)

    def test_single_value_is_insufficient_evidence(self):
        v = evaluate({"beginning_value": 1000,
                      "period_end_values": [1100]})
        self.assertEqual(v["status"], "insufficient_evidence")
        v2 = evaluate({"period_end_values": [1100, 1210],
                       "external_flows": [0, 0]})
        self.assertEqual(v2["status"], "insufficient_evidence")

    def test_missing_flows_are_a_gap_never_defaulted(self):
        v = evaluate({"beginning_value": 1000,
                      "period_end_values": [1100, 1210]})
        self.assertEqual(v["status"], "partial")
        p = v["performance"]
        self.assertIsNone(p["period_returns"])
        self.assertIsNone(p["time_weighted_return"])
        self.assertIsNone(p["money_weighted_return_per_period"])
        self.assertEqual(p["value_change"], "210.000000")

    def test_misaligned_flows_are_a_gap(self):
        v = evaluate({"beginning_value": 1000,
                      "period_end_values": [1100, 1210],
                      "external_flows": [0]})
        self.assertEqual(v["status"], "partial")
        self.assertIsNone(v["performance"]["time_weighted_return"])

    def test_invalid_value_entries_excluded_and_counted(self):
        v = evaluate({"beginning_value": 1000,
                      "period_end_values": [1100, "bad", 1210, None],
                      "external_flows": [0, 0]})
        self.assertEqual(v["status"], "partial")
        self.assertEqual(v["counts"]["periods"], 2)
        self.assertEqual(v["counts"]["invalid_value_entries"], 2)
        self.assertEqual(
            v["performance"]["time_weighted_return"], "0.210000")

    def test_non_positive_base_period_is_a_gap(self):
        v = evaluate({"beginning_value": 1000,
                      "period_end_values": [1100, 1210],
                      "external_flows": [-1000, 0]})
        self.assertEqual(v["status"], "partial")
        self.assertIsNone(v["performance"]["period_returns"])
        self.assertTrue(any(g.startswith("period 0:")
                            for g in v["gaps"]))

    def test_irr_without_sign_changing_bracket_is_a_gap(self):
        v = evaluate({"beginning_value": 1000,
                      "period_end_values": [900, -5000],
                      "external_flows": [0, -100]})
        self.assertEqual(v["status"], "partial")
        p = v["performance"]
        self.assertIsNotNone(p["time_weighted_return"])
        self.assertIsNone(p["money_weighted_return_per_period"])
        self.assertIsNone(p["twr_irr_difference"])

    def test_benchmark_misalignment_is_a_gap(self):
        manifest = copy.deepcopy(SIMPLE)
        manifest["benchmark_returns"] = [0.01]
        v = evaluate(manifest)
        self.assertEqual(v["status"], "partial")
        self.assertFalse(v["benchmark"]["aligned"])
        self.assertIsNone(v["benchmark"]["total_return"])

    def test_benchmark_excess_and_periods_ahead(self):
        manifest = copy.deepcopy(SIMPLE)
        manifest["benchmark_returns"] = [0.05, 0.05]
        v = evaluate(manifest)
        b = v["benchmark"]
        # Benchmark total = 1.05^2 - 1 = 0.1025; excess = .21-.1025.
        self.assertEqual(b["total_return"], "0.102500")
        self.assertEqual(b["excess_total_return"], "0.107500")
        self.assertEqual(b["periods_portfolio_ahead"], 2)
        self.assertEqual(v["status"], "complete")

    def test_holdings_discrepancy_is_a_finding_not_a_gap(self):
        manifest = copy.deepcopy(SIMPLE)
        manifest["holdings"] = [{"id": "A", "quantity": 1,
                                 "price": 1000}]
        v = evaluate(manifest)
        self.assertEqual(v["status"], "complete")
        leg = v["reconciliation"]["holdings_vs_declared_value"]
        self.assertEqual(leg["difference"], "-210.000000")
        self.assertEqual(leg["difference_fraction_of_final"],
                         "-0.173554")

    def test_ledger_discrepancy_is_a_finding_not_a_gap(self):
        manifest = copy.deepcopy(FULL)
        manifest["transactions"] = [
            {"kind": "contribution", "amount": 700},
            {"kind": "withdrawal", "amount": 100},
        ]
        v = evaluate(manifest)
        self.assertEqual(v["status"], "complete")
        leg = v["reconciliation"]["flows_vs_ledger"]
        self.assertEqual(leg["ledger_net_external_flows"],
                         "600.000000")
        self.assertEqual(leg["difference"], "-100.000000")

    def test_invalid_holdings_and_transactions_counted(self):
        manifest = copy.deepcopy(SIMPLE)
        manifest["holdings"] = [
            {"id": "A", "quantity": 1, "price": 1210},
            {"id": "B", "quantity": "many", "price": 1},
            "not-an-entry",
        ]
        manifest["transactions"] = [
            {"kind": "contribution", "amount": 10},
            {"kind": "gift", "amount": 5},
            {"kind": "withdrawal", "amount": -3},
        ]
        v = evaluate(manifest)
        self.assertEqual(v["status"], "partial")
        self.assertEqual(v["counts"]["holdings"], 1)
        self.assertEqual(v["counts"]["invalid_holdings"], 2)
        self.assertEqual(v["counts"]["transactions"], 1)
        self.assertEqual(v["counts"]["invalid_transactions"], 2)

    def test_declared_returns_reconciliation_exact(self):
        manifest = copy.deepcopy(SIMPLE)
        manifest["declared_returns"] = [0.1, 0.09]
        v = evaluate(manifest)
        leg = v["reconciliation"]["declared_vs_computed_returns"]
        self.assertTrue(leg["aligned"])
        self.assertEqual(leg["compared_periods"], 2)
        self.assertEqual(leg["differences"],
                         ["0.000000", "0.010000"])
        self.assertEqual(leg["max_abs_difference"], "0.010000")
        self.assertEqual(leg["mismatched_periods"], 1)
        self.assertEqual(v["status"], "complete")

    def test_declared_returns_misalignment_is_a_gap(self):
        manifest = copy.deepcopy(SIMPLE)
        manifest["declared_returns"] = [0.1]
        v = evaluate(manifest)
        self.assertEqual(v["status"], "partial")
        leg = v["reconciliation"]["declared_vs_computed_returns"]
        self.assertFalse(leg["aligned"])

    def test_zero_holdings_total_shares_are_gaps(self):
        manifest = copy.deepcopy(SIMPLE)
        manifest["holdings"] = [{"id": "A", "quantity": 0,
                                 "price": 100}]
        v = evaluate(manifest)
        self.assertEqual(v["status"], "partial")
        self.assertIsNone(v["holdings"]["rows"][0]
                          ["share_of_holdings"])
        self.assertIsNone(v["holdings"]["largest_holding_share"])

    def test_methods_are_stated_and_never_mixed(self):
        v = evaluate(copy.deepcopy(SIMPLE))
        self.assertEqual(v["performance"]["methods"],
                         ["time_weighted_return",
                          "money_weighted_return_per_period"])

    def test_fmt_serialization_rule(self):
        self.assertEqual(_fmt(0.1234567), "0.123457")
        self.assertEqual(_fmt(-2.5), "-2.500000")
        self.assertEqual(_fmt(0), "0.000000")
        self.assertEqual(_fmt(-0.0000001), "0.000000")
        self.assertIsNone(_fmt(None))

    def test_disclaimer_and_stamp(self):
        v = evaluate(copy.deepcopy(SIMPLE))
        self.assertIn("not financial advice", v["disclaimer"])
        text = stamp(v)
        self.assertIn("STATUS: complete", text)
        self.assertIn("user decides", text)

    def test_non_object_manifest_rejected(self):
        with self.assertRaises(TypeError):
            evaluate(["not", "a", "manifest"])


class MalformedTypeTests(unittest.TestCase):
    """F1 regression (external verification Wave 1): a documented
    field present with the wrong JSON type is rejected with
    ValueError naming the field — never evaluated into a report.
    The first case mirrors the recorded external malformed input.
    List fields are container-validated only: their entries are
    documented counted gaps (see the last two tests), never
    rejections."""

    def test_recorded_malformed_case_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"portfolio": 12345,
                      "beginning_value": "one thousand",
                      "period_end_values": "not a list"})
        self.assertIn("portfolio", str(ctx.exception))

    def test_portfolio_as_number_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"portfolio": 12345})
        self.assertIn("portfolio", str(ctx.exception))

    def test_beginning_value_as_string_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"beginning_value": "one thousand"})
        self.assertIn("beginning_value", str(ctx.exception))

    def test_period_end_values_as_string_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"period_end_values": "not a list"})
        self.assertIn("period_end_values", str(ctx.exception))

    def test_external_flows_as_string_rejected(self):
        m = copy.deepcopy(SIMPLE)
        m["external_flows"] = "none"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("external_flows", str(ctx.exception))

    def test_benchmark_returns_as_string_rejected(self):
        m = copy.deepcopy(SIMPLE)
        m["benchmark_returns"] = "up"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("benchmark_returns", str(ctx.exception))

    def test_holdings_as_string_rejected(self):
        m = copy.deepcopy(SIMPLE)
        m["holdings"] = "none"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("holdings", str(ctx.exception))

    def test_transactions_as_string_rejected(self):
        m = copy.deepcopy(SIMPLE)
        m["transactions"] = "none"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("transactions", str(ctx.exception))

    def test_benchmark_name_as_number_rejected(self):
        m = copy.deepcopy(SIMPLE)
        m["benchmark_name"] = 12345
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("benchmark_name", str(ctx.exception))

    def test_null_beginning_value_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"beginning_value": None})
        self.assertIn("beginning_value", str(ctx.exception))

    def test_non_numeric_value_entries_stay_counted_gaps(self):
        # Documented exception: entries inside period_end_values
        # are counted in counts.invalid_value_entries, NOT errors.
        v = evaluate({"beginning_value": 1000,
                      "period_end_values": [1100, "bad", 1210, None],
                      "external_flows": [0, 0]})
        self.assertEqual(v["counts"]["invalid_value_entries"], 2)

    def test_invalid_holding_entries_stay_counted_gaps(self):
        manifest = copy.deepcopy(SIMPLE)
        manifest["holdings"] = [
            {"id": "B", "quantity": "many", "price": 1},
            "not-an-entry",
        ]
        v = evaluate(manifest)
        self.assertEqual(v["counts"]["invalid_holdings"], 2)


class EmptyLedgerTests(unittest.TestCase):
    """F2 regression (external verification Wave 1): a declared
    EMPTY ledger is present evidence, not absence. The first case
    mirrors the recorded external violations input."""

    def test_declared_empty_holdings_are_reconciled(self):
        v = evaluate({"beginning_value": 1000,
                      "period_end_values": [1100, 1210],
                      "external_flows": [0.0],
                      "holdings": []})
        self.assertEqual(v["layers"]["holdings"], "present")
        self.assertEqual(v["layers"]["reconciliation"], "present")
        self.assertEqual(v["holdings"]["total_value"], "0.000000")
        self.assertEqual(v["holdings"]["holdings_count"], 0)
        leg = v["reconciliation"]["holdings_vs_declared_value"]
        self.assertEqual(leg["holdings_total_value"], "0.000000")
        self.assertEqual(leg["difference"], "-1210.000000")
        self.assertEqual(leg["difference_fraction_of_final"],
                         "-1.000000")
        self.assertEqual(v["status"], "partial")

    def test_absent_holdings_stay_absent(self):
        v = evaluate(copy.deepcopy(SIMPLE))
        self.assertEqual(v["layers"]["holdings"], "absent")
        self.assertIsNone(v["holdings"])
        leg = v["reconciliation"]["holdings_vs_declared_value"]
        self.assertIsNone(leg["holdings_total_value"])
        self.assertIsNone(leg["difference"])

    def test_declared_empty_transactions_compute_zero_net(self):
        manifest = copy.deepcopy(SIMPLE)
        manifest["transactions"] = []
        v = evaluate(manifest)
        self.assertEqual(v["layers"]["reconciliation"], "present")
        leg = v["reconciliation"]["flows_vs_ledger"]
        self.assertEqual(leg["ledger_contributions"], "0.000000")
        self.assertEqual(leg["ledger_withdrawals"], "0.000000")
        self.assertEqual(leg["ledger_net_external_flows"], "0.000000")
        self.assertEqual(leg["difference"], "0.000000")
        self.assertEqual(v["status"], "complete")

    def test_absent_transactions_stay_uncomputed(self):
        v = evaluate(copy.deepcopy(SIMPLE))
        leg = v["reconciliation"]["flows_vs_ledger"]
        self.assertIsNone(leg["ledger_net_external_flows"])
        self.assertIsNone(leg["difference"])


if __name__ == "__main__":
    unittest.main()
