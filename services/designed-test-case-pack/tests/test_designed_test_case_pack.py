import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from designed_test_case_pack import evaluate, stamp  # noqa: E402

COMPLETE = {
    "pack": "checkout-feature",
    "requirements": [
        {"id": "REQ-1"},
        {"id": "REQ-2"},
    ],
    "cases": [
        {"id": "TC-1", "requirement_ids": ["REQ-1"],
         "level": "system", "preconditions_declared": True,
         "steps_declared": True,
         "expected_result": "order is confirmed",
         "expected_result_written_before_execution": True,
         "covers_boundary": True, "covers_negative": False},
        {"id": "TC-2", "requirement_ids": ["REQ-2"],
         "level": "system", "preconditions_declared": True,
         "steps_declared": True,
         "expected_result": "invalid quantity is rejected",
         "expected_result_written_before_execution": True,
         "covers_boundary": False, "covers_negative": True},
    ],
    "technique_application": {
        "equivalence_partitioning_applied": True,
        "equivalence_representative_and_edges_per_class": True,
        "boundary_value_analysis_applied": True,
        "boundary_just_below_at_and_above_covered": True,
        "decision_tables_applicable": True,
        "decision_table_rules_covered_including_awkward": True,
        "stateful_behaviour_present": True,
        "state_transitions_allowed_forbidden_and_interrupts_tested": True,
        "many_config_axes_present": True,
        "pairwise_pair_coverage_used": True},
    "negative_and_error_guessing": {
        "negative_cases_designed": True,
        "invalid_inputs_covered": True,
        "wrong_order_retries_and_partial_failure_covered": True},
    "risk_selection": {
        "risk_based_selection_applied": True,
        "cases_ranked_by_damage_and_likelihood": True,
        "highest_risk_cases_selected_first": True,
        "not_tested_stated_explicitly": True},
    "coverage": {
        "coverage_gaps_stated_explicitly": True,
        "duplicate_path_suites_present": False,
        "happy_path_only_suite_present": False,
        "cases_written_before_execution": True},
}


def check_status(v, name):
    return next(c["status"] for c in v["checks"] if c["check"] == name)


class VerdictTests(unittest.TestCase):
    def test_complete_manifest_is_sound(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(v["verdict"], "TEST_CASE_PACK_SOUND")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(len(v["checks"]), 30)
        self.assertEqual(v["computed_status"],
                         "within_stated_limits_on_declared_evidence")
        self.assertEqual(v["requirements_count"], 2)
        self.assertEqual(v["cases_count"], 2)
        self.assertEqual(v["untraced_requirements"], [])
        self.assertEqual(v["requirement_trace_coverage"], "1.0000")
        self.assertEqual(v["cases_without_expected_result"], [])
        self.assertEqual(v["expected_result_coverage"], "1.0000")
        self.assertEqual(v["cases_without_traceability"], [])
        self.assertEqual(v["duplicate_case_ids"], [])

    def test_untraced_requirement_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["cases"][1]["requirement_ids"] = ["REQ-1"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "TEST_CASE_PACK_NOT_SOUND")
        self.assertEqual(v["sections"]["traceability_and_case_format"],
                         "fail")
        self.assertEqual(
            check_status(
                v, "every_requirement_traced_to_at_least_one_case"),
            "fail")
        self.assertEqual(v["untraced_requirements"], ["REQ-2"])
        self.assertEqual(v["requirement_trace_coverage"], "0.5000")
        self.assertEqual(v["computed_status"],
                         "outside_stated_limits_on_declared_evidence")

    def test_case_tracing_to_undeclared_requirement_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["cases"][0]["requirement_ids"] = ["REQ-99"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "TEST_CASE_PACK_NOT_SOUND")
        self.assertEqual(
            check_status(
                v, "every_case_traces_to_at_least_one_requirement"),
            "fail")
        self.assertEqual(v["cases_without_traceability"], ["TC-1"])

    def test_case_missing_requirement_ids_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["cases"][0]["requirement_ids"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(
                v, "every_case_traces_to_at_least_one_requirement"),
            "missing")
        self.assertEqual(v["cases_without_traceability"], [])

    def test_case_without_expected_result_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["cases"][1]["expected_result"] = ""
        v = evaluate(m)
        self.assertEqual(v["verdict"], "TEST_CASE_PACK_NOT_SOUND")
        self.assertEqual(
            check_status(v, "every_case_has_expected_result"), "fail")
        self.assertEqual(v["cases_without_expected_result"], ["TC-2"])
        self.assertEqual(v["expected_result_coverage"], "0.5000")

    def test_case_missing_expected_result_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["cases"][0]["expected_result"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "every_case_has_expected_result"),
            "missing")
        self.assertEqual(v["cases_without_expected_result"], ["TC-1"])

    def test_duplicate_case_id_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["cases"][1]["id"] = "TC-1"
        v = evaluate(m)
        self.assertEqual(v["verdict"], "TEST_CASE_PACK_NOT_SOUND")
        self.assertEqual(
            check_status(v, "every_case_has_unique_nonempty_id"),
            "fail")
        self.assertEqual(v["duplicate_case_ids"], ["TC-1"])

    def test_empty_cases_list_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["cases"] = []
        v = evaluate(m)
        self.assertEqual(check_status(v, "cases_declared"), "fail")
        self.assertEqual(v["cases_count"], 0)
        self.assertIsNone(v["expected_result_coverage"])

    def test_empty_requirements_list_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["requirements"] = []
        v = evaluate(m)
        self.assertEqual(check_status(v, "requirements_declared"),
                         "fail")
        self.assertEqual(v["requirements_count"], 0)
        self.assertIsNone(v["requirement_trace_coverage"])

    def test_case_without_level_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["cases"][0]["level"] = ""
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_case_declares_level"), "fail")

    def test_case_without_preconditions_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["cases"][0]["preconditions_declared"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_case_declares_preconditions"),
            "fail")

    def test_case_without_steps_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["cases"][1]["steps_declared"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_case_declares_steps"), "fail")

    def test_expected_result_not_written_before_execution_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["cases"][0][
            "expected_result_written_before_execution"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "TEST_CASE_PACK_NOT_SOUND")
        self.assertEqual(
            check_status(
                v,
                "every_case_expected_result_written_before_execution"),
            "fail")

    def test_no_boundary_case_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["cases"][0]["covers_boundary"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "TEST_CASE_PACK_NOT_SOUND")
        self.assertEqual(
            check_status(v, "at_least_one_boundary_case_declared"),
            "fail")

    def test_no_negative_case_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["cases"][1]["covers_negative"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "TEST_CASE_PACK_NOT_SOUND")
        self.assertEqual(
            check_status(v, "at_least_one_negative_case_declared"),
            "fail")

    def test_equivalence_partitioning_not_applied_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["technique_application"][
            "equivalence_partitioning_applied"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "TEST_CASE_PACK_NOT_SOUND")
        self.assertEqual(v["sections"]["technique_coverage"], "fail")

    def test_decision_table_rules_missing_when_applicable(self):
        m = copy.deepcopy(COMPLETE)
        del m["technique_application"][
            "decision_table_rules_covered_including_awkward"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(
                v, "decision_table_rules_covered_when_applicable"),
            "missing")

    def test_decision_tables_not_applicable_passes_as_na(self):
        m = copy.deepcopy(COMPLETE)
        m["technique_application"]["decision_tables_applicable"] = False
        del m["technique_application"][
            "decision_table_rules_covered_including_awkward"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "TEST_CASE_PACK_SOUND")
        self.assertEqual(
            check_status(
                v, "decision_table_rules_covered_when_applicable"),
            "pass")

    def test_state_transitions_not_tested_when_stateful_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["technique_application"][
            "state_transitions_allowed_forbidden_and_interrupts_tested"
        ] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "TEST_CASE_PACK_NOT_SOUND")
        self.assertEqual(
            check_status(v, "state_transitions_tested_when_stateful"),
            "fail")

    def test_no_stateful_behaviour_passes_state_check_as_na(self):
        m = copy.deepcopy(COMPLETE)
        m["technique_application"]["stateful_behaviour_present"] = False
        del m["technique_application"][
            "state_transitions_allowed_forbidden_and_interrupts_tested"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "TEST_CASE_PACK_SOUND")

    def test_pairwise_not_used_when_many_axes_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["technique_application"]["pairwise_pair_coverage_used"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "TEST_CASE_PACK_NOT_SOUND")
        self.assertEqual(
            check_status(
                v, "pairwise_coverage_used_when_many_config_axes"),
            "fail")

    def test_few_config_axes_passes_pairwise_check_as_na(self):
        m = copy.deepcopy(COMPLETE)
        m["technique_application"]["many_config_axes_present"] = False
        del m["technique_application"]["pairwise_pair_coverage_used"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "TEST_CASE_PACK_SOUND")

    def test_invalid_inputs_not_covered_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["negative_and_error_guessing"]["invalid_inputs_covered"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "TEST_CASE_PACK_NOT_SOUND")
        self.assertEqual(
            v["sections"]["negative_and_risk_selection"], "fail")

    def test_cases_not_ranked_by_risk_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["risk_selection"][
            "cases_ranked_by_damage_and_likelihood"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "TEST_CASE_PACK_NOT_SOUND")

    def test_not_tested_not_stated_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["risk_selection"]["not_tested_stated_explicitly"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "TEST_CASE_PACK_NOT_SOUND")

    def test_coverage_gaps_not_stated_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["coverage"]["coverage_gaps_stated_explicitly"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "TEST_CASE_PACK_NOT_SOUND")
        self.assertEqual(
            v["sections"]["coverage_gaps_and_suite_hygiene"], "fail")

    def test_duplicate_path_suites_present_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["coverage"]["duplicate_path_suites_present"] = True
        self.assertEqual(evaluate(m)["verdict"],
                         "TEST_CASE_PACK_NOT_SOUND")

    def test_happy_path_only_suite_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["coverage"]["happy_path_only_suite_present"] = True
        self.assertEqual(evaluate(m)["verdict"],
                         "TEST_CASE_PACK_NOT_SOUND")

    def test_absent_evidence_is_insufficient_not_failed(self):
        m = copy.deepcopy(COMPLETE)
        del m["coverage"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            v["sections"]["coverage_gaps_and_suite_hygiene"],
            "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertTrue(
            all(c["status"] == "missing" for c in v["checks"]))
        self.assertIsNone(v["computed_status"])
        self.assertIsNone(v["requirements_count"])
        self.assertIsNone(v["cases_count"])
        self.assertIsNone(v["untraced_requirements"])
        self.assertIsNone(v["requirement_trace_coverage"])
        self.assertIsNone(v["cases_without_expected_result"])
        self.assertIsNone(v["expected_result_coverage"])
        self.assertIsNone(v["cases_without_traceability"])
        self.assertIsNone(v["duplicate_case_ids"])

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertIn("VERDICT: TEST_CASE_PACK_SOUND", stamp(v))

    def test_non_object_manifest_rejected(self):
        with self.assertRaises(TypeError):
            evaluate(["not", "a", "manifest"])


class MalformedTypeTests(unittest.TestCase):
    """F1 regression: a documented field present with the wrong
    JSON type is rejected with ValueError naming the field."""

    def test_string_field_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["pack"] = 12345
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("pack", str(ctx.exception))

    def test_object_section_as_string_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"coverage": "should-be-an-object"})
        self.assertIn("coverage", str(ctx.exception))

    def test_list_field_as_object_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"cases": {"id": "TC-1"}})
        self.assertIn("cases", str(ctx.exception))

    def test_list_entry_as_string_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"cases": ["TC-1"]})
        self.assertIn("cases[0]", str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["coverage"]["coverage_gaps_stated_explicitly"] = "yes"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("coverage.coverage_gaps_stated_explicitly",
                      str(ctx.exception))

    def test_nested_list_entry_string_field_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["cases"][1]["expected_result"] = 42
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("cases[1].expected_result", str(ctx.exception))

    def test_nested_list_entry_boolean_field_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["cases"][0]["covers_boundary"] = "yes"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("cases[0].covers_boundary", str(ctx.exception))

    def test_requirement_ids_entry_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["cases"][0]["requirement_ids"] = [123]
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("cases[0].requirement_ids[0]",
                      str(ctx.exception))

    def test_requirement_ids_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["cases"][0]["requirement_ids"] = "REQ-1"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("cases[0].requirement_ids", str(ctx.exception))

    def test_requirement_entry_field_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["requirements"][0]["id"] = True
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("requirements[0].id", str(ctx.exception))

    def test_null_section_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["coverage"] = None
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("coverage", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
