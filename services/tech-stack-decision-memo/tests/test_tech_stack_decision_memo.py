import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from tech_stack_decision_memo import evaluate, stamp  # noqa: E402

COMPLETE = {
    "memo_title": "dashboard-stack-memo",
    "context": {"hard_constraints_declared": True,
                "security_model_constraint_addressed": True,
                "regulatory_constraint_addressed": True,
                "performance_constraint_addressed": True,
                "offline_constraint_addressed": True,
                "access_patterns_declared": True,
                "usage_patterns_declared": True,
                "team_operability_context_declared": True,
                "decision_framed_as_sticky": True},
    "candidate_work": {
        "candidates_compared_against_same_hard_constraints": True,
        "boring_technology_bias_addressed": True,
        "novelty_budget_allocation_declared": True,
        "novelty_spend_tied_to_differentiation_declared": True},
    "candidates": [
        {"candidate_id": "cand-1", "stack_name": "Proven relational stack",
         "novelty_classification": "proven",
         "evidence_note": "Operability notes recorded",
         "scores": [{"criterion_id": "crit-1", "score": 4},
                    {"criterion_id": "crit-2", "score": 5},
                    {"criterion_id": "crit-3", "score": 3}],
         "weighted_total_declared": 26},
        {"candidate_id": "cand-2", "stack_name": "Novel edge stack",
         "novelty_classification": "novel",
         "evidence_note": "Prototype notes recorded",
         "scores": [{"criterion_id": "crit-1", "score": 3},
                    {"criterion_id": "crit-2", "score": 4},
                    {"criterion_id": "crit-3", "score": 2}],
         "weighted_total_declared": 20},
    ],
    "evaluation": {"evidence_basis_recorded": True,
                   "evaluation_applied_consistently_across_candidates": True},
    "criteria": [
        {"criterion_id": "crit-1", "criterion_name": "Operability fit",
         "weight": 2},
        {"criterion_id": "crit-2", "criterion_name": "Constraint fit",
         "weight": 3},
        {"criterion_id": "crit-3", "criterion_name": "Exit cost",
         "weight": 1},
    ],
    "tco": {"licensing_cost_addressed": True,
            "operations_burden_addressed": True,
            "learning_curve_addressed": True,
            "lock_in_cost_addressed": True,
            "operability_cost_addressed": True,
            "on_call_operability_owner_declared": True,
            "team_can_operate_declared_stack": True,
            "free_tier_or_free_choice_used": True,
            "hidden_fragility_cost_named": True},
    "decision": {"decision_recorded": True,
                 "chosen_candidate_id": "cand-1",
                 "rationale_recorded": True,
                 "rationale_tied_to_hard_constraints": True,
                 "rationale_tied_to_evaluation_criteria": True,
                 "tradeoffs_of_decision_recorded": True,
                 "declared_ranking_candidate_ids": ["cand-1", "cand-2"]},
    "reversibility": {"exit_cost_assessed": True,
                      "exit_path_kept": True,
                      "vendor_specific_pieces_isolated_behind_interfaces": True,
                      "reversibility_assessed": True},
    "red_lines": {"framework_of_the_week_chosen_for_novelty_present": False,
                  "microservices_for_solo_project_present": False,
                  "docker_by_default_choice_present": False,
                  "lock_in_with_no_exit_present": False,
                  "technology_chosen_to_pad_cv_present": False},
}


def check_status(v, name):
    return next(c["status"] for c in v["checks"] if c["check"] == name)


class VerdictTests(unittest.TestCase):
    def test_complete_manifest_is_sound(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(v["verdict"], "TECH_STACK_DECISION_SOUND")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(len(v["checks"]), 51)
        self.assertEqual(v["computed_status"],
                         "within_stated_limits_on_declared_evidence")
        self.assertEqual(v["tech_stack_candidates_count"], 2)
        self.assertEqual(v["tech_stack_criteria_count"], 3)
        self.assertEqual(v["duplicate_tech_stack_candidate_ids"], [])
        self.assertEqual(v["duplicate_tech_stack_criterion_ids"], [])
        self.assertEqual(v["tech_stack_criteria_weights_sum"], "6.000000")
        self.assertEqual(v["candidate_score_coverage_ratio"], "1.000000")
        self.assertEqual(v["candidate_weighted_total_match_ratio"], "1.000000")
        self.assertEqual(v["candidate_evidence_note_ratio"], "1.000000")

    def test_hard_constraints_not_declared_fails_section1(self):
        m = copy.deepcopy(COMPLETE)
        m["context"]["hard_constraints_declared"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "TECH_STACK_DECISION_NOT_SOUND")
        self.assertEqual(v["sections"]["context_and_constraints"], "fail")
        self.assertEqual(
            check_status(v, "tech_stack_memo_hard_constraints_declared"),
            "fail")

    def test_duplicate_candidate_id_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["candidates"][1]["candidate_id"] = "cand-1"
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_tech_stack_memo_candidate_id_unique"),
            "fail")
        self.assertEqual(v["duplicate_tech_stack_candidate_ids"], ["cand-1"])

    def test_single_candidate_fails_comparison(self):
        m = copy.deepcopy(COMPLETE)
        m["candidates"] = m["candidates"][:1]
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "tech_stack_memo_candidates_list_declared"),
            "fail")

    def test_absent_candidates_list_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["candidates"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "tech_stack_memo_candidates_list_declared"),
            "missing")
        self.assertIsNone(v["tech_stack_candidates_count"])
        self.assertIsNone(v["computed_status"])

    def test_invalid_novelty_classification_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["candidates"][0]["novelty_classification"] = "trendy"
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v,
                "every_tech_stack_memo_candidate_novelty_classification_recognised"),
            "fail")
        self.assertEqual(
            v["tech_stack_candidates_with_invalid_novelty_classification"],
            ["cand-1"])

    def test_empty_evidence_note_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["candidates"][1]["evidence_note"] = ""
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v, "every_tech_stack_memo_candidate_evidence_note_declared"),
            "fail")
        self.assertEqual(v["tech_stack_candidates_without_evidence_note"],
                         ["cand-2"])
        self.assertEqual(v["candidate_evidence_note_ratio"], "0.500000")

    def test_negative_weight_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["criteria"][0]["weight"] = -1
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v, "every_tech_stack_memo_criterion_weight_non_negative"),
            "fail")
        self.assertEqual(v["tech_stack_criteria_with_invalid_weight"],
                         ["crit-1"])

    def test_zero_weight_sum_fails(self):
        m = copy.deepcopy(COMPLETE)
        for c in m["criteria"]:
            c["weight"] = 0
        for cand in m["candidates"]:
            cand["weighted_total_declared"] = 0
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "tech_stack_memo_criteria_weights_sum_positive"),
            "fail")
        self.assertEqual(v["tech_stack_criteria_weights_sum"], "0.000000")

    def test_missing_score_fails_coverage(self):
        m = copy.deepcopy(COMPLETE)
        m["candidates"][0]["scores"] = m["candidates"][0]["scores"][:2]
        m["candidates"][0]["weighted_total_declared"] = 23
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v,
                "every_tech_stack_memo_candidate_scores_every_declared_criterion"),
            "fail")
        self.assertEqual(
            v["tech_stack_candidates_with_incomplete_or_extra_scores"],
            ["cand-1"])
        self.assertEqual(v["candidate_score_coverage_ratio"], "0.500000")

    def test_weighted_total_mismatch_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["candidates"][1]["weighted_total_declared"] = 21
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v,
                "every_tech_stack_memo_candidate_weighted_total_recomputes"),
            "fail")
        self.assertEqual(
            v["tech_stack_candidates_with_weighted_total_mismatch"],
            ["cand-2"])
        self.assertEqual(v["candidate_weighted_total_match_ratio"], "0.500000")

    def test_candidate_missing_weight_field_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["criteria"][0]["weight"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(
                v, "every_tech_stack_memo_criterion_weight_non_negative"),
            "missing")

    def test_free_choice_without_fragility_cost_fails_gated(self):
        m = copy.deepcopy(COMPLETE)
        m["tco"]["hidden_fragility_cost_named"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v,
                "tech_stack_memo_hidden_fragility_cost_named_where_free_choice_used"),
            "fail")

    def test_no_free_choice_passes_gated_as_na(self):
        m = copy.deepcopy(COMPLETE)
        m["tco"]["free_tier_or_free_choice_used"] = False
        m["tco"]["hidden_fragility_cost_named"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v,
                "tech_stack_memo_hidden_fragility_cost_named_where_free_choice_used"),
            "pass")
        self.assertEqual(v["verdict"], "TECH_STACK_DECISION_SOUND")

    def test_chosen_unknown_candidate_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["decision"]["chosen_candidate_id"] = "cand-99"
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v,
                "tech_stack_memo_chosen_candidate_resolves_to_declared_candidate"),
            "fail")

    def test_chosen_not_top_ranked_still_passes(self):
        # Audit boundary: the atom never checks that the chosen
        # candidate is top-ranked or highest-scoring.
        m = copy.deepcopy(COMPLETE)
        m["decision"]["chosen_candidate_id"] = "cand-2"
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v,
                "tech_stack_memo_chosen_candidate_resolves_to_declared_candidate"),
            "pass")
        self.assertEqual(v["verdict"], "TECH_STACK_DECISION_SOUND")

    def test_ranking_missing_candidate_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["decision"]["declared_ranking_candidate_ids"] = ["cand-1"]
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v,
                "tech_stack_memo_declared_ranking_matches_declared_candidates"),
            "fail")
        self.assertEqual(
            v["tech_stack_candidates_missing_from_declared_ranking"],
            ["cand-2"])

    def test_ranking_extra_candidate_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["decision"]["declared_ranking_candidate_ids"] = [
            "cand-1", "cand-2", "cand-9"]
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v,
                "tech_stack_memo_declared_ranking_matches_declared_candidates"),
            "fail")
        self.assertEqual(
            v["declared_ranking_ids_not_declared_as_candidates"], ["cand-9"])

    def test_ranking_reordered_still_passes(self):
        m = copy.deepcopy(COMPLETE)
        m["decision"]["declared_ranking_candidate_ids"] = ["cand-2", "cand-1"]
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v,
                "tech_stack_memo_declared_ranking_matches_declared_candidates"),
            "pass")

    def test_exit_path_not_kept_fails_section6(self):
        m = copy.deepcopy(COMPLETE)
        m["reversibility"]["exit_path_kept"] = False
        v = evaluate(m)
        self.assertEqual(v["sections"]["reversibility_and_exit"], "fail")

    def test_lock_in_with_no_exit_fails_red_lines(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"]["lock_in_with_no_exit_present"] = True
        v = evaluate(m)
        self.assertEqual(v["sections"]["red_lines"], "fail")
        self.assertEqual(v["verdict"], "TECH_STACK_DECISION_NOT_SOUND")

    def test_cv_padding_fails_red_lines(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"]["technology_chosen_to_pad_cv_present"] = True
        self.assertEqual(
            check_status(
                evaluate(m),
                "tech_stack_memo_free_of_technology_chosen_to_pad_cv"),
            "fail")

    def test_absent_evidence_is_insufficient_not_failed(self):
        m = copy.deepcopy(COMPLETE)
        del m["tco"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["total_cost_and_operability"],
                         "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertTrue(all(c["status"] == "missing" for c in v["checks"]))
        self.assertIsNone(v["computed_status"])
        self.assertIsNone(v["tech_stack_candidates_count"])
        self.assertIsNone(v["tech_stack_criteria_weights_sum"])
        self.assertIsNone(v["candidate_score_coverage_ratio"])

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertIn("VERDICT: TECH_STACK_DECISION_SOUND", stamp(v))

    def test_non_object_manifest_rejected(self):
        with self.assertRaises(TypeError):
            evaluate(["not", "a", "manifest"])


class MalformedTypeTests(unittest.TestCase):
    def test_string_field_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["memo_title"] = 12345
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("memo_title", str(ctx.exception))

    def test_object_section_as_string_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"context": "should-be-an-object"})
        self.assertIn("context", str(ctx.exception))

    def test_list_field_as_object_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"candidates": {"candidate_id": "cand-1"}})
        self.assertIn("candidates", str(ctx.exception))

    def test_list_entry_as_string_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"criteria": ["crit-1"]})
        self.assertIn("criteria[0]", str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["context"]["hard_constraints_declared"] = "yes"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("context.hard_constraints_declared", str(ctx.exception))

    def test_number_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["criteria"][0]["weight"] = "2"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("criteria[0].weight", str(ctx.exception))

    def test_nested_score_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["candidates"][0]["scores"][0]["score"] = "4"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("candidates[0].scores[0].score", str(ctx.exception))

    def test_string_list_entry_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["decision"]["declared_ranking_candidate_ids"] = [42]
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("decision.declared_ranking_candidate_ids[0]",
                      str(ctx.exception))

    def test_null_section_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["reversibility"] = None
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("reversibility", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
