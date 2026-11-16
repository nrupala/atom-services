import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from finance_content_compliance_check import evaluate, stamp  # noqa: E402

COMPLIANT = {
    "content": "RRSP vs TFSA explainer",
    "jurisdiction": "CA",
    "advice_boundary": {
        "teaches_frameworks_not_recommendations": True,
        "personalized_recommendations_present": False,
        "education_not_advice_disclaimer_present": True,
        "checklist_passed": True,
        "advice_like_content_present": True,
        "advice_like_flagged_for_review": True,
    },
    "figures": [
        {"label": "RRSP contribution limit", "as_of": "2026-10",
         "source": "CRA", "source_is_primary": True, "rederived": True},
        {"label": "TFSA dollar limit", "as_of": "2026-10",
         "source": "CRA", "source_is_primary": True, "rederived": True},
    ],
    "accuracy": {
        "primary_sources_linked": True,
        "rates_and_limits_dated": True,
        "recheck_cadence_set": True,
    },
    "risk": {
        "risk_before_upside": True,
        "uses_past_performance": True,
        "past_performance_caveat_present": True,
        "fees_visible": True,
        "taxes_visible": True,
        "return_promises_present": False,
        "forecasts_presented_as_fact": False,
        "survivorship_examples_used": False,
    },
    "calculators": {
        "includes_calculator": True,
        "spec_with_formulas_present": True,
        "boundary_cases_tested": True,
        "assumptions_visible_in_ui": True,
        "dark_patterns_present": False,
    },
    "commercial": {
        "has_sponsored_or_affiliate_content": True,
        "sponsored_affiliate_hard_labeled": True,
        "conflicts_disclosed": True,
        "editorial_separated_from_sales": True,
        "recommendations_for_undisclosed_compensation": False,
        "fear_based_selling_present": False,
    },
    "compliance": {
        "jurisdiction_notes_file_kept": True,
        "tools_collect_user_data": True,
        "privacy_rules_applied": True,
        "user_data_leaves_device_without_consent": False,
    },
    "corrections": {
        "correction_log_maintained": True,
        "corrections_made": True,
        "correction_note_visible_and_dated": True,
    },
}


class VerdictTests(unittest.TestCase):
    def test_compliant_manifest_is_compliant(self):
        v = evaluate(copy.deepcopy(COMPLIANT))
        self.assertEqual(v["verdict"], "COMPLIANT")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(len(v["checks"]), 32)
        self.assertEqual(v["figures_evaluated"], 2)
        self.assertEqual(v["figures_incomplete"], 0)

    def test_personalized_recommendation_fails_advice_boundary(self):
        m = copy.deepcopy(COMPLIANT)
        m["advice_boundary"]["personalized_recommendations_present"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NON_COMPLIANT")
        self.assertEqual(v["sections"]["advice_boundary"], "fail")

    def test_missing_disclaimer_fails(self):
        m = copy.deepcopy(COMPLIANT)
        m["advice_boundary"][
            "education_not_advice_disclaimer_present"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NON_COMPLIANT")

    def test_advice_like_content_not_flagged_fails(self):
        m = copy.deepcopy(COMPLIANT)
        m["advice_boundary"]["advice_like_flagged_for_review"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NON_COMPLIANT")
        self.assertEqual(v["sections"]["advice_boundary"], "fail")

    def test_no_advice_like_content_passes_flag_as_not_applicable(self):
        m = copy.deepcopy(COMPLIANT)
        m["advice_boundary"]["advice_like_content_present"] = False
        del m["advice_boundary"]["advice_like_flagged_for_review"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "COMPLIANT")

    def test_missing_jurisdiction_is_insufficient_evidence(self):
        m = copy.deepcopy(COMPLIANT)
        del m["jurisdiction"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["advice_boundary"],
                         "insufficient_evidence")

    def test_empty_jurisdiction_fails(self):
        m = copy.deepcopy(COMPLIANT)
        m["jurisdiction"] = ""
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NON_COMPLIANT")

    def test_figure_missing_as_of_is_insufficient_evidence(self):
        m = copy.deepcopy(COMPLIANT)
        del m["figures"][0]["as_of"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["accuracy_and_sourcing"],
                         "insufficient_evidence")
        self.assertEqual(v["figures_evaluated"], 1)
        self.assertEqual(v["figures_incomplete"], 1)

    def test_figure_not_primary_sourced_fails(self):
        m = copy.deepcopy(COMPLIANT)
        m["figures"][1]["source_is_primary"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NON_COMPLIANT")
        self.assertEqual(v["sections"]["accuracy_and_sourcing"], "fail")

    def test_figure_not_rederived_fails(self):
        m = copy.deepcopy(COMPLIANT)
        m["figures"][0]["rederived"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NON_COMPLIANT")

    def test_no_figures_declared_is_insufficient_evidence(self):
        m = copy.deepcopy(COMPLIANT)
        del m["figures"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["figures_evaluated"], 0)

    def test_return_promise_fails_risk_framing(self):
        m = copy.deepcopy(COMPLIANT)
        m["risk"]["return_promises_present"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NON_COMPLIANT")
        self.assertEqual(v["sections"]["risk_framing"], "fail")

    def test_past_performance_without_caveat_fails(self):
        m = copy.deepcopy(COMPLIANT)
        m["risk"]["past_performance_caveat_present"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NON_COMPLIANT")
        self.assertEqual(v["sections"]["risk_framing"], "fail")

    def test_no_past_performance_passes_caveat_as_not_applicable(self):
        m = copy.deepcopy(COMPLIANT)
        m["risk"]["uses_past_performance"] = False
        del m["risk"]["past_performance_caveat_present"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "COMPLIANT")

    def test_survivorship_examples_fail(self):
        m = copy.deepcopy(COMPLIANT)
        m["risk"]["survivorship_examples_used"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NON_COMPLIANT")

    def test_calculator_without_boundary_tests_fails(self):
        m = copy.deepcopy(COMPLIANT)
        m["calculators"]["boundary_cases_tested"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NON_COMPLIANT")
        self.assertEqual(v["sections"]["calculators_and_tools"], "fail")

    def test_dark_patterns_in_calculator_fail(self):
        m = copy.deepcopy(COMPLIANT)
        m["calculators"]["dark_patterns_present"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NON_COMPLIANT")

    def test_no_calculator_passes_tool_checks_as_not_applicable(self):
        m = copy.deepcopy(COMPLIANT)
        m["calculators"] = {"includes_calculator": False}
        v = evaluate(m)
        self.assertEqual(v["verdict"], "COMPLIANT")
        self.assertEqual(v["sections"]["calculators_and_tools"], "pass")

    def test_unlabeled_sponsored_content_fails(self):
        m = copy.deepcopy(COMPLIANT)
        m["commercial"]["sponsored_affiliate_hard_labeled"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NON_COMPLIANT")
        self.assertEqual(v["sections"]["commercial_honesty"], "fail")

    def test_no_sponsored_content_passes_label_as_not_applicable(self):
        m = copy.deepcopy(COMPLIANT)
        m["commercial"]["has_sponsored_or_affiliate_content"] = False
        del m["commercial"]["sponsored_affiliate_hard_labeled"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "COMPLIANT")

    def test_undisclosed_compensation_recommendation_fails(self):
        m = copy.deepcopy(COMPLIANT)
        m["commercial"][
            "recommendations_for_undisclosed_compensation"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NON_COMPLIANT")

    def test_user_data_leaving_without_consent_fails(self):
        m = copy.deepcopy(COMPLIANT)
        m["compliance"][
            "user_data_leaves_device_without_consent"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NON_COMPLIANT")
        self.assertEqual(v["sections"]["compliance_and_corrections"],
                         "fail")

    def test_silent_correction_fails(self):
        m = copy.deepcopy(COMPLIANT)
        m["corrections"]["correction_note_visible_and_dated"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NON_COMPLIANT")
        self.assertEqual(v["sections"]["compliance_and_corrections"],
                         "fail")

    def test_no_corrections_passes_note_check_as_not_applicable(self):
        m = copy.deepcopy(COMPLIANT)
        m["corrections"]["corrections_made"] = False
        del m["corrections"]["correction_note_visible_and_dated"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "COMPLIANT")

    def test_absent_evidence_is_insufficient_not_failed(self):
        m = copy.deepcopy(COMPLIANT)
        del m["commercial"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["commercial_honesty"],
                         "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["figures_evaluated"], 0)
        self.assertEqual(v["figures_incomplete"], 0)

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(COMPLIANT))
        self.assertIn("VERDICT: COMPLIANT", stamp(v))

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
            evaluate({"content": "Bad types", "jurisdiction": 123,
                      "advice_boundary": "not_an_object"})
        self.assertIn("jurisdiction", str(ctx.exception))

    def test_jurisdiction_as_number_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"jurisdiction": 123})
        self.assertIn("jurisdiction", str(ctx.exception))

    def test_section_as_string_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"advice_boundary": "not_an_object"})
        self.assertIn("advice_boundary", str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLIANT)
        m["risk"]["fees_visible"] = "yes"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("risk.fees_visible", str(ctx.exception))

    def test_list_field_as_string_rejected(self):
        m = copy.deepcopy(COMPLIANT)
        m["figures"] = "not-a-list"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("figures", str(ctx.exception))

    def test_list_entry_field_as_string_rejected(self):
        m = copy.deepcopy(COMPLIANT)
        m["figures"][0]["source_is_primary"] = "yes"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("figures[0].source_is_primary",
                      str(ctx.exception))

    def test_list_entry_as_string_rejected(self):
        m = copy.deepcopy(COMPLIANT)
        m["figures"][0] = "not-an-object"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("figures[0]", str(ctx.exception))

    def test_null_field_rejected(self):
        m = copy.deepcopy(COMPLIANT)
        m["accuracy"] = None
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("accuracy", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
