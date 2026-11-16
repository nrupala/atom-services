import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from cpp_engineering_review import evaluate, stamp  # noqa: E402

COMPLETE = {
    "subject": "widget.cpp diff, RAII modernization",
    "raii": {"resources_owned_by_objects": True,
             "destructors_clean_up_resources": True,
             "manual_new_delete_in_new_code": False,
             "raw_owning_pointers_in_new_code": False,
             "forbidden_constructs": []},
    "value_semantics": {
        "values_const_references_preferred": True,
        "move_semantics_used_where_copies_expensive": True,
        "rule_of_zero_honored": True,
        "special_members_justified_when_present": True},
    "smart_pointers": {"unique_ptr_is_default": True,
                       "shared_ptr_only_for_real_shared_ownership": True,
                       "weak_ptr_used_to_break_cycles": True},
    "stl": {"algorithms_preferred_over_hand_loops": True,
            "containers_matched_to_access_patterns": True,
            "ranges_used_where_available": True,
            "templates_used_only_for_real_genericity": True,
            "template_error_messages_readable": True},
    "exceptions_and_abi": {
        "exceptions_policy_chosen": True,
        "exceptions_policy_documented": True,
        "exceptions_policy_applied_consistently": True,
        "stable_library_interfaces": True,
        "pimpl_used_where_needed": True,
        "symbols_versioned": True},
    "tooling": {"clang_tidy_run": True,
                "clang_tidy_clean_on_diff": True,
                "clang_format_applied": True,
                "warnings_treated_as_errors": True,
                "warning_count": 0},
    "sanitizers": {"asan_enabled_in_test_builds": True,
                   "ubsan_enabled_in_test_builds": True,
                   "tsan_enabled_in_test_builds": True,
                   "sanitizer_clean_test_run": True},
    "safety": {"dangling_references_across_async_boundaries": False,
               "macros_used_where_language_features_exist": False},
}


def check_status(v, name):
    return next(c["status"] for c in v["checks"] if c["check"] == name)


class VerdictTests(unittest.TestCase):
    def test_complete_manifest_is_review_sound(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(v["verdict"], "REVIEW_SOUND")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(v["computed_status"],
                         "within_stated_limits_on_declared_evidence")
        self.assertEqual(len(v["checks"]), 34)
        self.assertEqual(v["warning_count"], 0)
        self.assertEqual(v["forbidden_constructs_found"], [])

    def test_warnings_present_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["tooling"]["warning_count"] = 3
        v = evaluate(m)
        self.assertEqual(v["verdict"], "REVIEW_DEFICIENT")
        self.assertEqual(v["sections"]["tooling_and_warnings"], "fail")
        self.assertEqual(check_status(v, "zero_warnings_maintained"),
                         "fail")
        self.assertEqual(v["warning_count"], 3)
        self.assertEqual(v["computed_status"],
                         "outside_stated_limits_on_declared_evidence")

    def test_negative_warning_count_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["tooling"]["warning_count"] = -1
        self.assertEqual(evaluate(m)["verdict"], "REVIEW_DEFICIENT")

    def test_missing_warning_count_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["tooling"]["warning_count"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(check_status(v, "zero_warnings_maintained"),
                         "missing")
        self.assertIsNone(v["computed_status"])
        self.assertIsNone(v["warning_count"])

    def test_warnings_not_treated_as_errors_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["tooling"]["warnings_treated_as_errors"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "REVIEW_DEFICIENT")
        self.assertEqual(v["sections"]["tooling_and_warnings"], "fail")

    def test_forbidden_construct_present_fails_quality_gate(self):
        m = copy.deepcopy(COMPLETE)
        m["raii"]["forbidden_constructs"] = ["manual_new"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "REVIEW_DEFICIENT")
        self.assertEqual(v["sections"]["raii_and_ownership"], "fail")
        self.assertEqual(
            check_status(v, "no_forbidden_constructs_present"), "fail")
        self.assertEqual(v["forbidden_constructs_found"], ["manual_new"])
        self.assertEqual(v["computed_status"],
                         "outside_stated_limits_on_declared_evidence")

    def test_forbidden_found_reported_in_skill_order(self):
        m = copy.deepcopy(COMPLETE)
        m["raii"]["forbidden_constructs"] = [
            "manual_delete", "raw_owning_pointer", "manual_new"]
        v = evaluate(m)
        self.assertEqual(v["forbidden_constructs_found"],
                         ["raw_owning_pointer", "manual_new",
                          "manual_delete"])

    def test_unknown_constructs_do_not_count_as_forbidden(self):
        m = copy.deepcopy(COMPLETE)
        m["raii"]["forbidden_constructs"] = ["new_expression_in_test",
                                             "placement_new"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "REVIEW_SOUND")
        self.assertEqual(v["forbidden_constructs_found"], [])

    def test_missing_forbidden_list_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["raii"]["forbidden_constructs"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertIsNone(v["forbidden_constructs_found"])
        self.assertIsNone(v["computed_status"])

    def test_manual_new_delete_flag_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["raii"]["manual_new_delete_in_new_code"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "REVIEW_DEFICIENT")
        self.assertEqual(v["sections"]["raii_and_ownership"], "fail")

    def test_raw_owning_pointers_flag_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["raii"]["raw_owning_pointers_in_new_code"] = True
        self.assertEqual(evaluate(m)["verdict"], "REVIEW_DEFICIENT")

    def test_resources_not_owned_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["raii"]["resources_owned_by_objects"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "REVIEW_DEFICIENT")
        self.assertEqual(v["sections"]["raii_and_ownership"], "fail")

    def test_rule_of_zero_not_honored_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["value_semantics"]["rule_of_zero_honored"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "REVIEW_DEFICIENT")
        self.assertEqual(v["sections"]["value_semantics"], "fail")
        self.assertEqual(check_status(v, "rule_of_zero_honored"), "fail")

    def test_unjustified_special_members_fail(self):
        m = copy.deepcopy(COMPLETE)
        m["value_semantics"][
            "special_members_justified_when_present"] = False
        self.assertEqual(evaluate(m)["verdict"], "REVIEW_DEFICIENT")

    def test_shared_ptr_without_shared_ownership_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["smart_pointers"][
            "shared_ptr_only_for_real_shared_ownership"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "REVIEW_DEFICIENT")
        self.assertEqual(v["sections"]["smart_pointers"], "fail")

    def test_unique_ptr_not_default_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["smart_pointers"]["unique_ptr_is_default"] = False
        self.assertEqual(evaluate(m)["verdict"], "REVIEW_DEFICIENT")

    def test_hand_loops_over_algorithms_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["stl"]["algorithms_preferred_over_hand_loops"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "REVIEW_DEFICIENT")
        self.assertEqual(v["sections"]["stl_and_templates"], "fail")

    def test_vanity_templates_fail(self):
        m = copy.deepcopy(COMPLETE)
        m["stl"]["templates_used_only_for_real_genericity"] = False
        self.assertEqual(evaluate(m)["verdict"], "REVIEW_DEFICIENT")

    def test_exceptions_policy_not_documented_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["exceptions_and_abi"]["exceptions_policy_documented"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "REVIEW_DEFICIENT")
        self.assertEqual(v["sections"]["exceptions_and_abi"], "fail")

    def test_unversioned_symbols_fail(self):
        m = copy.deepcopy(COMPLETE)
        m["exceptions_and_abi"]["symbols_versioned"] = False
        self.assertEqual(evaluate(m)["verdict"], "REVIEW_DEFICIENT")

    def test_clang_tidy_not_clean_fails_quality_gate(self):
        m = copy.deepcopy(COMPLETE)
        m["tooling"]["clang_tidy_clean_on_diff"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "REVIEW_DEFICIENT")
        self.assertEqual(v["sections"]["tooling_and_warnings"], "fail")

    def test_sanitizers_not_clean_fails_quality_gate(self):
        m = copy.deepcopy(COMPLETE)
        m["sanitizers"]["sanitizer_clean_test_run"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "REVIEW_DEFICIENT")
        self.assertEqual(v["sections"]["sanitizers"], "fail")

    def test_tsan_not_enabled_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["sanitizers"]["tsan_enabled_in_test_builds"] = False
        self.assertEqual(evaluate(m)["verdict"], "REVIEW_DEFICIENT")

    def test_dangling_references_fail_red_line(self):
        m = copy.deepcopy(COMPLETE)
        m["safety"][
            "dangling_references_across_async_boundaries"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "REVIEW_DEFICIENT")
        self.assertEqual(v["sections"]["safety_red_lines"], "fail")
        self.assertEqual(
            check_status(
                v, "no_dangling_references_across_async_boundaries"),
            "fail")

    def test_macros_fail_red_line(self):
        m = copy.deepcopy(COMPLETE)
        m["safety"]["macros_used_where_language_features_exist"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "REVIEW_DEFICIENT")
        self.assertEqual(v["sections"]["safety_red_lines"], "fail")

    def test_absent_section_is_insufficient_not_failed(self):
        m = copy.deepcopy(COMPLETE)
        del m["sanitizers"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["sanitizers"],
                         "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertIsNone(v["computed_status"])
        self.assertIsNone(v["warning_count"])
        self.assertIsNone(v["forbidden_constructs_found"])

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertIn("VERDICT: REVIEW_SOUND", stamp(v))

    def test_non_object_manifest_rejected(self):
        with self.assertRaises(TypeError):
            evaluate(["not", "a", "manifest"])


class MalformedTypeTests(unittest.TestCase):
    """F1 regression (external verification Wave 1): a documented
    field present with the wrong JSON type is rejected with
    ValueError naming the field — never evaluated into a verdict."""

    def test_top_level_string_field_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["subject"] = 12345
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("subject", str(ctx.exception))

    def test_section_as_string_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"raii": "should-be-an-object"})
        self.assertIn("raii", str(ctx.exception))

    def test_list_field_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["raii"]["forbidden_constructs"] = "manual_new"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("raii.forbidden_constructs", str(ctx.exception))

    def test_list_entry_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["raii"]["forbidden_constructs"] = ["manual_new", 42]
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("raii.forbidden_constructs[1]",
                      str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["raii"]["resources_owned_by_objects"] = "yes"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("raii.resources_owned_by_objects",
                      str(ctx.exception))

    def test_numeric_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["tooling"]["warning_count"] = "zero"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("tooling.warning_count", str(ctx.exception))

    def test_numeric_leaf_as_boolean_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["tooling"]["warning_count"] = True
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("tooling.warning_count", str(ctx.exception))

    def test_null_section_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["safety"] = None
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("safety", str(ctx.exception))

    def test_nested_boolean_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["exceptions_and_abi"]["symbols_versioned"] = 1
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("exceptions_and_abi.symbols_versioned",
                      str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
