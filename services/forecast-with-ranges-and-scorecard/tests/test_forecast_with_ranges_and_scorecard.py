import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from forecast_with_ranges_and_scorecard import evaluate, stamp  # noqa: E402

# Scorecard arithmetic for READY: errors -10, 0, -10 ->
# MAE 20/3 = 6.67, MAPE (10/110 + 0 + 10/100)/3 * 100 = 6.36,
# bias -20/3 = -6.67 (all declared rounded to two decimals).
READY = {
    "series": "Portfolio revenue",
    "forecast": {
        "purpose_stated": True,
        "horizon_stated": True,
        "decision_cadence_matched": True,
        "owner_named": True,
    },
    "baselines": {
        "naive_value": 95,
        "moving_average_value": 102.5,
        "seasonal_naive_value": 98,
        "compared_to_forecast": True,
        "complex_model_used": True,
        "complex_model_beats_baselines": True,
    },
    "decomposition": {
        "level_trend_seasonality_shown": True,
        "drivers_known": True,
        "driver_based_shown": True,
    },
    "range": {"low": 90, "base": 110, "high": 135},
    "scenarios": [
        {"name": "base", "trigger_condition": "orders track plan"},
        {"name": "best", "trigger_condition": "pipeline closes early"},
        {"name": "worst", "trigger_condition": "churn spikes above 5%"},
    ],
    "scenario_detail": {"sensitivity_shown": True},
    "scorecard": {
        "published": True,
        "tracked_per_series": True,
        "history": [
            {"period": "2026-01", "forecast": 100, "actual": 110},
            {"period": "2026-02", "forecast": 120, "actual": 120},
            {"period": "2026-03", "forecast": 90, "actual": 100},
        ],
        "declared_mae": 6.67,
        "declared_mape_percent": 6.36,
        "declared_bias": -6.67,
    },
    "revision": {
        "forecast_actual_history_preserved": True,
        "revisions_made": True,
        "revision_reasons_documented": True,
        "silently_restated": False,
    },
    "cadence": {
        "rolling_forecast_maintained": True,
        "cadence_matches_review_rhythm": True,
        "forecast_updated_on_cadence": True,
    },
}


class VerdictTests(unittest.TestCase):
    def test_ready_manifest_is_forecast_ready(self):
        v = evaluate(copy.deepcopy(READY))
        self.assertEqual(v["verdict"], "FORECAST_READY")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(v["history_entries_evaluated"], 3)
        self.assertEqual(v["scenarios_evaluated"], 3)
        self.assertEqual(len(v["checks"]), 25)

    def test_forecast_without_owner_fails(self):
        m = copy.deepcopy(READY)
        m["forecast"]["owner_named"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "FORECAST_NOT_READY")
        self.assertEqual(v["sections"]["purpose_and_horizon"], "fail")

    def test_missing_baseline_value_is_insufficient_evidence(self):
        m = copy.deepcopy(READY)
        del m["baselines"]["seasonal_naive_value"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["baselines_and_decomposition"],
                         "insufficient_evidence")

    def test_non_numeric_baseline_value_rejected(self):
        # F1 test correction (coordinator ruling, 2026-11-15): this
        # test previously asserted a FORECAST_NOT_READY verdict over
        # a wrong-typed documented field — that assertion encoded
        # the F1 defect itself. A non-numeric baseline value is a
        # caller error, rejected with ValueError naming the field.
        m = copy.deepcopy(READY)
        m["baselines"]["naive_value"] = "last month"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("baselines.naive_value", str(ctx.exception))

    def test_complex_model_not_beating_baselines_fails(self):
        m = copy.deepcopy(READY)
        m["baselines"]["complex_model_beats_baselines"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "FORECAST_NOT_READY")
        self.assertEqual(v["sections"]["baselines_and_decomposition"],
                         "fail")

    def test_no_complex_model_passes_beats_check_as_not_applicable(self):
        m = copy.deepcopy(READY)
        m["baselines"]["complex_model_used"] = False
        del m["baselines"]["complex_model_beats_baselines"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "FORECAST_READY")

    def test_drivers_known_without_driver_based_forecast_fails(self):
        m = copy.deepcopy(READY)
        m["decomposition"]["driver_based_shown"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "FORECAST_NOT_READY")

    def test_no_known_drivers_passes_driver_check_as_not_applicable(self):
        m = copy.deepcopy(READY)
        m["decomposition"]["drivers_known"] = False
        del m["decomposition"]["driver_based_shown"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "FORECAST_READY")

    def test_bare_point_range_fails(self):
        m = copy.deepcopy(READY)
        m["range"] = {"low": 110, "base": 110, "high": 110}
        v = evaluate(m)
        self.assertEqual(v["verdict"], "FORECAST_NOT_READY")
        self.assertEqual(v["sections"]["ranges_and_scenarios"], "fail")

    def test_disordered_range_fails(self):
        m = copy.deepcopy(READY)
        m["range"] = {"low": 120, "base": 110, "high": 135}
        v = evaluate(m)
        self.assertEqual(v["verdict"], "FORECAST_NOT_READY")

    def test_range_at_boundary_low_equals_base_passes(self):
        m = copy.deepcopy(READY)
        m["range"] = {"low": 110, "base": 110, "high": 135}
        v = evaluate(m)
        self.assertEqual(v["verdict"], "FORECAST_READY")

    def test_missing_range_is_insufficient_evidence(self):
        m = copy.deepcopy(READY)
        del m["range"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["ranges_and_scenarios"],
                         "insufficient_evidence")

    def test_scenarios_missing_worst_case_fail(self):
        m = copy.deepcopy(READY)
        m["scenarios"] = m["scenarios"][:2]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "FORECAST_NOT_READY")
        self.assertEqual(v["sections"]["ranges_and_scenarios"], "fail")

    def test_scenario_without_trigger_fails(self):
        m = copy.deepcopy(READY)
        del m["scenarios"][2]["trigger_condition"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "FORECAST_NOT_READY")

    def test_declared_mae_mismatch_fails_scorecard(self):
        m = copy.deepcopy(READY)
        m["scorecard"]["declared_mae"] = 2.5
        v = evaluate(m)
        self.assertEqual(v["verdict"], "FORECAST_NOT_READY")
        self.assertEqual(v["sections"]["scorecard_accuracy"], "fail")

    def test_declared_mae_just_outside_tolerance_fails(self):
        m = copy.deepcopy(READY)
        m["scorecard"]["declared_mae"] = 6.68
        v = evaluate(m)
        self.assertEqual(v["verdict"], "FORECAST_NOT_READY")
        self.assertEqual(v["sections"]["scorecard_accuracy"], "fail")

    def test_declared_bias_mismatch_fails_scorecard(self):
        m = copy.deepcopy(READY)
        m["scorecard"]["declared_bias"] = 6.67
        v = evaluate(m)
        self.assertEqual(v["verdict"], "FORECAST_NOT_READY")
        self.assertEqual(v["sections"]["scorecard_accuracy"], "fail")

    def test_history_entry_missing_actual_is_insufficient_evidence(self):
        m = copy.deepcopy(READY)
        del m["scorecard"]["history"][0]["actual"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["scorecard_accuracy"],
                         "insufficient_evidence")
        self.assertEqual(v["history_entries_evaluated"], 2)

    def test_zero_actuals_make_mape_unverifiable(self):
        m = copy.deepcopy(READY)
        for entry in m["scorecard"]["history"]:
            entry["actual"] = 0
        m["scorecard"]["declared_mae"] = 103.33
        m["scorecard"]["declared_bias"] = 103.33
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["scorecard_accuracy"],
                         "insufficient_evidence")

    def test_silent_restatement_fails_revision_hygiene(self):
        m = copy.deepcopy(READY)
        m["revision"]["silently_restated"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "FORECAST_NOT_READY")
        self.assertEqual(v["sections"]["revision_hygiene"], "fail")

    def test_revision_without_reason_fails(self):
        m = copy.deepcopy(READY)
        m["revision"]["revision_reasons_documented"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "FORECAST_NOT_READY")

    def test_no_revisions_passes_reasons_check_as_not_applicable(self):
        m = copy.deepcopy(READY)
        m["revision"]["revisions_made"] = False
        del m["revision"]["revision_reasons_documented"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "FORECAST_READY")

    def test_absent_evidence_is_insufficient_not_failed(self):
        m = copy.deepcopy(READY)
        del m["cadence"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["cadence"],
                         "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["history_entries_evaluated"], 0)
        self.assertEqual(v["scenarios_evaluated"], 0)

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(READY))
        self.assertIn("VERDICT: FORECAST_READY", stamp(v))

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
            evaluate({"baselines": {
                "naive_value": "not_a_number",
                "moving_average_value": 100,
                "seasonal_naive_value": 100}})
        self.assertIn("baselines.naive_value", str(ctx.exception))

    def test_baseline_leaf_as_string_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"baselines": {"naive_value": "not_a_number"}})
        self.assertIn("baselines.naive_value", str(ctx.exception))

    def test_section_as_string_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"baselines": "not-an-object"})
        self.assertIn("baselines", str(ctx.exception))

    def test_range_leaf_as_string_rejected(self):
        m = copy.deepcopy(READY)
        m["range"]["low"] = "low"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("range.low", str(ctx.exception))

    def test_list_field_as_string_rejected(self):
        m = copy.deepcopy(READY)
        m["scenarios"] = "not-a-list"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("scenarios", str(ctx.exception))

    def test_list_entry_field_as_number_rejected(self):
        m = copy.deepcopy(READY)
        m["scenarios"][0]["name"] = 42
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("scenarios[0].name", str(ctx.exception))

    def test_nested_history_entry_field_as_string_rejected(self):
        m = copy.deepcopy(READY)
        m["scorecard"]["history"][0]["forecast"] = "soon"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("scorecard.history[0].forecast",
                      str(ctx.exception))

    def test_null_field_rejected(self):
        m = copy.deepcopy(READY)
        m["range"] = None
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("range", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
