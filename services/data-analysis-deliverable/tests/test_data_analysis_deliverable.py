import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from data_analysis_deliverable import evaluate, stamp  # noqa: E402

COMPLETE = {
    "question": "Should we expand the onboarding experiment?",
    "framing": {"question_stated": True,
                "decision_named": True,
                "decision_owner_named": True,
                "decision_deadline_stated": True,
                "data_that_would_change_decision_stated": True},
    "data": {"sources": ["product_events", "billing_ledger"],
             "provenance_documented": True,
             "coverage_documented": True,
             "definitions_documented": True,
             "metrics_have_single_definition": True,
             "gaps_documented": True,
             "biases_documented": True},
    "analysis": {"distributions_shown": True,
                 "segments_shown": True,
                 "trends_on_comparable_windows": True,
                 "cherry_picked_baselines_used": False,
                 "decomposition_performed": True,
                 "cohort_views_shown": True,
                 "mechanisms_triangulated": True},
    "figures": {"values": [10, 20, 30, 40],
                "stated_total": 100,
                "stated_mean": 25,
                "prior_window_value": 80,
                "current_window_value": 100,
                "stated_percent_change": 25},
    "inference": {"sample_size_or_power_considered": True,
                  "uncertainty_stated": True,
                  "practical_vs_statistical_significance_distinguished": True,
                  "multiple_comparisons_checked": True,
                  "causal_claims_from_observational_data_alone": False},
    "recommendation": {"so_what_stated": True,
                       "recommendation_made": True,
                       "expected_effect_stated": True,
                       "recommendation_owner_named": True,
                       "measurement_plan_stated": True,
                       "uncertainty_stated_plainly": True},
    "report": {"covers_question_data_method_finding_recommendation_caveats": True,
               "is_one_page": True,
               "caveats_stated": True,
               "charts_oversell_findings": False,
               "numbers_reproducible": True},
    "closure": {"predicted_vs_actual_compared": True,
                "model_of_world_updated": True},
}


def check_status(v, name):
    return next(c["status"] for c in v["checks"] if c["check"] == name)


class VerdictTests(unittest.TestCase):
    def test_complete_manifest_is_deliverable_complete(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(v["verdict"], "DELIVERABLE_COMPLETE")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(v["computed_status"],
                         "within_stated_limits_on_declared_evidence")
        self.assertEqual(len(v["checks"]), 40)
        self.assertEqual(v["recomputed_total"], "100.000000")
        self.assertEqual(v["recomputed_mean"], "25.000000")
        self.assertEqual(v["recomputed_percent_change"], "25.000000")

    def test_figures_at_other_values_pass(self):
        m = copy.deepcopy(COMPLETE)
        m["figures"] = {"values": [5, 15],
                        "stated_total": 20,
                        "stated_mean": 10,
                        "prior_window_value": 50,
                        "current_window_value": 40,
                        "stated_percent_change": -20}
        v = evaluate(m)
        self.assertEqual(v["verdict"], "DELIVERABLE_COMPLETE")
        self.assertEqual(v["recomputed_percent_change"], "-20.000000")

    def test_stated_total_mismatch_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["figures"]["stated_total"] = 101
        v = evaluate(m)
        self.assertEqual(v["verdict"], "DELIVERABLE_NOT_COMPLETE")
        self.assertEqual(v["sections"]["descriptive_and_diagnostic"], "fail")
        self.assertEqual(
            check_status(v, "stated_total_matches_declared_values"), "fail")
        self.assertEqual(v["computed_status"],
                         "outside_stated_limits_on_declared_evidence")

    def test_stated_mean_mismatch_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["figures"]["stated_mean"] = 26
        v = evaluate(m)
        self.assertEqual(v["verdict"], "DELIVERABLE_NOT_COMPLETE")
        self.assertEqual(
            check_status(v, "stated_mean_matches_declared_values"), "fail")

    def test_stated_percent_change_mismatch_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["figures"]["stated_percent_change"] = 20
        v = evaluate(m)
        self.assertEqual(v["verdict"], "DELIVERABLE_NOT_COMPLETE")
        self.assertEqual(
            check_status(
                v, "stated_percent_change_matches_declared_windows"),
            "fail")

    def test_zero_prior_window_fails_percent_change(self):
        m = copy.deepcopy(COMPLETE)
        m["figures"]["prior_window_value"] = 0
        m["figures"]["stated_percent_change"] = 0
        v = evaluate(m)
        self.assertEqual(v["verdict"], "DELIVERABLE_NOT_COMPLETE")
        self.assertIsNone(v["recomputed_percent_change"])

    def test_empty_values_list_fails_computed(self):
        m = copy.deepcopy(COMPLETE)
        m["figures"]["values"] = []
        v = evaluate(m)
        self.assertEqual(v["verdict"], "DELIVERABLE_NOT_COMPLETE")
        self.assertEqual(
            check_status(v, "stated_total_matches_declared_values"), "fail")
        self.assertIsNone(v["recomputed_total"])
        self.assertIsNone(v["recomputed_mean"])

    def test_missing_figure_inputs_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["figures"]["stated_mean"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "stated_mean_matches_declared_values"),
            "missing")
        self.assertIsNone(v["computed_status"])
        self.assertEqual(v["recomputed_mean"], "25.000000")

    def test_missing_values_list_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["figures"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertIsNone(v["recomputed_total"])
        self.assertIsNone(v["recomputed_percent_change"])

    def test_question_not_stated_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["framing"]["question_stated"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "DELIVERABLE_NOT_COMPLETE")
        self.assertEqual(v["sections"]["question_framing"], "fail")

    def test_decision_owner_not_named_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["framing"]["decision_owner_named"] = False
        self.assertEqual(evaluate(m)["verdict"], "DELIVERABLE_NOT_COMPLETE")

    def test_no_data_sources_declared_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["data"]["sources"] = []
        v = evaluate(m)
        self.assertEqual(v["verdict"], "DELIVERABLE_NOT_COMPLETE")
        self.assertEqual(
            check_status(v, "data_sources_declared"), "fail")

    def test_missing_data_sources_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["data"]["sources"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "data_sources_declared"), "missing")

    def test_provenance_not_documented_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["data"]["provenance_documented"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "DELIVERABLE_NOT_COMPLETE")
        self.assertEqual(v["sections"]["data_provenance"], "fail")

    def test_metric_with_two_definitions_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["data"]["metrics_have_single_definition"] = False
        self.assertEqual(evaluate(m)["verdict"], "DELIVERABLE_NOT_COMPLETE")

    def test_cherry_picked_baselines_fail(self):
        m = copy.deepcopy(COMPLETE)
        m["analysis"]["cherry_picked_baselines_used"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "DELIVERABLE_NOT_COMPLETE")
        self.assertEqual(
            check_status(v, "no_cherry_picked_baselines"), "fail")

    def test_distributions_not_shown_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["analysis"]["distributions_shown"] = False
        self.assertEqual(evaluate(m)["verdict"], "DELIVERABLE_NOT_COMPLETE")

    def test_causal_claims_from_observational_alone_fail_red_line(self):
        m = copy.deepcopy(COMPLETE)
        m["inference"]["causal_claims_from_observational_data_alone"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "DELIVERABLE_NOT_COMPLETE")
        self.assertEqual(v["sections"]["statistical_care"], "fail")

    def test_multiple_comparisons_not_checked_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["inference"]["multiple_comparisons_checked"] = False
        self.assertEqual(evaluate(m)["verdict"], "DELIVERABLE_NOT_COMPLETE")

    def test_uncertainty_not_stated_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["inference"]["uncertainty_stated"] = False
        self.assertEqual(evaluate(m)["verdict"], "DELIVERABLE_NOT_COMPLETE")

    def test_recommendation_without_owner_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["recommendation"]["recommendation_owner_named"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "DELIVERABLE_NOT_COMPLETE")
        self.assertEqual(v["sections"]["insight_and_action"], "fail")

    def test_recommendation_without_measurement_plan_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["recommendation"]["measurement_plan_stated"] = False
        self.assertEqual(evaluate(m)["verdict"], "DELIVERABLE_NOT_COMPLETE")

    def test_charts_that_oversell_fail_red_line(self):
        m = copy.deepcopy(COMPLETE)
        m["report"]["charts_oversell_findings"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "DELIVERABLE_NOT_COMPLETE")
        self.assertEqual(
            v["sections"]["reporting_and_reproducibility"], "fail")

    def test_caveats_not_stated_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["report"]["caveats_stated"] = False
        self.assertEqual(evaluate(m)["verdict"], "DELIVERABLE_NOT_COMPLETE")

    def test_numbers_not_reproducible_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["report"]["numbers_reproducible"] = False
        self.assertEqual(evaluate(m)["verdict"], "DELIVERABLE_NOT_COMPLETE")

    def test_loop_not_closed_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["closure"]["predicted_vs_actual_compared"] = False
        self.assertEqual(evaluate(m)["verdict"], "DELIVERABLE_NOT_COMPLETE")

    def test_absent_section_is_insufficient_not_failed(self):
        m = copy.deepcopy(COMPLETE)
        del m["inference"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["statistical_care"],
                         "insufficient_evidence")

    def test_sparse_manifest_is_insufficient_evidence(self):
        v = evaluate({"question": "Why did churn rise?"})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertIsNone(v["computed_status"])

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertIsNone(v["computed_status"])
        self.assertIsNone(v["recomputed_total"])
        self.assertIsNone(v["recomputed_mean"])
        self.assertIsNone(v["recomputed_percent_change"])
        self.assertIsNone(v["question"])

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertIn("VERDICT: DELIVERABLE_COMPLETE", stamp(v))

    def test_non_object_manifest_rejected(self):
        with self.assertRaises(TypeError):
            evaluate(["not", "a", "manifest"])


class MalformedTypeTests(unittest.TestCase):
    """F1 regression: a documented field present with the wrong
    JSON type is rejected with ValueError naming the field."""

    def test_top_level_string_field_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["question"] = 12345
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("question", str(ctx.exception))

    def test_section_as_string_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"framing": "should-be-an-object"})
        self.assertIn("framing", str(ctx.exception))

    def test_list_field_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["data"]["sources"] = "product_events"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("data.sources", str(ctx.exception))

    def test_list_entry_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["data"]["sources"] = ["product_events", 42]
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("data.sources[1]", str(ctx.exception))

    def test_numeric_list_entry_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["figures"]["values"] = [10, "20"]
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("figures.values[1]", str(ctx.exception))

    def test_numeric_list_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["figures"]["values"] = "10,20,30,40"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("figures.values", str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["framing"]["question_stated"] = "yes"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("framing.question_stated", str(ctx.exception))

    def test_numeric_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["figures"]["stated_total"] = "100"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("figures.stated_total", str(ctx.exception))

    def test_numeric_leaf_as_boolean_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["figures"]["stated_mean"] = True
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("figures.stated_mean", str(ctx.exception))

    def test_nested_boolean_leaf_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["closure"]["model_of_world_updated"] = 1
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("closure.model_of_world_updated",
                      str(ctx.exception))

    def test_null_section_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["figures"] = None
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("figures", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
