import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from behavioral_finance_bias_check import evaluate, stamp  # noqa: E402

COMPLETE = {
    "decision": "panic-sell-review-2026-11",
    "decision_context": {"is_entry": True, "is_major_move": True},
    "bias_playbook": {
        "loss_aversion_precommitted_exits_set": True,
        "loss_aversion_reunderwritten_instead_of_waiting_to_get_even": True,
        "anchoring_own_valuation_written_before_market_price_targets": True,
        "recency_base_rates_and_long_windows_used": True,
        "overconfidence_sizing_cap_percent": 10,
        "overconfidence_position_size_percent": 8,
        "confirmation_disconfirming_evidence_present": True,
        "sunk_cost_would_buy_today_test_applied": True,
        "biases_considered": [
            {"bias": "loss aversion", "counter_applied": True},
            {"bias": "fomo", "counter_applied": True},
            {"bias": "confirmation", "counter_applied": True}],
    },
    "precommitment": {"written_rules_present": True,
                      "stop_levels_set": True,
                      "thesis_written": True},
    "cooling_off": {"hours_elapsed": 72,
                    "periods_honored_for_impulsive_ideas": True},
    "journal": {"decision_recorded": True,
                "expected_outcome_recorded": True,
                "actual_outcome_and_lessons_recorded": True,
                "current_with_outcomes_and_lessons": True,
                "reviewed_monthly": True,
                "hit_rate_tracked_honestly": True},
    "watch_and_challenge": {
        "continuous_price_watching": False,
        "scheduled_reviews_used": True,
        "notifications_off": True,
        "devils_advocate_round_assigned": True,
        "slept_on_material_changes": True,
        "major_move_discussed_with_advisor_set_documented": True},
    "temptation_and_red_lines": {
        "one_click_trading_paths_removed": True,
        "decision_driven_by_headlines": False,
        "decision_driven_by_streaks": False,
        "decision_driven_by_moods": False,
        "journal_skipped_for_this_decision": False},
}


def check_status(v, name):
    return next(c["status"] for c in v["checks"] if c["check"] == name)


class VerdictTests(unittest.TestCase):
    def test_complete_manifest_is_bias_check_clear(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(v["verdict"], "BIAS_CHECK_CLEAR")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(v["computed_status"],
                         "within_limits_on_declared_evidence")
        self.assertEqual(len(v["checks"]), 30)

    def test_biases_considered_count_reported(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(v["biases_considered_count"], 3)

    def test_size_over_cap_serialized_at_fixed_4dp(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(v["position_size_over_cap_percent"], "-2.0000")
        m = copy.deepcopy(COMPLETE)
        m["bias_playbook"]["overconfidence_position_size_percent"] = 12.5
        self.assertEqual(evaluate(m)["position_size_over_cap_percent"],
                         "2.5000")

    def test_cooling_below_48_serialized_at_fixed_4dp(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(v["cooling_off_hours_below_48"], "-24.0000")
        m = copy.deepcopy(COMPLETE)
        m["cooling_off"]["hours_elapsed"] = 47.5
        self.assertEqual(evaluate(m)["cooling_off_hours_below_48"],
                         "0.5000")

    def test_cooling_off_exactly_48_passes(self):
        m = copy.deepcopy(COMPLETE)
        m["cooling_off"]["hours_elapsed"] = 48
        v = evaluate(m)
        self.assertEqual(v["verdict"], "BIAS_CHECK_CLEAR")
        self.assertEqual(v["cooling_off_hours_below_48"], "0.0000")

    def test_cooling_off_below_48_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["cooling_off"]["hours_elapsed"] = 12
        v = evaluate(m)
        self.assertEqual(v["verdict"], "BIAS_CHECK_FAILED")
        self.assertEqual(v["sections"]["cooling_off"], "fail")
        self.assertEqual(v["computed_status"],
                         "outside_limits_on_declared_evidence")

    def test_position_size_at_cap_passes(self):
        m = copy.deepcopy(COMPLETE)
        m["bias_playbook"]["overconfidence_position_size_percent"] = 10
        self.assertEqual(evaluate(m)["verdict"], "BIAS_CHECK_CLEAR")

    def test_position_size_over_cap_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["bias_playbook"]["overconfidence_position_size_percent"] = 18
        v = evaluate(m)
        self.assertEqual(v["verdict"], "BIAS_CHECK_FAILED")
        self.assertEqual(v["sections"]["bias_playbook"], "fail")
        self.assertEqual(v["computed_status"],
                         "outside_limits_on_declared_evidence")

    def test_missing_sizing_cap_is_missing_not_failed(self):
        m = copy.deepcopy(COMPLETE)
        del m["bias_playbook"]["overconfidence_sizing_cap_percent"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertIsNone(v["position_size_over_cap_percent"])
        self.assertIsNone(v["computed_status"])

    def test_considered_bias_without_counter_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["bias_playbook"]["biases_considered"][1]["counter_applied"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "BIAS_CHECK_FAILED")
        self.assertEqual(
            check_status(v, "all_considered_biases_have_counter_applied"),
            "fail")

    def test_empty_biases_considered_list_fails_not_missing(self):
        m = copy.deepcopy(COMPLETE)
        m["bias_playbook"]["biases_considered"] = []
        v = evaluate(m)
        self.assertEqual(v["verdict"], "BIAS_CHECK_FAILED")
        self.assertEqual(v["biases_considered_count"], 0)

    def test_missing_biases_considered_list_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["bias_playbook"]["biases_considered"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertIsNone(v["biases_considered_count"])

    def test_entry_without_written_thesis_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["precommitment"]["thesis_written"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "BIAS_CHECK_FAILED")
        self.assertEqual(
            check_status(v, "written_thesis_before_entry"), "fail")

    def test_non_entry_passes_thesis_and_cooling_as_not_applicable(self):
        m = copy.deepcopy(COMPLETE)
        m["decision_context"]["is_entry"] = False
        del m["precommitment"]["thesis_written"]
        del m["cooling_off"]["hours_elapsed"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "BIAS_CHECK_CLEAR")
        self.assertIsNone(v["cooling_off_hours_below_48"])

    def test_major_move_without_advisor_discussion_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["watch_and_challenge"][
            "major_move_discussed_with_advisor_set_documented"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "BIAS_CHECK_FAILED")
        self.assertEqual(v["sections"]["watch_and_challenge"], "fail")

    def test_non_major_move_passes_advisor_check_as_not_applicable(self):
        m = copy.deepcopy(COMPLETE)
        m["decision_context"]["is_major_move"] = False
        del m["watch_and_challenge"][
            "major_move_discussed_with_advisor_set_documented"]
        self.assertEqual(evaluate(m)["verdict"], "BIAS_CHECK_CLEAR")

    def test_disconfirming_evidence_absent_fails_quality_gate(self):
        m = copy.deepcopy(COMPLETE)
        m["bias_playbook"][
            "confirmation_disconfirming_evidence_present"] = False
        self.assertEqual(evaluate(m)["verdict"], "BIAS_CHECK_FAILED")

    def test_anchoring_counter_missing_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["bias_playbook"][
            "anchoring_own_valuation_written_before_market_price_targets"] \
            = False
        self.assertEqual(evaluate(m)["verdict"], "BIAS_CHECK_FAILED")

    def test_waiting_to_get_even_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["bias_playbook"][
            "loss_aversion_reunderwritten_instead_of_waiting_to_get_even"] \
            = False
        self.assertEqual(evaluate(m)["verdict"], "BIAS_CHECK_FAILED")

    def test_sunk_cost_test_not_applied_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["bias_playbook"]["sunk_cost_would_buy_today_test_applied"] = False
        self.assertEqual(evaluate(m)["verdict"], "BIAS_CHECK_FAILED")

    def test_cooling_off_not_honored_fails_quality_gate(self):
        m = copy.deepcopy(COMPLETE)
        m["cooling_off"]["periods_honored_for_impulsive_ideas"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "BIAS_CHECK_FAILED")
        self.assertEqual(v["sections"]["cooling_off"], "fail")

    def test_journal_not_current_fails_quality_gate(self):
        m = copy.deepcopy(COMPLETE)
        m["journal"]["current_with_outcomes_and_lessons"] = False
        self.assertEqual(evaluate(m)["verdict"], "BIAS_CHECK_FAILED")

    def test_journal_not_reviewed_monthly_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["journal"]["reviewed_monthly"] = False
        self.assertEqual(evaluate(m)["verdict"], "BIAS_CHECK_FAILED")

    def test_continuous_price_watching_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["watch_and_challenge"]["continuous_price_watching"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "BIAS_CHECK_FAILED")
        self.assertEqual(v["sections"]["watch_and_challenge"], "fail")

    def test_decision_driven_by_headlines_fails_red_line(self):
        m = copy.deepcopy(COMPLETE)
        m["temptation_and_red_lines"]["decision_driven_by_headlines"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "BIAS_CHECK_FAILED")
        self.assertEqual(v["sections"]["temptation_and_red_lines"], "fail")

    def test_decision_driven_by_moods_fails_red_line(self):
        m = copy.deepcopy(COMPLETE)
        m["temptation_and_red_lines"]["decision_driven_by_moods"] = True
        self.assertEqual(evaluate(m)["verdict"], "BIAS_CHECK_FAILED")

    def test_skipped_journal_fails_red_line(self):
        m = copy.deepcopy(COMPLETE)
        m["temptation_and_red_lines"][
            "journal_skipped_for_this_decision"] = True
        self.assertEqual(evaluate(m)["verdict"], "BIAS_CHECK_FAILED")

    def test_one_click_paths_not_removed_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["temptation_and_red_lines"][
            "one_click_trading_paths_removed"] = False
        self.assertEqual(evaluate(m)["verdict"], "BIAS_CHECK_FAILED")

    def test_absent_evidence_is_insufficient_not_failed(self):
        m = copy.deepcopy(COMPLETE)
        del m["journal"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["decision_journal"],
                         "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertIsNone(v["computed_status"])
        self.assertIsNone(v["biases_considered_count"])
        self.assertIsNone(v["position_size_over_cap_percent"])
        self.assertIsNone(v["cooling_off_hours_below_48"])

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertIn("VERDICT: BIAS_CHECK_CLEAR", stamp(v))

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
            evaluate({"journal": "should-be-an-object"})
        self.assertIn("journal", str(ctx.exception))

    def test_list_field_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["bias_playbook"]["biases_considered"] = "loss-aversion"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("bias_playbook.biases_considered",
                      str(ctx.exception))

    def test_list_entry_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["bias_playbook"]["biases_considered"] = ["loss aversion"]
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("bias_playbook.biases_considered[0]",
                      str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["journal"]["reviewed_monthly"] = "yes"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("journal.reviewed_monthly", str(ctx.exception))

    def test_boolean_leaf_in_list_entry_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["bias_playbook"]["biases_considered"][0][
            "counter_applied"] = "yes"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn(
            "bias_playbook.biases_considered[0].counter_applied",
            str(ctx.exception))

    def test_numeric_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["cooling_off"]["hours_elapsed"] = "two days"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("cooling_off.hours_elapsed", str(ctx.exception))

    def test_null_section_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["journal"] = None
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("journal", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
