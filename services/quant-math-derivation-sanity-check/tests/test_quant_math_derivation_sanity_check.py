import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from quant_math_derivation_sanity_check import evaluate, stamp  # noqa: E402

COMPLETE = {
    "derivation_title": "weighted-mean-of-two-blocks",
    "derivation": {"goal_quantity_stated": True,
                   "givens_defined_before_use": True,
                   "shown_step_by_step": True,
                   "final_result_value": 2.0,
                   "final_result_unit": "1"},
    "steps": [
        {"step_id": "step-1", "operation": "add",
         "operand_a": 1.5, "operand_b": 2.5, "declared_result": 4.0,
         "operand_a_unit": "units", "operand_b_unit": "units",
         "declared_result_unit": "units"},
        {"step_id": "step-2", "operation": "multiply",
         "operand_a": 4.0, "operand_b": 0.25, "declared_result": 1.0,
         "operand_a_unit": "units", "operand_b_unit": "1",
         "declared_result_unit": "units"},
        {"step_id": "step-3", "operation": "divide",
         "operand_a": 1.0, "operand_b": 0.5, "declared_result": 2.0,
         "operand_a_unit": "units", "operand_b_unit": "units",
         "declared_result_unit": "1"},
    ],
    "dimensions": {"dimensions_checked": True,
                   "units_checked": True,
                   "unit_conversions_shown_where_needed": True},
    "assumptions": {"assumptions_listed": True,
                    "normality_checked_where_assumed": True,
                    "independence_checked_where_assumed": True,
                    "stationarity_checked_where_assumed": True,
                    "failure_modes_named": True,
                    "domain_restrictions_stated": True},
    "method": {"method_named": True,
               "simplest_method_that_fits_chosen": True,
               "method_choice_justified_from_problem_structure": True,
               "small_numerical_example_verified": True},
    "red_lines": {"black_box_trust_without_derivation_present": False,
                  "assumptions_ignored_present": False,
                  "correlation_presented_as_causation_present": False,
                  "p_hacking_present": False,
                  "overfitting_present": False},
}


def check_status(v, name):
    return next(c["status"] for c in v["checks"] if c["check"] == name)


class VerdictTests(unittest.TestCase):
    def test_complete_manifest_is_sound(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(v["verdict"], "DERIVATION_SOUND")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(len(v["checks"]), 30)
        self.assertEqual(v["computed_status"],
                         "within_stated_limits_on_declared_evidence")
        self.assertEqual(v["derivation_steps_count"], 3)
        self.assertEqual(v["duplicate_derivation_step_ids"], [])
        self.assertEqual(v["derivation_steps_with_arithmetic_mismatch"],
                         [])
        self.assertEqual(v["derivation_steps_with_unit_mismatch"], [])
        self.assertEqual(v["derivation_steps_missing_units"], [])
        self.assertEqual(v["arithmetic_match_ratio"], "1.000000")
        self.assertEqual(v["unit_match_ratio"], "1.000000")

    def test_goal_not_stated_fails_structure(self):
        m = copy.deepcopy(COMPLETE)
        m["derivation"]["goal_quantity_stated"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "DERIVATION_NOT_SOUND")
        self.assertEqual(v["sections"]["derivation_structure"], "fail")
        self.assertEqual(
            check_status(v, "derivation_goal_quantity_stated"), "fail")

    def test_final_value_mismatch_fails_and_is_computed(self):
        m = copy.deepcopy(COMPLETE)
        m["derivation"]["final_result_value"] = 2.5
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v, "derivation_final_result_value_matches_last_step"),
            "fail")
        self.assertEqual(v["computed_status"],
                         "outside_stated_limits_on_declared_evidence")

    def test_final_unit_mismatch_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["derivation"]["final_result_unit"] = "units"
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v, "derivation_final_result_unit_matches_last_step"),
            "fail")

    def test_absent_final_value_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["derivation"]["final_result_value"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(
                v, "derivation_final_result_value_matches_last_step"),
            "missing")

    def test_arithmetic_mismatch_fails_and_step_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["steps"][0]["declared_result"] = 4.5
        v = evaluate(m)
        self.assertEqual(v["verdict"], "DERIVATION_NOT_SOUND")
        self.assertEqual(
            check_status(
                v, "every_derivation_step_arithmetic_recomputes"),
            "fail")
        self.assertEqual(v["derivation_steps_with_arithmetic_mismatch"],
                         ["step-1"])
        self.assertEqual(v["arithmetic_match_ratio"], "0.666667")

    def test_arithmetic_within_6dp_serialization_passes(self):
        m = copy.deepcopy(COMPLETE)
        m["steps"][0]["operand_a"] = 0.1
        m["steps"][0]["operand_b"] = 0.2
        m["steps"][0]["declared_result"] = 0.3
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v, "every_derivation_step_arithmetic_recomputes"),
            "pass")

    def test_divide_by_zero_fails_both_arithmetic_checks(self):
        m = copy.deepcopy(COMPLETE)
        m["steps"][2]["operand_b"] = 0.0
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "no_derivation_step_divides_by_zero"),
            "fail")
        self.assertEqual(
            check_status(
                v, "every_derivation_step_arithmetic_recomputes"),
            "fail")
        self.assertEqual(v["derivation_steps_with_arithmetic_mismatch"],
                         ["step-3"])

    def test_unknown_operation_fails_recognition_and_arithmetic(self):
        m = copy.deepcopy(COMPLETE)
        m["steps"][1]["operation"] = "power"
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v, "every_derivation_step_operation_recognised"),
            "fail")
        self.assertEqual(
            check_status(
                v, "every_derivation_step_arithmetic_recomputes"),
            "fail")

    def test_duplicate_step_id_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["steps"][2]["step_id"] = "step-1"
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_derivation_step_id_unique"), "fail")
        self.assertEqual(v["duplicate_derivation_step_ids"], ["step-1"])

    def test_step_missing_operand_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["steps"][1]["operand_b"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(
                v, "every_derivation_step_arithmetic_recomputes"),
            "missing")

    def test_absent_steps_list_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["steps"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "derivation_steps_list_declared"), "missing")
        self.assertIsNone(v["computed_status"])
        self.assertIsNone(v["derivation_steps_count"])
        self.assertIsNone(v["duplicate_derivation_step_ids"])
        self.assertIsNone(v["derivation_steps_with_arithmetic_mismatch"])
        self.assertIsNone(v["derivation_steps_with_unit_mismatch"])
        self.assertIsNone(v["derivation_steps_missing_units"])
        self.assertIsNone(v["arithmetic_match_ratio"])
        self.assertIsNone(v["unit_match_ratio"])

    def test_empty_steps_list_fails_steps_declared(self):
        m = copy.deepcopy(COMPLETE)
        m["steps"] = []
        v = evaluate(m)
        self.assertEqual(v["verdict"], "DERIVATION_NOT_SOUND")
        self.assertEqual(
            check_status(v, "derivation_steps_list_declared"), "fail")
        self.assertEqual(v["derivation_steps_count"], 0)
        self.assertIsNone(v["arithmetic_match_ratio"])
        self.assertIsNone(v["unit_match_ratio"])

    def test_additive_unit_mismatch_fails_and_step_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["steps"][0]["operand_b_unit"] = "seconds"
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v,
                "every_derivation_step_result_unit_follows_unit_algebra"),
            "fail")
        self.assertEqual(v["derivation_steps_with_unit_mismatch"],
                         ["step-1"])
        self.assertEqual(v["unit_match_ratio"], "0.666667")

    def test_multiply_unit_algebra_product_form(self):
        m = copy.deepcopy(COMPLETE)
        m["steps"][1]["operand_b_unit"] = "per-unit"
        m["steps"][1]["declared_result_unit"] = "units*per-unit"
        v = evaluate(m)
        # step-2's own algebra holds in product form
        # ("units" * "per-unit" -> "units*per-unit"); the unit
        # algebra is per-step only, so nothing else changes.
        self.assertEqual(
            check_status(
                v,
                "every_derivation_step_result_unit_follows_unit_algebra"),
            "pass")
        self.assertEqual(v["derivation_steps_with_unit_mismatch"], [])
        self.assertEqual(v["verdict"], "DERIVATION_SOUND")

    def test_step_missing_unit_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["steps"][0]["operand_b_unit"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(
                v, "every_derivation_step_declares_all_units"),
            "missing")
        self.assertEqual(v["derivation_steps_missing_units"], ["step-1"])

    def test_step_empty_unit_fails_declares_all_units(self):
        m = copy.deepcopy(COMPLETE)
        m["steps"][0]["operand_b_unit"] = ""
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v, "every_derivation_step_declares_all_units"), "fail")
        self.assertEqual(v["derivation_steps_missing_units"], ["step-1"])

    def test_dimensions_not_checked_fails_section3(self):
        m = copy.deepcopy(COMPLETE)
        m["dimensions"]["dimensions_checked"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "DERIVATION_NOT_SOUND")
        self.assertEqual(v["sections"]["dimensions_and_units"], "fail")

    def test_normality_unchecked_fails_section4(self):
        m = copy.deepcopy(COMPLETE)
        m["assumptions"]["normality_checked_where_assumed"] = False
        v = evaluate(m)
        self.assertEqual(
            v["sections"]["assumptions_and_failure_modes"], "fail")
        self.assertEqual(
            check_status(
                v, "derivation_normality_checked_where_assumed"),
            "fail")

    def test_failure_modes_unnamed_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["assumptions"]["failure_modes_named"] = False
        self.assertEqual(
            check_status(evaluate(m), "derivation_failure_modes_named"),
            "fail")

    def test_no_numerical_example_fails_section5(self):
        m = copy.deepcopy(COMPLETE)
        m["method"]["small_numerical_example_verified"] = False
        v = evaluate(m)
        self.assertEqual(
            v["sections"]["method_choice_and_verification"], "fail")
        self.assertEqual(
            check_status(
                v, "derivation_verified_with_small_numerical_example"),
            "fail")

    def test_complex_method_without_justification_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["method"]["simplest_method_that_fits_chosen"] = False
        self.assertEqual(
            check_status(
                evaluate(m), "derivation_simplest_fitting_method_chosen"),
            "fail")

    def test_black_box_trust_fails_red_lines(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"]["black_box_trust_without_derivation_present"] = True
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "derivation_free_of_black_box_trust"), "fail")
        self.assertEqual(v["sections"]["red_lines"], "fail")
        self.assertEqual(v["verdict"], "DERIVATION_NOT_SOUND")

    def test_correlation_as_causation_fails_red_lines(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"]["correlation_presented_as_causation_present"] = True
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v, "derivation_free_of_correlation_as_causation"),
            "fail")

    def test_p_hacking_fails_red_lines(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"]["p_hacking_present"] = True
        self.assertEqual(
            check_status(evaluate(m), "derivation_free_of_p_hacking"),
            "fail")

    def test_absent_evidence_is_insufficient_not_failed(self):
        m = copy.deepcopy(COMPLETE)
        del m["assumptions"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["assumptions_and_failure_modes"],
                         "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertTrue(
            all(c["status"] == "missing" for c in v["checks"]))
        self.assertIsNone(v["computed_status"])
        self.assertIsNone(v["derivation_steps_count"])
        self.assertIsNone(v["duplicate_derivation_step_ids"])
        self.assertIsNone(v["derivation_steps_with_arithmetic_mismatch"])
        self.assertIsNone(v["derivation_steps_with_unit_mismatch"])
        self.assertIsNone(v["derivation_steps_missing_units"])
        self.assertIsNone(v["arithmetic_match_ratio"])
        self.assertIsNone(v["unit_match_ratio"])

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertIn("VERDICT: DERIVATION_SOUND", stamp(v))

    def test_non_object_manifest_rejected(self):
        with self.assertRaises(TypeError):
            evaluate(["not", "a", "manifest"])


class MalformedTypeTests(unittest.TestCase):
    def test_string_field_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["derivation_title"] = 12345
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("derivation_title", str(ctx.exception))

    def test_object_section_as_string_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"derivation": "should-be-an-object"})
        self.assertIn("derivation", str(ctx.exception))

    def test_list_field_as_object_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"steps": {"step_id": "step-1"}})
        self.assertIn("steps", str(ctx.exception))

    def test_list_entry_as_string_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"steps": ["step-1"]})
        self.assertIn("steps[0]", str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["assumptions"]["failure_modes_named"] = "yes"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("assumptions.failure_modes_named",
                      str(ctx.exception))

    def test_number_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["derivation"]["final_result_value"] = "2.0"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("derivation.final_result_value",
                      str(ctx.exception))

    def test_number_leaf_as_boolean_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["steps"][0]["operand_a"] = True
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("steps[0].operand_a", str(ctx.exception))

    def test_nested_list_entry_string_field_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["steps"][1]["operation"] = 42
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("steps[1].operation", str(ctx.exception))

    def test_null_section_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["dimensions"] = None
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("dimensions", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
