import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from structured_decision_making import evaluate, stamp  # noqa: E402

COMPLETE = {
    "decision": "choose deployment route",
    "framing": {"decision_restated_crisp": True,
                "decide_by_date_stated": True,
                "constraints_named": True,
                "out_of_scope_named": True,
                "classification": "irreversible",
                "stakes_assessed": True,
                "effort_budget_matched_to_stakes_and_reversibility": True,
                "slowed_deliberation_declared": True},
    "options": [
        {"name": "full rollout", "kind": "action",
         "scores": [{"criterion": "cost", "score": 4},
                    {"criterion": "risk", "score": 3},
                    {"criterion": "time-to-value", "score": 5}],
         "declared_weighted_total": 7.5},
        {"name": "do nothing", "kind": "status_quo",
         "scores": [{"criterion": "cost", "score": 5},
                    {"criterion": "risk", "score": 2},
                    {"criterion": "time-to-value", "score": 1}],
         "declared_weighted_total": 5.0},
        {"name": "pilot one site", "kind": "smaller_reversible_step",
         "scores": [{"criterion": "cost", "score": 3},
                    {"criterion": "risk", "score": 4},
                    {"criterion": "time-to-value", "score": 3}],
         "declared_weighted_total": 7.0},
    ],
    "criteria": [
        {"name": "cost", "weight": 0.5, "defined_before_scoring": True},
        {"name": "risk", "weight": 1.0, "defined_before_scoring": True},
        {"name": "time-to-value", "weight": 0.5,
         "defined_before_scoring": True},
    ],
    "evaluation": {"method": "decision_matrix",
                   "score_scale_min": 0, "score_scale_max": 5,
                   "probabilities_estimable": False,
                   "expected_value_used": False,
                   "scenario_thinking_used": True,
                   "uncertainty_flagged": True,
                   "base_rates_considered": True},
    "premortem": {"decision_is_material": True, "conducted": True,
                  "failure_reasons_named": True,
                  "top_reasons_fixed_or_hedged": True},
    "log": {"choice_recorded": True, "chosen_option": "pilot one site",
            "rationale_recorded": True, "assumptions_recorded": True,
            "communicated_with_why": True},
    "review": {"review_date_set": True,
               "outcomes_vs_expectations_review_planned": True,
               "luck_separated_from_process_declared": True},
    "red_lines": {"decision_without_options_present": False,
                  "criteria_invented_after_scores_present": False,
                  "irreversible_decision_rushed_present": False,
                  "irreversible_decision_made_in_mood_present": False},
}


def check_status(v, name):
    return next(c["status"] for c in v["checks"] if c["check"] == name)


class VerdictTests(unittest.TestCase):
    def test_complete_manifest_is_sound(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(v["verdict"], "DECISION_RECORD_SOUND")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(len(v["checks"]), 46)
        self.assertEqual(v["computed_status"],
                         "within_stated_limits_on_declared_evidence")
        self.assertEqual(v["options_count"], 3)
        self.assertEqual(v["criteria_count"], 3)
        self.assertEqual(v["duplicate_option_names"], [])
        self.assertEqual(v["duplicate_criterion_names"], [])
        self.assertEqual(v["criteria_weights_sum"], "2.000000")
        self.assertEqual(
            v["recomputed_weighted_totals"],
            [{"option": "full rollout",
              "recomputed_weighted_total": "7.500000"},
             {"option": "do nothing",
              "recomputed_weighted_total": "5.000000"},
             {"option": "pilot one site",
              "recomputed_weighted_total": "7.000000"}])
        self.assertEqual(v["options_with_weighted_total_mismatch"], [])
        self.assertEqual(v["options_without_complete_scores"], [])
        self.assertEqual(v["score_coverage_ratio"], "1.000000")
        self.assertEqual(v["weighted_total_match_ratio"], "1.000000")
        self.assertEqual(v["chosen_option"], "pilot one site")

    def test_chosen_option_need_not_have_highest_total(self):
        # The atom never recommends: the logged choice is the
        # caller's, even when another option's recomputed total
        # is higher (full rollout 7.5 > pilot 7.0 here).
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(
            check_status(
                v,
                "structured_logged_chosen_option_matches_a_declared_option"),
            "pass")
        self.assertEqual(v["verdict"], "DECISION_RECORD_SOUND")

    def test_framing_not_crisp_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["framing"]["decision_restated_crisp"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "DECISION_RECORD_NOT_SOUND")
        self.assertEqual(v["sections"]["structured_framing"], "fail")
        self.assertEqual(
            check_status(v, "structured_framing_decision_restated_crisp"),
            "fail")

    def test_unknown_classification_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["framing"]["classification"] = "one-way"
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v,
                "structured_classification_is_reversible_or_irreversible"),
            "fail")

    def test_irreversible_without_slowed_deliberation_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["framing"]["slowed_deliberation_declared"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v, "structured_slowed_deliberation_when_irreversible"),
            "fail")

    def test_reversible_slowed_deliberation_not_applicable(self):
        m = copy.deepcopy(COMPLETE)
        m["framing"]["classification"] = "reversible"
        del m["framing"]["slowed_deliberation_declared"]
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v, "structured_slowed_deliberation_when_irreversible"),
            "pass")
        self.assertEqual(v["verdict"], "DECISION_RECORD_SOUND")

    def test_two_options_fail_at_least_three(self):
        m = copy.deepcopy(COMPLETE)
        m["options"] = m["options"][:2]
        m["log"]["chosen_option"] = "full rollout"
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v, "structured_options_list_declares_at_least_three"),
            "fail")
        self.assertEqual(v["options_count"], 2)

    def test_absent_options_list_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["options"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(
                v, "structured_options_list_declares_at_least_three"),
            "missing")
        self.assertEqual(v["computed_status"], None)
        self.assertEqual(v["options_count"], None)
        self.assertEqual(v["duplicate_option_names"], None)
        self.assertEqual(v["recomputed_weighted_totals"], None)
        self.assertEqual(v["options_with_weighted_total_mismatch"], None)
        self.assertEqual(v["options_without_complete_scores"], None)
        self.assertEqual(v["score_coverage_ratio"], None)
        self.assertEqual(v["weighted_total_match_ratio"], None)

    def test_empty_options_list_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["options"] = []
        v = evaluate(m)
        self.assertEqual(v["verdict"], "DECISION_RECORD_NOT_SOUND")
        self.assertEqual(
            check_status(
                v, "structured_options_list_declares_at_least_three"),
            "fail")
        self.assertEqual(v["options_count"], 0)

    def test_duplicate_option_name_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["options"][2]["name"] = "full rollout"
        m["log"]["chosen_option"] = "full rollout"
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "structured_option_names_are_unique"), "fail")
        self.assertEqual(v["duplicate_option_names"], ["full rollout"])

    def test_option_missing_name_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["options"][0]["name"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(
                v, "structured_every_option_row_names_the_option"),
            "missing")

    def test_option_empty_name_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["options"][0]["name"] = ""
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v, "structured_every_option_row_names_the_option"),
            "fail")

    def test_unknown_option_kind_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["options"][0]["kind"] = "gamble"
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v, "structured_every_option_kind_is_recognised"), "fail")

    def test_no_status_quo_row_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["options"][1]["kind"] = "action"
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v, "structured_options_include_a_status_quo_row"), "fail")

    def test_no_smaller_reversible_step_row_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["options"][2]["kind"] = "action"
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v,
                "structured_options_include_a_smaller_reversible_step_row"),
            "fail")

    def test_absent_criteria_list_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["criteria"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["criteria_count"], None)
        self.assertEqual(v["criteria_weights_sum"], None)
        self.assertEqual(v["recomputed_weighted_totals"], None)

    def test_empty_criteria_list_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["criteria"] = []
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "structured_criteria_list_is_declared"),
            "fail")
        self.assertEqual(v["criteria_count"], 0)
        self.assertEqual(v["criteria_weights_sum"], None)

    def test_duplicate_criterion_name_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["criteria"][2]["name"] = "cost"
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "structured_criterion_names_are_unique"),
            "fail")
        self.assertEqual(v["duplicate_criterion_names"], ["cost"])

    def test_negative_weight_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["criteria"][0]["weight"] = -0.5
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v, "structured_every_criterion_weight_is_nonnegative"),
            "fail")

    def test_zero_weight_sum_fails(self):
        m = copy.deepcopy(COMPLETE)
        for c in m["criteria"]:
            c["weight"] = 0
        for o in m["options"]:
            o["declared_weighted_total"] = 0
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v, "structured_criteria_weights_sum_is_positive"), "fail")
        self.assertEqual(v["criteria_weights_sum"], "0.000000")

    def test_criterion_not_defined_before_scoring_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["criteria"][1]["defined_before_scoring"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v, "structured_every_criterion_defined_before_scoring"),
            "fail")

    def test_option_missing_a_criterion_score_fails_coverage(self):
        m = copy.deepcopy(COMPLETE)
        m["options"][0]["scores"] = m["options"][0]["scores"][:2]
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v,
                "structured_every_option_scores_every_declared_criterion"),
            "fail")
        self.assertEqual(v["options_without_complete_scores"],
                         ["full rollout"])
        self.assertEqual(v["score_coverage_ratio"], "0.666667")

    def test_option_scoring_undeclared_criterion_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["options"][0]["scores"].append(
            {"criterion": "vibes", "score": 5})
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v, "structured_no_option_scores_an_undeclared_criterion"),
            "fail")

    def test_option_scoring_criterion_twice_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["options"][0]["scores"].append(
            {"criterion": "cost", "score": 1})
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v, "structured_no_option_scores_a_criterion_twice"),
            "fail")

    def test_score_outside_declared_scale_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["options"][0]["scores"][0]["score"] = 6
        m["options"][0]["declared_weighted_total"] = 8.5
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v,
                "structured_every_score_lies_within_the_declared_scale"),
            "fail")

    def test_incoherent_scale_bounds_fail(self):
        m = copy.deepcopy(COMPLETE)
        m["evaluation"]["score_scale_min"] = 5
        m["evaluation"]["score_scale_max"] = 0
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v, "structured_score_scale_bounds_are_coherent"), "fail")

    def test_absent_scale_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["evaluation"]["score_scale_max"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(
                v,
                "structured_every_score_lies_within_the_declared_scale"),
            "missing")

    def test_weighted_total_mismatch_fails_and_option_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["options"][1]["declared_weighted_total"] = 5.5
        v = evaluate(m)
        self.assertEqual(v["verdict"], "DECISION_RECORD_NOT_SOUND")
        self.assertEqual(
            check_status(
                v,
                "structured_every_declared_weighted_total_recomputes"),
            "fail")
        self.assertEqual(v["options_with_weighted_total_mismatch"],
                         ["do nothing"])
        self.assertEqual(v["weighted_total_match_ratio"], "0.666667")
        self.assertEqual(v["computed_status"],
                         "outside_stated_limits_on_declared_evidence")

    def test_weighted_total_within_6dp_serialization_passes(self):
        m = copy.deepcopy(COMPLETE)
        m["criteria"][0]["weight"] = 0.1
        m["criteria"][1]["weight"] = 0.2
        m["criteria"][2]["weight"] = 0.3
        # full: .1*4+.2*3+.3*5 = 2.5; nothing: .5+.4+.3=1.2;
        # pilot: .3+.8+.9 = 2.0 (binary float sums land on 6dp)
        m["options"][0]["declared_weighted_total"] = 2.5
        m["options"][1]["declared_weighted_total"] = 1.2
        m["options"][2]["declared_weighted_total"] = 2.0
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v,
                "structured_every_declared_weighted_total_recomputes"),
            "pass")
        self.assertEqual(v["criteria_weights_sum"], "0.600000")

    def test_unknown_evaluation_method_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["evaluation"]["method"] = "coin_flip"
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v, "structured_evaluation_method_is_recognised"), "fail")

    def test_expected_value_required_when_estimable(self):
        m = copy.deepcopy(COMPLETE)
        m["evaluation"]["probabilities_estimable"] = True
        m["evaluation"]["expected_value_used"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v,
                "structured_expected_value_used_when_probabilities_estimable"),
            "fail")
        # scenario thinking is not the required tool in that state
        self.assertEqual(
            check_status(
                v,
                "structured_scenario_thinking_used_when_probabilities_not_estimable"),
            "pass")

    def test_scenario_required_when_not_estimable(self):
        m = copy.deepcopy(COMPLETE)
        m["evaluation"]["scenario_thinking_used"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v,
                "structured_scenario_thinking_used_when_probabilities_not_estimable"),
            "fail")
        self.assertEqual(
            check_status(
                v,
                "structured_expected_value_used_when_probabilities_estimable"),
            "pass")

    def test_uncertainty_not_flagged_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["evaluation"]["uncertainty_flagged"] = False
        v = evaluate(m)
        self.assertEqual(v["sections"]
                         ["structured_evaluation_and_uncertainty"], "fail")

    def test_premortem_required_when_material(self):
        m = copy.deepcopy(COMPLETE)
        m["premortem"]["conducted"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v,
                "structured_premortem_conducted_when_decision_is_material"),
            "fail")

    def test_premortem_not_applicable_when_not_material(self):
        m = copy.deepcopy(COMPLETE)
        m["premortem"] = {"decision_is_material": False}
        v = evaluate(m)
        self.assertEqual(v["sections"]["structured_pre_mortem"], "pass")
        self.assertEqual(v["verdict"], "DECISION_RECORD_SOUND")

    def test_premortem_gate_absent_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["premortem"]["decision_is_material"]
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v,
                "structured_premortem_conducted_when_decision_is_material"),
            "missing")

    def test_chosen_option_not_declared_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["log"]["chosen_option"] = "secret fourth option"
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v,
                "structured_logged_chosen_option_matches_a_declared_option"),
            "fail")
        self.assertEqual(v["chosen_option"], "secret fourth option")

    def test_absent_chosen_option_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["log"]["chosen_option"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["chosen_option"], None)

    def test_review_date_not_set_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["review"]["review_date_set"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "structured_review_date_is_set"), "fail")
        self.assertEqual(
            v["sections"]["structured_commit_log_and_review"], "fail")

    def test_criteria_invented_after_scores_fails_red_lines(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"]["criteria_invented_after_scores_present"] = True
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v,
                "structured_record_free_of_criteria_invented_after_scores"),
            "fail")
        self.assertEqual(v["sections"]["structured_red_lines"], "fail")
        self.assertEqual(v["verdict"], "DECISION_RECORD_NOT_SOUND")

    def test_irreversible_rushed_fails_red_lines(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"]["irreversible_decision_rushed_present"] = True
        self.assertEqual(
            check_status(
                evaluate(m),
                "structured_record_free_of_irreversible_decision_rushed"),
            "fail")

    def test_decision_without_options_fails_red_lines(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"]["decision_without_options_present"] = True
        self.assertEqual(
            check_status(
                evaluate(m),
                "structured_record_free_of_decision_without_options"),
            "fail")

    def test_absent_evidence_is_insufficient_not_failed(self):
        m = copy.deepcopy(COMPLETE)
        del m["review"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            v["sections"]["structured_commit_log_and_review"],
            "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertTrue(all(c["status"] == "missing"
                            for c in v["checks"]))
        self.assertEqual(v["computed_status"], None)
        self.assertEqual(v["options_count"], None)
        self.assertEqual(v["criteria_count"], None)
        self.assertEqual(v["duplicate_option_names"], None)
        self.assertEqual(v["duplicate_criterion_names"], None)
        self.assertEqual(v["criteria_weights_sum"], None)
        self.assertEqual(v["recomputed_weighted_totals"], None)
        self.assertEqual(v["options_with_weighted_total_mismatch"], None)
        self.assertEqual(v["options_without_complete_scores"], None)
        self.assertEqual(v["score_coverage_ratio"], None)
        self.assertEqual(v["weighted_total_match_ratio"], None)
        self.assertEqual(v["chosen_option"], None)

    def test_stamp_names_the_verdict(self):
        self.assertIn("VERDICT: DECISION_RECORD_SOUND",
                      stamp(evaluate(copy.deepcopy(COMPLETE))))

    def test_non_object_manifest_rejected(self):
        with self.assertRaises(TypeError):
            evaluate(["not", "a", "manifest"])


class MalformedManifestTests(unittest.TestCase):
    """Fields present with the wrong JSON type raise a field-naming
    ValueError — never evaluated into a verdict (F1 lesson)."""

    def assert_field_error(self, manifest, field):
        with self.assertRaises(ValueError) as ctx:
            evaluate(manifest)
        self.assertIn(field, str(ctx.exception))

    def test_string_field_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["decision"] = 12345
        self.assert_field_error(m, "decision")

    def test_object_section_as_string_rejected(self):
        self.assert_field_error({"framing": "should-be-an-object"},
                                "framing")

    def test_list_field_as_object_rejected(self):
        self.assert_field_error({"options": {"name": "x"}}, "options")

    def test_list_entry_as_string_rejected(self):
        self.assert_field_error({"options": ["full rollout"]},
                                "options[0]")

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["premortem"]["conducted"] = "yes"
        self.assert_field_error(m, "premortem.conducted")

    def test_number_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["criteria"][0]["weight"] = "0.5"
        self.assert_field_error(m, "criteria[0].weight")

    def test_number_leaf_as_boolean_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["options"][0]["scores"][0]["score"] = True
        self.assert_field_error(m, "options[0].scores[0].score")

    def test_nested_list_entry_string_field_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["options"][1]["kind"] = 42
        self.assert_field_error(m, "options[1].kind")

    def test_null_section_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["evaluation"] = None
        self.assert_field_error(m, "evaluation")


if __name__ == "__main__":
    unittest.main()
