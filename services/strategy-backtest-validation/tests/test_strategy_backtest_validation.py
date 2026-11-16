import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from strategy_backtest_validation import evaluate, stamp  # noqa: E402

VALIDATED = {
    "strategy": "Momentum rotation v3",
    "harness": {"deterministic_runs": True,
                "data_snapshots_versioned": True,
                "point_in_time_universe": True,
                "look_ahead_used": False,
                "realistic_fills_modeled": True},
    "protocol": {"hypothesis_stated": True,
                 "in_sample_reported": True,
                 "out_of_sample_reported": True,
                 "holdout_untouched_until_end": True,
                 "walk_forward_reported": True,
                 "reported_side_by_side": True},
    "costs": {"commissions_modeled": True,
              "spreads_modeled": True,
              "slippage_modeled": True,
              "borrow_modeled": True,
              "financing_modeled": True,
              "taxes_material": True,
              "taxes_modeled": True,
              "costs_skipped": False},
    "overfit": {"parameter_sensitivity_shown": True,
                "sensitivity_shows_smooth_plateau": True,
                "parameter_count": 6,
                "observation_count": 1200,
                "best_of_n_disclosed": True,
                "curve_fit_parameters_used": False},
    "fragility": {"single_name_dominance_checked": True,
                  "regime_dependence_checked": True,
                  "capacity_liquidity_checked": True},
    "paper": {"period_or_fill_count_defined": True,
              "completed": True,
              "waived": False,
              "live_vs_model_compared": True},
    "monitoring": {"divergence_tracked": True,
                   "kill_criteria_defined_before_scaling": True,
                   "kill_criteria_cover_all_three": True},
    "house_gates": {"explicit_confirmation_for_live_trades": True,
                    "max_planned_trade_usd": 1500,
                    "clear_yes_for_trades_over_500": True,
                    "backtest_used_as_sole_live_confirmation": False},
}


class VerdictTests(unittest.TestCase):
    def test_validated_manifest_is_validated(self):
        v = evaluate(copy.deepcopy(VALIDATED))
        self.assertEqual(v["verdict"], "VALIDATED")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(len(v["checks"]), 36)

    def test_computed_outputs(self):
        v = evaluate(copy.deepcopy(VALIDATED))
        self.assertEqual(v["results_sets_reported"], 3)
        self.assertEqual(v["params_to_data_ratio"], "0.0050")
        self.assertEqual(v["paper_gate_status"], "completed")
        self.assertIs(v["over_500_trade_declared"], True)

    def test_look_ahead_fails_harness_red_line(self):
        m = copy.deepcopy(VALIDATED)
        m["harness"]["look_ahead_used"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_VALIDATED")
        self.assertEqual(v["sections"]["harness_standards"], "fail")

    def test_unrealistic_fills_fail(self):
        m = copy.deepcopy(VALIDATED)
        m["harness"]["realistic_fills_modeled"] = False
        self.assertEqual(evaluate(m)["verdict"], "NOT_VALIDATED")

    def test_oos_not_reported_fails_protocol(self):
        m = copy.deepcopy(VALIDATED)
        m["protocol"]["out_of_sample_reported"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_VALIDATED")
        self.assertEqual(v["sections"]["protocol_and_reporting"], "fail")
        self.assertEqual(v["results_sets_reported"], 2)

    def test_holdout_touched_fails(self):
        m = copy.deepcopy(VALIDATED)
        m["protocol"]["holdout_untouched_until_end"] = False
        self.assertEqual(evaluate(m)["verdict"], "NOT_VALIDATED")

    def test_not_reported_side_by_side_fails_quality_gate(self):
        m = copy.deepcopy(VALIDATED)
        m["protocol"]["reported_side_by_side"] = False
        self.assertEqual(evaluate(m)["verdict"], "NOT_VALIDATED")

    def test_unmodeled_commissions_fail_costs(self):
        m = copy.deepcopy(VALIDATED)
        m["costs"]["commissions_modeled"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_VALIDATED")
        self.assertEqual(v["sections"]["costs_and_frictions"], "fail")

    def test_skipped_costs_fail_red_line(self):
        m = copy.deepcopy(VALIDATED)
        m["costs"]["costs_skipped"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_VALIDATED")
        self.assertEqual(v["sections"]["costs_and_frictions"], "fail")

    def test_taxes_material_but_not_modeled_fails(self):
        m = copy.deepcopy(VALIDATED)
        m["costs"]["taxes_modeled"] = False
        self.assertEqual(evaluate(m)["verdict"], "NOT_VALIDATED")

    def test_taxes_not_material_passes_without_modeling(self):
        m = copy.deepcopy(VALIDATED)
        m["costs"]["taxes_material"] = False
        del m["costs"]["taxes_modeled"]
        self.assertEqual(evaluate(m)["verdict"], "VALIDATED")

    def test_taxes_material_evidence_absent_is_insufficient(self):
        m = copy.deepcopy(VALIDATED)
        del m["costs"]["taxes_modeled"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["costs_and_frictions"],
                         "insufficient_evidence")

    def test_curve_fit_parameters_fail_red_line(self):
        m = copy.deepcopy(VALIDATED)
        m["overfit"]["curve_fit_parameters_used"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_VALIDATED")
        self.assertEqual(v["sections"]["overfit_and_fragility"], "fail")

    def test_sharp_peak_sensitivity_fails(self):
        m = copy.deepcopy(VALIDATED)
        m["overfit"]["sensitivity_shows_smooth_plateau"] = False
        self.assertEqual(evaluate(m)["verdict"], "NOT_VALIDATED")

    def test_ratio_recomputed_with_no_acceptance_bar(self):
        m = copy.deepcopy(VALIDATED)
        m["overfit"]["parameter_count"] = 900
        v = evaluate(m)
        # A high ratio is reported, never failed: the skill states
        # no numeric bar.
        self.assertEqual(v["verdict"], "VALIDATED")
        self.assertEqual(v["params_to_data_ratio"], "0.7500")

    def test_ratio_zero_observations_fails(self):
        m = copy.deepcopy(VALIDATED)
        m["overfit"]["observation_count"] = 0
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_VALIDATED")
        self.assertIsNone(v["params_to_data_ratio"])

    def test_ratio_counts_absent_is_insufficient(self):
        m = copy.deepcopy(VALIDATED)
        del m["overfit"]["parameter_count"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertIsNone(v["params_to_data_ratio"])

    def test_regime_dependence_not_checked_fails(self):
        m = copy.deepcopy(VALIDATED)
        m["fragility"]["regime_dependence_checked"] = False
        self.assertEqual(evaluate(m)["verdict"], "NOT_VALIDATED")

    def test_paper_gate_not_completed_or_waived_fails(self):
        m = copy.deepcopy(VALIDATED)
        m["paper"]["completed"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_VALIDATED")
        self.assertEqual(v["sections"]["paper_gate"], "fail")
        self.assertEqual(v["paper_gate_status"], "not_completed")

    def test_paper_waiver_with_reason_and_approval_validates(self):
        m = copy.deepcopy(VALIDATED)
        m["paper"] = {"period_or_fill_count_defined": True,
                      "completed": False,
                      "waived": True,
                      "waiver_written_reason": True,
                      "waiver_approval_recorded": True}
        v = evaluate(m)
        self.assertEqual(v["verdict"], "VALIDATED")
        self.assertEqual(v["paper_gate_status"], "waived")

    def test_paper_waiver_without_reason_fails(self):
        m = copy.deepcopy(VALIDATED)
        m["paper"] = {"period_or_fill_count_defined": True,
                      "completed": False,
                      "waived": True,
                      "waiver_written_reason": False,
                      "waiver_approval_recorded": True}
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_VALIDATED")
        self.assertEqual(v["sections"]["paper_gate"], "fail")

    def test_paper_waiver_reason_absent_is_insufficient(self):
        m = copy.deepcopy(VALIDATED)
        m["paper"] = {"period_or_fill_count_defined": True,
                      "completed": False,
                      "waived": True,
                      "waiver_approval_recorded": True}
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")

    def test_live_vs_model_not_compared_fails(self):
        m = copy.deepcopy(VALIDATED)
        m["paper"]["live_vs_model_compared"] = False
        self.assertEqual(evaluate(m)["verdict"], "NOT_VALIDATED")

    def test_kill_criteria_not_defined_fails(self):
        m = copy.deepcopy(VALIDATED)
        m["monitoring"]["kill_criteria_defined_before_scaling"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_VALIDATED")
        self.assertEqual(
            v["sections"]["live_monitoring_and_house_gates"], "fail")

    def test_trade_over_500_without_clear_yes_fails(self):
        m = copy.deepcopy(VALIDATED)
        m["house_gates"]["clear_yes_for_trades_over_500"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_VALIDATED")
        self.assertIs(v["over_500_trade_declared"], True)

    def test_trade_at_exactly_500_does_not_bind_clear_yes(self):
        m = copy.deepcopy(VALIDATED)
        m["house_gates"]["max_planned_trade_usd"] = 500
        del m["house_gates"]["clear_yes_for_trades_over_500"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "VALIDATED")
        self.assertIs(v["over_500_trade_declared"], False)

    def test_trade_over_500_clear_yes_absent_is_insufficient(self):
        m = copy.deepcopy(VALIDATED)
        del m["house_gates"]["clear_yes_for_trades_over_500"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertIs(v["over_500_trade_declared"], True)

    def test_backtest_alone_as_confirmation_fails_red_line(self):
        m = copy.deepcopy(VALIDATED)
        m["house_gates"]["backtest_used_as_sole_live_confirmation"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_VALIDATED")
        self.assertEqual(
            v["sections"]["live_monitoring_and_house_gates"], "fail")

    def test_absent_evidence_is_insufficient_not_failed(self):
        m = copy.deepcopy(VALIDATED)
        del m["costs"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["costs_and_frictions"],
                         "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["results_sets_reported"], 0)
        self.assertIsNone(v["params_to_data_ratio"])
        self.assertIsNone(v["paper_gate_status"])
        self.assertIsNone(v["over_500_trade_declared"])

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(VALIDATED))
        self.assertIn("VERDICT: VALIDATED", stamp(v))

    def test_non_object_manifest_rejected(self):
        with self.assertRaises(TypeError):
            evaluate(["not", "a", "manifest"])


class MalformedTypeTests(unittest.TestCase):
    """F1 regression (external verification Wave 1): a documented
    field present with the wrong JSON type is rejected with
    ValueError naming the field — never evaluated into a verdict.
    The first case mirrors the recorded external malformed input."""

    def test_recorded_malformed_case_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"strategy": "Malformed-Input",
                      "harness": "should_be_an_object"})
        self.assertIn("harness", str(ctx.exception))

    def test_section_as_string_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"harness": "should_be_an_object"})
        self.assertIn("harness", str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(VALIDATED)
        m["harness"]["deterministic_runs"] = "yes"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("harness.deterministic_runs", str(ctx.exception))

    def test_parameter_count_as_string_rejected(self):
        m = copy.deepcopy(VALIDATED)
        m["overfit"]["parameter_count"] = "six"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("overfit.parameter_count", str(ctx.exception))

    def test_observation_count_as_string_rejected(self):
        m = copy.deepcopy(VALIDATED)
        m["overfit"]["observation_count"] = "many"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("overfit.observation_count", str(ctx.exception))

    def test_max_planned_trade_as_string_rejected(self):
        m = copy.deepcopy(VALIDATED)
        m["house_gates"]["max_planned_trade_usd"] = "1500"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("house_gates.max_planned_trade_usd",
                      str(ctx.exception))

    def test_null_field_rejected(self):
        m = copy.deepcopy(VALIDATED)
        m["costs"] = None
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("costs", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
