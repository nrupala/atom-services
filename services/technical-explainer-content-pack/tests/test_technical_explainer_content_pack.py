import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from technical_explainer_content_pack import evaluate, stamp  # noqa: E402

COMPLETE = {
    "explainer_title": "how-a-transformer-works",
    "audience": {"defined": True, "reader_outcome_stated": True,
                 "prior_knowledge_assumption_stated": True,
                 "prior_knowledge_assumed": True},
    "prerequisites": [
        {"prerequisite_id": "pre-1", "description": "Basic voltage idea"},
        {"prerequisite_id": "pre-2", "description": "What a coil is"},
    ],
    "learning_objective_framing": {"outcomes_stated_as_do_or_say": True},
    "learning_objectives": [
        {"objective_id": "obj-1", "outcome": "Say why voltage changes across a transformer"},
        {"objective_id": "obj-2", "outcome": "Do a turns-ratio calculation"},
    ],
    "structure": {"follows_spine_order": True,
                  "single_core_idea_confirmed": True,
                  "second_core_idea_present": True,
                  "second_core_idea_split_off": True},
    "explanation_sections": [
        {"section_id": "sec-1", "spine_stage": "question", "objective_id": "obj-1"},
        {"section_id": "sec-2", "spine_stage": "why_it_matters", "objective_id": "obj-1"},
        {"section_id": "sec-3", "spine_stage": "core_idea", "objective_id": "obj-1"},
        {"section_id": "sec-4", "spine_stage": "how_it_works", "objective_id": "obj-2"},
        {"section_id": "sec-5", "spine_stage": "where_it_breaks", "objective_id": "obj-2"},
        {"section_id": "sec-6", "spine_stage": "what_to_watch", "objective_id": "obj-2"},
    ],
    "simplification": {"language_simplified_not_facts": True,
                       "simplifications_flagged_explicitly": True,
                       "units_preserved_correct": True,
                       "orders_of_magnitude_preserved_correct": True,
                       "directions_preserved_correct": True,
                       "jargon_defined_on_first_use": True,
                       "reading_level_appropriate_for_audience": True},
    "analogy": {"analogy_used": True, "single_analogy_confirmed": True,
                "failure_mode_stated": True},
    "example_work": {"worked_mini_examples_included": True,
                     "concrete_numbers_included": True,
                     "concrete_cases_included": True,
                     "visuals_included_where_they_carry_weight": True},
    "worked_examples": [
        {"example_id": "ex-1", "objective_id": "obj-2", "source_id": "src-1",
         "steps_declared_complete": True},
        {"example_id": "ex-2", "objective_id": "obj-1", "source_id": "src-2",
         "steps_declared_complete": True},
    ],
    "misconceptions": [
        {"misconception_id": "mis-1",
         "description": "Transformers create energy",
         "addressed_section_id": "sec-5"},
    ],
    "accuracy": {"accuracy_review_done": True,
                 "every_factual_claim_labeled": True,
                 "every_factual_claim_sourced": True},
    "sources": [
        {"source_id": "src-1", "citation": "IEEE guide, citation recorded", "archived": True},
        {"source_id": "src-2", "citation": "Manufacturer datasheet, dated", "archived": True},
    ],
    "safety": {"safety_relevant_topic": True,
               "expert_review_by_qualified_person": True,
               "defers_to_licensed_practice_note_included": True},
    "canonical": {"canonical_explainer_identified": True,
                  "renderings_regenerated_from_canonical_after_updates": True},
    "renderings": [
        {"rendering_id": "ren-1", "rendering_kind": "faq",
         "derived_from_canonical_source": True},
        {"rendering_id": "ren-2", "rendering_kind": "video_script",
         "derived_from_canonical_source": True},
    ],
    "corrections": {"corrections_dated": True, "corrections_visible": True,
                    "corrections_logged": True},
    "red_lines": {"invented_numbers_or_figures_present": False,
                  "unsupported_studies_show_claim_present": False,
                  "fear_mongering_or_hype_present": False,
                  "teaching_beyond_declared_competence_present": False,
                  "unlicensed_practice_encouraged_present": False},
}


def check_status(v, name):
    return next(c["status"] for c in v["checks"] if c["check"] == name)


class VerdictTests(unittest.TestCase):
    def test_complete_manifest_is_sound(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(v["verdict"], "EXPLAINER_CONTENT_SOUND")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(len(v["checks"]), 63)
        self.assertEqual(v["computed_status"],
                         "within_stated_limits_on_declared_evidence")
        self.assertEqual(v["technical_explainer_learning_objectives_count"], 2)
        self.assertEqual(v["technical_explainer_explanation_sections_count"], 6)
        self.assertEqual(v["spine_stage_coverage_ratio"], "1.000000")
        self.assertEqual(v["objective_section_coverage_ratio"], "1.000000")
        self.assertEqual(v["worked_example_traceability_ratio"], "1.000000")
        self.assertEqual(v["accuracy_source_archive_ratio"], "1.000000")
        self.assertEqual(v["misconception_resolution_ratio"], "1.000000")
        self.assertEqual(v["rendering_derivation_ratio"], "1.000000")
        self.assertEqual(v["technical_explainer_missing_spine_stages"], [])

    def test_audience_not_defined_fails_section1(self):
        m = copy.deepcopy(COMPLETE); m["audience"]["defined"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "EXPLAINER_CONTENT_NOT_SOUND")
        self.assertEqual(v["sections"]["audience_and_prerequisites"], "fail")
        self.assertEqual(check_status(v, "technical_explainer_audience_defined"), "fail")

    def test_no_prior_knowledge_passes_prereq_gate(self):
        m = copy.deepcopy(COMPLETE)
        m["audience"]["prior_knowledge_assumed"] = False
        m["prerequisites"] = []
        v = evaluate(m)
        self.assertEqual(check_status(v, "technical_explainer_prerequisites_listed_where_prior_knowledge_assumed"), "pass")

    def test_prior_knowledge_without_prereqs_fails(self):
        m = copy.deepcopy(COMPLETE); m["prerequisites"] = []
        v = evaluate(m)
        self.assertEqual(check_status(v, "technical_explainer_prerequisites_listed_where_prior_knowledge_assumed"), "fail")

    def test_duplicate_objective_id_fails(self):
        m = copy.deepcopy(COMPLETE); m["learning_objectives"][1]["objective_id"] = "obj-1"
        v = evaluate(m)
        self.assertEqual(check_status(v, "every_technical_explainer_learning_objective_id_unique"), "fail")
        self.assertEqual(v["duplicate_technical_explainer_learning_objective_ids"], ["obj-1"])

    def test_empty_objective_outcome_fails(self):
        m = copy.deepcopy(COMPLETE); m["learning_objectives"][0]["outcome"] = ""
        v = evaluate(m)
        self.assertEqual(check_status(v, "every_technical_explainer_learning_objective_outcome_declared"), "fail")
        self.assertEqual(v["technical_explainer_learning_objectives_without_outcome"], ["obj-1"])

    def test_missing_spine_stage_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE); m["explanation_sections"][5]["spine_stage"] = "core_idea"
        v = evaluate(m)
        self.assertEqual(check_status(v, "technical_explainer_all_spine_stages_declared_present"), "fail")
        self.assertEqual(v["technical_explainer_missing_spine_stages"], ["what_to_watch"])
        self.assertEqual(v["spine_stage_coverage_ratio"], "0.833333")

    def test_invalid_spine_stage_fails(self):
        m = copy.deepcopy(COMPLETE); m["explanation_sections"][0]["spine_stage"] = "intro"
        v = evaluate(m)
        self.assertEqual(check_status(v, "every_technical_explainer_explanation_section_spine_stage_recognised"), "fail")
        self.assertEqual(v["technical_explainer_explanation_sections_with_invalid_spine_stage"], ["sec-1"])

    def test_section_unknown_objective_fails(self):
        m = copy.deepcopy(COMPLETE); m["explanation_sections"][0]["objective_id"] = "obj-99"
        v = evaluate(m)
        self.assertEqual(check_status(v, "every_technical_explainer_explanation_section_objective_reference_resolves"), "fail")
        self.assertEqual(v["technical_explainer_explanation_sections_with_unknown_objective_reference"], ["sec-1"])

    def test_second_idea_not_split_fails_gated(self):
        m = copy.deepcopy(COMPLETE); m["structure"]["second_core_idea_split_off"] = False
        self.assertEqual(check_status(evaluate(m), "technical_explainer_second_core_idea_split_off_where_present"), "fail")

    def test_no_second_idea_passes_gated(self):
        m = copy.deepcopy(COMPLETE); m["structure"]["second_core_idea_present"] = False; m["structure"]["second_core_idea_split_off"] = False
        self.assertEqual(check_status(evaluate(m), "technical_explainer_second_core_idea_split_off_where_present"), "pass")

    def test_analogy_without_failure_mode_fails(self):
        m = copy.deepcopy(COMPLETE); m["analogy"]["failure_mode_stated"] = False
        self.assertEqual(check_status(evaluate(m), "technical_explainer_analogy_failure_mode_stated_where_analogy_used"), "fail")

    def test_no_analogy_passes_gated(self):
        m = copy.deepcopy(COMPLETE); m["analogy"]["analogy_used"] = False; m["analogy"]["failure_mode_stated"] = False; m["analogy"]["single_analogy_confirmed"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "EXPLAINER_CONTENT_SOUND")

    def test_example_unknown_source_fails(self):
        m = copy.deepcopy(COMPLETE); m["worked_examples"][0]["source_id"] = "src-99"
        v = evaluate(m)
        self.assertEqual(check_status(v, "every_technical_explainer_worked_example_source_reference_resolves"), "fail")
        self.assertEqual(v["technical_explainer_worked_examples_with_unknown_source_reference"], ["ex-1"])
        self.assertEqual(v["worked_example_traceability_ratio"], "0.500000")

    def test_example_incomplete_steps_fails(self):
        m = copy.deepcopy(COMPLETE); m["worked_examples"][1]["steps_declared_complete"] = False
        v = evaluate(m)
        self.assertEqual(check_status(v, "every_technical_explainer_worked_example_steps_declared_complete"), "fail")
        self.assertEqual(v["technical_explainer_worked_examples_without_complete_steps"], ["ex-2"])

    def test_source_not_archived_fails(self):
        m = copy.deepcopy(COMPLETE); m["sources"][0]["archived"] = False
        v = evaluate(m)
        self.assertEqual(check_status(v, "every_technical_explainer_accuracy_source_archived"), "fail")
        self.assertEqual(v["technical_explainer_accuracy_sources_not_archived"], ["src-1"])

    def test_misconception_unknown_section_fails(self):
        m = copy.deepcopy(COMPLETE); m["misconceptions"][0]["addressed_section_id"] = "sec-99"
        v = evaluate(m)
        self.assertEqual(check_status(v, "every_technical_explainer_misconception_addressed_section_reference_resolves"), "fail")
        self.assertEqual(v["technical_explainer_misconceptions_with_unknown_addressed_section"], ["mis-1"])
        self.assertEqual(v["misconception_resolution_ratio"], "0.000000")

    def test_safety_without_expert_review_fails(self):
        m = copy.deepcopy(COMPLETE); m["safety"]["expert_review_by_qualified_person"] = False
        self.assertEqual(check_status(evaluate(m), "technical_explainer_safety_expert_review_where_safety_relevant"), "fail")

    def test_not_safety_relevant_passes_gates(self):
        m = copy.deepcopy(COMPLETE); m["safety"]["safety_relevant_topic"] = False; m["safety"]["expert_review_by_qualified_person"] = False; m["safety"]["defers_to_licensed_practice_note_included"] = False
        self.assertEqual(evaluate(m)["verdict"], "EXPLAINER_CONTENT_SOUND")

    def test_rendering_invalid_kind_fails(self):
        m = copy.deepcopy(COMPLETE); m["renderings"][0]["rendering_kind"] = "podcast"
        v = evaluate(m)
        self.assertEqual(check_status(v, "every_technical_explainer_rendering_kind_recognised"), "fail")
        self.assertEqual(v["technical_explainer_renderings_with_invalid_kind"], ["ren-1"])

    def test_rendering_not_derived_fails(self):
        m = copy.deepcopy(COMPLETE); m["renderings"][1]["derived_from_canonical_source"] = False
        v = evaluate(m)
        self.assertEqual(check_status(v, "every_technical_explainer_rendering_derived_from_canonical_source"), "fail")
        self.assertEqual(v["technical_explainer_renderings_not_derived_from_canonical"], ["ren-2"])

    def test_invented_numbers_fail_red_lines(self):
        m = copy.deepcopy(COMPLETE); m["red_lines"]["invented_numbers_or_figures_present"] = True
        v = evaluate(m)
        self.assertEqual(v["sections"]["red_lines"], "fail")
        self.assertEqual(v["verdict"], "EXPLAINER_CONTENT_NOT_SOUND")

    def test_unlicensed_practice_fails_red_lines(self):
        m = copy.deepcopy(COMPLETE); m["red_lines"]["unlicensed_practice_encouraged_present"] = True
        self.assertEqual(check_status(evaluate(m), "technical_explainer_free_of_unlicensed_practice_encouragement"), "fail")

    def test_absent_evidence_is_insufficient_not_failed(self):
        m = copy.deepcopy(COMPLETE); del m["simplification"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["simplification_and_analogy_integrity"], "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertTrue(all(c["status"] == "missing" for c in v["checks"]))
        self.assertIsNone(v["computed_status"])
        self.assertIsNone(v["technical_explainer_accuracy_sources_count"])
        self.assertIsNone(v["spine_stage_coverage_ratio"])

    def test_absent_objectives_list_is_missing(self):
        m = copy.deepcopy(COMPLETE); del m["learning_objectives"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(check_status(v, "technical_explainer_learning_objectives_list_declared"), "missing")
        self.assertIsNone(v["computed_status"])

    def test_empty_sources_list_fails(self):
        m = copy.deepcopy(COMPLETE); m["sources"] = []
        v = evaluate(m)
        self.assertEqual(check_status(v, "technical_explainer_accuracy_sources_list_declared"), "fail")
        self.assertEqual(v["technical_explainer_accuracy_sources_count"], 0)

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertIn("VERDICT: EXPLAINER_CONTENT_SOUND", stamp(v))

    def test_non_object_manifest_rejected(self):
        with self.assertRaises(TypeError):
            evaluate(["not", "a", "manifest"])


class MalformedTypeTests(unittest.TestCase):
    def test_string_field_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE); m["explainer_title"] = 12345
        with self.assertRaises(TypeError) as ctx: evaluate(m)
        self.assertIn("explainer_title", str(ctx.exception))

    def test_object_section_as_string_rejected(self):
        with self.assertRaises(TypeError) as ctx: evaluate({"audience": "x"})
        self.assertIn("audience", str(ctx.exception))

    def test_list_field_as_object_rejected(self):
        with self.assertRaises(TypeError) as ctx: evaluate({"sources": {"source_id": "src-1"}})
        self.assertIn("sources", str(ctx.exception))

    def test_list_entry_as_string_rejected(self):
        with self.assertRaises(TypeError) as ctx: evaluate({"learning_objectives": ["obj-1"]})
        self.assertIn("learning_objectives[0]", str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE); m["simplification"]["jargon_defined_on_first_use"] = "yes"
        with self.assertRaises(TypeError) as ctx: evaluate(m)
        self.assertIn("simplification.jargon_defined_on_first_use", str(ctx.exception))

    def test_nested_list_entry_bool_field_rejected(self):
        m = copy.deepcopy(COMPLETE); m["sources"][0]["archived"] = "true"
        with self.assertRaises(TypeError) as ctx: evaluate(m)
        self.assertIn("sources[0].archived", str(ctx.exception))

    def test_null_section_rejected(self):
        m = copy.deepcopy(COMPLETE); m["safety"] = None
        with self.assertRaises(TypeError) as ctx: evaluate(m)
        self.assertIn("safety", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
