import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from structured_root_cause_analysis import evaluate, stamp  # noqa: E402

COMPLETE = {
    "analysis_title": "pump-trip-2026-11-02",
    "problem": {"problem_statement_stated": True,
                "inference_type_classified": True,
                "scope_boundary_stated": True,
                "trigger_distinguished_from_root_cause": True,
                "controllable_cause_targeted": True},
    "decomposition": {"mece_decomposition_declared": True,
                      "hypothesis_tree_declared": True,
                      "branches_ranked_by_likelihood_and_test_cost": True},
    "timeline_events": [
        {"event_id": "ev-1", "sequence_number": 1},
        {"event_id": "ev-2", "sequence_number": 2},
        {"event_id": "ev-3", "sequence_number": 5},
    ],
    "factors": [
        {"factor_id": "f-equipment", "category": "equipment",
         "evidence_tier": "measurement"},
        {"factor_id": "f-process", "category": "process",
         "evidence_tier": "log"},
        {"factor_id": "f-people", "category": "people",
         "evidence_tier": "report"},
    ],
    "causal_chain": [
        {"link_id": "why-1", "depth": 1, "factor_id": "f-equipment"},
        {"link_id": "why-2", "depth": 2, "factor_id": "f-process"},
        {"link_id": "why-3", "depth": 3, "factor_id": "f-process"},
    ],
    "evidence": {"evidence_tiers_applied": True,
                 "base_rates_considered_first": True,
                 "evidence_update_stated": True,
                 "magnitudes_and_ranges_quantified": True,
                 "units_and_assumptions_stated": True},
    "verification": {"root_cause_verified_by_revert_or_test": True,
                     "counterfactual_test_recorded": True,
                     "strongest_counterargument_stated": True,
                     "contradicting_data_named": True,
                     "revision_conditions_stated": True},
    "conclusion": {"conclusion_confidence_and_basis_stated": True},
    "corrective_actions": [
        {"action_id": "act-1", "factor_id": "f-process"},
        {"action_id": "act-2", "factor_id": "f-equipment"},
    ],
    "red_lines": {"unverified_single_source_conclusion_present": False,
                  "post_hoc_storytelling_present": False,
                  "plausible_presented_as_proven_present": False,
                  "cause_asserted_without_declared_evidence_present": False,
                  "person_blame_as_root_cause_present": False},
}


def check_status(v, name):
    return next(c["status"] for c in v["checks"] if c["check"] == name)


class VerdictTests(unittest.TestCase):
    def test_complete_manifest_is_sound(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(v["verdict"], "ROOT_CAUSE_ANALYSIS_SOUND")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(len(v["checks"]), 38)
        self.assertEqual(v["computed_status"],
                         "within_stated_limits_on_declared_evidence")
        self.assertEqual(v["timeline_events_count"], 3)
        self.assertEqual(v["factor_rows_count"], 3)
        self.assertEqual(v["causal_chain_links_count"], 3)
        self.assertEqual(v["corrective_action_rows_count"], 2)
        self.assertEqual(v["duplicate_timeline_event_ids"], [])
        self.assertEqual(v["duplicate_factor_ids"], [])
        self.assertEqual(v["duplicate_causal_chain_link_ids"], [])
        self.assertEqual(v["duplicate_corrective_action_ids"], [])
        self.assertEqual(v["factors_without_category"], [])
        self.assertEqual(v["factors_missing_evidence_tier"], [])
        self.assertEqual(v["factors_with_unrecognised_evidence_tier"], [])
        self.assertEqual(v["causal_chain_links_with_unreferenced_factor"],
                         [])
        self.assertEqual(v["corrective_actions_with_unreferenced_factor"],
                         [])
        self.assertEqual(v["fishbone_categories_declared_count"], 3)
        self.assertEqual(v["factor_category_coverage_ratio"], "1.000000")
        self.assertEqual(v["factor_evidence_tier_ratio"], "1.000000")
        self.assertEqual(v["causal_chain_reference_ratio"], "1.000000")
        self.assertEqual(v["corrective_action_reference_ratio"], "1.000000")

    def test_problem_not_stated_fails_section1(self):
        m = copy.deepcopy(COMPLETE)
        m["problem"]["problem_statement_stated"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "ROOT_CAUSE_ANALYSIS_NOT_SOUND")
        self.assertEqual(v["sections"]["problem_framing_and_inference"],
                         "fail")
        self.assertEqual(check_status(v, "rca_problem_statement_stated"),
                         "fail")

    def test_trigger_conflated_with_root_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["problem"]["trigger_distinguished_from_root_cause"] = False
        self.assertEqual(
            check_status(evaluate(m), "rca_trigger_distinguished_from_root"),
            "fail")

    def test_timeline_running_backwards_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["timeline_events"][2]["sequence_number"] = 2
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "rca_timeline_sequence_strictly_increasing"),
            "fail")
        self.assertEqual(v["computed_status"],
                         "outside_stated_limits_on_declared_evidence")

    def test_timeline_equal_sequence_fails_strictly_increasing(self):
        m = copy.deepcopy(COMPLETE)
        m["timeline_events"][1]["sequence_number"] = 1
        self.assertEqual(
            check_status(evaluate(m),
                         "rca_timeline_sequence_strictly_increasing"),
            "fail")

    def test_duplicate_timeline_event_id_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["timeline_events"][2]["event_id"] = "ev-1"
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_rca_timeline_event_id_unique"), "fail")
        self.assertEqual(v["duplicate_timeline_event_ids"], ["ev-1"])

    def test_timeline_event_missing_sequence_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["timeline_events"][1]["sequence_number"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "rca_timeline_sequence_strictly_increasing"),
            "missing")

    def test_absent_timeline_list_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["timeline_events"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "rca_timeline_events_list_declared"), "missing")
        self.assertIsNone(v["timeline_events_count"])
        self.assertIsNone(v["duplicate_timeline_event_ids"])

    def test_empty_factors_list_fails_factors_declared(self):
        m = copy.deepcopy(COMPLETE)
        m["factors"] = []
        v = evaluate(m)
        self.assertEqual(v["verdict"], "ROOT_CAUSE_ANALYSIS_NOT_SOUND")
        self.assertEqual(
            check_status(v, "rca_factor_rows_list_declared"), "fail")
        self.assertEqual(v["factor_rows_count"], 0)
        self.assertIsNone(v["factor_category_coverage_ratio"])
        self.assertIsNone(v["factor_evidence_tier_ratio"])
        # the factors list is declared (empty), so chain references
        # are computable — and every link is unreferenced.
        self.assertEqual(v["causal_chain_reference_ratio"], "0.000000")
        self.assertEqual(
            check_status(
                v, "every_rca_causal_chain_link_factor_referenced"),
            "fail")

    def test_duplicate_factor_id_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["factors"][2]["factor_id"] = "f-process"
        v = evaluate(m)
        self.assertEqual(check_status(v, "every_rca_factor_id_unique"),
                         "fail")
        self.assertEqual(v["duplicate_factor_ids"], ["f-process"])

    def test_factor_without_category_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["factors"][1]["category"] = ""
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_rca_factor_category_declared"), "fail")
        self.assertEqual(v["factors_without_category"], ["f-process"])
        self.assertEqual(v["factor_category_coverage_ratio"], "0.666667")
        self.assertEqual(v["fishbone_categories_declared_count"], 2)

    def test_factor_missing_category_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["factors"][0]["category"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "every_rca_factor_category_declared"),
            "missing")
        self.assertEqual(v["factors_without_category"], ["f-equipment"])

    def test_unrecognised_evidence_tier_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["factors"][0]["evidence_tier"] = "rumour"
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_rca_factor_evidence_tier_recognised"),
            "fail")
        self.assertEqual(v["factors_with_unrecognised_evidence_tier"],
                         ["f-equipment"])
        self.assertEqual(v["factor_evidence_tier_ratio"], "0.666667")

    def test_opinion_tier_is_recognised(self):
        m = copy.deepcopy(COMPLETE)
        m["factors"][2]["evidence_tier"] = "opinion"
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_rca_factor_evidence_tier_recognised"),
            "pass")
        self.assertEqual(v["verdict"], "ROOT_CAUSE_ANALYSIS_SOUND")

    def test_factor_missing_tier_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["factors"][2]["evidence_tier"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["factors_missing_evidence_tier"], ["f-people"])

    def test_chain_depth_skip_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["causal_chain"][2]["depth"] = 4
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "rca_causal_chain_depths_consecutive_from_one"),
            "fail")

    def test_chain_depth_not_starting_at_one_fails(self):
        m = copy.deepcopy(COMPLETE)
        for i, link in enumerate(m["causal_chain"]):
            link["depth"] = i + 2
        self.assertEqual(
            check_status(evaluate(m),
                         "rca_causal_chain_depths_consecutive_from_one"),
            "fail")

    def test_chain_link_unreferenced_factor_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["causal_chain"][1]["factor_id"] = "f-ghost"
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v, "every_rca_causal_chain_link_factor_referenced"),
            "fail")
        self.assertEqual(v["causal_chain_links_with_unreferenced_factor"],
                         ["why-2"])
        self.assertEqual(v["causal_chain_reference_ratio"], "0.666667")

    def test_chain_link_missing_factor_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["causal_chain"][0]["factor_id"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(
                v, "every_rca_causal_chain_link_factor_referenced"),
            "missing")
        self.assertEqual(v["causal_chain_links_with_unreferenced_factor"],
                         [])

    def test_absent_factors_make_reference_checks_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["factors"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(
                v, "every_rca_causal_chain_link_factor_referenced"),
            "missing")
        self.assertIsNone(v["causal_chain_links_with_unreferenced_factor"])
        self.assertIsNone(v["causal_chain_reference_ratio"])
        self.assertIsNone(v["fishbone_categories_declared_count"])

    def test_duplicate_chain_link_id_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["causal_chain"][2]["link_id"] = "why-1"
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_rca_causal_chain_link_id_unique"),
            "fail")
        self.assertEqual(v["duplicate_causal_chain_link_ids"], ["why-1"])

    def test_action_unreferenced_factor_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["corrective_actions"][0]["factor_id"] = "f-ghost"
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v, "every_rca_corrective_action_factor_referenced"),
            "fail")
        self.assertEqual(
            v["corrective_actions_with_unreferenced_factor"], ["act-1"])
        self.assertEqual(v["corrective_action_reference_ratio"], "0.500000")

    def test_duplicate_action_id_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["corrective_actions"][1]["action_id"] = "act-1"
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_rca_corrective_action_id_unique"),
            "fail")
        self.assertEqual(v["duplicate_corrective_action_ids"], ["act-1"])

    def test_empty_actions_list_fails_actions_declared(self):
        m = copy.deepcopy(COMPLETE)
        m["corrective_actions"] = []
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "rca_corrective_action_rows_list_declared"),
            "fail")
        self.assertEqual(v["corrective_action_rows_count"], 0)
        self.assertIsNone(v["corrective_action_reference_ratio"])

    def test_base_rates_skipped_fails_section4(self):
        m = copy.deepcopy(COMPLETE)
        m["evidence"]["base_rates_considered_first"] = False
        v = evaluate(m)
        self.assertEqual(v["sections"]["evidence_and_quantification"],
                         "fail")
        self.assertEqual(
            check_status(v, "rca_base_rates_considered_first"), "fail")

    def test_unverified_root_cause_fails_section5(self):
        m = copy.deepcopy(COMPLETE)
        m["verification"]["root_cause_verified_by_revert_or_test"] = False
        v = evaluate(m)
        self.assertEqual(
            v["sections"]["verification_falsification_and_conclusion"],
            "fail")
        self.assertEqual(
            check_status(v, "rca_root_cause_verified_by_revert_or_test"),
            "fail")

    def test_no_counterargument_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["verification"]["strongest_counterargument_stated"] = False
        self.assertEqual(
            check_status(
                evaluate(m), "rca_strongest_counterargument_stated"),
            "fail")

    def test_single_source_conclusion_fails_red_lines(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"]["unverified_single_source_conclusion_present"] = True
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v, "rca_free_of_unverified_single_source_conclusion"),
            "fail")
        self.assertEqual(v["sections"]["red_lines"], "fail")
        self.assertEqual(v["verdict"], "ROOT_CAUSE_ANALYSIS_NOT_SOUND")

    def test_post_hoc_storytelling_fails_red_lines(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"]["post_hoc_storytelling_present"] = True
        self.assertEqual(
            check_status(evaluate(m), "rca_free_of_post_hoc_storytelling"),
            "fail")

    def test_person_blame_fails_red_lines(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"]["person_blame_as_root_cause_present"] = True
        self.assertEqual(
            check_status(
                evaluate(m), "rca_free_of_person_blame_as_root_cause"),
            "fail")

    def test_absent_evidence_is_insufficient_not_failed(self):
        m = copy.deepcopy(COMPLETE)
        del m["evidence"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["evidence_and_quantification"],
                         "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertTrue(
            all(c["status"] == "missing" for c in v["checks"]))
        self.assertIsNone(v["computed_status"])
        self.assertIsNone(v["timeline_events_count"])
        self.assertIsNone(v["factor_rows_count"])
        self.assertIsNone(v["causal_chain_links_count"])
        self.assertIsNone(v["corrective_action_rows_count"])
        self.assertIsNone(v["duplicate_factor_ids"])
        self.assertIsNone(v["factors_without_category"])
        self.assertIsNone(v["causal_chain_links_with_unreferenced_factor"])
        self.assertIsNone(v["fishbone_categories_declared_count"])
        self.assertIsNone(v["factor_evidence_tier_ratio"])
        self.assertIsNone(v["causal_chain_reference_ratio"])
        self.assertIsNone(v["corrective_action_reference_ratio"])

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertIn("VERDICT: ROOT_CAUSE_ANALYSIS_SOUND", stamp(v))

    def test_non_object_manifest_rejected(self):
        with self.assertRaises(TypeError):
            evaluate(["not", "a", "manifest"])


class MalformedTypeTests(unittest.TestCase):
    def test_string_field_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["analysis_title"] = 12345
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("analysis_title", str(ctx.exception))

    def test_object_section_as_string_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"problem": "should-be-an-object"})
        self.assertIn("problem", str(ctx.exception))

    def test_list_field_as_object_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"factors": {"factor_id": "f-1"}})
        self.assertIn("factors", str(ctx.exception))

    def test_list_entry_as_string_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"factors": ["f-1"]})
        self.assertIn("factors[0]", str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["evidence"]["base_rates_considered_first"] = "yes"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("evidence.base_rates_considered_first",
                      str(ctx.exception))

    def test_number_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["causal_chain"][0]["depth"] = "1"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("causal_chain[0].depth", str(ctx.exception))

    def test_number_leaf_as_boolean_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["timeline_events"][0]["sequence_number"] = True
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("timeline_events[0].sequence_number",
                      str(ctx.exception))

    def test_nested_list_entry_string_field_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["factors"][1]["evidence_tier"] = 42
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("factors[1].evidence_tier", str(ctx.exception))

    def test_null_section_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["verification"] = None
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("verification", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
