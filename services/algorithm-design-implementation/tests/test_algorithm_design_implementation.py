import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from algorithm_design_implementation import evaluate, stamp  # noqa: E402

SOUND = {
    "problem": "leaderboard that updates constantly",
    "decomposition": {"inputs_stated": True,
                      "outputs_stated": True,
                      "constraints_stated": True,
                      "invariant_stated": True,
                      "pseudocode_sketched": True,
                      "input_scale_stated": True,
                      "max_input_size": 1000000},
    "complexity": {"time_big_o_stated": True,
                   "space_big_o_stated": True,
                   "dominant_term_identified": True,
                   "bottleneck_identified": True,
                   "tradeoffs_named": True,
                   "time_complexity": "O(n log n)"},
    "design": {"key_operation_identified": True,
               "key_operation": "top_k_or_priority",
               "chosen_structure": "heap",
               "structure_forces_quadratic": False,
               "pattern": "greedy",
               "greedy_safety_proven": True},
    "correctness": {"invariant_reasoned": True,
                    "termination_reasoned": True,
                    "edge_cases": {"empty": True,
                                   "single_element": True,
                                   "duplicates": True,
                                   "boundaries": True,
                                   "integer_overflow": True},
                    "edges_and_properties_tested": True},
    "verification": {"correctness_critical": True,
                     "method": "property_based_testing"},
    "optimization": {"correctness_established_first": True,
                     "profiled_before_optimizing": True,
                     "optimized_before_measuring": False},
}


def check_status(verdict, name):
    return next(c["status"] for c in verdict["checks"]
                if c["check"] == name)


class VerdictTests(unittest.TestCase):
    def test_sound_manifest_is_design_sound(self):
        v = evaluate(copy.deepcopy(SOUND))
        self.assertEqual(v["verdict"], "DESIGN_SOUND")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(v["design_status"],
                         "sound_on_declared_evidence")
        self.assertEqual(v["scale_status"],
                         "no_fatal_scale_combination_declared")
        self.assertEqual(len(v["checks"]), 31)

    def test_quadratic_at_fatal_scale_fails(self):
        m = copy.deepcopy(SOUND)
        m["decomposition"]["max_input_size"] = 10000000
        m["complexity"]["time_complexity"] = "O(n^2)"
        v = evaluate(m)
        self.assertEqual(v["verdict"], "DESIGN_UNSOUND")
        self.assertEqual(v["sections"]["complexity_reasoning"], "fail")
        self.assertEqual(v["scale_status"],
                         "fatal_scale_combination_declared")
        self.assertEqual(v["design_status"],
                         "not_sound_on_declared_evidence")

    def test_quadratic_above_fatal_scale_fails(self):
        m = copy.deepcopy(SOUND)
        m["decomposition"]["max_input_size"] = 50000000
        m["complexity"]["time_complexity"] = "O(n^2)"
        self.assertEqual(evaluate(m)["verdict"], "DESIGN_UNSOUND")

    def test_quadratic_just_below_fatal_scale_passes(self):
        m = copy.deepcopy(SOUND)
        m["decomposition"]["max_input_size"] = 9999999
        m["complexity"]["time_complexity"] = "O(n^2)"
        v = evaluate(m)
        self.assertEqual(v["verdict"], "DESIGN_SOUND")
        self.assertEqual(v["scale_status"],
                         "no_fatal_scale_combination_declared")

    def test_quadratic_at_small_scale_passes(self):
        m = copy.deepcopy(SOUND)
        m["decomposition"]["max_input_size"] = 100
        m["complexity"]["time_complexity"] = "O(n^2)"
        self.assertEqual(evaluate(m)["verdict"], "DESIGN_SOUND")

    def test_non_quadratic_at_fatal_scale_passes(self):
        m = copy.deepcopy(SOUND)
        m["decomposition"]["max_input_size"] = 10000000
        self.assertEqual(evaluate(m)["verdict"], "DESIGN_SOUND")

    def test_fractional_size_just_below_fatal_scale_passes(self):
        m = copy.deepcopy(SOUND)
        m["decomposition"]["max_input_size"] = 9999999.5
        m["complexity"]["time_complexity"] = "O(n^2)"
        self.assertEqual(evaluate(m)["verdict"], "DESIGN_SOUND")

    def test_non_numeric_max_input_size_is_missing(self):
        # Corrected under the F1 ruling: previously expected a
        # verdict over a wrong-typed documented field (the F1
        # defect). A non-numeric size is now rejected with
        # ValueError naming the field.
        m = copy.deepcopy(SOUND)
        m["decomposition"]["max_input_size"] = "ten million"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("decomposition.max_input_size", str(ctx.exception))

    def test_missing_time_complexity_is_missing(self):
        m = copy.deepcopy(SOUND)
        del m["complexity"]["time_complexity"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertIsNone(v["scale_status"])

    def test_all_skill_mappings_pass(self):
        for operation, structure in (
                ("lookup", "hash_map"),
                ("top_k_or_priority", "heap"),
                ("ordered_range", "bst_or_btree"),
                ("prefix", "trie"),
                ("connectivity", "union_find"),
                ("sliding_window", "deque"),
                ("range_queries", "prefix_sums")):
            m = copy.deepcopy(SOUND)
            m["design"]["key_operation"] = operation
            m["design"]["chosen_structure"] = structure
            v = evaluate(m)
            self.assertEqual(
                check_status(v, "structure_matches_skill_mapping"),
                "pass", operation)
            self.assertEqual(v["verdict"], "DESIGN_SOUND", operation)

    def test_wrong_structure_for_operation_fails(self):
        m = copy.deepcopy(SOUND)
        m["design"]["key_operation"] = "lookup"
        m["design"]["chosen_structure"] = "heap"
        v = evaluate(m)
        self.assertEqual(v["verdict"], "DESIGN_UNSOUND")
        self.assertEqual(v["sections"]["data_structure_choice"], "fail")
        self.assertEqual(v["design_status"],
                         "not_sound_on_declared_evidence")

    def test_unknown_operation_fails(self):
        m = copy.deepcopy(SOUND)
        m["design"]["key_operation"] = "fuzzy_search"
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "structure_matches_skill_mapping"), "fail")
        self.assertEqual(v["verdict"], "DESIGN_UNSOUND")

    def test_unknown_structure_fails(self):
        m = copy.deepcopy(SOUND)
        m["design"]["chosen_structure"] = "quantum_array"
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "structure_matches_skill_mapping"), "fail")

    def test_missing_structure_is_missing_not_failed(self):
        m = copy.deepcopy(SOUND)
        del m["design"]["chosen_structure"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "structure_matches_skill_mapping"),
            "missing")

    def test_structure_forcing_quadratic_fails(self):
        m = copy.deepcopy(SOUND)
        m["design"]["structure_forces_quadratic"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "DESIGN_UNSOUND")
        self.assertEqual(v["sections"]["data_structure_choice"], "fail")

    def test_all_toolbox_patterns_pass_toolbox_check(self):
        for pattern in ("two_pointers", "sliding_window",
                        "binary_search", "binary_search_on_answer",
                        "divide_and_conquer", "greedy",
                        "dynamic_programming", "graph_traversal",
                        "hashing"):
            m = copy.deepcopy(SOUND)
            m["design"]["pattern"] = pattern
            if pattern == "dynamic_programming":
                m["design"]["dp_state_defined"] = True
                m["design"]["dp_transition_defined"] = True
                m["design"]["dp_base_case_defined"] = True
            if pattern == "graph_traversal":
                m["design"]["graph_traversal_variant_named"] = True
            v = evaluate(m)
            self.assertEqual(
                check_status(v, "pattern_in_skill_toolbox"),
                "pass", pattern)
            self.assertEqual(v["verdict"], "DESIGN_SOUND", pattern)

    def test_unknown_pattern_fails(self):
        m = copy.deepcopy(SOUND)
        m["design"]["pattern"] = "quantum_annealing"
        v = evaluate(m)
        self.assertEqual(v["verdict"], "DESIGN_UNSOUND")
        self.assertEqual(v["design_status"],
                         "not_sound_on_declared_evidence")

    def test_greedy_without_safety_proof_fails(self):
        m = copy.deepcopy(SOUND)
        m["design"]["greedy_safety_proven"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "DESIGN_UNSOUND")
        self.assertEqual(v["sections"]["pattern_application"], "fail")

    def test_greedy_proof_absent_is_missing(self):
        m = copy.deepcopy(SOUND)
        del m["design"]["greedy_safety_proven"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "greedy_safety_proven_when_greedy"),
            "missing")

    def test_non_greedy_pattern_needs_no_proof(self):
        m = copy.deepcopy(SOUND)
        m["design"]["pattern"] = "hashing"
        del m["design"]["greedy_safety_proven"]
        self.assertEqual(evaluate(m)["verdict"], "DESIGN_SOUND")

    def test_dp_without_base_case_fails(self):
        m = copy.deepcopy(SOUND)
        m["design"]["pattern"] = "dynamic_programming"
        m["design"]["dp_state_defined"] = True
        m["design"]["dp_transition_defined"] = True
        m["design"]["dp_base_case_defined"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "DESIGN_UNSOUND")
        self.assertEqual(
            check_status(v, "dp_definition_complete_when_dp"), "fail")

    def test_dp_with_absent_definition_is_missing(self):
        m = copy.deepcopy(SOUND)
        m["design"]["pattern"] = "dynamic_programming"
        m["design"]["dp_state_defined"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "dp_definition_complete_when_dp"),
            "missing")

    def test_graph_traversal_without_variant_is_missing(self):
        m = copy.deepcopy(SOUND)
        m["design"]["pattern"] = "graph_traversal"
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(
                v, "graph_traversal_variant_named_when_graph"),
            "missing")

    def test_graph_traversal_variant_false_fails(self):
        m = copy.deepcopy(SOUND)
        m["design"]["pattern"] = "graph_traversal"
        m["design"]["graph_traversal_variant_named"] = False
        self.assertEqual(evaluate(m)["verdict"], "DESIGN_UNSOUND")

    def test_each_edge_case_unhandled_fails(self):
        for edge in ("empty", "single_element", "duplicates",
                     "boundaries", "integer_overflow"):
            m = copy.deepcopy(SOUND)
            m["correctness"]["edge_cases"][edge] = False
            v = evaluate(m)
            self.assertEqual(v["verdict"], "DESIGN_UNSOUND", edge)
            self.assertEqual(
                v["sections"]["correctness_and_edges"], "fail", edge)

    def test_missing_edge_case_is_insufficient(self):
        m = copy.deepcopy(SOUND)
        del m["correctness"]["edge_cases"]["duplicates"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["correctness_and_edges"],
                         "insufficient_evidence")

    def test_edges_not_tested_fails(self):
        m = copy.deepcopy(SOUND)
        m["correctness"]["edges_and_properties_tested"] = False
        self.assertEqual(evaluate(m)["verdict"], "DESIGN_UNSOUND")

    def test_termination_not_reasoned_fails(self):
        m = copy.deepcopy(SOUND)
        m["correctness"]["termination_reasoned"] = False
        self.assertEqual(evaluate(m)["verdict"], "DESIGN_UNSOUND")

    def test_critical_without_method_is_missing(self):
        m = copy.deepcopy(SOUND)
        del m["verification"]["method"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(
                v, "verification_method_declared_when_critical"),
            "missing")

    def test_critical_with_unknown_method_fails(self):
        m = copy.deepcopy(SOUND)
        m["verification"]["method"] = "code_review_only"
        v = evaluate(m)
        self.assertEqual(v["verdict"], "DESIGN_UNSOUND")
        self.assertEqual(
            v["sections"]["verification_and_optimization"], "fail")

    def test_all_verification_methods_pass_when_critical(self):
        for method in ("invariant_proof", "property_based_testing",
                       "formal_or_cryptographic_certificate"):
            m = copy.deepcopy(SOUND)
            m["verification"]["method"] = method
            self.assertEqual(evaluate(m)["verdict"], "DESIGN_SOUND",
                             method)

    def test_not_critical_needs_no_method(self):
        m = copy.deepcopy(SOUND)
        m["verification"]["correctness_critical"] = False
        del m["verification"]["method"]
        self.assertEqual(evaluate(m)["verdict"], "DESIGN_SOUND")

    def test_missing_critical_gate_is_missing(self):
        m = copy.deepcopy(SOUND)
        del m["verification"]["correctness_critical"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(
                v, "verification_method_declared_when_critical"),
            "missing")

    def test_optimized_before_measuring_fails_red_line(self):
        m = copy.deepcopy(SOUND)
        m["optimization"]["optimized_before_measuring"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "DESIGN_UNSOUND")
        self.assertEqual(
            v["sections"]["verification_and_optimization"], "fail")

    def test_not_profiled_before_optimizing_fails(self):
        m = copy.deepcopy(SOUND)
        m["optimization"]["profiled_before_optimizing"] = False
        self.assertEqual(evaluate(m)["verdict"], "DESIGN_UNSOUND")

    def test_correctness_not_established_first_fails(self):
        m = copy.deepcopy(SOUND)
        m["optimization"]["correctness_established_first"] = False
        self.assertEqual(evaluate(m)["verdict"], "DESIGN_UNSOUND")

    def test_decomposition_failure_fails_its_section(self):
        m = copy.deepcopy(SOUND)
        m["decomposition"]["invariant_stated"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "DESIGN_UNSOUND")
        self.assertEqual(v["sections"]["decomposition"], "fail")

    def test_tradeoffs_not_named_fails(self):
        m = copy.deepcopy(SOUND)
        m["complexity"]["tradeoffs_named"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "DESIGN_UNSOUND")
        self.assertEqual(v["sections"]["complexity_reasoning"], "fail")

    def test_absent_section_is_insufficient_not_failed(self):
        m = copy.deepcopy(SOUND)
        del m["correctness"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["correctness_and_edges"],
                         "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertIsNone(v["design_status"])
        self.assertIsNone(v["scale_status"])

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(SOUND))
        self.assertIn("VERDICT: DESIGN_SOUND", stamp(v))

    def test_non_object_manifest_rejected(self):
        with self.assertRaises(TypeError):
            evaluate(["not", "a", "manifest"])


class MalformedTypeTests(unittest.TestCase):
    """F1 regression (external verification Wave 1): a documented
    field present with the wrong JSON type is rejected with
    ValueError naming the field — never evaluated into a verdict."""

    def test_top_level_string_field_as_number_rejected(self):
        m = copy.deepcopy(SOUND)
        m["problem"] = 12345
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("problem", str(ctx.exception))

    def test_section_as_string_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"decomposition": "should-be-an-object"})
        self.assertIn("decomposition", str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(SOUND)
        m["decomposition"]["inputs_stated"] = "yes"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("decomposition.inputs_stated", str(ctx.exception))

    def test_numeric_leaf_as_string_rejected(self):
        m = copy.deepcopy(SOUND)
        m["decomposition"]["max_input_size"] = "ten million"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("decomposition.max_input_size", str(ctx.exception))

    def test_nested_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(SOUND)
        m["correctness"]["edge_cases"]["empty"] = "yes"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("correctness.edge_cases.empty", str(ctx.exception))

    def test_null_section_rejected(self):
        m = copy.deepcopy(SOUND)
        m["design"] = None
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("design", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
