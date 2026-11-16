import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from bias_controlled_quant_study_pack import evaluate, stamp  # noqa: E402

COMPLETE = {
    "study": "Momentum among large-cap energy names, 2015-2025",
    "hypothesis": {"hypothesis_written": True,
                   "prediction_stated": True,
                   "falsification_test_defined": True,
                   "results_looked_at_before_registration": False},
    "data": {"provenance_documented": True,
             "snapshot_version_documented": True,
             "adjusted_prices": True,
             "delisted_names_retained": True,
             "survivorship_gap_present": False,
             "point_in_time_fundamentals": True,
             "restatement_peeking": False,
             "timezone_timestamp_discipline": True},
    "distribution": {"fat_tails_considered": True,
                     "volatility_clustering_considered": True,
                     "gaussian_assumed": False,
                     "crisis_correlations_considered": True},
    "stationarity": {"stability_tested": True,
                      "stability_periods": ["2015-2019", "2020-2022",
                                            "2023-2025"],
                      "regime_context_provided": True,
                      "mechanism_stated": True,
                      "claim_made_without_regime_context": False},
    "multiple_testing": {"controlled": True,
                          "deflated_significance_applied": True,
                          "holdout_used": True,
                          "signals_tested": 10000,
                          "signals_reported": 3,
                          "p_hacked_screen_presented_as_strategy": False,
                          "result_from_single_sample": False},
    "costs": {"costs_included": True,
              "included": ["spreads", "fees", "slippage", "borrow",
                           "taxes"],
              "results_net_of_costs": True},
    "reproducibility": {"seeded_runs": True,
                         "snapshot_pinned": True,
                         "code_versioned": True,
                         "rerunnable_by_others": True},
}


def check_status(v, name):
    return next(c["status"] for c in v["checks"] if c["check"] == name)


class VerdictTests(unittest.TestCase):
    def test_complete_manifest_is_study_pack_complete(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(v["verdict"], "STUDY_PACK_COMPLETE")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(v["computed_status"],
                         "within_stated_limits_on_declared_evidence")
        self.assertEqual(len(v["checks"]), 34)
        self.assertEqual(v["stability_period_count"], 3)
        self.assertEqual(v["signals_tested"], 10000)
        self.assertEqual(v["signals_reported"], 3)
        self.assertEqual(v["signals_reported_minus_tested"], -9997)
        self.assertEqual(v["costs_not_included"], [])

    def test_results_seen_before_registration_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["hypothesis"]["results_looked_at_before_registration"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "STUDY_PACK_NOT_COMPLETE")
        self.assertEqual(v["sections"]["hypothesis_preregistration"],
                         "fail")

    def test_falsification_not_defined_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["hypothesis"]["falsification_test_defined"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "STUDY_PACK_NOT_COMPLETE")

    def test_survivorship_gap_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["data"]["survivorship_gap_present"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "STUDY_PACK_NOT_COMPLETE")
        self.assertEqual(v["sections"]["data_hygiene"], "fail")

    def test_delisted_names_not_retained_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["data"]["delisted_names_retained"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "STUDY_PACK_NOT_COMPLETE")

    def test_restatement_peeking_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["data"]["restatement_peeking"] = True
        self.assertEqual(evaluate(m)["verdict"],
                         "STUDY_PACK_NOT_COMPLETE")

    def test_unadjusted_prices_fail(self):
        m = copy.deepcopy(COMPLETE)
        m["data"]["adjusted_prices"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "STUDY_PACK_NOT_COMPLETE")

    def test_gaussian_assumed_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["distribution"]["gaussian_assumed"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "STUDY_PACK_NOT_COMPLETE")
        self.assertEqual(v["sections"]["distribution_reality"], "fail")

    def test_fat_tails_not_considered_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["distribution"]["fat_tails_considered"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "STUDY_PACK_NOT_COMPLETE")

    def test_single_stability_period_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["stationarity"]["stability_periods"] = ["2020-2025"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "STUDY_PACK_NOT_COMPLETE")
        self.assertEqual(
            check_status(v, "stability_periods_cover_multiple_periods"),
            "fail")
        self.assertEqual(v["stability_period_count"], 1)
        self.assertEqual(v["computed_status"],
                         "outside_stated_limits_on_declared_evidence")

    def test_repeated_period_is_still_one_period(self):
        m = copy.deepcopy(COMPLETE)
        m["stationarity"]["stability_periods"] = ["2020-2022",
                                                   "2020-2022"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "STUDY_PACK_NOT_COMPLETE")
        self.assertEqual(v["stability_period_count"], 1)

    def test_two_distinct_periods_pass(self):
        m = copy.deepcopy(COMPLETE)
        m["stationarity"]["stability_periods"] = ["2015-2019",
                                                   "2020-2025"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "STUDY_PACK_COMPLETE")
        self.assertEqual(v["stability_period_count"], 2)

    def test_empty_period_list_fails_not_missing(self):
        m = copy.deepcopy(COMPLETE)
        m["stationarity"]["stability_periods"] = []
        v = evaluate(m)
        self.assertEqual(v["verdict"], "STUDY_PACK_NOT_COMPLETE")
        self.assertEqual(
            check_status(v, "stability_periods_cover_multiple_periods"),
            "fail")
        self.assertEqual(v["stability_period_count"], 0)

    def test_missing_period_list_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["stationarity"]["stability_periods"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertIsNone(v["stability_period_count"])
        self.assertIsNone(v["computed_status"])

    def test_claim_without_regime_context_fails_red_line(self):
        m = copy.deepcopy(COMPLETE)
        m["stationarity"]["claim_made_without_regime_context"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "STUDY_PACK_NOT_COMPLETE")
        self.assertEqual(v["sections"]["stationarity_and_stability"],
                         "fail")

    def test_curve_fit_without_mechanism_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["stationarity"]["mechanism_stated"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "STUDY_PACK_NOT_COMPLETE")

    def test_reported_above_tested_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["multiple_testing"]["signals_tested"] = 10
        m["multiple_testing"]["signals_reported"] = 12
        v = evaluate(m)
        self.assertEqual(v["verdict"], "STUDY_PACK_NOT_COMPLETE")
        self.assertEqual(
            check_status(v, "reported_signals_within_tested_count"),
            "fail")
        self.assertEqual(v["signals_reported_minus_tested"], 2)
        self.assertEqual(v["computed_status"],
                         "outside_stated_limits_on_declared_evidence")

    def test_reported_equal_to_tested_passes(self):
        m = copy.deepcopy(COMPLETE)
        m["multiple_testing"]["signals_tested"] = 5
        m["multiple_testing"]["signals_reported"] = 5
        self.assertEqual(evaluate(m)["verdict"], "STUDY_PACK_COMPLETE")

    def test_fractional_signal_count_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["multiple_testing"]["signals_reported"] = 2.5
        v = evaluate(m)
        self.assertEqual(v["verdict"], "STUDY_PACK_NOT_COMPLETE")
        self.assertEqual(
            check_status(v, "reported_signals_within_tested_count"),
            "fail")

    def test_negative_signal_count_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["multiple_testing"]["signals_tested"] = -4
        self.assertEqual(evaluate(m)["verdict"],
                         "STUDY_PACK_NOT_COMPLETE")

    def test_missing_signal_counts_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["multiple_testing"]["signals_tested"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "reported_signals_within_tested_count"),
            "missing")
        self.assertIsNone(v["signals_tested"])
        self.assertEqual(v["signals_reported"], 3)
        self.assertIsNone(v["signals_reported_minus_tested"])

    def test_phacked_screen_presented_as_strategy_fails_red_line(self):
        m = copy.deepcopy(COMPLETE)
        m["multiple_testing"][
            "p_hacked_screen_presented_as_strategy"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "STUDY_PACK_NOT_COMPLETE")
        self.assertEqual(v["sections"]["multiple_testing"], "fail")

    def test_single_lucky_sample_fails_red_line(self):
        m = copy.deepcopy(COMPLETE)
        m["multiple_testing"]["result_from_single_sample"] = True
        self.assertEqual(evaluate(m)["verdict"],
                         "STUDY_PACK_NOT_COMPLETE")

    def test_holdout_not_used_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["multiple_testing"]["holdout_used"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "STUDY_PACK_NOT_COMPLETE")

    def test_cost_coverage_missing_one_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["costs"]["included"] = [
            c for c in m["costs"]["included"] if c != "borrow"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "STUDY_PACK_NOT_COMPLETE")
        self.assertEqual(v["costs_not_included"], ["borrow"])
        self.assertEqual(
            check_status(v, "all_stated_costs_included"), "fail")

    def test_cost_empty_list_fails_not_missing(self):
        m = copy.deepcopy(COMPLETE)
        m["costs"]["included"] = []
        v = evaluate(m)
        self.assertEqual(v["verdict"], "STUDY_PACK_NOT_COMPLETE")
        self.assertEqual(v["costs_not_included"],
                         ["spreads", "fees", "slippage", "borrow",
                          "taxes"])

    def test_cost_unknown_entries_do_not_satisfy_coverage(self):
        m = copy.deepcopy(COMPLETE)
        m["costs"]["included"] = ["commissions", "margin_interest"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "STUDY_PACK_NOT_COMPLETE")
        self.assertEqual(len(v["costs_not_included"]), 5)

    def test_cost_extra_entries_beyond_stated_pass(self):
        m = copy.deepcopy(COMPLETE)
        m["costs"]["included"] = m["costs"]["included"] + ["commissions"]
        self.assertEqual(evaluate(m)["verdict"], "STUDY_PACK_COMPLETE")

    def test_missing_cost_list_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["costs"]["included"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertIsNone(v["costs_not_included"])

    def test_results_gross_of_costs_fail(self):
        m = copy.deepcopy(COMPLETE)
        m["costs"]["results_net_of_costs"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "STUDY_PACK_NOT_COMPLETE")
        self.assertEqual(v["sections"]["costs"], "fail")

    def test_unseeded_runs_fail(self):
        m = copy.deepcopy(COMPLETE)
        m["reproducibility"]["seeded_runs"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "STUDY_PACK_NOT_COMPLETE")
        self.assertEqual(v["sections"]["reproducibility"], "fail")

    def test_absent_section_is_insufficient_not_failed(self):
        m = copy.deepcopy(COMPLETE)
        del m["reproducibility"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["reproducibility"],
                         "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertIsNone(v["computed_status"])
        self.assertIsNone(v["stability_period_count"])
        self.assertIsNone(v["signals_tested"])
        self.assertIsNone(v["signals_reported"])
        self.assertIsNone(v["signals_reported_minus_tested"])
        self.assertIsNone(v["costs_not_included"])

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertIn("VERDICT: STUDY_PACK_COMPLETE", stamp(v))

    def test_non_object_manifest_rejected(self):
        with self.assertRaises(TypeError):
            evaluate(["not", "a", "manifest"])


class MalformedTypeTests(unittest.TestCase):
    """F1 regression (external verification Wave 1): a documented
    field present with the wrong JSON type is rejected with
    ValueError naming the field — never evaluated into a verdict."""

    def test_top_level_string_field_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["study"] = 12345
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("study", str(ctx.exception))

    def test_section_as_string_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"data": "should-be-an-object"})
        self.assertIn("data", str(ctx.exception))

    def test_null_section_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["costs"] = None
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("costs", str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["hypothesis"]["hypothesis_written"] = "yes"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("hypothesis.hypothesis_written",
                      str(ctx.exception))

    def test_boolean_leaf_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["data"]["delisted_names_retained"] = 1
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("data.delisted_names_retained",
                      str(ctx.exception))

    def test_numeric_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["multiple_testing"]["signals_tested"] = "10000"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("multiple_testing.signals_tested",
                      str(ctx.exception))

    def test_numeric_leaf_as_boolean_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["multiple_testing"]["signals_reported"] = True
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("multiple_testing.signals_reported",
                      str(ctx.exception))

    def test_null_leaf_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["distribution"]["gaussian_assumed"] = None
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("distribution.gaussian_assumed",
                      str(ctx.exception))

    def test_list_field_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["costs"]["included"] = "spreads"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("costs.included", str(ctx.exception))

    def test_list_entry_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["stationarity"]["stability_periods"] = ["2015-2019", 42]
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("stationarity.stability_periods[1]",
                      str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
